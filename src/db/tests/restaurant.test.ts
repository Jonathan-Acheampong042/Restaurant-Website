// Ember & Olive: Restaurant Info Repository Tests
import test from 'node:test';
import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../migrate.ts';
import { getRestaurantInfo, updateRestaurantInfo } from '../restaurant.ts';

test('Restaurant Info Repository: query and update', () => {
  const db = new DatabaseSync(':memory:');
  runMigrations(db);

  // 1. Initial seeded info
  const info = getRestaurantInfo(db);
  assert.ok(info);
  assert.strictEqual(info.name, 'Ember & Olive');
  assert.strictEqual(info.tagline, 'Wood-Fired Mediterranean & Seasonal Cellar');
  assert.strictEqual(info.address, '418 Olive Way, Seattle, WA 98101');
  assert.strictEqual(info.phone, '(206) 555-0194');
  assert.strictEqual(info.email, 'hospitality@emberandolive.com');

  // Verify parsed hours structure
  assert.ok(info.hours.lunch);
  assert.ok(info.hours.dinner);
  assert.strictEqual(info.hours.lunch.days, 'Tuesday - Sunday');
  assert.ok(info.hours.lunch.timeSlots.includes('12:00'));
  assert.ok(info.hours.dinner.timeSlots.includes('19:00'));

  // 2. Update info
  const updated = updateRestaurantInfo(db, {
    tagline: 'Wood-Fired Hearth & Natural Wine',
    phone: '(206) 555-0199',
  });

  assert.strictEqual(updated.tagline, 'Wood-Fired Hearth & Natural Wine');
  assert.strictEqual(updated.phone, '(206) 555-0199');
  assert.strictEqual(updated.name, 'Ember & Olive'); // unchanged preserved

  // Re-read to confirm persistence
  const reRead = getRestaurantInfo(db);
  assert.strictEqual(reRead?.tagline, 'Wood-Fired Hearth & Natural Wine');

  db.close();
});
