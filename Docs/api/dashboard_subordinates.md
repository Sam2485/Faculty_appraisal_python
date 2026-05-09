# Get Dashboard Subordinates

## Endpoint
- **Method:** GET
- **URL:** `/api/v1/dashboard/subordinates`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Roles:** HOD, Director, Dean, VC, Registrar, Center Head (faculty returns empty array)

## Query Parameters
| Field | Type | Required | Notes |
|---|---|---|---|
| `academic_year` | string | Yes | e.g. `2025-2026` |
| `reviewer_role` | string | Yes | Role the caller is acting as e.g. `hod`, `director` |
| `pending_status` | string | Yes | Status string the reviewer is looking for e.g. `"Pending HOD Review"` |
| `reviewer_school` | string | No | School of the reviewer — used as fallback if not in JWT |
| `reviewer_department` | string | No | Department of the reviewer — used as fallback if not in JWT |
| `schools` | string | No | Comma-separated school codes — VC/Registrar filter only e.g. `SoCSEA,SoBB` |

`reviewer_role`, `pending_status`, `reviewer_school`, `reviewer_department` are sent by the frontend but authority filtering is always enforced server-side via the JWT.

## Visibility rules by role
| Role | Sees |
|---|---|
| VC / Registrar | All schools (or filtered by `schools` param) |
| Dean of Engineering | SoCSEA, SoBB, SoCE, SoEMR only |
| Dean of Non-Engineering | SoC, SoMCS, CioD, SoAA only |
| Director / Reporting Officer | Their own school only |
| Center Head | CISR only |
| HOD | Their own school AND department only |
| Faculty | Empty array |

## Response (200)
Array of subordinate objects. All reviewer score fields are present on every row, defaulting to `0` / `""` until that reviewer has submitted:

```json
[
  {
    "email": "string",
    "name": "string",
    "department": "string",
    "school": "string",
    "appraisal_role": "string",
    "designation": "string",
    "status": "string",
    "submitted_at": "timestamp | null",
    "part_a_total": 0,
    "part_b_total": 0,
    "grand_total": 0,
    "hod_total": 0,
    "hod_part_a": 0,
    "hod_part_b": 0,
    "hod_remarks": "",
    "director_total": 0,
    "director_part_a": 0,
    "director_part_b": 0,
    "director_remarks": "",
    "dean_total": 0,
    "dean_part_a": 0,
    "dean_part_b": 0,
    "dean_remarks": "",
    "vc_total": 0,
    "vc_part_a": 0,
    "vc_part_b": 0,
    "vc_remarks": ""
  }
]
```

## Database
1. LEFT JOINs `faculty_profiles` with `declarations` (filtered to `academic_year`) — scoped by role visibility rules
2. Fetches ALL `appraisal_reviews` for the academic year in a **single batched query** (`WHERE faculty_email IN (...)`)
3. Groups reviews by email in Python — no N+1 queries
