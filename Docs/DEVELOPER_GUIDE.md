# Faculty Appraisal System - Developer Guide

## Architecture Overview
This system is a **High-Performance, Asynchronous FastAPI** backend designed to handle appraisal forms for 8 different schools. It uses a **fully non-blocking I/O model** and is integrated with **Supabase Auth & Storage**.

### Core Architecture Pillars:
1.  **Asynchronous I/O:** Every database query and external API call is performed using `await` via the `asyncpg` driver. This prevents event loop blocking and ensures massive scalability.
2.  **Fast Serialization:** Uses `orjson` as the default JSON encoder for ultra-fast request/response processing.
3.  **Hierarchical Access Control:** Enforces a 5-level reporting structure (VC > Dean > Director > HOD > Faculty).
4.  **Database Agnostic:** Designed for easy migration from Supabase to any standard PostgreSQL environment.

## 1. Institutional Hierarchy
The system enforces a 5-level reporting structure:
- **VC (Vice Chancellor):** Global access across all schools.
- **Dean:** Access isolated by **Division** (Engineering / Non-Engineering).
- **Director:** Access isolated by **School**.
- **HOD (Head of Department):** Access isolated by **Department** within their School.
- **Faculty:** Access limited to their own data only.

### Authorization Enforcement
The logic resides in `src/setup/dependencies.py` inside the `User.has_authority_over` method. 
- It uses **Role Weights** (0-5) to prevent lower roles from accessing higher-role data.
- It enforces **Horizontal Isolation** for HODs and Directors.

## 2. Dynamic Form Types
There are three form types used across the 8 schools:
- **Type 1 (Standard):** Schools 1, 2, 3, 7, 8.
- **Type 2 (Media):** School 4.
- **Type 3 (Arts/Design):** Schools 5, 6.

Around 80% of the database tables are shared. Differences are handled through:
1. **Sparse Columns:** Shared tables with optional fields (e.g., `issn_isbn_no` is only filled for publications).
2. **Status Tracking:** The `appraisal_summary_tracking` table manages the workflow state for all types.

## 3. Core Modules
- `src/models/`: SQLAlchemy database models.
- `src/schema/`: Pydantic V2 data validation and serialization.
- `src/crud/`: Low-level database operations (Create, Read, Update, Delete).
- `src/api/`: FastAPI route handlers split by Part A, Part B, and Overall modules.
- `src/setup/`: Configuration for Database, Supabase Storage, and Dependencies.

## 4. Key Workflows
### File Uploads
PDF proofs are uploaded to Supabase Storage via `src/setup/storage_utils.py`. The resulting public URL is stored in the database's `document` column for each entry.

### Appraisal Finalization
1. Faculty adds entries in Part A and Part B.
2. Faculty submits a **Declaration** (`/api/v1/declaration`).
3. HOD/Director adds **Remarks** and approves the score.
4. Summary is aggregated in `/api/v1/appraisal-summary/{faculty_id}`.

## 5. Testing
Always run the full test suite before pushing changes:
```bash
$env:PYTHONPATH="."
uv run pytest
```
- `tests/test_hierarchy_unit.py`: Validates the complex authorization rules.
- `tests/test_endpoints.py`: Validates CRUD and score calculations.

## 6. Development Tools
- **Package Manager:** `uv` (Fast and reliable).
- **Database:** Supabase (PostgreSQL).
- **Style:** Standard PEP 8 with type hints for all parameters.
