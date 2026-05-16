# API Contract

## Overview

SearchOps exposes a small REST API for job discovery, job detail pages, event tracking, analytics, and platform health checks.

The API is intentionally scoped for a portfolio MVP. Version 1 focuses on search-ready job data, conversion/event tracking, and lightweight experimentation. Authentication, admin workflows, resume parsing, and AI recommendations are intentionally out of scope.

---

## API Boundaries

SearchOps uses two URL groups:

| Area | Base URL | Purpose |
|---|---:|---|
| Infrastructure | `http://localhost:5000` | Health and platform-level checks |
| Product API | `http://localhost:5000/api` | Jobs, events, analytics, and future product endpoints |

Current Phase 1 implementation includes:

```http
GET /health
```

Future product endpoints should be mounted under `/api`.

---

## Version 1 Endpoint Summary

| Endpoint | Status | Purpose |
|---|---|---|
| `GET /health` | Implemented in Phase 1 | Verify the backend service is running |
| `GET /api/jobs` | Implemented in Phase 3 | List, search, filter, sort, and paginate jobs |
| `GET /api/jobs/:slug` | Implemented in Phase 3 | Fetch one job by SEO-friendly slug |
| `POST /api/events` | Planned for Phase 5 | Track job views, apply clicks, search, and filter events |
| `GET /api/analytics/summary` | Planned for Phase 5 | Return basic product analytics and conversion metrics |
| `GET /metrics` | Planned for Phase 6 | Return operational metrics for observability |

---

## Response Format

### Product API success response

Product API endpoints under `/api` should return a consistent JSON envelope:

