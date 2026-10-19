// Ember & Olive: File Persistence & Restart Test
import test from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getDatabase, closeDatabase } from '../connection.ts';
import { runMigrations } from '../migrate.ts';
import { createReservation, getReservationById } from '../reservations.ts';
import { getMenuCategories } from '../menu.ts';

test('File Persistence: data survives full connection close and restart', () => {
  const testDbFile = path.resolve(process.cwd(), 'data', 'test_persistence.db');

  // Clean start if exists
  if (fs.existsSync(testDbFile)) {
    fs.unlinkSync(testDbFile);
  }

  // 1. First session: initialize DB and create reservation
  const db1 = getDatabase(testDbFile);
  runMigrations(db1);

  const reservation = createReservation(db1, {
    customerName: 'Persistence Check Guest',
    email: 'guest@persistence.org',
    phone: '206-555-4321',
    reservationDate: '2026-11-15',
    reservationTime: '18:30',
    partySize: 6,
    specialRequest: 'Window booth please',
  });

  const resId = reservation.id;
  assert.ok(resId);

  // Close connection 1 cleanly
  closeDatabase(db1);

  // 2. Second session: open anew from the exact same file
  const db2 = getDatabase(testDbFile);

  // Check categories still exist
  const categories = getMenuCategories(db2);
  assert.strictEqual(categories.length, 4);

  // Check reservation persisted across restart
  const persisted = getReservationById(db2, resId);
  assert.ok(persisted, 'Reservation should persist across database closure');
  assert.strictEqual(persisted.customerName, 'Persistence Check Guest');
  assert.strictEqual(persisted.email, 'guest@persistence.org');
  assert.strictEqual(persisted.partySize, 6);
  assert.strictEqual(persisted.specialRequest, 'Window booth please');

  // Cleanup
  closeDatabase(db2);
  if (fs.existsSync(testDbFile)) {
    fs.unlinkSync(testDbFile);
  }
});
