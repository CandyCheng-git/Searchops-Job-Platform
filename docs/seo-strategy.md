# SEO Strategy

## SEO Thesis

Job listings are high-intent, long-tail search queries ("senior python engineer remote"). By making job detail pages **crawlable, canonical, and richly structured**, we can capture organic traffic and drive qualified views.

---

## On-Page SEO

### Job Listing Page (`/jobs`)

**Meta Tags:**
```html
<title>Job Listings | SearchOps</title>
<meta name="description" content="Search 500+ tech jobs. Filter by role, location, and level. Apply now.">
<meta name="robots" content="index, follow">
<meta name="canonical" href="https://searchops.io/jobs">
```

**Open Graph (for social sharing):**
```html
<meta property="og:title" content="Job Listings | SearchOps">
<meta property="og:description" content="Search 500+ tech jobs.">
<meta property="og:image" content="https://searchops.io/og-image-jobs.jpg">
<meta property="og:url" content="https://searchops.io/jobs">
```

### Job Detail Page (`/jobs/:id`)

**Dynamic Meta Tags (server-rendered):**
```html
<title>Senior Backend Engineer at Acme Corp | SearchOps</title>
<meta name="description" content="Senior Backend Engineer role at Acme Corp in San Francisco. $150k-$200k. Requirements: Node.js, PostgreSQL, 5+ years experience.">
<meta name="robots" content="index, follow">
<meta name="canonical" href="https://searchops.io/jobs/job_123">

<!-- Open Graph -->
<meta property="og:title" content="Senior Backend Engineer at Acme Corp">
<meta property="og:description" content="Remote, Senior role. $150k-$200k.">
<meta property="og:image" content="https://searchops.io/og-image-job.jpg">
<meta property="og:url" content="https://searchops.io/jobs/job_123">
```

**Key Principles:**
- Title: Include job title, company, "SearchOps"
- Description: Include role, location, salary range, key requirements (max 160 chars)
- Canonical: Always point to the job's unique URL to avoid duplicate content issues
- No trailing slashes (standardize to `/jobs/id`, not `/jobs/id/`)

---

## Structured Data (JSON-LD)

### JobPosting Schema

Embed `JobPosting` schema on every job detail page for Google, LinkedIn, and job aggregators.

**Example:**
```json
{
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  "title": "Senior Backend Engineer",
  "description": "Full HTML description of the role...",
  "identifier": {
    "@type": "PropertyValue",
    "name": "SearchOps Job ID",
    "value": "job_123"
  },
  "datePosted": "2026-05-10",
  "dateExpires": "2026-06-10",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "Acme Corp",
    "sameAs": "https://acme.com",
    "logo": "https://acme.com/logo.png"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "",
      "addressLocality": "San Francisco",
      "addressRegion": "CA",
      "addressCountry": "US"
    }
  },
  "baseSalary": {
    "@type": "PriceSpecification",
    "priceCurrency": "USD",
    "price": "150000-200000",
    "priceComponent": [
      {
        "@type": "PriceComponentType",
        "priceCurrency": "USD",
        "priceComponent": "150000",
        "name": "minimum"
      },
      {
        "@type": "PriceComponentType",
        "priceCurrency": "USD",
        "priceComponent": "200000",
        "name": "maximum"
      }
    ]
  },
  "validThrough": "2026-06-10T00:00:00Z"
}
```

