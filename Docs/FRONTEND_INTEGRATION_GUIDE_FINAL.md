# Faculty Appraisal System — Frontend Integration Guide

This is the definitive integration reference for the frontend team. It covers every endpoint, exact request shapes, response shapes, and the critical payload contract for form submission.

---

## Global Setup

```
Base URL:  https://<cloud-run-url>/api/v1
Auth:      Authorization: Bearer <token>   (on all protected routes)
```

The token is returned by `POST /auth/login`. Store it in memory or localStorage and attach it to every subsequent request.

---

## 1. Authentication

### Login
```
POST /auth/login
Content-Type: application/json
```
```json
{ "email": "faculty@dypu.edu.in", "password": "secret" }
```
**Response:**
```json
{
  "token": "<jwt>",
  "profile": {
    "email": "faculty@dypu.edu.in",
    "full_name": "Dr. Jane Smith",
    "role": "faculty",
    "appraisal_role": "faculty",
    "department": "Computer Engineering",
    "school": "SoCSEA",
    "employee_id": "EMP001",
    "designation": "Assistant Professor",
    "phone": "9876543210",
    "profile_picture_url": null
  }
}
```

### Register
```
POST /auth/register
Content-Type: application/json
```
```json
{
  "email": "faculty@dypu.edu.in",
  "password": "secret",
  "full_name": "Dr. Jane Smith",
  "appraisal_role": "faculty",
  "school": "SoCSEA",
  "department": "Computer Engineering",
  "designation": "Assistant Professor",
  "employee_id": "EMP001",
  "phone": "9876543210",
  "qualification": "PhD",
  "teaching_experience": "5 years"
}
```
Returns `{ "message": "Registration successful. Please check your email...", "email": "..." }`. A verification link is emailed automatically.

### Email Verification
`GET /auth/verify-email?token=<token_from_email>` — This is a redirect endpoint. The backend redirects the browser to `{FRONTEND_URL}/login?verified=true` on success or `?error=...` on failure.

### Get / Update Profile
```
GET  /auth/me                    → returns profile object (same shape as login)
PUT  /auth/me   { full_name?, department?, school?, designation?, phone?, avatar? }
```

### Change Password
```
POST /auth/change-password
{ "current_password": "...", "new_password": "..." }
```

---

## 2. Faculty Appraisal Workflow

### Step 1 — Save Draft
Call this every time the user saves progress. The backend stores the full JSON for the reviewer UI to read.

```
PUT /appraisal/snapshot
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "academic_year": "2025-26",
  "payload": { <any shape you want — full form state> }
}
```
Returns `{ "message": "Saved" }`.

### Step 2 — Load Draft
```
GET /appraisal/snapshot?academic_year=2025-26
Authorization: Bearer <token>
```
Returns the `AppraisalSnapshot` object (with `payload` field) or `null`.

### Step 3 — Submit

This is the most critical call. The backend:
1. Deletes all existing rows for this faculty/year across every Part A and Part B table.
2. Inserts fresh rows from the `form` payload.
3. Creates/updates a `Declaration` row with status `Submitted`.
4. Updates the snapshot with the full submission.
5. Commits everything in one atomic transaction.

