import { db, isDbConfigured } from '../db/index';
import { MemoryStorage } from './memory';
import { DrizzleStorage } from './drizzle';
import type { Storage } from './types';

export const storage: Storage = isDbConfigured && db ? new DrizzleStorage(db) : new MemoryStorage();
export const storageBackend = isDbConfigured ? 'postgres' : 'memory';
export * from './types';
