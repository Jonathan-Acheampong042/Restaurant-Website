# REST API Reference — Ember & Olive

The Ember & Olive backend exposes a lightweight, standardized REST API served over HTTP.

- **Base URL**: `/api` (Default local development: `http://localhost:3001/api`)
- **Transport**: HTTP/1.1
- **Content-Type**: `application/json; charset=utf-8`
- **CORS**: Enabled for all origins (`*`) with automated preflight `OPTIONS` (HTTP 204 No Content) handling.

---

## 1. Global Response Envelope

All API endpoints (except `/api/health` which returns `{ status: "ok", timestamp: "..." }`) wrap payloads in the standardized `ApiResponse<T>` envelope:

### 1.1 Success Format
```json
{
  "success": true,
  "data": { ... }
}
```

### 1.2 Error Format
```json
{
  "success": false,
  "error": {
    "code": "STRING_ERROR_CODE",
    "message": "Human readable explanation",
    "details": {
      "field_name": "Specific validation failure explanation"
    }
  }
}
```

### 1.3 Standard Error Codes
| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_FAILED` | 400 Bad Request | Request payload failed field-level validation rules. |
| `INVALID_JSON` | 400 Bad Request | Request body contains malformed JSON. |
| `NOT_FOUND` | 404 Not Found | Requested route or reservation resource not found. |
| `METHOD_NOT_ALLOWED` | 405 Method Not Allowed | The requested HTTP method is unsupported on the resource. |
| `PAYLOAD_TOO_LARGE` | 413 Payload Too Large | Request body exceeds maximum size (1 MB limit). |
| `SERVER_ERROR` | 500 Internal Server Error | Internal server error (sanitized, internal details withheld). |

---

## 2. Endpoints

### 2.1 Health Check
Provides server liveness and uptime status.

- **Method**: `GET`
- **Path**: `/api/health`
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2026-10-20T00:39:30.647Z"
}
```

#### Example Request
```bash
curl -X GET http://localhost:3001/api/health
```

---

### 2.2 Get Restaurant Profile & Hours
Retrieves restaurant branding, physical address, phone, email, and scheduled dining service hours.

- **Method**: `GET`
- **Path**: `/api/restaurant`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "name": "Ember & Olive",
    "tagline": "Wood-Fired Mediterranean & Seasonal Cellar",
    "address": "418 Olive Way, Seattle, WA 98101",
    "phone": "(206) 555-0194",
    "email": "hospitality@emberandolive.com",
    "hours": {
      "lunch": {
        "days": "Tuesday - Sunday",
        "hours": "12:00 PM - 2:30 PM",
        "timeSlots": [
          "12:00",
          "12:30",
          "13:00",
          "13:30",
          "14:00",
          "14:30"
        ]
      },
      "dinner": {
        "days": "Tuesday - Sunday",
        "hours": "5:00 PM - 10:00 PM",
        "timeSlots": [
          "17:00",
          "17:30",
          "18:00",
          "18:30",
          "19:00",
          "19:30",
          "20:00",
          "20:30",
          "21:00",
          "21:30"
        ]
      }
    }
  }
}
```

#### Example Request
```bash
curl -X GET http://localhost:3001/api/restaurant
```

---

### 2.3 Get Menu
Retrieves all active menu categories and individual culinary items with dietary tags and prices.

- **Method**: `GET`
- **Path**: `/api/menu`
- **Query Parameters**:
  - `categoryId` *(optional, string)*: Filter dishes belonging to a specific category slug (`starters`, `mains`, `desserts`, `drinks`).
  - `availableOnly` *(optional, boolean)*: Set `true` to filter out 86'd / unavailable dishes.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "starters",
        "name": "Meze & Starters",
        "description": "Designed for sharing",
        "displayOrder": 1
      },
      {
        "id": "mains",
        "name": "Wood-Fired & Coastal Mains",
        "description": "Heirloom grains, local seafood, and wood-fired meats",
        "displayOrder": 2
      },
      {
        "id": "desserts",
        "name": "House Sweets & Pastries",
        "description": "Artisanal Mediterranean desserts and seasonal fruits",
        "displayOrder": 3
      },
      {
        "id": "drinks",
        "name": "Wine & Artisanal Cocktails",
        "description": "Curated Mediterranean cellar selections and craft beverages",
        "displayOrder": 4
      }
    ],
    "items": [
      {
        "id": "item-1",
        "categoryId": "starters",
        "name": "Smoked Eggplant Dip",
        "description": "Tahini, pomegranate seeds, grilled sourdough",
        "price": 14.0,
        "dietaryTags": ["V", "VG"],
        "displayOrder": 1,
        "isAvailable": true
      },
      {
        "id": "item-2",
        "categoryId": "starters",
        "name": "Charred Spanish Octopus",
        "description": "Fingerling potatoes, smoked paprika, caperberries",
        "price": 24.5,
        "dietaryTags": ["GF", "DF"],
        "displayOrder": 2,
        "isAvailable": true
      }
    ]
  }
}
```

