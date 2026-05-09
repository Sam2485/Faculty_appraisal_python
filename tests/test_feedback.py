"""
Tests for the feedback endpoints.
POST /feedback  — public, no auth required
GET  /feedback  — admin only
"""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import delete

from src.main import app
from src.setup.dependencies import User, get_current_user
from src.setup.database import AsyncSessionLocal
from src.models.core import Feedback

SENDER_EMAIL = "testfeedback@test.com"

VALID_PAYLOAD = {
    "name": "Test Sender",
    "email": SENDER_EMAIL,
    "category": "feedback",
    "subject": "Test subject line",
    "message": "This is a test feedback message.",
}


@pytest.fixture(autouse=True)
async def cleanup_feedback():
    yield
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(
                delete(Feedback).where(Feedback.email == SENDER_EMAIL)
            )
            await db.commit()
    except Exception:
        pass


# ---------------------------------------------------------------------------
# POST /feedback — public endpoint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_post_feedback_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/feedback", json=VALID_PAYLOAD)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "id" in body["feedback"]
    assert body["feedback"]["status"] == "new"


@pytest.mark.asyncio
async def test_post_feedback_invalid_category():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/feedback", json={**VALID_PAYLOAD, "category": "totally_invalid"}
        )
    assert resp.status_code == 422
    assert "category" in resp.json()["errors"]


@pytest.mark.asyncio
async def test_post_feedback_missing_required_fields():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/feedback", json={"name": "Only Name"})
    assert resp.status_code == 422
    errors = resp.json()["errors"]
    assert "email" in errors
    assert "category" in errors
    assert "subject" in errors
    assert "message" in errors


@pytest.mark.asyncio
async def test_post_feedback_invalid_email_format():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/feedback", json={**VALID_PAYLOAD, "email": "not-an-email"}
        )
    assert resp.status_code == 422
    assert "email" in resp.json()["errors"]


@pytest.mark.asyncio
async def test_post_feedback_all_valid_categories():
    valid_categories = ["query", "feedback", "bug", "suggestion", "other"]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for cat in valid_categories:
            resp = await client.post(
                "/api/v1/feedback", json={**VALID_PAYLOAD, "category": cat}
            )
            assert resp.status_code == 200, f"Category '{cat}' should be accepted"


# ---------------------------------------------------------------------------
# GET /feedback — admin only
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_feedback_no_auth_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/feedback")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_feedback_non_admin_returns_403():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        try:
            async def get_faculty():
                return User(id="fac-id", email="faculty_fb@test.com", roles=["faculty"])

            app.dependency_overrides[get_current_user] = get_faculty
            resp = await client.get("/api/v1/feedback")
        finally:
            app.dependency_overrides.clear()
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_feedback_admin_returns_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Submit one entry first so the list is non-empty
        await client.post("/api/v1/feedback", json=VALID_PAYLOAD)

        try:
            async def get_admin():
                return User(id="admin-id", email="admin_fb@test.com", roles=["admin"])

            app.dependency_overrides[get_current_user] = get_admin
            resp = await client.get("/api/v1/feedback")
        finally:
            app.dependency_overrides.clear()

    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    assert any(item["email"] == SENDER_EMAIL for item in items)


@pytest.mark.asyncio
async def test_get_feedback_category_filter():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/v1/feedback", json={**VALID_PAYLOAD, "category": "bug"})

        try:
            async def get_admin():
                return User(id="admin-id", email="admin_fb@test.com", roles=["admin"])

            app.dependency_overrides[get_current_user] = get_admin
            resp = await client.get("/api/v1/feedback?category=bug")
        finally:
            app.dependency_overrides.clear()

    assert resp.status_code == 200
    items = resp.json()
    assert all(item["category"] == "bug" for item in items)
