-- One-time tidy: number the lessons in every course 1, 2, 3 ... in their current order,
-- closing any gaps left by lessons that were deleted. Safe to run more than once.
UPDATE "Lesson" AS l
SET "SequenceOrder" = r.rn
FROM (
  SELECT "LessonID",
         ROW_NUMBER() OVER (PARTITION BY "CourseID" ORDER BY "SequenceOrder", "DateCreated") AS rn
  FROM "Lesson"
) AS r
WHERE l."LessonID" = r."LessonID" AND l."SequenceOrder" <> r.rn;
