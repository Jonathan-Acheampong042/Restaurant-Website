// Ember & Olive: Backend Server Entrypoint
// Express/Node.js Server per .team/CONTRACTS.md

import * as http from 'node:http';
import { app } from './app.ts';
import { getDbAdapter } from './db/adapter.ts';

export { app } from './app.ts';
export * from './types.ts';

export function createServer(): http.Server {
  return http.createServer(app);
}

export function startServer(port: number = Number(process.env.PORT) || 3001, host: string = process.env.HOST || '0.0.0.0'): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    // Initialize DB adapter
    getDbAdapter();

    const server = createServer();

    server.listen(port, host, () => {
      console.log(`[Ember & Olive Server] Backend API running at http://${host}:${port}`);
      console.log(`[Ember & Olive Server] Health check: http://${host}:${port}/api/health`);
      console.log(`[Ember & Olive Server] Menu API:     http://${host}:${port}/api/menu`);
      console.log(`[Ember & Olive Server] Restaurant:   http://${host}:${port}/api/restaurant`);
      resolve(server);
    });

    server.on('error', (err) => {
      console.error('[Ember & Olive Server] Startup error:', err);
      reject(err);
    });

    const shutdown = () => {
      console.log('\n[Ember & Olive Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Ember & Olive Server] Server stopped.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });
}

// Auto-start if invoked directly via CLI
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('index.ts') ||
  process.argv[1].endsWith('index.js') ||
  process.argv[1].endsWith('server.ts')
);

if (isDirectRun) {
  startServer().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}
