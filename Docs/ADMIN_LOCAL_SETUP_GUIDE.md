# Admin Developer — Local Backend Setup Guide

This guide walks you through setting up the Faculty Appraisal backend on your **own laptop** so you can develop and test without ever touching the shared cloud database.

> **Why this matters:** The production Cloud SQL database is shared with the client. Any accidental `DELETE`, `DROP`, or data-changing SQL you run there affects real data. Your local setup is completely isolated — you can break it, reset it, and experiment freely.

---

## What you will have at the end

- A PostgreSQL database running on your laptop
- The FastAPI backend running at `http://localhost:8000`
- Interactive API docs at `http://localhost:8000/docs`
- A seeded admin user you can log in with immediately

---

## Prerequisites

Install all of these before starting.

### 1. Python 3.12 or higher

Check if you already have it:
```
python --version
```

If you see `Python 3.12.x` or higher, you're good. If not, download from:  
https://www.python.org/downloads/

> During installation on Windows, **tick "Add Python to PATH"** before clicking Install.

---

### 2. uv (Python package manager)

`uv` is what this project uses to install packages. It is much faster than `pip`.

```
pip install uv
```

Verify:
```
uv --version
```

---

### 3. PostgreSQL 15 or higher

Download and install from:  
https://www.postgresql.org/download/

During installation:
- Set a **superuser password** — write it down, you will need it
- Leave the port at the default **5432**
- Leave the locale as default
- When it asks about Stack Builder at the end — skip it (click Cancel)

After installation, make sure PostgreSQL is running. On Windows you can check in **Services** (search "Services" in the Start menu) — look for `postgresql-x64-15` or similar and make sure its status is **Running**.

---

## Step 1 — Get the code

If you do not already have the project cloned:

```
git clone <repository-url>
cd Faculty_appraisal
```

If you already have it, pull the latest changes:

```
git pull origin main
```

---

## Step 2 — Create the local database

Open **pgAdmin** (installed with PostgreSQL) or use the **psql** command line.

### Option A — pgAdmin (easier)

1. Open pgAdmin from the Start menu
2. Connect to the local server (password = the one you set during installation)
3. Right-click **Databases** → **Create** → **Database**
4. Name it `faculty_appraisal_local`
5. Click **Save**

### Option B — psql command line

Open Command Prompt or PowerShell and run:

```
psql -U postgres -c "CREATE DATABASE faculty_appraisal_local;"
```

Enter your PostgreSQL password when prompted.

---

## Step 3 — Apply the schema

This creates all the tables, indexes, triggers, and roles the backend needs.

### In pgAdmin

1. Click on your `faculty_appraisal_local` database in the left panel
2. Click **Tools** → **Query Tool**
3. Click the folder icon to open a file → navigate to `Docs/schema.sql` in the project folder
4. Click the **Run** button (▶)
5. Wait for it to finish — you should see "Query returned successfully" at the bottom

### In psql command line

```
psql -U postgres -d faculty_appraisal_local -f Docs/schema.sql
```

---

## Step 4 — Apply all migrations

Migrations add features that were added after the initial schema. Run them **in order**:

### In pgAdmin Query Tool

Open and run each file below, one at a time, in this exact order:

```
migrations/001_unique_constraints.sql
migrations/002_fix_appraisal_role_constraint.sql
migrations/003_create_feedback_table.sql
migrations/004_add_indexes.sql
migrations/005_add_is_verified_column.sql
migrations/006_appraisal_config_and_announcements.sql
migrations/007_section_scores_and_password_reset.sql
migrations/008_add_audience_to_announcements.sql
migrations/009_add_module_config_table.sql
```

### In psql command line (runs all at once)

```
psql -U postgres -d faculty_appraisal_local -f migrations/001_unique_constraints.sql
psql -U postgres -d faculty_appraisal_local -f migrations/002_fix_appraisal_role_constraint.sql
psql -U postgres -d faculty_appraisal_local -f migrations/003_create_feedback_table.sql
psql -U postgres -d faculty_appraisal_local -f migrations/004_add_indexes.sql
psql -U postgres -d faculty_appraisal_local -f migrations/005_add_is_verified_column.sql
psql -U postgres -d faculty_appraisal_local -f migrations/006_appraisal_config_and_announcements.sql
psql -U postgres -d faculty_appraisal_local -f migrations/007_section_scores_and_password_reset.sql
psql -U postgres -d faculty_appraisal_local -f migrations/008_add_audience_to_announcements.sql
psql -U postgres -d faculty_appraisal_local -f migrations/009_add_module_config_table.sql
```

---

## Step 5 — Seed an admin user

This creates a default admin account you can log into immediately.

Run the seed file the same way as the migrations:

**pgAdmin:** Open `migrations/seed_admin_user.sql` in the Query Tool and run it.

**psql:**
```
psql -U postgres -d faculty_appraisal_local -f migrations/seed_admin_user.sql
```

> Check the contents of `migrations/seed_admin_user.sql` to find the default admin email and password that get inserted.

---

## Step 6 — Create the `.env` file

The backend reads all its configuration from a `.env` file in the project root. This file is **never committed to git** — you create it yourself on your machine.

Copy the example file:

**Windows (Command Prompt):**
```
copy .env.example .env
```

**Windows (PowerShell):**
```
Copy-Item .env.example .env
```

Now open `.env` in a text editor (Notepad, VS Code, anything) and set the values below.

---

### DATABASE_URL

Replace the Supabase example URL with your local PostgreSQL connection:

