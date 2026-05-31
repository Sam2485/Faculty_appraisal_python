import os
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_USER"),
    MAIL_PASSWORD=os.getenv("SMTP_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("SMTP_PORT", 587)),
    MAIL_SERVER=os.getenv("SMTP_HOST"),
    MAIL_FROM_NAME="Faculty Appraisal System",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)
async def send_reset_email(email: str, reset_url: str):
    """
    Sends a password-reset email containing a one-time reset link.
    """
    html = f"""
    <h3>Faculty Appraisal System — Password Reset</h3>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <a href="{reset_url}">Reset Password</a>
    <br><br>
    <p>This link expires in 1 hour. If you did not request a reset, please ignore this email.</p>
    """

    message = MessageSchema(
        subject="Password Reset — Faculty Appraisal System",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return True
    except Exception as e:
        print(f"Failed to send reset email: {str(e)}")
        return False


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


async def send_verification_email(email: EmailStr, token: str):
    """
    Sends a verification email with a link to the verify endpoint.
    """
    app_url = os.getenv("APP_URL", "http://localhost:8000").rstrip("/")

    # Heuristic to fix accidentally duplicated Cloud Run suffixes
    if app_url.endswith(".run.app.a.run.app"):
        app_url = app_url.replace(".run.app.a.run.app", ".a.run.app")
    elif app_url.endswith(".run.app") and not app_url.endswith(".a.run.app"):
        # If it ends in .run.app but missing the .a, it might be misconfigured
        # but we'll leave it unless we are sure. The user's screenshot has run.app.a.run.app
        pass

    verify_url = f"{app_url}/api/v1/auth/verify-email?token={token}"

    html = f"""
    <h3>Welcome to the Faculty Appraisal System</h3>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="{verify_url}">Verify Email Address</a>
    <br><br>
    <p>If you did not create an account, please ignore this email.</p>
    """
    
    message = MessageSchema(
        subject="Email Verification - Faculty Appraisal System",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False
