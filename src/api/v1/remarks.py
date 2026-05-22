from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.setup.database import get_db
from src.setup.dependencies import CurrentUser
from src.models.core import AppraisalReview, Declaration, FacultyProfile
from src.crud.core import create_or_update_review
from src.schema.core import AppraisalReviewBase
from typing import Dict, Any
from sqlalchemy import select, update
from src.models import part_a as models_a
from src.models import part_b as models_b

router = APIRouter(prefix="/appraisal-remarks", tags=["Appraisal Remarks"])

# ── Rejection constants ──────────────────────────────────────────────────────

# Status values that indicate a reviewer has rejected the appraisal.
# Used by appraisal.py to decide whether editing/resubmission is allowed.
REJECTED_STATUSES = frozenset({
    "HOD Rejected",
    "Center Head Rejected",
    "Director Rejected",
    "Dean Rejected",
    "VC Rejected",
})

_ROLE_DISPLAY = {
    "hod":         "HOD",
    "center_head": "Center Head",
    "director":    "Director",
    "dean":        "Dean",
    "vc":          "VC",
}

# Maps a subject's appraisal_role → the set of reviewer roles that are their
# FIRST (immediate) superior when status == "Submitted".
_FIRST_REVIEWER_FOR_ROLE = {
    "faculty":      frozenset({"hod", "center_head"}),
    "hod":          frozenset({"director"}),
    "section_head": frozenset({"director", "center_head"}),
    "director":     frozenset({"dean"}),
    "dean":         frozenset({"vc"}),
    "center_head":  frozenset({"vc"}),
}

# Maps declaration status → the set of reviewer roles active at that step.
# Covers both generic "Submitted" fallback statuses and school-specific
# "Pending HOD Review" / "Pending Center Head Review" initial statuses.
_ACTIVE_REVIEWER_FOR_STATUS = {
    "Pending HOD Review":          frozenset({"hod"}),
    "Pending Center Head Review":  frozenset({"center_head"}),
    "Pending Director Review":     frozenset({"director"}),
    "Pending Dean Review":         frozenset({"dean"}),
    "Pending VC Review":           frozenset({"vc"}),
}

# Normal approval status transitions
_STATUS_MAP = {
    "hod":         "Pending Director Review",
    "center_head": "Pending VC Review",
    "director":    "Pending Dean Review",
    "dean":        "Pending VC Review",
    "vc":          "Reviewed",
}


def _is_immediate_superior(
    reviewer_role: str,
    subject_appraisal_role: str,
    current_status: str,
) -> bool:
    """
    Returns True only if reviewer_role is the active step in the workflow.
    Checks the status map first (covers all "Pending X Review" variants);
    falls back to subject-role lookup only for the generic "Submitted" status.
    """
    allowed = _ACTIVE_REVIEWER_FOR_STATUS.get(current_status)
    if allowed is not None:
        return reviewer_role in allowed
    if current_status == "Submitted":
        allowed = _FIRST_REVIEWER_FOR_ROLE.get(
            (subject_appraisal_role or "faculty").lower(), frozenset()
        )
        return reviewer_role in allowed
    return False


# ── Score extraction helper ──────────────────────────────────────────────────

def _extract_numeric_score(raw: Any, role: str) -> float:
    """
    Normalize section score from the frontend.
    Accepts a plain number, a numeric string, a list of row-dicts, or a single dict.
    """
    if isinstance(raw, (int, float)):
        return float(raw)
    if isinstance(raw, str):
        try:
            return float(raw)
        except (ValueError, TypeError):
            return 0.0
    if isinstance(raw, dict):
        val = raw.get(role) or raw.get('score') or 0
        try:
            return float(val)
        except (ValueError, TypeError):
            return 0.0
    if isinstance(raw, list):
        total = 0.0
        for item in raw:
            if isinstance(item, dict):
                val = item.get(role) or item.get('score') or 0
                try:
                    total += float(val)
                except (ValueError, TypeError):
                    pass
        return total
    return 0.0


async def update_item_scores(
    db: AsyncSession,
    email: str,
    year: str,
    role: str,
    section_scores: Dict[str, Any],
):
    """
    Writes per-section reviewer scores into the normalized Part A / B tables.
    """
    column_map = {
        "hod":         "hod_score",
        "center_head": "director_score",
        "director":    "director_score",
        "dean":        "dean_score",
        "vc":          "vc_score",
    }
    col = column_map.get(role)
    if not col:
        return

    section_map = {
        "lectures":        models_a.TeachingProcess,
        "courseFile":      models_a.CourseFile,
        "innovDetails":    models_a.InnovativeTeaching,
        "projects":        models_a.ProjectGuided,
        "quals":           models_a.QualificationEnhancement,
        "feedback":        models_a.StudentFeedback,
        "deptActs":        models_a.DepartmentActivity,
        "uniActs":         models_a.UniversityActivity,
        "society":         models_a.SocialContribution,
        "industry":        models_a.IndustryConnect,
        "acr":             models_a.ACRScore,
        "journals":        models_b.JournalPublication,
        "books":           models_b.BookPublication,
        "ict":             models_b.ICTPedagogy,
        "research":        models_b.ResearchGuidance,
        "projects2":       models_b.ResearchProject,
        "externalProjects":models_b.ExternalResearchProject,
        "patents":         models_b.Patent,
        "awards":          models_b.Award,
        "confs":           models_b.Conference,
        "proposals":       models_b.ResearchProposal,
        "products":        models_b.ProductDeveloped,
        "fdps":            models_b.SelfDevelopment,
        "training":        models_b.IndustrialTraining,
    }

    for section_key, raw_score in section_scores.items():
        model = section_map.get(section_key)
        if model and hasattr(model, col):
            numeric_score = _extract_numeric_score(raw_score, role)
            await db.execute(
                update(model)
                .where(model.faculty_email == email, model.academic_year == year)
                .values({col: numeric_score})
            )


