import { defineConfig } from "drizzle-kit";

type ProcessWithEnvFile = NodeJS.Process & {
  loadEnvFile?: (path?: string) => void;
};

const loadEnvFile = (process as ProcessWithEnvFile).loadEnvFile;
if (typeof loadEnvFile === "function") {
  loadEnvFile();
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Create a .env from .env.example with your Postgres connection string.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
