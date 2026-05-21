"""
Tests for summaryOtherInfo field preservation across the appraisal workflow.

The field lives inside JSONB payloads, so no migration is needed — these tests
confirm the field is never stripped during save, submit, or reviewer fetch.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from src.setup.database import AsyncSessionLocal
from src.models.core import FacultyProfile
from src.setup.local_auth import get_password_hash

FACULTY_EMAIL = "soi_faculty@test.com"
HOD_EMAIL = "soi_hod@test.com"
NT_EMAIL = "soi_nt@test.com"
PASSWORD = "testpassword"
YEAR = "2025-26"
OTHER_INFO = "Organised an inter-departmental hackathon and mentored 3 final-year projects."


async def _seed_users():
    async with AsyncSessionLocal() as db:
        for email, name, role, school, dept in [
            (FACULTY_EMAIL, "SOI Faculty", "faculty",           "SoCSEA", "Computer Science"),
            (HOD_EMAIL,     "SOI HOD",     "hod",              "SoCSEA", "Computer Science"),
            (NT_EMAIL,      "SOI NT Staff","non_teaching_staff", None,    None),
        ]:
            res = await db.execute(select(FacultyProfile).where(FacultyProfile.email == email))
            if not res.scalar_one_or_none():
                db.add(FacultyProfile(
                    email=email,
                    password_hash=get_password_hash(PASSWORD),
                    full_name=name,
                    appraisal_role=role,
                    school=school,
                    department=dept,
                    is_verified=True,
                ))
        await db.commit()


@pytest.fixture
async def faculty_headers(client: AsyncClient):
    await _seed_users()
    r = await client.post("/api/v1/auth/login", json={"email": FACULTY_EMAIL, "password": PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture
async def hod_headers(client: AsyncClient):
    await _seed_users()
    r = await client.post("/api/v1/auth/login", json={"email": HOD_EMAIL, "password": PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture
async def nt_headers(client: AsyncClient):
    await _seed_users()
    r = await client.post("/api/v1/auth/login", json={"email": NT_EMAIL, "password": PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


# ── Teaching appraisals ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_draft_snapshot_preserves_summary_other_info(client: AsyncClient, faculty_headers: dict):
    """PUT /appraisal/snapshot → GET /appraisal/snapshot must echo summaryOtherInfo."""
    save_res = await client.put(
        "/api/v1/appraisal/snapshot",
        json={
            "academic_year": YEAR,
            "payload": {
                "form": {
                    "summaryOtherInfo": OTHER_INFO,
                    "lectures": [{"semester": "Sem 1", "course_code": "CS101",
                                  "planned_classes": 40, "conducted_classes": 38}],
                },
                "totals": {"partATotal": 5, "partBTotal": 5, "grandTotal": 10},
            },
        },
        headers=faculty_headers,
    )
    assert save_res.status_code == 200

    get_res = await client.get(
        f"/api/v1/appraisal/snapshot?academic_year={YEAR}", headers=faculty_headers
    )
    assert get_res.status_code == 200
    assert get_res.json()["payload"]["form"]["summaryOtherInfo"] == OTHER_INFO


@pytest.mark.asyncio
async def test_submit_preserves_summary_other_info(client: AsyncClient, faculty_headers: dict):
    """POST /appraisal/submit must persist summaryOtherInfo in the saved snapshot."""
    submit_res = await client.post(
        "/api/v1/appraisal/submit",
        json={
            "academic_year": YEAR,
            "form": {
                "summaryOtherInfo": OTHER_INFO,
                "lectures": [{"semester": "Sem 1", "course_code": "CS101",
                               "planned_classes": 40, "conducted_classes": 38}],
            },
            "totals": {"partATotal": 5, "partBTotal": 5, "grandTotal": 10},
        },
        headers=faculty_headers,
    )
    assert submit_res.status_code == 200

    snap_res = await client.get(
        f"/api/v1/appraisal/snapshot?academic_year={YEAR}", headers=faculty_headers
    )
    assert snap_res.status_code == 200
    assert snap_res.json()["payload"]["form"]["summaryOtherInfo"] == OTHER_INFO


@pytest.mark.asyncio
async def test_reviewer_receives_summary_other_info(
    client: AsyncClient, faculty_headers: dict, hod_headers: dict
):
    """GET /dashboard/faculty/{email} must return summaryOtherInfo inside payload."""
    await client.post(
        "/api/v1/appraisal/submit",
        json={
            "academic_year": YEAR,
            "form": {
                "summaryOtherInfo": OTHER_INFO,
                "lectures": [{"semester": "Sem 1", "course_code": "CS101",
                               "planned_classes": 40, "conducted_classes": 38}],
            },
            "totals": {"partATotal": 5, "partBTotal": 5, "grandTotal": 10},
        },
        headers=faculty_headers,
    )

    review_res = await client.get(
        f"/api/v1/dashboard/faculty/{FACULTY_EMAIL}?academic_year={YEAR}",
        headers=hod_headers,
    )
    assert review_res.status_code == 200
    payload = review_res.json().get("payload", {})
    assert payload.get("form", {}).get("summaryOtherInfo") == OTHER_INFO


# ── Non-teaching appraisals ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_non_teaching_preserves_summary_other_info(client: AsyncClient, nt_headers: dict):
    """PUT /non-teaching/appraisal → GET /non-teaching/appraisal must echo summaryOtherInfo."""
    put_res = await client.put(
        "/api/v1/non-teaching/appraisal",
        json={
            "academic_year": YEAR,
            "status": "Draft",
            "payload": {
                "summaryOtherInfo": OTHER_INFO,
                "selfResp": {"text": "Managed lab inventory", "marks": 8},
            },
        },
        headers=nt_headers,
    )
    assert put_res.status_code == 200

    get_res = await client.get(
        f"/api/v1/non-teaching/appraisal?academic_year={YEAR}", headers=nt_headers
    )
    assert get_res.status_code == 200
    assert get_res.json()["payload"]["summaryOtherInfo"] == OTHER_INFO


# ── Backwards compatibility ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_missing_summary_other_info_does_not_break(client: AsyncClient, faculty_headers: dict):
    """Old submissions without summaryOtherInfo must still save and load without error."""
    save_res = await client.put(
        "/api/v1/appraisal/snapshot",
        json={
            "academic_year": YEAR,
            "payload": {
                "form": {
                    "lectures": [{"semester": "Sem 1", "course_code": "CS101",
                                  "planned_classes": 40, "conducted_classes": 38}],
                },
                "totals": {"partATotal": 5, "partBTotal": 5, "grandTotal": 10},
            },
        },
        headers=faculty_headers,
    )
    assert save_res.status_code == 200

    get_res = await client.get(
        f"/api/v1/appraisal/snapshot?academic_year={YEAR}", headers=faculty_headers
    )
    assert get_res.status_code == 200
    form = get_res.json()["payload"]["form"]
    assert "summaryOtherInfo" not in form or form.get("summaryOtherInfo") is None
