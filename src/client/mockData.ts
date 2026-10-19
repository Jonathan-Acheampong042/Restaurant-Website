// Ember & Olive: Mock Data Layer
// Authoritative fallback data aligned with .team/CONTRACTS.md and database seed data

import type { MenuCategory, MenuItem, RestaurantInfo, Reservation } from '../../types/shared.ts';

export const MOCK_RESTAURANT_INFO: RestaurantInfo = {
  name: 'Ember & Olive',
  tagline: 'Wood-Fired Mediterranean & Seasonal Cellar',
  address: '418 Olive Way, Seattle, WA 98101',
  phone: '(206) 555-0194',
  email: 'hospitality@emberandolive.com',
  hours: {
    lunch: {
      days: 'Tuesday – Sunday',
      hours: '12:00 PM – 2:30 PM',
      timeSlots: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
    },
    dinner: {
      days: 'Tuesday – Sunday',
      hours: '5:00 PM – 10:00 PM',
      timeSlots: [
        '17:00', '17:30', '18:00', '18:30',
        '19:00', '19:30', '20:00', '20:30',
        '21:00', '21:30',
      ],
    },
  },
};

export const MOCK_CATEGORIES: MenuCategory[] = [
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

export const MOCK_MENU_ITEMS: MenuItem[] = [
  // Starters
  {
    id: 'item_smoked_eggplant',
    categoryId: 'starters',
    name: 'Smoked Eggplant Dip',
    description: 'Tahini, pomegranate seeds, grilled sourdough, smoked sea salt',
    price: 14.0,
    dietaryTags: ['V', 'VG'],
    displayOrder: 1,
    isAvailable: true,
  },
  {
    id: 'item_wood_fired_octopus',
    categoryId: 'starters',
    name: 'Charred Spanish Octopus',
    description: 'Fingerling potatoes, smoked pimentón, caperberries, preserved lemon',
    price: 24.5,
    dietaryTags: ['GF', 'DF'],
    displayOrder: 2,
    isAvailable: true,
  },
  {
    id: 'item_halloumi',
    categoryId: 'starters',
    name: 'Wood-Fired Halloumi',
    description: 'Wildflower mountain honey, toasted sesame, fresh garden oregano',
    price: 16.0,
    dietaryTags: ['V', 'GF'],
    displayOrder: 3,
    isAvailable: true,
  },
  {
    id: 'item_lamb_kofta',
    categoryId: 'starters',
    name: 'Lamb Kofta Skewers',
    description: 'Mint labneh, pickled shallots, sumac, grilled flatbread',
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
    description: 'Herb salsa verde, charred lemon, sea salt, shaved fennel salad',
    price: 38.0,
    dietaryTags: ['GF', 'DF'],
    displayOrder: 1,
    isAvailable: true,
  },
  {
    id: 'item_ribeye',
    categoryId: 'mains',
    name: '30-Day Dry Aged Ribeye',
    description: 'Smoked chimichurri, roasted garlic head, rosemary sea salt',
    price: 48.0,
    dietaryTags: ['GF', 'DF'],
    displayOrder: 2,
    isAvailable: true,
  },
  {
    id: 'item_mushroom_tagliatelle',
    categoryId: 'mains',
    name: 'Wild Mushroom Tagliatelle',
    description: 'Porcini crema, 24-month parmigiano reggiano, fresh thyme, truffle peel',
    price: 28.0,
    dietaryTags: ['V'],
    displayOrder: 3,
    isAvailable: true,
  },
  {
    id: 'item_roasted_chicken',
    categoryId: 'mains',
    name: 'Wood-Roasted Half Chicken',
    description: "Za'atar herb crust, garlic toum, hearth-roasted root vegetables",
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
    description: 'Rosemary syrup, whipped mascarpone, candied Sicilian pistachio',
    price: 12.0,
    dietaryTags: ['V', 'N'],
    displayOrder: 1,
    isAvailable: true,
  },
  {
    id: 'item_chocolate_tart',
    categoryId: 'desserts',
    name: 'Dark Chocolate Ganache Tart',
    description: 'Maldon sea salt flake, smoked olive oil drizzle, espresso gelato',
    price: 13.5,
    dietaryTags: ['V'],
    displayOrder: 2,
    isAvailable: true,
  },
  {
    id: 'item_honey_panna_cotta',
    categoryId: 'desserts',
    name: 'Cardamom & Honey Panna Cotta',
    description: 'Caramelized black mission figs, wild thyme honey glaze',
    price: 11.5,
    dietaryTags: ['V', 'GF'],
    displayOrder: 3,
    isAvailable: true,
  },

  // Drinks
  {
    id: 'item_olive_branch_martini',
    categoryId: 'drinks',
    name: 'The Olive Branch Martini',
    description: 'Olive-oil washed botanic gin, dry vermouth, castelvetrano brine',
    price: 17.0,
    dietaryTags: ['V', 'VG', 'GF', 'DF'],
    displayOrder: 1,
    isAvailable: true,
  },
  {
    id: 'item_ember_smoke_cocktail',
    categoryId: 'drinks',
    name: 'Ember Old Fashioned',
    description: 'Bourbon, smoked date syrup, Angostura & orange bitters, charred cedar',
    price: 18.0,
    dietaryTags: ['V', 'VG', 'GF', 'DF'],
    displayOrder: 2,
    isAvailable: true,
  },
  {
    id: 'item_etnawine',
    categoryId: 'drinks',
    name: 'Etna Rosso DOC (Nerello Mascalese)',
    description: 'Terre Nere, Sicily — Mineral-driven red with wild berries & volcano earth',
    price: 16.0,
    dietaryTags: ['V', 'VG', 'GF', 'DF'],
    displayOrder: 3,
    isAvailable: true,
  },
];

// Fallback in-memory storage for reservations if backend server is not running
export const mockReservationsStore: Reservation[] = [
  {
    id: 'res_sample_01',
    customerName: 'Elena Vance',
    email: 'elena@example.com',
    phone: '206-555-0182',
    reservationDate: '2026-10-25',
    reservationTime: '19:00',
    partySize: 4,
    specialRequest: 'Anniversary celebration by the window',
    status: 'confirmed',
    createdAt: '2026-10-19T16:05:00Z',
    updatedAt: '2026-10-19T16:05:00Z',
  },
];
