// Ember & Olive: Reservations Route Handlers
// POST /api/reservations, GET /api/reservations/:id, GET /api/reservations
// per .team/CONTRACTS.md Section 4.3 & 4.4

import type { HttpRequestContext, ApiResponse, Reservation } from '../types.ts';
import { validateReservationRequest } from '../validation/reservation.ts';
import { getDbAdapter } from '../db/adapter.ts';

/**
 * POST /api/reservations
 * Creates and persists a new validated reservation
 */
export function handleCreateReservation(ctx: HttpRequestContext): {
  statusCode: number;
  body: ApiResponse<Reservation>;
} {
  const validation = validateReservationRequest(ctx.body);

  if (!validation.isValid || !validation.data) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Reservation input failed validation',
          details: validation.errors,
        },
      },
    };
  }

  const db = getDbAdapter();
  try {
    const created = db.createReservation(validation.data);
    return {
      statusCode: 201,
      body: {
        success: true,
        data: created,
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: {
        success: false,
        error: {
          code: 'PERSISTENCE_ERROR',
          message: 'Unable to persist reservation at this time',
        },
      },
    };
  }
}

/**
 * GET /api/reservations/:id
 * Retrieves a reservation by unique ID
 */
export function handleGetReservationById(ctx: HttpRequestContext): {
  statusCode: number;
  body: ApiResponse<Reservation>;
} {
  const id = ctx.params.id;
  if (!id) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Reservation ID is required',
        },
      },
    };
  }

  const db = getDbAdapter();
  const reservation = db.getReservationById(id);

  if (!reservation) {
    return {
      statusCode: 404,
      body: {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Reservation not found',
        },
      },
    };
  }

  return {
    statusCode: 200,
    body: {
      success: true,
      data: reservation,
    },
  };
}

/**
 * GET /api/reservations
 * Lists reservations with optional date and status filters
 */
export function handleListReservations(ctx: HttpRequestContext): {
  statusCode: number;
  body: ApiResponse<Reservation[]>;
} {
  const db = getDbAdapter();
  const filters: { date?: string; status?: string } = {};

  if (ctx.query.date) {
    filters.date = ctx.query.date;
  }
  if (ctx.query.status) {
    filters.status = ctx.query.status;
  }

  const reservations = db.listReservations(filters);

  return {
    statusCode: 200,
    body: {
      success: true,
      data: reservations,
    },
  };
}