```
POST /appraisal/submit
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "academic_year": "2025-26",
  "form": {
    "lectures": [
      { "semester": "Autumn 2025", "course_code": "CS301", "planned_classes": 45, "conducted_classes": 44, "score": 10 }
    ],
    "courseFile": [
      { "course": "Theory", "title": "Data Structures", "details": "Complete", "score": 5 }
    ],
    "innovDetails": "Used Kahoot for quiz sessions",
    "innovScore": 3,
    "projects": [
      { "label": "BE Final Year Project", "score": 4 }
    ],
    "quals": [
      { "label": "PhD Completed", "score": 5 }
    ],
    "feedback": [
      { "course_code": "CS301", "feedback_1": 4.2, "feedback_2": 4.5, "score": 8 }
    ],
    "deptActs": [
      { "activity": "Exam Committee Member", "nature": "Departmental", "score": 3 }
    ],
    "uniActs": [
      { "activity": "Senate Member", "nature": "University", "score": 5 }
    ],
    "society": [
      { "activity": "Blood Donation Drive", "status": "Completed", "details": "Organised", "score": 2 }
    ],
    "industry": [
      { "name": "TCS MoU", "details": "Guest lecture arranged", "score": 3 }
    ],
    "acr": [
      { "label": "Professional Conduct", "score": 10 }
    ],
    "journals": [
      { "title": "Deep Learning Survey", "journal": "IEEE Access", "issn": "2169-3536", "indexing": "SCOPUS", "score": 8 }
    ],
    "books": [
      { "title": "Chapter 3", "book": "AI Handbook", "issn": "", "isbn": "978-3-16-148410-0", "publisher": "Springer", "coauthor": "Dr. X", "first_author": "Yes", "score": 5 }
    ],
    "ict": [
      { "title": "NPTEL Course", "description": "Online course on ML", "type": "MOOCs", "quadrant": "Q1", "score": 4 }
    ],
    "research": [
      { "degree": "PhD", "student_name": "Student A", "thesis": "NLP Applications", "score": 6 }
    ],
    "projects2": [
      { "title": "Internal AI Project", "agency": "DY Patil University", "sanction_date": "2024-06-01", "amount": 50000, "role": "PI", "project_status": "Ongoing", "score": 5 }
    ],
    "externalProjects": [
      { "title": "DST Project", "agency": "DST India", "sanction_date": "2024-01-15", "amount": 500000, "role": "Co-PI", "project_status": "Completed", "score": 8 }
    ],
    "patents": [
      { "title": "Smart Irrigation System", "type": "Utility", "scope": "National", "patent_date": "2024-03-10", "patent_status": "Granted", "file_no": "202121012345", "score": 7 }
    ],
    "awards": [
      { "title": "Best Teacher Award", "award_date": "2024-09-05", "agency": "DY Patil University", "level": "University", "score": 5 }
    ],
    "confs": [
      { "title": "AI in Education", "type": "Paper Presentation", "organization": "IEEE", "level": "International", "score": 4 }
    ],
    "proposals": [
      { "title": "ML for Healthcare", "duration": "2 years", "agency": "ICMR", "amount": 300000, "score": 3 }
    ],
    "products": [
      { "details": "Automated Attendance System", "usage": "Used by 200 students", "score": 4 }
    ],
    "fdps": [
      { "program": "ISTE FDP on Python", "duration": "5 days", "organization": "ISTE", "score": 3 }
    ],
    "training": [
      { "company": "Infosys", "duration": "7 days", "nature": "Cloud Computing", "score": 4 }
    ]
  },
  "totals": {
    "partATotal": 58,
    "partBTotal": 72,
    "grandTotal": 130
  }
}
```

> **The `form` keys are exact string matches.** If a key is wrong (e.g., `"Lectures"` instead of `"lectures"`), that section is silently skipped and no rows are written for it. Double-check all keys against this list:
> `lectures`, `courseFile`, `innovDetails` + `innovScore`, `projects`, `quals`, `feedback`, `deptActs`, `uniActs`, `society`, `industry`, `acr`, `journals`, `books`, `ict`, `research`, `projects2`, `externalProjects`, `patents`, `awards`, `confs`, `proposals`, `products`, `fdps`, `training`

**Success response:**
```json
{ "message": "Submitted successfully", "submitted_at": "2025-05-08T10:30:00.000000" }
```

**Field name aliases** — if your form uses these legacy names, the backend will silently remap them:

| You send | Backend stores as |
|----------|------------------|
| `title_with_page_nos` | `title` |
| `journal_details` | `journal` |
| `issn_isbn_no` or `issn_isbn` | `issn` |
| `course_code_name` | `course_code` |
| `course_paper` | `course` |
| `nature_of_activity` | `nature` |
| `activity_type` | `activity` |
| `details_of_activity` | `details` |
| `project_type` or `qualification_type` | `label` |
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
| `hod` | `hod_score` |
| `director` | `director_score` |
| `dean` | `dean_score` |
| `vc` | `vc_score` |

### Step 4 — Check Status
```
GET /appraisal/status?academic_year=2025-26
Authorization: Bearer <token>
```
```json
{
  "declaration": {
    "faculty_email": "faculty@dypu.edu.in",
    "academic_year": "2025-26",
    "part_a_total": 58,
    "part_b_total": 72,
    "grand_total": 130,
    "status": "pending_director",
    "submitted_at": "2025-05-08T10:30:00"
  },
  "reviews": [
    {
      "reviewer_role": "hod",
      "reviewer_email": "hod@dypu.edu.in",
      "part_a_score": 55,
      "part_b_score": 70,
      "total_score": 125,
      "remarks": "Good performance",
      "status": "Reviewed",
      "reviewed_at": "2025-05-09T09:00:00"
    }
  ]
}
```

**Declaration status values:**
`Submitted` → `pending_director` → `pending_dean` → `pending_vc` → `completed`

---

## 3. Reviewer Dashboard

### List Subordinates (HOD / Director / Dean / VC)
```
GET /dashboard/subordinates?academic_year=2025-26
Authorization: Bearer <token>
```
Returns all faculty the caller has authority over (role-filtered automatically).

