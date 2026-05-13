# Faculty Appraisal — Manual Testing Guide

This guide covers how to manually test the system end-to-end using Swagger UI and a local or staging database.

---

## Prerequisites

- Backend running locally: `uvicorn main:app --reload --port 8000`
- Swagger UI available at: `http://localhost:8000/docs`
- A local PostgreSQL database with schema and migrations applied (see `Docs/ADMIN_LOCAL_SETUP_GUIDE.md`)
- At least one admin user seeded (see `migrations/seed_admin_user.sql`)

---

## 1. Auth flow

### Register → Verify → Login

1. `POST /api/v1/auth/register` — create a new faculty account. Check that a verification email is sent (or check the server log for the token if SMTP is not configured).
2. `GET /api/v1/auth/verify-email?token=<TOKEN>` — confirm the account. `is_verified` should flip to `true` in the DB.
3. `POST /api/v1/auth/login` — log in. Copy the returned JWT.
4. Click **Authorize** at the top of Swagger and paste `Bearer <token>`.

### Password reset

1. `POST /api/v1/auth/forgot-password` — send `{ "email": "...", "redirect_url": "http://localhost:5173/reset-password" }`. Check server logs for the raw token.
2. `POST /api/v1/auth/reset-password` — send `{ "token": "<raw>", "new_password": "newpass" }`. Should return 200.
3. Log in again with the new password to confirm.

---

## 2. Teaching staff appraisal

### Submit a form

1. Log in as a faculty user.
2. `PUT /api/v1/appraisal/snapshot` — save a draft payload. Confirm with `GET /api/v1/appraisal/snapshot`.
3. `POST /api/v1/appraisal/submit` — submit the form. Response should be `200` with `submitted_at`.
4. `GET /api/v1/appraisal/status` — check that `declaration.status` = `Submitted` (or whatever the initial pending status is).

### Reviewer chain (SoCSEA example — no HOD)

| Step | Log in as | Endpoint | Expected outcome |
|------|-----------|----------|-----------------|
| 1 | Director | `GET /api/v1/dashboard/subordinates` | Faculty appears |
| 2 | Director | `GET /api/v1/dashboard/faculty/{email}` | Snapshot + empty `reviews` array |
| 3 | Director | `PUT /api/v1/appraisal-remarks/director/{email}` | 200; `reviews` now has director entry |
| 4 | Dean | `GET /api/v1/dashboard/subordinates` | Faculty appears |
| 5 | Dean | `PUT /api/v1/appraisal-remarks/dean/{email}` | 200 |
| 6 | VC | `PUT /api/v1/appraisal-remarks/final/{email}` | 200; status = `Reviewed` |

Cross-role attack checks: confirm that Director cannot call the dean or VC review endpoints for the same faculty, and that another school's Director gets `403`.

---

## 3. Non-teaching staff appraisal

### Standard flow (via Reporting Officer)

1. Log in as `non_teaching_staff` — `PUT /api/v1/non-teaching/appraisal` with status `Submitted`.
2. Log in as `reporting_officer` — `GET /api/v1/non-teaching/subordinates`. Staff should appear.
3. RO calls `PUT /api/v1/non-teaching/review/{email}` with Part A marks and Part B ratings in the payload.
4. Log in as `registrar` — staff should appear in subordinates with status `Reporting Officer Reviewed`.
5. Registrar calls `PUT /api/v1/non-teaching/review/{email}`.
6. Log in as `vc` — confirm final review sets status to `VC Approved`.

### Direct-to-registrar flow (`reports_to_registrar = true`)

1. As admin, set `reports_to_registrar = true` via `PUT /api/v1/admin/users/{email}`.
2. Staff submits — check that status is `Submitted` (same as a normal submission; the flag controls visibility, not the status value).
3. Log in as `reporting_officer` — confirm the staff member does **not** appear in their subordinates list.
4. Confirm that `PUT /api/v1/non-teaching/review/{email}` as RO returns `403`.
5. Registrar can review normally.

---

## 4. Admin endpoints

Log in as a user with `appraisal_role = 'admin'`.

| Check | Endpoint |
|-------|----------|
| Submission counts by school | `GET /api/v1/admin/stats` |
| List all users | `GET /api/v1/admin/users` |
| Create user | `POST /api/v1/admin/users` — confirm `reports_to_registrar` and `is_verified` fields are accepted |
| Update user | `PUT /api/v1/admin/users/{email}` — toggle `reports_to_registrar`, confirm response reflects change |
| Delete user (cascade) | `DELETE /api/v1/admin/users/{email}` — confirm all related appraisal records are removed from DB |
| Create/list announcements | `POST /api/v1/admin/announcements` with multi-token audience e.g. `"faculty,hod,SoCSEA"` — confirm 200, not 422 |
| Open/close appraisal cycle | `PUT /api/v1/admin/config` |

---

## 5. Role boundary checks

These should all return `403`:

- Faculty calling `GET /api/v1/dashboard/subordinates`
- HOD calling the director review endpoint for someone in their school
- RO calling `PUT /api/v1/non-teaching/review/{email}` for a `reports_to_registrar = true` staff
- Director from School A calling the review endpoint for a faculty in School B
- Non-admin calling any `/api/v1/admin/` endpoint

---

## 6. Running automated tests

```bash
# Windows
$env:PYTHONPATH="."
uv run pytest

# Linux/Mac
PYTHONPATH=. uv run pytest
```

| Test file | What it covers |
|-----------|---------------|
| `test_hierarchy_unit.py` | `has_authority_over()` role-weight logic — pure unit, no DB |
| `test_score_normalizer.py` | Score extraction — pure unit, no DB |
| `test_v1_auth.py` | Register, login, `/me`, profile update |
| `test_v1_workflow.py` | Snapshot save/retrieve, submit, status |
| `test_v1_authority.py` | HOD dashboard visibility, faculty status view |
| `test_review_chain.py` | Full HOD → Director → Dean → VC chain + cross-role attacks |
| `test_feedback.py` | Public POST /feedback, admin-only GET /feedback |
| `test_admin.py` | Admin user CRUD, stats, role enforcement |
| `test_non_teaching_workflow.py` | Non-teaching staff → RO → Registrar → VC chain |
