// Ember & Olive: Health Route Handler
// GET /api/health per .team/CONTRACTS.md Section 4.1

import type { HttpRequestContext } from '../types.ts';

export function handleHealthRoute(ctx: HttpRequestContext) {
  return {
    statusCode: 200,
    body: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  };
}