#### Example Requests
```bash
# Get entire menu
curl -X GET http://localhost:3001/api/menu

# Filter by starters category
curl -X GET "http://localhost:3001/api/menu?categoryId=starters"
```

---

### 2.4 Create Reservation
Submits and persists a new table booking request.

- **Method**: `POST`
- **Path**: `/api/reservations`
- **Headers**: `Content-Type: application/json`
- **Request Body Fields**:
  - `customerName` *(string, required)*: Customer full name (2–100 characters).
  - `email` *(string, required)*: Valid RFC-compliant email address.
  - `phone` *(string, required)*: Contact phone number containing at least 7 digits.
  - `reservationDate` *(string, required)*: Date in `YYYY-MM-DD` format. Must be today or up to 90 days in the future.
  - `reservationTime` *(string, required)*: Time in `HH:mm` format matching active service time slots:
    - Lunch slots: `12:00`, `12:30`, `13:00`, `13:30`, `14:00`, `14:30`
    - Dinner slots: `17:00`, `17:30`, `18:00`, `18:30`, `19:00`, `19:30`, `20:00`, `20:30`, `21:00`, `21:30`
  - `partySize` *(integer, required)*: Number of guests between 1 and 12.
  - `specialRequest` *(string, optional)*: Dietary or seating requests (max 500 characters).

#### Request Example
```json
{
  "customerName": "Elena Vance",
  "email": "elena@example.com",
  "phone": "206-555-0182",
  "reservationDate": "2026-10-25",
  "reservationTime": "19:00",
  "partySize": 4,
  "specialRequest": "Anniversary celebration, window table preferred"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "res_8f7b2c91a03e",
    "customerName": "Elena Vance",
    "email": "elena@example.com",
    "phone": "206-555-0182",
    "reservationDate": "2026-10-25",
    "reservationTime": "19:00",
    "partySize": 4,
    "specialRequest": "Anniversary celebration, window table preferred",
    "status": "confirmed",
    "createdAt": "2026-10-20T00:40:00.000Z",
    "updatedAt": "2026-10-20T00:40:00.000Z"
  }
}
```

#### Validation Failure Response (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Reservation input failed validation",
    "details": {
      "email": "Invalid email address format",
      "reservationDate": "Reservation date cannot be in the past",
      "partySize": "Party size must be between 1 and 12 guests"
    }
  }
}
```

#### Example Request
```bash
curl -X POST http://localhost:3001/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Elena Vance",
    "email": "elena@example.com",
    "phone": "206-555-0182",
    "reservationDate": "2026-10-25",
    "reservationTime": "19:00",
    "partySize": 4,
    "specialRequest": "Anniversary celebration"
  }'
```

---

### 2.5 Get Reservation By ID
Retrieves an existing reservation by its unique identifier.

- **Method**: `GET`
- **Path**: `/api/reservations/:id`
- **Success Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "res_8f7b2c91a03e",
    "customerName": "Elena Vance",
    "email": "elena@example.com",
    "phone": "206-555-0182",
    "reservationDate": "2026-10-25",
    "reservationTime": "19:00",
    "partySize": 4,
    "specialRequest": "Anniversary celebration",
    "status": "confirmed",
    "createdAt": "2026-10-20T00:40:00.000Z",
    "updatedAt": "2026-10-20T00:40:00.000Z"
  }
}
```
- **Not Found Response**: `404 Not Found`
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Reservation with ID res_nonexistent not found"
  }
}
```

#### Example Request
```bash
curl -X GET http://localhost:3001/api/reservations/res_8f7b2c91a03e
```

---

### 2.6 List Reservations
Retrieves persisted reservations, supporting operational query filters.

- **Method**: `GET`
- **Path**: `/api/reservations`
- **Query Parameters**:
  - `date` *(optional, string)*: Filter reservations by `YYYY-MM-DD`.
  - `status` *(optional, string)*: Filter by status (`confirmed`, `cancelled`, `seated`).
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "res_8f7b2c91a03e",
      "customerName": "Elena Vance",
      "email": "elena@example.com",
      "phone": "206-555-0182",
      "reservationDate": "2026-10-25",
      "reservationTime": "19:00",
      "partySize": 4,
      "status": "confirmed",
      "createdAt": "2026-10-20T00:40:00.000Z",
      "updatedAt": "2026-10-20T00:40:00.000Z"
    }
  ]
}
```

#### Example Request
```bash
curl -X GET "http://localhost:3001/api/reservations?date=2026-10-25"
```
