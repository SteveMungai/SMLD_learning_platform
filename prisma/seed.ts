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

  //we create the instructor first
  const instructor = await prisma.user.upsert({
    where: { email: "instructor@example.com" },
    update:{},
    create: {
      email: "instructor@example.com",
      name: "Test Instructor",
      password: "instructorPassword",
      role:"INSTRUCTOR",
    },
  });

  //Cohort setup
  const cohort = await prisma.cohort.upsert({
    where: {id: "test-cohort-1" },
    update: {},
    create: {
      id:"test-cohort-1",
      name: "SMLD Cohort 1 - 2026",
      startDate: new Date("2026-01-12"),
    },
  });

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

// Week 1
const week1 = await prisma.week.upsert({
  where: { cohortId_weekNumber: { cohortId: cohort.id, weekNumber: 1} },
  update: {},
  create: {
    cohortId: cohort.id,
    weekNumber: 1,
    topic:"Discipleship",
    sessionDate: new Date("2026-01-12"),
    description: "Instroduction to biblical discipleship principles.",
  },
});

await prisma.material.createMany({
  data: [
    {
      weekId: week1.id,
      type : "VIDEO",
      title:"Week 1 lecture: Discipleship",
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
      title: "week 1 Notes",
      fileUrl: "https://example.com/files/week1-notes.pdf",
      uploadedById: instructor.id,
    },
  ],
  skipDuplicates: true,
});

console.log("seesed test accounts:");
console.log(` student:  ${student.email} /P@ssh@ash#!`);
console.log(` Instructor: $[instructor.email} /P@ssh@ash#!`);
console.log(`Seeded cohort:`);
console.log(` ${cohort.name} (id: ${cohort.id})`);
console.log(` week 1: ${week1.topic} with 3 materials`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });