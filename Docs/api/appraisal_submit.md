# Submit Appraisal

## Endpoint
- **Method:** POST
- **URL:** `/api/v1/appraisal/submit`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Roles:** Any authenticated faculty (own data only)

## Request Body (JSON)
| Field | Type | Required | Notes |
|---|---|---|---|
| `academic_year` | string | Yes | e.g. `2025-2026` |
| `form` | object | Yes | All form sections (see structure below) |
| `totals` | object | No | Calculated score totals |
| `docs` | object | No | Uploaded file map — `doc_key → [file objects]` |
| `submitter_profile` | object | No | Profile snapshot at time of submit |
| `status` | string | No | Initial declaration status e.g. `"Pending HOD Review"` |
| `workflow_status` | string | No | Same as `status` — used if `status` is absent |
| `next_reviewer` | string | No | e.g. `"hod"` or `"director"` |
| `next_reviewer_role` | string | No | Same as `next_reviewer` |
| `review_chain` | array | No | Ordered list of reviewer roles e.g. `["hod","director","dean"]` |

The frontend first submits with all workflow fields. If the backend returns 400 or 422 (older version), it retries with only `academic_year`, `form`, and `totals`.

```json
{
  "academic_year": "2025-2026",
  "form": {
    "lectures":    [ { "semester": "Odd", "course_code": "CS101", "planned_classes": 40, "conducted_classes": 40, "score": 18 } ],
    "courseFile":  [ { "course": "CS101", "title": "Course Plan", "details": "Uploaded", "score": 18 } ],
    "innovativeTeaching": { "details": "Used flipped classroom", "score": 8 },
    "projects":    [ { "label": "UG Projects", "score": 5 } ],
    "quals":       [ { "label": "PhD Pursuing", "score": 10 } ],
    "feedback":    [ { "course_code": "CS101", "feedback_1": 4.2, "feedback_2": 4.5, "score": 9 } ],
    "deptActs":    [ { "activity": "Time Table Committee", "nature": "Member", "score": 5 } ],
    "uniActs":     [ { "activity": "Cultural Fest", "nature": "Coordinator", "score": 10 } ],
    "society":     [ { "activity": "Blood Donation", "status": "Completed", "details": "Organized", "score": 5 } ],
    "industry":    [ { "name": "TCS", "details": "Guest Lecture", "score": 5 } ],
    "acr":         [ { "label": "Self-motivation", "score": 4 } ],
    "journals":    [ { "title": "...", "journal": "...", "issn": "...", "indexing": "Scopus", "score": 10 } ],
    "books":       [ { "title": "...", "book": "...", "isbn": "...", "publisher": "...", "first_author": "Yes", "score": 5 } ],
    "ict":         [ { "title": "...", "description": "...", "type": "Video", "quadrant": "Q1", "score": 10 } ],
    "research":    [ { "degree": "PhD", "student_name": "John", "thesis": "ML in Healthcare", "score": 15 } ],
    "projects2":   [ { "title": "...", "agency": "DST", "sanction_date": "2024-01-15", "amount": 500000, "role": "PI", "project_status": "Ongoing", "score": 10 } ],
    "externalProjects": [ { "title": "...", "agency": "SERB", "sanction_date": "2024-03-01", "amount": 1000000, "role": "PI", "project_status": "Ongoing", "score": 15 } ],
    "patents":     [ { "title": "...", "type": "Utility", "scope": "International", "patent_date": "2024-06-01", "patent_status": "Granted", "file_no": "PAT/2024/001", "score": 10 } ],
    "awards":      [ { "title": "Best Teacher", "award_date": "2024-12-01", "agency": "University", "level": "University", "score": 5 } ],
    "confs":       [ { "title": "Paper title", "type": "Presentation", "organization": "IEEE", "level": "International", "score": 5 } ],
    "proposals":   [ { "title": "...", "duration": "3 years", "agency": "DST", "amount": 2000000, "score": 5 } ],
    "products":    [ { "details": "Lab kit", "usage": "Used in practicals", "score": 5 } ],
    "fdps":        [ { "program": "AI/ML Workshop", "duration": "5 days", "organization": "IIT Bombay", "score": 5 } ],
    "training":    [ { "company": "Infosys", "duration": "2 weeks", "nature": "Industrial Visit", "score": 5 } ]
  },
  "totals": { "partATotal": 45.5, "partBTotal": 30.0, "grandTotal": 75.5 },
  "docs": {
    "journals0": [ { "name": "paper.pdf", "type": "application/pdf", "url": "https://storage.googleapis.com/...", "publicId": "faculty/uploads/uuid_paper.pdf" } ]
  },
  "submitter_profile": {
    "email": "faculty@example.com",
    "appraisal_role": "faculty",
    "school": "SoCSEA",
    "department": "Computer Science"
  },
  "status": "Pending HOD Review",
  "workflow_status": "Pending HOD Review",
  "next_reviewer": "hod",
  "next_reviewer_role": "hod",
  "review_chain": ["hod", "director", "dean"]
}
```

