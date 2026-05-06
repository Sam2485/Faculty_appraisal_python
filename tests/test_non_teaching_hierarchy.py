import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from src.setup.dependencies import get_current_user, User
from uuid import uuid4

# Helper to create a mock user
def mock_user(role: str, dept: str = "Computer Science"):
    return User(
        id=str(uuid4()),
        roles=[role],
        department=dept,
        school_id="00000000-0000-0000-0000-000000000000",
        division="Engineering"
    )

from src.models.Part_B.faculty import Faculty
from src.setup.database import get_db

@pytest.mark.asyncio
async def test_non_teaching_hierarchy_access():
    # 0. Create staff profile in DB
    staff_id = str(uuid4())
    async for db in get_db():
        new_faculty = Faculty(
            id=staff_id,
            name="Test Staff",
            email=f"staff_{staff_id}@test.com",
            role="staff",
            department="Computer Science",
            academic_year="2025-26"
        )
        db.add(new_faculty)
        await db.commit()
        break # Exit generator

    # 1. Setup appraisal owned by a staff member
    staff_user = User(id=staff_id, roles=["staff"], department="Computer Science", school_id="00000000-0000-0000-0000-000000000000", division="Engineering")
    appraisal_id = None
    academic_year = "2025-26"

    async def get_staff_user(): return staff_user
    app.dependency_overrides[get_current_user] = get_staff_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create appraisal
        res = await client.post("/api/v1/non-teaching/", json={
            "academic_year": academic_year,
            "designation": "Lab Asst"
        })
        assert res.status_code == 201
        appraisal_id = res.json()["id"]

        # 2. Test Section Head Access (Same School)
        sh_user = mock_user("section_head")
        async def get_sh_user(): return sh_user
        app.dependency_overrides[get_current_user] = get_sh_user
        
        sh_data = {
            "responsibilities_sh": 9.0, "contributions_sh": 8.0, "achievements_sh": 4.0,
            "pc_knowledge_rules": 5, "pc_organize_work": 5, "pc_additional_assignments": 5, "pc_creativity_innovation": 5, "pc_learn_new_duties": 5,
            "qw_maintain_records": 5, "qw_accuracy_speed": 5, "qw_neatness_tidiness": 5, "qw_completion_time": 5, "qw_diligence_responsibility": 5,
            "ph_reliability": 5, "ph_attitude_respect": 5, "ph_discipline": 5, "ph_team_work": 5, "ph_integrity_behavior": 5, "ph_interpersonal_relations": 5,
            "rg_attendance_punctuality": 5, "rg_leave_discipline": 5, "rg_communication": 5, "rg_adherence_hours": 5, "rg_responsibility_absence": 5
        }
        res = await client.patch(f"/api/v1/non-teaching/{appraisal_id}/section-head-assessment", json=sh_data)
        assert res.status_code == 200

        # 3. Test Registrar Access (University-wide)
        reg_user = mock_user("registrar")
        async def get_reg_user(): return reg_user
        app.dependency_overrides[get_current_user] = get_reg_user
        
        reg_data = {
            "responsibilities_registrar": 9.0, "contributions_registrar": 8.0, "achievements_registrar": 4.0,
            "registrar_recommendation": "Good"
        }
        res = await client.patch(f"/api/v1/non-teaching/{appraisal_id}/registrar-review", json=reg_data)
        assert res.status_code == 200

        # 4. Test VC Access
        vc_user = mock_user("vc")
        async def get_vc_user(): return vc_user
        app.dependency_overrides[get_current_user] = get_vc_user
        
        vc_data = {"vc_final_grade": "A"}
        res = await client.patch(f"/api/v1/non-teaching/{appraisal_id}/vc-finalize", json=vc_data)
        assert res.status_code == 200

        # 5. Test Unauthorized Access (Another Staff member)
        other_staff = mock_user("staff")
        async def get_other_staff(): return other_staff
        app.dependency_overrides[get_current_user] = get_other_staff
        
        # Try to update SH assessment as another staff
        res = await client.patch(f"/api/v1/non-teaching/{appraisal_id}/section-head-assessment", json=sh_data)
        assert res.status_code == 403

    # Cleanup overrides
    app.dependency_overrides = {}
