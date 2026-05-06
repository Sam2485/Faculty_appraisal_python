from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from uuid import UUID
from typing import Optional, List
from src.models.overall.non_teaching import NonTeachingAppraisal
from src.schema.overall.non_teaching import (
    NonTeachingAppraisalCreate,
    NonTeachingSelfAppraisalUpdate,
    NonTeachingSectionHeadAssessmentUpdate,
    NonTeachingRegistrarReviewUpdate,
    NonTeachingVCFinalizeUpdate
)
from fastapi import HTTPException, status

async def create_appraisal(db: AsyncSession, staff_id: UUID, appraisal_in: NonTeachingAppraisalCreate):
    # Check if appraisal already exists for this staff and year
    query = select(NonTeachingAppraisal).where(
        NonTeachingAppraisal.staff_id == staff_id,
        NonTeachingAppraisal.academic_year == appraisal_in.academic_year
    )
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Appraisal for academic year {appraisal_in.academic_year} already exists."
        )
    
    db_appraisal = NonTeachingAppraisal(
        staff_id=staff_id,
        **appraisal_in.model_dump()
    )
    db.add(db_appraisal)
    await db.commit()
    await db.refresh(db_appraisal)
    return db_appraisal

async def get_appraisal_by_staff(db: AsyncSession, staff_id: UUID, academic_year: Optional[str] = None):
    query = select(NonTeachingAppraisal).where(NonTeachingAppraisal.staff_id == staff_id)
    if academic_year:
        query = query.where(NonTeachingAppraisal.academic_year == academic_year)
    
    result = await db.execute(query)
    return result.scalars().all()

async def get_appraisal_by_id(db: AsyncSession, appraisal_id: UUID):
    query = select(NonTeachingAppraisal).where(NonTeachingAppraisal.id == appraisal_id)
    result = await db.execute(query)
    return result.scalars().first()

async def update_self_appraisal(db: AsyncSession, appraisal_id: UUID, update_in: NonTeachingSelfAppraisalUpdate):
    query = update(NonTeachingAppraisal).where(
        NonTeachingAppraisal.id == appraisal_id
    ).values(
        **update_in.model_dump(),
        status="SUBMITTED"
    ).returning(NonTeachingAppraisal)
    
    result = await db.execute(query)
    await db.commit()
    return result.scalars().first()

async def update_section_head_assessment(db: AsyncSession, appraisal_id: UUID, update_in: NonTeachingSectionHeadAssessmentUpdate):
    query = update(NonTeachingAppraisal).where(
        NonTeachingAppraisal.id == appraisal_id
    ).values(
        **update_in.model_dump(),
        status="SECTION_HEAD_REVIEWED"
    ).returning(NonTeachingAppraisal)
    
    result = await db.execute(query)
    await db.commit()
    return result.scalars().first()

async def update_registrar_review(db: AsyncSession, appraisal_id: UUID, update_in: NonTeachingRegistrarReviewUpdate):
    query = update(NonTeachingAppraisal).where(
        NonTeachingAppraisal.id == appraisal_id
    ).values(
        **update_in.model_dump(),
        status="REGISTRAR_REVIEWED"
    ).returning(NonTeachingAppraisal)
    
    result = await db.execute(query)
    await db.commit()
    return result.scalars().first()

async def finalize_appraisal_vc(db: AsyncSession, appraisal_id: UUID, update_in: NonTeachingVCFinalizeUpdate):
    query = update(NonTeachingAppraisal).where(
        NonTeachingAppraisal.id == appraisal_id
    ).values(
        **update_in.model_dump(),
        status="FINALIZED"
    ).returning(NonTeachingAppraisal)
    
    result = await db.execute(query)
    await db.commit()
    return result.scalars().first()
