# Backend Changes Required — Dynamic NT Workflow System

**Requested by:** Admin UI team  
**Date:** 2026-05-20  
**Priority order:** Migration → Models → Admin CRUD (Designations) → Admin CRUD (Templates) → Assignment → Review routing → Workflow instance

---

## Overview

The admin UI now has two new pages:
- `/panel/workflow/designations` — CRUD for approval designations
- `/panel/workflow/templates` — CRUD for workflow templates + steps + assignments

These pages call **new backend endpoints** that do not exist yet. This document specifies every endpoint, model, and migration needed.

The goal is to replace the hardcoded `Reporting Officer → Registrar → VC` flow with a fully configurable chain. Any designation name can be an approval step. No code changes are needed to add new approver types — only database rows.

---

## Migration 017 — Create all NT workflow tables

**File:** `migrations/017_nt_workflow_system.sql`

```sql
-- Migration 017: Dynamic NT Workflow System
-- Replaces hardcoded RO→Registrar→VC flow with a fully configurable chain.
-- Run this ONCE on the database before deploying the new API code.

-- ── 1. Designations catalog ─────────────────────────────────────────────────
CREATE TABLE public.nt_designations (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR     NOT NULL UNIQUE,
    description VARCHAR,
    is_system   BOOLEAN     NOT NULL DEFAULT false,   -- system rows cannot be deleted
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Workflow templates ────────────────────────────────────────────────────
CREATE TABLE public.nt_workflow_templates (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR     NOT NULL,
    description VARCHAR,
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    is_default  BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 3. Workflow template steps ───────────────────────────────────────────────
CREATE TABLE public.nt_workflow_template_steps (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID        NOT NULL REFERENCES public.nt_workflow_templates(id) ON DELETE CASCADE,
    step_no         INTEGER     NOT NULL,
    designation_id  UUID        NOT NULL REFERENCES public.nt_designations(id),
    is_required     BOOLEAN     NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (template_id, step_no)
);

-- ── 4. Template assignments (priority: individual > department > role) ───────
CREATE TABLE public.nt_workflow_assignments (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID        NOT NULL REFERENCES public.nt_workflow_templates(id),
    staff_email     VARCHAR     UNIQUE,      -- individual override
    appraisal_role  VARCHAR,                 -- role-level default
    department      VARCHAR,                 -- department-level default
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_one_target CHECK (
        (staff_email IS NOT NULL)::int
      + (appraisal_role IS NOT NULL)::int
      + (department IS NOT NULL)::int = 1
    )
);

-- ── 5. Workflow instances (one per appraisal submission) ─────────────────────
CREATE TABLE public.nt_workflow_instances (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    appraisal_id    UUID        NOT NULL REFERENCES public.non_teaching_appraisals(id) ON DELETE CASCADE,
    template_id     UUID        REFERENCES public.nt_workflow_templates(id),
    staff_email     VARCHAR     NOT NULL,
    academic_year   VARCHAR     NOT NULL,
    current_step    INTEGER,
    status          VARCHAR     NOT NULL DEFAULT 'PENDING',   -- PENDING | COMPLETED | REJECTED
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (staff_email, academic_year)
);

-- ── 6. Workflow instance steps ───────────────────────────────────────────────
CREATE TABLE public.nt_workflow_instance_steps (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id     UUID        NOT NULL REFERENCES public.nt_workflow_instances(id) ON DELETE CASCADE,
    step_no         INTEGER     NOT NULL,
    designation     VARCHAR     NOT NULL,     -- snapshot of designation name at submission time
    reviewer_email  VARCHAR,
    status          VARCHAR     NOT NULL DEFAULT 'WAITING',   -- WAITING | PENDING | APPROVED | REJECTED
    score           NUMERIC,
    remarks         TEXT,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (instance_id, step_no)
);

-- ── Seed: system designations ────────────────────────────────────────────────
INSERT INTO public.nt_designations (name, description, is_system) VALUES
('Reporting Officer', 'First approver for non-teaching staff appraisals', true),
('Registrar',         'Reviews after Reporting Officer',                   true),
('VC',                'Final approver — Vice Chancellor',                  true);

-- ── Seed: two default workflow templates ────────────────────────────────────
-- Standard flow (matches existing hardcoded flow)
WITH t AS (
    INSERT INTO public.nt_workflow_templates (name, description, is_default)
    VALUES ('Standard NT Flow', 'Reporting Officer → Registrar → VC', true)
    RETURNING id
)
INSERT INTO public.nt_workflow_template_steps (template_id, step_no, designation_id)
SELECT t.id, s.step_no, d.id
  FROM t,
       (VALUES (1,'Reporting Officer'), (2,'Registrar'), (3,'VC')) AS s(step_no, name)
  JOIN public.nt_designations d ON d.name = s.name;

-- Direct-to-registrar flow (for staff with reports_to_registrar = true)
WITH t AS (
    INSERT INTO public.nt_workflow_templates (name, description, is_default)
    VALUES ('Direct to Registrar', 'Registrar → VC (skips Reporting Officer)', false)
    RETURNING id
)
INSERT INTO public.nt_workflow_template_steps (template_id, step_no, designation_id)
SELECT t.id, s.step_no, d.id
  FROM t,
       (VALUES (1,'Registrar'), (2,'VC')) AS s(step_no, name)
  JOIN public.nt_designations d ON d.name = s.name;

-- Default assignments for existing NT roles (maps existing hardcoded behaviour)
INSERT INTO public.nt_workflow_assignments (template_id, appraisal_role)
SELECT id, 'non_teaching_staff' FROM public.nt_workflow_templates WHERE name = 'Standard NT Flow';

INSERT INTO public.nt_workflow_assignments (template_id, appraisal_role)
SELECT id, 'reporting_officer' FROM public.nt_workflow_templates WHERE name = 'Standard NT Flow';

INSERT INTO public.nt_workflow_assignments (template_id, appraisal_role)
SELECT id, 'registrar' FROM public.nt_workflow_templates WHERE name = 'Standard NT Flow';
```

