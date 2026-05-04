# Gemini Model Context Transfer

## Mandatory Instructions:
- **Architecture:** Always use **Asynchronous** patterns (`async def`, `await`).
- **Database:** Use `sqlalchemy.ext.asyncio` with the `asyncpg` driver. Use `AsyncSession` for all DB interactions.
- **Serialization:** Ensure `orjson` is used for high-traffic response serialization (integrated via `ORJSONResponse` or FastAPI's default handling of Pydantic v2).
- **PgBouncer:** Always keep `statement_cache_size: 0` in `create_async_engine` to support Supabase/PgBouncer in transaction mode.
- **Tools:** Always use `uv` for package management (`uv sync`, `uv run`).
- **FastAPI:** Always use `@skills/fastapi_skill.md` for any FastAPI related task.
- **Hierarchy:** Enforce the Reporting Tree: `Faculty < HoD < Director < Dean < VC`.
- **Visibility:** Higher authorities can see/manage data of subordinates; same-level users are isolated.
- **Schema Alignment:** Models are strictly aligned with production Supabase column names (e.g., `row_no` instead of `sr_no`, `journal` instead of `journal_name`). Always verify against `Docs/MIGRATION_STRATEGY.md` or existing models before making schema changes.

## Work Done So Far:

### 1. Initial Project Setup & Hierarchy:
- Configured FastAPI with SQLAlchemy 2.0 and Supabase integration.
- Implemented robust Hierarchical Access Control in `src/setup/dependencies.py`.
- Standardized all IDs to `UUID` strings to match Supabase Auth.

### 2. High-Performance Asynchronous Refactor:
- **Core Migration:** Replaced `psycopg2` with `asyncpg`. Migrated entire codebase (~60 files) to non-blocking I/O.
- **Serialization:** Integrated `orjson` for ultra-fast JSON processing.
- **Non-Blocking Auth:** Updated `get_current_user` to use Supabase `AsyncClient`.
- **Production Config:** Updated `Dockerfile` to use Gunicorn with `uvicorn.workers.UvicornWorker` and parameterized concurrency.
- **Latency Monitoring:** Added middleware to `main.py` providing `X-Process-Time` metrics.

### 3. Database Schema Alignment:
- Audited production Supabase schema and corrected mismatched column names in SQLAlchemy models (Part A and Part B).
- Resolved `UndefinedColumnError` and `ForeignKeyViolationError` by aligning model mappings with existing production data.
- Implemented `setup_test_db.py` to initialize mandatory test data (e.g., mock faculty profiles).

### 4. Implementation of Appraisal Modules:
- Developed models, schemas, and CRUD for Part A (Teaching), Part B (Research), and Overall Summary/Remarks.
- Integrated PDF upload support across all categories via Supabase Storage.

## Plan for Future Work:

### 1. External Infrastructure Migration:
- Reference `Docs/MIGRATION_STRATEGY.md` for steps to move from Supabase to local PostgreSQL or Firebase Auth.
- Prepare `src/setup/storage_utils.py` for local file storage if needed by the client.

### 2. Performance Profiling:
- Conduct load tests using the `X-Process-Time` header to ensure the <200ms latency target is consistently met under stress.

### 3. Expanded Test Coverage:
- Continue expanding `pytest-asyncio` coverage to include more complex multi-role approval scenarios.
