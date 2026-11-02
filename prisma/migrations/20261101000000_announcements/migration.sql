-- Announcements, who they are for, and who has read them. Safe to run more than once.
CREATE TABLE IF NOT EXISTS "Announcement" (
    "AnnouncementID" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Body" TEXT NOT NULL,
    "Pinned" BOOLEAN NOT NULL DEFAULT false,
    "AllCohorts" BOOLEAN NOT NULL DEFAULT false,
    "Published" BOOLEAN NOT NULL DEFAULT true,
    "PublishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpiresAt" TIMESTAMP(3),
    "EventAt" TIMESTAMP(3),
    "LessonID" TEXT,
    "AuthorID" TEXT,
    "DateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("AnnouncementID")
);

CREATE TABLE IF NOT EXISTS "AnnouncementCohort" (
    "AnnouncementID" TEXT NOT NULL,
    "CohortID" TEXT NOT NULL,
    CONSTRAINT "AnnouncementCohort_pkey" PRIMARY KEY ("AnnouncementID","CohortID")
);

CREATE TABLE IF NOT EXISTS "AnnouncementRead" (
    "AnnouncementID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "ReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("AnnouncementID","UserID")
);

CREATE INDEX IF NOT EXISTS "Announcement_Published_PublishAt_idx" ON "Announcement"("Published", "PublishAt");

DO $$ BEGIN
  ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_AuthorID_fkey" FOREIGN KEY ("AuthorID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_LessonID_fkey" FOREIGN KEY ("LessonID") REFERENCES "Lesson"("LessonID") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AnnouncementCohort" ADD CONSTRAINT "AnnouncementCohort_AnnouncementID_fkey" FOREIGN KEY ("AnnouncementID") REFERENCES "Announcement"("AnnouncementID") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AnnouncementCohort" ADD CONSTRAINT "AnnouncementCohort_CohortID_fkey" FOREIGN KEY ("CohortID") REFERENCES "Cohort"("CohortID") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_AnnouncementID_fkey" FOREIGN KEY ("AnnouncementID") REFERENCES "Announcement"("AnnouncementID") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
