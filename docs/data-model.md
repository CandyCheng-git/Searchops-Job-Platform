# Data Model

## Overview

SearchOps uses a PostgreSQL database managed through Prisma.

The version 1 data model supports five product goals:

1. store companies and job listings
2. support later job search and filtering
3. support SEO-friendly job detail pages through unique job slugs
4. track product events such as job views, apply clicks, search, and filter usage
5. persist lightweight A/B test assignments for anonymous users

This model is intentionally small. It does not include authentication, user accounts, admin workflows, resume parsing, AI recommendations, payments, or a full experiment-management system.

---

## Phase 2 Scope

Phase 2 implements the database foundation only:

- Prisma setup
- PostgreSQL connection through `DATABASE_URL`
- Prisma schema
- migration
- seed data
- database integration tests

Phase 2 must not build job APIs, frontend pages, analytics endpoints, or A/B testing logic. Those belong to later phases.

---

## Entity Relationship Diagram

```txt
┌──────────────────────────┐
│         Company          │
├──────────────────────────┤
│ id (PK)                  │
│ name                     │
│ slug (unique)            │
│ websiteUrl               │
│ createdAt                │
│ updatedAt                │
└─────────────┬────────────┘
              │ 1
              │
              │ N
┌─────────────▼────────────┐
│           Job            │
├──────────────────────────┤
│ id (PK)                  │
│ title                    │
│ slug (unique)            │
│ description              │
│ location                 │
│ category                 │
│ workMode                 │
│ employmentType           │
│ salaryMin                │
│ salaryMax                │
│ datePosted               │
│ validThrough             │
│ companyId (FK)           │
│ createdAt                │
│ updatedAt                │
└─────────────┬────────────┘
              │ 1
              │
              │ N, nullable from Event side
┌─────────────▼────────────┐
│          Event           │
├──────────────────────────┤
│ id (PK)                  │
│ eventType                │
│ jobId (FK, nullable)     │
│ variant                  │
│ searchTerm               │
│ createdAt                │
└──────────────────────────┘

┌──────────────────────────┐
│   ExperimentAssignment   │
├──────────────────────────┤
│ id (PK)                  │
│ anonymousUserId          │
│ experimentKey            │
│ variant                  │
│ assignedAt               │
│ unique anonymous+key     │
└──────────────────────────┘
```

---

## Model Summary

| Model | Purpose |
|---|---|
| `Company` | Stores hiring company metadata |
| `Job` | Stores public job listings for search and SEO-ready detail pages |
| `Event` | Stores user/product events for later analytics |
| `ExperimentAssignment` | Stores stable anonymous A/B test variant assignment |

---

# Models

## Company

### Purpose

Represents an employer or hiring organisation.

A company can have many jobs.

### Fields

| Field | Type | Required | Unique | Default | Notes |
|---|---|---:|---:|---|---|
| `id` | `String` | Yes | Yes | `cuid()` | Primary key |
| `name` | `String` | Yes | No | | Human-readable company name |
| `slug` | `String` | Yes | Yes | | URL-safe company identifier |
| `websiteUrl` | `String?` | No | No | `null` | Company website |
| `jobs` | `Job[]` | No | No | | One-to-many relation |
| `createdAt` | `DateTime` | Yes | No | `now()` | Record creation timestamp |
| `updatedAt` | `DateTime` | Yes | No | `@updatedAt` | Record update timestamp |

### Constraints and indexes

| Constraint / Index | Reason |
|---|---|
| `slug` unique | Supports stable company references and avoids duplicates |

### Example seed data

```txt
CloudHire
DataNest Analytics
MetroTech Careers
SecurePath Cyber
ProductFlow Labs
```

---

## Job

### Purpose

Represents a public job listing.

This is the core search and SEO entity. Each job belongs to one company.

### Fields

