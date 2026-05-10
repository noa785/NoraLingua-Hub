/*
  Prisma configuration
  Uses DIRECT_URL (port 5432) for migrations because the
  Supabase transaction pooler (6543) does not support DDL.
  The application client uses DATABASE_URL (pooled) at runtime.
*/

import { config } from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";


// Load env vars from .env.local (Next.js convention)
config({ path: path.resolve(process.cwd(), ".env.local") });


export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),

  // Migrations require the direct connection (port 5432)
  datasource: {
    url: process.env.DIRECT_URL!,
  },

  // Seed command, run by "npx prisma db seed"
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
