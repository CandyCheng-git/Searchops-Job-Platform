# Data Model

## Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────┐
│    companies    │         │      jobs        │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │◄────────│ company_id (FK)  │
│ name            │ 1     N │ id (PK)          │
│ website         │         │ title            │
│ logo_url        │         │ description      │
│ created_at      │         │ location         │
│ updated_at      │         │ level            │
└─────────────────┘         │ salary_min       │
                            │ salary_max       │
                            │ posted_at        │
                            │ expires_at       │
                            │ created_at       │
                            │ updated_at       │
                            └──────────────────┘
                                    ▲
                                    │ 1
                            ┌───────┴────────┐
                          N │                │ N
                ┌───────────────────┐    ┌──────────────┐
                │     events        │    │ experiments  │
                ├───────────────────┤    ├──────────────┤
                │ id (PK)           │    │ id (PK)      │
                │ job_id (FK)       │    │ name         │
                │ event_type        │    │ hypothesis   │
                │ user_id           │    │ control_var  │
                │ experiment_id (FK)│    │ treatment_var│
                │ metadata (JSON)   │    │ status       │
                │ created_at        │    │ started_at   │
                │ updated_at        │    │ ended_at     │
                └───────────────────┘    │ created_at   │
                                         │ updated_at   │
                                         └──────────────┘
```

---

## Tables

### `companies`

Metadata about hiring companies.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | uuid_generate_v4() | Primary key |
| `name` | TEXT | No | | Company legal name |
| `website` | TEXT | Yes | | Company website |
| `logo_url` | TEXT | Yes | | Logo image URL |
| `created_at` | TIMESTAMP | No | NOW() | Record creation |
| `updated_at` | TIMESTAMP | No | NOW() | Last modification |

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_companies_name ON companies(name);
```

---

### `jobs`

Job listings. Core entity for search and display.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | uuid_generate_v4() | Primary key |
| `company_id` | UUID | No | | Foreign key → companies |
| `title` | TEXT | No | | Job title (e.g., "Senior Backend Engineer") |
| `description` | TEXT | No | | Full job description |
| `requirements` | TEXT[] | Yes | {} | Array of requirements |
| `benefits` | TEXT[] | Yes | {} | Array of benefits |
| `location` | TEXT | No | | Job location or "Remote" |
| `level` | ENUM | No | | junior, mid, senior |
| `salary_min` | INTEGER | Yes | | Minimum salary in USD |
| `salary_max` | INTEGER | Yes | | Maximum salary in USD |
| `posted_at` | TIMESTAMP | No | NOW() | When job was posted |
| `expires_at` | TIMESTAMP | Yes | | When job closes |
| `created_at` | TIMESTAMP | No | NOW() | Record creation |
| `updated_at` | TIMESTAMP | No | NOW() | Last modification |

**Indexes:**
```sql
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_level ON jobs(level);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_title_tsvector ON jobs USING GIN(to_tsvector('english', title));
CREATE INDEX idx_jobs_description_tsvector ON jobs USING GIN(to_tsvector('english', description));
```

**Constraints:**
- `salary_max >= salary_min` (if both set)
- `expires_at > posted_at` (if set)

---

### `events`

User events for analytics and funnel tracking.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | uuid_generate_v4() | Primary key |
| `job_id` | UUID | No | | Foreign key → jobs |
| `event_type` | ENUM | No | | view, apply, conversion |
| `user_id` | TEXT | Yes | | Opaque user identifier (optional) |
| `experiment_id` | UUID | Yes | | Foreign key → experiments (for A/B test) |
| `experiment_variant` | ENUM | Yes | | control, treatment (null if no experiment) |
| `metadata` | JSONB | Yes | {} | Additional context (source, utm_*, etc.) |
| `created_at` | TIMESTAMP | No | NOW() | Event time |

**Indexes:**
```sql
CREATE INDEX idx_events_job_id ON events(job_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_experiment_id ON events(experiment_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_metadata ON events USING GIN(metadata);
```

**Constraints:**
- `event_type` ∈ {view, apply, conversion}

---

### `experiments`

A/B testing configuration and results.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | uuid_generate_v4() | Primary key |
| `name` | TEXT | No | | Experiment identifier (e.g., "apply_button_wording_v1") |
| `hypothesis` | TEXT | No | | What we're testing and why |
| `control_variant` | TEXT | No | | Description of control (e.g., "Apply Now") |
| `treatment_variant` | TEXT | No | | Description of treatment (e.g., "Apply Today") |
| `status` | ENUM | No | draft | draft, running, completed, cancelled |
| `started_at` | TIMESTAMP | Yes | | When experiment began |
| `ended_at` | TIMESTAMP | Yes | | When experiment ended |
| `created_at` | TIMESTAMP | No | NOW() | Record creation |
| `updated_at` | TIMESTAMP | No | NOW() | Last modification |

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_experiments_name ON experiments(name);
CREATE INDEX idx_experiments_status ON experiments(status);
```

---

## Prisma Schema Outline

```typescript
model Company {
  id        String   @id @default(cuid())
  name      String   @unique
  website   String?
  logoUrl   String?
  jobs      Job[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Job {
  id            String   @id @default(cuid())
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  title         String
  description   String
  requirements  String[]
  benefits      String[]
  location      String
  level         String   // junior, mid, senior
  salaryMin     Int?
  salaryMax     Int?
  postedAt      DateTime @default(now())
  expiresAt     DateTime?
  events        Event[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([companyId])
  @@index([location])
  @@index([level])
  @@index([postedAt])
}

model Event {
  id                 String   @id @default(cuid())
  jobId              String
  job                Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  eventType          String   // view, apply, conversion
  userId             String?
  experimentId       String?
  experiment         Experiment? @relation(fields: [experimentId], references: [id])
  experimentVariant  String?  // control, treatment
  metadata           Json?
  createdAt          DateTime @default(now())

  @@index([jobId])
  @@index([eventType])
  @@index([experimentId])
  @@index([createdAt])
}

model Experiment {
  id               String   @id @default(cuid())
  name             String   @unique
  hypothesis       String
  controlVariant   String
  treatmentVariant String
  status           String   @default("draft") // draft, running, completed, cancelled
  startedAt        DateTime?
  endedAt          DateTime?
  events           Event[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([status])
}
```

---

## Query Patterns (Performance)

### Search Jobs by Title/Description
```sql
SELECT * FROM jobs
WHERE to_tsvector('english', title) @@ plainto_tsquery('english', ?)
   OR to_tsvector('english', description) @@ plainto_tsquery('english', ?)
ORDER BY posted_at DESC
LIMIT ? OFFSET ?;
```
**Index:** `idx_jobs_title_tsvector`, `idx_jobs_description_tsvector`

### Filter by Location + Level
```sql
SELECT * FROM jobs
WHERE location = ? AND level = ?
ORDER BY posted_at DESC
LIMIT ? OFFSET ?;
```
**Index:** `idx_jobs_location`, `idx_jobs_level`, `idx_jobs_posted_at`

### Event Funnel Analysis
```sql
SELECT event_type, COUNT(*) as count
FROM events
WHERE job_id = ? AND created_at > NOW() - INTERVAL '30 days'
GROUP BY event_type;
```
**Index:** `idx_events_job_id`, `idx_events_created_at`

---

## Constraints & Validation

- Job `level` must be one of: junior, mid, senior
- Event `event_type` must be one of: view, apply, conversion
- Experiment `status` must be one of: draft, running, completed, cancelled
- Salary: `salary_max >= salary_min` (if both set)
- Dates: `expires_at > posted_at`, `ended_at > started_at`
- Text fields (title, description) required and non-empty
