# SearchOps Job Platform

A cloud-native TypeScript project demonstrating how public job pages can be built for search visibility, conversion tracking, testability, and platform reliability.

## Project Status

- Phase 1 complete: backend bootstrap with Docker local environment and `GET /health`.
- Phase 2 in progress/complete in this branch: Prisma schema, persisted migrations, seed data, and direct database integration tests.

Phase 2 does not include job APIs, frontend work, authentication, analytics endpoints, or A/B testing logic.

## Tech Stack

- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL, Prisma
- Testing: Vitest, Supertest
- Local workflow: Docker Compose only

## Local Development

Docker is the supported local workflow. Do not run npm or Prisma commands on the host machine for normal project setup.

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Build the backend image:

```bash
docker compose build backend
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

Run tests and build:

```bash
docker compose run --rm backend sh -lc "npm test"
docker compose run --rm backend sh -lc "npm run build"
```

Start the API:

```bash
docker compose up backend
```

The API runs on `http://localhost:5000`.

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

Phase 2 does not introduce a separate test database. These are local development integration tests against the Docker Compose PostgreSQL service.

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

Future product APIs should be mounted under `/api`.

Planned examples:

- `GET /api/jobs`
- `GET /api/jobs/:slug`
- `POST /api/events`
- `GET /api/analytics/summary`

Do not implement those endpoints during Phase 2.

## Useful Docker Commands

```bash
docker compose up -d postgres
docker compose up backend
docker compose logs -f backend
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
