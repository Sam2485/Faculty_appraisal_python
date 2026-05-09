"""
Tests for the REST Admin API (/api/v1/admin/*).
All admin endpoints require appraisal_role='admin'; non-admin users get 403.
Reviewer users are injected via dependency_overrides — no real DB accounts needed.
"""

import pytest
from httpx import AsyncClient, ASGITransport

from src.main import app
from src.setup.dependencies import User, get_current_user

MANAGED_EMAIL = "admin_managed@test.com"


@pytest.fixture
def admin_override():
    async def get_admin():
        return User(id="admin-test-id", email="sysadmin@test.com", roles=["admin"])

    app.dependency_overrides[get_current_user] = get_admin
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def nonadmin_override():
    async def get_nonadmin():
        return User(id="user-test-id", email="regular@test.com", roles=["faculty"])

    app.dependency_overrides[get_current_user] = get_nonadmin
    yield
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# GET /admin/stats
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_stats_no_auth_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/admin/stats")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_stats_non_admin_returns_403(nonadmin_override):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/admin/stats")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_stats_admin_success(admin_override):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/admin/stats")
    assert resp.status_code == 200
    body = resp.json()
    assert "total_registered" in body
    assert "by_role" in body
    assert "by_school_registered" in body
    assert "teaching_submission_pipeline" in body


# ---------------------------------------------------------------------------
# GET /admin/users
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_users_no_auth_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/admin/users")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_users_admin(admin_override):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/admin/users")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_list_users_filter_by_role(admin_override):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/admin/users?role=faculty")
    assert resp.status_code == 200
    users = resp.json()
    assert all(u["appraisal_role"] == "faculty" for u in users)


# ---------------------------------------------------------------------------
# POST → PUT → DELETE /admin/users lifecycle
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_update_delete_user(admin_override):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create
        create_resp = await client.post(
            "/api/v1/admin/users",
            json={
                "email": MANAGED_EMAIL,
                "password": "Password123!",
                "full_name": "Managed Test User",
                "appraisal_role": "faculty",
                "school": "SoCSEA",
            },
        )
        assert create_resp.status_code == 201, create_resp.text
        assert create_resp.json()["email"] == MANAGED_EMAIL

        # Duplicate email should be rejected
        dup_resp = await client.post(
            "/api/v1/admin/users",
            json={
                "email": MANAGED_EMAIL,
                "password": "Password123!",
                "full_name": "Duplicate",
                "appraisal_role": "faculty",
            },
        )
        assert dup_resp.status_code == 400

        # Update role
        update_resp = await client.put(
            f"/api/v1/admin/users/{MANAGED_EMAIL}",
            json={"full_name": "Updated Name", "appraisal_role": "hod"},
        )
        assert update_resp.status_code == 200, update_resp.text
        assert update_resp.json()["role"] == "hod"

        # Delete
        del_resp = await client.delete(f"/api/v1/admin/users/{MANAGED_EMAIL}")
        assert del_resp.status_code == 200

        # Confirm deleted — search should return empty for this email
        list_resp = await client.get(f"/api/v1/admin/users?search={MANAGED_EMAIL}")
        assert not any(u["email"] == MANAGED_EMAIL for u in list_resp.json())


@pytest.mark.asyncio
async def test_create_user_invalid_role(admin_override):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/admin/users",
            json={
                "email": "badrole@test.com",
                "password": "Password123!",
                "full_name": "Bad Role User",
                "appraisal_role": "superadmin",  # not in VALID_ROLES
            },
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_delete_nonexistent_user_returns_404(admin_override):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.delete("/api/v1/admin/users/ghost_nobody@test.com")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_nonexistent_user_returns_404(admin_override):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.put(
            "/api/v1/admin/users/ghost_nobody@test.com",
            json={"full_name": "Nobody"},
        )
    assert resp.status_code == 404
