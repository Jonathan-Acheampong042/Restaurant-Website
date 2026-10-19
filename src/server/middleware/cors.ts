// Ember & Olive: CORS Middleware

export function applyCorsHeaders(headers: Record<string, string>): Record<string, string> {
  return {
    ...headers,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

export function isPreflight(method: string): boolean {
  return method.toUpperCase() === 'OPTIONS';
}
