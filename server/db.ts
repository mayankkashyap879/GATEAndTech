import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Log database connection info (without exposing credentials)
const dbUrl = new URL(process.env.DATABASE_URL);
console.log(`📦 Connecting to database at ${dbUrl.hostname}...`);

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add connection timeout and retry settings
  connectionTimeoutMillis: 10000,
});

export const db = drizzle({ client: pool, schema });
