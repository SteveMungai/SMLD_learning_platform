-- Invite codes for joining a cohort. A NULL code means joining by code is switched off.
-- Safe to run more than once.
ALTER TABLE "Cohort" ADD COLUMN IF NOT EXISTS "JoinCode" TEXT;
ALTER TABLE "Cohort" ADD COLUMN IF NOT EXISTS "JoinCodeExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "Cohort_JoinCode_key" ON "Cohort"("JoinCode");
