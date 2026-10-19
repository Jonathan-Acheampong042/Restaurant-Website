// Ember & Olive: Backend HTTP API Integration Tests
// Exercises the server against CONTRACTS.md Section 4

import * as http from 'node:http';
import * as assert from 'node:assert';
import { URL } from 'node:url';
import { app } from '../../src/server/app.ts';
import { setDbAdapter, StubDbAdapter } from '../../src/server/db/adapter.ts';

function httpRequest(
  baseUrl: string,
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; json: () => any; text: () => string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        agent: false,
        headers: {
          Connection: 'close',
          ...(options.headers || {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          resolve({
            status: res.statusCode || 200,
            headers: res.headers,
            text: () => raw,
            json: () => (raw ? JSON.parse(raw) : null),
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

export async function runApiTests(): Promise<{ suite: string; passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${name}:`, (err as Error).message);
    }
  }

  console.log('[Test Suite] HTTP API Endpoints Integration');

  // Use fresh stub adapter for tests
  setDbAdapter(new StubDbAdapter());

  // Start ephemeral test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as { address: string; port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. GET /api/health
    await test('GET /api/health returns 200 OK with timestamp', async () => {
      const res = await httpRequest(baseUrl, '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      const data = res.json();
      assert.strictEqual(data.status, 'ok');
      assert.ok(data.timestamp);
      assert.ok(!isNaN(Date.parse(data.timestamp)));
    });

    // 2. GET /api/menu
    await test('GET /api/menu returns 200 OK with categories and items', async () => {
      const res = await httpRequest(baseUrl, '/api/menu');
      assert.strictEqual(res.status, 200);
      const json = res.json();
      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.data.categories));
      assert.ok(Array.isArray(json.data.items));
      assert.ok(json.data.categories.length >= 4);
      assert.ok(json.data.items.length >= 7);

      // Verify category contract structure
      const cat = json.data.categories[0];
      assert.ok(cat.id);
      assert.ok(cat.name);
      assert.ok(typeof cat.displayOrder === 'number');

      // Verify item contract structure
      const item = json.data.items[0];
      assert.ok(item.id);
      assert.ok(item.categoryId);
      assert.ok(item.name);
      assert.ok(item.description);
      assert.ok(typeof item.price === 'number');
      assert.ok(Array.isArray(item.dietaryTags));
      assert.strictEqual(typeof item.isAvailable, 'boolean');
    });

    // 3. GET /api/menu with query filter
    await test('GET /api/menu?categoryId=starters filters items', async () => {
      const res = await httpRequest(baseUrl, '/api/menu?categoryId=starters');
      assert.strictEqual(res.status, 200);
      const json = res.json();
      for (const item of json.data.items) {
        assert.strictEqual(item.categoryId, 'starters');
      }
    });

    // 4. GET /api/restaurant
    await test('GET /api/restaurant returns 200 OK with restaurant details and hours', async () => {
      const res = await httpRequest(baseUrl, '/api/restaurant');
      assert.strictEqual(res.status, 200);
      const json = res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.name, 'Ember & Olive');
      assert.strictEqual(json.data.address, '418 Olive Way, Seattle, WA 98101');
      assert.strictEqual(json.data.phone, '(206) 555-0194');
      assert.strictEqual(json.data.email, 'hospitality@emberandolive.com');
      assert.ok(json.data.hours.lunch.timeSlots.length > 0);
      assert.ok(json.data.hours.dinner.timeSlots.length > 0);
    });

    // 5. POST /api/reservations (Valid)
    let createdReservationId = '';
    await test('POST /api/reservations creates reservation (201 Created)', async () => {
      const targetDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const payload = {
        customerName: 'Elena Vance',
        email: 'elena@example.com',
        phone: '206-555-0182',
        reservationDate: targetDate,
        reservationTime: '19:00',
        partySize: 4,
        specialRequest: 'Anniversary celebration',
      };

      const res = await httpRequest(baseUrl, '/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 201);
      const json = res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.id.startsWith('res_'));
      assert.strictEqual(json.data.customerName, 'Elena Vance');
      assert.strictEqual(json.data.email, 'elena@example.com');
      assert.strictEqual(json.data.status, 'confirmed');
      assert.ok(json.data.createdAt);
      assert.ok(json.data.updatedAt);

      createdReservationId = json.data.id;
    });

    // 6. GET /api/reservations/:id (Found)
    await test('GET /api/reservations/:id returns reservation (200 OK)', async () => {
      assert.ok(createdReservationId);
      const res = await httpRequest(baseUrl, `/api/reservations/${createdReservationId}`);
      assert.strictEqual(res.status, 200);
      const json = res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.id, createdReservationId);
      assert.strictEqual(json.data.customerName, 'Elena Vance');
    });

    // 7. GET /api/reservations/:id (Not Found)
    await test('GET /api/reservations/:id with nonexistent ID returns 404', async () => {
      const res = await httpRequest(baseUrl, '/api/reservations/res_doesnotexist');
      assert.strictEqual(res.status, 404);
      const json = res.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.error.code, 'NOT_FOUND');
    });

    // 8. POST /api/reservations (Validation Failed - 400 Bad Request)
    await test('POST /api/reservations with invalid fields returns 400 with details', async () => {
      const invalidPayload = {
        customerName: 'A',
        email: 'invalid-email',
        phone: '123',
        reservationDate: '2020-01-01',
        reservationTime: '11:00',
        partySize: 20,
      };

      const res = await httpRequest(baseUrl, '/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload),
      });

      assert.strictEqual(res.status, 400);
      const json = res.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.error.code, 'VALIDATION_FAILED');
      assert.strictEqual(json.error.message, 'Reservation input failed validation');
      assert.ok(json.error.details.customerName);
      assert.ok(json.error.details.email);
      assert.ok(json.error.details.phone);
      assert.ok(json.error.details.reservationDate);
      assert.ok(json.error.details.reservationTime);
      assert.ok(json.error.details.partySize);
    });

    // 9. POST /api/reservations with malformed JSON
    await test('POST with malformed JSON returns 400 INVALID_JSON', async () => {
      const res = await httpRequest(baseUrl, '/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"unclosed_json: true',
      });

      assert.strictEqual(res.status, 400);
      const json = res.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.error.code, 'INVALID_JSON');
    });

    // 10. CORS preflight OPTIONS
    await test('OPTIONS /api/reservations returns 204 with CORS headers', async () => {
      const res = await httpRequest(baseUrl, '/api/reservations', {
        method: 'OPTIONS',
      });
      assert.strictEqual(res.status, 204);
      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
      assert.ok(res.headers['access-control-allow-methods']);
    });

    // 11. Unknown endpoint returns 404
    await test('Unknown route returns 404 NOT_FOUND', async () => {
      const res = await httpRequest(baseUrl, '/api/not-a-real-route');
      assert.strictEqual(res.status, 404);
      const json = res.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.error.code, 'NOT_FOUND');
    });

    // 12. Invalid HTTP method returns 405 Method Not Allowed
    await test('POST to /api/health returns 405 METHOD_NOT_ALLOWED', async () => {
      const res = await httpRequest(baseUrl, '/api/health', {
        method: 'POST',
      });
      assert.strictEqual(res.status, 405);
      const json = res.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.error.code, 'METHOD_NOT_ALLOWED');
    });
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  return { suite: 'HTTP API Endpoints', passed, failed };
}

if (process.argv[1] && process.argv[1].endsWith('api.test.ts')) {
  runApiTests().then((res) => {
    if (res.failed > 0) {
      process.exitCode = 1;
    }
  });
}
