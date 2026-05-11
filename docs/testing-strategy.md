# Testing Strategy

## Testing Philosophy

SearchOps prioritizes **high-confidence deployments** over arbitrary coverage numbers. We test:
1. **Business logic** that drives revenue (search, events, experiments)
2. **Critical API contracts** (400ms p95 latency, pagination, filtering)
3. **SEO-critical paths** (crawlable pages, structured data)
4. **Incident scenarios** (missing indexes, database timeouts)

**Goal:** >80% coverage on critical paths; pragmatic on UI edge cases.

---

## Test Pyramid

```
        ┌──────────────────┐
        │   E2E Tests      │  ~5% of test count
        │  (Playwright)    │  ~10 tests
        │                  │
        │ - User journeys  │
        │ - Navigation     │
        ├──────────────────┤
        │ Integration      │
        │   Tests          │  ~30% of test count
        │ (Supertest)      │  ~60 tests
        │                  │
        │ - API contracts  │
        │ - Database I/O   │
        │ - Search logic   │
        ├──────────────────┤
        │  Unit Tests      │  ~65% of test count
        │  (Vitest)        │  ~130 tests
        │                  │
        │ - Validators     │
        │ - Filters        │
        │ - Schemas        │
        └──────────────────┘
```

---

## Unit Tests (Vitest)

**Focus:** Business logic in isolation.

### Backend

**Location:** `backend/src/**/*.test.ts`

**Coverage:**

| Module | Tests | Purpose |
|--------|-------|---------|
| Search service | 12 | Query parsing, filter logic, pagination bounds |
| Event tracking | 8 | Event type validation, experiment assignment |
| Experiment logic | 10 | Variant assignment, bucketing |
| Validators | 15 | Job title format, salary ranges, dates |
| Error handlers | 5 | Error code mapping, message formatting |

**Example:**
```typescript
describe('SearchService', () => {
  describe('parseQuery', () => {
    it('should extract search terms and filters', () => {
      const result = SearchService.parseQuery({
        q: 'python',
        level: 'senior',
        page: 2,
        limit: 50,
      });
      expect(result.terms).toEqual(['python']);
      expect(result.filters.level).toBe('senior');
      expect(result.offset).toBe(50); // (page-1) * limit
    });

    it('should validate limit max 100', () => {
      expect(() =>
        SearchService.parseQuery({ limit: 101 })
      ).toThrow('VALIDATION_ERROR');
    });
  });
});
```

### Frontend

**Location:** `frontend/src/**/*.test.tsx`

**Coverage:**

| Component | Tests | Purpose |
|-----------|-------|---------|
| Search form | 6 | Input validation, query submission |
| Job card | 4 | Rendering, event tracking calls |
| Pagination | 5 | Page nav, boundary conditions |
| Event tracker | 8 | Event type, experiment variant, metadata |

---

## Integration Tests (Supertest)

**Focus:** API contracts, database interactions, end-to-end request/response flow.

**Location:** `backend/tests/integration/**/*.test.ts`

### Core Flows

| Endpoint | Tests | Scenarios |
|----------|-------|-----------|
| GET /api/jobs | 8 | Search, filter, pagination, 400+ latency |
| GET /api/jobs/:id | 4 | Found, not found, invalid ID |
| POST /api/events | 6 | Valid events, experiment assignment, invalid types |
| GET /health | 3 | Healthy, database down, degraded |

**Example:**
```typescript
describe('GET /api/jobs', () => {
  it('should search jobs by query with <500ms latency', async () => {
    const start = Date.now();
    const res = await request(app)
      .get('/api/jobs')
      .query({ q: 'python' })
      .expect(200);
    const duration = Date.now() - start;

    expect(res.body.data.jobs).toHaveLength(20);
    expect(duration).toBeLessThan(500);
  });

  it('should filter by level and location', async () => {
    const res = await request(app)
      .get('/api/jobs')
      .query({ level: 'senior', location: 'Remote' })
      .expect(200);

    expect(res.body.data.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ level: 'senior', location: 'Remote' }),
      ])
    );
  });

  it('should return 400 for invalid limit', async () => {
    const res = await request(app)
      .get('/api/jobs')
      .query({ limit: 101 })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### Database Tests

| Scenario | Test | Purpose |
|----------|------|---------|
| Connection pooling | 1 | Verify 10 concurrent requests handled |
| Missing index (incident) | 1 | Simulate >800ms latency, trigger alert |
| Pagination accuracy | 1 | Verify offset calculations across pages |
| Event recording | 1 | Verify events persisted and queryable |

### Current Phase 2 Database Integration Tests

Phase 2 adds direct Prisma integration tests in `backend/src/db/prisma.integration.test.ts`.

These tests verify:

- seeded companies exist
- seeded jobs exist
- one company can have many jobs
- job slugs are unique
- nullable `Event.jobId` works for search events
- `ExperimentAssignment` enforces one variant per anonymous user per experiment key

These are local development integration tests against the Docker Compose PostgreSQL database. Phase 2 does not introduce a separate test database.

Run them through the Docker-only workflow:

```bash
docker compose up -d postgres
docker compose build backend
docker compose run --rm backend sh -lc "npx prisma migrate deploy"
docker compose run --rm backend sh -lc "npx prisma db seed"
docker compose run --rm backend sh -lc "npm test"
```

---

## End-to-End Tests (Playwright)

**Focus:** User workflows, SEO rendering, crawlability.

**Location:** `frontend/e2e/**/*.spec.ts`

### Critical User Flows

| Scenario | Tests | Assertions |
|----------|-------|-----------|
| Search → View → Apply | 1 | Flow from listing to detail to apply |
| Job detail page renders | 2 | Page loads, structured data visible in DOM |
| Pagination works | 1 | Navigate between pages, results change |
| Mobile responsive | 1 | Job card layout on mobile viewport |

**Example:**
```typescript
test('user can search and view a job', async ({ page }) => {
  await page.goto('http://localhost:3000/jobs');
  
  // Search for jobs
  await page.fill('input[placeholder="Search jobs"]', 'python');
  await page.press('input', 'Enter');
  await page.waitForURL(/\?q=python/);

  // Click first job
  await page.click('text=Senior Backend Engineer');
  await page.waitForURL(/\/jobs\/job_\d+/);

  // Verify job detail page loaded
  expect(await page.locator('h1').textContent()).toContain('Senior Backend Engineer');
  
  // Verify structured data in DOM
  const jsonLd = page.locator('script[type="application/ld+json"]');
  const schema = JSON.parse(await jsonLd.textContent());
  expect(schema['@type']).toBe('JobPosting');
});