# ── Core review handler ──────────────────────────────────────────────────────

async def handle_review(
    role: str,
    email: str,
    data: Dict[str, Any],
    current_user: CurrentUser,
    db: AsyncSession,
):
    # 0. Resolve target profile and check general authority
    target_res = await db.execute(
        select(FacultyProfile).where(FacultyProfile.email == email)
    )
    target = target_res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Faculty not found")

    if not current_user.has_authority_over(
        email, target.appraisal_role, target.department, target.school
    ):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update remarks for this faculty",
        )

    academic_year = data.get('academic_year')
    if not academic_year:
        raise HTTPException(status_code=422, detail="academic_year is required")

    # Fetch declaration once — used for both the VC-lock check and rejection logic
    decl_res = await db.execute(
        select(Declaration).where(
            Declaration.faculty_email == email,
            Declaration.academic_year == academic_year,
        )
    )
    decl = decl_res.scalar_one_or_none()

    # 1. Lock: once VC finalises, only VC may re-edit
    if role != "vc" and decl and decl.status == "Reviewed":
        raise HTTPException(
            status_code=403,
            detail="This appraisal has been finalised by the VC and can no longer be modified.",
        )

    # 2. Determine whether this is a rejection
    decision = (data.get('decision') or '').strip().lower()
    is_rejection = decision == 'rejected'

    if is_rejection:
        # Remarks are mandatory on rejection
        if not (data.get('remarks') or '').strip():
            raise HTTPException(
                status_code=422,
                detail="Remarks are mandatory when rejecting an appraisal.",
            )

        if not decl:
            raise HTTPException(
                status_code=400,
                detail="No submitted appraisal found for this faculty and year.",
            )

        # Prevent double-rejection
        if decl.status in REJECTED_STATUSES:
            raise HTTPException(
                status_code=409,
                detail="This appraisal has already been rejected and is awaiting resubmission.",
            )

        # Only the immediate superior may reject
        if not _is_immediate_superior(role, target.appraisal_role or "faculty", decl.status):
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Only the immediate superior may reject. "
                    f"Current workflow status is '{decl.status}'."
                ),
            )

    # 3. Save review record (scores + remarks)
    from sqlalchemy.orm.attributes import flag_modified
    review_in = AppraisalReviewBase(
        faculty_email=email,
        academic_year=academic_year,
        reviewer_email=current_user.email,
        reviewer_role=role,
        part_a_score=data.get('part_a_score', 0),
        part_b_score=data.get('part_b_score', 0),
        total_score=data.get('total_score', 0),
        remarks=data.get('remarks'),
        status='Rejected' if is_rejection else 'Reviewed',
    )
    db_review = await create_or_update_review(db, review_in)

    if data.get('section_scores'):
        db_review.section_scores = data['section_scores']
        flag_modified(db_review, 'section_scores')

    # 4. Write per-item scores into normalised tables
    if 'section_scores' in data:
        await update_item_scores(db, email, academic_year, role, data['section_scores'])

    # 5. Advance (or reject) the declaration status
    if decl:
        if is_rejection:
            decl.status = f"{_ROLE_DISPLAY[role]} Rejected"
        else:
            decl.status = _STATUS_MAP.get(role, decl.status)

    await db.commit()

    response = {
        "message": "Appraisal rejected" if is_rejection else "Review submitted",
        "status": decl.status if decl else "unknown",
        "decision": "rejected" if is_rejection else "approved",
    }
    if is_rejection:
        response["next_reviewer"] = None
        response["next_reviewer_role"] = None
    return response


# ── Route handlers ───────────────────────────────────────────────────────────

@router.put("/hod/{email}")
async def review_hod(
    email: str,
    data: Dict[str, Any],
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if "hod" not in current_user.roles and "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="HOD role required")
    return await handle_review("hod", email, data, current_user, db)


@router.put("/center-head/{email}")
async def review_center_head(
    email: str,
    data: Dict[str, Any],
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if "center_head" not in current_user.roles and "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Center Head role required")
    return await handle_review("center_head", email, data, current_user, db)


@router.put("/director/{email}")
async def review_director(
    email: str,
    data: Dict[str, Any],
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if "director" not in current_user.roles and "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Director role required")
    return await handle_review("director", email, data, current_user, db)


@router.put("/dean/{email}")
async def review_dean(
    email: str,
    data: Dict[str, Any],
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if "dean" not in current_user.roles and "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Dean role required")
    return await handle_review("dean", email, data, current_user, db)


@router.put("/final/{email}")
async def review_final(
    email: str,
    data: Dict[str, Any],
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if "vc" not in current_user.roles and "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="VC role required")
    return await handle_review("vc", email, data, current_user, db)
