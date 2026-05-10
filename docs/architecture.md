# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Public Internet                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
   │  Browser  │ │  Crawler  │ │   Mobile  │
   └────┬──────┘ └────┬──────┘ └────┬──────┘
        │              │              │
   ┌────▼──────────────▼──────────────▼────┐
   │     Next.js Frontend (port 3000)       │
   │  - Job listing page (SSR/SSG)          │
   │  - Job detail page (SSR + JSON-LD)     │
   │  - Event tracking client                │
   └────┬─────────────────────────────────┬─┘
        │                                 │
   ┌────▼─────────────────────────────┐   │
   │  Node.js/Express API (port 5000)  │   │
   │  ┌──────────────────────────────┐ │   │
   │  │ GET /api/jobs               │ │   │
   │  │ GET /api/jobs/:id           │ │   │
   │  │ POST /api/events            │ │   │
   │  │ GET /health                 │ │   │
   │  └──────────────────────────────┘ │   │
   │  ┌──────────────────────────────┐ │   │
   │  │ Middleware:                  │ │   │
   │  │ - Request logging            │ │   │
   │  │ - Error handling             │ │   │
   │  │ - Latency tracking           │ │   │
   │  │ - CORS                       │ │   │
   │  └──────────────────────────────┘ │   │
   └────┬─────────────────────────────┘   │
        │                                 │
   ┌────▼─────────────────────────────┐   │
   │    PostgreSQL Database            │   │
   │  ┌──────────────────────────────┐ │   │
   │  │ jobs, companies              │ │   │
   │  │ events, experiments          │ │   │
   │  └──────────────────────────────┘ │   │
   └──────────────────────────────────┘   │
                                          │
                      ┌───────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Google Search Console   │
        │   (SEO verification)      │
        └───────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 + React + TypeScript | SSR/SSG for SEO, type-safe components |
| **Backend** | Node.js + Express + TypeScript | REST API, structured logging, health checks |
| **Database** | PostgreSQL 15 | ACID transactions, job and event data |
| **ORM** | Prisma | Type-safe database queries |
| **Testing** | Vitest, Supertest, Playwright | Unit, integration, e2e coverage |
| **Containerization** | Docker Compose | Local dev and CI/CD parity |
| **CI/CD** | GitHub Actions | Automated testing and deployment |
| **Observability** | Structured logging (JSON) | Request/response tracing, latency metrics |

## Architectural Principles

### 1. **API-First Design**
- Backend exposes clean REST endpoints
- Frontend consumes via typed HTTP client
- Easy to extend with mobile/third-party clients

### 2. **SEO-Ready Public Pages**
- Job listing and job detail pages server-rendered
- Crawlable job pages with meta tags and canonical URLs
- JobPosting schema for search engines
- Sitemap and robots.txt

### 3. **Event-Driven Analytics**
- Client-side event tracking (view, apply, conversion)
- Events persisted for funnel analysis
- Foundation for A/B testing

### 4. **Observable from Day 1**
- Structured JSON logs on every request
- Request ID correlation across frontend/backend
- Latency tracking per endpoint
- Health check endpoint

### 5. **Test-Driven**
- Unit tests for business logic
- Integration tests for API contracts
- E2E tests for critical user flows
- >80% coverage on critical paths

## Deployment Model

```
Development: Docker Compose (frontend + backend + db)
  │
CI/CD Pipeline (GitHub Actions):
  ├─ Run tests
  ├─ Build Docker images
  ├─ Push to registry
  └─ Deploy to staging/production
```

## Data Flow: Job Search

```
1. User visits /jobs?query=python
2. Next.js fetches data via GET /api/jobs?query=python
3. Express validates query, logs request ID
4. Prisma queries PostgreSQL with index on query field
5. Results returned with 200ms latency (p95)
6. Next.js renders HTML + JSON-LD
7. Browser tracks pageview event to POST /api/events
8. Event stored for funnel analysis
```

## Scalability Considerations (Future)

- **Database:** Connection pooling via PgBouncer; read replicas for analytics
- **Frontend:** CDN for static assets; ISR (Incremental Static Regeneration) for job pages
- **Backend:** Horizontal scaling via load balancer; cache layer (Redis) for hot queries
- **Events:** Event streaming (Kafka) for real-time analytics

## Key Constraints (Version 1)

- **Single region:** No geographic distribution yet
- **Public data only:** No authentication/authorization
- **Synchronous API:** No async job processing
- **In-memory session:** No persistent sessions
