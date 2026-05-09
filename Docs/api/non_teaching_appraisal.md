# Non-Teaching Appraisal — Get & Save

## Get Appraisal

### Endpoint
- **Method:** GET
- **URL:** `/api/v1/non-teaching/appraisal`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Roles:** Any authenticated user (own data only)

### Query Parameters
| Field | Type | Required | Notes |
|---|---|---|---|
| `academic_year` | string | Yes | e.g. `2025-2026` |

### Response (200)
Returns the full `non_teaching_appraisals` row, or `null` if none exists.
```json
{
  "id": "uuid",
  "staff_email": "staff@example.com",
  "academic_year": "2025-2026",
  "status": "Draft",
  "self_total": 0,
  "ro_total": 0,
  "registrar_total": 0,
  "vc_total": 0,
  "submitted_at": null,
  "payload": {
    "appraisalType": "non-teaching",
    "submittedByRole": "non_teaching_staff",
    "status": "Draft",
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
      "profComp": { "p0_ro": 4, "p1_ro": 3, "p0_reg": 4, "p1_reg": 4, "p0_vc": 4, "p1_vc": 4 },
      "quality":   {},
      "personal":  {},
      "regular":   {}
    },
    "docs": {},
    "remarks": "",
    "roRemarks": "",
    "registrarRemarks": "",
    "vcRemarks": ""
  }
}
```

**`status` values:**

| Value | Set by |
|---|---|
| `Draft` | Staff (auto-save) |
| `Submitted` | Staff (final submit) |
| `Reporting Officer Reviewed` | Reporting Officer after review |
| `Registrar Reviewed` | Registrar after review |
| `VC Approved` | VC after final review |

### Database
- Reads `non_teaching_appraisals` WHERE `staff_email = ? AND academic_year = ?`

---

## Save / Submit Appraisal

### Endpoint
- **Method:** PUT
- **URL:** `/api/v1/non-teaching/appraisal`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Roles:** Any authenticated user (own data only)

### Request Body (JSON)
| Field | Type | Required | Notes |
|---|---|---|---|
| `staff_email` | string | No | Overridden server-side to `current_user.email` |
| `academic_year` | string | Yes | |
| `status` | string | Yes | `Draft` for auto-save, `Submitted` for final submit |
| `payload` | object | Yes | Full form state (same shape as GET response payload) |

```json
{
  "academic_year": "2025-2026",
  "status": "Submitted",
  "payload": {
    "appraisalType": "non-teaching",
    "status": "Submitted",
    "info": { ... },
    "selfResp":    { "text": "...", "marks": "8" },
    "selfContrib": { "text": "...", "marks": "7" },
    "selfAchieve": { "text": "...", "marks": "4" },
    "partB": { ... },
    "docs": { ... },
    "remarks": ""
  }
}
```

### Response (200)
Returns the updated `non_teaching_appraisals` row (same shape as GET response).

### Database
- Upserts `non_teaching_appraisals` on `(staff_email, academic_year)`
