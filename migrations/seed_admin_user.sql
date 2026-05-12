-- ============================================================
-- SEED: Create the first admin user
-- Run this ONCE after setting up the database with schema.sql.
-- ============================================================
--
-- STEP 1 — Generate a bcrypt hash for your chosen password:
--
--   python -c "from passlib.context import CryptContext; print(CryptContext(['bcrypt']).hash('your_password'))"
--
-- STEP 2 — Replace the hash and email below, then run this file.
--
-- STEP 3 — Log in at /admin (SQLAdmin UI) or via the API using
--          the email and password you chose.
--
-- NOTE: The on conflict clause makes this safe to run more than once.
--       It will not overwrite an existing admin account.
-- ============================================================

insert into public.faculty_profiles (email, full_name, password_hash, appraisal_role, is_verified)
values (
  'admin@dypatil.edu',                                                    -- change if needed
  'System Administrator',
  '$2b$12$VYGK9cEZx0hlqsKR/XiOl.yoKfN09nJyr/q3z7C7TozIVsmAdM51.',       -- hash of Ruhan@2003
  'admin',
  true
)
on conflict (email) do nothing;
