# Announcement Email Notification — Backend Changes Required

## Feature Summary

When an admin creates an announcement via `POST /api/v1/admin/announcements`, the backend must
automatically send an email to **every registered user** whose profile matches the announcement's
**audience** field. "Registered user" means any active row in `faculty_profiles` regardless of
role — faculty, hod, director, dean, registrar, non_teaching_staff — but **never** admin or
super_admin. Emails must be dispatched in the background so the API response is not delayed.

---

## 1. `src/setup/email_utils.py` — Add `send_announcement_emails`

Add the following async function below `send_reset_email`:

```python
async def send_announcement_emails(recipients: list[str], title: str, body: str, sent_by: str):
    """Broadcast an announcement email to all matching registered users."""
    if not recipients:
        return
    if not os.getenv("SMTP_USER") or not os.getenv("SMTP_HOST"):
        print("Email not configured — skipping announcement emails")
        return

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1e3a5f;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">Faculty Appraisal System</h2>
        <p style="color:#94a3b8;margin:4px 0 0;font-size:12px;">DY Patil University — Official Notice</p>
      </div>
      <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
        <h3 style="color:#1e293b;margin-top:0;font-size:16px;">{title}</h3>
        <div style="color:#334155;line-height:1.7;font-size:14px;white-space:pre-line;">{body}</div>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">
          Sent by <strong>{sent_by}</strong> via the Faculty Appraisal System.
          Do not reply to this email.
        </p>
      </div>
    </div>
    """

    fm = FastMail(conf)
    for email in recipients:
        try:
            await fm.send_message(MessageSchema(
                subject=f"[Notice] {title}",
                recipients=[email],
                body=html,
                subtype=MessageType.html,
            ))
        except Exception as e:
            print(f"Announcement email failed for {email}: {e}")
```

---

## 2. `src/api/v1/announcements.py` — Wire email into `create_announcement`

### 2a. Update imports (top of file)

```python
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select, or_
from src.models.core import Announcement, FacultyProfile, VALID_ANNOUNCEMENT_AUDIENCES
from src.setup.email_utils import send_announcement_emails
```

### 2b. Add constants (after imports, before router)

```python
_SCHOOL_CODES = {
    "SoCSEA", "SoBB", "SoCE", "SoEMR", "SoCM", "SoMCS", "SoD", "SoAA", "CISR",
}
_ADMIN_ROLES = {"admin", "super_admin"}
```

### 2c. Add `send_email` field to `AnnouncementCreate`

```python
class AnnouncementCreate(BaseModel):
    title: str
    body: str
    audience: str = "all"
    is_active: bool = True
    send_email: bool = True          # ← add this field

    @field_validator("audience")
    @classmethod
    def validate_audience(cls, v: str) -> str:
        return _validate_audience_str(v)
```

### 2d. Replace `create_announcement` route

```python
@router.post("/admin/announcements", status_code=201)
async def create_announcement(
    current_user: CurrentUser,
    data: AnnouncementCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    _check_admin(current_user)
    announcement = Announcement(
        title=data.title,
        body=data.body,
        audience=data.audience,
        is_active=data.is_active,
        created_by=current_user.email,
    )
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)

    # Send emails only when announcement is live AND admin enabled email dispatch
    if data.is_active and data.send_email:
        audiences = [a.strip() for a in data.audience.split(",")]

        # Base query: every active registered user except admin/super_admin
        query = select(FacultyProfile.email).where(
            FacultyProfile.is_active == True,
            ~FacultyProfile.appraisal_role.in_(_ADMIN_ROLES),
        )

        # If audience is not "all", narrow by school code and/or role
        if "all" not in audiences:
            conditions = []
            for a in audiences:
                if a in _SCHOOL_CODES:
                    conditions.append(FacultyProfile.school == a)
                else:
                    conditions.append(FacultyProfile.appraisal_role == a)
            if conditions:
                query = query.where(or_(*conditions))

        result = await db.execute(query)
        emails = [row[0] for row in result.all() if row[0]]   # guard against NULL emails

        if emails:
            background_tasks.add_task(
                send_announcement_emails,
                emails,
                data.title,
                data.body,
                current_user.email,
            )

    return {"message": "Announcement created", "id": announcement.id}
```

---

## 3. Audience Logic

All rows come from the `faculty_profiles` table where `is_active = true` and
`appraisal_role NOT IN ('admin', 'super_admin')`.

| Audience value | Who receives the email |
|---|---|
| `all` | Every active registered user across all schools and all non-admin roles |
| `faculty` | All users with `appraisal_role = 'faculty'` |
| `hod` | All users with `appraisal_role = 'hod'` |
| `director` | All users with `appraisal_role = 'director'` |
| `dean` | All users with `appraisal_role = 'dean'` |
| `registrar` | All users with `appraisal_role = 'registrar'` |
| `non_teaching_staff` | All users with `appraisal_role = 'non_teaching_staff'` |
| `SoCSEA` (or any school code) | All active registered users in that school, any role |
| Comma-separated e.g. `SoEMR,hod` | Union of all matching rows (school OR role conditions) |

**School codes:** `SoCSEA`, `SoBB`, `SoCE`, `SoEMR`, `SoCM`, `SoMCS`, `SoD`, `SoAA`, `CISR`

---

## 4. Notes

- Email is dispatched **after** the DB commit — the API always responds immediately.
- If `SMTP_USER` or `SMTP_HOST` are missing, emails are silently skipped (no crash, no 500).
- Draft announcements (`is_active = false`) never trigger emails.
- If the admin unchecks the "Send Email" toggle, `send_email = false` is sent and emails are skipped entirely even if the announcement is live.
- Emails are sent one-by-one per recipient (no BCC) to avoid leaking addresses.
- Individual send failures are logged to stdout and do not block other recipients.
- NULL email rows are skipped with a guard (`if row[0]`) to prevent FastMail errors.
- `is_verified` is intentionally **not** filtered — a registered-but-unverified user should still receive notices.

---

## 5. Frontend contract (already implemented in admin_ui)

The `AnnouncementsPage` sends:

```json
{
  "title": "...",
  "body": "...",
  "audience": "all",
  "is_active": true,
  "send_email": true
}
```

`send_email` comes from the **"Send Email"** toggle on the compose panel. When the announcement
is saved as a draft (`is_active = false`), the frontend forces `send_email = false` regardless
of the toggle state.
