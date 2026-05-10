/*
  Prisma Client singleton.

  Why a singleton?
    In development, Next.js hot-reloads modules whenever a file
    changes. Each reload would otherwise create a new PrismaClient
    instance, and each instance opens its own database connections.
    After a few minutes of editing, we exhaust Supabase's connection
    pool and queries start failing with "too many clients."

    The trick below stashes the client on the global object during
    development. Re-imports return the cached instance instead of
    creating new ones. In production, modules are loaded once, so
    we skip the cache.

  Why a driver adapter?
    Prisma 7 dropped the built-in database engine in favor of "driver
    adapters", thin wrappers around standard Node database drivers.
    For Postgres we use @prisma/adapter-pg, which wraps the well known
    "pg" library. The PrismaClient receives the adapter via the
    "adapter" option and routes all queries through it.

  Why DATABASE_URL and not DIRECT_URL?
    DATABASE_URL is the pooled Supabase connection (port 6543) tuned
    for short, frequent application queries. DIRECT_URL (port 5432)
    is for migrations only, where the schema needs a non-pooled
    connection to run DDL.
*/

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