---

## Models — `src/models/non_teaching.py`

Add these 5 classes **after** the existing `NonTeachingPartBRating` class:

```python
from sqlalchemy import Column, String, Boolean, Integer, Numeric, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime


class NTDesignation(Base):
    __tablename__ = "nt_designations"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name        = Column(String, nullable=False, unique=True)
    description = Column(String)
    is_system   = Column(Boolean, nullable=False, default=False)
    is_active   = Column(Boolean, nullable=False, default=True)
    created_at  = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at  = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    steps = relationship("NTWorkflowTemplateStep", back_populates="designation_obj")


class NTWorkflowTemplate(Base):
    __tablename__ = "nt_workflow_templates"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name        = Column(String, nullable=False)
    description = Column(String)
    is_active   = Column(Boolean, nullable=False, default=True)
    is_default  = Column(Boolean, nullable=False, default=False)
    created_at  = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at  = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    steps       = relationship("NTWorkflowTemplateStep", back_populates="template",
                               order_by="NTWorkflowTemplateStep.step_no",
                               cascade="all, delete-orphan")
    assignments = relationship("NTWorkflowAssignment", back_populates="template")
    instances   = relationship("NTWorkflowInstance",   back_populates="template")


class NTWorkflowTemplateStep(Base):
    __tablename__ = "nt_workflow_template_steps"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id    = Column(UUID(as_uuid=True), ForeignKey("nt_workflow_templates.id", ondelete="CASCADE"), nullable=False)
    step_no        = Column(Integer, nullable=False)
    designation_id = Column(UUID(as_uuid=True), ForeignKey("nt_designations.id"), nullable=False)
    is_required    = Column(Boolean, nullable=False, default=True)
    created_at     = Column(DateTime(timezone=True), default=datetime.utcnow)

    template        = relationship("NTWorkflowTemplate",  back_populates="steps")
    designation_obj = relationship("NTDesignation",       back_populates="steps")


class NTWorkflowAssignment(Base):
    __tablename__ = "nt_workflow_assignments"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id    = Column(UUID(as_uuid=True), ForeignKey("nt_workflow_templates.id"), nullable=False)
    staff_email    = Column(String, unique=True)
    appraisal_role = Column(String)
    department     = Column(String)
    created_at     = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at     = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    template = relationship("NTWorkflowTemplate", back_populates="assignments")


class NTWorkflowInstance(Base):
    __tablename__ = "nt_workflow_instances"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appraisal_id  = Column(UUID(as_uuid=True), ForeignKey("non_teaching_appraisals.id", ondelete="CASCADE"), nullable=False)
    template_id   = Column(UUID(as_uuid=True), ForeignKey("nt_workflow_templates.id"))
    staff_email   = Column(String, nullable=False)
    academic_year = Column(String, nullable=False)
    current_step  = Column(Integer)
    status        = Column(String, nullable=False, default="PENDING")
    created_at    = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at    = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    template       = relationship("NTWorkflowTemplate", back_populates="instances")
    instance_steps = relationship("NTWorkflowInstanceStep", back_populates="instance",
                                  order_by="NTWorkflowInstanceStep.step_no",
                                  cascade="all, delete-orphan")


class NTWorkflowInstanceStep(Base):
    __tablename__ = "nt_workflow_instance_steps"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instance_id    = Column(UUID(as_uuid=True), ForeignKey("nt_workflow_instances.id", ondelete="CASCADE"), nullable=False)
    step_no        = Column(Integer, nullable=False)
    designation    = Column(String, nullable=False)   # snapshot — does not change if designation is renamed
    reviewer_email = Column(String)
    status         = Column(String, nullable=False, default="WAITING")
    score          = Column(Numeric)
    remarks        = Column(Text)
    reviewed_at    = Column(DateTime(timezone=True))
    created_at     = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at     = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    instance = relationship("NTWorkflowInstance", back_populates="instance_steps")
```

