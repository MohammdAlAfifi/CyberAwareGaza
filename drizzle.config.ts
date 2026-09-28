import { defineConfig } from "drizzle-kit";

if (!process.env.DIRECT_DATABASE_URL) {
  throw new Error("DIRECT_DATABASE_URL is required for migrations");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DIRECT_DATABASE_URL },
  strict: true,
  verbose: true
});
