-- Dates for courses and notes, and uploaded PDFs for notes. Safe to run more than once.
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "DateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "DateUploaded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing courses did not record a date. Use the date of their earliest lesson when there is one,
-- so the number shown is closer to the truth than "the day this migration ran".
UPDATE "Course" AS c
SET "DateCreated" = l.first_lesson
FROM (SELECT "CourseID", MIN("DateCreated") AS first_lesson FROM "Lesson" GROUP BY "CourseID") AS l
WHERE c."CourseID" = l."CourseID" AND l.first_lesson < c."DateCreated";

CREATE TABLE IF NOT EXISTS "NoteFile" (
    "NoteID" TEXT NOT NULL,
    "FileName" TEXT NOT NULL,
    "SizeKB" INTEGER NOT NULL,
    "Data" BYTEA NOT NULL,
    CONSTRAINT "NoteFile_pkey" PRIMARY KEY ("NoteID")
);

DO $$ BEGIN
  ALTER TABLE "NoteFile" ADD CONSTRAINT "NoteFile_NoteID_fkey" FOREIGN KEY ("NoteID") REFERENCES "Note"("NoteID") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