| Field | Type | Required | Unique | Default | Notes |
|---|---|---:|---:|---|---|
| `id` | `String` | Yes | Yes | `cuid()` | Primary key |
| `title` | `String` | Yes | No | | Job title |
| `slug` | `String` | Yes | Yes | | SEO-friendly job slug |
| `description` | `String` | Yes | No | | Full job description |
| `location` | `String` | Yes | No | | Example: `Melbourne, VIC`, `Remote Australia` |
| `category` | `JobCategory` | Yes | No | | High-level role category |
| `workMode` | `WorkMode` | Yes | No | | Onsite, hybrid, or remote |
| `employmentType` | `EmploymentType` | Yes | No | | Full-time, contract, internship, etc. |
| `salaryMin` | `Int?` | No | No | `null` | Minimum annual salary or equivalent AUD amount |
| `salaryMax` | `Int?` | No | No | `null` | Maximum annual salary or equivalent AUD amount |
| `datePosted` | `DateTime` | Yes | No | `now()` | Public job posting date |
| `validThrough` | `DateTime?` | No | No | `null` | Expiry/closing date for structured data |
| `companyId` | `String` | Yes | No | | Foreign key to `Company` |
| `company` | `Company` | Yes | No | | Many-to-one relation |
| `events` | `Event[]` | No | No | | One-to-many relation |
| `createdAt` | `DateTime` | Yes | No | `now()` | Record creation timestamp |
| `updatedAt` | `DateTime` | Yes | No | `@updatedAt` | Record update timestamp |

### Constraints and indexes

| Constraint / Index | Reason |
|---|---|
| `slug` unique | Enables `GET /api/jobs/:slug` and SEO-friendly job pages |
| Index `companyId` | Supports company-to-jobs lookup and joins |
| Index `location` | Supports location filtering |
| Index `category` | Supports category filtering |
| Index `workMode` | Supports onsite/hybrid/remote filtering |
| Index `employmentType` | Supports full-time/contract/internship filtering |
| Index `datePosted` | Supports recent-first sorting |

### Validation rules

Application-level validation should enforce:

- `title` cannot be empty.
- `slug` must be URL-safe and unique.
- `description` cannot be empty.
- `salaryMax >= salaryMin` when both values exist.
- `validThrough > datePosted` when `validThrough` exists.

Prisma does not enforce every business rule directly, so tests and application validation should cover these rules later.

---

## Event

### Purpose

Stores user/product behaviour for later analytics.

Events are deliberately flexible but still typed enough for useful reporting.

`jobId` is nullable because some events, such as `SEARCH_PERFORMED` or `FILTER_USED`, may not belong to one specific job.

### Fields

| Field | Type | Required | Unique | Default | Notes |
|---|---|---:|---:|---|---|
| `id` | `String` | Yes | Yes | `cuid()` | Primary key |
| `eventType` | `EventType` | Yes | No | | Type of tracked event |
| `jobId` | `String?` | No | No | `null` | Nullable foreign key to `Job` |
| `job` | `Job?` | No | No | | Optional relation |
| `variant` | `String?` | No | No | `null` | CTA experiment variant, e.g. `A` or `B` |
| `searchTerm` | `String?` | No | No | `null` | Search keyword for analytics |
| `createdAt` | `DateTime` | Yes | No | `now()` | Event timestamp |

### Constraints and indexes

| Constraint / Index | Reason |
|---|---|
| Index `eventType` | Supports event counts by type |
| Index `jobId` | Supports job-level funnel analysis |
| Index `searchTerm` | Supports top searched keyword reporting |
| Index `createdAt` | Supports time-window analytics |

### Event type examples

| Event type | Example |
|---|---|
| `JOB_VIEW` | User opens a job detail page |
| `APPLY_CLICK` | User clicks the apply CTA |
| `SEARCH_PERFORMED` | User searches for `backend` |
| `FILTER_USED` | User filters by location/work mode/category |

---

## ExperimentAssignment

### Purpose

Stores stable assignment of an anonymous user to an experiment variant.

This is intentionally not a full `Experiment` model. Version 1 only needs to prove lightweight A/B testing logic later:

- same anonymous user
- same experiment key
- same variant every time

A full experiment configuration table would be premature for this project.

### Fields

