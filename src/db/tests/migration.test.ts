// Ember & Olive: Database Migration & Schema Tests
import test from 'node:test';
import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations, getAppliedMigrations, resetDatabase } from '../migrate.ts';

test('Database Migrations: clean run and idempotency', (t) => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Initial state: no migrations applied
  assert.deepStrictEqual(getAppliedMigrations(db), []);

  // 2. First migration run
  const result1 = runMigrations(db);
  assert.strictEqual(result1.applied.length, 2);
  assert.strictEqual(result1.applied[0], '001_initial_schema.sql');
  assert.strictEqual(result1.applied[1], '002_seed_data.sql');

  // Verify schema_migrations table
  const applied = getAppliedMigrations(db);
  assert.strictEqual(applied.length, 2);

  // 3. Second run should be idempotent (0 applied)
  const result2 = runMigrations(db);
  assert.strictEqual(result2.applied.length, 0);

  // 4. Foreign key constraint test
  assert.throws(() => {
    // Attempt inserting item with non-existent category
    db.prepare(`
      INSERT INTO menu_items (id, category_id, name, description, price)
      VALUES ('test_bad_cat', 'non_existent_category', 'Test', 'Test desc', 10.0)
    `).run();
  }, /FOREIGN KEY constraint failed/);

  // 5. Check constraints test
  assert.throws(() => {
    // Negative price
    db.prepare(`
      INSERT INTO menu_items (id, category_id, name, description, price)
      VALUES ('test_bad_price', 'starters', 'Test', 'Test desc', -5.0)
    `).run();
  }, /CHECK constraint failed/);

  // 6. Reset database
  resetDatabase(db);
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  assert.strictEqual(tables.length, 0);

  db.close();
});
