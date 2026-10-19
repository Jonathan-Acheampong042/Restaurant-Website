import type { IncomingMessage, ServerResponse } from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { URL } from 'node:url';
import type { HttpRequestContext } from './types.ts';
import { applyCorsHeaders, isPreflight } from './middleware/cors.ts';
import { parseJsonBody } from './middleware/json.ts';
import { handleServerError } from './middleware/errorHandler.ts';
import { routeRequest } from './router.ts';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function tryServeStatic(pathname: string, res: ServerResponse): boolean {
  const searchDirs = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(process.cwd(), '../frontend/public'),
  ];

  for (const root of searchDirs) {
    if (!fs.existsSync(root)) continue;

    let targetFile = path.resolve(root, pathname === '/' ? 'index.html' : pathname.replace(/^\//, ''));
    if (!targetFile.startsWith(root)) continue; // prevent path traversal

    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory()) {
      targetFile = path.join(targetFile, 'index.html');
    }

    if (!fs.existsSync(targetFile)) {
      // Fallback for SPA routing
      const indexHtml = path.join(root, 'index.html');
      if (fs.existsSync(indexHtml)) {
        targetFile = indexHtml;
      }
    }

    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
      const ext = path.extname(targetFile).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(targetFile);

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': content.length.toString(),
        'Access-Control-Allow-Origin': '*',
      });
      res.end(content);
      return true;
    }
  }

  return false;
}

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

  // If not an API route and static file found, serve static asset
  if (!parsedUrl.pathname.startsWith('/api') && method === 'GET') {
    if (tryServeStatic(parsedUrl.pathname, res)) {
      return;
    }
  }

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
