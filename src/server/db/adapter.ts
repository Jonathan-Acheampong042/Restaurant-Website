// Ember & Olive: Backend Database Adapter
// Supports native SQLite (DatabaseSync) with fallback to clearly-marked local stub
// per .team/CONTRACTS.md and AGENTS-backend.md

import { DatabaseSync } from 'node:sqlite';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  MenuCategory,
  MenuItem,
  Reservation,
  ReservationRequest,
  RestaurantInfo,
} from '../types.ts';

export interface IDatabaseAdapter {
  isStub: boolean;
  getCategories(): MenuCategory[];
  getMenuItems(options?: { categoryId?: string; availableOnly?: boolean }): MenuItem[];
  getRestaurantInfo(): RestaurantInfo;
  createReservation(req: ReservationRequest): Reservation;
  getReservationById(id: string): Reservation | null;
  listReservations(filters?: { date?: string; status?: string }): Reservation[];
}

// Default Authoritative Contract Data
const INITIAL_CATEGORIES: MenuCategory[] = [
  {
    id: 'starters',
    name: 'Meze & Starters',
    description: 'Designed for sharing',
    displayOrder: 1,
  },
  {
    id: 'mains',
    name: 'Wood-Fired & Coastal Mains',
    description: 'Heirloom grains, local seafood, and wood-fired meats',
    displayOrder: 2,
  },
  {
    id: 'desserts',
    name: 'House Sweets & Pastries',
    description: 'Artisanal Mediterranean desserts and seasonal fruits',
    displayOrder: 3,
  },
  {
    id: 'drinks',
    name: 'Wine & Artisanal Cocktails',
    description: 'Curated Mediterranean cellar selections and craft beverages',
    displayOrder: 4,
  },
];

const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-1',
    categoryId: 'starters',
    name: 'Smoked Eggplant Dip',
    description: 'Tahini, pomegranate seeds, grilled sourdough',
    price: 14.0,
    dietaryTags: ['V', 'VG'],
    displayOrder: 1,
    isAvailable: true,
  },
  {
    id: 'item-2',
    categoryId: 'starters',
    name: 'Charred Spanish Octopus',
    description: 'Fingerling potatoes, smoked paprika, caperberries',
    price: 24.5,
    dietaryTags: ['GF', 'DF'],
    displayOrder: 2,
    isAvailable: true,
  },
  {
    id: 'item-3',
    categoryId: 'starters',
    name: 'Wood-Fired Halloumi',
    description: 'Wild oregano, hot honey drizzle, sesame seeds, grilled lemon',
    price: 16.0,
    dietaryTags: ['V', 'GF'],
    displayOrder: 3,
    isAvailable: true,
  },
  {
    id: 'item-4',
    categoryId: 'mains',
    name: 'Whole Roasted Branzino',
    description: 'Charred herb oil, fennel-citrus slaw, salsa verde',
    price: 38.0,
    dietaryTags: ['GF', 'DF'],
    displayOrder: 1,
    isAvailable: true,
  },
  {
    id: 'item-5',
    categoryId: 'mains',
    name: 'Dry-Aged Lamb Chops',
    description: 'Spiced chickpea purée, roasted baby carrots, pomegranate reduction',
    price: 44.0,
    dietaryTags: ['GF'],
    displayOrder: 2,
    isAvailable: true,
  },
  {
    id: 'item-6',
    categoryId: 'desserts',
    name: 'Olive Oil Cake',
    description: 'Citrus mascarpone, poached figs, pistachio brittle',
    price: 12.0,
    dietaryTags: ['V', 'N'],
    displayOrder: 1,
    isAvailable: true,
  },
  {
    id: 'item-7',
    categoryId: 'drinks',
    name: 'Ember Spritz',
    description: 'Aperol, blood orange, sparkling wine, rosemary smoke',
    price: 16.0,
    dietaryTags: ['V', 'VG', 'GF'],
    displayOrder: 1,
    isAvailable: true,
  },
];

