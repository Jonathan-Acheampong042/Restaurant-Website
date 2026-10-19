// Ember & Olive: Frontend API Service
// Communicates with backend endpoints per .team/CONTRACTS.md Section 4
// Features seamless, clearly-marked mock fallback when backend server is offline

import type {
  ApiResponse,
  MenuCategory,
  MenuItem,
  ReservationRequest,
  Reservation,
  RestaurantInfo,
} from '../../types/shared.ts';
import {
  MOCK_CATEGORIES,
  MOCK_MENU_ITEMS,
  MOCK_RESTAURANT_INFO,
  mockReservationsStore,
} from './mockData.ts';

// Browser-safe base URL without relying on undeclared Node global types
const API_BASE_URL =
  typeof window !== 'undefined'
    ? ''
    : typeof globalThis !== 'undefined' &&
      (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env?.API_URL
    ? (globalThis as unknown as { process?: { env?: Record<string, string> } }).process!.env!.API_URL!
    : 'http://localhost:3001';

export interface MenuData {
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface ApiFetchOptions {
  timeoutMs?: number;
  forceMock?: boolean;
}

/**
 * Fetch restaurant menu categories and items.
 */
export async function fetchMenu(options: ApiFetchOptions = {}): Promise<{ data: MenuData; isMock: boolean }> {
  if (options.forceMock) {
    return {
      data: { categories: MOCK_CATEGORIES, items: MOCK_MENU_ITEMS },
      isMock: true,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 3000);

    const res = await fetch(`${API_BASE_URL}/api/menu`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json: ApiResponse<MenuData> = await res.json();
      if (json.success && json.data) {
        return { data: json.data, isMock: false };
      }
    }
    throw new Error(`Server returned status ${res.status}`);
  } catch (err) {
    console.warn('[Ember & Olive API] Backend /api/menu unavailable, using authoritative contract mock data:', err);
    return {
      data: { categories: MOCK_CATEGORIES, items: MOCK_MENU_ITEMS },
      isMock: true,
    };
  }
}

/**
 * Fetch restaurant details (hours, address, contact).
 */
export async function fetchRestaurantInfo(options: ApiFetchOptions = {}): Promise<{ data: RestaurantInfo; isMock: boolean }> {
  if (options.forceMock) {
    return { data: MOCK_RESTAURANT_INFO, isMock: true };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 3000);

    const res = await fetch(`${API_BASE_URL}/api/restaurant`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json: ApiResponse<RestaurantInfo> = await res.json();
      if (json.success && json.data) {
        return { data: json.data, isMock: false };
      }
    }
    throw new Error(`Server returned status ${res.status}`);
  } catch (err) {
    console.warn('[Ember & Olive API] Backend /api/restaurant unavailable, using authoritative contract mock data:', err);
    return { data: MOCK_RESTAURANT_INFO, isMock: true };
  }
}

/**
 * Submit a reservation request to /api/reservations.
 */
export async function submitReservation(
  payload: ReservationRequest,
  options: ApiFetchOptions = {}
): Promise<{ success: boolean; data?: Reservation; error?: { code: string; message: string; details?: Record<string, string> }; isMock: boolean }> {
  if (options.forceMock) {
    return mockSubmitReservation(payload);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 4000);

    const res = await fetch(`${API_BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const json: ApiResponse<Reservation> = await res.json();
    if (res.status === 201 && json.success && json.data) {
      return { success: true, data: json.data, isMock: false };
    }

    if (json.error) {
      return { success: false, error: json.error, isMock: false };
    }

    return {
      success: false,
      error: {
        code: 'HTTP_ERROR',
        message: `Server returned unexpected HTTP status ${res.status}`,
      },
      isMock: false,
    };
  } catch (err) {
    console.warn('[Ember & Olive API] Backend /api/reservations unavailable, using contract-compliant local persistence mock:', err);
    return mockSubmitReservation(payload);
  }
}

function mockSubmitReservation(payload: ReservationRequest): { success: boolean; data: Reservation; isMock: boolean } {
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const nowIso = new Date().toISOString();
  const created: Reservation = {
    ...payload,
    id: `res_${randomSuffix}`,
    status: 'confirmed',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  mockReservationsStore.push(created);
  return { success: true, data: created, isMock: true };
}
