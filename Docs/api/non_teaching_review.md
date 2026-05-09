# Non-Teaching Review (RO / Registrar / VC)

## Endpoint
- **Method:** PUT
- **URL:** `/api/v1/non-teaching/review/{staffEmail}`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Roles:** Reporting Officer, Registrar, VC (or Admin)

## Path Parameters
| Field | Type | Notes |
|---|---|---|
| `staffEmail` | string | Email of the staff member being reviewed (URL-encoded) |

## Request Body (JSON)
| Field | Type | Required | Notes |
|---|---|---|---|
| `academic_year` | string | Yes | e.g. `2025-2026` |
| `payload` | object | Yes | Full form payload with reviewer's marks filled in (Part A marks as `roMarks`/`regMarks`/`vcMarks`; Part B ratings as `p{n}_ro`/`p{n}_reg`/`p{n}_vc`) |
| `status` | string | Yes | Next appraisal status (see table below) |
| `remarks` | string | No | Free-text reviewer remarks |

```json
{
  "academic_year": "2025-2026",
  "payload": {
    "appraisalType": "non-teaching",
    "submittedByRole": "non_teaching_staff",
    "status": "Reporting Officer Reviewed",
    "info": { ... },
    "selfResp":    { "text": "Manage lab equipment", "marks": "8" },
    "selfContrib": { "text": "Organized events", "marks": "7" },
    "selfAchieve": { "text": "Won best staff award", "marks": "4" },
    "partB": {
      "profComp": { "p0_ro": 4, "p1_ro": 3, "p0_reg": 0, "p1_reg": 0, "p0_vc": 0, "p1_vc": 0 },
      "quality":  {},
      "personal": {},
      "regular":  {}
    },
    "docs": {},
    "remarks": "",
    "roRemarks": "Satisfactory performance",
    "registrarRemarks": "",
    "vcRemarks": ""
  },
  "status": "Reporting Officer Reviewed",
  "remarks": "Satisfactory performance"
}
```

### `remarks` field mapping inside payload

| Reviewer | Remarks field in payload |
|---|---|
| `reporting_officer` | `roRemarks` |
| `registrar` | `registrarRemarks` |
| `vc` | `vcRemarks` |

The top-level `remarks` field and the corresponding payload remarks field should contain the same value.

## Response (200)
Returns the updated `non_teaching_appraisals` row (same shape as an item from `GET /non-teaching/subordinates`):

```json
{
  "id": "<uuid>",
  "staff_email": "staff@example.com",
  "academic_year": "2025-2026",
  "status": "Reporting Officer Reviewed",
  "self_total": 19.0,
  "ro_total": 72.0,
  "registrar_total": 0,
  "vc_total": 0,
  "submitted_at": "2025-06-02T09:00:00",
  "payload": { ... }
}
```

## Error Responses
| Status | Condition |
|---|---|
| 403 | Caller does not have authority over this staff member, or wrong role |
| 404 | Staff profile not found or appraisal not found |
| 422 | `academic_year` missing from request body |

## Database
1. Reads `faculty_profiles` to verify the target staff exists and checks authority
2. Reads `non_teaching_appraisals` for `(staff_email, academic_year)`
3. Updates the appropriate total column, status, payload, and reviewed-at timestamp:

| Reviewer role | Total column updated | Payload remarks field | New status | Timestamp column |
|---|---|---|---|---|
| `reporting_officer` | `ro_total` | `roRemarks` | `Reporting Officer Reviewed` | `ro_reviewed_at` |
| `registrar` | `registrar_total` | `registrarRemarks` | `Registrar Reviewed` | `registrar_reviewed_at` |
| `vc` | `vc_total` | `vcRemarks` | `VC Approved` | `vc_reviewed_at` |

4. Commits

## Notes
- `total_score` from the request body (if present) is written to the appropriate total column. If absent, the backend derives the total from the updated payload.
- Admin defaults to the `registrar` review level if no other matching role is found.
