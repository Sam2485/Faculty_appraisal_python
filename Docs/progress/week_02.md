# Week 02 Progress Report
**Period:** 2026-05-10 — 2026-05-20

---

## Summary

Second week covered a wide range of work: non-teaching data mapping fixes, admin panel expansion (CSV exports, trends, module config, cascade deletes), auth hardening, dashboard improvements, role additions, appraisal integrity locks, and the large Dynamic NT Workflow System that replaces the hardcoded RO→Registrar→VC approval chain with a configurable, database-driven pipeline.

---

## Completed Work

### Bug Fixes

- **Non-teaching submission data mapping** — `selfResp`, `selfContrib`, `selfAchieve` fields from the staff self-appraisal form were not being broken down into `part_a_items` rows on submission; fixed in `src/api/v1/non_teaching.py`
- **Non-teaching reviewer marks not persisting** — reviewer scores were not being written to `part_a_items` and `part_b_ratings` tables on review submit; fixed to write through correctly
- **Password reset redirect URL** — reset link was built with a hardcoded backend URL; updated to use `redirect_url` from the request body so the link lands on the correct frontend origin
- **`reports_to_registrar` toggle not saving** — root cause was `normalizeUsers` in `admin_ui/src/api/normalizers.js` not mapping the field; it was always `undefined` → `false` in the edit form. Added `reports_to_registrar: u.reports_to_registrar ?? false` to the normalizer.
- **CheckViolationError — "Pending Registrar Review"** — DB CHECK constraint on `non_teaching_appraisals.status` did not include this status value; triggered on submission for direct-to-registrar staff. Fixed with migration 014.
- **CheckViolationError — "Pending RO Review"** — frontend sends this value on normal staff submission; same constraint issue. Fixed with migration 015, which also extended the backend intercept condition to correctly route direct-to-registrar staff even when the frontend sends this status.
- **CORS** — added missing Firebase Hosting URLs to allowed origins in `src/main.py`

### New Features

#### Infrastructure
- **Cloud Build optimisation** — cached the npm stage separately and parallelised the push and deploy steps in `cloudbuild.yaml`; reduces build time on frontend-only changes

#### Admin Panel
- **CSV exports** — `GET /admin/export/faculty` and related endpoints; download full faculty roster and appraisal data as CSV
- **Appraisal trends** — new stats endpoint surfacing submission counts and score distributions over time for the admin dashboard charts
- **Module config** — `GET/PUT /admin/module-config` to toggle appraisal modules (self-appraisal, peer review, etc.) from the admin panel without a redeploy
- **Cascade user delete** — deleting a user via `DELETE /admin/users/{email}` now removes all associated appraisal records, reviews, snapshots, and documents in the same transaction
- **`GET /admin/submissions`** — per-faculty appraisal cycle status tracker

#### Dashboard
- **Reviews array in faculty detail** — `GET /dashboard/faculty/{email}` now includes the full `reviews` array so the frontend can render the complete review history in one request

#### Roles & Access Control
- **`hr` and `super_admin` roles** — added to `appraisal_role` CHECK constraint and role hierarchy in `src/setup/dependencies.py`; `feedback.py` `_require_admin` guard updated to accept `super_admin`

#### Appraisal Integrity
- **Block snapshot saves after submission** — `PUT /appraisal/snapshot` now rejects saves once the appraisal is in a submitted or reviewed state; prevents retroactive form edits
- **Persist document references on snapshot save** — document URLs in the snapshot payload are written through to `appraisal_documents`
- **Lock reviewers after VC final approval** — non-VC reviewers can no longer modify scores once VC has approved; VC retains re-edit access

#### Security
- **Login rate limiting** — per-email brute-force cap on `POST /auth/login`
- **Forgot-password rate limiting** — per-IP rate cap on `POST /auth/forgot-password`

#### Non-Teaching — Explicit Reviewer Assignment (migrations 016 & 017)
- Added `reporting_officer_email` column to `faculty_profiles` — admins can now pin a specific RO to any non-teaching staff member rather than relying on role-wide authority
- Added `registrar_email` column — same for explicit Registrar assignment
- `GET /non-teaching/subordinates`: Registrar query filters by `registrar_email`; RO query filters by `reporting_officer_email` (excluding `reports_to_registrar=true` staff)
- `PUT /non-teaching/review/{email}`: `is_assigned_ro` and `is_assigned_registrar` checks allow cross-school reviewers to action their explicitly assigned staff
- `GET /admin/registrars` and `GET /admin/reporting-officers` endpoints added for the assignment dropdowns in the admin UI

