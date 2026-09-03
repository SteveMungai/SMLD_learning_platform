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
    where: { Email: "tester2@example.com" },
    update: {},
    create: {
      Email: "tester2@example.com",
      FullName: "Test Student",
      Password: studentPassword,
      role: "STUDENT",
    },
  });

  const instructor = await prisma.user.upsert({
    where: { Email: "instructor@example.com" },
    update: {},
    create: {
      Email: "instructor@example.com",
      FullName: "Test Instructor",
      Password: instructorPassword,
      role: "INSTRUCTOR",
    },
  });

  console.log("Seeded test accounts:");
  console.log(`  Student:    ${student.Email} / P@ssh@ash#!`);
  console.log(`  Instructor: ${instructor.Email} / P@ssh@ash#!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });