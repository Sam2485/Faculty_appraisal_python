# Week 01 Progress Report
**Period:** 2026-05-03 — 2026-05-09

---

## Summary

First week of active development. Focus was on stabilising the existing backend, fixing critical bugs discovered during early testing, setting up GCP CI/CD, implementing the admin backdoor, and bringing all documentation and database migrations up to date.

---

## Completed Work

### Bug Fixes
- **CORS** — added missing frontend origins to allowed list in `src/main.py`
- **Non-teaching datetime** — fixed unguarded `data['academic_year']` KeyError returning 500; now returns 422 with a clear message
- **Double-commit** — removed stray `db.commit()` calls inside CRUD helpers that were being called mid-endpoint, causing duplicate transaction commits
- **Dean dashboard empty results** — two independent bugs:
  - Dean registered with a school code (e.g. `SoCSEA`) instead of `"engineering"` was getting no results; fixed by accepting both division labels and school codes
  - `Declaration` outerjoin was missing the `academic_year` filter, pulling in declarations from prior years
- **N+1 query on dashboard** — replaced per-faculty review lookups with a single batch query + in-memory grouping
- **asyncpg DataError on reviewer endpoints** — frontend sends `section_scores` as `{section_key: [{hod: '', score: '45', director: '43'}]}` (list of dicts) instead of a plain float; added `_extract_numeric_score()` normaliser in `src/api/v1/remarks.py` that handles all formats

### New Features
- **Admin backdoor**
  - SQLAdmin UI at `/admin` — browser-based table viewer/editor using `sqladmin`, session login backed by `appraisal_role = 'admin'`
  - REST Admin API at `/api/v1/admin` — stats, config read/write, user management (list, create, update, delete)
  - `SessionMiddleware` and `ProxyHeadersMiddleware` added to `src/main.py`
- **Feedback form endpoints** — public `POST /feedback` + admin-only `GET /feedback` with filters

### Infrastructure
- **GCP Cloud Build** — added `cloudbuild.yaml` with `--cache-from` and `BUILDKIT_INLINE_CACHE=1`; significantly reduced build time on code-only changes by reusing the dependency layer
- Removed dead `.github/workflows/deploy.yml` (inactive GitHub Actions attempt)

### Database Migrations
All five migrations applied to the live Cloud SQL database:

| Migration | Change |
|---|---|
| 001 | Composite UNIQUE constraints on declarations, snapshots, reviews, non-teaching |
| 002 | Expanded `appraisal_role` CHECK to include `admin`, `staff`, `section_head` |
| 003 | Created `feedback` table |
| 004 | Performance indexes on all Part A/B tables + faculty_profiles + declarations |
| 005 | Added `is_verified boolean` to `faculty_profiles` |

Plus two extra indexes applied directly: `idx_appraisal_snapshots_email_year`, `idx_appraisal_reviews_year`.

### Documentation
- Reorganised all docs under `Docs/` (moved `api_docs/` → `Docs/api/`, reference files → `Docs/reference/`, forms → `Docs/forms/`)
- `.dockerignore` simplified to a single `Docs/` line
- `Docs/schema.sql` updated to reflect current DB state (feedback table, expanded role CHECK, all new indexes)
- `Docs/DEVELOPER_GUIDE.md` updated: project structure, GCP deployment commands, PgBouncer note, migration system, admin backdoor section
- `migrations/README.md` created — rules for adding/running migrations
- `migrations/seed_admin_user.sql` created — one-time admin account setup

---

## Pending / Carry Forward

- Confirm with frontend dev: what key name does Center Head review form use in `section_scores` row dicts — `"center_head"` or `"director"`?
- Test SQLAdmin UI at `/admin` on the deployed Cloud Run service
- `supabase_client.py` is dead code — remove before on-premise packaging
- On-premise deployment: `PUT /api/v1/admin/config` modifies `.env` locally; will not persist on Cloud Run (by design, Cloud Run env vars are set at deploy time)

---

## Notes

- The old `v3/v4/v5` and `migration_fix_missing_columns.sql` migration files are superseded by the numbered 001–005 scheme and scheduled for deletion
- `Docs/schema.sql` + `migrations/seed_admin_user.sql` are the only two files needed for a fresh on-premise install
