import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 config. Env vars are NOT auto-loaded here, hence `dotenv/config`.
// Migrations should run against the DIRECT (non-pooled) Neon connection.
// Prefer DIRECT_URL; fall back to DATABASE_URL so `prisma validate`/`generate`
// work before the direct URL is provisioned. Set DIRECT_URL in .env for
// `migrate` (see .env.example).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
