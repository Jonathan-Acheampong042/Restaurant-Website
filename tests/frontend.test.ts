// Ember & Olive: Frontend Automated Test Suite
// Verifies reservation form validation, dietary filtering, contract models, and mock persistence

import test from 'node:test';
import assert from 'node:assert';
import { validateReservationForm, VALID_SERVICE_TIMES } from '../src/client/validation.ts';
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS, MOCK_RESTAURANT_INFO } from '../src/client/mockData.ts';
import { fetchMenu, fetchRestaurantInfo, submitReservation } from '../src/client/api.ts';
import type { ReservationRequest, DietaryTag } from '../types/shared.ts';

test('Frontend Validation Suite', async (t) => {
  const baseValidPayload: ReservationRequest = {
    customerName: 'Elena Vance',
    email: 'elena@example.com',
    phone: '206-555-0182',
    reservationDate: '2026-10-25',
    reservationTime: '19:00',
    partySize: 4,
    specialRequest: 'Anniversary celebration',
  };

  await t.test('accepts valid reservation payload', () => {
    const result = validateReservationForm(baseValidPayload, '2026-10-19');
    assert.strictEqual(result.isValid, true);
    assert.deepStrictEqual(result.errors, {});
    assert.ok(result.data);
    assert.strictEqual(result.data.customerName, 'Elena Vance');
    assert.strictEqual(result.data.email, 'elena@example.com');
  });

  await t.test('rejects customer name that is too short or too long', () => {
    const shortResult = validateReservationForm({ ...baseValidPayload, customerName: 'A' }, '2026-10-19');
    assert.strictEqual(shortResult.isValid, false);
    assert.ok(shortResult.errors.customerName);

    const longResult = validateReservationForm({ ...baseValidPayload, customerName: 'X'.repeat(101) }, '2026-10-19');
    assert.strictEqual(longResult.isValid, false);
    assert.ok(longResult.errors.customerName);
  });

  await t.test('rejects invalid email formats', () => {
    const invalidEmails = ['invalid', 'test@', '@example.com', 'test@example', 'user space@domain.com'];
    for (const badEmail of invalidEmails) {
      const res = validateReservationForm({ ...baseValidPayload, email: badEmail }, '2026-10-19');
      assert.strictEqual(res.isValid, false, `Expected ${badEmail} to fail validation`);
      assert.ok(res.errors.email);
    }
  });

  await t.test('rejects phone numbers with fewer than 7 digits', () => {
    const badPhones = ['123', 'phone', '(206) 5', ''];
    for (const badPhone of badPhones) {
      const res = validateReservationForm({ ...baseValidPayload, phone: badPhone }, '2026-10-19');
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.phone);
    }
  });

  await t.test('rejects reservation dates in the past', () => {
    const res = validateReservationForm({ ...baseValidPayload, reservationDate: '2026-10-18' }, '2026-10-19');
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.reservationDate);
    assert.match(res.errors.reservationDate, /past/i);
  });

  await t.test('rejects reservation dates more than 90 days in the future', () => {
    const res = validateReservationForm({ ...baseValidPayload, reservationDate: '2027-02-01' }, '2026-10-19');
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.reservationDate);
    assert.match(res.errors.reservationDate, /90 days/i);
  });

  await t.test('validates service time slots against lunch and dinner schedule', () => {
    // Valid slots
    for (const slot of VALID_SERVICE_TIMES) {
      const res = validateReservationForm({ ...baseValidPayload, reservationTime: slot }, '2026-10-19');
      assert.strictEqual(res.isValid, true, `Expected valid slot ${slot}`);
    }

    // Invalid slots
    const invalidSlots = ['11:00', '15:00', '16:30', '22:30', '00:00', 'invalid'];
    for (const badSlot of invalidSlots) {
      const res = validateReservationForm({ ...baseValidPayload, reservationTime: badSlot }, '2026-10-19');
      assert.strictEqual(res.isValid, false, `Expected invalid slot ${badSlot}`);
      assert.ok(res.errors.reservationTime);
    }
  });

  await t.test('enforces party size constraints (1-12 guests)', () => {
    const invalidSizes = [0, -1, 13, 20, 2.5];
    for (const badSize of invalidSizes) {
      const res = validateReservationForm({ ...baseValidPayload, partySize: badSize as any }, '2026-10-19');
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.partySize);
    }

    const validSizes = [1, 2, 4, 8, 12];
    for (const goodSize of validSizes) {
      const res = validateReservationForm({ ...baseValidPayload, partySize: goodSize }, '2026-10-19');
      assert.strictEqual(res.isValid, true, `Expected party size ${goodSize} to be valid`);
    }
  });

  await t.test('enforces special request length limit (max 500 characters)', () => {
    const longRequest = 'A'.repeat(501);
    const res = validateReservationForm({ ...baseValidPayload, specialRequest: longRequest }, '2026-10-19');
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.specialRequest);

    const validRequest = 'A'.repeat(500);
    const validRes = validateReservationForm({ ...baseValidPayload, specialRequest: validRequest }, '2026-10-19');
    assert.strictEqual(validRes.isValid, true);
  });
});

