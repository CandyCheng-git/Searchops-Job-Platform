import { render, screen } from '@testing-library/react';
import type { Metadata } from 'next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JobsPage from '../app/jobs/page';
import JobDetailPage, {
  generateMetadata,
} from '../app/jobs/[slug]/page';
import { GET as getRobots } from '../app/robots.txt/route';
import { GET as getSitemap } from '../app/sitemap.xml/route';

const job = {
  id: 'clxjob001',
  title: 'Backend Software Engineer',
  slug: 'backend-software-engineer-melbourne-seek',
  description:
    'Build scalable backend services for job search, structured data, and marketplace reliability.',
  location: 'Melbourne, VIC',
  category: 'SOFTWARE_ENGINEERING',
  workMode: 'HYBRID',
  employmentType: 'FULL_TIME',
  salaryMin: 110000,
  salaryMax: 145000,
  datePosted: '2026-05-01T00:00:00.000Z',
  validThrough: '2026-06-14T00:00:00.000Z',
  company: {
    id: 'clxcompany001',
    name: 'SEEK',
    slug: 'seek',
    websiteUrl: 'https://www.seek.com.au',
  },
};

function mockJobsResponse() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          jobs: [job],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        meta: {
          timestamp: '2026-05-11T06:30:00.000Z',
          requestId: 'req_test',
        },
      }),
    }),
  );
}

function mockJobDetailResponse() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: job,
        meta: {
          timestamp: '2026-05-11T06:30:00.000Z',
          requestId: 'req_test',
        },
      }),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('job pages', () => {
  it('renders the /jobs listing page with jobs from the backend API', async () => {
    mockJobsResponse();

    render(await JobsPage());

    expect(
      screen.getByRole('heading', { name: 'Tech jobs in Australia' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Backend Software Engineer')).toBeInTheDocument();
    expect(screen.getByText(/SEEK/)).toBeInTheDocument();
    expect(screen.getByText('AUD 110,000-145,000')).toBeInTheDocument();
  });

  it('renders the /jobs/[slug] detail page with JobPosting JSON-LD', async () => {
    mockJobDetailResponse();

    const { container } = render(
      await JobDetailPage({
        params: Promise.resolve({ slug: job.slug }),
      }),
    );

    expect(
      screen.getByRole('heading', { name: 'Backend Software Engineer' }),
    ).toBeInTheDocument();
    expect(screen.getByText(job.description)).toBeInTheDocument();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"JobPosting"');
    expect(script?.textContent).toContain('"currency":"AUD"');
    expect(script?.textContent).toContain('"minValue":110000');
  });

  it('generates canonical and Open Graph metadata for a job detail page', async () => {
    mockJobDetailResponse();

    const metadata = (await generateMetadata({
      params: Promise.resolve({ slug: job.slug }),
    })) as Metadata;

    expect(metadata.title).toBe(
      'Backend Software Engineer at SEEK | SearchOps',
    );
    expect(metadata.description).toContain('Backend Software Engineer');
    expect(metadata.alternates?.canonical).toBe(
      'http://localhost:3000/jobs/backend-software-engineer-melbourne-seek',
    );
    expect(metadata.openGraph?.title).toBe(
      'Backend Software Engineer at SEEK | SearchOps',
    );
    expect(metadata.openGraph?.url).toBe(
      'http://localhost:3000/jobs/backend-software-engineer-melbourne-seek',
    );
  });

  it('serves sitemap.xml with /jobs and job detail URLs', async () => {
    mockJobsResponse();

    const response = await getSitemap();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('http://localhost:3000/jobs');
    expect(body).toContain(
      'http://localhost:3000/jobs/backend-software-engineer-melbourne-seek',
    );
  });

  it('serves robots.txt with a sitemap reference', async () => {
    const response = getRobots();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('Allow: /');
    expect(body).toContain('Sitemap: http://localhost:3000/sitemap.xml');
  });
});
