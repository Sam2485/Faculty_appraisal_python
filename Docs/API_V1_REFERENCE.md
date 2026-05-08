# Faculty Appraisal System - API V1 Reference

## Core Info
- **Base URL:** `https://<cloud-run-url>/api/v1`
- **Auth:** `Authorization: Bearer <jwt>` on all 🔒 routes
- **Content-Type:** `application/json` unless noted otherwise
- **Response header:** `X-Process-Time` — backend execution time in seconds on every response
- **Identifiers:** faculty are identified by **email**, not UUID, throughout the API

---

## Authentication — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | ❌ | Returns `{token, profile}` |
| POST | `/auth/register` | ❌ | Creates account, sends verification email |
| GET | `/auth/verify-email?token=` | ❌ | Redirects to `{FRONTEND_URL}/login?verified=true` |
| GET | `/auth/me` | 🔒 | Current user profile |
| PUT | `/auth/me` | 🔒 | Update profile fields |
| POST | `/auth/change-password` | 🔒 | Change password |
| POST | `/auth/forgot-password` | ❌ | Stub — not implemented |
| POST | `/auth/reset-password` | ❌ | Stub — not implemented |

**POST `/auth/login` body:**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Login / `/auth/me` response profile shape:**
```json
{
  "email", "full_name", "role", "appraisal_role",
  "department", "school", "employee_id",
  "designation", "phone", "profile_picture_url"
}
```

**POST `/auth/register` body** — `FacultyProfileCreate`:
```json
{
  "email": "...", "password": "...", "full_name": "...",
  "appraisal_role": "faculty",
  "school": "SoCSEA", "department": "Computer Engineering",
  "designation": "...", "employee_id": "...",
  "phone": "...", "qualification": "...", "teaching_experience": "..."
}
```

**PUT `/auth/me` body** — all fields optional:
```json
{ "full_name", "department", "school", "designation", "phone", "avatar" }
```

---

## Appraisal (Faculty) — `/appraisal`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/appraisal/snapshot?academic_year=` | 🔒 | Returns current user's draft snapshot |
| PUT | `/appraisal/snapshot` | 🔒 | Save / update draft |
| POST | `/appraisal/submit` | 🔒 | Final submission |
| GET | `/appraisal/status?academic_year=` | 🔒 | Submission status + reviewer scores |

**PUT `/appraisal/snapshot` body:**
```json
{ "academic_year": "2025-26", "payload": { <any form data> } }
```

**POST `/appraisal/submit` body:**
```json
{
  "academic_year": "2025-26",
  "form": {
    "lectures":         [{ "semester", "course_code", "planned_classes", "conducted_classes", "score" }],
    "courseFile":       [{ "course", "title", "details", "score" }],
    "innovDetails":     "string or { details: string }",
    "innovScore":       0,
    "projects":         [{ "label", "score" }],
    "quals":            [{ "label", "score" }],
    "feedback":         [{ "course_code", "feedback_1", "feedback_2", "score" }],
    "deptActs":         [{ "activity", "nature", "score" }],
    "uniActs":          [{ "activity", "nature", "score" }],
    "society":          [{ "activity", "status", "details", "score" }],
    "industry":         [{ "name", "details", "score" }],
    "acr":              [{ "label", "score" }],
    "journals":         [{ "title", "journal", "issn", "indexing", "score" }],
    "books":            [{ "title", "book", "issn", "isbn", "publisher", "coauthor", "first_author", "score" }],
    "ict":              [{ "title", "description", "type", "quadrant", "score" }],
    "research":         [{ "degree", "student_name", "thesis", "score" }],
    "projects2":        [{ "title", "agency", "sanction_date", "amount", "role", "project_status", "score" }],
    "externalProjects": [{ "title", "agency", "sanction_date", "amount", "role", "project_status", "score" }],
    "patents":          [{ "title", "type", "scope", "patent_date", "patent_status", "file_no", "score" }],
    "awards":           [{ "title", "award_date", "agency", "level", "score" }],
    "confs":            [{ "title", "type", "organization", "level", "score" }],
    "proposals":        [{ "title", "duration", "agency", "amount", "score" }],
    "products":         [{ "details", "usage", "score" }],
    "fdps":             [{ "program", "duration", "organization", "score" }],
    "training":         [{ "company", "duration", "nature", "score" }]
  },
  "totals": { "partATotal": 0, "partBTotal": 0, "grandTotal": 0 }
}
```

> The `form` keys are exact string matches. A wrong key silently skips that section — nothing is written to the DB for it.

**Field aliases** — the backend remaps these automatically if sent:

