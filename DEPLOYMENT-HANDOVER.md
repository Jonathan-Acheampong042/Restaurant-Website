# Deployment Handover — Ember & Olive

<!-- Platform-generated context artifact. Facet: deployment. -->

## 1. Requirements & Scope

- **Application**: Ember & Olive — Mediterranean Restaurant & Reservation Platform
- **Deployment Model**: Unified Node.js Web Server (Single-binary serving both REST API routes `/api/*` and compiled static frontend assets `dist/`)
- **Runtime**: Node.js v22.0.0+ (requires native `node:sqlite` and `--experimental-strip-types`)
- **Persistence Target**: SQLite (`data/restaurant.db`) mounted on a persistent volume
- **Target Network Ports**:
  - Internal: `3001` (configurable via `PORT`)
  - Binding: `0.0.0.0` (configurable via `HOST`)
- **Health Check Endpoint**: `/api/health` (HTTP 200 `{ "status": "ok", "timestamp": "..." }`)

---

## 2. Environment Variables

| Variable | Required | Default | Production Value | Description |
|---|---|---|---|---|
| `PORT` | No | `3001` | `3001` or platform port | Port for the HTTP server to listen on. |
| `HOST` | No | `0.0.0.0` | `0.0.0.0` | IP binding. Use `0.0.0.0` for Docker/cloud containers. |
| `DATABASE_URL` | No | `data/restaurant.db` | `/data/restaurant.db` | File path or sqlite:// URI to persistent SQLite database. |
| `NODE_ENV` | No | `development` | `production` | Node environment flag. |
| `VITE_API_BASE_URL` | No | `""` | `""` | Base API URL for frontend client. Leave blank for unified origin. |

---

## 3. Deployment Procedure

1. **Install Dependencies**:
   ```bash
   npm ci
   ```
2. **Build Static Frontend Bundle**:
   ```bash
   npm run build
   ```
   *Generates `dist/index.html` and bundled assets in `dist/assets/`.*
3. **Initialize Database & Run Migrations**:
   ```bash
   node --experimental-strip-types src/db/cli.ts init
   ```
   *Runs pending migrations from `migrations/` and seeds initial menu data.*
4. **Launch Server**:
   ```bash
   node --experimental-strip-types src/server/index.ts
   ```

---

## 4. Operational & Persistence Notes

- **Persistent Disk Storage**: The `data/` directory must be mapped to persistent storage (e.g., Docker volume, Fly.io volume, Kubernetes PVC, or Render persistent disk) to ensure customer reservations are retained across deployments or restarts.
- **Graceful Shutdown**: The process intercepts `SIGINT` and `SIGTERM` signals, closing connections cleanly before exit.
- **Monitoring**: Automated uptime checks can poll `GET /api/health` every 30 seconds.
