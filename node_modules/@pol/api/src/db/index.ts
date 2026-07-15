import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

export const isDbConfigured = !!process.env.DATABASE_URL;

export const db: NeonHttpDatabase<typeof schema> | null = isDbConfigured
  ? drizzle(neon(process.env.DATABASE_URL!), { schema })
  : null;

export { schema };
