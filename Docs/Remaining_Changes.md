# Remaining Backend Changes — Registrar Assignment

**Feature:** When adding a non-teaching staff user via the Admin UI, admin can now select a specific **Registrar** from a dropdown (mandatory for all non-teaching staff). This replaces the old approach where the Registrar saw all non-teaching staff regardless of assignment.

The frontend changes are **complete**. The following backend changes are required for the feature to work end-to-end.

---

## 1. Database — New Column

**Create migration file:** `migrations/017_add_registrar_email.sql`

```sql
ALTER TABLE faculty_profiles
  ADD COLUMN IF NOT EXISTS registrar_email TEXT DEFAULT NULL;
```

Run this against the Cloud SQL database before deploying the backend code changes.

---

## 2. New API Endpoint — List Registrars

The Admin UI calls this to populate the Registrar dropdown when creating/editing a non-teaching staff user.

**Endpoint:** `GET /api/v1/admin/registrars`

**Auth:** Admin role required (same guard as other `/admin/*` endpoints).

**Response shape:**
```json
[
  {
    "email": "sunita.kale@dypu.edu.in",
    "full_name": "Sunita Kale",
    "school": null,
    "department": null
  }
]
```

**Logic:** Query `faculty_profiles` where `appraisal_role = 'registrar'` and `is_active = true`, ordered by `full_name`.

**Add to `src/api/v1/admin.py`:**
```python
@router.get("/registrars")
async def list_registrars(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(
        select(FacultyProfile)
        .where(
            FacultyProfile.appraisal_role == "registrar",
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

**File:** `src/models/core.py`

```python
# In class FacultyProfile — add after reports_to_registrar:
reports_to_registrar = Column(Boolean, nullable=False, default=False)
registrar_email      = Column(String, nullable=True)   # ← ADD THIS
avatar               = Column(String)
```

---

## 4. Update Admin User Create / Update / List

**File:** `src/api/v1/admin.py`

### `UserCreateRequest` — add field
```python
class UserCreateRequest(BaseModel):
    # ... existing fields ...
    reports_to_registrar: bool = False
    registrar_email: Optional[str] = None   # ← ADD THIS
```

### `UserUpdateRequest` — add field
```python
class UserUpdateRequest(BaseModel):
    # ... existing fields ...
    reports_to_registrar: Optional[bool] = None
    registrar_email: Optional[str] = None   # ← ADD THIS
    password: Optional[str] = None
```

### `create_user` — save the field
```python
user = FacultyProfile(
    # ... existing fields ...
    reports_to_registrar=data.reports_to_registrar,
    registrar_email=data.registrar_email,   # ← ADD THIS
)
```

### `list_users` — include in response
```python
return [
    {
        # ... existing fields ...
        "reports_to_registrar": u.reports_to_registrar,
        "registrar_email":      u.registrar_email,   # ← ADD THIS
        "created_at": u.created_at,
    }
    for u in users
]
```

> `update_user` uses `setattr` in a loop over `data.model_dump(exclude_none=True)` — it will automatically save `registrar_email` with no extra code once the field is on the model and schema.

---

## 5. Update Non-Teaching Subordinates — Registrar Filter

**File:** `src/api/v1/non_teaching.py`
**Function:** `get_non_teaching_subordinates`

Currently the Registrar sees **all** non-teaching appraisals. After this change, a Registrar should only see staff **assigned to them** via `registrar_email`.

**Change this block:**
```python
if "registrar" in current_user.roles or "vc" in current_user.roles:
    # Sees all non-teaching pending review
    pass
```

**To this:**
```python
if "vc" in current_user.roles:
    # VC sees everything
    pass
elif "registrar" in current_user.roles:
    # Registrar sees only staff assigned to them
    query = query.where(
        FacultyProfile.registrar_email == current_user.email
    )
```

---

## 6. Update Review Authorization — Registrar

**File:** `src/api/v1/non_teaching.py`
**Function:** `review_non_teaching`

The current `has_authority_over()` check may block a Registrar assigned to a staff member from a different school/department. Add an explicit assignment check before the authority check:

```python
target_res = await db.execute(select(FacultyProfile).where(FacultyProfile.email == email))
target = target_res.scalar_one_or_none()
if not target:
    raise HTTPException(status_code=404, detail="Staff profile not found")

# Allow if this Registrar is explicitly assigned to the staff member
is_assigned_registrar = (
    "registrar" in current_user.roles
    and target.registrar_email == current_user.email
)

if not is_assigned_registrar and not current_user.has_authority_over(
    email, target.appraisal_role, target.department, target.school
):
    raise HTTPException(status_code=403, detail="Not authorized to view this staff's data")
```

---

## Summary of Files to Change

| File | Change |
|---|---|
| `migrations/017_add_registrar_email.sql` | **Create** — ALTER TABLE to add `registrar_email` column |
| `src/models/core.py` | Add `registrar_email` column to `FacultyProfile` |
| `src/api/v1/admin.py` | Add `GET /registrars` endpoint; add `registrar_email` to create/update/list schemas |
| `src/api/v1/non_teaching.py` | Add Registrar filter in subordinates query; fix review auth |

---

## Deployment Order

1. Run migration `017_add_registrar_email.sql` against the database
2. Deploy updated backend code
3. Frontend is already done — no additional frontend changes needed
