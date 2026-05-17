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
   │  - Job listing page (SSR)              │
   │  - Job detail page (SSR + JSON-LD)     │
   │  - sitemap.xml and robots.txt           │
   └────┬─────────────────────────────────┬─┘
        │                                 │
   ┌────▼─────────────────────────────┐   │
   │  Node.js/Express API (port 5000)  │   │
   │  ┌──────────────────────────────┐ │   │
   │  │ GET /api/jobs               │ │   │
   │  │ GET /api/jobs/:slug         │ │   │
   │  │ POST /api/events (planned)  │ │   │
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
| **Frontend** | Next.js App Router + React + TypeScript | Server-rendered SEO pages, type-safe components |
| **Backend** | Node.js + Express + TypeScript | REST API, structured logging, health checks |
| **Database** | PostgreSQL 15 | ACID transactions, job and event data |
| **ORM** | Prisma | Type-safe database queries |
| **Testing** | Vitest, React Testing Library, Supertest | Frontend rendering, unit, and integration coverage |
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

### 3. **Analytics as a Future Boundary**
- Event tracking is planned for a later phase
- Phase 4 public pages do not send analytics or A/B testing events
- Backend event tables remain unused by the frontend in this phase

### 4. **Operational Basics First**
- Health check endpoint on the backend
- Docker Compose local workflow for repeatable verification
- Metrics and expanded observability are planned for a later phase

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
1. User visits /jobs?q=python
2. Next.js fetches data via GET /api/jobs?q=python
3. Express validates query, logs request ID
4. Prisma queries PostgreSQL using the Phase 3 job service filters
5. Results return in the standard product API envelope
6. Next.js renders meaningful HTML for the listing page
```

## Data Flow: Job Detail

```
1. User or crawler visits /jobs/backend-software-engineer-melbourne-seek
2. Next.js fetches data via GET /api/jobs/backend-software-engineer-melbourne-seek
3. Express returns the matching job by slug
4. Next.js renders the job detail HTML
5. Next.js injects title, meta description, canonical URL, Open Graph metadata, and JobPosting JSON-LD
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
