// Ember & Olive: Menu Repository Tests
import test from 'node:test';
import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../migrate.ts';
import {
  getMenuCategories,
  getMenuItems,
  getFullMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../menu.ts';

test('Menu Repository: category and item operations', () => {
  const db = new DatabaseSync(':memory:');
  runMigrations(db);

  // 1. Categories
  const categories = getMenuCategories(db);
  assert.strictEqual(categories.length, 4);
  assert.strictEqual(categories[0].id, 'starters');
  assert.strictEqual(categories[1].id, 'mains');
  assert.strictEqual(categories[2].id, 'desserts');
  assert.strictEqual(categories[3].id, 'drinks');

  // 2. Items
  const allItems = getMenuItems(db);
  assert.ok(allItems.length >= 14);

  // Filter by category
  const starterItems = getMenuItems(db, { categoryId: 'starters' });
  assert.strictEqual(starterItems.length, 4);
  for (const item of starterItems) {
    assert.strictEqual(item.categoryId, 'starters');
    assert.ok(Array.isArray(item.dietaryTags));
  }

  // 3. Full menu
  const full = getFullMenu(db);
  assert.strictEqual(full.categories.length, 4);
  assert.strictEqual(full.items.length, allItems.length);

  // 4. Get by ID
  const octopus = getMenuItemById(db, 'item_wood_fired_octopus');
  assert.ok(octopus);
  assert.strictEqual(octopus.name, 'Charred Spanish Octopus');
  assert.strictEqual(octopus.price, 24.5);
  assert.deepStrictEqual(octopus.dietaryTags, ['GF', 'DF']);

  const missing = getMenuItemById(db, 'non_existent_item');
  assert.strictEqual(missing, null);

  // 5. Create new item
  const newItem = createMenuItem(db, {
    id: 'item_special_catch',
    categoryId: 'mains',
    name: 'Catch of the Day: Grilled Swordfish',
    description: 'Salsa salmoriglio, charred wild leeks',
    price: 36.0,
    dietaryTags: ['GF', 'DF'],
    displayOrder: 99,
  });
  assert.strictEqual(newItem.id, 'item_special_catch');
  assert.strictEqual(newItem.isAvailable, true);

  const retrievedNew = getMenuItemById(db, 'item_special_catch');
  assert.ok(retrievedNew);
  assert.strictEqual(retrievedNew.name, 'Catch of the Day: Grilled Swordfish');

  // 6. Update item (e.g. 86 / make unavailable)
  const updated = updateMenuItem(db, 'item_special_catch', {
    isAvailable: false,
    price: 37.5,
  });
  assert.ok(updated);
  assert.strictEqual(updated.isAvailable, false);
  assert.strictEqual(updated.price, 37.5);

  // Filter available only should now exclude it
  const availableMains = getMenuItems(db, { categoryId: 'mains', availableOnly: true });
  assert.ok(!availableMains.some((i) => i.id === 'item_special_catch'));

  // 7. Delete item
  const deleted = deleteMenuItem(db, 'item_special_catch');
  assert.strictEqual(deleted, true);
  assert.strictEqual(getMenuItemById(db, 'item_special_catch'), null);

  db.close();
});
