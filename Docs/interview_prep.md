# Interview Prep — Faculty Appraisal System

---

## 1. Resume Entry

**Project Name:** Faculty Appraisal Management System
**Role:** Backend Developer & Cloud Engineer
**Duration:** May 2026 (1 month, ongoing)
**Context line** *(use in cover letters, not on CV):* Built on emergency request from DYP University administration to digitize a paper-based faculty appraisal process ahead of a hiring cycle.

**Tech Stack line:**
`Python · FastAPI · PostgreSQL · SQLAlchemy (async) · Google Cloud Run · Cloud SQL · Cloud Build · Docker · JWT · GCS`

**Bullet points (pick 4–5):**

- Designed and built a production REST API in FastAPI serving 8 schools and a 5-level role hierarchy (Faculty → HOD → Director → Dean → VC), with role-scoped data access enforced at the query layer
- Deployed the service to GCP Cloud Run with automated CI/CD via Cloud Build; connected to Cloud SQL PostgreSQL over Unix socket and Google Cloud Storage for file uploads
- Migrated the database layer from Supabase to Cloud SQL mid-project after hitting authentication connection limits, with zero data loss and no downtime to the test environment
- Wrote 13 incremental schema migrations by hand (no ORM migration tool) to evolve a 25+ table schema across two appraisal form types (teaching and non-teaching)
- Contributed to database schema design for appraisal snapshots using PostgreSQL JSONB to preserve audit trails of submitted forms
- Collaborated in a 5-person student team to deliver a fully deployed system in under 2 weeks on an emergency timeline requested by university administration

---

## 2. Elevator Pitch (30 seconds)

> "DYP University needed to replace a paper-based faculty appraisal process before a hiring cycle. They couldn't wait for an external vendor, so they asked students. I joined a 5-person team and took ownership of the backend and cloud infrastructure. I built a FastAPI service with role-based access across 8 schools and a 5-level reviewer hierarchy, deployed it to GCP Cloud Run with Cloud SQL and automated CI/CD, and we had a working production system in under two weeks. I also handled a mid-project database migration when we hit Supabase's connection limits."

---

## 3. STAR Stories

### Story 1 — Mid-project Database Migration
**Best for:** "Tell me about a time you solved a critical technical problem under pressure." / "Have you ever had to change direction mid-project?"

| | |
|---|---|
| **S — Situation** | We started the project using Supabase as our managed PostgreSQL + auth provider because it was fast to set up. About a week in, we discovered that Supabase's free tier enforces strict connection limits and its auth model didn't map cleanly to our 5-level custom role hierarchy. We were in active development and needed to fix this without losing data or breaking the team's ongoing work. |
| **T — Task** | I needed to migrate the database to GCP Cloud SQL, update the connection layer in the codebase, and make sure the new deployment pipeline (Cloud Build → Cloud Run) connected correctly — all without disrupting the rest of the team. |
| **A — Action** | I switched the database URL scheme to `postgresql+asyncpg://` pointing at Cloud SQL. Cloud Run connects to Cloud SQL via a Unix socket (not TCP), so I configured the `--add-cloudsql-instances` flag on Cloud Run and updated the engine configuration. I also handled the `statement_cache_size` setting that was needed for Supabase's PgBouncer proxy. I re-ran the schema against the new instance and verified all data transferred correctly. |
| **R — Result** | The migration was completed in one day. The rest of the team barely noticed — they just got a new database URL in the `.env`. CI/CD continued working without modification. The system has been running on Cloud SQL in production since then with no connection issues. |

**Likely follow-up:** "What would you do differently?"
> "I'd evaluate hosting constraints before starting. Supabase was fine for a prototype but we should have identified the connection limit issue during the spike phase rather than mid-sprint."

---

### Story 2 — Delivering Under an Emergency Timeline
**Best for:** "Tell me about a time you worked under pressure." / "Describe a situation where you had to deliver quickly."

| | |
|---|---|
| **S — Situation** | The university administration came to us on an emergency basis — they needed the appraisal system running before a faculty hiring cycle began, and hiring an external company would take too long based on their past experience. They asked a group of students, and our team of 5 agreed. We had no existing codebase to start from. |
| **T — Task** | I was responsible for the entire backend API and cloud deployment. I needed to go from zero to a deployed, production-ready system while the frontend team was building in parallel and the database schema was still being finalized. |
| **A — Action** | I prioritized the API contracts first — defined the endpoint structure and response schemas so the frontend team could start integration against mocked responses. I then built core auth, appraisal CRUD, and role-gating logic before moving to more complex features like score aggregation dashboards and document uploads. For deployment, I set up GCP Cloud Build so that every push to `main` automatically built a Docker image and deployed to Cloud Run — the client could always access the latest version without manual steps from us. |
| **R — Result** | We had a fully deployed, functional system in under 2 weeks. The client confirmed it covers their requirements and described it as ready for use. The university administration issued us a certificate recognizing the work as a 1-month internship. |

---

### Story 3 — Designing a Complex Role-Based Access System
**Best for:** "Tell me about a challenging design decision you made." / "Have you ever built a system with complex permissions?"

