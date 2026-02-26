import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as nodeDrizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";
import { config } from "dotenv";
config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isNeon = process.env.DATABASE_URL.includes('neon.tech');

export const pool = isNeon
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new pg.Pool({ connectionString: process.env.DATABASE_URL });

if (isNeon) {
  neonConfig.webSocketConstructor = ws;
}

export const db = isNeon
  ? neonDrizzle({ client: pool as any, schema })
  : nodeDrizzle(pool as any, { schema });
