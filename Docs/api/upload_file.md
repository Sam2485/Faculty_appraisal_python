# Upload File

## Endpoint
- **Method:** POST
- **URL:** `/api/v1/upload`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Roles:** Any authenticated user
- **Content-Type:** `multipart/form-data`

## Request
| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | file (binary) | Yes | The file to upload |
| `folder` | string | No | Storage sub-folder e.g. `"faculty-appraisal/journals0"` or `"non-teaching-appraisal/selfResp"` |

## Response (200)
```json
{
  "url": "https://storage.googleapis.com/...",
  "publicId": "faculty-appraisal/journals0/uuid_paper.pdf",
  "name": "paper.pdf",
  "type": "application/pdf"
}
```

## Error Responses
| Status | Condition |
|---|---|
| 500 | GCS upload failure |

## Storage
- Uploads to Google Cloud Storage bucket (`GCP_STORAGE_BUCKET` env var)
- If `folder` is provided: path is `{folder}/{uuid}_{filename}`
- If `folder` is absent: path defaults to `faculty/{user_email}/{uuid}_{filename}`
- Returns the public URL of the uploaded file

## Dev / No-bucket fallback
If `GCP_STORAGE_BUCKET` is not set, returns a mock response with a placeholder URL. No actual upload occurs.

## Notes
- The returned `url` and `publicId` should be stored in the appraisal form's `docs` map and submitted with the appraisal.
- This endpoint does **not** write to the database. Document metadata is saved to `appraisal_documents` when the appraisal is submitted via `POST /appraisal/submit`.