test('job detail page is crawlable', async ({ page }) => {
  await page.goto('http://localhost:3000/jobs/job_123');

  // Check meta tags
  const title = await page.locator('title').textContent();
  expect(title).toContain('Senior Backend Engineer');

  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description).toBeTruthy();

  // Check canonical URL
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toContain('job_123');
});
```

---

## Test Data

### Fixtures

Use `beforeEach` to seed consistent test data:

```typescript
beforeEach(async () => {
  await db.company.create({
    data: {
      id: 'co_123',
      name: 'Acme Corp',
      website: 'https://acme.com',
    },
  });

  await db.job.create({
    data: {
      id: 'job_123',
      companyId: 'co_123',
      title: 'Senior Backend Engineer',
      location: 'San Francisco, CA',
      level: 'senior',
      salaryMin: 150000,
      salaryMax: 200000,
    },
  });
});
```

### Database Reset

For Phase 2 local development, run migrations and seed data through Docker before the test suite:

```bash
docker compose up -d postgres
docker compose run --rm backend sh -lc "npx prisma migrate deploy"
docker compose run --rm backend sh -lc "npx prisma db seed"
docker compose run --rm backend sh -lc "npm test"
```

---

## Incident Scenario: Missing Database Index

**Objective:** Verify we detect and respond to search API degradation.

**Test Setup:**
```typescript
describe('Incident: Missing search index', () => {
  it('should detect latency exceeding 800ms threshold', async () => {
    // Temporarily drop the search index
    await db.$executeRaw`DROP INDEX idx_jobs_title_tsvector;`;

    const start = Date.now();
    const res = await request(app)
      .get('/api/jobs')
      .query({ q: 'python' })
      .timeout(2000); // Allow up to 2 seconds

    const duration = Date.now() - start;
    
    // Verify latency exceeded threshold
    expect(duration).toBeGreaterThan(800);
    
    // Verify alert would fire (check logs for warning)
    expect(res.body.meta.latency_ms).toBeGreaterThan(800);
  });

  it('should still return correct results despite degraded latency', async () => {
    // Drop index
    await db.$executeRaw`DROP INDEX idx_jobs_title_tsvector;`;

    const res = await request(app)
      .get('/api/jobs')
      .query({ q: 'senior' });

    // Results correct even if slow
    expect(res.body.data.jobs).toBeDefined();
    expect(res.body.data.jobs.length).toBeGreaterThan(0);
  });
});
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: searchops_test
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run db:migrate:test
      - run: npm run test:unit        # Vitest
      - run: npm run test:integration  # Supertest
      - run: npm run test:e2e          # Playwright
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## Coverage Goals

| Layer | Target | Rationale |
|-------|--------|-----------|
| Search logic | 90% | Core revenue driver |
| Event tracking | 85% | Analytics must be reliable |
| API handlers | 80% | HTTP contracts critical |
| Validators | 95% | Catch bad data early |
| UI components | 60% | Less critical than backend logic |

---

## Test Naming Convention

```
describe('SearchService', () => {
  describe('#parseQuery', () => {
    it('should extract search terms from query string');
    it('should default page to 1 if not provided');
    it('should throw VALIDATION_ERROR if limit > 100');
  });
});
```

Use: `should [expected behavior]` or `should throw [error type] when [condition]`

---

## Performance Benchmarks

Document expected latencies to detect regressions:

| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| GET /api/jobs | 120ms | 450ms | 800ms |
| GET /api/jobs/:id | 80ms | 250ms | 500ms |
| POST /api/events | 50ms | 150ms | 300ms |
| GET /health | 10ms | 20ms | 50ms |

Trigger alerts when p95 > threshold.
