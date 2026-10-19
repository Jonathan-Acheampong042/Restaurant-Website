// Ember & Olive: Reservations Repository & Data Access
// Type-safe, parameterized queries for reservation requests and lifecycle

import { DatabaseSync } from 'node:sqlite';
import * as crypto from 'node:crypto';
import { getDatabase } from './connection.ts';
import type {
  Reservation,
  ReservationRequest,
  ReservationRow,
} from './types.ts';

function mapReservationRow(row: ReservationRow): Reservation {
  return {
    id: row.id,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    reservationDate: row.reservation_date,
    reservationTime: row.reservation_time,
    partySize: row.party_size,
    specialRequest: row.special_request || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Generates a unique reservation ID matching the format res_<hex>.
 */
export function generateReservationId(): string {
  const hex = crypto.randomBytes(4).toString('hex');
  return `res_${hex}`;
}

/**
 * Persists a new reservation request.
 */
export function createReservation(
  db?: DatabaseSync,
  req?: ReservationRequest
): Reservation {
  if (!req) {
    throw new Error('Reservation request data is required');
  }

  // Pre-insert validation
  if (!req.customerName || req.customerName.trim().length < 2) {
    throw new Error('Customer name must be at least 2 characters');
  }
  if (!req.email || !req.email.includes('@')) {
    throw new Error('Valid email is required');
  }
  if (!req.phone || req.phone.trim().length < 7) {
    throw new Error('Valid phone number is required');
  }
  if (!req.partySize || req.partySize < 1 || req.partySize > 12) {
    throw new Error('Party size must be between 1 and 12');
  }

  const conn = db || getDatabase();
  const id = generateReservationId();
  const now = new Date().toISOString();

  const stmt = conn.prepare(`
    INSERT INTO reservations (
      id, customer_name, email, phone, reservation_date,
      reservation_time, party_size, special_request, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
  `);

  stmt.run(
    id,
    req.customerName.trim(),
    req.email.trim().toLowerCase(),
    req.phone.trim(),
    req.reservationDate,
    req.reservationTime,
    req.partySize,
    req.specialRequest ? req.specialRequest.trim() : null,
    now,
    now
  );

  const created = getReservationById(conn, id);
  if (!created) {
    throw new Error(`Failed to retrieve newly created reservation: ${id}`);
  }
  return created;
}

/**
 * Retrieves a reservation by ID.
 */
export function getReservationById(
  db?: DatabaseSync,
  id: string
): Reservation | null {
  const conn = db || getDatabase();
  const row = conn
    .prepare('SELECT * FROM reservations WHERE id = ?')
    .get(id) as unknown as ReservationRow | undefined;

  return row ? mapReservationRow(row) : null;
}

/**
 * Lists reservations with optional filters.
 */
export function listReservations(
  db?: DatabaseSync,
  filters?: { date?: string; status?: string; email?: string }
): Reservation[] {
  const conn = db || getDatabase();
  let sql = 'SELECT * FROM reservations WHERE 1=1';
  const params: (string | number)[] = [];

  if (filters?.date) {
    sql += ' AND reservation_date = ?';
    params.push(filters.date);
  }

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.email) {
    sql += ' AND email = ?';
    params.push(filters.email.toLowerCase().trim());
  }

  sql += ' ORDER BY reservation_date ASC, reservation_time ASC';

  const rows = conn.prepare(sql).all(...params) as unknown as ReservationRow[];
  return rows.map(mapReservationRow);
}

/**
 * Updates a reservation's status ('confirmed', 'cancelled', 'seated').
 */
export function updateReservationStatus(
  db?: DatabaseSync,
  id: string,
  status: 'confirmed' | 'cancelled' | 'seated'
): Reservation | null {
  const conn = db || getDatabase();
  const existing = getReservationById(conn, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  conn
    .prepare('UPDATE reservations SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, now, id);

  return getReservationById(conn, id);
}

/**
 * Cancels a reservation by ID.
 */
export function cancelReservation(
  db?: DatabaseSync,
  id: string
): Reservation | null {
  return updateReservationStatus(db, id, 'cancelled');
}

/**
 * Deletes a reservation record permanently.
 */
export function deleteReservation(db?: DatabaseSync, id: string): boolean {
  const conn = db || getDatabase();
  const res = conn.prepare('DELETE FROM reservations WHERE id = ?').run(id);
  return (res.changes as number) > 0;
}