| | |
|---|---|
| **S — Situation** | The appraisal system needed to support 8 schools, each with different form types, and 5 levels of reviewers. Each reviewer should only see and score the faculties within their scope — a Director of one school shouldn't see another school's submissions, a Dean should see their division, and so on. One school (SoEMR) had a special requirement where the HOD score was visible to higher reviewers, while all other schools did not show this column. |
| **T — Task** | I needed to design an access model flexible enough to handle these variations without becoming a tangle of if-conditions scattered through the codebase. |
| **A — Action** | I implemented a numeric role hierarchy (`Faculty=0` through `Admin=5`) with a `has_authority_over()` function in the dependencies layer. Rather than checking roles at every endpoint, I centralized access logic into a `CurrentUser` dependency that FastAPI injects into any route that needs it. School-to-form-family mapping was handled in a single `get_form_family()` function, so the SoEMR special case was isolated there rather than spread across multiple routes. |
| **R — Result** | The permission system works correctly across all 8 schools and has not required a structural change since it was first written — only the occasional addition of a new role value. The SoEMR special case is a single conditional in the dashboard query rather than a forked code path. |

---

### Story 4 — Debugging a Silent Data Corruption Bug
**Best for:** "Tell me about a hard bug you tracked down." / "Describe a time attention to detail mattered."

| | |
|---|---|
| **S — Situation** | Some appraisal records that used JSONB fields (audit snapshots) were not saving updates correctly. The API would return a 200 OK, but on the next fetch the data appeared unchanged. There was no error in the logs. |
| **T — Task** | Find why SQLAlchemy was silently discarding mutations to JSONB columns and fix it without changing the schema. |
| **A — Action** | After reading the SQLAlchemy documentation on mutable types, I found that SQLAlchemy does not automatically detect in-place mutations to JSON/JSONB columns — it only tracks when you replace the entire object. The fix is to call `flag_modified(instance, "field_name")` to tell the ORM the field has changed. There was a second issue: importing `flag_modified` from `sqlalchemy.orm` caused a silent failure on some SQLAlchemy builds; the correct import path is `from sqlalchemy.orm.attributes import flag_modified`. I fixed both the import and added the call wherever JSONB fields were mutated in the codebase. |
| **R — Result** | JSONB updates persisted correctly after the fix. I also documented the correct import path in the project's CLAUDE.md so future contributors would not hit the same issue. |

---

## 4. Likely Interview Questions & Answers

**About the project:**

- **"Why FastAPI and not Django or Flask?"**
  FastAPI is async-native, has automatic OpenAPI docs, and Pydantic validation is built in. For an API-only backend with async DB operations, it's a better fit than Django's ORM-first design.

- **"Why GCP over AWS or Azure?"**
  The client had an existing GCP relationship. Cloud Run is also a natural fit for containerized APIs — you pay per request and don't manage servers.

- **"What is Cloud Run?"**
  A serverless container platform. You push a Docker image, configure env vars, and GCP handles scaling, TLS, and load balancing. Cold start is the main tradeoff.

**About your contributions:**

- **"What part of the database did you design?"**
  The snapshot/audit table using JSONB, the connection pool configuration, and the schema migration strategy.

- **"How did you handle auth?"**
  Local JWT with bcrypt password hashing. On login, we issue a token signed with a secret key. Each protected route has a `CurrentUser` dependency that decodes and validates the token and returns the user's role.

- **"How did you test the API?"**
  FastAPI generates a Swagger UI at `/docs` which we used heavily for manual testing. Unit tests use pytest with pytest-asyncio.

**Be honest about these if asked:**

- **"You have no Alembic migrations — why?"**
  We kept migrations as plain SQL files for simplicity given the small team and rapid pace. In a longer-running project I would use Alembic.

- **"The Docker image runs as root — is that a security issue?"**
  Yes, it's a known gap. It's acceptable on Cloud Run (Google manages the host) but would need fixing before an on-premise deployment.

---

## 5. Quick Technical Definitions

| Term | Plain English |
|---|---|
| **FastAPI** | Python web framework for building APIs. Async-first, auto-generates docs, uses type hints for validation. |
| **Cloud Run** | Google's serverless container service. You give it a Docker image, it runs and scales it. |
| **Cloud SQL** | Google's managed PostgreSQL. You don't run the DB server yourself. |
| **Cloud Build** | GCP's CI/CD service. Watches your git repo, builds the Docker image, and deploys on each push. |
| **JSONB** | PostgreSQL column type that stores JSON as binary — faster to query than plain JSON text. |
| **JWT** | Token format for auth. User logs in once, gets a signed token, sends it with every request. No server-side session needed. |
| **Async/await** | Code that doesn't block while waiting for I/O (like a DB query). Lets one server handle many requests at once. |
| **SQLAlchemy** | Python ORM — lets you write Python objects instead of raw SQL. Async version supports non-blocking queries. |
| **Pydantic** | Python library for data validation using type annotations. FastAPI uses it for request/response schemas. |