---

## Admin API Endpoints — `src/api/v1/admin.py`

Add imports at top of file:
```python
from src.models.non_teaching import (
    NTDesignation, NTWorkflowTemplate, NTWorkflowTemplateStep,
    NTWorkflowAssignment, NTWorkflowInstance
)
```

### Section A — Designations CRUD

```python
# ── Helper ────────────────────────────────────────────────────────────────────
def _designation_dict(d: NTDesignation) -> dict:
    return {
        "id":          str(d.id),
        "name":        d.name,
        "description": d.description,
        "is_system":   d.is_system,
        "is_active":   d.is_active,
        "created_at":  d.created_at,
    }


@router.get("/nt-designations")
async def list_designations(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """List all NT designations ordered by name."""
    _check_admin(current_user)
    result = await db.execute(
        select(NTDesignation).order_by(NTDesignation.is_system.desc(), NTDesignation.name)
    )
    return [_designation_dict(d) for d in result.scalars().all()]


class DesignationCreate(BaseModel):
    name:        str
    description: Optional[str] = None


class DesignationUpdate(BaseModel):
    name:        Optional[str]  = None
    description: Optional[str]  = None
    is_active:   Optional[bool] = None


@router.post("/nt-designations", status_code=201)
async def create_designation(
    current_user: CurrentUser,
    data: DesignationCreate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Designation name is required")

    existing = await db.execute(select(NTDesignation).where(NTDesignation.name == name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Designation '{name}' already exists")

    d = NTDesignation(name=name, description=data.description)
    db.add(d)
    await db.commit()
    await db.refresh(d)
    return _designation_dict(d)


@router.put("/nt-designations/{designation_id}")
async def update_designation(
    designation_id: str,
    current_user: CurrentUser,
    data: DesignationUpdate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(select(NTDesignation).where(NTDesignation.id == designation_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Designation not found")

    if data.name is not None:
        name = data.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Designation name cannot be empty")
        conflict = await db.execute(
            select(NTDesignation).where(NTDesignation.name == name, NTDesignation.id != designation_id)
        )
        if conflict.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Designation '{name}' already exists")
        d.name = name

    if data.description is not None:
        d.description = data.description
    if data.is_active is not None:
        d.is_active = data.is_active

    await db.commit()
    await db.refresh(d)
    return _designation_dict(d)


@router.delete("/nt-designations/{designation_id}")
async def delete_designation(
    designation_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(select(NTDesignation).where(NTDesignation.id == designation_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Designation not found")
    if d.is_system:
        raise HTTPException(status_code=400, detail="System designations cannot be deleted")

    # Safety check: is this designation used in any active template step?
    used = await db.execute(
        select(NTWorkflowTemplateStep)
        .join(NTWorkflowTemplate, NTWorkflowTemplateStep.template_id == NTWorkflowTemplate.id)
        .where(
            NTWorkflowTemplateStep.designation_id == designation_id,
            NTWorkflowTemplate.is_active == True,
        )
    )
    if used.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete: this designation is used in one or more active workflow templates. "
                   "Remove it from all templates first, or deactivate the designation instead."
        )

    await db.delete(d)
    await db.commit()
    return {"message": f"Designation '{d.name}' deleted"}
```

### Section B — Workflow Templates CRUD

