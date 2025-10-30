import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

type ProcessWithEnvFile = NodeJS.Process & {
  loadEnvFile?: (path?: string) => void;
};

const loadEnvFile = (process as ProcessWithEnvFile).loadEnvFile;
if (typeof loadEnvFile === "function") {
  loadEnvFile();
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Create a .env from .env.example with your Postgres connection string.",
  );
}

// Log database connection info (without exposing credentials)
const dbUrl = new URL(process.env.DATABASE_URL);
console.log(`[db] Connecting to database at ${dbUrl.hostname}...`);

const isLocalhost = ["localhost", "127.0.0.1"].includes(dbUrl.hostname);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

export const db = drizzle({ client: pool, schema });
