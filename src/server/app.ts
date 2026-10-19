// Ember & Olive: Application Request Listener & Middleware Pipeline
// Provides an Express-compatible (req, res) handler and native Node.js HTTP listener

import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import type { HttpRequestContext } from './types.ts';
import { applyCorsHeaders, isPreflight } from './middleware/cors.ts';
import { parseJsonBody } from './middleware/json.ts';
import { handleServerError } from './middleware/errorHandler.ts';
import { routeRequest } from './router.ts';

export async function app(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const method = (req.method || 'GET').toUpperCase();
  const host = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url || '/', `http://${host}`);

  // Base CORS headers
  const baseHeaders = applyCorsHeaders({
    'Content-Type': 'application/json; charset=utf-8',
  });

  // Handle CORS preflight OPTIONS
  if (isPreflight(method)) {
    res.writeHead(204, applyCorsHeaders({}));
    res.end();
    return;
  }

  // Parse JSON Body for mutating requests
  const { body, error: bodyError } = await parseJsonBody(req);
  if (bodyError === 'INVALID_JSON') {
    res.writeHead(400, baseHeaders);
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Malformed JSON in request body',
        },
      })
    );
    return;
  }
  if (bodyError === 'PAYLOAD_TOO_LARGE') {
    res.writeHead(413, baseHeaders);
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload exceeded maximum size',
        },
      })
    );
    return;
  }

  // Construct request context
  const queryParams: Record<string, string> = {};
  parsedUrl.searchParams.forEach((val, key) => {
    queryParams[key] = val;
  });

  const ctx: HttpRequestContext = {
    method,
    url: req.url || '/',
    pathname: parsedUrl.pathname,
    params: {},
    query: queryParams,
    headers: req.headers,
    body,
  };

  try {
    const result = await routeRequest(ctx);
    const finalHeaders = {
      ...baseHeaders,
      ...(result.headers || {}),
    };

    const responseBodyStr = typeof result.body === 'string' ? result.body : JSON.stringify(result.body);
    finalHeaders['Content-Length'] = Buffer.byteLength(responseBodyStr).toString();

    res.writeHead(result.statusCode, finalHeaders);
    res.end(responseBodyStr);
  } catch (error) {
    const errorResponse = handleServerError(error);
    const payload = JSON.stringify(errorResponse.body);
    res.writeHead(errorResponse.statusCode, {
      ...baseHeaders,
      'Content-Length': Buffer.byteLength(payload).toString(),
    });
    res.end(payload);
  }
}
