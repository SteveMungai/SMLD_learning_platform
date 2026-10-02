// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const studentPassword = await bcrypt.hash("P@ssh@ash#!", 10);
  const instructorPassword = await bcrypt.hash("P@ssh@ash#!", 10);

  // instructor
  const instructor = await prisma.user.upsert({
    where: { Email: "instructor@example.com" },
    update: {},
    create: {
      Email: "instructor@example.com",
      FullName: "Test Instructor",
      Password: instructorPassword,
      Role: "INSTRUCTOR",
    },
  });

  // students
  const [tester, alice, ben, carla] = await Promise.all([
    prisma.user.upsert({
      where: { Email: "tester@example.com" },
      update: {},
      create: { Email: "tester@example.com", FullName: "Test Student", Password: studentPassword, Role: "STUDENT" },
    }),
    prisma.user.upsert({
      where: { Email: "alice@example.com" },
      update: {},
      create: { Email: "alice@example.com", FullName: "Alice Wanjiru", Password: studentPassword, Role: "STUDENT" },
    }),
    prisma.user.upsert({
      where: { Email: "ben@example.com" },
      update: {},
      create: { Email: "ben@example.com", FullName: "Ben Otieno", Password: studentPassword, Role: "STUDENT" },
    }),
    prisma.user.upsert({
      where: { Email: "carla@example.com" },
      update: {},
      create: { Email: "carla@example.com", FullName: "Carla Mwangi", Password: studentPassword, Role: "STUDENT" },
    }),
  ]);

  // cohort
  const cohort = await prisma.cohort.upsert({
    where: { CohortID: "test-cohort-1" },
    update: {},
    create: {
      CohortID: "test-cohort-1",
      CohortName: "SMLD Cohort 1",
      AcademicYear: "2026",
      Description: "Test cohort for development",
    },
  });

  // membership — every student joins this cohort
  await Promise.all(
    [tester, alice, ben, carla].map((student) =>
      prisma.cohortMembership.upsert({
        where: { UserID_CohortID: { UserID: student.UserID, CohortID: cohort.CohortID } },
        update: {},
        create: { UserID: student.UserID, CohortID: cohort.CohortID, Status: "ACTIVE" },
      })
    )
  );

  // course
  const course = await prisma.course.upsert({
    where: { CourseID: "test-course-1" },
    update: {},
    create: {
      CourseID: "test-course-1",
      CohortID: cohort.CohortID,
      Title: "Foundations of Discipleship",
      Description: "Core discipleship training module",
    },
  });

  // lesson (week 1)
  const lesson1 = await prisma.lesson.upsert({
    where: { LessonID: "test-lesson-1" },
    update: {},
    create: {
      LessonID: "test-lesson-1",
      CourseID: course.CourseID,
      Title: "Discipleship",
      SequenceOrder: 1,
    },
  });

  await prisma.video.upsert({
    where: { LessonID: lesson1.LessonID },
    update: {},
    create: {
      VideoID: "test-video-1",
      LessonID: lesson1.LessonID,
      Title: "Week 1 lecture: Discipleship",
      YoutubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
  });

  await prisma.note.upsert({
    where: { NoteID: "test-note-1" },
    update: {},
    create: {
      NoteID: "test-note-1",
      LessonID: lesson1.LessonID,
      Title: "Week 1 notes",
      FileLink: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
  });

  // assignment with two questions
  const assignment = await prisma.assignment.upsert({
    where: { AssignmentID: "test-assignment-1" },
    update: {},
    create: {
      AssignmentID: "test-assignment-1",
      LessonID: lesson1.LessonID,
      CohortID: cohort.CohortID,
      Title: "Reflection: what does it mean to gather?",
      Description: "Answer both questions below, in your own words.",
      DeadlineDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      MaxScore: 20,
    },
  });

  const [q1, q2] = await Promise.all([
    prisma.question.upsert({
      where: { QuestionID: "test-q1" },
      update: {},
      create: {
        QuestionID: "test-q1",
        AssignmentID: assignment.AssignmentID,
        QuestionText: "What stood out to you most in this week's teaching?",
        SequenceOrder: 1,
        QuestionType: "SHORT_ANSWER",
        MaxScore: 10,
      },
    }),
    prisma.question.upsert({
      where: { QuestionID: "test-q2" },
      update: {},
      create: {
        QuestionID: "test-q2",
        AssignmentID: assignment.AssignmentID,
        QuestionText: "How will you apply this in your small group this week?",
        SequenceOrder: 2,
        QuestionType: "ESSAY",
        MaxScore: 10,
      },
    }),
  ]);

  // Alice: no submission.

  // Ben: submitted, not yet graded.
  const benSubmission = await prisma.submission.upsert({
    where: { AssignmentID_StudentID: { AssignmentID: assignment.AssignmentID, StudentID: ben.UserID } },
    update: {},
    create: {
      AssignmentID: assignment.AssignmentID,
      StudentID: ben.UserID,
      SubmittedAt: new Date(),
      Status: "SUBMITTED",
      ReceiptCode: `SMLD-${Date.now().toString(36).toUpperCase()}-BEN`,
      answers: {
        create: [
          { QuestionID: q1.QuestionID, AnswerText: "The call to gather in community, not just individually." },
          { QuestionID: q2.QuestionID, AnswerText: "I want to invite someone new to our next meeting." },
        ],
      },
    },
  });

  // Carla: submitted and fully graded.
  const carlaSubmission = await prisma.submission.upsert({
    where: { AssignmentID_StudentID: { AssignmentID: assignment.AssignmentID, StudentID: carla.UserID } },
    update: {},
    create: {
      AssignmentID: assignment.AssignmentID,
      StudentID: carla.UserID,
      SubmittedAt: new Date(),
      Status: "SUBMITTED",
      ReceiptCode: `SMLD-${Date.now().toString(36).toUpperCase()}-CARLA`,
      answers: {
        create: [
          { QuestionID: q1.QuestionID, AnswerText: "That gathering reflects the character of God himself.", ScoreAwarded: 9, GradedByID: instructor.UserID, GradedAt: new Date() },
          { QuestionID: q2.QuestionID, AnswerText: "I'm starting a weekly check-in text with two group members.", ScoreAwarded: 10, GradedByID: instructor.UserID, GradedAt: new Date() },
        ],
      },
    },
  });

  await prisma.grade.upsert({
    where: { SubmissionID: carlaSubmission.SubmissionID },
    update: {},
    create: {
      SubmissionID: carlaSubmission.SubmissionID,
      FinalizedByID: instructor.UserID,
      TotalScore: 19,
      MaxPossibleScore: 20,
      OverallFeedback: "Really thoughtful connection to your group's story. Well done.",
      Status: "COMPLETE",
      FinalizedAt: new Date(),
    },
  });

  console.log("Seeded test accounts:");
  console.log(` Student (no submission): ${alice.Email} / P@ssh@ash#!`);
  console.log(` Student (submitted):     ${ben.Email} / P@ssh@ash#!`);
  console.log(` Student (graded):        ${carla.Email} / P@ssh@ash#!`);
  console.log(` Student (primary test):  ${tester.Email} / P@ssh@ash#!`);
  console.log(` Instructor:              ${instructor.Email} / P@ssh@ash#!`);
  console.log(`Cohort: ${cohort.CohortName} > Course: ${course.Title} > Lesson: ${lesson1.Title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });