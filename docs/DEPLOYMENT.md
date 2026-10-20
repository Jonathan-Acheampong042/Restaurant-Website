# Production Deployment Guide — Ember & Olive

This document details the configuration, build steps, operational requirements, and deployment strategies for launching **Ember & Olive** into production.

---

## 1. Architectural Strategy for Deployment

Ember & Olive is designed for simplified, production-grade deployment as a unified Node.js application:

1. **Integrated Static & API Serving**:
   - The Node.js backend server (`src/server/index.ts`) serves both the REST API endpoints (`/api/*`) and static compiled frontend assets (`dist/`).
   - SPA fallback routes any non-API client requests to `dist/index.html`.
   - This eliminates the need for separate frontend and backend hosting or reverse-proxy routing rules unless desired for CDN edge distribution.
2. **Persistent Storage**:
   - The application uses SQLite (`data/restaurant.db`).
   - The `data/` directory must be mounted to a persistent volume (e.g. Fly.io persistent volume, Docker named volume, AWS EBS, Render persistent disk) so that reservation data survives container restarts and redeployments.
3. **Graceful Degraded Mode**:
   - If the database file is unavailable, the backend automatically switches to an in-memory stub to prevent total outage, though persistent storage is strongly recommended for production.

---

## 2. Environment Variables & Configuration

Configure the following environment variables in your deployment target:

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | number | `3001` | The network port on which the HTTP server listens. |
| `HOST` | string | `0.0.0.0` | The network interface binding. Use `0.0.0.0` for containers and cloud platforms. |
| `DATABASE_URL` | string | *(derived)* | Path or URI to the SQLite database file. Defaults to `data/restaurant.db` within the project root. |
| `NODE_ENV` | string | `production` | Set to `production` in production environments. |
| `VITE_API_BASE_URL` | string | `""` (relative) | Used during frontend build. Leave empty or `/` for unified single-server deployments; set to full origin URL if frontend is hosted on a separate domain. |

---

## 3. Step-by-Step Production Build & Launch

### Step 1: Clean Dependency Installation
Install production and build dependencies matching `package-lock.json`:
```bash
npm ci
```

### Step 2: Build Frontend Production Assets
Compile and bundle the React 19 frontend into optimized static files (`dist/`):
```bash
npm run build
```
Verification:
- Confirms `dist/index.html`, `dist/assets/*.js`, and `dist/assets/*.css` are generated.
- Production build outputs zero sourcemaps for security and bundle compactness.

### Step 3: Initialize Database & Run Migrations
Run the database CLI to apply schema migrations and seed initial Mediterranean menu data:
```bash
node --experimental-strip-types src/db/cli.ts init
```
Or to run only pending migrations on an existing database:
```bash
node --experimental-strip-types src/db/cli.ts migrate
```

### Step 4: Start the Production Server
Start the unified server:
```bash
node --experimental-strip-types src/server/index.ts
```

Output:
```text
[BACKEND DB] Connected to SQLite database at: /app/data/restaurant.db
[Ember & Olive Server] Backend API running at http://0.0.0.0:3001
[Ember & Olive Server] Health check: http://0.0.0.0:3001/api/health
[Ember & Olive Server] Menu API:     http://0.0.0.0:3001/api/menu
[Ember & Olive Server] Restaurant:   http://0.0.0.0:3001/api/restaurant
```

---

## 4. Container Deployment (Docker)

### Sample `Dockerfile`:
```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig*.json vite.config.ts index.html ./
COPY src/ ./src/
COPY types/ ./types/
COPY public/ ./public/

RUN npm ci
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY migrations/ ./migrations/
COPY db/ ./db/
COPY types/ ./types/
COPY src/ ./src/

# Create persistent storage volume mount point
RUN mkdir -p /app/data && chown -R node:node /app/data

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/api/health || exit 1

CMD ["sh", "-c", "node --experimental-strip-types src/db/cli.ts init && node --experimental-strip-types src/server/index.ts"]
```

---

## 5. Health Monitoring & Operational Verification

1. **Liveness Probe**:
   - Endpoint: `GET /api/health`
   - Expect: HTTP `200 OK` with JSON `{ "status": "ok", "timestamp": "..." }`.
2. **Readiness Probe**:
   - Endpoint: `GET /api/restaurant`
   - Expect: HTTP `200 OK` confirming database connection is responsive.
3. **Process Management**:
   - The server handles `SIGINT` and `SIGTERM` signals cleanly, stopping incoming HTTP connections before shutting down.
