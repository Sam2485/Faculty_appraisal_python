# Submit Appraisal Review (HOD / Center Head / Director / Dean / VC)

## Endpoints
Each authority role has its own URL. The request body and response are identical for all.

| Role | Method | URL |
|---|---|---|
| HOD | PUT | `/api/v1/appraisal-remarks/hod/{email}` |
| Center Head | PUT | `/api/v1/appraisal-remarks/center-head/{email}` |
| Director | PUT | `/api/v1/appraisal-remarks/director/{email}` |
| Dean | PUT | `/api/v1/appraisal-remarks/dean/{email}` |
| VC | PUT | `/api/v1/appraisal-remarks/final/{email}` |

- **Auth:** Required (`Authorization: Bearer <token>`)
- **Roles:** Must match the endpoint's role (or `admin`)

## Path Parameters
| Field | Type | Notes |
|---|---|---|
| `email` | string | Email of the faculty being reviewed (URL-encoded) |

## Request Body (JSON)
The frontend first sends the full body including workflow fields. If the backend returns 400 or 422 (older version), it retries with only the base fields.

| Field | Type | Required | Notes |
|---|---|---|---|
| `academic_year` | string | Yes | e.g. `2025-2026` |
| `part_a_score` | number | Yes | Authority's Part A score |
| `part_b_score` | number | Yes | Authority's Part B score |
| `total_score` | number | Yes | Combined total |
| `remarks` | string | No | Free-text remarks |
| `section_scores` | object | No | Per-section scores — keys match submit endpoint section keys |
| `status` | string | No | Next declaration status e.g. `"Pending Director Review"` |
| `workflow_status` | string | No | Same as `status` |
| `review_status` | string | No | e.g. `"HOD Reviewed"` |
| `next_reviewer` | string | No | e.g. `"director"` |
| `next_reviewer_role` | string | No | Same as `next_reviewer` |

```json
{
  "academic_year": "2025-2026",
  "part_a_score": 42.0,
  "part_b_score": 28.0,
  "total_score": 70.0,
  "remarks": "Good performance overall.",
  "section_scores": {
    "lectures": 18,
    "courseFile": 9,
    "journals": 20
  },
  "status": "Pending Director Review",
  "workflow_status": "Pending Director Review",
  "review_status": "HOD Reviewed",
  "next_reviewer": "director",
  "next_reviewer_role": "director"
}
```

## Response (200)
```json
{
  "message": "Review submitted",
  "status": "Pending Director Review"
}
```

## Error Responses
| Status | Condition |
|---|---|
| 403 | Wrong role, or caller does not have authority over this faculty |
| 404 | Faculty profile not found |

## Database
All writes happen in a single transaction:

1. **Upserts** `appraisal_reviews` — one row per `(faculty_email, academic_year, reviewer_role)`. Saves `section_scores` JSONB on the review row.
2. **Updates** individual section tables — if `section_scores` is provided, writes the authority's score into the appropriate column (`hod_score`, `director_score`, `dean_score`, `vc_score`). Center Head score is written to `director_score`.
3. **Updates** `declarations.status` based on reviewer role:

| Reviewer | New declaration status |
|---|---|
| HOD | `Pending Director Review` |
| Center Head | `Pending VC Review` |
| Director | `Pending Dean Review` |
| Dean | `Pending VC Review` |
| VC | `Reviewed` |

4. Commits

## Notes
- The `status` / `workflow_status` fields in the request are accepted but the backend always uses its own status map (above) for the declaration — the frontend values are not trusted for security.
- Dean visibility is division-restricted: Dean of Engineering cannot review non-engineering faculty.
- `section_scores` key names must match the form section keys (`lectures`, `courseFile`, `journals`, etc.).
