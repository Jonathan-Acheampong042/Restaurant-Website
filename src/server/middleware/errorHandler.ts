// Ember & Olive: Secure Error Handler Middleware
// Ensures no internal stack traces, DB errors, or secrets leak to the client

import type { ApiResponse } from '../types.ts';

export function handleServerError(error: unknown): {
  statusCode: number;
  body: ApiResponse<never>;
} {
  // Log full error details to server console for debugging
  console.error('[SERVER ERROR]', error);

  // Return clean, sanitized error response
  return {
    statusCode: 500,
    body: {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected server error occurred',
      },
    },
  };
}
