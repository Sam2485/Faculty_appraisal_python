# Database Portability: Migrating from Supabase to Standard PostgreSQL

The Faculty Appraisal System is designed for maximum portability. The entire backend has been refactored to use an asynchronous architecture that is native to PostgreSQL.

> **Note:** For a detailed step-by-step roadmap including Firebase and full on-premise scenarios, please refer to [MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md).

## 1. Database Configuration
The application uses **SQLAlchemy 2.0** with the **`asyncpg`** driver, which is the industry standard for high-performance PostgreSQL interactions.

- **Current Setup:** Uses Supabase connection string in `.env`. The backend automatically converts `postgresql://` to `postgresql+asyncpg://`.
- **Migration:** Simply update the `DATABASE_URL` in `.env` to point to any standard PostgreSQL instance (v15+).
- **PgBouncer:** If your local server uses PgBouncer in transaction mode, the backend is already pre-configured to handle this safely (via `statement_cache_size: 0`).

## 2. Authentication Replacement
The system's authorization logic is isolated in `src/setup/dependencies.py`.
- **Action:** To switch from Supabase to a local provider (like Firebase or Keycloak), you only need to update the `get_current_user` function.
- **Independence:** The existing 60+ API endpoints and CRUD logic are completely independent of the authentication provider.

## 3. File Storage Replacement
Currently, PDF proofs are stored in Supabase Storage.
- **Local Alternative:** You can update `src/setup/storage_utils.py` to save files to a local directory or a local S3-compatible service like **MinIO**.
- **Database Alignment:** The database schema stores only the file path/URL, so migrating files does not require schema changes.
