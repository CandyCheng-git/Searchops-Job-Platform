# SEO Strategy

## Phase 4 Implementation

Phase 4 implements crawlable public job pages in the Next.js frontend. The backend API contract remains unchanged:

```txt
GET /api/jobs
GET /api/jobs/:slug
```

There is no `/api/jobs/search` endpoint. Search and filtering continue to use query parameters on `GET /api/jobs`.

The frontend reads from:

| Variable | Default | Purpose |
|---|---|---|
| `BACKEND_API_URL` | `http://localhost:5000` | Backend origin for server-side API fetches |
| `FRONTEND_SITE_URL` | `http://localhost:3000` | Absolute origin for canonical, Open Graph, sitemap, and robots URLs |

Inside Docker Compose, `BACKEND_API_URL` is `http://backend:5000`.

---

## URL Structure

Public job pages use slug-based URLs:

```txt
/jobs
/jobs/backend-software-engineer-melbourne-seek
```

The slug comes from the existing backend `slug` field returned by `GET /api/jobs` and `GET /api/jobs/:slug`.

---

## Rendering Model

The frontend uses the Next.js App Router:

```txt
frontend/app/jobs/page.tsx
frontend/app/jobs/[slug]/page.tsx
frontend/app/sitemap.xml/route.ts
frontend/app/robots.txt/route.ts
```

`/jobs` and `/jobs/[slug]` are dynamic server-rendered routes. Job data is fetched server-side from the backend API, so crawlers receive meaningful HTML without needing client-side JavaScript to load the job title, company, salary, or description.

---

## Metadata

### Job Listing Page

`/jobs` defines static App Router metadata:

- title
- meta description
- canonical URL using `FRONTEND_SITE_URL`
- Open Graph title
- Open Graph description
- Open Graph URL

### Job Detail Pages

`/jobs/[slug]` uses `generateMetadata` to fetch the job by slug and render:

- title: `{job.title} at {job.company.name} | SearchOps`
- meta description from real job title, company, location, salary, and employment type fields
- canonical URL: `{FRONTEND_SITE_URL}/jobs/{job.slug}`
- Open Graph title
- Open Graph description
- Open Graph URL

No unavailable job fields are fabricated for metadata.

---

## JobPosting JSON-LD

Each job detail page embeds:

```html
<script type="application/ld+json">...</script>
```

The JSON-LD uses only fields returned by the backend:

- `title`
- `description`
- `datePosted`
- `validThrough` when available
- `employmentType`
- `hiringOrganization.name`
- `hiringOrganization.sameAs` when `company.websiteUrl` is available
- `jobLocation.address.addressLocality` from `job.location`
- `baseSalary` when `salaryMin` or `salaryMax` exists

Salary currency is always `AUD`, matching the Australian seed data and API contract.

---

## Sitemap

`GET /sitemap.xml` is implemented in the frontend as an App Router route handler.

It includes:

- `/jobs`
- job detail URLs fetched from `GET /api/jobs?limit=100`

All URLs are absolute and use `FRONTEND_SITE_URL`.

---

## Robots.txt

`GET /robots.txt` is implemented in the frontend as an App Router route handler.

Current output:

```txt
User-agent: *
Allow: /

Sitemap: http://localhost:3000/sitemap.xml
```

The route allows public pages and does not block `/jobs` or `/jobs/[slug]`.

---

## Crawlability Checklist

- [x] Slug-based job detail URLs
- [x] Server-rendered job listing HTML
- [x] Server-rendered job detail HTML
- [x] Dynamic title and meta description for job detail pages
- [x] Canonical URLs for listing and detail pages
- [x] Open Graph metadata for listing and detail pages
- [x] JobPosting JSON-LD on detail pages
- [x] Sitemap with listing and job detail URLs
- [x] Robots.txt referencing the sitemap
- [x] No dependency on `/api/jobs/search`

---

## Out of Scope for Phase 4

Phase 4 deliberately does not add analytics, event tracking, observability, A/B testing, authentication, dashboards, backend API changes, or generated company/logo assets.
