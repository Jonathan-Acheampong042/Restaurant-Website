// Ember & Olive: Database Connection Manager
// Built on Node.js native SQLite engine (DatabaseSync)

import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';

let activeDatabase: DatabaseSync | null = null;
let activeDbPath: string | null = null;

/**
 * Normalizes a database path from parameter or environment variable.
 */
export function resolveDbPath(customPath?: string): string {
  if (customPath) {
    if (customPath === ':memory:') return ':memory:';
    return path.resolve(customPath);
  }

  const envUrl = process.env.DATABASE_URL;
  if (envUrl) {
    if (envUrl === ':memory:') return ':memory:';
    // Strip common URI prefixes like sqlite:// or file://
    const cleaned = envUrl.replace(/^(sqlite|file):\/\/?/, '');
    return path.resolve(cleaned);
  }

  // Default path per contract: data/restaurant.db
  return path.resolve(process.cwd(), 'data', 'restaurant.db');
}

/**
 * Returns a configured DatabaseSync instance.
 * Reuses existing singleton connection if path matches, or opens a new one.
 */
export function getDatabase(customPath?: string): DatabaseSync {
  const targetPath = resolveDbPath(customPath);

  // If already connected to the same file, reuse it
  if (activeDatabase && activeDbPath === targetPath && targetPath !== ':memory:') {
    return activeDatabase;
  }

  // If switching databases or creating memory db
  if (activeDatabase && activeDbPath !== targetPath) {
    closeDatabase();
  }

  // Ensure target folder exists for file-based DBs
  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(targetPath);

  // Enable foreign keys and set WAL mode for performance & concurrency
  db.exec('PRAGMA foreign_keys = ON;');
  if (targetPath !== ':memory:') {
    try {
      db.exec('PRAGMA journal_mode = WAL;');
      db.exec('PRAGMA busy_timeout = 5000;');
    } catch {
      // WAL may not be supported on certain network shares; fallback to default
    }
  }

  if (targetPath !== ':memory:') {
    activeDatabase = db;
    activeDbPath = targetPath;
  }

  return db;
}

/**
 * Closes the active database connection.
 */
export function closeDatabase(dbInstance?: DatabaseSync): void {
  const dbToClose = dbInstance || activeDatabase;
  if (dbToClose) {
    try {
      dbToClose.close();
    } catch {
      // Ignore if already closed
    }
    if (dbToClose === activeDatabase) {
      activeDatabase = null;
      activeDbPath = null;
    }
  }
}