| Field | Type | Required | Unique | Default | Notes |
|---|---|---:|---:|---|---|
| `id` | `String` | Yes | Yes | `cuid()` | Primary key |
| `anonymousUserId` | `String` | Yes | No | | Browser/client-generated anonymous ID |
| `experimentKey` | `String` | Yes | No | | Example: `apply_cta_copy` |
| `variant` | `String` | Yes | No | | Example: `A` or `B` |
| `assignedAt` | `DateTime` | Yes | No | `now()` | Assignment timestamp |

### Constraints and indexes

| Constraint / Index | Reason |
|---|---|
| Unique `[anonymousUserId, experimentKey]` | Ensures stable assignment for each anonymous user per experiment |
| Index `experimentKey` | Supports experiment-level reporting |
| Index `variant` | Supports conversion comparison by variant |

---

# Enums

## WorkMode

```txt
ONSITE
HYBRID
REMOTE
```

### Purpose

Supports filtering by workplace arrangement.

---

## EmploymentType

```txt
FULL_TIME
PART_TIME
CONTRACT
CASUAL
INTERNSHIP
```

### Purpose

Supports filtering by job type.

---

## JobCategory

```txt
SOFTWARE_ENGINEERING
DATA_ANALYTICS
CLOUD_DEVOPS
PRODUCT
DESIGN
CYBERSECURITY
```

### Purpose

Supports broad job category filtering without overbuilding a taxonomy.

---

## EventType

```txt
JOB_VIEW
APPLY_CLICK
SEARCH_PERFORMED
FILTER_USED
```

### Purpose

Supports product analytics and conversion tracking.

---

# Prisma Schema Draft

This is the intended Phase 2 Prisma shape. The actual implementation should stay close to this unless a practical Prisma limitation requires a documented change.

```prisma
model Company {
  id         String   @id @default(cuid())
  name       String
  slug       String   @unique
  websiteUrl String?
  jobs       Job[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Job {
  id             String         @id @default(cuid())
  title          String
  slug           String         @unique
  description    String
  location       String
  category       JobCategory
  workMode       WorkMode
  employmentType EmploymentType
  salaryMin      Int?
  salaryMax      Int?
  datePosted     DateTime       @default(now())
  validThrough   DateTime?
  companyId      String
  company        Company        @relation(fields: [companyId], references: [id], onDelete: Cascade)
  events         Event[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([companyId])
  @@index([location])
  @@index([category])
  @@index([workMode])
  @@index([employmentType])
  @@index([datePosted])
}

model Event {
  id         String    @id @default(cuid())
  eventType  EventType
  jobId      String?
  job        Job?      @relation(fields: [jobId], references: [id], onDelete: SetNull)
  variant    String?
  searchTerm String?
  createdAt  DateTime  @default(now())

  @@index([eventType])
  @@index([jobId])
  @@index([searchTerm])
  @@index([createdAt])
}

model ExperimentAssignment {
  id              String   @id @default(cuid())
  anonymousUserId String
  experimentKey   String
  variant         String
  assignedAt      DateTime @default(now())

  @@unique([anonymousUserId, experimentKey])
  @@index([experimentKey])
  @@index([variant])
}

enum WorkMode {
  ONSITE
  HYBRID
  REMOTE
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  CASUAL
  INTERNSHIP
}

enum JobCategory {
  SOFTWARE_ENGINEERING
  DATA_ANALYTICS
  CLOUD_DEVOPS
  PRODUCT
  DESIGN
  CYBERSECURITY
}

enum EventType {
  JOB_VIEW
  APPLY_CLICK
  SEARCH_PERFORMED
  FILTER_USED
}
```

---

# Seed Data Requirements

Phase 2 seed data should include at least:

- 5 companies
- 20 jobs
- realistic Australian locations
- a mix of work modes
- a mix of categories
- a mix of employment types
- realistic AUD salary ranges

Recommended location mix:

```txt
Melbourne, VIC
Sydney, NSW
Brisbane, QLD
Remote Australia
```

Recommended salary examples:

