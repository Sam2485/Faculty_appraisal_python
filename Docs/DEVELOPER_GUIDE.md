# Faculty Appraisal System - Developer Guide

## Architecture Overview

Async FastAPI backend for DYP University's faculty appraisal system. 8 schools, 5-level RBAC, two form tracks (teaching staff + non-teaching staff), deployed on GCP Cloud Run.

### Core Pillars
1. **Async I/O** — every DB query uses `await` via `asyncpg`. No blocking calls anywhere in the request path.
2. **Unified Submit Model** — faculty fill a form in the frontend and submit it as a single JSON payload. The backend "shreds" that payload into normalised relational tables (`shred_form` in `src/api/v1/appraisal.py`) and also keeps a full JSONB snapshot for the reviewer UI.
3. **Hierarchical RBAC** — role weights (0–5) enforced in `src/setup/dependencies.py`. All protected routes use the `CurrentUser` dependency.
4. **Auth** — local JWT by default (`USE_LOCAL_AUTH=true`). Supabase Auth is a legacy fallback (`USE_LOCAL_AUTH=false`).
5. **Storage** — Google Cloud Storage for production file uploads. Local `./uploads` filesystem fallback for on-premise deployments.

---

## 1. Institutional Hierarchy

```
VC (4) → Dean (3) → Director (2) → HOD (1) → Faculty (0)
                                 ↘ Registrar (3.5) → Reporting Officer (1.5) → Non-Teaching Staff (0)
```

Role weights are defined in `src/setup/dependencies.py → User.has_authority_over()`. Horizontal isolation is enforced: Directors only see their own school, HODs only see their own department.

Full role list: `faculty`, `hod`, `director`, `dean`, `vc`, `registrar`, `reporting_officer`, `section_head`, `center_head`, `non_teaching_staff`, `admin`

---

## 2. Form Families

| Family | Schools | Code |
|--------|---------|------|
| standard | SoCSEA, SoBB, SoCE, SoEMR, SoC, CISR | `"standard"` |
| media | SoMCS | `"media"` |
| design | CioD, SoAA | `"design"` |

Resolved in `src/setup/dependencies.py → get_form_family(school)`. School 8 (SoEMR) is unique — it has an HOD layer between faculty and director.

---

## 3. Project Structure

```
src/
├── main.py              — FastAPI app, CORS, middleware, exception handlers
├── api/v1/
│   ├── auth.py          — register, login, verify-email, /me
│   ├── appraisal.py     — snapshot, submit, status (core faculty workflow)
│   ├── dashboard.py     — subordinate list + faculty snapshot viewer (reviewer UI)
│   ├── remarks.py       — HOD/Director/Dean/VC review endpoints
│   ├── documents.py     — uploaded document listing
│   ├── upload.py        — file upload to GCS
│   └── non_teaching.py  — non-teaching appraisal workflow
├── crud/
│   ├── core.py          — faculty profile, declaration, review CRUD
│   ├── part_a.py        — Part A section CRUD
│   ├── part_b.py        — Part B section CRUD
│   └── non_teaching.py  — non-teaching appraisal CRUD
├── models/
│   ├── core.py          — FacultyProfile, Declaration, AppraisalSnapshot, AppraisalReview, AppraisalDocument
│   ├── part_a.py        — BasePartAModel + 11 concrete models
│   ├── part_b.py        — BasePartBModel + 15 concrete models
│   └── non_teaching.py  — NonTeachingAppraisal, Part A items, Part B ratings
├── schema/
│   ├── core.py          — Pydantic v2 schemas
│   ├── part_a.py / part_b.py / non_teaching.py
└── setup/
    ├── database.py      — async engine, pool (size=10, overflow=20), PgBouncer-compatible
    ├── dependencies.py  — JWT validation, User class, has_authority_over(), CurrentUser
    ├── local_auth.py    — bcrypt hashing, JWT sign/verify
    ├── storage_utils.py — GCS + local storage abstraction
    ├── supabase_client.py
    └── email_utils.py
```