**Test with:** [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## Sitemaps

### XML Sitemap

**Route:** `GET /sitemap.xml`

**Purpose:** Tell Google about all indexable pages.

**Content (daily update):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://searchops.io/</loc>
    <lastmod>2026-05-10</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://searchops.io/jobs</loc>
    <lastmod>2026-05-10</lastmod>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://searchops.io/jobs/job_123</loc>
    <lastmod>2026-05-10</lastmod>
    <priority>0.8</priority>
  </url>
  <!-- ... more job pages ... -->
</urlset>
```

**Implementation:**
```typescript
// backend/src/routes/sitemap.ts
router.get('/sitemap.xml', async (req, res) => {
  const jobs = await prisma.job.findMany({
    where: { expiresAt: { gt: new Date() } },
    select: { id: true, updatedAt: true },
  });

  const urls = [
    { loc: 'https://searchops.io/', priority: 1.0 },
    { loc: 'https://searchops.io/jobs', priority: 0.9 },
    ...jobs.map(job => ({
      loc: `https://searchops.io/jobs/${job.id}`,
      lastmod: job.updatedAt.toISOString().split('T')[0],
      priority: 0.8,
    })),
  ];

  const xml = buildSitemap(urls);
  res.type('application/xml').send(xml);
});
```

### Sitemap Index (Future)

When >50k job pages exist, split into multiple sitemaps:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://searchops.io/sitemap-jobs-1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://searchops.io/sitemap-jobs-2.xml</loc>
  </sitemap>
</sitemapindex>
```

---

## Robots.txt

**Route:** `GET /robots.txt`

**Content:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://searchops.io/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 2
```

**Implementation:**
```typescript
router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://searchops.io/sitemap.xml`);
});
```

---

## Server-Side Rendering (SSR)

### Job Detail Page

**Why SSR?** Google crawlers can fetch fully-rendered HTML without executing JavaScript.

**Next.js implementation:**
```typescript
// frontend/pages/jobs/[id].tsx
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const jobId = params?.id as string;

  // Fetch job data server-side
  const job = await fetch(`${process.env.API_URL}/api/jobs/${jobId}`).then(r => r.json());

  if (!job.data) {
    return { notFound: true };
  }

  return {
    props: { job: job.data },
    revalidate: 3600, // ISR: revalidate every hour
  };
};

export default function JobDetail({ job }) {
  return (
    <>
      <Head>
        <title>{job.title} at {job.company} | SearchOps</title>
        <meta name="description" content={`${job.title} role at ${job.company} in ${job.location}. ${job.salaryMin}-${job.salaryMax}`} />
        <link rel="canonical" href={`https://searchops.io/jobs/${job.id}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJobPosting(job)) }}
        />
      </Head>
      <JobDetailContent job={job} />
    </>
  );
}
```

---

## Dynamic Rendering (Fallback for Old Crawlers)

If Next.js SSR is too slow for some crawlers, implement prerendering:

```typescript
// Prerender top 100 jobs at build time
export const getStaticPaths = async () => {
  const jobs = await fetch(`${process.env.API_URL}/api/jobs?limit=100`)
    .then(r => r.json())
    .then(d => d.data.jobs);

  return {
    paths: jobs.map(job => ({
      params: { id: job.id },
    })),
    fallback: 'blocking', // SSR for jobs not prerendered
  };
};
```

---

## Crawlability Checklist

- [x] All job pages return HTTP 200 (no 302 redirects, no meta noindex)
- [x] Pages include `<title>` and `<meta name="description">`
- [x] Canonical URL is set to prevent duplicate content signals
- [x] JobPosting JSON-LD present on detail pages
- [x] No JavaScript required to see job title, description, salary
- [x] Sitemap.xml updated daily with all active jobs
- [x] robots.txt allows crawling of job pages
- [x] Image alt text present (for company logos, if any)

---

## Google Search Console Setup

1. **Verify ownership:** Add DNS TXT record or HTML file
2. **Submit sitemap:** Add `https://searchops.io/sitemap.xml`
3. **Monitor:** Check Coverage, Core Web Vitals, Mobile Usability
4. **Rich Results:** Validate JobPosting schema in Rich Results Test

---

## Link Building (Out of Scope v1)

Future opportunities:
- Job aggregator listings (Indeed, LinkedIn)
- Tech blog backlinks to hiring guides
- Company websites linking to their SearchOps jobs page

---

## Expected SEO Impact (Estimates)

| Metric | Baseline | Target (6 months) |
|--------|----------|------------------|
| Indexed pages | 0 | 500+ |
| Organic sessions/month | 0 | 5,000+ |
| Avg. ranking position | — | Position 3-5 for long-tail queries |
| Click-through rate (CTR) | — | 10-20% from SERP |
| Conversion rate (view → apply) | — | 5-10% |

---

## Monitoring

### Page Load Speed (Core Web Vitals)

- **LCP (Largest Contentful Paint):** Target <2.5s
- **FID (First Input Delay):** Target <100ms
- **CLS (Cumulative Layout Shift):** Target <0.1

Monitor in Google Search Console and use Lighthouse CI in GitHub Actions.

### Query Performance Impact on SEO

If search API latency > 800ms, job listing page will fail Core Web Vitals. Monitor and alert.
