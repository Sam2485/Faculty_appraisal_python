"""
Tests for rejection / resubmission workflow in teaching appraisals.

Covers every scenario from the frontend dev's spec:
  - Faculty rejected by first reviewer can edit draft and resubmit
  - Faculty cannot edit after normal (non-rejected) review
  - HOD (as subject) rejected by Director unlocks HOD self form
  - Director rejected by Dean unlocks Director self form
  - Dean rejected by VC unlocks Dean self form
  - Non-immediate superiors cannot reject
  - Resubmission restarts workflow from Submitted status
"""

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from src.setup.database import AsyncSessionLocal
from src.models.core import FacultyProfile, Declaration
from src.setup.local_auth import get_password_hash

# ── Test users ───────────────────────────────────────────────────────────────
# All in the same school+dept so HOD/Director/Dean have authority over them.

FACULTY_EMAIL   = "rej_faculty@test.com"
HOD_EMAIL       = "rej_hod@test.com"        # reviewer AND subject in test 3
DIRECTOR_EMAIL  = "rej_director@test.com"
DEAN_EMAIL      = "rej_dean@test.com"
VC_EMAIL        = "rej_vc@test.com"
PASSWORD        = "testpassword"
YEAR            = "2025-26"

_BASE_FORM = {
    "lectures": [{"semester": "Sem 1", "course_code": "CS101",
                  "planned_classes": 40, "conducted_classes": 38}],
}
_BASE_TOTALS = {"partATotal": 5, "partBTotal": 5, "grandTotal": 10}


async def _seed_users() -> None:
    async with AsyncSessionLocal() as db:
        users = [
            (FACULTY_EMAIL,  "Rej Faculty",  "faculty",  "SoCSEA", "CS"),
            (HOD_EMAIL,      "Rej HOD",      "hod",      "SoCSEA", "CS"),
            (DIRECTOR_EMAIL, "Rej Director", "director", "SoCSEA", None),
            (DEAN_EMAIL,     "Rej Dean",     "dean",     "engineering", None),
            (VC_EMAIL,       "Rej VC",       "vc",       None,     None),
        ]
        for email, name, role, school, dept in users:
            res = await db.execute(
                select(FacultyProfile).where(FacultyProfile.email == email)
            )
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


# ── Fixtures ─────────────────────────────────────────────────────────────────

async def _login(client: AsyncClient, email: str) -> dict:
    r = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": PASSWORD}
    )
    assert r.status_code == 200, f"Login failed for {email}: {r.text}"
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture
async def faculty_h(client: AsyncClient):
    await _seed_users()
    return await _login(client, FACULTY_EMAIL)


@pytest.fixture
async def hod_h(client: AsyncClient):
    await _seed_users()
    return await _login(client, HOD_EMAIL)


@pytest.fixture
async def director_h(client: AsyncClient):
    await _seed_users()
    return await _login(client, DIRECTOR_EMAIL)


@pytest.fixture
async def dean_h(client: AsyncClient):
    await _seed_users()
    return await _login(client, DEAN_EMAIL)


@pytest.fixture
async def vc_h(client: AsyncClient):
    await _seed_users()
    return await _login(client, VC_EMAIL)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _submit_faculty(client: AsyncClient, headers: dict) -> None:
    r = await client.post(
        "/api/v1/appraisal/submit",
        json={"academic_year": YEAR, "form": _BASE_FORM, "totals": _BASE_TOTALS},
        headers=headers,
    )
    assert r.status_code == 200, f"Faculty submit failed: {r.text}"


