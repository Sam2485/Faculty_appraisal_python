"""
Tests for auth endpoints: register, login, /me, update profile.
Unique coverage: the register response format, duplicate-email rejection,
login token issuance, /me, and PUT /auth/me.

Login requires is_verified=True, so login/me/update tests seed users
directly via DB.  The register test only checks the register response
(newly registered users are not verified and cannot log in yet — that
is tested separately).
"""

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from src.setup.database import AsyncSessionLocal
from src.models.core import FacultyProfile
from src.setup.local_auth import get_password_hash

REGISTER_EMAIL = "register_new@test.com"
LOGIN_EMAIL = "login_test@test.com"
UPDATE_EMAIL = "update_profile@test.com"
PASSWORD = "testpassword123"


async def _seed(email: str, **kwargs):
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(FacultyProfile).where(FacultyProfile.email == email)
        )
        if not result.scalar_one_or_none():
            db.add(
                FacultyProfile(
                    email=email,
                    password_hash=get_password_hash(PASSWORD),
                    full_name=kwargs.get("full_name", "Auth Test User"),
                    appraisal_role=kwargs.get("appraisal_role", "faculty"),
                    school=kwargs.get("school", "SoCSEA"),
                    department=kwargs.get("department", "Computer Science"),
                    is_verified=True,
                )
            )
            await db.commit()


# ---------------------------------------------------------------------------
# Register endpoint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_register_success(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": REGISTER_EMAIL,
            "password": PASSWORD,
            "full_name": "Newly Registered User",
            "appraisal_role": "faculty",
            "school": "SoCSEA",
            "department": "Computer Science",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == REGISTER_EMAIL
    assert "message" in body


@pytest.mark.asyncio
async def test_register_duplicate_email_rejected(client):
    # First registration
    payload = {
        "email": REGISTER_EMAIL,
        "password": PASSWORD,
        "full_name": "First",
        "appraisal_role": "faculty",
        "school": "SoCSEA",
    }
    await client.post("/api/v1/auth/register", json=payload)
    # Second registration with same email
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Login + /me
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_returns_token(client):
    await _seed(LOGIN_EMAIL, full_name="Login User")
    resp = await client.post(
        "/api/v1/auth/login", json={"email": LOGIN_EMAIL, "password": PASSWORD}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "token" in body
    assert body["profile"]["email"] == LOGIN_EMAIL
    assert body["profile"]["appraisal_role"] == "faculty"


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(client):
    await _seed(LOGIN_EMAIL, full_name="Login User")
    resp = await client.post(
        "/api/v1/auth/login", json={"email": LOGIN_EMAIL, "password": "wrongpassword"}
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client):
    await _seed(LOGIN_EMAIL, full_name="Login User")
    login = await client.post(
        "/api/v1/auth/login", json={"email": LOGIN_EMAIL, "password": PASSWORD}
    )
    token = login.json()["token"]

    resp = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == LOGIN_EMAIL
    assert resp.json()["appraisal_role"] == "faculty"


@pytest.mark.asyncio
async def test_get_me_no_auth_returns_401(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Update profile
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_profile(client):
    await _seed(UPDATE_EMAIL, full_name="Before Update")
    login = await client.post(
        "/api/v1/auth/login", json={"email": UPDATE_EMAIL, "password": PASSWORD}
    )
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.put(
        "/api/v1/auth/me",
        json={"full_name": "After Update", "phone": "9999999999"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "After Update"
    assert resp.json()["phone"] == "9999999999"