test('Menu Data & Dietary Filtering Suite', async (t) => {
  await t.test('provides four standard menu categories matching contract', () => {
    const categoryIds = MOCK_CATEGORIES.map((c) => c.id);
    assert.ok(categoryIds.includes('starters'));
    assert.ok(categoryIds.includes('mains'));
    assert.ok(categoryIds.includes('desserts'));
    assert.ok(categoryIds.includes('drinks'));
  });

  await t.test('filters menu items by dietary tags correctly', () => {
    const gfItems = MOCK_MENU_ITEMS.filter((item) => item.dietaryTags.includes('GF'));
    assert.ok(gfItems.length >= 5, 'Should have multiple Gluten-Free offerings');

    const veganItems = MOCK_MENU_ITEMS.filter((item) => item.dietaryTags.includes('VG'));
    assert.ok(veganItems.length >= 1, 'Should have Vegan offerings');

    const vegetarianItems = MOCK_MENU_ITEMS.filter((item) => item.dietaryTags.includes('V'));
    assert.ok(vegetarianItems.length >= 4, 'Should have Vegetarian offerings');
  });

  await t.test('all menu items have positive prices and required descriptions', () => {
    for (const item of MOCK_MENU_ITEMS) {
      assert.ok(item.price > 0, `Item ${item.name} must have positive price`);
      assert.ok(item.description.length > 5, `Item ${item.name} must have meaningful description`);
      assert.ok(item.categoryId, `Item ${item.name} must belong to a category`);
    }
  });
});

test('API Service and Mock Fallback Contract Suite', async (t) => {
  await t.test('fetchMenu returns structured categories and items', async () => {
    const res = await fetchMenu({ forceMock: true });
    assert.strictEqual(res.isMock, true);
    assert.ok(res.data.categories.length >= 4);
    assert.ok(res.data.items.length >= 8);
  });

  await t.test('fetchRestaurantInfo returns hours and contact details', async () => {
    const res = await fetchRestaurantInfo({ forceMock: true });
    assert.strictEqual(res.isMock, true);
    assert.strictEqual(res.data.name, 'Ember & Olive');
    assert.ok(res.data.hours.lunch.timeSlots.length > 0);
    assert.ok(res.data.hours.dinner.timeSlots.length > 0);
  });

  await t.test('submitReservation creates a persistent confirmed reservation with res_ ID', async () => {
    const req: ReservationRequest = {
      customerName: 'Marcus Aurelius',
      email: 'marcus@stoic.org',
      phone: '206-555-0999',
      reservationDate: '2026-11-01',
      reservationTime: '20:00',
      partySize: 2,
      specialRequest: 'Quiet corner table',
    };

    const res = await submitReservation(req, { forceMock: true });
    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    assert.ok(res.data.id.startsWith('res_'));
    assert.strictEqual(res.data.status, 'confirmed');
    assert.strictEqual(res.data.customerName, 'Marcus Aurelius');
  });
});