```
DATABASE_URL="postgresql+asyncpg://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/faculty_appraisal_local"
```

Replace `YOUR_POSTGRES_PASSWORD` with the password you set when installing PostgreSQL.

---

### JWT_SECRET_KEY

Generate a secure random key — run this in your terminal:

```
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste it in:

```
JWT_SECRET_KEY="paste-the-output-here"
```

> Use a different key from production. Your local key only affects your local login tokens.

---

### AUTH and URLs

```
USE_LOCAL_AUTH="true"
ALLOW_MOCK_USER="false"

APP_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:5173"
```

---

### Email (SMTP)

For local testing, emails won't actually need to send. But the server will crash on startup if these are blank. Set them to your Gmail with an App Password, or use the placeholder values below to disable email sending gracefully:

```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-gmail@gmail.com"
SMTP_PASSWORD="your-16-char-app-password"
MAIL_FROM="your-gmail@gmail.com"
```

**To get a Gmail App Password:**
1. Go to myaccount.google.com → Security
2. Enable 2-Step Verification (required)
3. Search for "App Passwords" in the search bar
4. Create one named "Faculty Appraisal"
5. Copy the 16-character password it gives you — paste it as `SMTP_PASSWORD`

---

### Storage

For local development, store uploaded files on disk instead of GCS:

```
USE_LOCAL_STORAGE="true"
LOCAL_STORAGE_DIR="./uploads"
```

Leave the GCS bucket lines as-is (blank or placeholder) — they are only used when `USE_LOCAL_STORAGE="false"`.

---

### Final `.env` (what it should look like)

```env
DATABASE_URL="postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/faculty_appraisal_local"

USE_LOCAL_AUTH="true"
JWT_SECRET_KEY="your-generated-random-key-here"
ALLOW_MOCK_USER="false"

APP_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:5173"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-gmail@gmail.com"
SMTP_PASSWORD="your-app-password"
MAIL_FROM="your-gmail@gmail.com"

USE_LOCAL_STORAGE="true"
LOCAL_STORAGE_DIR="./uploads"

GCP_STORAGE_BUCKET=""
GCP_PROJECT_ID=""

SUPABASE_URL=""
SUPABASE_ANON_KEY=""
```

---

## Step 7 — Install Python dependencies

From the project root folder, run:

```
uv pip install -r pyproject.toml
```

This downloads and installs all the backend libraries. It should complete in under a minute.

> If `uv` gives an error about `pyproject.toml`, try: `uv pip install -e .`

---

## Step 8 — Run the backend server

```
uvicorn main:app --reload --port 8000
```

You should see output like:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

The `--reload` flag means the server automatically restarts whenever you save a `.py` file — no need to stop and restart manually while developing.

---

## Step 9 — Verify everything is working

Open your browser and go to:

```
http://localhost:8000/docs
```

You should see the **Swagger UI** — an interactive page listing every API endpoint. This confirms the server is running and connected to the database.

**Quick test — log in with the admin account:**

1. In Swagger UI, find `POST /api/v1/auth/login`
2. Click **Try it out**
3. Enter the admin email and password from `migrations/seed_admin_user.sql`
4. Click **Execute**
5. You should get a `200` response with a JWT token

If you get a `200`, your local setup is fully working.

---

## Day-to-day workflow

Every time you want to work on the backend:

1. Make sure PostgreSQL is running (check Services on Windows)
2. Open a terminal in the project folder
3. Run: `uvicorn main:app --reload --port 8000`
4. The server is live at `http://localhost:8000`
5. To stop it: press `Ctrl+C`

---

## Resetting the database

If you break something or want a fresh start, you can wipe and recreate the entire database:

```
psql -U postgres -c "DROP DATABASE faculty_appraisal_local;"
psql -U postgres -c "CREATE DATABASE faculty_appraisal_local;"
psql -U postgres -d faculty_appraisal_local -f Docs/schema.sql
```

Then re-run all the migration files and the seed file (Steps 4 and 5). This does not affect the cloud database in any way.

---

## Troubleshooting

### `connection refused` on startup
PostgreSQL is not running. Go to Windows Services and start it, or run:
```
pg_ctl start
```

### `password authentication failed for user "postgres"`
Your `DATABASE_URL` has the wrong password. Double-check it matches what you set during PostgreSQL installation.

### `module not found` errors
Dependencies are not installed. Run `uv pip install -r pyproject.toml` again.

### `relation "faculty_profiles" does not exist`
The schema was not applied. Go back to Step 3 and run `Docs/schema.sql` against your database.

### `column updated_at does not exist` on a specific table
A migration is missing. Re-run all migration files from Step 4 in order.

### Port 8000 already in use
Something else is using port 8000. Either stop that process or run on a different port:
```
uvicorn main:app --reload --port 8001
```
Then access the server at `http://localhost:8001`.

### Email sending fails on startup
Double-check your `SMTP_USER`, `SMTP_PASSWORD`, and that you are using a Gmail **App Password** (not your regular Gmail password). If you are not testing email features, this error is non-fatal — the server will still run.

---

## Important reminders

- **Never point your `.env` at the cloud database.** The `DATABASE_URL` must always be `localhost:5432` while developing locally.
- **Never run schema.sql or DROP TABLE commands against the production database** — that is a destructive operation that cannot be undone without restoring a backup.
- Your `.env` file is in `.gitignore` and will never be committed. Do not copy production secrets into it.
- The `./uploads` folder created by local storage is also gitignored — files you upload locally stay on your machine only.
