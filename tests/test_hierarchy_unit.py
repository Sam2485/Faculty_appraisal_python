import pytest
from src.setup.dependencies import User

def test_vc_authority():
    """VC has authority over anyone across all schools"""
    vc = User(id="vc_user", email="vc@test.com", roles=["vc"])
    assert vc.has_authority_over("faculty_id", "faculty") is True
    assert vc.has_authority_over("dir_id", "director") is True
    assert vc.has_authority_over("dean_id", "dean") is True

def test_dean_authority():
    """Dean has blanket authority over all lower roles (division filtering removed)"""
    dean = User(id="dean_id", email="dean@test.com", roles=["dean"])
    assert dean.has_authority_over("faculty_id", "faculty") is True
    assert dean.has_authority_over("hod_id", "hod") is True
    # Dean cannot oversee VC
    assert dean.has_authority_over("vc_id", "vc") is False

def test_director_authority():
    """Director only has authority over faculty within their own school"""
    director = User(id="dir_id", email="dir@test.com", roles=["director"], school="SoCSEA")
    assert director.has_authority_over("fac_id", "faculty", subordinate_school="SoCSEA") is True
    # Different school — not authorized
    assert director.has_authority_over("other_fac", "faculty", subordinate_school="SoEMR") is False

def test_hod_authority_isolation():
    """HOD can only see faculty in their own school AND department"""
    hod = User(id="hod_id", email="hod@test.com", roles=["hod"], school="SoCSEA", department="CS")
    # Same school, same department — authorized
    assert hod.has_authority_over("fac_id", "faculty", subordinate_school="SoCSEA", subordinate_dept="CS") is True
    # Same school, different department — not authorized
    assert hod.has_authority_over("me_fac", "faculty", subordinate_school="SoCSEA", subordinate_dept="ME") is False
    # Different school, same department name — not authorized
    assert hod.has_authority_over("other_fac", "faculty", subordinate_school="SoEMR", subordinate_dept="CS") is False

def test_self_access():
    """Users always have authority over their own data"""
    faculty = User(id="fac_id", email="fac@test.com", roles=["faculty"])
    assert faculty.has_authority_over("fac_id", "faculty") is True

def test_admin_global_access():
    """Admin has authority over absolutely everything"""
    admin = User(id="admin_id", email="admin@test.com", roles=["admin"])
    assert admin.has_authority_over("any_id", "any_role") is True

def test_lower_role_cannot_see_higher():
    """Director cannot oversee Dean or VC"""
    director = User(id="dir_id", email="dir@test.com", roles=["director"], school="SoCSEA")
    assert director.has_authority_over("dean_id", "dean") is False
    assert director.has_authority_over("vc_id", "vc") is False
