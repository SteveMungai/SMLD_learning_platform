// prisma.config.ts
// Prisma 7 moved connection URLs out of schema.prisma and into this file.
// This file must import dotenv/config — Prisma 7 no longer auto-loads .env for the CLI.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  // For the Prisma CLI (migrate, db push, studio), use the DIRECT connection,
  // not the pooled one — pgbouncer/pooled URLs can't run migrations reliably.
  // Your app's runtime PrismaClient (lib/prisma.ts) still uses the pooled
  // DATABASE_URL separately; this only affects CLI commands.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
