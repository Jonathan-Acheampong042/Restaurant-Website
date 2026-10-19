// Ember & Olive: Database Seed Module
// Provides authoritative seed data and programmatic seeding function

import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from './connection.ts';
import type { MenuCategory, MenuItem, RestaurantInfo } from './types.ts';

export const SEED_CATEGORIES: MenuCategory[] = [
  {
    id: 'starters',
    name: 'Meze & Starters',
    description: 'Designed for sharing, wood-fired hearth breads & spreads',
    displayOrder: 1,
  },
  {
    id: 'mains',
    name: 'Wood-Fired & Coastal Mains',
    description: 'Prime cuts, fresh local catch, seasonal Mediterranean herbs',
    displayOrder: 2,
  },
  {
    id: 'desserts',
    name: 'House Sweets & Pastries',
    description: 'Artisanal Mediterranean desserts with local stone fruits & honey',
    displayOrder: 3,
  },
  {
    id: 'drinks',
    name: 'Wine & Artisanal Cocktails',
    description: 'Curated Mediterranean biodynamic wines and seasonal craft cocktails',
    displayOrder: 4,
  },
];

export const SEED_MENU_ITEMS: MenuItem[] = [
  // Starters
  {
    id: 'item_smoked_eggplant',
    categoryId: 'starters',
    name: 'Smoked Eggplant Dip',
    description: 'Tahini, pomegranate seeds, grilled sourdough',
    price: 14.0,
    dietaryTags: ['V', 'VG'],
    displayOrder: 1,
    isAvailable: true,
  },
  {
    id: 'item_wood_fired_octopus',
    categoryId: 'starters',
    name: 'Charred Spanish Octopus',
    description: 'Fingerling potatoes, smoked paprika, caperberries',
    price: 24.5,
    dietaryTags: ['GF', 'DF'],
    displayOrder: 2,
    isAvailable: true,
  },
  {
    id: 'item_halloumi',
    categoryId: 'starters',
    name: 'Wood-Fired Halloumi',
    description: 'Wildflower honey, toasted sesame, fresh oregano',
    price: 16.0,
    dietaryTags: ['V', 'GF'],
    displayOrder: 3,
    isAvailable: true,
  },
  {
    id: 'item_lamb_kofta',
    categoryId: 'starters',
    name: 'Lamb Kofta Skewers',
    description: 'Mint labneh, pickled shallots, sumac',
    price: 18.5,
    dietaryTags: ['GF'],
    displayOrder: 4,
    isAvailable: true,
  },

  // Mains
  {
    id: 'item_branzino',
    categoryId: 'mains',
    name: 'Whole Mediterranean Branzino',
    description: 'Salsa verde, charred lemon, sea salt, shaved fennel',
    price: 38.0,
    dietaryTags: ['GF', 'DF'],
    displayOrder: 1,
    isAvailable: true,
  },
  {
    id: 'item_ribeye',
    categoryId: 'mains',
    name: '30-Day Dry Aged Ribeye',
    description: 'Chimichurri, roasted garlic head, rosemary sea salt',
    price: 48.0,
    dietaryTags: ['GF', 'DF'],
    displayOrder: 2,
    isAvailable: true,
  },
  {
    id: 'item_mushroom_tagliatelle',
    categoryId: 'mains',
    name: 'Wild Mushroom Tagliatelle',
    description: 'Porcini crema, parmigiano reggiano, fresh thyme',
    price: 28.0,
    dietaryTags: ['V'],
    displayOrder: 3,
    isAvailable: true,
  },
  {
    id: 'item_roasted_chicken',
    categoryId: 'mains',
    name: 'Wood-Roasted Half Chicken',
    description: "Za'atar crust, garlic toum, roasted root vegetables",
    price: 32.0,
    dietaryTags: ['GF', 'DF'],
    displayOrder: 4,
    isAvailable: true,
  },

  // Desserts
  {
    id: 'item_citrus_cake',
    categoryId: 'desserts',
    name: 'Olive Oil & Citrus Cake',
    description: 'Rosemary syrup, whipped mascarpone, candied pistachio',
    price: 12.0,
    dietaryTags: ['V', 'N'],
    displayOrder: 1,
    isAvailable: true,
  },
  {
    id: 'item_chocolate_tart',
    categoryId: 'desserts',
    name: 'Dark Chocolate Ganache Tart',
    description: 'Sea salt flake, smoked olive oil, espresso gelato',
    price: 13.5,
    dietaryTags: ['V'],
    displayOrder: 2,
    isAvailable: true,
  },
  {
    id: 'item_honey_panna_cotta',
    categoryId: 'desserts',
    name: 'Cardamom & Honey Panna Cotta',
    description: 'Roasted figs, thyme honey glaze',
    price: 11.5,
    dietaryTags: ['V', 'GF'],
    displayOrder: 3,
    isAvailable: true,
  },

  // Drinks
  {
    id: 'item_ember_old_fashioned',
    categoryId: 'drinks',
    name: 'Ember Smoked Old Fashioned',
    description: 'Bourbon, smoked orange bitters, charred rosemary, demerara',
    price: 17.0,
    dietaryTags: ['DF'],
    displayOrder: 1,
    isAvailable: true,
  },
  {
    id: 'item_greek_spritz',
    categoryId: 'drinks',
    name: 'Greek Island Spritz',
    description: 'Mastiha, prosecco, ruby grapefruit, Aegean tonic',
    price: 15.0,
    dietaryTags: ['V', 'VG', 'DF'],
    displayOrder: 2,
    isAvailable: true,
  },
  {
    id: 'item_assyrtiko_wine',
    categoryId: 'drinks',
    name: '2021 Assyrtiko Santo Wines',
    description: 'Santorini, crisp mineral acidity, citrus peel, glass',
    price: 16.0,
    dietaryTags: ['V', 'VG', 'GF', 'DF'],
    displayOrder: 3,
    isAvailable: true,
  },
];

