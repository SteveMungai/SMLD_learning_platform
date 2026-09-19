import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const studentPassword = await bcrypt.hash("P@ssh@ash#!", 10);
  const instructorPassword = await bcrypt.hash("P@ssh@ash#!", 10);

  // instructor
  const instructor = await prisma.user.upsert({
    where: { email: "instructor@example.com" },
    update: {},
    create: {
      email: "instructor@example.com",
      name: "Test Instructor",
      password: instructorPassword,
      role: "INSTRUCTOR",
    },
  });

  // cohort
  const cohort = await prisma.cohort.upsert({
    where: { id: "test-cohort-1" },
    update: {},
    create: {
      id: "test-cohort-1",
      name: "SMLD Cohort 1 - 2026",
      startDate: new Date("2026-01-12"),
    },
  });

  // primary test student
  const student = await prisma.user.upsert({
    where: { email: "tester@example.com" },
    update: { cohortId: cohort.id },
    create: {
      email: "tester@example.com",
      name: "Test Student",
      password: studentPassword,
      role: "STUDENT",
      cohortId: cohort.id,
    },
  });

  // week 1
  const week1 = await prisma.week.upsert({
    where: { cohortId_weekNumber: { cohortId: cohort.id, weekNumber: 1 } },
    update: {},
    create: {
      cohortId: cohort.id,
      weekNumber: 1,
      topic: "Discipleship",
      sessionDate: new Date("2026-01-12"),
      description: "Introduction to biblical discipleship principles.",
    },
  });

  // materials for week 1
  await prisma.material.createMany({
    data: [
      {
        weekId: week1.id,
        type: "VIDEO",
        title: "Week 1 lecture: Discipleship",
        fileUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        uploadedById: instructor.id,
      },
      {
        weekId: week1.id,
        type: "SLIDES",
        title: "Week 1 slides",
        fileUrl: "https://example.com/files/week1-slides.pptx",
        uploadedById: instructor.id,
      },
      {
        weekId: week1.id,
        type: "NOTES",
        title: "Week 1 notes",
        fileUrl: "https://example.com/files/week1-notes.pdf",
        uploadedById: instructor.id,
      },
    ],
    skipDuplicates: true,
  });

  // additional students, for a mixed roster
  const [alice, ben, carla] = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@example.com" },
      update: {},
      create: { name: "Alice Wanjiru", email: "alice@example.com", role: "STUDENT", cohortId: cohort.id },
    }),
    prisma.user.upsert({
      where: { email: "ben@example.com" },
      update: {},
      create: { name: "Ben Otieno", email: "ben@example.com", role: "STUDENT", cohortId: cohort.id },
    }),
    prisma.user.upsert({
      where: { email: "carla@example.com" },
      update: {},
      create: { name: "Carla Mwangi", email: "carla@example.com", role: "STUDENT", cohortId: cohort.id },
    }),
  ]);

  // assignment for week 1
  const assignment = await prisma.assignment.upsert({
    where: { id: "test-assignment-1" },
    update: {},
    create: {
      id: "test-assignment-1",
      weekId: week1.id,
      title: "Reflection: what does it mean to gather?",
      instructions: "Write a one-page reflection connecting this week's teaching to your own small group.",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      createdById: instructor.id,
    },
  });

  // Alice: no submission — nothing to create.

  // Ben: submitted, not yet graded.
  await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: ben.id } },
    update: {},
    create: {
      assignmentId: assignment.id,
      studentId: ben.id,
      fileUrl: "placeholder://ben-reflection.pdf",
      status: "SUBMITTED",
    },
  });

  // Carla: submitted and graded.
  await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: carla.id } },
    update: {},
    create: {
      assignmentId: assignment.id,
      studentId: carla.id,
      fileUrl: "placeholder://carla-reflection.pdf",
      status: "GRADED",
      grade: 92,
      feedback: "Really thoughtful connection to your group's story. Well done.",
      gradedAt: new Date(),
      gradedById: instructor.id,
    },
  });

  console.log("Seeded test accounts:");
  console.log(` Student:    ${student.email} / P@ssh@ash#!`);
  console.log(` Instructor: ${instructor.email} / P@ssh@ash#!`);
  console.log(`Seeded cohort: ${cohort.name} (id: ${cohort.id})`);
  console.log(` Week 1: ${week1.topic} with 3 materials`);
  console.log(" Roster: Alice (no submission), Ben (submitted), Carla (graded)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });