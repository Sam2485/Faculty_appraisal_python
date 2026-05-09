# Login

## Endpoint
- **Method:** POST
- **URL:** `/api/v1/auth/login`
- **Auth:** Not required

## Request Body (JSON)
| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string (email) | Yes | Must match a registered account |
| `password` | string | Yes | Plaintext — bcrypt-verified server-side |

## Response (200)
```json
{
  "token": "eyJ...",
  "profile": {
    "email": "string",
    "full_name": "string",
    "appraisal_role": "string",
    "department": "string",
    "school": "string",
    "employee_id": "string",
    "designation": "string",
    "qualification": "string",
    "teaching_experience": "string",
    "phone": "string",
    "avatar": "string | null"
  }
}
```

## Error Responses
| Status | Condition |
|---|---|
| 401 | Email not found or wrong password |
| 403 | Account exists but email not yet verified |

## Database
- Reads `faculty_profiles` WHERE `email = ?`
- Checks `password_hash` with bcrypt
- Checks `is_verified = true` before allowing login
- No writes

## Notes
- Store the returned `token` in `sessionStorage` (key: `accessToken`) and send it as `Authorization: Bearer <token>` on all protected requests.
- The token does not expire on the server — it is valid until a new one is issued.
