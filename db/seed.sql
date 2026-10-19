-- Ember & Olive: SQLite Seed Data
-- File: db/seed.sql

PRAGMA foreign_keys = ON;

-- Seed Categories
INSERT OR IGNORE INTO menu_categories (id, name, description, display_order) VALUES
('starters', 'Meze & Starters', 'Designed for sharing, wood-fired hearth breads & spreads', 1),
('mains', 'Wood-Fired & Coastal Mains', 'Prime cuts, fresh local catch, seasonal Mediterranean herbs', 2),
('desserts', 'House Sweets & Pastries', 'Artisanal Mediterranean desserts with local stone fruits & honey', 3),
('drinks', 'Wine & Artisanal Cocktails', 'Curated Mediterranean biodynamic wines and seasonal craft cocktails', 4);

-- Seed Menu Items
INSERT OR IGNORE INTO menu_items (id, category_id, name, description, price, dietary_tags, display_order, is_available) VALUES
('item_smoked_eggplant', 'starters', 'Smoked Eggplant Dip', 'Tahini, pomegranate seeds, grilled sourdough', 14.00, '["V","VG"]', 1, 1),
('item_wood_fired_octopus', 'starters', 'Charred Spanish Octopus', 'Fingerling potatoes, smoked paprika, caperberries', 24.50, '["GF","DF"]', 2, 1),
('item_halloumi', 'starters', 'Wood-Fired Halloumi', 'Wildflower honey, toasted sesame, fresh oregano', 16.00, '["V","GF"]', 3, 1),
('item_lamb_kofta', 'starters', 'Lamb Kofta Skewers', 'Mint labneh, pickled shallots, sumac', 18.50, '["GF"]', 4, 1),

('item_branzino', 'mains', 'Whole Mediterranean Branzino', 'Salsa verde, charred lemon, sea salt, shaved fennel', 38.00, '["GF","DF"]', 1, 1),
('item_ribeye', 'mains', '30-Day Dry Aged Ribeye', 'Chimichurri, roasted garlic head, rosemary sea salt', 48.00, '["GF","DF"]', 2, 1),
('item_mushroom_tagliatelle', 'mains', 'Wild Mushroom Tagliatelle', 'Porcini crema, parmigiano reggiano, fresh thyme', 28.00, '["V"]', 3, 1),
('item_roasted_chicken', 'mains', 'Wood-Roasted Half Chicken', 'Za''atar crust, garlic toum, roasted root vegetables', 32.00, '["GF","DF"]', 4, 1),

('item_citrus_cake', 'desserts', 'Olive Oil & Citrus Cake', 'Rosemary syrup, whipped mascarpone, candied pistachio', 12.00, '["V","N"]', 1, 1),
('item_chocolate_tart', 'desserts', 'Dark Chocolate Ganache Tart', 'Sea salt flake, smoked olive oil, espresso gelato', 13.50, '["V"]', 2, 1),
('item_honey_panna_cotta', 'desserts', 'Cardamom & Honey Panna Cotta', 'Roasted figs, thyme honey glaze', 11.50, '["V","GF"]', 3, 1),

('item_ember_old_fashioned', 'drinks', 'Ember Smoked Old Fashioned', 'Bourbon, smoked orange bitters, charred rosemary, demerara', 17.00, '["DF"]', 1, 1),
('item_greek_spritz', 'drinks', 'Greek Island Spritz', 'Mastiha, prosecco, ruby grapefruit, Aegean tonic', 15.00, '["V","VG","DF"]', 2, 1),
('item_assyrtiko_wine', 'drinks', '2021 Assyrtiko Santo Wines', 'Santorini, crisp mineral acidity, citrus peel, glass', 16.00, '["V","VG","GF","DF"]', 3, 1);

-- Seed Restaurant Info
INSERT OR REPLACE INTO restaurant_info (id, name, tagline, address, phone, email, hours_json) VALUES
(
    'default',
    'Ember & Olive',
    'Wood-Fired Mediterranean & Seasonal Cellar',
    '418 Olive Way, Seattle, WA 98101',
    '(206) 555-0194',
    'hospitality@emberandolive.com',
    '{"lunch":{"days":"Tuesday - Sunday","hours":"12:00 PM - 2:30 PM","timeSlots":["12:00","12:30","13:00","13:30","14:00","14:30"]},"dinner":{"days":"Tuesday - Sunday","hours":"5:00 PM - 10:00 PM","timeSlots":["17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30"]}}'
);
