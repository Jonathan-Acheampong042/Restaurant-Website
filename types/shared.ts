// Ember & Olive — Shared Team Types
// Authoritative definitions matching .team/CONTRACTS.md Section 3

export type DietaryTag = 'V' | 'VG' | 'GF' | 'DF' | 'N';

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
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
