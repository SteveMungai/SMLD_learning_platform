-- Records which lecturer added each lesson, so their name can be shown on the lesson.
-- Existing lessons stay NULL (no name shown). Safe to run more than once.
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "CreatedByID" TEXT;

DO $$ BEGIN
  ALTER TABLE "Lesson"
    ADD CONSTRAINT "Lesson_CreatedByID_fkey"
    FOREIGN KEY ("CreatedByID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
