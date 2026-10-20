// Ember & Olive: QA & Security Automated Test Suite
// Edge cases, security boundaries, SQL injection prevention, and contract validation

import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { validateReservationRequest, VALID_SERVICE_TIMES } from '../../src/server/validation/reservation.ts';
import { validateReservationForm } from '../../src/client/validation.ts';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../src/db/migrate.ts';
import { createReservation, getReservationById, listReservations } from '../../src/db/reservations.ts';
import { getFullMenu } from '../../src/db/menu.ts';
import { getRestaurantInfo } from '../../src/db/restaurant.ts';

describe('QA Security & Edge-Case Validation Suite', () => {
  const validPayload = {
    customerName: 'Marcus Aurelius',
    email: 'marcus@mediterranean.org',
    phone: '206-555-0199',
    reservationDate: new Date().toISOString().split('T')[0],
    reservationTime: '19:00',
    partySize: 4,
    specialRequest: 'Window seating please',
  };

  describe('Server Reservation Request Validation Edge Cases', () => {
    test('Boundary partySize: rejects 0 and 13, accepts 1 and 12', () => {
      const p0 = validateReservationRequest({ ...validPayload, partySize: 0 });
      assert.strictEqual(p0.isValid, false);
      assert.ok(p0.errors.partySize);

      const p13 = validateReservationRequest({ ...validPayload, partySize: 13 });
      assert.strictEqual(p13.isValid, false);
      assert.ok(p13.errors.partySize);

      const pFloat = validateReservationRequest({ ...validPayload, partySize: 4.5 });
      assert.strictEqual(pFloat.isValid, false);
      assert.ok(pFloat.errors.partySize);

      const p1 = validateReservationRequest({ ...validPayload, partySize: 1 });
      assert.strictEqual(p1.isValid, true);

      const p12 = validateReservationRequest({ ...validPayload, partySize: 12 });
      assert.strictEqual(p12.isValid, true);
    });

    test('Boundary customerName: min 2, max 100 characters', () => {
      const p1Char = validateReservationRequest({ ...validPayload, customerName: 'A' });
      assert.strictEqual(p1Char.isValid, false);

      const pSpaces = validateReservationRequest({ ...validPayload, customerName: '    ' });
      assert.strictEqual(pSpaces.isValid, false);

      const p101Char = validateReservationRequest({ ...validPayload, customerName: 'A'.repeat(101) });
      assert.strictEqual(p101Char.isValid, false);

      const p100Char = validateReservationRequest({ ...validPayload, customerName: 'A'.repeat(100) });
      assert.strictEqual(p100Char.isValid, true);
      assert.strictEqual(p100Char.data?.customerName, 'A'.repeat(100));
    });

    test('Boundary reservationDate: rejects past date and >90 days out', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastStr = yesterday.toISOString().split('T')[0];

      const pPast = validateReservationRequest({ ...validPayload, reservationDate: pastStr });
      assert.strictEqual(pPast.isValid, false);
      assert.ok(pPast.errors.reservationDate.includes('past'));

      const day91 = new Date();
      day91.setDate(day91.getDate() + 91);
      const future91 = day91.toISOString().split('T')[0];

      const p91 = validateReservationRequest({ ...validPayload, reservationDate: future91 });
      assert.strictEqual(p91.isValid, false);
      assert.ok(p91.errors.reservationDate.includes('90 days'));

      // Today should pass
      const todayStr = new Date().toISOString().split('T')[0];
      const pToday = validateReservationRequest({ ...validPayload, reservationDate: todayStr });
      assert.strictEqual(pToday.isValid, true);
    });

    test('Boundary specialRequest: max 500 characters', () => {
      const p501 = validateReservationRequest({ ...validPayload, specialRequest: 'x'.repeat(501) });
      assert.strictEqual(p501.isValid, false);
      assert.ok(p501.errors.specialRequest);

      const p500 = validateReservationRequest({ ...validPayload, specialRequest: 'x'.repeat(500) });
      assert.strictEqual(p500.isValid, true);
      assert.strictEqual(p500.data?.specialRequest, 'x'.repeat(500));
    });

    test('Service time validation: must strictly be in lunch or dinner slots', () => {
      const pOffHours = validateReservationRequest({ ...validPayload, reservationTime: '15:15' });
      assert.strictEqual(pOffHours.isValid, false);

      const pMidnight = validateReservationRequest({ ...validPayload, reservationTime: '00:00' });
      assert.strictEqual(pMidnight.isValid, false);

      for (const slot of VALID_SERVICE_TIMES) {
        const pSlot = validateReservationRequest({ ...validPayload, reservationTime: slot });
        assert.strictEqual(pSlot.isValid, true, `Expected slot ${slot} to be valid`);
      }
    });

    test('SQL Injection and XSS probe strings in payload', () => {
      const maliciousPayload = {
        customerName: "Robert'); DROP TABLE reservations;--",
        email: 'hacker@injection.test',
        phone: '206-555-9999',
        reservationDate: new Date().toISOString().split('T')[0],
        reservationTime: '19:00',
        partySize: 2,
        specialRequest: "<script>alert('xss')</script> SELECT * FROM users;",
      };

      const result = validateReservationRequest(maliciousPayload);
      assert.strictEqual(result.isValid, true);
      // Sanitized correctly as literal strings
      assert.strictEqual(result.data?.customerName, "Robert'); DROP TABLE reservations;--");
      assert.strictEqual(result.data?.specialRequest, "<script>alert('xss')</script> SELECT * FROM users;");
    });
  });

  describe('Client Form Validation Parity', () => {
    test('Client validator matches server validation rules', () => {
      const clientResult = validateReservationForm(validPayload);
      assert.strictEqual(clientResult.isValid, true);

      const invalidClient = validateReservationForm({
        ...validPayload,
        partySize: 15,
        email: 'invalid-email',
      });
      assert.strictEqual(invalidClient.isValid, false);
      assert.ok(invalidClient.errors.partySize);
      assert.ok(invalidClient.errors.email);
    });
  });

  describe('Database Security & Parameterized Query Integrity', () => {
    test('In-memory SQLite handles injection payload safely without SQL error or injection', () => {
      const db = new DatabaseSync(':memory:');
      runMigrations(db);

      const injectionName = "Robert'); DROP TABLE reservations;--";
      const injectionNotes = "' OR '1'='1' UNION SELECT * FROM restaurant_info;--";

      const created = createReservation(db, {
        customerName: injectionName,
        email: 'safe@emberandolive.com',
        phone: '206-555-0182',
        reservationDate: '2026-10-25',
        reservationTime: '19:00',
        partySize: 2,
        specialRequest: injectionNotes,
      });

      assert.ok(created.id.startsWith('res_'));
      assert.strictEqual(created.customerName, injectionName);
      assert.strictEqual(created.specialRequest, injectionNotes);

      // Verify table still exists and data is intact
      const fetched = getReservationById(db, created.id);
      assert.ok(fetched);
      assert.strictEqual(fetched.customerName, injectionName);

      // Verify menu and restaurant tables are completely unharmed
      const menu = getFullMenu(db);
      assert.ok(menu.categories.length > 0);

      const info = getRestaurantInfo(db);
      assert.ok(info);
      assert.strictEqual(info.name, 'Ember & Olive');

      db.close();
    });

    test('SQLite Schema constraint enforcement: rejects negative prices and invalid party size', () => {
      const db = new DatabaseSync(':memory:');
      runMigrations(db);

      // Direct insert check constraint test: party_size out of bounds
      assert.throws(() => {
        db.prepare(`
          INSERT INTO reservations (id, customer_name, email, phone, reservation_date, reservation_time, party_size, status)
          VALUES ('res_test_invalid', 'Invalid Party', 'test@test.com', '206-555-0000', '2026-10-25', '19:00', 99, 'confirmed')
        `).run();
      }, /CHECK constraint failed/);

      // Direct insert check constraint test: menu item price < 0
      assert.throws(() => {
        db.prepare(`
          INSERT INTO menu_items (id, category_id, name, description, price)
          VALUES ('item_neg', 'starters', 'Negative Dish', 'Description', -5.0)
        `).run();
      }, /CHECK constraint failed/);

      db.close();
    });
  });
});
