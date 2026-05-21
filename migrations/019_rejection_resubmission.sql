-- Migration 019: Rejection / resubmission support for teaching appraisals
-- Adds a submission attempt counter to declarations so each resubmission
-- after rejection is distinguishable in the audit trail.
-- No status CHECK constraint modification needed — declarations.status is a
-- free-text VARCHAR and already accepts any string value.

ALTER TABLE public.declarations
  ADD COLUMN IF NOT EXISTS submission_attempt INTEGER NOT NULL DEFAULT 1;
