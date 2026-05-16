import { EmploymentType, JobCategory, WorkMode } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  buildJobOrderBy,
  buildJobWhere,
  calculatePagination,
} from './jobService.js';
import type { JobSearchQuery } from '../validators/jobQuerySchema.js';

function buildQuery(overrides: Partial<JobSearchQuery>): JobSearchQuery {
  return {
    page: 1,
    limit: 20,
    sort: 'recent',
    ...overrides,
  };
}

describe('calculatePagination', () => {
  it('should calculate pagination metadata for populated pages', () => {
    expect(calculatePagination(2, 5, 22)).toEqual({
      page: 2,
      limit: 5,
      total: 22,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('should calculate pagination metadata for empty results', () => {
    expect(calculatePagination(1, 20, 0)).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});

describe('buildJobWhere', () => {
  it('should build no filters when no search parameters are provided', () => {
    expect(buildJobWhere(buildQuery({}))).toEqual({});
  });

  it('should build case-insensitive keyword search across job and company fields', () => {
    expect(buildJobWhere(buildQuery({ q: 'backend' }))).toEqual({
      AND: [
        {
          OR: [
            { title: { contains: 'backend', mode: 'insensitive' } },
            { description: { contains: 'backend', mode: 'insensitive' } },
            { location: { contains: 'backend', mode: 'insensitive' } },
            { company: { name: { contains: 'backend', mode: 'insensitive' } } },
            { company: { slug: { contains: 'backend', mode: 'insensitive' } } },
          ],
        },
      ],
    });
  });

  it('should build scalar and company filters', () => {
    expect(
      buildJobWhere(
        buildQuery({
          location: 'Melbourne',
          workMode: WorkMode.HYBRID,
          category: JobCategory.SOFTWARE_ENGINEERING,
          employmentType: EmploymentType.FULL_TIME,
          company: 'seek',
        }),
      ),
    ).toEqual({
      AND: [
        { location: { contains: 'Melbourne', mode: 'insensitive' } },
        { workMode: WorkMode.HYBRID },
        { category: JobCategory.SOFTWARE_ENGINEERING },
        { employmentType: EmploymentType.FULL_TIME },
        {
          company: {
            OR: [
              { name: { contains: 'seek', mode: 'insensitive' } },
              { slug: { contains: 'seek', mode: 'insensitive' } },
            ],
          },
        },
      ],
    });
  });

  it('should interpret salaryMin as jobs whose salaryMax meets the lower bound', () => {
    expect(buildJobWhere(buildQuery({ salaryMin: 120000 }))).toEqual({
      AND: [
        {
          salaryMax: {
            gte: 120000,
          },
        },
      ],
    });
  });

  it('should interpret salaryMax as jobs whose salaryMin meets the upper bound', () => {
    expect(buildJobWhere(buildQuery({ salaryMax: 140000 }))).toEqual({
      AND: [
        {
          salaryMin: {
            lte: 140000,
          },
        },
      ],
    });
  });

  it('should combine salary range filters for job-seeker range matching', () => {
    expect(
      buildJobWhere(buildQuery({ salaryMin: 120000, salaryMax: 150000 })),
    ).toEqual({
      AND: [
        {
          salaryMax: {
            gte: 120000,
          },
        },
        {
          salaryMin: {
            lte: 150000,
          },
        },
      ],
    });
  });
});

describe('buildJobOrderBy', () => {
  it('should default to recent jobs first', () => {
    expect(buildJobOrderBy('recent')).toEqual([
      { datePosted: 'desc' },
      { slug: 'asc' },
    ]);
  });

  it('should sort by salary descending', () => {
    expect(buildJobOrderBy('salary_desc')).toEqual([
      { salaryMax: { sort: 'desc', nulls: 'last' } },
      { datePosted: 'desc' },
      { slug: 'asc' },
    ]);
  });

  it('should sort by salary ascending', () => {
    expect(buildJobOrderBy('salary_asc')).toEqual([
      { salaryMin: { sort: 'asc', nulls: 'last' } },
      { datePosted: 'desc' },
      { slug: 'asc' },
    ]);
  });
});
