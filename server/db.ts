import { Pool } from 'pg'; // <-- changed from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/node-postgres'; // <-- changed ORM adapter
import * as schema from '@shared/schema';
import dotenv from 'dotenv';

dotenv.config();

// Validate env
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Create pool and drizzle instance
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle(pool, { schema });
