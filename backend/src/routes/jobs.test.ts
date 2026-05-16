import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../db/prisma.js';

const app = createApp();

describe('GET /api/jobs', () => {
  it('should return seeded jobs with pagination metadata', async () => {
    const res = await request(app).get('/api/jobs').expect(200);

    expect(res.body).toEqual({
      data: {
        jobs: expect.any(Array),
        pagination: expect.objectContaining({
          page: 1,
          limit: 20,
          total: expect.any(Number),
          totalPages: expect.any(Number),
          hasNextPage: expect.any(Boolean),
          hasPreviousPage: false,
        }),
      },
      meta: expect.objectContaining({
        timestamp: expect.any(String),
        requestId: expect.any(String),
      }),
    });
    expect(res.body.data.jobs.length).toBeLessThanOrEqual(20);
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(22);
  });

  it('should search relevant seeded backend jobs', async () => {
    const res = await request(app).get('/api/jobs?q=backend').expect(200);
    const slugs = res.body.data.jobs.map((job: any) => job.slug);

    expect(slugs).toContain('backend-software-engineer-melbourne-seek');
    expect(res.body.data.pagination.total).toBeGreaterThan(0);
  });

  it('should filter by location', async () => {
    const res = await request(app)
      .get('/api/jobs?location=Melbourne')
      .expect(200);

    expect(res.body.data.jobs.length).toBeGreaterThan(0);
    expect(
      res.body.data.jobs.every((job: any) =>
        job.location.toLowerCase().includes('melbourne'),
      ),
    ).toBe(true);
  });

  it('should filter by workMode', async () => {
    const res = await request(app).get('/api/jobs?workMode=HYBRID').expect(200);

    expect(res.body.data.jobs.length).toBeGreaterThan(0);
    expect(res.body.data.jobs.every((job: any) => job.workMode === 'HYBRID')).toBe(
      true,
    );
  });

  it('should filter by category', async () => {
    const res = await request(app)
      .get('/api/jobs?category=SOFTWARE_ENGINEERING')
      .expect(200);

    expect(res.body.data.jobs.length).toBeGreaterThan(0);
    expect(
      res.body.data.jobs.every(
        (job: any) => job.category === 'SOFTWARE_ENGINEERING',
      ),
    ).toBe(true);
  });

  it('should filter by employmentType', async () => {
    const res = await request(app)
      .get('/api/jobs?employmentType=FULL_TIME')
      .expect(200);

    expect(res.body.data.jobs.length).toBeGreaterThan(0);
    expect(
      res.body.data.jobs.every(
        (job: any) => job.employmentType === 'FULL_TIME',
      ),
    ).toBe(true);
  });

  it('should filter by company name or slug', async () => {
    const res = await request(app).get('/api/jobs?company=seek').expect(200);

    expect(res.body.data.jobs.length).toBeGreaterThan(0);
    expect(
      res.body.data.jobs.every(
        (job: any) =>
          job.company.slug === 'seek' ||
          job.company.name.toLowerCase().includes('seek'),
      ),
    ).toBe(true);
  });

  it('should filter salary ranges by lower bound', async () => {
    const res = await request(app).get('/api/jobs?salaryMin=120000').expect(200);

    expect(res.body.data.jobs.length).toBeGreaterThan(0);
    expect(
      res.body.data.jobs.every(
        (job: any) => job.salaryMax !== null && job.salaryMax >= 120000,
      ),
    ).toBe(true);
  });

  it('should return correct pagination metadata for page 2', async () => {
    const res = await request(app)
      .get('/api/jobs?page=2&limit=5')
      .expect(200);

    const pagination = res.body.data.pagination;

    expect(res.body.data.jobs).toHaveLength(5);
    expect(pagination.page).toBe(2);
    expect(pagination.limit).toBe(5);
    expect(pagination.total).toBeGreaterThanOrEqual(22);
    expect(pagination.totalPages).toBe(Math.ceil(pagination.total / 5));
    expect(pagination.hasNextPage).toBe(true);
    expect(pagination.hasPreviousPage).toBe(true);
  });

  it.each([
    ['/api/jobs?page=0', 'page'],
    ['/api/jobs?limit=101', 'limit'],
    ['/api/jobs?workMode=FLEXIBLE', 'workMode'],
    ['/api/jobs?category=ENGINEERING', 'category'],
    ['/api/jobs?employmentType=PERMANENT', 'employmentType'],
    ['/api/jobs?salaryMin=-1', 'salaryMin'],
    ['/api/jobs?salaryMin=130000&salaryMax=120000', 'salaryMax'],
  ])('should return 400 VALIDATION_ERROR for invalid %s', async (url, field) => {
    const res = await request(app).get(url).expect(400);

    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameter',
        details: expect.arrayContaining([
          expect.objectContaining({
            field,
          }),
        ]),
      },
      meta: expect.objectContaining({
        timestamp: expect.any(String),
        requestId: expect.any(String),
      }),
    });
  });
});

describe('GET /api/jobs/:slug', () => {
  it('should return the expected seeded job with company', async () => {
    const res = await request(app)
      .get('/api/jobs/backend-software-engineer-melbourne-seek')
      .expect(200);

    expect(res.body).toEqual({
      data: expect.objectContaining({
        title: 'Backend Software Engineer',
        slug: 'backend-software-engineer-melbourne-seek',
        description: expect.any(String),
        location: 'Melbourne, VIC',
        category: 'SOFTWARE_ENGINEERING',
        workMode: 'HYBRID',
        employmentType: 'FULL_TIME',
        salaryMin: 110000,
        salaryMax: 145000,
        datePosted: '2026-05-01T00:00:00.000Z',
        validThrough: '2026-06-14T00:00:00.000Z',
        company: expect.objectContaining({
          name: 'SEEK',
          slug: 'seek',
          websiteUrl: 'https://www.seek.com.au',
        }),
      }),
      meta: expect.objectContaining({
        timestamp: expect.any(String),
        requestId: expect.any(String),
      }),
    });
  });

  it('should return 404 NOT_FOUND for an unknown slug', async () => {
    const res = await request(app).get('/api/jobs/unknown-slug').expect(404);

    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Job not found',
        details: [],
      },
      meta: expect.objectContaining({
        timestamp: expect.any(String),
        requestId: expect.any(String),
      }),
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
