from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct, text
from src.setup.database import get_db
from src.setup.dependencies import CurrentUser
from src.models.core import FacultyProfile, Declaration, AppraisalReview, AppraisalConfig, ModuleConfig
from src.models.non_teaching import NonTeachingAppraisal
from src.setup.local_auth import get_password_hash
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from pathlib import Path
from dotenv import dotenv_values, set_key
from datetime import datetime, timezone
from collections import defaultdict
import csv
import io
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])

# Keys the admin UI is allowed to read and write.
# DATABASE_URL, JWT_SECRET_KEY, and SUPABASE_* are intentionally excluded.
EDITABLE_ENV_KEYS = frozenset({
    "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM", "MAIL_PORT",
    "MAIL_SERVER", "MAIL_TLS", "MAIL_SSL",
    "APP_URL", "FRONTEND_URL", "ALLOW_MOCK_USER",
    "USE_LOCAL_STORAGE", "GCP_STORAGE_BUCKET",
    # Feature flags
    "MAINTENANCE_MODE", "ALLOW_REGISTRATIONS", "EMAIL_NOTIFICATIONS",
    "DEBUG_LOGGING", "TWO_FACTOR_AUTH", "SESSION_TIMEOUT", "AUDIT_LOGGING",
})

VALID_ROLES = frozenset({
    "faculty", "non_teaching_staff", "staff", "hod", "reporting_officer",
    "section_head", "director", "center_head", "dean", "registrar", "vc", "admin",
})


def _check_admin(current_user):
    if "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin role required")


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@router.get("/stats")
async def get_stats(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    academic_year: Optional[str] = Query(None),
):
    _check_admin(current_user)

    # Collect distinct years from both teaching and non-teaching tables
    t_years = await db.execute(
        select(distinct(Declaration.academic_year)).order_by(Declaration.academic_year.desc())
    )
    nt_years = await db.execute(
        select(distinct(NonTeachingAppraisal.academic_year)).order_by(NonTeachingAppraisal.academic_year.desc())
    )
    available_years = sorted(
        set([r[0] for r in t_years.all()] + [r[0] for r in nt_years.all()]),
        reverse=True,
    )

    if not academic_year:
        academic_year = available_years[0] if available_years else None

    # Registered users by role and school
    role_res = await db.execute(
        select(FacultyProfile.appraisal_role, func.count(FacultyProfile.id))
        .group_by(FacultyProfile.appraisal_role)
    )
    by_role = {row[0]: row[1] for row in role_res.all()}

    school_res = await db.execute(
        select(FacultyProfile.school, func.count(FacultyProfile.id))
        .group_by(FacultyProfile.school)
    )
    by_school_registered = {row[0]: row[1] for row in school_res.all()}

    teaching_pipeline: dict = {}
    by_school_submitted: dict = {}
    by_department_submitted: dict = {}
    non_teaching_pipeline: dict = {}

    if academic_year:
        # Teaching submission pipeline for the selected year
        pipe_res = await db.execute(
            select(Declaration.status, func.count(Declaration.id))
            .where(Declaration.academic_year == academic_year)
            .group_by(Declaration.status)
        )
        teaching_pipeline = {row[0]: row[1] for row in pipe_res.all()}

        # Per-school breakdown for the selected year
        school_sub_res = await db.execute(
            select(FacultyProfile.school, Declaration.status, func.count(Declaration.id))
            .join(Declaration, FacultyProfile.email == Declaration.faculty_email)
            .where(Declaration.academic_year == academic_year)
            .group_by(FacultyProfile.school, Declaration.status)
        )
        for school, status, count in school_sub_res.all():
            by_school_submitted.setdefault(school, {})[status] = count

        # Department breakdown for the selected year
        dept_sub_res = await db.execute(
            select(FacultyProfile.department, Declaration.status, func.count(Declaration.id))
            .join(Declaration, FacultyProfile.email == Declaration.faculty_email)
            .where(Declaration.academic_year == academic_year)
            .group_by(FacultyProfile.department, Declaration.status)
        )
        for dept, status, count in dept_sub_res.all():
            by_department_submitted.setdefault(dept or "Unknown", {})[status] = count

        # Non-teaching pipeline for the selected year
        nt_pipe_res = await db.execute(
            select(NonTeachingAppraisal.status, func.count(NonTeachingAppraisal.id))
            .where(NonTeachingAppraisal.academic_year == academic_year)
            .group_by(NonTeachingAppraisal.status)
        )
        non_teaching_pipeline = {row[0]: row[1] for row in nt_pipe_res.all()}

    return {
        "academic_year": academic_year,
        "available_years": available_years,
        "total_registered": sum(by_role.values()),
        "by_role": by_role,
        "by_school_registered": by_school_registered,
        "teaching_submission_pipeline": teaching_pipeline,
        "by_school_submitted": by_school_submitted,
        "by_department_submitted": by_department_submitted,
        "non_teaching_pipeline": non_teaching_pipeline,
    }