### Date format
All date fields accept `DD/MM/YYYY`, `YYYY-MM-DD`, or `DD-MM-YYYY`. The backend normalises them before storage.

### Frontend → Backend field aliases
| Frontend key | DB column |
|---|---|
| `title_with_page_nos` | `title` |
| `journal_details` | `journal` |
| `issn_isbn_no` / `issn_isbn` | `issn` |
| `course_code_name` / `course_paper` | `course_code` / `course` |
| `nature_of_activity` | `nature` |
| `activity_type` | `activity` |
| `details_of_activity` / `short_description` | `details` |
| `title_and_pages` | `title` |
| `book_title_editor` | `book` |
| `event_title` | `title` |
| `hosting_organization` | `organization` |
| `event_level` | `level` |
| `pedagogy_type` | `type` |
| `company_industry` | `company` |
| `duration_days` | `duration` |
| `nature_of_training` | `nature` |
| `hod` / `director` / `dean` / `vc` | `hod_score` / `director_score` / `dean_score` / `vc_score` |
| `maxMarks` | `max_marks` |

## Response (200)
```json
{
  "message": "Submitted successfully",
  "submitted_at": "2025-06-01T10:00:00"
}
```

## Error Responses
| Status | Condition |
|---|---|
| 400 | `form` key missing from request |
| 403 | Appraisal cycle is closed (`appraisal_config.is_open = false` for this year) |
| 422 | `academic_year` missing |
| 500 | DB constraint violation or unexpected error |

## Database
All writes happen in a single transaction:

1. **Cycle gate** — reads `appraisal_config`; if `is_open = false` for this year, returns 403
2. **Deletes** all existing rows for `(faculty_email, academic_year)` in every Part A and Part B table
3. **Inserts** fresh rows from the submitted form into the normalized tables
4. **Flushes** to surface any constraint violations early
5. **Upserts** `declarations` — status is taken from the `status` or `workflow_status` field in the payload (e.g. `"Pending HOD Review"`); defaults to `"Submitted"` if absent
6. **Deletes** existing `appraisal_documents` rows for this user/year, then **inserts** fresh rows from the `docs` map
7. **Upserts** `appraisal_snapshots` with the full request payload
8. Commits atomically

**Tables written:** `teaching_process`, `course_files`, `innovative_teaching`, `projects_guided`, `qualification_enhancement`, `student_feedback`, `department_activities`, `university_activities`, `social_contributions`, `industry_connect`, `acr_scores`, `journal_publications`, `book_publications`, `ict_pedagogy`, `research_guidance`, `research_projects`, `external_research_projects`, `patents`, `awards`, `conferences`, `research_proposals`, `products_developed`, `self_development`, `industrial_training`, `declarations`, `appraisal_documents`, `appraisal_snapshots`
