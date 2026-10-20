# Database Reference & Migrations — Ember & Olive

The Ember & Olive platform utilizes **SQLite** for lightweight, zero-dependency, file-backed relational persistence.

- **Engine**: SQLite via Node.js native `node:sqlite` (`DatabaseSync`).
- **Default Database Path**: `data/restaurant.db` (relative to project root).
- **Configuration**: Overridable via `DATABASE_URL` environment variable (e.g. `DATABASE_URL=sqlite:///path/to/custom.db`).
- **Fallback**: The backend adapter automatically falls back to an in-memory stub if the SQLite database is absent or uninitialized, ensuring graceful degraded operation.

---

## 1. Relational Schema Specification

### 1.1 `schema_migrations`
Tracks sequential migration execution.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Execution sequence |
| `name` | TEXT | NOT NULL UNIQUE | Migration file name (e.g. `001_initial_schema.sql`) |
| `applied_at` | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | ISO-8601 timestamp of execution |

---

### 1.2 `menu_categories`
Organizes menu items into structured dining categories.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique category slug (e.g. `starters`, `mains`, `desserts`, `drinks`) |
| `name` | TEXT | NOT NULL | Display title (e.g. "Meze & Starters") |
| `description` | TEXT | | Category narrative or subtitle |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 | Ordering index for UI presentation |
| `created_at` | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | ISO-8601 creation timestamp |

---

### 1.3 `menu_items`
Individual dishes and cellar beverage offerings.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique item identifier (e.g. `item-1`) |
| `category_id` | TEXT | NOT NULL, REFERENCES `menu_categories(id)` | Foreign key to parent category |
| `name` | TEXT | NOT NULL | Dish name (e.g. "Charred Spanish Octopus") |
| `description` | TEXT | NOT NULL | Ingredients, culinary preparation, and allergens |
| `price` | REAL | NOT NULL | Price in USD (e.g. `24.50`) |
| `dietary_tags` | TEXT | NOT NULL DEFAULT '[]' | JSON array string: `["V", "VG", "GF", "DF", "N"]` |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 | Display sequence within category |
| `is_available` | INTEGER | NOT NULL DEFAULT 1 | Boolean (1 = active on menu, 0 = 86'd) |
| `created_at` | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | ISO-8601 creation timestamp |

---

### 1.4 `reservations`
Customer dining reservations and table bookings.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Reservation identifier format: `res_<hex>` |
| `customer_name` | TEXT | NOT NULL | Guest full name (2–100 chars) |
| `email` | TEXT | NOT NULL | Guest contact email |
| `phone` | TEXT | NOT NULL | Guest phone number (min 7 digits) |
| `reservation_date` | TEXT | NOT NULL | Booking date `YYYY-MM-DD` |
| `reservation_time` | TEXT | NOT NULL | Booking service time slot `HH:mm` |
| `party_size` | INTEGER | NOT NULL | Guest count (1–12) |
| `special_request` | TEXT | | Optional dietary/seating request (max 500 chars) |
| `status` | TEXT | NOT NULL DEFAULT 'confirmed' | Status: `confirmed`, `cancelled`, `seated` |
| `created_at` | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | ISO-8601 booking timestamp |
| `updated_at` | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | ISO-8601 update timestamp |

---

### 1.5 `restaurant_info`
Singleton record containing core restaurant profile and operational hours.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Record ID (default: `'default'`) |
| `name` | TEXT | NOT NULL | Restaurant name: "Ember & Olive" |
| `tagline` | TEXT | NOT NULL | Brand positioning statement |
| `address` | TEXT | NOT NULL | Physical venue address |
| `phone` | TEXT | NOT NULL | Hospitality contact phone |
| `email` | TEXT | NOT NULL | Hospitality contact email |
| `hours_json` | TEXT | NOT NULL | JSON string encoding lunch/dinner hours and slots |

---

## 2. Migration Workflow

Migrations are stored in `migrations/` and executed sequentially in alphanumeric order:

1. `migrations/001_initial_schema.sql`: Creates all relational tables (`schema_migrations`, `menu_categories`, `menu_items`, `reservations`, `restaurant_info`).
2. `migrations/002_seed_data.sql`: Inserts baseline restaurant profile, 4 menu categories (`starters`, `mains`, `desserts`, `drinks`), and initial curated dishes.

### Idempotency
`src/db/migrate.ts` checks `schema_migrations` before running any migration. If a migration filename has already been recorded, it is skipped without error.

---

## 3. Database CLI (`src/db/cli.ts`)

The database management CLI provides operators and developers with direct database administration tools.

Execute via Node:
```bash
node --experimental-strip-types src/db/cli.ts [command]
```

### Supported Commands:
| Command | Description |
|---|---|
| `status` | Displays the target database path and lists all applied migrations. |
| `migrate` | Executes all pending migration files from `migrations/`. |
| `seed` | Populates database tables with default Mediterranean menu data and profile. |
| `reset` | Drops all application tables, resetting database state. |
| `init` | Performs a clean start: runs `reset`, executes all `migrate` scripts, and runs `seed`. |
| `help` | Displays command usage and help information. |

#### Example CLI Output:
```text
$ node --experimental-strip-types src/db/cli.ts init
[DB CLI] Target Database: C:\...\Restaurant-Website\data\restaurant.db
[DB CLI] Performing full clean initialization...
[DB CLI] Migrations applied: 001_initial_schema.sql, 002_seed_data.sql
[DB CLI] Database initialized and seeded successfully.
```

---

## 4. Testing & Verification

Automated database tests run using Node's native test runner (`node --test`):

```bash
node --test src/db/tests/migration.test.ts src/db/tests/menu.test.ts src/db/tests/reservations.test.ts src/db/tests/restaurant.test.ts src/db/tests/persistence.test.ts
```

Test coverage includes:
- **Migration Idempotency**: Running migrations twice produces zero errors.
- **Menu Operations**: Creating, querying, filtering by category and dietary tags.
- **Reservation Lifecycle**: Inserting bookings, querying by date, checking party size constraints.
- **File Persistence**: Verifies that closing the database connection and reopening a fresh connection retains all stored reservations.