const INITIAL_RESTAURANT_INFO: RestaurantInfo = {
  name: 'Ember & Olive',
  tagline: 'Wood-Fired Mediterranean & Seasonal Cellar',
  address: '418 Olive Way, Seattle, WA 98101',
  phone: '(206) 555-0194',
  email: 'hospitality@emberandolive.com',
  hours: {
    lunch: {
      days: 'Tuesday - Sunday',
      hours: '12:00 PM - 2:30 PM',
      timeSlots: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
    },
    dinner: {
      days: 'Tuesday - Sunday',
      hours: '5:00 PM - 10:00 PM',
      timeSlots: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'],
    },
  },
};

/**
 * In-Memory Stub Database Adapter
 * Used when SQLite database file is not initialized or during testing.
 */
export class StubDbAdapter implements IDatabaseAdapter {
  readonly isStub = true;
  private categories: MenuCategory[];
  private items: MenuItem[];
  private restaurant: RestaurantInfo;
  private reservations: Map<string, Reservation>;

  constructor() {
    this.categories = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
    this.items = JSON.parse(JSON.stringify(INITIAL_MENU_ITEMS));
    this.restaurant = JSON.parse(JSON.stringify(INITIAL_RESTAURANT_INFO));
    this.reservations = new Map();
  }

  getCategories(): MenuCategory[] {
    return [...this.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getMenuItems(options?: { categoryId?: string; availableOnly?: boolean }): MenuItem[] {
    return this.items.filter((item) => {
      if (options?.categoryId && item.categoryId !== options.categoryId) {
        return false;
      }
      if (options?.availableOnly && !item.isAvailable) {
        return false;
      }
      return true;
    }).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getRestaurantInfo(): RestaurantInfo {
    return JSON.parse(JSON.stringify(this.restaurant));
  }

  createReservation(req: ReservationRequest): Reservation {
    const id = `res_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();
    const reservation: Reservation = {
      id,
      customerName: req.customerName,
      email: req.email,
      phone: req.phone,
      reservationDate: req.reservationDate,
      reservationTime: req.reservationTime,
      partySize: req.partySize,
      specialRequest: req.specialRequest,
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    };
    this.reservations.set(id, reservation);
    return reservation;
  }

  getReservationById(id: string): Reservation | null {
    return this.reservations.get(id) || null;
  }

  listReservations(filters?: { date?: string; status?: string }): Reservation[] {
    let list = Array.from(this.reservations.values());
    if (filters?.date) {
      list = list.filter((r) => r.reservationDate === filters.date);
    }
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    return list.sort((a, b) => a.reservationDate.localeCompare(b.reservationDate));
  }
}

/**
 * SQLite Database Adapter
 * Connects to SQLite database file per .team/CONTRACTS.md Section 2.
 */
export class SqliteDbAdapter implements IDatabaseAdapter {
  readonly isStub = false;
  private db: DatabaseSync;

  constructor(dbPathOrInstance: string | DatabaseSync) {
    if (typeof dbPathOrInstance === 'string') {
      const dir = path.dirname(dbPathOrInstance);
      if (dbPathOrInstance !== ':memory:' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.db = new DatabaseSync(dbPathOrInstance);
    } else {
      this.db = dbPathOrInstance;
    }
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  getCategories(): MenuCategory[] {
    const rows = this.db
      .prepare('SELECT id, name, description, display_order FROM menu_categories ORDER BY display_order ASC')
      .all() as any[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || undefined,
      displayOrder: Number(r.display_order),
    }));
  }

  getMenuItems(options?: { categoryId?: string; availableOnly?: boolean }): MenuItem[] {
    let sql = 'SELECT id, category_id, name, description, price, dietary_tags, display_order, is_available FROM menu_items WHERE 1=1';
    const params: any[] = [];

    if (options?.categoryId) {
      sql += ' AND category_id = ?';
      params.push(options.categoryId);
    }
    if (options?.availableOnly) {
      sql += ' AND is_available = 1';
    }

    sql += ' ORDER BY display_order ASC';

    const rows = this.db.prepare(sql).all(...params) as any[];

    return rows.map((r) => {
      let dietaryTags: any[] = [];
      try {
        dietaryTags = JSON.parse(r.dietary_tags || '[]');
      } catch {
        dietaryTags = [];
      }

      return {
        id: r.id,
        categoryId: r.category_id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        dietaryTags,
        displayOrder: Number(r.display_order),
        isAvailable: Number(r.is_available) === 1,
      };
    });
  }

  getRestaurantInfo(): RestaurantInfo {
    const row = this.db
      .prepare('SELECT name, tagline, address, phone, email, hours_json FROM restaurant_info WHERE id = ?')
      .get('default') as any;

    if (!row) {
      return INITIAL_RESTAURANT_INFO;
    }

    let hours: any;
    try {
      hours = JSON.parse(row.hours_json);
    } catch {
      hours = INITIAL_RESTAURANT_INFO.hours;
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

  createReservation(req: ReservationRequest): Reservation {
    const id = `res_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO reservations (
        id, customer_name, email, phone, reservation_date,
        reservation_time, party_size, special_request, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
    `);

    stmt.run(
      id,
      req.customerName,
      req.email,
      req.phone,
      req.reservationDate,
      req.reservationTime,
      req.partySize,
      req.specialRequest || null,
      now,
      now
    );

    return {
      id,
      customerName: req.customerName,
      email: req.email,
      phone: req.phone,
      reservationDate: req.reservationDate,
      reservationTime: req.reservationTime,
      partySize: req.partySize,
      specialRequest: req.specialRequest,
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    };
  }

  getReservationById(id: string): Reservation | null {
    const row = this.db
      .prepare('SELECT * FROM reservations WHERE id = ?')
      .get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      customerName: row.customer_name,
      email: row.email,
      phone: row.phone,
      reservationDate: row.reservation_date,
      reservationTime: row.reservation_time,
      partySize: Number(row.party_size),
      specialRequest: row.special_request || undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  listReservations(filters?: { date?: string; status?: string }): Reservation[] {
    let sql = 'SELECT * FROM reservations WHERE 1=1';
    const params: any[] = [];

    if (filters?.date) {
      sql += ' AND reservation_date = ?';
      params.push(filters.date);
    }
    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY reservation_date ASC, reservation_time ASC';
    const rows = this.db.prepare(sql).all(...params) as any[];

    return rows.map((row) => ({
      id: row.id,
      customerName: row.customer_name,
      email: row.email,
      phone: row.phone,
      reservationDate: row.reservation_date,
      reservationTime: row.reservation_time,
      partySize: Number(row.party_size),
      specialRequest: row.special_request || undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}

let activeAdapter: IDatabaseAdapter | null = null;

/**
 * Returns the active database adapter.
 * Prefers SQLite if available or configured, otherwise falls back to StubDbAdapter.
 */
export function getDbAdapter(forceStub: boolean = false): IDatabaseAdapter {
  if (forceStub) {
    return new StubDbAdapter();
  }

  if (activeAdapter) {
    return activeAdapter;
  }

  const dbPath = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/^(sqlite|file):\/\/?/, '')
    : path.resolve(process.cwd(), 'data', 'restaurant.db');

  if (fs.existsSync(dbPath)) {
    try {
      const sqliteAdapter = new SqliteDbAdapter(dbPath);
      // Verify table existence
      sqliteAdapter.getCategories();
      activeAdapter = sqliteAdapter;
      console.log(`[BACKEND DB] Connected to SQLite database at: ${dbPath}`);
      return activeAdapter;
    } catch (err) {
      console.warn(`[BACKEND DB] SQLite database found but could not query tables (${(err as Error).message}). Falling back to stub.`);
    }
  }

  console.log('[BACKEND DB] SQLite database not detected. Using clearly-marked local stub adapter per AGENTS-backend.md.');
  activeAdapter = new StubDbAdapter();
  return activeAdapter;
}

export function setDbAdapter(adapter: IDatabaseAdapter): void {
  activeAdapter = adapter;
}
