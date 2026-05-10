# SearchOps — SEO-Aware Job Listing Platform

A cloud-native TypeScript project that demonstrates how public job pages can be built for search visibility, conversion tracking, testability, and platform reliability.

## Why this project exists

This project explores how a job-listing platform can:
- serve crawlable, SEO-ready job detail pages
- expose scalable REST APIs for search and filtering
- track meaningful user actions such as job views and apply clicks
- support automated testing, observability, and incident response
- use lightweight experimentation to inform product decisions

## Planned capabilities

- SEO-ready job detail pages with `JobPosting` structured data
- Search and filtering API
- Conversion event tracking
- A/B testing for apply-button wording
- Automated unit, integration, and end-to-end tests
- Health checks, structured logs, and latency monitoring
- Incident-response documentation for simulated production degradation

## Tech stack

- Frontend: React, TypeScript
- Backend: Node.js, TypeScript
- Database: PostgreSQL, Prisma
- Testing: Vitest, Supertest, Playwright
- DevOps: Docker, GitHub Actions
- Observability: structured logging, metrics, health checks

## Project status

**Phase 1 complete:** Backend bootstrap with Docker local environment.

**Next:** Phase 2 (Database + Prisma models).

## Engineering focus

This is intentionally not a feature-heavy CRUD application.  
The focus is on demonstrating:
1. maintainable TypeScript backend design
2. SEO-aware product engineering
3. test-driven delivery
4. observability and incident thinking
5. product metrics and experimentation

---

## Getting Started

### Prerequisites

- **Docker & Docker Compose** (for containerized development)
- **Node.js 18+** (for local development)
- **npm 9+**

### Local Development Setup

#### Using Docker Compose (Recommended)

```bash
# Start backend and PostgreSQL
docker compose up --build

# In another terminal, run tests
cd backend
npm install
npm test

# Check health endpoint
curl http://localhost:5000/health
```

Expected output:
```json
{
  "data": {
    "status": "ok"
  },
  "meta": {
    "timestamp": "2026-05-10T14:30:00Z",
    "requestId": "req_abc123"
  }
}
```

#### Local Setup (Without Docker)

```bash
# Install dependencies
cd backend
npm install

# Copy environment file
cp .env.example .env

# Run tests
npm test

# Start development server
npm run dev
```

Server runs on `http://localhost:5000`

### Running Tests

```bash
cd backend

# Run all tests once
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# With coverage
npm run test:coverage
```

### Linting & Formatting

```bash
cd backend

# Check code style
npm run lint

# Fix issues automatically
npm run lint:fix

# Format code
npm run format
```

### Building for Production

```bash
cd backend

# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker Commands

```bash
# Start services
docker compose up

# Rebuild and start
docker compose up --build

# View logs
docker compose logs -f backend
docker compose logs -f postgres

# Stop services
docker compose down

# Stop and remove volumes (clean state)
docker compose down -v
```

---

## Project Structure

```
.
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── app.ts              # Express app configuration
│   │   ├── server.ts           # Server startup
│   │   └── routes/
│   │       └── health.ts       # Health check route
│   ├── Dockerfile              # Container image
│   ├── package.json            # Dependencies
│   ├── tsconfig.json           # TypeScript config
│   ├── .eslintrc.json          # Linting rules
│   ├── .prettierrc             # Code formatting
│   └── vitest.config.ts        # Test configuration
├── docker-compose.yml          # Local development environment
├── docs/                       # Documentation
│   ├── api-contract.md         # API specifications
│   ├── architecture.md         # System design
│   ├── data-model.md           # Database schema
│   ├── experiment-plan.md      # A/B testing framework
│   ├── incident-response.md    # Production runbook
│   ├── observability.md        # Monitoring & logging
│   ├── product-brief.md        # Business case
│   ├── seo-strategy.md         # SEO technical specs
│   └── testing-strategy.md     # Test approach
├── README.md                   # This file
└── LICENSE
```

---

## API Endpoints (Phase 1)

### Health Check

```
GET /health
```

Returns:
```json
{
  "data": {
    "status": "ok"
  },
  "meta": {
    "timestamp": "2026-05-10T14:30:00Z",
    "requestId": "req_abc123"
  }
}
```

**Future endpoints:** See [api-contract.md](docs/api-contract.md)

---

## Development Workflow

1. **Create feature branch** → `git checkout -b feature/my-feature`
2. **Make changes** in `backend/src/`
3. **Write tests** (Vitest + Supertest)
4. **Run tests locally** → `npm test`
5. **Lint & format** → `npm run lint:fix && npm run format`
6. **Commit & push** → `git push origin feature/my-feature`
7. **Create PR** → Link to issue, describe changes
8. **Tests pass in CI/CD** → Merge to main

---

## Architecture & Design

See full documentation:

- **[Product Brief](docs/product-brief.md)** — Vision, success metrics, out-of-scope items
- **[Architecture](docs/architecture.md)** — System design, tech stack, scalability
- **[API Contract](docs/api-contract.md)** — Endpoint specifications
- **[Data Model](docs/data-model.md)** — Database schema, indexes, queries
- **[Testing Strategy](docs/testing-strategy.md)** — Test pyramid, coverage goals
- **[SEO Strategy](docs/seo-strategy.md)** — Crawlability, structured data, Core Web Vitals
- **[Observability](docs/observability.md)** — Logging, metrics, alerting
- **[Incident Response](docs/incident-response.md)** — Runbook, debugging procedures
- **[Experimentation](docs/experiment-plan.md)** — A/B testing framework

---

## Troubleshooting

### `docker compose up` fails

```bash
# Clear containers and rebuild
docker compose down -v
docker compose up --build

# Check Docker daemon is running
docker --version
```

### Port 5000 already in use

```bash
# Find and kill process on port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

### Tests fail locally

```bash
# Ensure dependencies are installed
npm install

# Clear cache
rm -rf node_modules package-lock.json
npm install
npm test
```

### Database connection errors

```bash
# Verify postgres is running
docker compose logs postgres

# Check connection string in .env
cat backend/.env
```

---

## Contributing

Please read [docs/product-brief.md](docs/product-brief.md) to understand project scope and out-of-scope items.

**Current phase:** Backend bootstrap (Phase 1)

**Next phase:** Database + Prisma models (Phase 2)

---

## License

See [LICENSE](LICENSE) file.