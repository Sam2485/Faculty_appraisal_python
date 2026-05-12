from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.setup.database import get_db
from src.setup.dependencies import CurrentUser
from src.models.core import Announcement, VALID_ANNOUNCEMENT_AUDIENCES
from pydantic import BaseModel, field_validator
from typing import Optional

router = APIRouter(tags=["Announcements"])


def _check_admin(current_user):
    if "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin role required")


# ---------------------------------------------------------------------------
# Public — active announcements only
# ---------------------------------------------------------------------------

@router.get("/announcements")
async def list_announcements(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Announcement)
        .where(Announcement.is_active == True)
        .order_by(Announcement.created_at.desc())
    )
    items = result.scalars().all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "body": a.body,
            "audience": a.audience,
            "created_at": a.created_at,
        }
        for a in items
    ]


# ---------------------------------------------------------------------------
# Admin CRUD
# ---------------------------------------------------------------------------

def _validate_audience_str(v: str) -> str:
    tokens = [t.strip() for t in v.split(",") if t.strip()]
    if not tokens:
        raise ValueError("audience cannot be empty")
    invalid = [t for t in tokens if t not in VALID_ANNOUNCEMENT_AUDIENCES]
    if invalid:
        raise ValueError(
            f"Invalid audience value(s): {invalid}. "
            f"Each token must be one of: {sorted(VALID_ANNOUNCEMENT_AUDIENCES)}"
        )
    return v


class AnnouncementCreate(BaseModel):
    title: str
    body: str
    audience: str = "all"
    is_active: bool = True

    @field_validator("audience")
    @classmethod
    def validate_audience(cls, v: str) -> str:
        return _validate_audience_str(v)


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    audience: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("audience")
    @classmethod
    def validate_audience(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return _validate_audience_str(v)
        return v


@router.get("/admin/announcements")
async def list_all_announcements(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(
        select(Announcement).order_by(Announcement.created_at.desc())
    )
    items = result.scalars().all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "body": a.body,
            "audience": a.audience,
            "is_active": a.is_active,
            "created_by": a.created_by,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
        }
        for a in items
    ]


@router.post("/admin/announcements", status_code=201)
async def create_announcement(
    current_user: CurrentUser,
    data: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    announcement = Announcement(
        title=data.title,
        body=data.body,
        audience=data.audience,
        is_active=data.is_active,
        created_by=current_user.email,
    )
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)
    return {"message": "Announcement created", "id": announcement.id}


@router.put("/admin/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: int,
    current_user: CurrentUser,
    data: AnnouncementUpdate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id)
    )
    announcement = result.scalar_one_or_none()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(announcement, field, value)

    await db.commit()
    await db.refresh(announcement)
    return {"message": "Announcement updated", "id": announcement.id}


@router.delete("/admin/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id)
    )
    announcement = result.scalar_one_or_none()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    await db.delete(announcement)
    await db.commit()
    return {"message": f"Announcement {announcement_id} deleted"}
