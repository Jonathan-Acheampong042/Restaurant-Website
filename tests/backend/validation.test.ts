// Ember & Olive: Reservation Validation Tests

import * as assert from 'node:assert';
import { validateReservationRequest, VALID_SERVICE_TIMES } from '../../src/server/validation/reservation.ts';

export function runValidationTests(): { suite: string; passed: number; failed: number } {
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

  console.log('[Test Suite] Reservation Request Validation');

  // Today for test determinism
  const fixedToday = '2026-10-19';

  test('Valid reservation request passes validation', () => {
    const valid = {
      customerName: 'Elena Vance',
      email: 'elena@example.com',
      phone: '206-555-0182',
      reservationDate: '2026-10-25',
      reservationTime: '19:00',
      partySize: 4,
      specialRequest: 'Window seat if available',
    };

    const res = validateReservationRequest(valid, fixedToday);
    assert.strictEqual(res.isValid, true);
    assert.deepStrictEqual(res.errors, {});
    assert.strictEqual(res.data?.customerName, 'Elena Vance');
    assert.strictEqual(res.data?.email, 'elena@example.com');
    assert.strictEqual(res.data?.phone, '206-555-0182');
    assert.strictEqual(res.data?.partySize, 4);
    assert.strictEqual(res.data?.specialRequest, 'Window seat if available');
  });

  test('Rejects non-object or null payload', () => {
    assert.strictEqual(validateReservationRequest(null).isValid, false);
    assert.strictEqual(validateReservationRequest([]).isValid, false);
    assert.strictEqual(validateReservationRequest('string').isValid, false);
  });

  test('Customer name validation (min 2, max 100, trimmed)', () => {
    // Too short
    const short = validateReservationRequest({ customerName: 'A' }, fixedToday);
    assert.strictEqual(short.isValid, false);
    assert.ok(short.errors.customerName);

    // Whitespace only
    const whitespace = validateReservationRequest({ customerName: '   ' }, fixedToday);
    assert.strictEqual(whitespace.isValid, false);
    assert.ok(whitespace.errors.customerName);

    // Too long (101 chars)
    const long = validateReservationRequest({ customerName: 'A'.repeat(101) }, fixedToday);
    assert.strictEqual(long.isValid, false);
    assert.ok(long.errors.customerName);

    // Exact min bound (2 chars)
    const minBound = validateReservationRequest({
      customerName: 'Jo',
      email: 'jo@example.com',
      phone: '2065550199',
      reservationDate: '2026-10-25',
      reservationTime: '18:00',
      partySize: 2,
    }, fixedToday);
    assert.strictEqual(minBound.isValid, true);
    assert.strictEqual(minBound.data?.customerName, 'Jo');
  });

  test('Email validation (valid format and case normalization)', () => {
    const invalidEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'user@com', ''];
    for (const em of invalidEmails) {
      const res = validateReservationRequest({ email: em }, fixedToday);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.email, `Expected error for email: "${em}"`);
    }

    const uppercaseEmail = validateReservationRequest({
      customerName: 'Jo Chef',
      email: '  TEST.USER@EXAMPLE.COM  ',
      phone: '2065550199',
      reservationDate: '2026-10-25',
      reservationTime: '18:00',
      partySize: 2,
    }, fixedToday);
    assert.strictEqual(uppercaseEmail.isValid, true);
    assert.strictEqual(uppercaseEmail.data?.email, 'test.user@example.com');
  });

  test('Phone validation (at least 7 digits)', () => {
    const invalidPhones = ['123', 'phone-num', '12-34-5', ''];
    for (const ph of invalidPhones) {
      const res = validateReservationRequest({ phone: ph }, fixedToday);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.phone);
    }

    const formatted = validateReservationRequest({
      customerName: 'Jo Chef',
      email: 'jo@example.com',
      phone: '(206) 555-0199',
      reservationDate: '2026-10-25',
      reservationTime: '18:00',
      partySize: 2,
    }, fixedToday);
    assert.strictEqual(formatted.isValid, true);
    assert.strictEqual(formatted.data?.phone, '(206) 555-0199');
  });

  test('Reservation date validation (cannot be in past, cannot be > 90 days out)', () => {
    // In past
    const past = validateReservationRequest({ reservationDate: '2026-10-18' }, fixedToday);
    assert.strictEqual(past.isValid, false);
    assert.strictEqual(past.errors.reservationDate, 'Reservation date cannot be in the past');

    // More than 90 days in future (e.g. 100 days out)
    const farFuture = validateReservationRequest({ reservationDate: '2027-02-15' }, fixedToday);
    assert.strictEqual(farFuture.isValid, false);
    assert.strictEqual(farFuture.errors.reservationDate, 'Reservation date cannot be more than 90 days in the future');

    // Today is allowed
    const todayRes = validateReservationRequest({
      customerName: 'Jo Chef',
      email: 'jo@example.com',
      phone: '2065550199',
      reservationDate: fixedToday,
      reservationTime: '18:00',
      partySize: 2,
    }, fixedToday);
    assert.strictEqual(todayRes.isValid, true);

    // Invalid calendar date (Feb 30)
    const invalidDate = validateReservationRequest({ reservationDate: '2026-02-30' }, fixedToday);
    assert.strictEqual(invalidDate.isValid, false);
    assert.strictEqual(invalidDate.errors.reservationDate, 'Reservation date is not a valid calendar date');
  });

  test('Reservation time validation (matching restaurant service hours)', () => {
    // Valid lunch
    assert.ok(VALID_SERVICE_TIMES.has('12:00'));
    assert.ok(VALID_SERVICE_TIMES.has('14:30'));
    // Valid dinner
    assert.ok(VALID_SERVICE_TIMES.has('17:00'));
    assert.ok(VALID_SERVICE_TIMES.has('21:30'));

    const invalidTimes = ['11:30', '15:00', '16:00', '22:00', '22:30', 'noon', '19:15'];
    for (const tm of invalidTimes) {
      const res = validateReservationRequest({ reservationTime: tm }, fixedToday);
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.reservationTime, 'Reservation time must be within service hours');
    }
  });

  test('Party size validation (1 to 12 integer)', () => {
    const invalidSizes = [0, -1, 13, 2.5, '4', null, undefined];
    for (const size of invalidSizes) {
      const res = validateReservationRequest({ partySize: size }, fixedToday);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.partySize);
    }

    // Edge sizes 1 and 12
    const size1 = validateReservationRequest({
      customerName: 'Solo Diner',
      email: 'solo@example.com',
      phone: '2065550199',
      reservationDate: '2026-10-25',
      reservationTime: '18:00',
      partySize: 1,
    }, fixedToday);
    assert.strictEqual(size1.isValid, true);

    const size12 = validateReservationRequest({
      customerName: 'Large Party',
      email: 'party@example.com',
      phone: '2065550199',
      reservationDate: '2026-10-25',
      reservationTime: '18:00',
      partySize: 12,
    }, fixedToday);
    assert.strictEqual(size12.isValid, true);
  });

  test('Special request validation (optional, max 500 chars)', () => {
    const tooLong = validateReservationRequest({ specialRequest: 'x'.repeat(501) }, fixedToday);
    assert.strictEqual(tooLong.isValid, false);
    assert.strictEqual(tooLong.errors.specialRequest, 'Special request cannot exceed 500 characters');

    const validLong = validateReservationRequest({
      customerName: 'Celebrant',
      email: 'celebrant@example.com',
      phone: '2065550199',
      reservationDate: '2026-10-25',
      reservationTime: '18:00',
      partySize: 4,
      specialRequest: 'x'.repeat(500),
    }, fixedToday);
    assert.strictEqual(validLong.isValid, true);
  });

  return { suite: 'Reservation Request Validation', passed, failed };
}

if (process.argv[1] && process.argv[1].endsWith('validation.test.ts')) {
  const result = runValidationTests();
  process.exit(result.failed > 0 ? 1 : 0);
}
