# System Architecture — Ember & Olive

## 1. Overview & Vision

**Ember & Olive** is a modern Mediterranean restaurant web platform engineered for seasonal dining discovery, menu exploration, and automated table reservations. The system integrates a high-performance React 19 frontend with a lightweight Node.js/TypeScript backend and a persistent SQLite database layer.

The architecture emphasizes:
- **Contract-First Design**: Strict contracts defined in `.team/CONTRACTS.md` governing database schemas, shared TypeScript interfaces, and REST API payload envelopes.
- **Single-Binary / Unified Production Serving**: In production, the backend Node.js server serves both the REST API routes (`/api/*`) and static compiled frontend assets (`dist/`), eliminating CORS complexity and external reverse-proxy requirements for standard deployments.
- **Resilient Dual-Mode Data Access**: The backend database adapter supports native SQLite file-based persistence with an integrated in-memory fallback stub when operating in environments without local file access.
- **Accessibility & Performance First**: Built against WCAG 2.1 AA standards with token-driven design, zero client-side tracking, semantic HTML, and zero production sourcemap leakage.

---

## 2. Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Client Browser (React 19 SPA)"]
        UI[UI Components]
        Hero[Hero & Brand Story]
        Menu[Menu with Dietary Filters]
        ResForm[2-Step Reservation Form]
        RestInfo[Restaurant Info & Hours]
        ApiClient[Client API Service (src/client/api.ts)]
        MockData[Client Mock Fallback (src/client/mockData.ts)]

        UI --> Hero
        UI --> Menu
        UI --> ResForm
        UI --> RestInfo
        Hero & Menu & ResForm & RestInfo --> ApiClient
        ApiClient -.->|Offline Fallback| MockData
    end

    subgraph Server["Node.js HTTP Server (Port 3001)"]
        ReqHandler[HTTP Request Handler (src/server/app.ts)]
        CORS[CORS & Preflight Middleware]
        JSON[JSON Parser & Payload Guard]
        Static[Static Asset Server (dist/ & public/)]
        Router[API Router (src/server/router.ts)]
        ErrHandler[Error Envelope Handler]

        ReqHandler --> CORS
        CORS --> JSON
        JSON -->|GET non-/api| Static
        JSON -->|/api/*| Router
        Router --> ErrHandler
    end

    subgraph BackendAPI["Backend API Routes (src/server/routes/)"]
        HealthRoute["GET /api/health"]
        MenuRoute["GET /api/menu"]
        RestRoute["GET /api/restaurant"]
        ResRoutes["POST /api/reservations<br/>GET /api/reservations/:id<br/>GET /api/reservations"]
        Validation["Reservation Validator (src/server/validation/)"]

        Router --> HealthRoute
        Router --> MenuRoute
        Router --> RestRoute
        Router --> ResRoutes
        ResRoutes --> Validation
    end

    subgraph DataAccess["Data Access Layer"]
        Adapter["Database Adapter Factory (src/server/db/adapter.ts)"]
        SqliteAdapter["SqliteDbAdapter (DatabaseSync)"]
        StubAdapter["StubDbAdapter (In-Memory Fallback)"]
        DbRepo["Database Repositories (src/db/)"]

        Validation --> Adapter
        MenuRoute --> Adapter
        RestRoute --> Adapter
        ResRoutes --> Adapter
        Adapter -->|Default / Configured| SqliteAdapter
        Adapter -.->|Fallback| StubAdapter
        SqliteAdapter --> DbRepo
    end

    subgraph Storage["Persistent Storage"]
        SqliteDB[("SQLite Database<br/>data/restaurant.db")]
        Migrations["Migration Runner (src/db/migrate.ts)"]
        Seeds["Seed Runner (src/db/seed.ts)"]

        DbRepo --> SqliteDB
        Migrations --> SqliteDB
        Seeds --> SqliteDB
    end

    ApiClient -->|HTTP / JSON| ReqHandler
```

---

## 3. Subsystem Breakdown

### 3.1 Frontend (`src/client/`, `src/components/`, `src/styles/`)
- **Framework**: React 19 with Vite 6 build tooling.
- **State & Data Fetching**: Async hooks in `src/client/api.ts` with error boundaries and automatic fallback to `src/client/mockData.ts` if the backend server is unreachable.
- **Key Modules**:
  - `Navbar.tsx`: Sticky navigation with mobile menu drawer, skip-to-content accessibility link, and smooth section scrolling.
  - `Hero.tsx`: Brand positioning, primary reservation CTA, and secondary menu discovery link.
  - `StorySection.tsx`: Culinary heritage and seasonal sourcing philosophy.
  - `MenuSection.tsx`: Tabbed category browsing (`starters`, `mains`, `desserts`, `drinks`) with multi-tag dietary filtering (`V`, `VG`, `GF`, `DF`, `N`).
  - `ReservationSection.tsx`: 2-step booking workflow (party size, date picker, service time slot selection, customer contact info, dietary requests) with strict input validation, aria error descriptions, and confirmation states.
  - `RestaurantInfoSection.tsx`: Opening hours (lunch/dinner), physical address, interactive contact links, and location details.
  - `Footer.tsx`: Brand footer with copyright, navigation links, and operational hours.
  - `theme.css`: Design tokens for colors, typography, elevations, and responsive breakpoints.

### 3.2 Backend Server (`src/server/`)
- **Runtime**: Native Node.js HTTP server utilizing Node 22+ features (such as `--experimental-strip-types` for TypeScript execution without compilation overhead).
- **Middleware Pipeline**:
  - `cors.ts`: Permissive CORS origin headers with automatic preflight `OPTIONS` (204 No Content) handling.
  - `json.ts`: Safe streaming JSON body parser enforcing max payload limits (1MB) and intercepting malformed payloads before route handlers execute.
  - `errorHandler.ts`: Standardizes internal exceptions into safe `ApiResponse` error envelopes without leaking stack traces or internal environment variables.
- **Static File Serving**:
  - Serves built production assets directly from `dist/` and `public/`.
  - Implements Single Page Application (SPA) routing fallback by returning `dist/index.html` for client-side routes.
  - Includes path traversal protection preventing directory escapes.

### 3.3 Database Layer (`src/db/`, `migrations/`, `db/`)
- **Engine**: SQLite via Node.js native `DatabaseSync` (`node:sqlite`).
- **Persistence Path**: Default `data/restaurant.db` (configurable via `DATABASE_URL`).
- **Migration Engine** (`src/db/migrate.ts`):
  - Idempotent migration runner tracking applied migrations in `schema_migrations`.
  - Sequential execution:
    - `001_initial_schema.sql`: Creates `menu_categories`, `menu_items`, `reservations`, and `restaurant_info` tables.
    - `002_seed_data.sql`: Populates baseline Mediterranean menu items, categories, and business hours.
- **Repositories**:
  - `src/db/menu.ts`: Category and menu item CRUD with dietary filtering.
  - `src/db/reservations.ts`: Reservation creation, ID generation (`res_<crypto-hex>`), date-based querying, and status updates.
  - `src/db/restaurant.ts`: Restaurant profile and operational hours retrieval.
- **CLI Utility** (`src/db/cli.ts`):
  - Command-line interface providing `status`, `migrate`, `seed`, `reset`, and `init` actions.

---

## 4. Shared Contracts & Types (`types/shared.ts`)

All tiers adhere strictly to shared contract types:

```typescript
export type DietaryTag = 'V' | 'VG' | 'GF' | 'DF' | 'N';

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  dietaryTags: DietaryTag[];
  displayOrder: number;
  isAvailable: boolean;
}

export interface ReservationRequest {
  customerName: string;
  email: string;
  phone: string;
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:mm
  partySize: number;       // 1-12
  specialRequest?: string;
}

export interface Reservation extends ReservationRequest {
  id: string;
  status: 'confirmed' | 'cancelled' | 'seated';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
```

---

## 5. Security & Operational Characteristics

1. **Input Validation**: Both client-side and server-side validation enforce identical strict criteria (RFC email format, phone minimum digits, date range bounded between today and +90 days, allowable lunch/dinner service time slots, party size 1–12).
2. **SQL Injection Prevention**: All SQLite queries use parameterized prepared statements (`db.prepare(...)`).
3. **Information Disclosure Prevention**: Error handler strips runtime stack traces and internal database errors, emitting standardized codes (`VALIDATION_FAILED`, `NOT_FOUND`, `INVALID_JSON`, `SERVER_ERROR`).
4. **Static Security & Privacy**: Production builds disable sourcemaps, embed Schema.org `Restaurant` structured data, define `robots.txt`, `sitemap.xml`, and `llms.txt`.
