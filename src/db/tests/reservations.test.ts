// Ember & Olive: Reservations Repository Tests
import test from 'node:test';
import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../migrate.ts';
import {
  createReservation,
  getReservationById,
  listReservations,
  updateReservationStatus,
  cancelReservation,
  deleteReservation,
} from '../reservations.ts';

test('Reservations Repository: CRUD, filters, and constraint validations', () => {
  const db = new DatabaseSync(':memory:');
  runMigrations(db);

  // 1. Successful reservation creation
  const res1 = createReservation(db, {
    customerName: 'Elena Vance',
    email: 'elena@example.com',
    phone: '206-555-0182',
    reservationDate: '2026-10-25',
    reservationTime: '19:00',
    partySize: 4,
    specialRequest: 'Anniversary table by the hearth',
  });

  assert.ok(res1.id.startsWith('res_'));
  assert.strictEqual(res1.customerName, 'Elena Vance');
  assert.strictEqual(res1.email, 'elena@example.com');
  assert.strictEqual(res1.partySize, 4);
  assert.strictEqual(res1.status, 'confirmed');
  assert.ok(res1.createdAt);
  assert.ok(res1.updatedAt);

  // 2. Fetch by ID
  const fetched = getReservationById(db, res1.id);
  assert.ok(fetched);
  assert.strictEqual(fetched.id, res1.id);
  assert.strictEqual(fetched.specialRequest, 'Anniversary table by the hearth');

  // 3. Create second reservation
  const res2 = createReservation(db, {
    customerName: 'Marcus Miller',
    email: 'marcus@example.com',
    phone: '206-555-9988',
    reservationDate: '2026-10-25',
    reservationTime: '20:30',
    partySize: 2,
  });

  // 4. List and filtering
  const allOnDate = listReservations(db, { date: '2026-10-25' });
  assert.strictEqual(allOnDate.length, 2);

  const byEmail = listReservations(db, { email: 'elena@example.com' });
  assert.strictEqual(byEmail.length, 1);
  assert.strictEqual(byEmail[0].id, res1.id);

  // 5. Status transitions
  const seated = updateReservationStatus(db, res1.id, 'seated');
  assert.ok(seated);
  assert.strictEqual(seated.status, 'seated');

  const cancelled = cancelReservation(db, res2.id);
  assert.ok(cancelled);
  assert.strictEqual(cancelled.status, 'cancelled');

  const confirmedOnly = listReservations(db, { status: 'confirmed' });
  assert.strictEqual(confirmedOnly.length, 0);

  // 6. Validations - Client level
  assert.throws(() => {
    createReservation(db, {
      customerName: 'A', // too short
      email: 'a@example.com',
      phone: '206-555-0101',
      reservationDate: '2026-10-25',
      reservationTime: '19:00',
      partySize: 2,
    });
  }, /Customer name must be at least 2 characters/);

  assert.throws(() => {
    createReservation(db, {
      customerName: 'Valid Name',
      email: 'invalid-email',
      phone: '206-555-0101',
      reservationDate: '2026-10-25',
      reservationTime: '19:00',
      partySize: 2,
    });
  }, /Valid email is required/);

  assert.throws(() => {
    createReservation(db, {
      customerName: 'Valid Name',
      email: 'valid@example.com',
      phone: '206-555-0101',
      reservationDate: '2026-10-25',
      reservationTime: '19:00',
      partySize: 15, // over limit
    });
  }, /Party size must be between 1 and 12/);

  // 7. Delete reservation
  const deleted = deleteReservation(db, res2.id);
  assert.strictEqual(deleted, true);
  assert.strictEqual(getReservationById(db, res2.id), null);

  db.close();
});
