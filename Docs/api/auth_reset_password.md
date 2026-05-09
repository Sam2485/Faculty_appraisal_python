# Reset Password

## Endpoint
- **Method:** POST
- **URL:** `/api/v1/auth/reset-password`
- **Auth:** Not required

## Request Body (JSON)
| Field | Type | Required | Notes |
|---|---|---|---|
| `token` | string | Yes | Raw token from the reset email link |
| `new_password` | string | Yes | The new password (will be bcrypt-hashed) |

```json
{
  "token": "<raw_token_from_email>",
  "new_password": "newSecret123"
}
```

## Response (200)
```json
{ "message": "Password reset successfully." }
```

## Error Responses
| Status | Condition |
|---|---|
| 400 | `token` or `new_password` missing |
| 400 | Token not found, already used, or expired |

## Database
1. Hashes the provided token with SHA-256
2. Looks up `password_reset_tokens` WHERE `token_hash = ? AND used = false AND expires_at > now()`
3. Updates `faculty_profiles.password_hash` with the new bcrypt hash
4. Sets `password_reset_tokens.used = true`
5. Commits

## Notes
- Tokens expire after 1 hour from generation.
- A token can only be used once — `used = true` is set on successful reset.
- The user can log in immediately after a successful reset.
