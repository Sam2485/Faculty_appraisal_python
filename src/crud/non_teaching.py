from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from src.models.non_teaching import NonTeachingAppraisal, NonTeachingPartAItem, NonTeachingPartBRating
from typing import List, Optional, Any
from uuid import UUID
import logging
import traceback

logger = logging.getLogger(__name__)

async def get_non_teaching_appraisal(db: AsyncSession, email: str, year: str) -> Optional[NonTeachingAppraisal]:
    result = await db.execute(select(NonTeachingAppraisal).where(
        NonTeachingAppraisal.staff_email == email,
        NonTeachingAppraisal.academic_year == year
    ))
    return result.scalar_one_or_none()

# Part A section definitions: key → (display title, max_marks)
# Keys match the flat payload fields the frontend sends under payload.*
_PART_A_SECTIONS = {
    "selfResp":    ("Current Responsibilities", 10),
    "selfContrib": ("Other Contributions",      10),
    "selfAchieve": ("Achievements",             10),
}

async def _shred_part_a(db: AsyncSession, email: str, year: str, payload: dict) -> None:
    """
    Reads selfResp / selfContrib / selfAchieve from the submission payload
    and upserts rows into non_teaching_part_a_items.
    Reviewer mark columns (ro_marks, registrar_marks, vc_marks) are never touched.
    """
    for item_key, (title, max_marks) in _PART_A_SECTIONS.items():
        section = payload.get(item_key)
        if not isinstance(section, dict):
            continue

        try:
            self_marks = float(section['marks']) if section.get('marks') is not None else None
        except (ValueError, TypeError):
            self_marks = None
        details = section.get('text')

        res = await db.execute(select(NonTeachingPartAItem).where(
            NonTeachingPartAItem.staff_email == email,
            NonTeachingPartAItem.academic_year == year,
            NonTeachingPartAItem.item_key == item_key
        ))
        existing = res.scalar_one_or_none()

        if existing:
            # Only update staff-owned fields — never overwrite reviewer marks
            existing.self_marks = self_marks
            existing.details = details
        else:
            db.add(NonTeachingPartAItem(
                staff_email=email,
                academic_year=year,
                item_key=item_key,
                title=title,
                max_marks=max_marks,
                details=details,
                self_marks=self_marks
            ))


async def create_or_update_non_teaching_appraisal(db: AsyncSession, data: dict) -> NonTeachingAppraisal:
    try:
        db_appr = await get_non_teaching_appraisal(db, data['staff_email'], data['academic_year'])
        if db_appr:
            for key, value in data.items():
                if hasattr(db_appr, key):
                    setattr(db_appr, key, value)
        else:
            # Filter data for only valid model fields
            valid_data = {k: v for k, v in data.items() if hasattr(NonTeachingAppraisal, k)}
            db_appr = NonTeachingAppraisal(**valid_data)
            db.add(db_appr)

        if data.get('payload'):
            await _shred_part_a(db, data['staff_email'], data['academic_year'], data['payload'])

        await db.commit()
        await db.refresh(db_appr)
        return db_appr
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in create_or_update_non_teaching_appraisal: {str(e)}")
        logger.error(traceback.format_exc())
        raise

# Maps reviewer role → (payload field suffix for Part A, db column for Part A)
_PART_A_REVIEWER_MAP = {
    "reporting_officer": ("roMarks",  "ro_marks"),
    "registrar":         ("regMarks", "registrar_marks"),
    "vc":                ("vcMarks",  "vc_marks"),
}

# Part B section definitions: key → (display title, parameter count)
# Parameter count is inferred from the frontend payload (p0..pN keys).
_PART_B_SECTIONS = {
    "profComp": ("Professional Competency",   5),
    "quality":  ("Quality of Work",           5),
    "personal": ("Personal Attributes",       6),
    "regular":  ("Regularity & Discipline",   5),
}

# Maps reviewer role → (payload key suffix for Part B, db column for Part B)
_PART_B_REVIEWER_MAP = {
    "reporting_officer": ("ro",  "ro_rating"),
    "registrar":         ("reg", "registrar_rating"),
    "vc":                ("vc",  "vc_rating"),
}


async def update_reviewer_marks(db: AsyncSession, email: str, year: str, payload: dict, role: str) -> None:
    """
    Called from the review endpoint after a reviewer submits.
    Writes Part A reviewer marks and Part B ratings into their normalized tables.
    Only the columns belonging to the current reviewer role are touched.
    """
    part_a_payload_field, part_a_db_col = _PART_A_REVIEWER_MAP.get(role, (None, None))
    part_b_suffix,        part_b_db_col = _PART_B_REVIEWER_MAP.get(role, (None, None))

    # --- Part A ---
    if part_a_payload_field and part_a_db_col:
        for item_key in _PART_A_SECTIONS:
            section = payload.get(item_key)
            if not isinstance(section, dict):
                continue
            raw = section.get(part_a_payload_field)
            try:
                marks = float(raw) if raw not in (None, "") else None
            except (ValueError, TypeError):
                marks = None

            res = await db.execute(select(NonTeachingPartAItem).where(
                NonTeachingPartAItem.staff_email == email,
                NonTeachingPartAItem.academic_year == year,
                NonTeachingPartAItem.item_key == item_key
            ))
            existing = res.scalar_one_or_none()
            if existing:
                setattr(existing, part_a_db_col, marks)

    # --- Part B ---
    if part_b_suffix and part_b_db_col:
        part_b_data = payload.get('partB') or payload.get('part_b') or {}
        if not isinstance(part_b_data, dict):
            return

        for section_key, (section_title, param_count) in _PART_B_SECTIONS.items():
            section = part_b_data.get(section_key)
            if not isinstance(section, dict):
                continue

            for param_no in range(param_count):
                field_key = f"p{param_no}_{part_b_suffix}"
                raw = section.get(field_key)
                try:
                    rating = float(raw) if raw not in (None, "") else None
                except (ValueError, TypeError):
                    rating = None

                res = await db.execute(select(NonTeachingPartBRating).where(
                    NonTeachingPartBRating.staff_email == email,
                    NonTeachingPartBRating.academic_year == year,
                    NonTeachingPartBRating.section_key == section_key,
                    NonTeachingPartBRating.parameter_no == param_no
                ))
                existing = res.scalar_one_or_none()
                if existing:
                    setattr(existing, part_b_db_col, rating)
                else:
                    db.add(NonTeachingPartBRating(
                        staff_email=email,
                        academic_year=year,
                        section_key=section_key,
                        section_title=section_title,
                        max_marks=5,
                        parameter_no=param_no,
                        parameter_label=f"Parameter {param_no + 1}",
                        **{part_b_db_col: rating}
                    ))


async def get_part_a_items(db: AsyncSession, email: str, year: str) -> List[NonTeachingPartAItem]:
    result = await db.execute(select(NonTeachingPartAItem).where(
        NonTeachingPartAItem.staff_email == email,
        NonTeachingPartAItem.academic_year == year
    ))
    return result.scalars().all()

async def get_part_b_ratings(db: AsyncSession, email: str, year: str) -> List[NonTeachingPartBRating]:
    result = await db.execute(select(NonTeachingPartBRating).where(
        NonTeachingPartBRating.staff_email == email,
        NonTeachingPartBRating.academic_year == year
    ).order_by(NonTeachingPartBRating.section_key, NonTeachingPartBRating.parameter_no))
    return result.scalars().all()
