# Data Model

## Overview

SearchOps uses PostgreSQL with Prisma. Phase 2 implements only the database foundation:

- Prisma schema
- persisted migrations
- seed data
- direct Prisma integration tests

The model supports job listings, company relationships, future search and filtering, event tracking, and lightweight anonymous experiment assignment. It deliberately does not include authentication, applications, saved jobs, admin workflows, analytics endpoints, or a full experiment-management model.

## Models

### Company

Represents a hiring company.

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
```

Constraints:

- `slug` is unique.

Relations:

- One `Company` has many `Job` records through `jobs`.

### Job

Represents a public job listing.

```prisma
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
```

Constraints and indexes:

- `slug` is unique.
- `companyId` is indexed.
- `location` is indexed.
- `category` is indexed.
- `workMode` is indexed.
- `employmentType` is indexed.
- `datePosted` is indexed.

Relations:

- One `Job` belongs to one `Company`.
- One `Job` can have many `Event` records.
- Deleting a company cascades to its jobs.

### Event

Represents a product event for later analytics.

```prisma
model Event {
  id         String             @id @default(cuid())
  eventType  EventType
  jobId      String?
  job        Job?               @relation(fields: [jobId], references: [id], onDelete: SetNull)
  variant    ExperimentVariant?
  searchTerm String?
  createdAt  DateTime           @default(now())

  @@index([eventType])
  @@index([jobId])
  @@index([searchTerm])
  @@index([createdAt])
}
```

Indexes:

- `eventType` is indexed.
- `jobId` is indexed.
- `searchTerm` is indexed.
- `createdAt` is indexed.

Relations:

- `Event.jobId` is nullable because search and filter events may not belong to a specific job.
- When a job is deleted, related event `jobId` values are set to `null`.
- `variant` uses `ExperimentVariant?`, not `String?`.

### ExperimentAssignment

Represents a stable anonymous assignment to one experiment variant.

```prisma
model ExperimentAssignment {
  id              String            @id @default(cuid())
  anonymousUserId String
  experimentKey   String
  variant         ExperimentVariant
  assignedAt      DateTime          @default(now())

  @@unique([anonymousUserId, experimentKey])
  @@index([experimentKey])
  @@index([variant])
}
```

Constraints and indexes:

- `[anonymousUserId, experimentKey]` is unique.
- `experimentKey` is indexed.
- `variant` is indexed.
- `variant` uses `ExperimentVariant`, not `String`.

## Enums

```prisma
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

enum ExperimentVariant {
  A
  B
}
```

## Index Rationale

The `Job` indexes support future `/api/jobs` filtering and sorting:

- `companyId` supports company-to-jobs lookups and joins.
- `location` supports location filters such as Melbourne, Sydney, Brisbane, and Remote Australia.
- `category` supports broad role filters such as software engineering, data analytics, product, design, cloud/devops, and cybersecurity.
- `workMode` supports onsite, hybrid, and remote filters.
- `employmentType` supports full-time, contract, internship, part-time, and casual filters.
- `datePosted` supports recent-first sorting.

The `Event` indexes support future event-tracking and analytics:

- `eventType` supports counts for job views, apply clicks, searches, and filter usage.
- `jobId` supports job-level funnel reporting.
- `searchTerm` supports top searched keyword reporting.
- `createdAt` supports time-window reporting.

The `ExperimentAssignment` unique constraint and indexes support future A/B testing:

- `[anonymousUserId, experimentKey]` keeps a user on one variant for one experiment.
- `experimentKey` supports experiment-level reporting.
- `variant` supports comparing variant-level outcomes.

## Seed Data

The Phase 2 seed script resets dependent records in a safe order:

1. events
2. experiment assignments
3. jobs
4. companies

It then inserts realistic Australian demo data:

- 6 companies: SEEK, Atlassian, Canva, Xero, REA Group, and SafetyCulture
- 22 jobs
- locations across Melbourne, Sydney, Brisbane, and Remote Australia
- onsite, hybrid, and remote roles
- software engineering, data analytics, cloud/devops, cybersecurity, product, and design categories
- full-time, contract, internship, and part-time employment types
- realistic AUD salary ranges

## Phase 2 Test Expectations

Database integration tests use Prisma directly and verify:

1. seeded jobs exist
2. seeded companies exist
3. a company can have many jobs
4. job slugs are unique
5. nullable `Event.jobId` works for search events
6. `ExperimentAssignment` enforces one variant per anonymous user per experiment key

These are local development integration tests against the Docker PostgreSQL database. A separate test database is not introduced in Phase 2.

## Out Of Scope

Phase 2 does not implement:

- job APIs
- frontend pages
- authentication
- analytics endpoints
- A/B testing logic
- a full `Experiment` model
- full-text search indexes
