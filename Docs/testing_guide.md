# Faculty Appraisal API - Testing Guide

This document provides instructions on how to manually test the newly implemented features of the Faculty Appraisal API.

## 1. Prerequisites
- Ensure you have the dependencies installed:
  ```bash
  uv sync
  ```
- Ensure your `.env` file is configured with your Supabase URL and Keys.
- **Initialize Test Data:** The system requires a faculty record to exist. Run the setup script:
  ```bash
  $env:PYTHONPATH="."
  uv run python setup_test_db.py
  ```

## 2. Running the Server
Start the FastAPI server:
```bash
uv run uvicorn main:app --reload
```
Once running, open your browser to: `http://127.0.0.1:8000/docs` to access the Swagger UI.

## 3. Testing Sequence

### Step 1: Create a Faculty User
Currently, the system expects a `Faculty` record to exist in the database to link appraisal data.
1. Go to the **Faculty** section in Swagger.
2. Use `POST /api/v1/faculty` (if implemented) or manually add a row to the `faculty` table in your database with `id=1`.

### Step 2: Add Appraisal Data (Part A & Part B)
The **Appraisal Summary** aggregates data from these sections.
1. **Part A:** Try `POST /api/v1/part-a/teaching-process`. Upload a small PDF and fill in the form.
2. **Part B:** Try `POST /api/v1/journal-publications`. Upload a PDF and fill in the details.

### Step 3: Check the Summary
1. Go to the **Appraisal Summary** section.
2. Use `GET /api/appraisal-summary/1`.
3. Verify that the `teaching_score` and `journal_score` reflect the data you just added.

### Step 4: Add Remarks (Role Simulation)
The system checks for roles (HOD, Director, etc.). Since we are using mock auth for development:
- **To test as Faculty:** Run requests without an `Authorization` header.
- **To test as HOD/Director:** You can temporarily modify `src/setup/dependencies.py` to change the default mock user's role:
  ```python
  # In src/setup/dependencies.py
  if not authorization:
      return User(id=1, roles=["hod"], department="Computer Science") # Change "faculty" to "hod"
  ```
1. Use `PUT /api/v1/remarks/1/hod` to add HOD comments.
2. Use `GET /api/v1/remarks/1` to see the accumulated remarks.

### Step 5: Finalization
1. Use `POST /api/v1/enclosures` to upload final proof documents.
2. Use `POST /api/v1/declaration` to sign off on the appraisal.

## 4. Verification Checklist
- [ ] Do files upload to Supabase bucket `faculty-docs`?
- [ ] Does the `grand_total_score` correctly sum Part A and Part B?
- [ ] Can an HOD only see/edit their department's faculty (if roles are set)?
- [ ] Is the final status updated to `APPROVED` after VC remarks?

## 5. Troubleshooting
- **Database Errors:** If tables are missing, ensure `Base.metadata.create_all(bind=engine)` is running in `src/main.py`.
- **Upload Failures:** Ensure the `faculty-docs` bucket exists in your Supabase project and is set to "Public" or has appropriate RLS policies.
