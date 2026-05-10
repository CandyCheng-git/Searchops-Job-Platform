# API Contract

## Overview

SearchOps exposes a RESTful API for job search, filtering, and event tracking. All endpoints return JSON and support structured error responses.

## Base URL

```
http://localhost:5000/api
```

## Response Format

All successful responses return HTTP 200 with:
```json
{
  "data": {},
  "meta": {
    "timestamp": "2026-05-10T14:30:00Z",
    "requestId": "req_abc123"
  }
}
```

All error responses (4xx/5xx) return:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameter",
    "details": []
  },
  "meta": {
    "timestamp": "2026-05-10T14:30:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Endpoints

### 1. Search Jobs

**GET** `/jobs`

**Purpose:** Fetch jobs with optional filtering and pagination.

**Query Parameters:**

| Parameter | Type | Required | Default | Example |
|-----------|------|----------|---------|---------|
| `q` | string | No | (all jobs) | `python` |
| `location` | string | No | (all) | `San Francisco, CA` |
| `level` | enum | No | (all) | `junior\|mid\|senior` |
| `page` | integer | No | 1 | `2` |
| `limit` | integer | No | 20 | `50` |
| `sort` | enum | No | `recent` | `recent\|relevance` |

**Response:**
```json
{
  "data": {
    "jobs": [
      {
        "id": "job_123",
        "title": "Senior Backend Engineer",
        "company": "Acme Corp",
        "location": "San Francisco, CA",
        "level": "senior",
        "salary_min": 150000,
        "salary_max": 200000,
        "description": "We're hiring a backend engineer...",
        "posted_at": "2026-05-10T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 342,
      "pages": 18
    }
  },
  "meta": { ... }
}
```

**Example Request:**
```bash
curl "http://localhost:5000/api/jobs?q=python&level=senior&limit=10"
```

**Status Codes:**
- `200` — Success
- `400` — Invalid query parameters
- `500` — Server error

---

### 2. Get Job Detail

**GET** `/jobs/:id`

**Purpose:** Fetch a single job with full details.

**Path Parameters:**

| Parameter | Type | Example |
|-----------|------|---------|
| `id` | string | `job_123` |

**Response:**
```json
{
  "data": {
    "id": "job_123",
    "title": "Senior Backend Engineer",
    "company": "Acme Corp",
    "location": "San Francisco, CA",
    "level": "senior",
    "salary_min": 150000,
    "salary_max": 200000,
    "description": "Full job description...",
    "requirements": ["5+ years experience", "Node.js", "PostgreSQL"],
    "benefits": ["Health insurance", "401k", "Remote"],
    "posted_at": "2026-05-10T12:00:00Z",
    "expires_at": "2026-06-10T12:00:00Z"
  },
  "meta": { ... }
}
```

**Example Request:**
```bash
curl "http://localhost:5000/api/jobs/job_123"
```

**Status Codes:**
- `200` — Success
- `404` — Job not found
- `500` — Server error

---

### 3. Track Event

**POST** `/events`

**Purpose:** Track user actions (view, apply, conversion).

**Request Body:**
```json
{
  "event_type": "view|apply|conversion",
  "job_id": "job_123",
  "user_id": "optional_user_identifier",
  "experiment_variant": "control|treatment",
  "metadata": {
    "source": "search_results",
    "utm_source": "google"
  }
}
```

**Response:**
```json
{
  "data": {
    "event_id": "evt_456",
    "status": "recorded"
  },
  "meta": { ... }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "view",
    "job_id": "job_123",
    "experiment_variant": "control"
  }'
```

**Status Codes:**
- `200` — Event recorded
- `400` — Invalid event data
- `500` — Server error

---

### 4. Health Check

**GET** `/health`

**Purpose:** Verify backend and database connectivity.

**Response:**
```json
{
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-05-10T14:30:00Z",
    "uptime_seconds": 86400
  },
  "meta": { ... }
}
```

**Example Request:**
```bash
curl http://localhost:5000/api/health
```

**Status Codes:**
- `200` — Healthy
- `503` — Service unavailable (db down, etc.)

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid query/body parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate or invalid state |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
| `UNAVAILABLE` | 503 | Database or service down |

---

## Rate Limiting (Future)

```
Future versions will include:
- Rate limits: 100 requests/min per IP
- Header: X-RateLimit-Remaining
```

---

## Pagination

Default limit is 20 jobs; max 100. Use `page` and `limit` to navigate results.

```
/jobs?page=1&limit=20  // Items 1-20
/jobs?page=2&limit=20  // Items 21-40
```

---

## Authentication (Out of Scope v1)

No authentication required. All endpoints are public.