```python
# ── Helper ────────────────────────────────────────────────────────────────────
def _template_dict(t: NTWorkflowTemplate) -> dict:
    return {
        "id":          str(t.id),
        "name":        t.name,
        "description": t.description,
        "is_active":   t.is_active,
        "is_default":  t.is_default,
        "created_at":  t.created_at,
        "steps": [
            {
                "id":             str(s.id),
                "step_no":        s.step_no,
                "designation_id": str(s.designation_id),
                "designation":    s.designation_obj.name if s.designation_obj else None,
                "is_required":    s.is_required,
            }
            for s in (t.steps or [])
        ],
    }


@router.get("/nt-workflow-templates")
async def list_workflow_templates(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """List all NT workflow templates with their steps."""
    _check_admin(current_user)
    result = await db.execute(
        select(NTWorkflowTemplate).order_by(NTWorkflowTemplate.is_default.desc(), NTWorkflowTemplate.name)
    )
    # Eagerly load steps + designation_obj
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(NTWorkflowTemplate)
        .options(
            selectinload(NTWorkflowTemplate.steps).selectinload(NTWorkflowTemplateStep.designation_obj)
        )
        .order_by(NTWorkflowTemplate.is_default.desc(), NTWorkflowTemplate.name)
    )
    return [_template_dict(t) for t in result.scalars().all()]


class TemplateCreate(BaseModel):
    name:        str
    description: Optional[str] = None


class TemplateUpdate(BaseModel):
    name:        Optional[str]  = None
    description: Optional[str]  = None
    is_active:   Optional[bool] = None


@router.post("/nt-workflow-templates", status_code=201)
async def create_workflow_template(
    current_user: CurrentUser,
    data: TemplateCreate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Template name is required")

    t = NTWorkflowTemplate(name=name, description=data.description)
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return {"id": str(t.id), "name": t.name, "description": t.description, "is_active": t.is_active, "is_default": t.is_default, "steps": []}


@router.put("/nt-workflow-templates/{template_id}")
async def update_workflow_template(
    template_id: str,
    current_user: CurrentUser,
    data: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(select(NTWorkflowTemplate).where(NTWorkflowTemplate.id == template_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(t, field, value)

    await db.commit()
    await db.refresh(t)
    return {"id": str(t.id), "name": t.name, "is_active": t.is_active, "is_default": t.is_default}


@router.delete("/nt-workflow-templates/{template_id}")
async def delete_workflow_template(
    template_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(select(NTWorkflowTemplate).where(NTWorkflowTemplate.id == template_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    if t.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete the default template. Set another template as default first.")

    await db.delete(t)
    await db.commit()
    return {"message": f"Template '{t.name}' deleted"}


@router.put("/nt-workflow-templates/{template_id}/set-default")
async def set_default_template(
    template_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(select(NTWorkflowTemplate).where(NTWorkflowTemplate.id == template_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    # Clear all other defaults first
    await db.execute(
        NTWorkflowTemplate.__table__.update().where(NTWorkflowTemplate.id != template_id).values(is_default=False)
    )
    t.is_default = True
    await db.commit()
    return {"message": f"'{t.name}' is now the default template"}
```

### Section C — Template Steps

```python
class StepCreate(BaseModel):
    designation_id: str
    step_no:        Optional[int]  = None   # if omitted, appended at end
    is_required:    bool           = True


class StepUpdate(BaseModel):
    designation_id: Optional[str]  = None
    is_required:    Optional[bool] = None


class ReorderRequest(BaseModel):
    # List of { step_no, designation } in desired order.
    # Backend reassigns step_no 1,2,3… in the order given.
    steps: List[dict]


@router.post("/nt-workflow-templates/{template_id}/steps", status_code=201)
async def add_template_step(
    template_id: str,
    current_user: CurrentUser,
    data: StepCreate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)

    # Validate template exists
    t_res = await db.execute(select(NTWorkflowTemplate).where(NTWorkflowTemplate.id == template_id))
    if not t_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Template not found")

    # Validate designation exists and is active
    d_res = await db.execute(select(NTDesignation).where(NTDesignation.id == data.designation_id))
    desig = d_res.scalar_one_or_none()
    if not desig:
        raise HTTPException(status_code=404, detail="Designation not found")
    if not desig.is_active:
        raise HTTPException(status_code=400, detail="Cannot add an inactive designation as a workflow step")

    # Determine step_no
    if data.step_no is not None:
        # Validate no duplicate step_no in this template
        dup = await db.execute(
            select(NTWorkflowTemplateStep).where(
                NTWorkflowTemplateStep.template_id == template_id,
                NTWorkflowTemplateStep.step_no == data.step_no,
            )
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Step number {data.step_no} already exists in this template")
        step_no = data.step_no
    else:
        # Append at end
        max_res = await db.execute(
            select(func.max(NTWorkflowTemplateStep.step_no))
            .where(NTWorkflowTemplateStep.template_id == template_id)
        )
        step_no = (max_res.scalar() or 0) + 1

    step = NTWorkflowTemplateStep(
        template_id=template_id,
        step_no=step_no,
        designation_id=data.designation_id,
        is_required=data.is_required,
    )
    db.add(step)
    await db.commit()
    await db.refresh(step)
    return {
        "step": {
            "id":          str(step.id),
            "step_no":     step.step_no,
            "designation": desig.name,
            "is_required": step.is_required,
        }
    }


@router.put("/nt-workflow-templates/{template_id}/steps/{step_no}")
async def update_template_step(
    template_id: str,
    step_no: int,
    current_user: CurrentUser,
    data: StepUpdate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(
        select(NTWorkflowTemplateStep).where(
            NTWorkflowTemplateStep.template_id == template_id,
            NTWorkflowTemplateStep.step_no == step_no,
        )
    )
    step = result.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    if data.designation_id is not None:
        d_res = await db.execute(select(NTDesignation).where(NTDesignation.id == data.designation_id))
        desig = d_res.scalar_one_or_none()
        if not desig or not desig.is_active:
            raise HTTPException(status_code=404, detail="Designation not found or inactive")
        step.designation_id = data.designation_id

    if data.is_required is not None:
        step.is_required = data.is_required

    await db.commit()
    return {"message": "Step updated"}


@router.delete("/nt-workflow-templates/{template_id}/steps/{step_no}")
async def remove_template_step(
    template_id: str,
    step_no: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(
        select(NTWorkflowTemplateStep).where(
            NTWorkflowTemplateStep.template_id == template_id,
            NTWorkflowTemplateStep.step_no == step_no,
        )
    )
    step = result.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    # Check remaining steps count
    count_res = await db.execute(
        select(func.count()).where(NTWorkflowTemplateStep.template_id == template_id)
    )
    if (count_res.scalar() or 0) <= 1:
        raise HTTPException(status_code=400, detail="A workflow template must have at least one step")

    await db.delete(step)
    await db.commit()
    return {"message": "Step removed"}


@router.put("/nt-workflow-templates/{template_id}/reorder")
async def reorder_template_steps(
    template_id: str,
    current_user: CurrentUser,
    data: ReorderRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Reorder steps. Request body: { "steps": [{"step_no": 1, "designation": "RO"}, ...] }
    The backend renumbers steps 1, 2, 3… in the given order.
    """
    _check_admin(current_user)
    existing = await db.execute(
        select(NTWorkflowTemplateStep).where(NTWorkflowTemplateStep.template_id == template_id)
    )
    steps = existing.scalars().all()
    if not steps:
        raise HTTPException(status_code=404, detail="Template not found or has no steps")

    # Build a map: old_step_no → step object
    step_map = {s.step_no: s for s in steps}

    # Reassign step_no based on request order
    for new_no, item in enumerate(data.steps, start=1):
        old_no = item.get("step_no")
        if old_no in step_map:
            step_map[old_no].step_no = new_no + 1000   # temp to avoid unique constraint
        
    await db.flush()
    for new_no, item in enumerate(data.steps, start=1):
        old_no = item.get("step_no")
        if old_no in step_map:
            step_map[old_no].step_no = new_no

    await db.commit()
    return {"message": "Steps reordered"}
```

