-- Brings the database in line with what the code already uses:
--   User.TokenVersion            (session invalidation in lib/auth.ts)
--   Assignment.Status/AcceptLate (draft vs published, late submissions) + optional DeadlineDate
--   Attachment.ContentType + AttachmentData (files stored in the database)
-- Written to be safe to run even if some of these were already added by hand or by `db push`.

-- Enum
DO $$ BEGIN
  CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "TokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Assignment: rows that already exist were visible to students, so they become PUBLISHED
-- and keep accepting late work; new rows default to DRAFT.
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "Status" "AssignmentStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Assignment" ALTER COLUMN "Status" SET DEFAULT 'DRAFT';
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "AcceptLate" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Assignment" ALTER COLUMN "DeadlineDate" DROP NOT NULL;

-- Attachment
ALTER TABLE "Attachment" ADD COLUMN IF NOT EXISTS "ContentType" TEXT;

CREATE TABLE IF NOT EXISTS "AttachmentData" (
    "AttachmentID" TEXT NOT NULL,
    "Data" BYTEA NOT NULL,

    CONSTRAINT "AttachmentData_pkey" PRIMARY KEY ("AttachmentID")
);

DO $$ BEGIN
  ALTER TABLE "AttachmentData"
    ADD CONSTRAINT "AttachmentData_AttachmentID_fkey"
    FOREIGN KEY ("AttachmentID") REFERENCES "Attachment"("AttachmentID") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
