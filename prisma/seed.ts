// prisma/seed.ts
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

  const student = await prisma.user.upsert({
    where: { email: "tester@example.com" },
    update: {},
    create: {
      email: "tester@example.com",
      name: "Test Student",
      password: studentPassword,
      role: "STUDENT",
    },
  });

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

  console.log("Seeded test accounts:");
  console.log(`  Student:    ${student.email} / P@ssh@ash#!`);
  console.log(`  Instructor: ${instructor.email} / P@ssh@ash#!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });