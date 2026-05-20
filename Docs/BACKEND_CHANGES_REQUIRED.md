# Backend Changes Required for Admin UI Features

**Requested by:** Frontend / Admin UI team  
**Date:** 2026-05-20  
**Priority order:** Fix 1 → Fix 2 → Fix 3 → Feature 4

---

## Fix 1 — Feedback page: super_admin gets 403

**File:** `src/api/v1/feedback.py`  
**Line:** 65  

**Current code:**
```python
def _require_admin(current_user):
    if "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin role required")
```

**Problem:**  
`super_admin` users have `roles = ["super_admin"]`. The string `"admin"` is never in that list, so they always get a 403 on every feedback endpoint.

**Fix — one line change:**
```python
def _require_admin(current_user):
    if not any(r in current_user.roles for r in ("admin", "super_admin")):
        raise HTTPException(status_code=403, detail="Admin role required")
```

---

## Fix 2 — NT staff status missing from `/dashboard/subordinates`

**File:** `src/api/v1/dashboard.py`  
**Lines:** 30–35

**Current code:**
```python
query = select(FacultyProfile, Declaration).outerjoin(
    Declaration,
    and_(
        FacultyProfile.email == Declaration.faculty_email,
        Declaration.academic_year == academic_year
    )
)
```

**Problem:**  
Non-teaching staff (`non_teaching_staff`, `reporting_officer`, `registrar`) submit forms to the `non_teaching_appraisals` table, **not** `Declaration`. So `decl` is always `None` for them, and the endpoint returns `status: "pending"` for every NT staff member regardless of their actual submission state.

The admin UI calls this endpoint (as `api.marks.list()`) to populate the NT pipeline stages in the Appraisal Cycle page. Without real NT status, the pipeline always shows everyone as "not submitted."

**Fix — also join NonTeachingAppraisal for NT roles:**

```python
from src.models.non_teaching import NonTeachingAppraisal

NT_ROLES = {'non_teaching_staff', 'reporting_officer', 'registrar'}

# ... inside the route handler, after the existing query executes and builds `subordinates`:

# Fetch NT appraisal statuses for NT staff in this result set
nt_emails = [fp.email for fp, _ in rows if fp.appraisal_role in NT_ROLES]
nt_status_map = {}
if nt_emails:
    nt_res = await db.execute(
        select(NonTeachingAppraisal.staff_email, NonTeachingAppraisal.status,
               NonTeachingAppraisal.submitted_at)
        .where(
            NonTeachingAppraisal.staff_email.in_(nt_emails),
            NonTeachingAppraisal.academic_year == academic_year
        )
    )
    for email, status, submitted_at in nt_res.all():
        nt_status_map[email] = (status, submitted_at)

# Then when building each `sub` dict, override status for NT roles:
for sub in subordinates:
    if sub["appraisal_role"] in NT_ROLES and sub["email"] in nt_status_map:
        nt_s, nt_at = nt_status_map[sub["email"]]
        sub["status"]       = nt_s
        sub["submitted_at"] = nt_at.isoformat() if nt_at else None
```

**Expected NT status values** (from `non_teaching_appraisals.status` constraint):

| Status | Meaning |
|---|---|
| `Draft` | Started, not yet submitted |
| `Pending RO Review` | Submitted to Reporting Officer |
| `Pending Registrar Review` | Submitted directly to Registrar (skip RO) |
| `Reporting Officer Reviewed` | RO done — with Registrar |
| `Registrar Reviewed` | Registrar done — with VC |
| `VC Approved` | Fully approved |

---

## Fix 3 — Reporting Officers & Registrars endpoint

**File:** `src/api/v1/admin.py`

The admin UI (`AddFacultyPage`) calls two endpoints when assigning approvers to new NT staff:

- `GET /api/v1/admin/reporting-officers`
- `GET /api/v1/admin/registrars`

These may or may not already exist. If missing, add them:

```python
@router.get("/reporting-officers")
async def list_reporting_officers(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """Returns all users with appraisal_role = reporting_officer."""
    result = await db.execute(
        select(FacultyProfile)
        .where(FacultyProfile.appraisal_role == "reporting_officer")
        .order_by(FacultyProfile.full_name)
    )
    profiles = result.scalars().all()
    return [
        {
            "email":      p.email,
            "full_name":  p.full_name,
            "school":     p.school,
            "department": p.department,
        }
        for p in profiles
    ]


@router.get("/registrars")
async def list_registrars(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """Returns all users with appraisal_role = registrar."""
    result = await db.execute(
        select(FacultyProfile)
        .where(FacultyProfile.appraisal_role == "registrar")
        .order_by(FacultyProfile.full_name)
    )
    profiles = result.scalars().all()
    return [
        {
            "email":      p.email,
            "full_name":  p.full_name,
            "school":     p.school,
            "department": p.department,
        }
        for p in profiles
    ]
```

---

## Feature 4 — Dynamic NT Workflow Templates

This is the main feature enabling the admin UI's dynamic approval chain. Instead of the frontend hardcoding "Reporting Officer → Registrar → VC", the approval chain is fetched from a database-backed config table and can include any designation (Data Analyst, Placement Officer, Exam Coordinator, etc.).

### 4a — Migration: create `nt_workflow_templates` table

Create file: `migrations/016_nt_workflow_templates.sql`

```sql
-- Migration 016: NT workflow template table
-- Stores configurable approval chains for non-teaching appraisals.
-- Each row is one approval step in the chain for a given role.

CREATE TABLE public.nt_workflow_templates (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nt_role        VARCHAR     NOT NULL,          -- 'non_teaching_staff' | 'reporting_officer' | 'registrar'
    reports_directly BOOLEAN  NOT NULL DEFAULT false,  -- true = skip-RO variant
    step_no        INTEGER     NOT NULL,
    designation    VARCHAR     NOT NULL,          -- e.g. 'Data Analyst', 'VC', 'Placement Officer'
    reviewer_role  VARCHAR,                       -- internal role that performs this step (optional)
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now(),
    UNIQUE (nt_role, reports_directly, step_no)
);

-- Seed: default chains matching current hardcoded behaviour.
-- Update these rows to change the approval chain — no code changes needed.

INSERT INTO public.nt_workflow_templates (nt_role, reports_directly, step_no, designation, reviewer_role) VALUES
-- non_teaching_staff, standard flow
('non_teaching_staff', false, 1, 'Reporting Officer', 'reporting_officer'),
('non_teaching_staff', false, 2, 'Registrar',         'registrar'),
('non_teaching_staff', false, 3, 'VC',                'vc'),
-- non_teaching_staff, direct-to-registrar
('non_teaching_staff', true,  1, 'Registrar',         'registrar'),
('non_teaching_staff', true,  2, 'VC',                'vc'),
-- reporting_officer
('reporting_officer',  false, 1, 'Registrar',         'registrar'),
('reporting_officer',  false, 2, 'VC',                'vc'),
-- registrar
('registrar',          false, 1, 'VC',                'vc');
```

### 4b — SQLAlchemy model

Add to `src/models/non_teaching.py`:

```python
class NTWorkflowTemplate(Base):
    __tablename__ = "nt_workflow_templates"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nt_role          = Column(String, nullable=False)
    reports_directly = Column(Boolean, nullable=False, default=False)
    step_no          = Column(Integer, nullable=False)
    designation      = Column(String, nullable=False)
    reviewer_role    = Column(String, nullable=True)
    created_at       = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at       = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
```

### 4c — API endpoints

Add to `src/api/v1/non_teaching.py`:

```python
from src.models.non_teaching import NTWorkflowTemplate

@router.get("/workflow-template")
async def get_workflow_template(
    role:             str  = Query(...),
    reports_directly: bool = Query(False),
    current_user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the configured approval chain for a given NT role.
    Called by the admin UI when adding a new NT staff member to preview
    the approval journey.

    Response shape:
    {
        "workflowName": "Non Teaching Flow",
        "steps": [
            { "stepNo": 1, "designation": "Data Analyst", "status": "WAITING" },
            ...
        ]
    }
    """
    result = await db.execute(
        select(NTWorkflowTemplate)
        .where(
            NTWorkflowTemplate.nt_role == role,
            NTWorkflowTemplate.reports_directly == reports_directly,
        )
        .order_by(NTWorkflowTemplate.step_no)
    )
    templates = result.scalars().all()

    return {
        "workflowName": "Non Teaching Approval Flow",
        "steps": [
            {
                "stepNo":      t.step_no,
                "designation": t.designation,
                "status":      "WAITING",
            }
            for t in templates
        ],
    }


@router.get("/workflow/{email}")
async def get_workflow_for_staff(
    email:         str,
    academic_year: str = Query(...),
    current_user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the live workflow status for a specific NT staff member.
    Combines the template steps with the actual appraisal status to
    determine which step is current and which are done.

    Response shape (same as frontend spec):
    {
        "workflowId":   "<appraisal_uuid>",
        "workflowName": "Non Teaching Approval Flow",
        "currentStep":  2,
        "status":       "PENDING",
        "steps": [
            { "stepNo": 1, "designation": "Reporting Officer", "status": "APPROVED"  },
            { "stepNo": 2, "designation": "Data Analyst",      "status": "PENDING"   },
            { "stepNo": 3, "designation": "VC",                "status": "WAITING"   }
        ]
    }
    """
    # Fetch staff profile to determine flow variant
    profile_res = await db.execute(
        select(FacultyProfile).where(FacultyProfile.email == email)
    )
    profile = profile_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Staff not found")

    # Fetch the live appraisal record
    appraisal_res = await db.execute(
        select(NonTeachingAppraisal).where(
            NonTeachingAppraisal.staff_email == email,
            NonTeachingAppraisal.academic_year == academic_year,
        )
    )
    appraisal = appraisal_res.scalar_one_or_none()

    # Fetch the configured workflow template for this role
    templates_res = await db.execute(
        select(NTWorkflowTemplate)
        .where(
            NTWorkflowTemplate.nt_role == profile.appraisal_role,
            NTWorkflowTemplate.reports_directly == (profile.reports_to_registrar or False),
        )
        .order_by(NTWorkflowTemplate.step_no)
    )
    templates = templates_res.scalars().all()

    if not appraisal:
        return {
            "workflowId":   None,
            "workflowName": "Non Teaching Approval Flow",
            "currentStep":  None,
            "status":       "NOT_STARTED",
            "steps": [{"stepNo": t.step_no, "designation": t.designation, "status": "WAITING"} for t in templates],
        }

    # Map appraisal status string → which step number is currently active
    STATUS_TO_CURRENT_STEP = {
        "Pending RO Review":          1,
        "Draft":                      1,
        "Pending Registrar Review":   2 if profile.reports_to_registrar else 2,
        "Reporting Officer Reviewed": 2,
        "Registrar Reviewed":         len(templates),  # last step = VC
        "VC Approved":                None,             # all done
    }

    current_step = STATUS_TO_CURRENT_STEP.get(appraisal.status)
    overall_status = "COMPLETED" if appraisal.status == "VC Approved" else "PENDING"

    # Determine per-step status
    step_statuses = []
    for t in templates:
        if current_step is None:
            # All done
            step_statuses.append("APPROVED")
        elif t.step_no < current_step:
            step_statuses.append("APPROVED")
        elif t.step_no == current_step:
            step_statuses.append("PENDING")
        else:
            step_statuses.append("WAITING")

    return {
        "workflowId":   str(appraisal.id),
        "workflowName": "Non Teaching Approval Flow",
        "currentStep":  current_step,
        "status":       overall_status,
        "steps": [
            {
                "stepNo":      t.step_no,
                "designation": t.designation,
                "status":      step_statuses[i],
            }
            for i, t in enumerate(templates)
        ],
    }
```

