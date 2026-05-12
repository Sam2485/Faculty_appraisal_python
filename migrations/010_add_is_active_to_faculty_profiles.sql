ALTER TABLE public.faculty_profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
