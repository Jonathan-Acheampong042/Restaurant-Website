// Ember & Olive: Menu Repository & Data Access
// Type-safe, parameterized queries for menu categories and menu items

import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from './connection.ts';
import type {
  MenuCategory,
  MenuItem,
  MenuCategoryRow,
  MenuItemRow,
  DietaryTag,
} from './types.ts';

function mapCategoryRow(row: MenuCategoryRow): MenuCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

function mapItemRow(row: MenuItemRow): MenuItem {
  let dietaryTags: DietaryTag[] = [];
  try {
    dietaryTags = JSON.parse(row.dietary_tags || '[]');
  } catch {
    dietaryTags = [];
  }

  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    dietaryTags,
    displayOrder: row.display_order,
    isAvailable: row.is_available === 1,
    createdAt: row.created_at,
  };
}

/**
 * Retrieves all menu categories, ordered by display_order.
 */
export function getMenuCategories(db?: DatabaseSync): MenuCategory[] {
  const conn = db || getDatabase();
  const rows = conn
    .prepare('SELECT id, name, description, display_order, created_at FROM menu_categories ORDER BY display_order ASC, name ASC')
    .all() as unknown as MenuCategoryRow[];

  return rows.map(mapCategoryRow);
}

/**
 * Retrieves menu items with optional category filtering and availability filtering.
 */
export function getMenuItems(
  db?: DatabaseSync,
  options?: { categoryId?: string; availableOnly?: boolean }
): MenuItem[] {
  const conn = db || getDatabase();
  let sql = 'SELECT id, category_id, name, description, price, dietary_tags, display_order, is_available, created_at FROM menu_items WHERE 1=1';
  const params: (string | number)[] = [];

  if (options?.categoryId) {
    sql += ' AND category_id = ?';
    params.push(options.categoryId);
  }

  if (options?.availableOnly) {
    sql += ' AND is_available = 1';
  }

  sql += ' ORDER BY display_order ASC, name ASC';

  const rows = conn.prepare(sql).all(...params) as unknown as MenuItemRow[];
  return rows.map(mapItemRow);
}

/**
 * Retrieves the complete menu hierarchy (all categories and all items).
 */
export function getFullMenu(db?: DatabaseSync): {
  categories: MenuCategory[];
  items: MenuItem[];
} {
  return {
    categories: getMenuCategories(db),
    items: getMenuItems(db),
  };
}

/**
 * Retrieves a single menu item by ID.
 */
export function getMenuItemById(db?: DatabaseSync, id: string): MenuItem | null {
  const conn = db || getDatabase();
  const row = conn
    .prepare('SELECT id, category_id, name, description, price, dietary_tags, display_order, is_available, created_at FROM menu_items WHERE id = ?')
    .get(id) as unknown as MenuItemRow | undefined;

  return row ? mapItemRow(row) : null;
}

/**
 * Adds a new menu item.
 */
export function createMenuItem(
  db?: DatabaseSync,
  item: Omit<MenuItem, 'isAvailable'> & { isAvailable?: boolean }
): MenuItem {
  const conn = db || getDatabase();
  const isAvailable = item.isAvailable === false ? 0 : 1;
  const tagsJson = JSON.stringify(item.dietaryTags || []);

  const stmt = conn.prepare(`
    INSERT INTO menu_items (id, category_id, name, description, price, dietary_tags, display_order, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    item.id,
    item.categoryId,
    item.name,
    item.description,
    item.price,
    tagsJson,
    item.displayOrder ?? 0,
    isAvailable
  );

  return getMenuItemById(conn, item.id)!;
}

/**
 * Updates a menu item's fields.
 */
export function updateMenuItem(
  db?: DatabaseSync,
  id: string,
  updates: Partial<MenuItem>
): MenuItem | null {
  const conn = db || getDatabase();
  const existing = getMenuItemById(conn, id);
  if (!existing) return null;

  const sets: string[] = [];
  const params: (string | number)[] = [];

  if (updates.categoryId !== undefined) {
    sets.push('category_id = ?');
    params.push(updates.categoryId);
  }
  if (updates.name !== undefined) {
    sets.push('name = ?');
    params.push(updates.name);
  }
  if (updates.description !== undefined) {
    sets.push('description = ?');
    params.push(updates.description);
  }
  if (updates.price !== undefined) {
    sets.push('price = ?');
    params.push(updates.price);
  }
  if (updates.dietaryTags !== undefined) {
    sets.push('dietary_tags = ?');
    params.push(JSON.stringify(updates.dietaryTags));
  }
  if (updates.displayOrder !== undefined) {
    sets.push('display_order = ?');
    params.push(updates.displayOrder);
  }
  if (updates.isAvailable !== undefined) {
    sets.push('is_available = ?');
    params.push(updates.isAvailable ? 1 : 0);
  }

  if (sets.length === 0) return existing;

  params.push(id);
  const sql = `UPDATE menu_items SET ${sets.join(', ')} WHERE id = ?`;
  conn.prepare(sql).run(...params);

  return getMenuItemById(conn, id);
}

/**
 * Deletes a menu item by ID.
 */
export function deleteMenuItem(db?: DatabaseSync, id: string): boolean {
  const conn = db || getDatabase();
  const res = conn.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
  return (res.changes as number) > 0;
}