Response item:
```json
{
  "email": "faculty@dypu.edu.in",
  "name": "Dr. Jane Smith",
  "department": "Computer Engineering",
  "school": "SoCSEA",
  "appraisalRole": "faculty",
  "status": "Submitted",
  "submittedOn": "2025-05-08",
  "selfPartA": 58,
  "selfPartB": 72,
  "selfTotal": 130,
  "hodPartA": 55,
  "hodPartB": 70,
  "hodTotal": 125,
  "hodRemarks": "Good"
}
```

VC/Registrar can additionally filter by `?schools=SoCSEA,SoBB` (comma-separated).

### View a Faculty's Form
```
GET /dashboard/faculty/{email}?academic_year=2025-26
Authorization: Bearer <token>
```
Returns the `AppraisalSnapshot` — the same JSON the faculty submitted (or saved as draft). This is what the reviewer UI should render. Returns `null` if the faculty hasn't saved a draft yet.

---

## 4. Reviewer Actions (Remarks)

Submit scores and remarks for a faculty member. Use the endpoint matching your role.

| Your role | Endpoint |
|-----------|----------|
| HOD | `PUT /appraisal-remarks/hod/{faculty_email}` |
| Center Head | `PUT /appraisal-remarks/center-head/{faculty_email}` |
| Director | `PUT /appraisal-remarks/director/{faculty_email}` |
| Dean | `PUT /appraisal-remarks/dean/{faculty_email}` |
| VC | `PUT /appraisal-remarks/final/{faculty_email}` |

```
PUT /appraisal-remarks/hod/faculty@dypu.edu.in
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "academic_year": "2025-26",
  "part_a_score": 55,
  "part_b_score": 70,
  "total_score": 125,
  "remarks": "Excellent research output. Teaching consistent.",
  "section_scores": {
    "lectures": 9,
    "courseFile": 5,
    "journals": 7,
    "confs": 4
  }
}
```

`section_scores` is optional but recommended — it writes per-section reviewer scores into the DB. Keys must match the same form keys used in submit.

**Response:**
```json
{ "message": "Review submitted", "status": "pending_director" }
```

---

## 5. File Upload

```
POST /upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
Form field name: `file`

**Response:**
```json
{
  "url": "https://storage.googleapis.com/bucket/faculty/email/uuid_filename.pdf",
  "publicId": "faculty/email@dypu.edu.in/abc123_document.pdf",
  "name": "document.pdf",
  "type": "application/pdf"
}
```

Store the `url` in your form state and include it in the relevant section of the submit payload if needed.

---

## 6. Uploaded Documents List

```
GET /appraisal-documents/?academic_year=2025-26
Authorization: Bearer <token>
```

Returns all documents uploaded by the current user for that year. Useful for showing proof attachments in the review UI.

---

## 7. Non-Teaching Staff

### Submit / Update Appraisal
```
PUT /non-teaching/appraisal
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "academic_year": "2025-26",
  "payload": { <full non-teaching form data> },
  "self_total": 85,
  "status": "Submitted"
}
```
`staff_email` is automatically set from the auth token — do not include it.

### Get Own Appraisal
```
GET /non-teaching/appraisal?academic_year=2025-26
Authorization: Bearer <token>
```

### Reviewer — List Subordinates
```
GET /non-teaching/subordinates?academic_year=2025-26
Authorization: Bearer <token>   (Reporting Officer / Registrar / VC only)
```

### Reviewer — Submit Review
```
PUT /non-teaching/review/{staff_email}
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{ "academic_year": "2025-26", "total_score": 90, "payload": { <optional updated payload> } }
```

Non-teaching status flow: `Draft` → `pending_registrar` → `pending_vc` → `completed`

---

## 8. Error Handling

All errors follow this shape:
```json
{ "detail": "Human-readable message" }
```

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 400 | Bad request | Missing `form` key in submit body |
| 401 | Unauthorized | Token missing, expired, or invalid |
| 403 | Forbidden | Role not permitted for this action |
| 404 | Not found | Faculty email doesn't exist |
| 422 | Validation error | Wrong field type (e.g. string where int expected) — check `detail` array |
| 500 | Server error | Check Cloud Run logs for stack trace |

---

## 9. School Codes Reference

| Code | School | Form Family |
|------|--------|-------------|
| SoCSEA | School of Computer Science & Engineering and Applications | standard |
| SoBB | School of Business, Banking & Management | standard |
| SoCE | School of Civil Engineering | standard |
| SoEMR | School of Engineering, Media & Research | standard |
| SoC | School of Commerce | standard |
| CISR | Centre for Interdisciplinary Studies & Research | standard |
| SoMCS | School of Media & Communication Studies | media |
| CioD | City Institute of Design | design |
| SoAA | School of Applied Arts | design |