---

## 4. Key Workflows

### Faculty Appraisal Submit Flow
1. **Draft save** — `PUT /appraisal/snapshot` stores the full form JSON in `appraisal_snapshots`. This is what the reviewer UI reads.
2. **Submit** — `POST /appraisal/submit`:
   - `shred_form()` deletes existing rows for that faculty/year in all Part A and Part B tables, then inserts fresh rows from the submitted JSON. Each section key in the payload must match the mapping in `shred_form` exactly (see `src/api/v1/appraisal.py`).
   - `create_or_update_declaration()` stages a `Declaration` row (status = `Submitted`).
   - Snapshot is updated with the full submission payload.
   - Single `await db.commit()` commits everything atomically.

> **Important:** CRUD functions (`create_or_update_declaration`, etc.) do **not** call `db.commit()` internally. Transaction ownership belongs to the endpoint. Do not add `db.commit()` inside CRUD functions that are called mid-endpoint.

### Reviewer Flow (Teaching Staff)
- Reviewer calls `PUT /appraisal-remarks/{role}/{email}` with scores + remarks.
- `update_item_scores()` writes per-section reviewer scores into the same normalized tables (using `hod_score`, `director_score`, etc. columns).
- `Declaration.status` advances: `Submitted` → `pending_director` → `pending_dean` → `pending_vc` → `completed`.

### Non-Teaching Flow
- Staff submits via `PUT /non-teaching/appraisal` (full JSONB payload, no shredding).
- Reporting Officer reviews via `PUT /non-teaching/review/{email}`.
- Status: `Draft` → `pending_registrar` → `pending_vc` → `completed`.

---

## 5. Critical Patterns & Gotchas

### SQLAlchemy import
```python
# CORRECT — works on all SQLAlchemy 2.x builds
from sqlalchemy.orm.attributes import flag_modified

# WRONG — fails on some production SQLAlchemy builds (caused the GCP crash)
from sqlalchemy.orm import flag_modified
```

### Transaction management
CRUD helper functions must **not** own the transaction when called from within an endpoint's try/except block. The endpoint is responsible for the single `await db.commit()` and `await db.rollback()`.

### PgBouncer compatibility
`statement_cache_size: 0` is set in `database.py`. Do not remove it — it is required for Supabase's PgBouncer Transaction Mode (port 6543).

### JSONB mutation tracking
When mutating a JSONB column in-place (e.g., updating `AppraisalSnapshot.payload`), always call `flag_modified(instance, "field_name")` before committing, or SQLAlchemy won't detect the change.

### CORS
Allowed origins are hardcoded in `src/main.py`. Add new frontend URLs to the `origins` list there.

---

## 6. Testing

```bash
# Windows
$env:PYTHONPATH="."
uv run pytest

# Linux/Mac
PYTHONPATH=. uv run pytest
```

- `tests/test_hierarchy_unit.py` — role weight and authority checks
- `tests/test_endpoints.py` — endpoint smoke tests

---

## 7. Running Locally

```bash
uv pip install -r pyproject.toml
uvicorn main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

---

## 8. GCP Deployment

Primary deployment is GCP Cloud Run (`asia-south1`, project `facultyappraisal-495011`). See `gcp_deploy_codes.txt` for manual deploy commands and `Docs/CICD_SETUP_GUIDE.txt` for the automated GitHub Actions pipeline.

```bash
export PROJECT_ID=facultyappraisal-495011
gcloud builds submit --tag asia-south1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/fastapi-backend .
gcloud run deploy fastapi-backend \
    --image asia-south1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/fastapi-backend \
    --region asia-south1 \
    --allow-unauthenticated
```

---

## 9. Development Tools

| Tool | Purpose |
|------|---------|
| `uv` | Package manager (fast, lockfile-based) |
| `gunicorn` + `uvicorn.workers.UvicornWorker` | Production ASGI server |
| `asyncpg` | Async PostgreSQL driver |
| `orjson` | Fast JSON serialisation |
| `pydantic v2` | Request/response validation |