### Section D — Workflow Assignments

```python
@router.get("/nt-workflow-assignments")
async def list_assignments(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    _check_admin(current_user)
    result = await db.execute(
        select(NTWorkflowAssignment, NTWorkflowTemplate)
        .join(NTWorkflowTemplate, NTWorkflowAssignment.template_id == NTWorkflowTemplate.id)
        .order_by(NTWorkflowAssignment.created_at.desc())
    )
    return [
        {
            "id":             str(a.id),
            "template_id":    str(a.template_id),
            "template_name":  t.name,
            "staff_email":    a.staff_email,
            "appraisal_role": a.appraisal_role,
            "department":     a.department,
        }
        for a, t in result.all()
    ]


class AssignmentCreate(BaseModel):
    template_id:    str
    staff_email:    Optional[str] = None
    appraisal_role: Optional[str] = None
    department:     Optional[str] = None


@router.post("/nt-workflow-assignments", status_code=201)
async def create_assignment(
    current_user: CurrentUser,
    data: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)

    # Exactly one target must be set
    targets = [x for x in [data.staff_email, data.appraisal_role, data.department] if x]
    if len(targets) != 1:
        raise HTTPException(status_code=400, detail="Provide exactly one of: staff_email, appraisal_role, department")

    # Validate template exists
    t_res = await db.execute(select(NTWorkflowTemplate).where(NTWorkflowTemplate.id == data.template_id))
    if not t_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Template not found")

    # Check for duplicate (individual override is enforced by unique constraint, but others need manual check)
    q = select(NTWorkflowAssignment).where(NTWorkflowAssignment.template_id == data.template_id)
    if data.appraisal_role:
        q = q.where(NTWorkflowAssignment.appraisal_role == data.appraisal_role)
    elif data.department:
        q = q.where(NTWorkflowAssignment.department == data.department)

    dup = await db.execute(q)
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An assignment for this target already exists")

    a = NTWorkflowAssignment(
        template_id=data.template_id,
        staff_email=data.staff_email,
        appraisal_role=data.appraisal_role,
        department=data.department,
    )
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return {"id": str(a.id), "template_id": str(a.template_id)}


@router.delete("/nt-workflow-assignments/{assignment_id}")
async def delete_assignment(
    assignment_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    result = await db.execute(select(NTWorkflowAssignment).where(NTWorkflowAssignment.id == assignment_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.delete(a)
    await db.commit()
    return {"message": "Assignment removed"}
```

---

## Non-Teaching API — `src/api/v1/non_teaching.py`

### Add imports

```python
from src.models.non_teaching import (
    NTWorkflowTemplate, NTWorkflowTemplateStep, NTWorkflowAssignment,
    NTWorkflowInstance, NTWorkflowInstanceStep, NTDesignation
)
from sqlalchemy.orm import selectinload
```

### Helper: resolve template for a staff member

