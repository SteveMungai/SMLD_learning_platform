// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 requires a driver adapter — PrismaClient no longer connects
// directly using just a `url` string in the schema.
//
// The client is cached on globalThis in every environment. Before, it was only read from
// there and never stored, so each hot reload in `next dev` (and each module instance) opened
// a fresh connection pool until the database ran out of connections.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
