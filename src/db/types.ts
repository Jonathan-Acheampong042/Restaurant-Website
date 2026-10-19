// Ember & Olive: Database and Shared Contract Types
// Aligned exactly with .team/CONTRACTS.md

export type DietaryTag = 'V' | 'VG' | 'GF' | 'DF' | 'N';

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  createdAt?: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  dietaryTags: DietaryTag[];
  displayOrder: number;
  isAvailable: boolean;
  createdAt?: string;
}

export interface ReservationRequest {
  customerName: string;
  email: string;
  phone: string;
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:mm
  partySize: number;       // 1-12
  specialRequest?: string;
}

export interface Reservation extends ReservationRequest {
  id: string;
  status: 'confirmed' | 'cancelled' | 'seated';
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantHours {
  lunch: {
    days: string;
    hours: string;
    timeSlots: string[];
  };
  dinner: {
    days: string;
    hours: string;
    timeSlots: string[];
  };
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  hours: RestaurantHours;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

// Low-level SQLite table row representations
export interface MenuCategoryRow {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface MenuItemRow {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  dietary_tags: string;
  display_order: number;
  is_available: number;
  created_at: string;
}

export interface ReservationRow {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  special_request: string | null;
  status: 'confirmed' | 'cancelled' | 'seated';
  created_at: string;
  updated_at: string;
}

export interface RestaurantInfoRow {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  hours_json: string;
}

export interface MigrationRecord {
  id: number;
  name: string;
  applied_at: string;
}
