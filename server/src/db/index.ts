import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/env/index.js';
import { schema } from './schema/index.js';

// Create a Drizzle ORM instance
export const pg = postgres(env.DATABASE_URL);
export const db = drizzle(pg, { schema });