#### Non-Teaching — Dynamic Workflow System (migration 018)
Replaced the hardcoded three-step approval chain with a fully configurable pipeline.

**Database — 6 new tables:**

| Table | Purpose |
|---|---|
| `nt_designations` | Catalog of reviewer roles (system + custom) |
| `nt_workflow_templates` | Named approval chains |
| `nt_workflow_template_steps` | Ordered steps within a template |
| `nt_workflow_assignments` | Maps a template to an individual, role, or department |
| `nt_workflow_instances` | Live approval state per staff member per year |
| `nt_workflow_instance_steps` | Per-step review record within an instance |

Seed data: 3 system designations (Reporting Officer, Registrar, VC), 2 default templates (Standard NT Flow: RO→Registrar→VC; Direct to Registrar: Registrar→VC), default role assignments for `non_teaching_staff`, `reporting_officer`, and `registrar` roles.

**API — `src/api/v1/non_teaching.py`:**
- `_resolve_template()` helper: priority lookup — individual > department > role > default; guards `staff_email is not None` to prevent `IS NULL` false-matches on role/department rows
- `GET /non-teaching/workflow-template` — admin preview of configured approval chain for a given role
- `GET /non-teaching/workflow/{email}` — live workflow status with per-step state for a specific staff member
- `PUT /non-teaching/appraisal` — creates `NTWorkflowInstance` + `NTWorkflowInstanceStep` rows on first submission (idempotent)
- `GET /non-teaching/subordinates` — per-appraisal step matching against reviewer's `designation` (looked up from DB, not JWT) so reviewers only see forms sitting at their step
- `PUT /non-teaching/review/{email}` — marks current step APPROVED, promotes next WAITING step to PENDING, or marks instance COMPLETED when all steps are done

**API — `src/api/v1/admin.py`:**
- Designation CRUD: `GET/POST /admin/nt-designations`, `PUT/DELETE /admin/nt-designations/{id}` (system designations protected; delete blocked if used in an active template)
- Template CRUD: `GET/POST /admin/nt-workflow-templates`, `PUT/DELETE /admin/nt-workflow-templates/{id}`, `PUT /admin/nt-workflow-templates/{id}/set-default`
- Step management: `POST/PUT/DELETE /admin/nt-workflow-templates/{id}/steps/{step_no}`, `PUT /admin/nt-workflow-templates/{id}/reorder` (two-pass renumber avoids UNIQUE constraint violations)
- Assignment CRUD: `GET/POST /admin/nt-workflow-assignments`, `DELETE /admin/nt-workflow-assignments/{id}` (exactly one of `staff_email`, `appraisal_role`, `department` required)

### Database Migrations

| Migration | Change |
|---|---|
| 014 | Added `'Pending Registrar Review'` to `non_teaching_appraisals` status CHECK |
| 015 | Added `'Pending RO Review'` to status CHECK (7 valid values total) |
| 016 | Added `reporting_officer_email text` to `faculty_profiles` |
| 017 | Added `registrar_email text` to `faculty_profiles` |
| 018 | Created 6 NT workflow tables + seed designations, templates, and role assignments |

### Documentation
- `Docs/schema.sql` updated to include all 5 new migrations: two new `faculty_profiles` columns, expanded status CHECK, and all 6 NT workflow tables with seed data

---

## Pending / Carry Forward

- Run migrations 014–018 against the live Cloud SQL database (if not already applied)
- Confirm with admin dev: are the admin UI panels for Designation/Template/Assignment management already built, or does the frontend team still need to wire them up?
- `supabase_client.py` — still dead code, still pending removal before on-premise packaging
- Interview prep doc (`Docs/interview_prep.md`) has uncommitted local changes — commit or discard

---

## Notes

- The two-pass reorder strategy (step_no += 1000 → assign final values) is required to avoid UNIQUE constraint violations when renumbering template steps; do not simplify to a single pass
- `current_user.designation` is not in the JWT; the subordinates endpoint does a separate DB lookup for the reviewer's `FacultyProfile` — intentional, documented in the code
- Migration 018 was originally spec'd by admin dev as `017_nt_workflow_system.sql`; renamed to `018` due to the pre-existing `017_add_registrar_email.sql`
