// Ember & Olive: Backend Request Router
// Dispatches incoming HTTP requests to route handlers per .team/CONTRACTS.md

import type { HttpRequestContext, HttpResponseContext } from './types.ts';
import { handleHealthRoute } from './routes/health.ts';
import { handleMenuRoute } from './routes/menu.ts';
import { handleRestaurantRoute } from './routes/restaurant.ts';
import {
  handleCreateReservation,
  handleGetReservationById,
  handleListReservations,
} from './routes/reservations.ts';

export interface RouteMatch {
  handler: (ctx: HttpRequestContext) => HttpResponseContext | Promise<HttpResponseContext>;
  params: Record<string, string>;
}

export function routeRequest(ctx: HttpRequestContext): HttpResponseContext | Promise<HttpResponseContext> {
  const method = ctx.method.toUpperCase();
  const rawPath = ctx.pathname;
  // Normalize pathname: remove trailing slash unless root
  const pathname = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;

  // 1. GET /api/health
  if (pathname === '/api/health') {
    if (method === 'GET') {
      return handleHealthRoute(ctx);
    }
    return {
      statusCode: 405,
      headers: {},
      body: { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } },
    };
  }

  // 2. GET /api/menu
  if (pathname === '/api/menu') {
    if (method === 'GET') {
      const res = handleMenuRoute(ctx);
      return { statusCode: res.statusCode, headers: {}, body: res.body };
    }
    return {
      statusCode: 405,
      headers: {},
      body: { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } },
    };
  }

  // 3. GET /api/restaurant
  if (pathname === '/api/restaurant') {
    if (method === 'GET') {
      const res = handleRestaurantRoute(ctx);
      return { statusCode: res.statusCode, headers: {}, body: res.body };
    }
    return {
      statusCode: 405,
      headers: {},
      body: { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } },
    };
  }

  // 4. /api/reservations or /api/reservations/:id
  if (pathname === '/api/reservations') {
    if (method === 'POST') {
      const res = handleCreateReservation(ctx);
      return { statusCode: res.statusCode, headers: {}, body: res.body };
    }
    if (method === 'GET') {
      const res = handleListReservations(ctx);
      return { statusCode: res.statusCode, headers: {}, body: res.body };
    }
    return {
      statusCode: 405,
      headers: {},
      body: { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } },
    };
  }

  const reservationIdMatch = pathname.match(/^\/api\/reservations\/([^/]+)$/);
  if (reservationIdMatch) {
    if (method === 'GET') {
      ctx.params.id = decodeURIComponent(reservationIdMatch[1]);
      const res = handleGetReservationById(ctx);
      return { statusCode: res.statusCode, headers: {}, body: res.body };
    }
    return {
      statusCode: 405,
      headers: {},
      body: { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } },
    };
  }

  // Fallback: 404 Not Found
  return {
    statusCode: 404,
    headers: {},
    body: {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${ctx.method} ${ctx.pathname} not found`,
      },
    },
  };
}
