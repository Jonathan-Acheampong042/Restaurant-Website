// Ember & Olive: Database Adapter Unit Tests

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { StubDbAdapter, SqliteDbAdapter } from '../../src/server/db/adapter.ts';

export function runDbTests(): { suite: string; passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${name}:`, (err as Error).message);
    }
  }

  console.log('[Test Suite] Database Adapters (Stub & SQLite)');

  // 1. Stub Adapter Tests
  test('StubDbAdapter: getCategories returns ordered categories', () => {
    const stub = new StubDbAdapter();
    const categories = stub.getCategories();
    assert.ok(categories.length >= 4);
    assert.strictEqual(categories[0].id, 'starters');
    assert.strictEqual(categories[1].id, 'mains');
    assert.strictEqual(categories[2].id, 'desserts');
    assert.strictEqual(categories[3].id, 'drinks');
  });

  test('StubDbAdapter: getMenuItems filters by category and availability', () => {
    const stub = new StubDbAdapter();
    const allItems = stub.getMenuItems();
    assert.ok(allItems.length >= 7);

    const starters = stub.getMenuItems({ categoryId: 'starters' });
    assert.ok(starters.length >= 3);
    for (const item of starters) {
      assert.strictEqual(item.categoryId, 'starters');
    }

    const available = stub.getMenuItems({ availableOnly: true });
    assert.ok(available.length > 0);
  });

  test('StubDbAdapter: getRestaurantInfo returns complete restaurant profile', () => {
    const stub = new StubDbAdapter();
    const info = stub.getRestaurantInfo();
    assert.strictEqual(info.name, 'Ember & Olive');
    assert.ok(info.hours.lunch.timeSlots.length > 0);
    assert.ok(info.hours.dinner.timeSlots.length > 0);
  });

  test('StubDbAdapter: reservation lifecycle (create, get, list)', () => {
    const stub = new StubDbAdapter();
    const created = stub.createReservation({
      customerName: 'Marcus Aurelius',
      email: 'marcus@rome.org',
      phone: '2065551234',
      reservationDate: '2026-10-28',
      reservationTime: '19:30',
      partySize: 2,
      specialRequest: 'Quiet corner',
    });

    assert.ok(created.id.startsWith('res_'));
    assert.strictEqual(created.status, 'confirmed');
    assert.strictEqual(created.customerName, 'Marcus Aurelius');

    const retrieved = stub.getReservationById(created.id);
    assert.deepStrictEqual(retrieved, created);

    const nonExistent = stub.getReservationById('res_not_real');
    assert.strictEqual(nonExistent, null);

    const list = stub.listReservations({ date: '2026-10-28' });
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, created.id);
  });

  // 2. SQLite Adapter Tests (Using in-memory DatabaseSync)
  test('SqliteDbAdapter: initializes schema and executes queries', () => {
    const memDb = new DatabaseSync(':memory:');
    memDb.exec(`
      CREATE TABLE menu_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE menu_items (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        dietary_tags TEXT NOT NULL DEFAULT '[]',
        display_order INTEGER NOT NULL DEFAULT 0,
        is_available INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE reservations (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        reservation_date TEXT NOT NULL,
        reservation_time TEXT NOT NULL,
        party_size INTEGER NOT NULL,
        special_request TEXT,
        status TEXT NOT NULL DEFAULT 'confirmed',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE restaurant_info (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tagline TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        hours_json TEXT NOT NULL
      );

      INSERT INTO menu_categories (id, name, description, display_order)
      VALUES ('starters', 'Meze & Starters', 'To share', 1);

      INSERT INTO menu_items (id, category_id, name, description, price, dietary_tags, display_order, is_available)
      VALUES ('item-1', 'starters', 'Smoked Eggplant', 'Delicious dip', 14.0, '["V"]', 1, 1);

      INSERT INTO restaurant_info (id, name, tagline, address, phone, email, hours_json)
      VALUES ('default', 'Ember & Olive', 'Tagline', 'Address', 'Phone', 'Email', '{"lunch":{"days":"","hours":"","timeSlots":[]},"dinner":{"days":"","hours":"","timeSlots":[]}}');
    `);

    const sqliteAdapter = new SqliteDbAdapter(memDb);

    // Categories
    const categories = sqliteAdapter.getCategories();
    assert.strictEqual(categories.length, 1);
    assert.strictEqual(categories[0].id, 'starters');

    // Menu items
    const items = sqliteAdapter.getMenuItems({ categoryId: 'starters' });
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].name, 'Smoked Eggplant');
    assert.strictEqual(items[0].price, 14.0);
    assert.deepStrictEqual(items[0].dietaryTags, ['V']);

    // Restaurant info
    const info = sqliteAdapter.getRestaurantInfo();
    assert.strictEqual(info.name, 'Ember & Olive');

    // Reservations
    const res = sqliteAdapter.createReservation({
      customerName: 'SQL Tester',
      email: 'sql@test.com',
      phone: '2065559988',
      reservationDate: '2026-11-01',
      reservationTime: '20:00',
      partySize: 4,
    });
    assert.ok(res.id.startsWith('res_'));

    const fetched = sqliteAdapter.getReservationById(res.id);
    assert.ok(fetched);
    assert.strictEqual(fetched?.customerName, 'SQL Tester');
    assert.strictEqual(fetched?.partySize, 4);

    memDb.close();
  });

  test('SqliteDbAdapter: integrates with database specialist migrations and seed files', () => {
    const memDb = new DatabaseSync(':memory:');
    const migPath = path.resolve(process.cwd(), '../database/migrations');
    if (fs.existsSync(migPath)) {
      const s1 = fs.readFileSync(path.join(migPath, '001_initial_schema.sql'), 'utf-8');
      const s2 = fs.readFileSync(path.join(migPath, '002_seed_data.sql'), 'utf-8');
      memDb.exec(s1);
      memDb.exec(s2);

      const adapter = new SqliteDbAdapter(memDb);
      const cats = adapter.getCategories();
      assert.strictEqual(cats.length, 4);
      const items = adapter.getMenuItems();
      assert.ok(items.length >= 10);
      const restaurant = adapter.getRestaurantInfo();
      assert.strictEqual(restaurant.name, 'Ember & Olive');
    }
    memDb.close();
  });

  return { suite: 'Database Adapters', passed, failed };
}

if (process.argv[1] && process.argv[1].endsWith('db.test.ts')) {
  const result = runDbTests();
  process.exit(result.failed > 0 ? 1 : 0);
}
