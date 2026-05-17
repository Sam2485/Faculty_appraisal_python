# Remaining Backend Changes — Reporting Officer Assignment

**Feature:** When adding a non-teaching staff user via the Admin UI, admin can now select a specific Reporting Officer (from a dropdown) instead of relying on school/department matching. There is also an existing toggle to skip the RO entirely and route directly to the Registrar.

The frontend changes are complete. The following backend changes are **required** for the feature to work end-to-end.

---

## 1. Database — New Column

**Migration file:** `migrations/016_add_reporting_officer_email.sql`

```sql
ALTER TABLE faculty_profiles
  ADD COLUMN IF NOT EXISTS reporting_officer_email TEXT DEFAULT NULL;
```

Run this against the Cloud SQL database before deploying the backend code changes.

---

## 2. New API Endpoint — List Reporting Officers

The Admin UI calls this endpoint to populate the RO dropdown when creating/editing a non-teaching staff user.

**Endpoint:** `GET /api/v1/admin/reporting-officers`

**Auth:** Admin role required (same guard as other `/admin/*` endpoints).

**Response shape:**
```json
[
  {
    "email": "ravi.patil@dypu.edu.in",
    "full_name": "Ravi Patil",
    "school": "SoCSEA",
    "department": "Computer Science"
  },
  ...
]
```

**Logic:** Query `faculty_profiles` where `appraisal_role = 'reporting_officer'` and `is_active = true`, ordered by `full_name`.

**Suggested implementation in `src/api/v1/admin.py`:**
```python
@router.get("/reporting-officers")
async def list_reporting_officers(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(
        select(FacultyProfile)
        .where(
            FacultyProfile.appraisal_role == "reporting_officer",
            FacultyProfile.is_active == True,
        )
        .order_by(FacultyProfile.full_name)
    )
    users = result.scalars().all()
    return [
        {
            "email": u.email,
            "full_name": u.full_name,
            "school": u.school,
            "department": u.department,
        }
        for u in users
    ]
```

---

## 3. Update Model — `FacultyProfile`

Add the new column to the SQLAlchemy model in `src/models/core.py`:

```python
# In class FacultyProfile:
reports_to_registrar     = Column(Boolean, nullable=False, default=False)
reporting_officer_email  = Column(String, nullable=True)   # ← ADD THIS LINE
avatar                   = Column(String)
```

---

## 4. Update Admin User Create/Update/List — `src/api/v1/admin.py`

### 4a. `UserCreateRequest` — add field
```python
class UserCreateRequest(BaseModel):
    # ... existing fields ...
    reports_to_registrar: bool = False
    reporting_officer_email: Optional[str] = None   # ← ADD THIS
```

### 4b. `UserUpdateRequest` — add field
```python
class UserUpdateRequest(BaseModel):
    # ... existing fields ...
    reports_to_registrar: Optional[bool] = None
    reporting_officer_email: Optional[str] = None   # ← ADD THIS
    password: Optional[str] = None
```

### 4c. `create_user` — save the field
```python
user = FacultyProfile(
    # ... existing fields ...
    reports_to_registrar=data.reports_to_registrar,
    reporting_officer_email=data.reporting_officer_email,   # ← ADD THIS
)
```

### 4d. `list_users` — include in response
```python
return [
    {
        # ... existing fields ...
        "reports_to_registrar": u.reports_to_registrar,
        "reporting_officer_email": u.reporting_officer_email,   # ← ADD THIS
        "created_at": u.created_at,
    }
    for u in users
]
```

> **Note:** `update_user` already uses `setattr` in a loop over `data.model_dump(exclude_none=True)`, so it will automatically pick up `reporting_officer_email` with no extra code once the field is on the model and schema.

---

## 5. Update Non-Teaching Subordinates Query — `src/api/v1/non_teaching.py`

Currently, a Reporting Officer sees all non-teaching staff in the **same school and department**. After this change, an RO should only see staff explicitly **assigned to them** via `reporting_officer_email`.

**File:** `src/api/v1/non_teaching.py`  
**Function:** `get_non_teaching_subordinates`

**Change this block:**
```python
elif "reporting_officer" in current_user.roles:
    # OLD — school+department matching
    query = query.where(
        FacultyProfile.school == current_user.school,
        FacultyProfile.department == current_user.department,
        FacultyProfile.reports_to_registrar == False,
    )
```

**To this:**
```python
elif "reporting_officer" in current_user.roles:
    # NEW — explicit assignment via reporting_officer_email
    query = query.where(
        FacultyProfile.reporting_officer_email == current_user.email,
        FacultyProfile.reports_to_registrar == False,
    )
```

---

## 6. Update Review Authorization — `src/api/v1/non_teaching.py`

The `review_non_teaching` endpoint uses `has_authority_over()` which checks school-level access for ROs. An RO assigned cross-school would currently be blocked.

**File:** `src/api/v1/non_teaching.py`  
**Function:** `review_non_teaching`

After the target profile is loaded, add an explicit RO assignment check **before** the `has_authority_over` call:

```python
target_res = await db.execute(select(FacultyProfile).where(FacultyProfile.email == email))
target = target_res.scalar_one_or_none()
if not target:
    raise HTTPException(status_code=404, detail="Staff profile not found")

# Allow access if this RO is explicitly assigned to the staff member
is_assigned_ro = (
    "reporting_officer" in current_user.roles
    and target.reporting_officer_email == current_user.email
)

if not is_assigned_ro and not current_user.has_authority_over(
    email, target.appraisal_role, target.department, target.school
):
    raise HTTPException(status_code=403, detail="Not authorized to view this staff's data")
```

---

## Summary of Files to Change

| File | Change |
|---|---|
| `migrations/016_add_reporting_officer_email.sql` | **Create** — ALTER TABLE to add column |
| `src/models/core.py` | Add `reporting_officer_email` column to `FacultyProfile` |
| `src/api/v1/admin.py` | Add `GET /reporting-officers` endpoint; add field to create/update/list schemas |
| `src/api/v1/non_teaching.py` | Switch RO subordinates filter to use `reporting_officer_email`; fix review auth |

---

## Deployment Order

1. Run migration `016_add_reporting_officer_email.sql` against the database
2. Deploy updated backend code
3. Frontend changes are already live (no additional frontend deployment needed beyond the current build)
