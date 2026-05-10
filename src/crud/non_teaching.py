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
