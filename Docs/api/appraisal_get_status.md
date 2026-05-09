# Get Appraisal Status

## Endpoint
- **Method:** GET
- **URL:** `/api/v1/appraisal/status`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Roles:** Any authenticated faculty (own data only)

## Query Parameters
| Field | Type | Required | Notes |
|---|---|---|---|
| `academic_year` | string | Yes | e.g. `2025-2026` |

## Response (200)
```json
{
  "declaration": {
    "id": "uuid",
    "faculty_email": "string",
    "academic_year": "string",
    "part_a_total": 0,
    "part_b_total": 0,
    "grand_total": 0,
    "status": "string",
    "submitted_at": "timestamp"
  },
  "reviews": [
    {
      "reviewer_role": "hod | center_head | director | dean | vc",
      "reviewer_email": "string",
      "part_a_score": 0,
      "part_b_score": 0,
      "total_score": 0,
      "section_scores": { "lectures": 18, "journals": 20 },
      "remarks": "string",
      "status": "Reviewed",
      "reviewed_at": "timestamp"
    }
  ]
}
```
`declaration` is `null` if the faculty has not submitted yet. `reviews` is an empty array if no authority has reviewed yet.

## Declaration `status` progression
`Pending HOD Review` → `Pending Director Review` → `Pending Dean Review` → `Pending VC Review` → `Reviewed`

Schools without HOD (all except SoEMR) start at `Pending Director Review`.
CISR goes: `Pending VC Review` → `Reviewed` (reviewed by Center Head, then VC).

## Database
- Reads `declarations` WHERE `faculty_email = ? AND academic_year = ?`
- Reads `appraisal_reviews` WHERE `faculty_email = ? AND academic_year = ?`
- Reviews are serialized manually to include `section_scores` JSONB
