// created to bypass prisma studio
// Run with: npx tsx prisma/verify-seed.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
 
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL,
});
 
const prisma = new PrismaClient({ adapter });
 
async function main() {
  const cohorts = await prisma.cohort.findMany({
    include: {
      weeks: {
        include: { materials: true },
      },
      students: true,
    },
  });
 
  console.log(JSON.stringify(cohorts, null, 2));
  console.log(`\nFound ${cohorts.length} cohort(s).`);
}
 
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
;