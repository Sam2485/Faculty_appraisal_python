# Non-Teaching Subordinates Dashboard

## Endpoint
- **Method:** GET
- **URL:** `/api/v1/non-teaching/subordinates`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Roles:** Reporting Officer, Registrar, VC

## Query Parameters
| Field | Type | Required | Notes |
|---|---|---|---|
| `academic_year` | string | Yes | e.g. `2025-2026` |

## Visibility rules by role

| Reviewer | Sees | Status filter |
|---|---|---|
| `reporting_officer` | Non-teaching staff in their own school AND department | Only `Submitted` |
| `registrar` | All `non_teaching_staff` and `reporting_officer` records | Only `Reporting Officer Reviewed` |
| `vc` | All non-teaching roles across all schools | Only `Registrar Reviewed` |
| Others | Empty array | — |

## Response (200)
Array of non-teaching staff appraisal records. Each item has the same shape as the `GET /non-teaching/appraisal` response:

```json
[
  {
    "id": "<uuid>",
    "staff_email": "staff@example.com",
    "academic_year": "2025-2026",
    "status": "Submitted",
    "self_total": 19.0,
    "ro_total": 0,
    "registrar_total": 0,
    "vc_total": 0,
    "submitted_at": "2025-06-02T09:00:00",
    "payload": {
      "appraisalType": "non-teaching",
      "submittedByRole": "non_teaching_staff",
      "status": "Submitted",
      "info": {
        "name": "John Smith",
        "email": "staff@example.com",
        "employeeId": "EMP099",
        "designation": "Lab Assistant",
        "department": "Computer Science",
        "reportingHead": "",
        "ay": "2025-2026"
      },
      "selfResp":    { "text": "Manage lab equipment", "marks": "8" },
      "selfContrib": { "text": "Organized events", "marks": "7" },
      "selfAchieve": { "text": "Won best staff award", "marks": "4" },
      "partB": {
        "profComp": { "p0_ro": 0, "p1_ro": 0, "p0_reg": 0, "p1_reg": 0, "p0_vc": 0, "p1_vc": 0 },
        "quality":  {},
        "personal": {},
        "regular":  {}
      },
      "docs": {},
      "remarks": "",
      "roRemarks": "",
      "registrarRemarks": "",
      "vcRemarks": ""
    }
  }
]
```

## Database
- JOINs `non_teaching_appraisals` with `faculty_profiles` on `staff_email = email`
- Filters by `academic_year`
- Applies visibility rules based on the reviewer's role, school, and department (from JWT)
- Applies status filter per role (see table above)
