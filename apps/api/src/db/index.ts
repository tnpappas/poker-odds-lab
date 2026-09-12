import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from '../config';
import * as schema from './schema';

export const isDbConfigured = !!config.DATABASE_URL;

export const db: NeonHttpDatabase<typeof schema> | null = isDbConfigured
  ? drizzle(neon(config.DATABASE_URL!), { schema })
  : null;

export { schema };
