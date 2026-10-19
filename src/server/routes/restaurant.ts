// Ember & Olive: Restaurant Info Route Handler
// GET /api/restaurant per .team/CONTRACTS.md Section 4.5

import type { HttpRequestContext, ApiResponse, RestaurantInfo } from '../types.ts';
import { getDbAdapter } from '../db/adapter.ts';

export function handleRestaurantRoute(ctx: HttpRequestContext): {
  statusCode: number;
  body: ApiResponse<RestaurantInfo>;
} {
  const db = getDbAdapter();
  const info = db.getRestaurantInfo();

  return {
    statusCode: 200,
    body: {
      success: true,
      data: info,
    },
  };
}
