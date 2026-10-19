// Ember & Olive: Restaurant Info Repository
// Access and manage restaurant location, hours, and branding metadata

import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from './connection.ts';
import type {
  RestaurantInfo,
  RestaurantInfoRow,
  RestaurantHours,
} from './types.ts';

function mapRestaurantRow(row: RestaurantInfoRow): RestaurantInfo {
  let hours: RestaurantHours;
  try {
    hours = JSON.parse(row.hours_json);
  } catch {
    hours = {
      lunch: { days: '', hours: '', timeSlots: [] },
      dinner: { days: '', hours: '', timeSlots: [] },
    };
  }

  return {
    name: row.name,
    tagline: row.tagline,
    address: row.address,
    phone: row.phone,
    email: row.email,
    hours,
  };
}

/**
 * Retrieves the restaurant information record.
 */
export function getRestaurantInfo(db?: DatabaseSync): RestaurantInfo | null {
  const conn = db || getDatabase();
  const row = conn
    .prepare('SELECT id, name, tagline, address, phone, email, hours_json FROM restaurant_info WHERE id = ?')
    .get('default') as unknown as RestaurantInfoRow | undefined;

  return row ? mapRestaurantRow(row) : null;
}

/**
 * Updates or sets the restaurant information.
 */
export function updateRestaurantInfo(
  db?: DatabaseSync,
  updates?: Partial<RestaurantInfo>
): RestaurantInfo {
  if (!updates) {
    throw new Error('Update payload is required');
  }

  const conn = db || getDatabase();
  const current = getRestaurantInfo(conn);

  const finalName = updates.name ?? current?.name ?? 'Ember & Olive';
  const finalTagline = updates.tagline ?? current?.tagline ?? 'Wood-Fired Mediterranean & Seasonal Cellar';
  const finalAddress = updates.address ?? current?.address ?? '418 Olive Way, Seattle, WA 98101';
  const finalPhone = updates.phone ?? current?.phone ?? '(206) 555-0194';
  const finalEmail = updates.email ?? current?.email ?? 'hospitality@emberandolive.com';
  const finalHours = updates.hours ?? current?.hours ?? {
    lunch: { days: '', hours: '', timeSlots: [] },
    dinner: { days: '', hours: '', timeSlots: [] },
  };

  const stmt = conn.prepare(`
    INSERT OR REPLACE INTO restaurant_info (id, name, tagline, address, phone, email, hours_json)
    VALUES ('default', ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    finalName,
    finalTagline,
    finalAddress,
    finalPhone,
    finalEmail,
    JSON.stringify(finalHours)
  );

  return getRestaurantInfo(conn)!;
}