| Role type | Example salary range |
|---|---:|
| Junior software role | AUD 70,000–90,000 |
| Mid-level software role | AUD 95,000–130,000 |
| Senior software role | AUD 130,000–170,000 |
| Data analyst role | AUD 80,000–120,000 |
| Cloud/DevOps role | AUD 110,000–160,000 |
| Internship | AUD 55,000–70,000 equivalent |

Do not use Lorem Ipsum or joke company names. The seed data should be realistic enough to support later search/filter demos.

---

# Query Patterns and Index Rationale

## Search by location, category, and work mode

Future API query:

```http
GET /api/jobs?location=Melbourne&category=SOFTWARE_ENGINEERING&workMode=HYBRID
```

Relevant indexes:

```prisma
@@index([location])
@@index([category])
@@index([workMode])
```

Why this matters:

- location filtering is a core job-board use case
- category filtering supports grouped job browsing
- work mode filtering supports onsite/hybrid/remote search behaviour

---

## Sort by newest jobs

Future API query:

```http
GET /api/jobs?sort=recent
```

Relevant index:

```prisma
@@index([datePosted])
```

Why this matters:

Job boards commonly show recently posted jobs first. Indexing `datePosted` supports recent-first sorting and later freshness-based ranking.

---

## Load jobs for a company

Future API behaviour:

```txt
Company detail or company filter returns all matching jobs.
```

Relevant index:

```prisma
@@index([companyId])
```

Why this matters:

The company-to-jobs relationship is one of the most common joins in the system.

---

## Event funnel by job

Future analytics query:

```txt
For one job, count JOB_VIEW and APPLY_CLICK events.
```

Relevant indexes:

```prisma
@@index([jobId])
@@index([eventType])
@@index([createdAt])
```

Why this matters:

These indexes support simple conversion analytics, such as:

- job views
- apply clicks
- apply click-through rate
- time-window reporting

---

## Top searched keywords

Future analytics query:

```txt
Group SEARCH_PERFORMED events by searchTerm.
```

Relevant index:

```prisma
@@index([searchTerm])
```

Why this matters:

This supports a simple analytics summary showing what users search for most often.

---

## Stable A/B assignment

Future experiment query:

```txt
Find or create assignment for anonymousUserId + experimentKey.
```

Relevant constraint:

```prisma
@@unique([anonymousUserId, experimentKey])
```

Why this matters:

A user must not randomly switch between CTA variants. Stable assignment is the minimum requirement for a credible A/B test.

---

# What Is Deliberately Not Modelled Yet

## No User model

Version 1 uses anonymous IDs only. User accounts and authentication are out of scope.

## No full Experiment model

`ExperimentAssignment` is enough for a lightweight CTA wording experiment. A full experiment table can be added later if the project grows.

## No saved jobs

Saved jobs would require user identity. That is out of scope for version 1.

## No applications table

The MVP tracks apply clicks, not full application submissions.

## No company admin panel

Admin workflows are out of scope. Seed data is enough for portfolio demonstration.

## No full-text search index in Phase 2

Basic field indexes are enough for Phase 2. PostgreSQL full-text search can be added later if Phase 3 search implementation needs it.

Do not add GIN full-text indexes prematurely unless the search implementation actually uses them.

---

# Phase 2 Test Expectations

Database integration tests should verify:

1. seeded companies exist
2. seeded jobs exist
3. one company can have many jobs
4. job slugs are unique
5. event `jobId` can be nullable for search/filter events
6. `ExperimentAssignment` prevents duplicate assignment for the same `anonymousUserId` + `experimentKey`

Tests should use Prisma directly. They should not depend on job API routes, because APIs are not part of Phase 2.

---

# Implementation Notes for Codex

When implementing Phase 2:

1. Keep this document aligned with the actual Prisma schema.
2. Do not reintroduce the older `Experiment` table.
3. Do not use the older `level` field.
4. Do not use USD salary language; use AUD-style seed data.
5. Do not add `requirements`, `benefits`, or `metadata` fields unless there is a clear Phase 2 reason.
6. Do not add APIs yet.
7. Do not leave generated files in one-line/minified formatting.