```python
async def _resolve_template(db: AsyncSession, staff_email: str, appraisal_role: str, department: str) -> NTWorkflowTemplate | None:
    """
    Returns the workflow template for a given staff member.
    Priority: individual > department > role > default
    """
    # 1. Individual override
    res = await db.execute(
        select(NTWorkflowAssignment)
        .options(selectinload(NTWorkflowAssignment.template).selectinload(NTWorkflowTemplate.steps).selectinload(NTWorkflowTemplateStep.designation_obj))
        .where(NTWorkflowAssignment.staff_email == staff_email)
    )
    a = res.scalar_one_or_none()
    if a:
        return a.template

    # 2. Department match
    if department:
        res = await db.execute(
            select(NTWorkflowAssignment)
            .options(selectinload(NTWorkflowAssignment.template).selectinload(NTWorkflowTemplate.steps).selectinload(NTWorkflowTemplateStep.designation_obj))
            .where(NTWorkflowAssignment.department == department)
        )
        a = res.scalar_one_or_none()
        if a:
            return a.template

    # 3. Role match
    res = await db.execute(
        select(NTWorkflowAssignment)
        .options(selectinload(NTWorkflowAssignment.template).selectinload(NTWorkflowTemplate.steps).selectinload(NTWorkflowTemplateStep.designation_obj))
        .where(NTWorkflowAssignment.appraisal_role == appraisal_role)
    )
    a = res.scalar_one_or_none()
    if a:
        return a.template

    # 4. Default template
    res = await db.execute(
        select(NTWorkflowTemplate)
        .options(selectinload(NTWorkflowTemplate.steps).selectinload(NTWorkflowTemplateStep.designation_obj))
        .where(NTWorkflowTemplate.is_default == True, NTWorkflowTemplate.is_active == True)
    )
    return res.scalar_one_or_none()
```

### `GET /non-teaching/workflow-template` — preview template for a role

```python
@router.get("/workflow-template")
async def get_workflow_template(
    role: str = Query(...),
    reports_directly: bool = Query(False),
    current_user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Returns the configured approval chain for a given NT role (used by admin Add User preview)."""
    # Try to find template assigned to this role
    template = await _resolve_template(db, staff_email=None, appraisal_role=role, department=None)

    if not template:
        return {"workflowName": "Non Teaching Approval Flow", "steps": []}

    return {
        "workflowName": template.name,
        "steps": [
            {
                "stepNo":      s.step_no,
                "designation": s.designation_obj.name if s.designation_obj else "Unknown",
                "status":      "WAITING",
            }
            for s in (template.steps or [])
        ],
    }
```

### `GET /non-teaching/workflow/{email}` — live workflow for a staff member

```python
@router.get("/workflow/{email}")
async def get_workflow_for_staff(
    email: str,
    academic_year: str = Query(...),
    current_user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns live workflow status for a specific NT staff member.
    Frontend contract:
    {
        "workflowId": "<uuid>",
        "workflowName": "...",
        "currentStep": 2,
        "status": "PENDING",
        "steps": [{ "stepNo": 1, "designation": "RO", "status": "APPROVED" }, ...]
    }
    """
    # Fetch staff profile
    profile_res = await db.execute(select(FacultyProfile).where(FacultyProfile.email == email))
    profile = profile_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Staff not found")

    # Fetch workflow instance
    inst_res = await db.execute(
        select(NTWorkflowInstance)
        .options(selectinload(NTWorkflowInstance.instance_steps))
        .where(NTWorkflowInstance.staff_email == email, NTWorkflowInstance.academic_year == academic_year)
    )
    instance = inst_res.scalar_one_or_none()

    if not instance:
        # No workflow instance — fall back to template preview
        template = await _resolve_template(db, email, profile.appraisal_role, profile.department)
        return {
            "workflowId":   None,
            "workflowName": template.name if template else "Non Teaching Approval Flow",
            "currentStep":  None,
            "status":       "NOT_STARTED",
            "steps": [
                {"stepNo": s.step_no, "designation": s.designation_obj.name if s.designation_obj else "?", "status": "WAITING"}
                for s in (template.steps if template else [])
            ],
        }

    isteps = sorted(instance.instance_steps, key=lambda s: s.step_no)
    return {
        "workflowId":   str(instance.id),
        "workflowName": "Non Teaching Approval Flow",
        "currentStep":  instance.current_step,
        "status":       instance.status,
        "steps": [
            {
                "stepNo":      s.step_no,
                "designation": s.designation,
                "status":      s.status,
            }
            for s in isteps
        ],
    }
```

### Update `PUT /non-teaching/appraisal` — create workflow instance on submission

Add after `crud.create_or_update_non_teaching_appraisal` call:

