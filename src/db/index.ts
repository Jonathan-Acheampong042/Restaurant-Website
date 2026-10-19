// Ember & Olive: Database Module Main Entrypoint
// Unified export of connection, migrations, seeding, repositories, and types

import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from './connection.ts';
import { runMigrations } from './migrate.ts';

export type * from './types.ts';
export * from './connection.ts';
export * from './migrate.ts';
export * from './seed.ts';
export * from './menu.ts';
export * from './reservations.ts';
export * from './restaurant.ts';

/**
 * Convenience initializer: connects to the database and applies all migrations.
 * If run against a clean database, tables and seed data will be created.
 */
export function initDatabase(customPath?: string): DatabaseSync {
  const db = getDatabase(customPath);
  runMigrations(db);
  return db;
}
