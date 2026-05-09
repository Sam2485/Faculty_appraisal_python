# Forgot Password

## Endpoint
- **Method:** POST
- **URL:** `/api/v1/auth/forgot-password`
- **Auth:** Not required

## Request Body (JSON)
| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string (email) | Yes | The account email to send the reset link to |

```json
{ "email": "user@example.com" }
```

## Response (200)
Always returns 200 regardless of whether the email exists — prevents email enumeration.

```json
{ "message": "If that email is registered, a reset link has been sent." }
```

## Database
If the email matches a registered account:
1. Generates a cryptographically random token (`secrets.token_urlsafe(32)`)
2. Stores `SHA-256(token)` in `password_reset_tokens` with `used = false` and `expires_at = now + 1 hour`
3. Emails the raw token to the user as part of a reset URL: `{FRONTEND_URL}/reset-password?token=<raw_token>`

No write occurs if the email is not registered.

## Notes
- The raw token is never stored — only its SHA-256 hash is in the DB.
- Each call creates a new token row. Old unused tokens for the same email are not invalidated automatically but will expire after 1 hour.
- The frontend reset page must call `POST /auth/reset-password` with the token from the URL.