async def _hod_review(client: AsyncClient, headers: dict, decision: str = "approved", remarks: str = "") -> dict:
    payload: dict = {
        "academic_year": YEAR,
        "part_a_score": 8,
        "part_b_score": 7,
        "total_score": 15,
        "section_scores": {},
    }
    if decision == "rejected":
        payload["decision"] = "rejected"
        payload["remarks"] = remarks or "Incomplete data, please revise."
    r = await client.put(
        f"/api/v1/appraisal-remarks/hod/{FACULTY_EMAIL}",
        json=payload,
        headers=headers,
    )
    return r


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_hod_rejection_sets_correct_status(
    client: AsyncClient, faculty_h: dict, hod_h: dict
):
    """HOD rejection → declaration status must be 'HOD Rejected'."""
    await _submit_faculty(client, faculty_h)
    r = await _hod_review(client, hod_h, decision="rejected")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "HOD Rejected"
    assert body["decision"] == "rejected"
    assert body["next_reviewer"] is None
    assert body["next_reviewer_role"] is None


@pytest.mark.asyncio
async def test_faculty_can_edit_draft_after_rejection(
    client: AsyncClient, faculty_h: dict, hod_h: dict
):
    """After HOD rejects, faculty must be able to save a new draft snapshot."""
    await _submit_faculty(client, faculty_h)
    await _hod_review(client, hod_h, decision="rejected")

    save_r = await client.put(
        "/api/v1/appraisal/snapshot",
        json={
            "academic_year": YEAR,
            "payload": {"form": _BASE_FORM, "totals": _BASE_TOTALS},
        },
        headers=faculty_h,
    )
    assert save_r.status_code == 200, save_r.text


@pytest.mark.asyncio
async def test_faculty_cannot_edit_draft_after_normal_review(
    client: AsyncClient, faculty_h: dict, hod_h: dict
):
    """After HOD approves (no rejection), draft save must be blocked."""
    await _submit_faculty(client, faculty_h)
    await _hod_review(client, hod_h, decision="approved")

    save_r = await client.put(
        "/api/v1/appraisal/snapshot",
        json={
            "academic_year": YEAR,
            "payload": {"form": _BASE_FORM, "totals": _BASE_TOTALS},
        },
        headers=faculty_h,
    )
    assert save_r.status_code == 403, save_r.text


@pytest.mark.asyncio
async def test_resubmission_resets_status_and_increments_attempt(
    client: AsyncClient, faculty_h: dict, hod_h: dict
):
    """After rejection, resubmission must reset status to 'Submitted' and increment submission_attempt."""
    await _submit_faculty(client, faculty_h)
    await _hod_review(client, hod_h, decision="rejected")

    # Resubmit
    r = await client.post(
        "/api/v1/appraisal/submit",
        json={"academic_year": YEAR, "form": _BASE_FORM, "totals": _BASE_TOTALS},
        headers=faculty_h,
    )
    assert r.status_code == 200, r.text

    # Verify declaration state in DB
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Declaration).where(
                Declaration.faculty_email == FACULTY_EMAIL,
                Declaration.academic_year == YEAR,
            )
        )
        decl = res.scalar_one_or_none()
    assert decl is not None
    assert decl.status == "Submitted"
    assert decl.submission_attempt == 2


@pytest.mark.asyncio
async def test_faculty_cannot_resubmit_while_under_active_review(
    client: AsyncClient, faculty_h: dict, hod_h: dict
):
    """After HOD approves and forwards, faculty must not be able to resubmit."""
    await _submit_faculty(client, faculty_h)
    await _hod_review(client, hod_h, decision="approved")  # now 'Pending Director Review'

    r = await client.post(
        "/api/v1/appraisal/submit",
        json={"academic_year": YEAR, "form": _BASE_FORM, "totals": _BASE_TOTALS},
        headers=faculty_h,
    )
    assert r.status_code == 403, r.text


@pytest.mark.asyncio
async def test_non_immediate_superior_cannot_reject(
    client: AsyncClient, faculty_h: dict, director_h: dict
):
    """Director is NOT the immediate superior for faculty at 'Submitted' status — must get 403."""
    await _submit_faculty(client, faculty_h)

    r = await client.put(
        f"/api/v1/appraisal-remarks/director/{FACULTY_EMAIL}",
        json={
            "academic_year": YEAR,
            "decision": "rejected",
            "remarks": "Rejecting as director directly",
            "total_score": 10,
        },
        headers=director_h,
    )
    assert r.status_code == 403, r.text