### 4d — Optional: Admin CRUD endpoints for workflow config

If you want the admin UI to let the super_admin reconfigure approval chains (future feature), add these to `src/api/v1/admin.py`:

```python
from src.models.non_teaching import NTWorkflowTemplate

@router.get("/workflow-templates")
async def list_workflow_templates(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """List all NT workflow templates."""
    _require_super_admin(current_user)
    result = await db.execute(
        select(NTWorkflowTemplate).order_by(
            NTWorkflowTemplate.nt_role,
            NTWorkflowTemplate.reports_directly,
            NTWorkflowTemplate.step_no
        )
    )
    return result.scalars().all()


@router.put("/workflow-templates/{template_id}")
async def update_workflow_step(
    template_id: str,
    data: dict,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """Update the designation of one workflow step."""
    _require_super_admin(current_user)
    result = await db.execute(
        select(NTWorkflowTemplate).where(NTWorkflowTemplate.id == template_id)
    )
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template step not found")
    if "designation" in data:
        tpl.designation = data["designation"]
    await db.commit()
    return tpl


def _require_super_admin(current_user):
    if not any(r in current_user.roles for r in ("admin", "super_admin")):
        raise HTTPException(status_code=403, detail="Admin role required")
```

### 4e — Register the router

In `src/main.py`, verify `non_teaching.router` is already included. If the new endpoints above are in a separate file, include it. Otherwise they are already covered since they are added directly to the existing `non_teaching.router`.

---

## Summary table

| # | File | Change | Priority |
|---|---|---|---|
| 1 | `src/api/v1/feedback.py` line 65 | Allow `super_admin` in `_require_admin` | P0 — one line |
| 2 | `src/api/v1/dashboard.py` | Also read `non_teaching_appraisals` status for NT staff in `/subordinates` | P1 — NT pipeline tracking |
| 3 | `src/api/v1/admin.py` | Add `GET /admin/reporting-officers` and `GET /admin/registrars` if missing | P1 — NT user creation |
| 4a | `migrations/016_nt_workflow_templates.sql` | New table + seed data | P2 — dynamic workflow |
| 4b | `src/models/non_teaching.py` | Add `NTWorkflowTemplate` model | P2 — dynamic workflow |
| 4c | `src/api/v1/non_teaching.py` | Add `GET /non-teaching/workflow-template` and `GET /non-teaching/workflow/{email}` | P2 — dynamic workflow |
| 4d | `src/api/v1/admin.py` | CRUD endpoints for workflow template config | P3 — optional future feature |

---

## Frontend API calls that need these endpoints

| Frontend call | Needs backend change |
|---|---|
| `api.feedback.list()` on Feedback page | Fix 1 (super_admin 403) |
| `api.marks.list()` → NT pipeline in Appraisal Cycle | Fix 2 (NT status in subordinates) |
| `api.users.reportingOfficers()` in Add User | Fix 3 |
| `api.users.registrars()` in Add User | Fix 3 |
| `api.workflow.getTemplate(role, direct)` in Add User | Feature 4c |
| `api.workflow.getForFaculty(email, year)` (future) | Feature 4c |