```python
# When staff first submits (status leaves Draft), create the workflow instance
submitted_statuses = {'Pending RO Review', 'Pending Registrar Review'}
if data.get('status') in submitted_statuses:
    existing_instance = await db.execute(
        select(NTWorkflowInstance).where(
            NTWorkflowInstance.staff_email == current_user.email,
            NTWorkflowInstance.academic_year == data.get('academic_year'),
        )
    )
    if not existing_instance.scalar_one_or_none():
        profile_res = await db.execute(select(FacultyProfile).where(FacultyProfile.email == current_user.email))
        profile = profile_res.scalar_one_or_none()
        template = await _resolve_template(db, current_user.email, profile.appraisal_role if profile else None, profile.department if profile else None)

        if template and template.steps:
            instance = NTWorkflowInstance(
                appraisal_id=appraisal.id,
                template_id=template.id,
                staff_email=current_user.email,
                academic_year=data.get('academic_year'),
                current_step=template.steps[0].step_no,
                status="PENDING",
            )
            db.add(instance)
            await db.flush()

            for step in template.steps:
                db.add(NTWorkflowInstanceStep(
                    instance_id=instance.id,
                    step_no=step.step_no,
                    designation=step.designation_obj.name if step.designation_obj else "?",
                    status="PENDING" if step.step_no == template.steps[0].step_no else "WAITING",
                ))
            await db.commit()
```

### Update `PUT /non-teaching/review/{email}` — advance workflow on review

After updating the appraisal status, add:

```python
# Advance the workflow instance step
inst_res = await db.execute(
    select(NTWorkflowInstance)
    .options(selectinload(NTWorkflowInstance.instance_steps))
    .where(NTWorkflowInstance.staff_email == email, NTWorkflowInstance.academic_year == academic_year)
)
instance = inst_res.scalar_one_or_none()
if instance:
    # Mark current step as APPROVED
    for istep in instance.instance_steps:
        if istep.step_no == instance.current_step:
            istep.status = "APPROVED"
            istep.reviewer_email = current_user.email
            istep.reviewed_at = datetime.utcnow()
            if 'total_score' in data:
                istep.score = data['total_score']
            break

    # Find next WAITING step
    waiting = sorted([s for s in instance.instance_steps if s.status == "WAITING"], key=lambda s: s.step_no)
    if waiting:
        next_step = waiting[0]
        next_step.status = "PENDING"
        instance.current_step = next_step.step_no
    else:
        # All steps done
        instance.current_step = None
        instance.status = "COMPLETED"

    instance.updated_at = datetime.utcnow()
    await db.commit()
```

### Update `/non-teaching/subordinates` — filter by reviewer's designation

Replace the current role-based filtering with designation-based matching:

```python
@router.get("/subordinates")
async def get_non_teaching_subordinates(
    academic_year: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns NT appraisals visible to the current reviewer.
    Matching logic:
      1. If current user has a designation, show appraisals where the pending
         workflow step designation matches the reviewer's designation.
      2. Fall back to role-based filtering for reviewers without a designation.
    """
    query = select(NonTeachingAppraisal, FacultyProfile).join(
        FacultyProfile, NonTeachingAppraisal.staff_email == FacultyProfile.email
    ).where(NonTeachingAppraisal.academic_year == academic_year)

    # Role-based access gate (unchanged)
    if not any(r in current_user.roles for r in ("registrar", "vc", "reporting_officer", "admin", "super_admin")):
        return []

    if "reporting_officer" in current_user.roles and not any(r in current_user.roles for r in ("registrar", "vc", "admin", "super_admin")):
        query = query.where(
            FacultyProfile.reporting_officer_email == current_user.email,
            FacultyProfile.reports_to_registrar == False,
        )

    result = await db.execute(query)
    rows = result.all()

    # If this reviewer has a designation, filter to only their pending steps
    reviewer_designation = current_user.designation  # FacultyProfile.designation on the logged-in user

    subordinates = []
    for appr, profile in rows:
        # Check workflow instance for designation-based routing
        inst_res = await db.execute(
            select(NTWorkflowInstance)
            .options(selectinload(NTWorkflowInstance.instance_steps))
            .where(
                NTWorkflowInstance.staff_email == appr.staff_email,
                NTWorkflowInstance.academic_year == academic_year,
            )
        )
        instance = inst_res.scalar_one_or_none()

        if instance and reviewer_designation:
            # Only show if current pending step designation matches reviewer's designation
            pending = next((s for s in instance.instance_steps if s.status == "PENDING"), None)
            if not pending or pending.designation != reviewer_designation:
                continue

        subordinates.append({
            "staff_email":    appr.staff_email,
            "name":           profile.full_name,
            "designation":    profile.designation,
            "department":     profile.department,
            "appraisalRole":  profile.appraisal_role,
            "status":         appr.status,
            "submittedOn":    appr.submitted_at.date() if appr.submitted_at else None,
            "selfTotal":      appr.self_total,
            "roTotal":        appr.ro_total or 0,
            "registrarTotal": appr.registrar_total or 0,
            "vcTotal":        appr.vc_total or 0,
            "payload":        appr.payload,
        })

    return subordinates
```

---

## Dashboard API — `src/api/v1/dashboard.py`

### Fix: include NT appraisal status in `/dashboard/subordinates`

This is **Fix 2** from the earlier `BACKEND_CHANGES_REQUIRED.md`. NT staff do not have `Declaration` records, so `status` is always `"pending"`. Fix by also querying `NonTeachingAppraisal`:

