// Ember & Olive: Database Migration Engine
// Handles versioned, atomic, idempotent migrations for SQLite

import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getDatabase } from './connection.ts';

/**
 * Finds the migrations directory by scanning common relative paths.
 */
export function findMigrationsDir(customDir?: string): string {
  if (customDir && fs.existsSync(customDir)) {
    return path.resolve(customDir);
  }

  const baseDir = import.meta.dirname || process.cwd();
  const candidates = [
    path.resolve(process.cwd(), 'migrations'),
    path.resolve(process.cwd(), '.claude/worktrees/database/migrations'),
    path.resolve(baseDir, '../../migrations'),
    path.resolve(baseDir, '../migrations'),
    path.resolve(baseDir, 'migrations'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  // Fallback to current working directory 'migrations'
  return path.resolve(process.cwd(), 'migrations');
}

/**
 * Ensures the schema_migrations tracking table exists.
 */
export function ensureMigrationTable(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `);
}

/**
 * Returns an array of already applied migration filenames in chronological order.
 */
export function getAppliedMigrations(db?: DatabaseSync): string[] {
  const conn = db || getDatabase();
  ensureMigrationTable(conn);
  const rows = conn.prepare('SELECT name FROM schema_migrations ORDER BY id ASC').all() as { name: string }[];
  return rows.map((r) => r.name);
}

/**
 * Executes all pending migrations in alphabetical order.
 * Each migration runs inside an immediate transaction for atomicity.
 */
export function runMigrations(
  db?: DatabaseSync,
  customMigrationsDir?: string
): { applied: string[]; total: number } {
  const conn = db || getDatabase();
  ensureMigrationTable(conn);

  const migrationsDir = findMigrationsDir(customMigrationsDir);
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at: ${migrationsDir}`);
  }

  const allFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const appliedList = new Set(getAppliedMigrations(conn));
  const freshlyApplied: string[] = [];

  for (const file of allFiles) {
    if (!appliedList.has(file)) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute migration inside a transaction
      conn.exec('BEGIN IMMEDIATE TRANSACTION;');
      try {
        conn.exec(sql);
        const recordStmt = conn.prepare('INSERT INTO schema_migrations (name) VALUES (?)');
        recordStmt.run(file);
        conn.exec('COMMIT;');
        freshlyApplied.push(file);
      } catch (error) {
        conn.exec('ROLLBACK;');
        throw new Error(`Failed applying migration "${file}": ${(error as Error).message}`);
      }
    }
  }

  return {
    applied: freshlyApplied,
    total: allFiles.length,
  };
}

/**
 * Drops all application tables cleanly.
 */
export function resetDatabase(db?: DatabaseSync): void {
  const conn = db || getDatabase();
  conn.exec('PRAGMA foreign_keys = OFF;');
  conn.exec(`
    DROP TABLE IF EXISTS reservations;
    DROP TABLE IF EXISTS menu_items;
    DROP TABLE IF EXISTS menu_categories;
    DROP TABLE IF EXISTS restaurant_info;
    DROP TABLE IF EXISTS schema_migrations;
  `);
  conn.exec('PRAGMA foreign_keys = ON;');
}
