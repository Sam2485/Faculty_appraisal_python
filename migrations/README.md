# migrations/

Manual SQL migration files for the Faculty Appraisal System.
There is no Alembic or automatic migration runner — all files are applied by hand.

---

## Two files, two purposes

| File | When to use |
|---|---|
| `Docs/schema.sql` | **Fresh install only.** Drops everything and recreates all tables, indexes, and triggers from scratch. Use this on a new server with an empty database. |
| `migrations/NNN_*.sql` | **Live DB upgrades.** Incremental changes applied to an existing database that already has data. Safe to run because they never drop tables or truncate data. |

They must stay in sync. Every change you apply via a migration file must also be reflected in `Docs/schema.sql`.

---

## Applied migrations — DO NOT modify or re-run

These have already been applied to the live database. Editing them will not change anything in the DB and will only create confusion.

| # | File | What it does |
|---|---|---|
| 001 | `001_unique_constraints.sql` | Composite UNIQUE constraints on declarations, snapshots, reviews, non-teaching appraisals |
| 002 | `002_fix_appraisal_role_constraint.sql` | Expanded `appraisal_role` CHECK to include `admin`, `staff`, `section_head` |
| 003 | `003_create_feedback_table.sql` | Created `feedback` table with category CHECK constraint + indexes |
| 004 | `004_add_indexes.sql` | Performance indexes on all Part A/B tables, faculty_profiles, declarations |
| 005 | `005_add_is_verified_column.sql` | Added `is_verified boolean` column to `faculty_profiles` |

`seed_admin_user.sql` is a one-time setup file, not a schema migration. Run it once on a fresh install to create the first admin account.

---

## How to add a new migration

1. **Create the file** — name it `006_describe_your_change.sql` (next number in sequence).
   - Use `IF NOT EXISTS` / `IF EXISTS` guards so the file is safe to re-run by accident.
   - Keep it focused — one logical change per file.

2. **Apply it to the live DB** — via Cloud SQL Studio (GCP) or `psql` (on-premise):
   ```bash
   psql -U postgres -f migrations/006_describe_your_change.sql
   ```

3. **Update `Docs/schema.sql`** — apply the same change to the relevant table/index definition so that new installs stay in sync.

4. **Update the table above** — add a row for your new file.

---

## Setting up a brand new database

```bash
# 1. Full schema (tables, indexes, triggers, app_user role)
psql -U postgres -f Docs/schema.sql

# 2. First admin account
psql -U postgres -f migrations/seed_admin_user.sql
```

Do NOT run migrations 001–005 after a fresh install — `Docs/schema.sql` already includes all of them.
