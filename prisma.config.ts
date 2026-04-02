// Prisma 7 configuration.
// Two database URLs are needed for Supabase:
//   DIRECT_URL  → direct connection (no pooler) — used here for migrations
//   DATABASE_URL → connection pooler URL — used at runtime in src/lib/prisma.ts
//
// Why two URLs?
//   Supabase's PgBouncer (transaction mode) doesn't support the SET/DDL statements
//   that Prisma Migrate uses. The direct URL bypasses the pooler, making migrations safe.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for migrations so they bypass the Supabase connection pooler.
    // Falls back to DATABASE_URL if DIRECT_URL is not set (e.g. local dev without pooling).
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