| Frontend field | Stored as |
|---|---|
| `title_with_page_nos` | `title` |
| `journal_details` | `journal` |
| `issn_isbn_no` / `issn_isbn` | `issn` |
| `course_code_name` | `course_code` |
| `course_paper` | `course` |
| `nature_of_activity` | `nature` |
| `activity_type` | `activity` |
| `details_of_activity` | `details` |
| `project_type` / `qualification_type` | `label` |
| `short_description` | `details` |
| `title_and_pages` | `title` |
| `book_title_editor` | `book` |
| `event_title` | `title` |
| `hosting_organization` | `organization` |
| `event_level` | `level` |
| `pedagogy_type` | `type` |
| `company_industry` | `company` |
| `duration_days` | `duration` |
| `nature_of_training` | `nature` |
| `maxMarks` | `max_marks` |
| `hod` / `director` / `dean` / `vc` | `hod_score` / `director_score` / `dean_score` / `vc_score` |

**GET `/appraisal/status` response:**
```json
{
  "declaration": {
    "id", "faculty_email", "academic_year",
    "part_a_total", "part_b_total", "grand_total",
    "status", "submitted_at"
  },
  "reviews": [
    { "reviewer_role", "reviewer_email", "part_a_score", "part_b_score", "total_score", "remarks", "status", "reviewed_at" }
  ]
}
```

---

## Dashboard (Reviewers) — `/dashboard`

| Method | Path | Auth | Access |
|--------|------|------|--------|
| GET | `/dashboard/subordinates?academic_year=&schools=` | 🔒 | Role-filtered |
| GET | `/dashboard/faculty/{email}?academic_year=` | 🔒 | Authority check |

`GET /dashboard/subordinates` — returns list of faculty the caller has authority over, with declaration status and reviewer scores. `schools` param (comma-separated) is only respected for VC/Registrar.

Response item shape:
```json
{
  "email", "name", "department", "school", "appraisalRole",
  "status", "submittedOn",
  "selfPartA", "selfPartB", "selfTotal",
  "hodPartA", "hodPartB", "hodTotal", "hodRemarks",
  "directorPartA", ...
}
```

`GET /dashboard/faculty/{email}` — returns the full `AppraisalSnapshot` record (the JSONB payload the reviewer UI renders). Returns `null` if no snapshot exists yet.

---

## Remarks (Reviewers) — `/appraisal-remarks`

All are `PUT`. Requires the matching role (or `admin`). Path parameter is the **faculty email**.

| Path | Required role |
|------|--------------|
| `PUT /appraisal-remarks/hod/{email}` | `hod` |
| `PUT /appraisal-remarks/center-head/{email}` | `center_head` |
| `PUT /appraisal-remarks/director/{email}` | `director` |
| `PUT /appraisal-remarks/dean/{email}` | `dean` |
| `PUT /appraisal-remarks/final/{email}` | `vc` |

**Request body:**
```json
{
  "academic_year": "2025-26",
  "part_a_score": 0,
  "part_b_score": 0,
  "total_score": 0,
  "remarks": "...",
  "section_scores": {
    "lectures": 10, "journals": 5, "courseFile": 8
  }
}
```

`section_scores` keys must match the same form keys used in submit. The backend writes these into the corresponding `hod_score` / `director_score` / `dean_score` / `vc_score` columns in each section table.

**Declaration status progression:**
`Submitted` → *(HOD/center_head review)* → `pending_director` → `pending_dean` → `pending_vc` → `completed`

**Response:**
```json
{ "message": "Review submitted", "status": "pending_director" }
```

---

## Documents — `/appraisal-documents`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/appraisal-documents/?academic_year=` | 🔒 | List documents uploaded by current user |

Response: list of `AppraisalDocument` records with `file_url`, `storage_path`, `section`, `file_name`, `file_type`.

---

## File Upload — `/upload`

| Method | Path | Auth | Content-Type |
|--------|------|------|-------------|
| POST | `/upload` | 🔒 | `multipart/form-data` |

Form field name: `file`

**Response:**
```json
{ "url": "https://storage.googleapis.com/...", "publicId": "faculty/email/uuid_filename.pdf", "name": "filename.pdf", "type": "application/pdf" }
```

---

## Non-Teaching Staff — `/non-teaching`

| Method | Path | Auth | Access |
|--------|------|------|--------|
| GET | `/non-teaching/appraisal?academic_year=` | 🔒 | Own record |
| PUT | `/non-teaching/appraisal` | 🔒 | Create / update own record |
| GET | `/non-teaching/subordinates?academic_year=` | 🔒 | Reporting Officer / Registrar / VC |
| PUT | `/non-teaching/review/{email}` | 🔒 | RO / Registrar / VC |

**PUT `/non-teaching/appraisal` body:**
```json
{
  "academic_year": "2025-26",
  "payload": { <full form JSON> },
  "self_total": 0,
  "status": "Draft"
}
```
`staff_email` is set automatically from the token — do not send it.

**PUT `/non-teaching/review/{email}` body:**
```json
{ "academic_year": "2025-26", "total_score": 85, "payload": { <optional updated payload> } }
```

Non-teaching status flow: `Draft` → `pending_registrar` → `pending_vc` → `completed`

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request / missing required field |
| 401 | Missing or invalid token |
| 403 | Insufficient role |
| 404 | Faculty / record not found |
| 422 | Validation error — check request body shape |
| 500 | Server error — check Cloud Run logs |
