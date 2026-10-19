// Ember & Olive: Safe JSON Body Parser

import { IncomingMessage } from 'node:http';

export async function parseJsonBody(req: IncomingMessage, maxBytes: number = 1024 * 1024): Promise<{ body: any; error?: string }> {
  return new Promise((resolve) => {
    // Only parse body for methods that typically contain payloads
    const method = (req.method || '').toUpperCase();
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
      return resolve({ body: undefined });
    }

    const chunks: Buffer[] = [];
    let receivedBytes = 0;

    req.on('data', (chunk: Buffer) => {
      receivedBytes += chunk.length;
      if (receivedBytes > maxBytes) {
        req.destroy();
        return resolve({ body: null, error: 'PAYLOAD_TOO_LARGE' });
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        return resolve({ body: undefined });
      }

      const raw = Buffer.concat(chunks).toString('utf-8').trim();
      if (!raw) {
        return resolve({ body: undefined });
      }

      try {
        const parsed = JSON.parse(raw);
        return resolve({ body: parsed });
      } catch {
        return resolve({ body: null, error: 'INVALID_JSON' });
      }
    });

    req.on('error', () => {
      return resolve({ body: null, error: 'STREAM_ERROR' });
    });
  });
}
