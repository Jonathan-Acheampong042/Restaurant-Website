// Ember & Olive: Menu Route Handler
// GET /api/menu per .team/CONTRACTS.md Section 4.2

import type { HttpRequestContext, ApiResponse, MenuCategory, MenuItem } from '../types.ts';
import { getDbAdapter } from '../db/adapter.ts';

export function handleMenuRoute(ctx: HttpRequestContext): {
  statusCode: number;
  body: ApiResponse<{ categories: MenuCategory[]; items: MenuItem[] }>;
} {
  const db = getDbAdapter();

  const categoryId = ctx.query.categoryId || undefined;
  const availableOnly = ctx.query.availableOnly === 'true';

  const categories = db.getCategories();
  const items = db.getMenuItems({ categoryId, availableOnly });

  return {
    statusCode: 200,
    body: {
      success: true,
      data: {
        categories,
        items,
      },
    },
  };
}