# ---------------------------------------------------------------------------
# Env config
# ---------------------------------------------------------------------------

@router.get("/config")
async def get_config(current_user: CurrentUser):
    _check_admin(current_user)
    env_path = Path(".env")
    if not env_path.exists():
        return {}
    values = dotenv_values(env_path)
    return {k: v for k, v in values.items() if k in EDITABLE_ENV_KEYS}


@router.put("/config")
async def update_config(current_user: CurrentUser, data: dict):
    _check_admin(current_user)
    invalid = set(data.keys()) - EDITABLE_ENV_KEYS
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"These keys are not editable via the admin panel: {sorted(invalid)}",
        )

    env_path = Path(".env")
    if not env_path.exists():
        env_path.touch()

    for key, value in data.items():
        set_key(str(env_path), key, str(value))
        os.environ[key] = str(value)  # apply in-process immediately

    return {
        "message": "Config updated. Changes to email/URL settings take effect immediately. Storage and auth settings require a server restart.",
        "updated": list(data.keys()),
    }


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------

class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    appraisal_role: str = "faculty"
    school: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    employee_id: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    teaching_experience: Optional[str] = None
    is_verified: bool = True  # admin-created accounts skip email verification


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    appraisal_role: Optional[str] = None
    school: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    employee_id: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    teaching_experience: Optional[str] = None
    is_verified: Optional[bool] = None
    password: Optional[str] = None  # if set, resets the user's password


