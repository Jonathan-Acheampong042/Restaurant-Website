#!/usr/bin/env node
// Ember & Olive: Database CLI Tool
// Provides command-line actions for migrations, seeding, status, and reset

import { getDatabase, closeDatabase, resolveDbPath } from './connection.ts';
import { runMigrations, getAppliedMigrations, resetDatabase } from './migrate.ts';
import { seedDatabase } from './seed.ts';

const command = process.argv[2] || 'status';

function showHelp() {
  console.log(`
Ember & Olive Database CLI
Usage: node src/db/cli.ts [command]

Commands:
  status     Show database path and applied migrations
  migrate    Execute all pending migrations
  seed       Seed initial categories, menu items, and restaurant info
  reset      Drop all tables and reset database state
  init       Run reset, migrate, and seed from clean state
  help       Show this help message
`);
}

async function main() {
  const dbPath = resolveDbPath();
  console.log(`[DB CLI] Target Database: ${dbPath}`);

  const db = getDatabase();

  try {
    switch (command) {
      case 'status': {
        const applied = getAppliedMigrations(db);
        console.log(`[DB CLI] Applied migrations (${applied.length}):`);
        for (const m of applied) {
          console.log(`  - ${m}`);
        }
        break;
      }
      case 'migrate': {
        console.log('[DB CLI] Running pending migrations...');
        const result = runMigrations(db);
        if (result.applied.length === 0) {
          console.log('[DB CLI] Database is already up to date.');
        } else {
          console.log(`[DB CLI] Successfully applied ${result.applied.length} migration(s):`);
          for (const m of result.applied) {
            console.log(`  + ${m}`);
          }
        }
        break;
      }
      case 'seed': {
        console.log('[DB CLI] Seeding database...');
        seedDatabase(db);
        console.log('[DB CLI] Seeding completed successfully.');
        break;
      }
      case 'reset': {
        console.log('[DB CLI] Resetting database tables...');
        resetDatabase(db);
        console.log('[DB CLI] Database tables dropped.');
        break;
      }
      case 'init': {
        console.log('[DB CLI] Performing full clean initialization...');
        resetDatabase(db);
        const res = runMigrations(db);
        console.log(`[DB CLI] Migrations applied: ${res.applied.join(', ')}`);
        seedDatabase(db);
        console.log('[DB CLI] Database initialized and seeded successfully.');
        break;
      }
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exitCode = 1;
    }
  } catch (error) {
    console.error(`[DB CLI] Error: ${(error as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDatabase(db);
  }
}

main();