export const SEED_RESTAURANT_INFO: RestaurantInfo = {
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
 * Seeds the database with standard Ember & Olive menu items, categories, and restaurant info.
 */
export function seedDatabase(db?: DatabaseSync): void {
  const conn = db || getDatabase();

  conn.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    // Categories
    const categoryStmt = conn.prepare(`
      INSERT INTO menu_categories (id, name, description, display_order)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        display_order = excluded.display_order
    `);
    for (const cat of SEED_CATEGORIES) {
      categoryStmt.run(cat.id, cat.name, cat.description || null, cat.displayOrder);
    }

    // Items
    const itemStmt = conn.prepare(`
      INSERT INTO menu_items (id, category_id, name, description, price, dietary_tags, display_order, is_available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category_id = excluded.category_id,
        name = excluded.name,
        description = excluded.description,
        price = excluded.price,
        dietary_tags = excluded.dietary_tags,
        display_order = excluded.display_order,
        is_available = excluded.is_available
    `);
    for (const item of SEED_MENU_ITEMS) {
      itemStmt.run(
        item.id,
        item.categoryId,
        item.name,
        item.description,
        item.price,
        JSON.stringify(item.dietaryTags || []),
        item.displayOrder,
        item.isAvailable ? 1 : 0
      );
    }

    // Restaurant Info
    const infoStmt = conn.prepare(`
      INSERT INTO restaurant_info (id, name, tagline, address, phone, email, hours_json)
      VALUES ('default', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = excluded.tagline,
        address = excluded.address,
        phone = excluded.phone,
        email = excluded.email,
        hours_json = excluded.hours_json
    `);
    infoStmt.run(
      SEED_RESTAURANT_INFO.name,
      SEED_RESTAURANT_INFO.tagline,
      SEED_RESTAURANT_INFO.address,
      SEED_RESTAURANT_INFO.phone,
      SEED_RESTAURANT_INFO.email,
      JSON.stringify(SEED_RESTAURANT_INFO.hours)
    );

    conn.exec('COMMIT;');
  } catch (error) {
    conn.exec('ROLLBACK;');
    throw new Error(`Seeding failed: ${(error as Error).message}`);
  }
}
