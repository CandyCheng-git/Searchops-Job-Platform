# SearchOps Job Platform

A cloud-native TypeScript project demonstrating how public job pages can be built for search visibility, conversion tracking, testability, and platform reliability.

## Project Status

- Phase 1 complete: backend bootstrap with Docker local environment and `GET /health`.
- Phase 2 complete: Prisma schema, persisted migrations, seed data, and direct database integration tests.
- Phase 3 complete: public job listing, search/filtering, sorting, pagination, and job detail APIs under `/api`.
- Phase 4 complete: Next.js App Router frontend with crawlable public job listing/detail pages, SEO metadata, JobPosting JSON-LD, `sitemap.xml`, and `robots.txt`.

Phase 4 does not include event tracking, analytics endpoints, authentication, dashboards, metrics, observability, or A/B testing logic.

## Tech Stack

- Backend: Node.js, Express, TypeScript
- Frontend: Next.js App Router, React, TypeScript
- Database: PostgreSQL, Prisma
- Testing: Vitest, React Testing Library, Supertest
- Local workflow: Docker Compose only

## Local Development

Docker is the supported local workflow. Do not run npm or Prisma commands on the host machine for normal project setup.

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Build the backend and frontend images:

```bash
docker compose build backend frontend
```

Format and generate Prisma inside Docker:

```bash
docker compose run --rm backend sh -lc "npx prisma format"
docker compose run --rm backend sh -lc "npx prisma generate"
```

Apply existing persisted migrations:

```bash
docker compose run --rm backend sh -lc "npx prisma migrate deploy"
```

Seed the development database:

```bash
docker compose run --rm backend sh -lc "npx prisma db seed"
```

Run backend tests and build:

```bash
docker compose run --rm backend sh -lc "npm test"
docker compose run --rm backend sh -lc "npm run build"
docker compose run --rm backend sh -lc "npm run lint"
```

Run frontend tests, build, and lint:

```bash
docker compose run --rm frontend sh -lc "npm test"
docker compose run --rm frontend sh -lc "npm run build"
docker compose run --rm frontend sh -lc "npm run lint"
```

Start the full stack:

```bash
docker compose up --build
```

The API runs on `http://localhost:5000`.
The frontend runs on `http://localhost:3000`.

## Frontend Configuration

The frontend reads these environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `BACKEND_API_URL` | `http://localhost:5000` | Backend origin used for server-side API fetches |
| `FRONTEND_SITE_URL` | `http://localhost:3000` | Absolute site origin used for canonical URLs, Open Graph URLs, sitemap URLs, and robots.txt |

Inside Docker Compose, the frontend uses `BACKEND_API_URL=http://backend:5000` and exposes port `3000`.

## Frontend Pages

Current public frontend routes:

```txt
GET /jobs
GET /jobs/[slug]
GET /sitemap.xml
GET /robots.txt
```

The frontend uses the existing backend API only:

```txt
GET /api/jobs
GET /api/jobs/:slug
```

There is no `/api/jobs/search` endpoint.

## Migration Persistence

Migrations are committed under `backend/prisma/migrations`.

If a fresh repo state has no migration yet, create the first migration through Docker with a bind mount so generated files are persisted to the host:

```bash
docker compose run --rm -v "$PWD/backend/prisma:/app/prisma" backend sh -lc "npx prisma migrate dev --name init_job_platform_schema --skip-seed"
```

Do not create migrations only inside a disposable container.

## Database Seed Data

The Phase 2 seed script is `backend/prisma/seed.ts`. It resets dependent records in a safe order and inserts realistic Australian demo data:

- 6 companies
- 22 jobs
- locations across Melbourne, Sydney, Brisbane, and Remote Australia
- onsite, hybrid, and remote roles
- software engineering, data analytics, cloud/devops, cybersecurity, product, and design categories
- full-time, contract, internship, and part-time employment types
- realistic AUD salary ranges

## Tests

Run the test suite through Docker:

```bash
docker compose run --rm backend sh -lc "npm test"
```

The current test suite includes:

- existing `GET /health` tests
- Phase 2 Prisma integration tests that use the Docker PostgreSQL database directly
- Phase 3 unit tests for job query validation, pagination, sorting, and Prisma filter construction
- Phase 3 Supertest API integration tests for `GET /api/jobs` and `GET /api/jobs/:slug`
- Phase 4 frontend tests for listing rendering, detail rendering, JobPosting JSON-LD, canonical metadata, sitemap output, and robots.txt output

The project does not introduce a separate test database yet. These are local development integration tests against the Docker Compose PostgreSQL service.

## API Endpoints

Current infrastructure endpoint:

```http
GET /health
```

Current response shape:

```json
{
  "data": {
    "status": "ok"
  },
  "meta": {
    "timestamp": "2026-05-11T00:00:00.000Z",
    "requestId": "req_abc123"
  }
}
```

Current product API endpoints are mounted under `/api`:

```http
GET /api/jobs
GET /api/jobs/:slug
```

Future planned product APIs:

- `POST /api/events`
- `GET /api/analytics/summary`

Events, analytics, metrics, authentication, dashboards, and A/B testing remain out of scope for Phase 4.

## Phase 3 Job API Examples

Start the API after migrating and seeding the database:

```bash
docker compose up backend
```

List jobs:

```bash
curl "http://localhost:5000/api/jobs"
```

Search jobs:

```bash
curl "http://localhost:5000/api/jobs?q=backend"
```

Filter jobs by location and work mode:

```bash
curl "http://localhost:5000/api/jobs?location=Melbourne&workMode=HYBRID"
```

Filter jobs by company and salary range:

```bash
curl "http://localhost:5000/api/jobs?company=seek&salaryMin=120000"
```

Get a job by SEO-friendly slug:

```bash
curl "http://localhost:5000/api/jobs/backend-software-engineer-melbourne-seek"
```

## Phase 4 Frontend Examples

After migrating and seeding the database, start the full stack:

```bash
docker compose up --build
```

Smoke-test URLs:

```bash
curl http://localhost:5000/health
curl "http://localhost:5000/api/jobs?limit=3"
curl http://localhost:3000/jobs
curl http://localhost:3000/jobs/backend-software-engineer-melbourne-seek
curl http://localhost:3000/sitemap.xml
curl http://localhost:3000/robots.txt
```

SEO checks for a rendered job detail page:

```bash
html=$(curl -s http://localhost:3000/jobs/backend-software-engineer-melbourne-seek)
echo "$html" | grep -i "Backend Software Engineer"
echo "$html" | grep -i "application/ld+json"
echo "$html" | grep -i "canonical"
echo "$html" | grep -i "og:title"
echo "$html" | grep -i "JobPosting"
echo "$html" | grep -i "AUD"
```

## Useful Docker Commands

```bash
docker compose up -d postgres
docker compose up backend
docker compose up frontend
docker compose up --build
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose down
docker compose down -v
```

`docker compose down -v` removes the PostgreSQL volume and clears local database state.

## Documentation

- [Product Brief](docs/product-brief.md)
- [Architecture](docs/architecture.md)
- [API Contract](docs/api-contract.md)
- [Data Model](docs/data-model.md)
- [Testing Strategy](docs/testing-strategy.md)
- [SEO Strategy](docs/seo-strategy.md)
- [Observability](docs/observability.md)
- [Incident Response](docs/incident-response.md)
- [Experimentation](docs/experiment-plan.md)

## License

See [LICENSE](LICENSE).