@router.get("/users")
async def list_users(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    school: Optional[str] = None,
    role: Optional[str] = None,
    search: Optional[str] = None,
):
    _check_admin(current_user)
    query = select(FacultyProfile).order_by(FacultyProfile.school, FacultyProfile.full_name)
    if school:
        query = query.where(FacultyProfile.school == school)
    if role:
        query = query.where(FacultyProfile.appraisal_role == role)
    if search:
        term = f"%{search}%"
        query = query.where(
            FacultyProfile.email.ilike(term) | FacultyProfile.full_name.ilike(term)
        )

    result = await db.execute(query)
    users = result.scalars().all()
    return [
        {
            "email": u.email,
            "full_name": u.full_name,
            "appraisal_role": u.appraisal_role,
            "school": u.school,
            "department": u.department,
            "designation": u.designation,
            "employee_id": u.employee_id,
            "phone": u.phone,
            "qualification": u.qualification,
            "teaching_experience": u.teaching_experience,
            "is_verified": u.is_verified,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.post("/users", status_code=201)
async def create_user(
    current_user: CurrentUser,
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)

    if data.appraisal_role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{data.appraisal_role}'. Valid roles: {sorted(VALID_ROLES)}",
        )

    existing = await db.execute(select(FacultyProfile).where(FacultyProfile.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = FacultyProfile(
        email=data.email,
        password_hash=get_password_hash(data.password),
        full_name=data.full_name,
        appraisal_role=data.appraisal_role,
        school=data.school,
        department=data.department,
        designation=data.designation,
        employee_id=data.employee_id,
        phone=data.phone,
        qualification=data.qualification,
        teaching_experience=data.teaching_experience,
        is_verified=data.is_verified,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"message": "User created", "email": user.email, "role": user.appraisal_role}


@router.put("/users/{email}")
async def update_user(
    email: str,
    current_user: CurrentUser,
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)

    if data.appraisal_role is not None and data.appraisal_role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{data.appraisal_role}'. Valid roles: {sorted(VALID_ROLES)}",
        )

    result = await db.execute(select(FacultyProfile).where(FacultyProfile.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = data.model_dump(exclude_none=True)
    if "password" in updates:
        user.password_hash = get_password_hash(updates.pop("password"))
    for field, value in updates.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return {"message": "User updated", "email": user.email, "role": user.appraisal_role}


@router.delete("/users/{email}")
async def delete_user(
    email: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)

    result = await db.execute(select(FacultyProfile).where(FacultyProfile.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete all appraisal data linked to this user before removing the profile.
    # Teaching tables keyed by faculty_email
    for table in [
        "declarations",
        "teaching_process",
        "course_files",
        "innovative_teaching",
        "projects_guided",
        "qualification_enhancement",
        "student_feedback",
        "department_activities",
        "university_activities",
        "social_contributions",
        "industry_connect",
        "acr_scores",
        "journal_publications",
        "popular_writings",
        "book_publications",
        "ict_pedagogy",
        "research_guidance",
        "research_projects",
        "external_research_projects",
        "ipr_records",
        "patents",
        "awards",
        "conferences",
        "research_proposals",
        "products_developed",
        "self_development",
        "industrial_training",
        "appraisal_documents",
        "appraisal_reviews",
        "appraisal_snapshots",
    ]:
        await db.execute(
            text(f"DELETE FROM {table} WHERE faculty_email = :email"),
            {"email": email},
        )

    # Non-teaching tables keyed by staff_email (child tables first)
    for table in ["non_teaching_part_a_items", "non_teaching_part_b_ratings", "non_teaching_appraisals"]:
        await db.execute(
            text(f"DELETE FROM {table} WHERE staff_email = :email"),
            {"email": email},
        )

    # Password reset tokens keyed by email
    await db.execute(
        text("DELETE FROM password_reset_tokens WHERE email = :email"),
        {"email": email},
    )

    await db.delete(user)
    await db.commit()
    return {"message": f"User {email} deleted"}


# ---------------------------------------------------------------------------
# Pending faculty (have not submitted for a given year)
# ---------------------------------------------------------------------------

@router.get("/pending-faculty")
async def get_pending_faculty(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    academic_year: str = Query(..., description="e.g. 2025-26"),
    school: Optional[str] = None,
):
    _check_admin(current_user)

    submitted_emails_res = await db.execute(
        select(Declaration.faculty_email)
        .where(Declaration.academic_year == academic_year)
    )
    submitted_emails = {row[0] for row in submitted_emails_res.all()}

    query = (
        select(FacultyProfile)
        .where(
            FacultyProfile.appraisal_role.in_(["faculty", "hod", "director", "dean"]),
            FacultyProfile.email.notin_(submitted_emails),
        )
        .order_by(FacultyProfile.school, FacultyProfile.full_name)
    )
    if school:
        query = query.where(FacultyProfile.school == school)

    result = await db.execute(query)
    users = result.scalars().all()
    return [
        {
            "email": u.email,
            "full_name": u.full_name,
            "appraisal_role": u.appraisal_role,
            "school": u.school,
            "department": u.department,
        }
        for u in users
    ]


# ---------------------------------------------------------------------------
# Appraisal cycle / config
# ---------------------------------------------------------------------------

class AppraisalConfigCreate(BaseModel):
    academic_year: str
    is_open: bool = False
    submission_start: Optional[datetime] = None
    submission_end: Optional[datetime] = None


class AppraisalConfigUpdate(BaseModel):
    is_open: Optional[bool] = None
    submission_start: Optional[datetime] = None
    submission_end: Optional[datetime] = None


@router.get("/appraisal-config")
async def list_appraisal_configs(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(
        select(AppraisalConfig).order_by(AppraisalConfig.academic_year.desc())
    )
    configs = result.scalars().all()
    return [
        {
            "id": c.id,
            "academic_year": c.academic_year,
            "is_open": c.is_open,
            "submission_start": c.submission_start,
            "submission_end": c.submission_end,
            "updated_at": c.updated_at,
        }
        for c in configs
    ]


@router.post("/appraisal-config", status_code=201)
async def create_appraisal_config(
    current_user: CurrentUser,
    data: AppraisalConfigCreate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    existing = await db.execute(
        select(AppraisalConfig).where(AppraisalConfig.academic_year == data.academic_year)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Config for '{data.academic_year}' already exists")

    config = AppraisalConfig(**data.model_dump())
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return {"message": "Appraisal config created", "academic_year": config.academic_year, "is_open": config.is_open}


@router.put("/appraisal-config/{academic_year}")
async def update_appraisal_config(
    academic_year: str,
    current_user: CurrentUser,
    data: AppraisalConfigUpdate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(
        select(AppraisalConfig).where(AppraisalConfig.academic_year == academic_year)
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail=f"No config found for '{academic_year}'")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(config, field, value)

    await db.commit()
    await db.refresh(config)
    return {"message": "Config updated", "academic_year": config.academic_year, "is_open": config.is_open}


@router.delete("/appraisal-config/{academic_year}")
async def delete_appraisal_config(
    academic_year: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(
        select(AppraisalConfig).where(AppraisalConfig.academic_year == academic_year)
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail=f"No config found for '{academic_year}'")

    await db.delete(config)
    await db.commit()
    return {"message": f"Config for '{academic_year}' deleted"}


# ---------------------------------------------------------------------------
# Analytics exports
# ---------------------------------------------------------------------------

TEACHING_ROLES = frozenset({"faculty", "hod", "director", "dean", "center_head"})


def _csv_response(rows: list[dict], fieldnames: list[str], filename: str) -> StreamingResponse:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/submissions")
async def export_submissions(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    academic_year: Optional[str] = Query(None),
    school: Optional[str] = Query(None),
):
    _check_admin(current_user)

    if not academic_year:
        years_res = await db.execute(
            select(distinct(Declaration.academic_year)).order_by(Declaration.academic_year.desc())
        )
        years = [r[0] for r in years_res.all()]
        academic_year = years[0] if years else None

    if not academic_year:
        raise HTTPException(status_code=404, detail="No submission data found")

    query = (
        select(FacultyProfile, Declaration)
        .join(Declaration, FacultyProfile.email == Declaration.faculty_email)
        .where(Declaration.academic_year == academic_year)
        .order_by(FacultyProfile.school, FacultyProfile.full_name)
    )
    if school:
        query = query.where(FacultyProfile.school == school)

    result = await db.execute(query)
    rows = [
        {
            "faculty_email": u.email,
            "full_name": u.full_name,
            "school": u.school or "",
            "department": u.department or "",
            "appraisal_role": u.appraisal_role,
            "designation": u.designation or "",
            "academic_year": d.academic_year,
            "status": d.status,
            "submitted_at": d.submitted_at.isoformat() if d.submitted_at else "",
            "part_a_total": float(d.part_a_total),
            "part_b_total": float(d.part_b_total),
            "grand_total": float(d.grand_total),
        }
        for u, d in result.all()
    ]

    if not rows:
        raise HTTPException(status_code=404, detail=f"No submissions found for {academic_year}")

    filename = f"submissions-{academic_year}.csv"
    fields = ["faculty_email", "full_name", "school", "department", "appraisal_role",
              "designation", "academic_year", "status", "submitted_at",
              "part_a_total", "part_b_total", "grand_total"]
    return _csv_response(rows, fields, filename)


@router.get("/export/faculty")
async def export_faculty(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    school: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
):
    _check_admin(current_user)

    query = select(FacultyProfile).order_by(FacultyProfile.school, FacultyProfile.full_name)
    if school:
        query = query.where(FacultyProfile.school == school)
    if role:
        query = query.where(FacultyProfile.appraisal_role == role)

    result = await db.execute(query)
    rows = [
        {
            "email": u.email,
            "full_name": u.full_name,
            "appraisal_role": u.appraisal_role,
            "school": u.school or "",
            "department": u.department or "",
            "designation": u.designation or "",
            "phone": u.phone or "",
            "qualification": u.qualification or "",
            "teaching_experience": u.teaching_experience or "",
            "employee_id": u.employee_id or "",
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat() if u.created_at else "",
        }
        for u in result.scalars().all()
    ]

    fields = ["email", "full_name", "appraisal_role", "school", "department",
              "designation", "phone", "qualification", "teaching_experience",
              "employee_id", "is_verified", "created_at"]
    return _csv_response(rows, fields, "faculty-export.csv")


# ---------------------------------------------------------------------------
# Submission trends
# ---------------------------------------------------------------------------

@router.get("/trends")
async def get_trends(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    academic_year: Optional[str] = Query(None),
):
    _check_admin(current_user)

    if not academic_year:
        years_res = await db.execute(
            select(distinct(Declaration.academic_year)).order_by(Declaration.academic_year.desc())
        )
        years = [r[0] for r in years_res.all()]
        academic_year = years[0] if years else None

    if not academic_year:
        return {"academic_year": None, "monthly": []}

    # Total teaching staff registered (the denominator for "pending")
    total_res = await db.execute(
        select(func.count(FacultyProfile.id))
        .where(FacultyProfile.appraisal_role.in_(TEACHING_ROLES))
    )
    total_registered = total_res.scalar() or 0

    # All submissions for the year, with their submitted_at timestamp
    subs_res = await db.execute(
        select(Declaration.submitted_at)
        .where(Declaration.academic_year == academic_year)
        .order_by(Declaration.submitted_at)
    )
    submitted_ats = [row[0] for row in subs_res.all() if row[0]]

    # Group by "Mon YYYY" key, keep order
    month_counts: dict = defaultdict(int)
    month_order: list = []
    for ts in submitted_ats:
        key = ts.strftime("%b")
        if key not in month_counts:
            month_order.append(key)
        month_counts[key] += 1

    # Build cumulative monthly series
    monthly = []
    cumulative = 0
    for month in month_order:
        cumulative += month_counts[month]
        monthly.append({
            "month": month,
            "submitted": cumulative,
            "pending": max(total_registered - cumulative, 0),
        })

    return {"academic_year": academic_year, "monthly": monthly}


# ---------------------------------------------------------------------------
# Module config
# ---------------------------------------------------------------------------

class ModuleConfigUpdate(BaseModel):
    appraisal_module_enabled: Optional[bool] = None
    self_appraisal_enabled: Optional[bool] = None
    peer_review_enabled: Optional[bool] = None


@router.get("/module-config")
async def get_module_config(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(select(ModuleConfig).where(ModuleConfig.id == 1))
    config = result.scalar_one_or_none()
    if not config:
        # Create the default row on first access
        config = ModuleConfig(id=1)
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return {
        "appraisal_module_enabled": config.appraisal_module_enabled,
        "self_appraisal_enabled": config.self_appraisal_enabled,
        "peer_review_enabled": config.peer_review_enabled,
    }


@router.put("/module-config")
async def update_module_config(
    current_user: CurrentUser,
    data: ModuleConfigUpdate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(select(ModuleConfig).where(ModuleConfig.id == 1))
    config = result.scalar_one_or_none()
    if not config:
        config = ModuleConfig(id=1)
        db.add(config)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(config, field, value)

    await db.commit()
    return {"message": "Updated"}