```python
# After the existing `result = await db.execute(query)` call,
# add NT status overrides:

from src.models.non_teaching import NonTeachingAppraisal

NT_ROLES = {'non_teaching_staff', 'reporting_officer', 'registrar'}

nt_emails = [fp.email for fp, _ in rows if fp.appraisal_role in NT_ROLES]
nt_status_map = {}
if nt_emails:
    nt_res = await db.execute(
        select(NonTeachingAppraisal.staff_email, NonTeachingAppraisal.status, NonTeachingAppraisal.submitted_at)
        .where(
            NonTeachingAppraisal.staff_email.in_(nt_emails),
            NonTeachingAppraisal.academic_year == academic_year,
        )
    )
    for email, status, submitted_at in nt_res.all():
        nt_status_map[email] = (status, submitted_at)

# Then when building each sub dict, override status for NT staff:
for sub in subordinates:
    if sub["appraisal_role"] in NT_ROLES and sub["email"] in nt_status_map:
        nt_s, nt_at = nt_status_map[sub["email"]]
        sub["status"]       = nt_s
        sub["submitted_at"] = nt_at.isoformat() if nt_at else None
```

---

## Feedback API — `src/api/v1/feedback.py`

### Fix: allow super_admin (line 65)

```python
# Change:
def _require_admin(current_user):
    if "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin role required")

# To:
def _require_admin(current_user):
    if not any(r in current_user.roles for r in ("admin", "super_admin")):
        raise HTTPException(status_code=403, detail="Admin role required")
```

---

## Registrars endpoint — `src/api/v1/admin.py`

Add below the existing `GET /admin/reporting-officers`:

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
    return [
        {
            "email":      u.email,
            "full_name":  u.full_name,
            "school":     u.school,
            "department": u.department,
        }
        for u in result.scalars().all()
    ]
```

---

## Summary of all changes

| Priority | File | Change |
|---|---|---|
| P0 | `src/api/v1/feedback.py` line 65 | Allow `super_admin` in `_require_admin` |
| P1 | `migrations/017_nt_workflow_system.sql` | Create 6 new tables + seed data |
| P1 | `src/models/non_teaching.py` | Add 5 new ORM models |
| P1 | `src/api/v1/admin.py` | Add designation CRUD, template CRUD, step management, assignments |
| P1 | `src/api/v1/admin.py` | Add `GET /admin/registrars` |
| P2 | `src/api/v1/non_teaching.py` | Add `GET /workflow-template`, `GET /workflow/{email}` |
| P2 | `src/api/v1/non_teaching.py` | Create workflow instance on submission |
| P2 | `src/api/v1/non_teaching.py` | Advance workflow instance on review |
| P2 | `src/api/v1/non_teaching.py` | Update subordinates to filter by designation |
| P3 | `src/api/v1/dashboard.py` | Fix NT status in `/dashboard/subordinates` |

---

## API surface consumed by admin UI

| Admin UI call | Endpoint |
|---|---|
| `api.designations.list()` | `GET /admin/nt-designations` |
| `api.designations.create(data)` | `POST /admin/nt-designations` |
| `api.designations.update(id, data)` | `PUT /admin/nt-designations/{id}` |
| `api.designations.remove(id)` | `DELETE /admin/nt-designations/{id}` |
| `api.workflowTemplates.list()` | `GET /admin/nt-workflow-templates` |
| `api.workflowTemplates.create(data)` | `POST /admin/nt-workflow-templates` |
| `api.workflowTemplates.update(id, data)` | `PUT /admin/nt-workflow-templates/{id}` |
| `api.workflowTemplates.remove(id)` | `DELETE /admin/nt-workflow-templates/{id}` |
| `api.workflowTemplates.setDefault(id)` | `PUT /admin/nt-workflow-templates/{id}/set-default` |
| `api.workflowTemplates.addStep(id, data)` | `POST /admin/nt-workflow-templates/{id}/steps` |
| `api.workflowTemplates.updateStep(id, no, data)` | `PUT /admin/nt-workflow-templates/{id}/steps/{step_no}` |
| `api.workflowTemplates.removeStep(id, no)` | `DELETE /admin/nt-workflow-templates/{id}/steps/{step_no}` |
| `api.workflowTemplates.reorderSteps(id, steps)` | `PUT /admin/nt-workflow-templates/{id}/reorder` |
| `api.workflowTemplates.listAssignments()` | `GET /admin/nt-workflow-assignments` |
| `api.workflowTemplates.assign(data)` | `POST /admin/nt-workflow-assignments` |
| `api.workflowTemplates.removeAssignment(id)` | `DELETE /admin/nt-workflow-assignments/{id}` |
| `api.workflow.getTemplate(role, direct)` | `GET /non-teaching/workflow-template` |
| `api.workflow.getForFaculty(email, year)` | `GET /non-teaching/workflow/{email}` |