```json
{
  "data": {},
  "meta": {
    "timestamp": "2026-05-11T06:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

### Product API error response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameter",
    "details": []
  },
  "meta": {
    "timestamp": "2026-05-11T06:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

### Infrastructure health response

The existing Phase 1 health endpoint is infrastructure-level and does not use the `/api` prefix:

```json
{
  "data": {
    "status": "ok"
  },
  "meta": {
    "timestamp": "2026-05-11T06:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

A later observability phase may extend `/health` with database connectivity and uptime information, but Phase 2 should not change the health endpoint unless required by tests.

---

## Error Codes

| Code | HTTP | Description |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Invalid query string, path parameter, or request body |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `CONFLICT` | 409 | Duplicate or conflicting state |
| `INTERNAL_ERROR` | 500 | Unhandled application error |
| `UNAVAILABLE` | 503 | Database or dependent service unavailable |

---

# Endpoints

## 1. Health Check

```http
GET /health
```

### Purpose

Verify that the backend service is running.

This endpoint is infrastructure-level and does not use the `/api` prefix.

### Current response

```json
{
  "data": {
    "status": "ok"
  },
  "meta": {
    "timestamp": "2026-05-11T06:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

### Future Phase 6 response option

When database health checks are added, this endpoint may evolve to:

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-05-11T06:30:00.000Z",
  "uptimeSeconds": 86400
}
```

### Status codes

| HTTP | Meaning |
|---:|---|
| 200 | Service is running |
| 503 | Service or database is unavailable |

### Example

```bash
curl http://localhost:5000/health
```

---

## 2. List and Search Jobs

```http
GET /api/jobs
```

### Status

Implemented in Phase 3.

### Purpose

Return a paginated list of jobs with optional keyword search and filters.

This endpoint supports the main job listing page and later search/filter demos.

### Query parameters

| Parameter | Type | Required | Default | Example | Notes |
|---|---|---:|---|---|---|
| `q` | string | No | all jobs | `backend` | Keyword search across title, description, location, company name, and company slug |
| `keyword` | string | No | all jobs | `backend` | Optional alias for `q`; `q` wins when both are provided |
| `location` | string | No | all locations | `Melbourne` | Exact or partial match depending on implementation |
| `category` | enum | No | all categories | `SOFTWARE_ENGINEERING` | Uses `JobCategory` enum |
| `workMode` | enum | No | all work modes | `HYBRID` | Uses `WorkMode` enum |
| `employmentType` | enum | No | all employment types | `FULL_TIME` | Uses `EmploymentType` enum |
| `company` | string | No | all companies | `seek` | Company slug or company name search |
| `salaryMin` | integer | No | no lower bound | `90000` | Minimum acceptable salary in AUD |
| `salaryMax` | integer | No | no upper bound | `140000` | Maximum salary filter in AUD |
| `page` | integer | No | `1` | `2` | Must be `>= 1` |
| `limit` | integer | No | `20` | `10` | Maximum should be capped, recommended cap: `100` |
| `sort` | enum | No | `recent` | `recent` | Recommended values: `recent`, `salary_desc`, `salary_asc` |

### Enum values

```txt
WorkMode: ONSITE | HYBRID | REMOTE
EmploymentType: FULL_TIME | PART_TIME | CONTRACT | CASUAL | INTERNSHIP
JobCategory: SOFTWARE_ENGINEERING | DATA_ANALYTICS | CLOUD_DEVOPS | PRODUCT | DESIGN | CYBERSECURITY
```

### Example request

```bash
curl "http://localhost:5000/api/jobs?q=backend&location=Melbourne&workMode=HYBRID&category=SOFTWARE_ENGINEERING&page=1&limit=10"
```

### Success response

```json
{
  "data": {
    "jobs": [
      {
        "id": "clxjob001",
        "title": "Backend Software Engineer",
        "slug": "backend-software-engineer-melbourne-cloudhire",
        "company": {
          "id": "clxcompany001",
          "name": "CloudHire",
          "slug": "cloudhire",
          "websiteUrl": "https://example.com/cloudhire"
        },
        "location": "Melbourne, VIC",
        "category": "SOFTWARE_ENGINEERING",
        "workMode": "HYBRID",
        "employmentType": "FULL_TIME",
        "salaryMin": 95000,
        "salaryMax": 125000,
        "datePosted": "2026-05-01T00:00:00.000Z",
        "validThrough": "2026-06-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 20,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "meta": {
    "timestamp": "2026-05-11T06:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

### Status codes

| HTTP | Meaning |
|---:|---|
| 200 | Jobs returned successfully |
| 400 | Invalid query parameter |
| 500 | Server error |

### Validation rules

- `page` must be a positive integer.
- `limit` must be a positive integer and should be capped at `100`.
- `salaryMin` and `salaryMax` must be positive integers when provided.
- `salaryMax` must be greater than or equal to `salaryMin` when both are provided.
- `q` and `keyword` are trimmed; empty values behave the same as no keyword search.
- Enum filters must match the Prisma enum values exactly unless a mapping layer is implemented.

### Search and salary behaviour

- Keyword search uses case-insensitive `contains` matching across job title, job description, location, company name, and company slug.
- The default sort is `recent`, which orders by `datePosted` descending.
- `salaryMin` returns jobs whose `salaryMax` is greater than or equal to the requested minimum.
- `salaryMax` returns jobs whose `salaryMin` is less than or equal to the requested maximum.
- Jobs with nullable salary values are included only when no salary filter is applied.

---

## 3. Get Job Detail

```http
GET /api/jobs/:slug
```

### Status

Implemented in Phase 3.

### Purpose

Fetch a single job by SEO-friendly slug.

Use `slug`, not `id`, because the frontend job detail pages should later support crawlable URLs such as:

```txt
/jobs/backend-software-engineer-melbourne-cloudhire
```

### Path parameters

| Parameter | Type | Required | Example |
|---|---|---:|---|
| `slug` | string | Yes | `backend-software-engineer-melbourne-cloudhire` |

### Example request

```bash
curl "http://localhost:5000/api/jobs/backend-software-engineer-melbourne-cloudhire"
```

### Success response

```json
{
  "data": {
    "id": "clxjob001",
    "title": "Backend Software Engineer",
    "slug": "backend-software-engineer-melbourne-cloudhire",
    "description": "Build and maintain backend services for a search-focused job platform...",
    "location": "Melbourne, VIC",
    "category": "SOFTWARE_ENGINEERING",
    "workMode": "HYBRID",
    "employmentType": "FULL_TIME",
    "salaryMin": 95000,
    "salaryMax": 125000,
    "datePosted": "2026-05-01T00:00:00.000Z",
    "validThrough": "2026-06-01T00:00:00.000Z",
    "company": {
      "id": "clxcompany001",
      "name": "CloudHire",
      "slug": "cloudhire",
      "websiteUrl": "https://example.com/cloudhire"
    }
  },
  "meta": {
    "timestamp": "2026-05-11T06:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

### Status codes

| HTTP | Meaning |
|---:|---|
| 200 | Job found |
| 404 | Job slug not found |
| 500 | Server error |

---

## 4. Track Event

```http
POST /api/events
```

### Status

Planned for Phase 5. Do not implement during Phase 2.

### Purpose

Track product behaviour for search, filtering, job views, and apply clicks.

This endpoint supports later analytics and A/B testing.

### Request body

```json
{
  "eventType": "JOB_VIEW",
  "jobId": "clxjob001",
  "variant": "A",
  "searchTerm": null
}
```

### Fields

| Field | Type | Required | Nullable | Notes |
|---|---|---:|---:|---|
| `eventType` | enum | Yes | No | `JOB_VIEW`, `APPLY_CLICK`, `SEARCH_PERFORMED`, `FILTER_USED` |
| `jobId` | string | No | Yes | Required for job-specific events; nullable for search/filter events |
| `variant` | enum | No | Yes | Uses `ExperimentVariant`: `A` or `B` |
| `searchTerm` | string | No | Yes | Used for search analytics |

### Event type guidance

| Event type | Required fields | Example use |
|---|---|---|
| `JOB_VIEW` | `jobId` | User opens a job detail page |
| `APPLY_CLICK` | `jobId`, optional `variant` | User clicks the apply CTA |
| `SEARCH_PERFORMED` | optional `searchTerm` | User performs keyword search |
| `FILTER_USED` | optional `searchTerm` | User changes a search filter |

### Success response

```json
{
  "data": {
    "eventId": "clxevent001",
    "status": "recorded"
  },
  "meta": {
    "timestamp": "2026-05-11T06:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

### Status codes

| HTTP | Meaning |
|---:|---|
| 201 | Event recorded |
| 400 | Invalid event body |
| 404 | Referenced job does not exist |
| 500 | Server error |

---

## 5. Analytics Summary

```http
GET /api/analytics/summary
```

### Status

Planned for Phase 5. Do not implement during Phase 2.

### Purpose

Return lightweight product analytics for portfolio demonstration.

This should stay small. Do not build a complex analytics platform in version 1.

### Example response

```json
{
  "data": {
    "totalJobViews": 120,
    "totalApplyClicks": 18,
    "applyClickThroughRate": 0.15,
    "topSearchedKeywords": [
      {
        "searchTerm": "backend",
        "count": 12
      },
      {
        "searchTerm": "data analyst",
        "count": 9
      }
    ],
    "mostViewedJobs": [
      {
        "jobId": "clxjob001",
        "title": "Backend Software Engineer",
        "slug": "backend-software-engineer-melbourne-cloudhire",
        "views": 32
      }
    ],
    "conversionByVariant": [
      {
        "variant": "A",
        "views": 60,
        "applyClicks": 8,
        "clickThroughRate": 0.1333
      },
      {
        "variant": "B",
        "views": 60,
        "applyClicks": 10,
        "clickThroughRate": 0.1667
      }
    ]
  },
  "meta": {
    "timestamp": "2026-05-11T06:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

### Status codes

| HTTP | Meaning |
|---:|---|
| 200 | Analytics returned successfully |
| 500 | Server error |

---

## 6. Metrics

```http
GET /metrics
```

### Status

Planned for Phase 6. Do not implement during Phase 2.

### Purpose

Expose operational metrics for observability.

This endpoint is platform-level, not a product API endpoint, so it does not use the `/api` prefix.

### Recommended metrics

- request count
- error count
- request duration summary or histogram
- route-level latency
- search latency signal

### Example response format

The exact format can be decided in Phase 6. A Prometheus-style text response is acceptable for a small portfolio project.

```txt
http_requests_total{method="GET",route="/api/jobs",status="200"} 42
http_request_duration_ms_count{route="/api/jobs"} 42
http_errors_total{route="/api/jobs"} 1
```

---

## Pagination Standard

List endpoints should use this structure:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Rules:

- Default `page`: `1`
- Default `limit`: `20`
- Recommended maximum `limit`: `100`
- Empty result sets should return `200` with an empty array, not `404`.

---

## Sorting Standard

Initial supported sort values:

| Sort value | Meaning |
|---|---|
| `recent` | Newest `datePosted` first |
| `salary_desc` | Highest salary first |
| `salary_asc` | Lowest salary first |

Search relevance sorting can be added later after the query strategy is implemented. Do not fake relevance sorting before there is real logic behind it.

---

## Naming Standard

Use camelCase in JSON responses and request bodies because the backend and frontend are TypeScript-based.

Examples:

```json
{
  "salaryMin": 95000,
  "salaryMax": 125000,
  "datePosted": "2026-05-01T00:00:00.000Z",
  "validThrough": "2026-06-01T00:00:00.000Z"
}
```

Avoid mixing snake_case and camelCase in API responses.

---

## Authentication

Authentication is out of scope for version 1.

All planned version 1 endpoints are public or local-development endpoints.

---

## Rate Limiting

Rate limiting is out of scope for version 1.

A future production version could add:

- request limits per IP
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Historical Phase 2 Reminder

During Phase 2, only Prisma schema, migrations, seed data, and database integration tests should be implemented.

Phase 3 has now implemented `/api/jobs` and `/api/jobs/:slug`. `/api/events`, `/api/analytics/summary`, and `/metrics` remain out of scope until later phases.