@pytest.mark.asyncio
async def test_rejection_requires_remarks(
    client: AsyncClient, faculty_h: dict, hod_h: dict
):
    """Rejection without remarks must return 422."""
    await _submit_faculty(client, faculty_h)

    r = await client.put(
        f"/api/v1/appraisal-remarks/hod/{FACULTY_EMAIL}",
        json={
            "academic_year": YEAR,
            "decision": "rejected",
            "remarks": "",   # empty
            "total_score": 10,
        },
        headers=hod_h,
    )
    assert r.status_code == 422, r.text


@pytest.mark.asyncio
async def test_hod_subject_rejected_by_director(
    client: AsyncClient, hod_h: dict, director_h: dict
):
    """HOD submitting their own appraisal → Director rejects → status 'Director Rejected'."""
    # HOD submits their own appraisal
    r = await client.post(
        "/api/v1/appraisal/submit",
        json={"academic_year": YEAR, "form": _BASE_FORM, "totals": _BASE_TOTALS},
        headers=hod_h,
    )
    assert r.status_code == 200, r.text

    # Director rejects
    r = await client.put(
        f"/api/v1/appraisal-remarks/director/{HOD_EMAIL}",
        json={
            "academic_year": YEAR,
            "decision": "rejected",
            "remarks": "Missing research contributions.",
            "total_score": 10,
        },
        headers=director_h,
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "Director Rejected"


@pytest.mark.asyncio
async def test_director_subject_rejected_by_dean(
    client: AsyncClient, director_h: dict, dean_h: dict
):
    """Director submitting their own appraisal → Dean rejects → status 'Dean Rejected'."""
    r = await client.post(
        "/api/v1/appraisal/submit",
        json={"academic_year": YEAR, "form": _BASE_FORM, "totals": _BASE_TOTALS},
        headers=director_h,
    )
    assert r.status_code == 200, r.text

    r = await client.put(
        f"/api/v1/appraisal-remarks/dean/{DIRECTOR_EMAIL}",
        json={
            "academic_year": YEAR,
            "decision": "rejected",
            "remarks": "Insufficient documentation.",
            "total_score": 10,
        },
        headers=dean_h,
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "Dean Rejected"


@pytest.mark.asyncio
async def test_dean_subject_rejected_by_vc(
    client: AsyncClient, dean_h: dict, vc_h: dict
):
    """Dean submitting their own appraisal → VC rejects → status 'VC Rejected'."""
    r = await client.post(
        "/api/v1/appraisal/submit",
        json={"academic_year": YEAR, "form": _BASE_FORM, "totals": _BASE_TOTALS},
        headers=dean_h,
    )
    assert r.status_code == 200, r.text

    r = await client.put(
        f"/api/v1/appraisal-remarks/final/{DEAN_EMAIL}",
        json={
            "academic_year": YEAR,
            "decision": "rejected",
            "remarks": "Please add community service section.",
            "total_score": 10,
        },
        headers=vc_h,
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "VC Rejected"


@pytest.mark.asyncio
async def test_approved_flow_unchanged(
    client: AsyncClient, faculty_h: dict, hod_h: dict
):
    """Omitting 'decision' must behave exactly as before — status advances normally."""
    await _submit_faculty(client, faculty_h)

    r = await client.put(
        f"/api/v1/appraisal-remarks/hod/{FACULTY_EMAIL}",
        json={
            "academic_year": YEAR,
            "part_a_score": 8,
            "part_b_score": 7,
            "total_score": 15,
            "remarks": "Good work.",
            "section_scores": {},
            # no 'decision' key
        },
        headers=hod_h,
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "Pending Director Review"
    assert r.json()["decision"] == "approved"


@pytest.mark.asyncio
async def test_double_rejection_blocked(
    client: AsyncClient, faculty_h: dict, hod_h: dict
):
    """Rejecting an already-rejected appraisal must return 409."""
    await _submit_faculty(client, faculty_h)
    await _hod_review(client, hod_h, decision="rejected")

    r = await _hod_review(client, hod_h, decision="rejected")
    assert r.status_code == 409, r.text
