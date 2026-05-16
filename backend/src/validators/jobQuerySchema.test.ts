import { EmploymentType, JobCategory, WorkMode } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { HttpError } from '../errors/httpError.js';
import { parseJobQuery } from './jobQuerySchema.js';

describe('parseJobQuery', () => {
  it('should default pagination and sorting', () => {
    const query = parseJobQuery({});

    expect(query).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 20,
        sort: 'recent',
      }),
    );
  });

  it('should trim q and string filters', () => {
    const query = parseJobQuery({
      q: '  backend  ',
      location: '  Melbourne  ',
      company: '  seek  ',
    });

    expect(query.q).toBe('backend');
    expect(query.location).toBe('Melbourne');
    expect(query.company).toBe('seek');
  });

  it('should treat empty q and keyword as no keyword search', () => {
    const query = parseJobQuery({
      q: '   ',
      keyword: '   ',
    });

    expect(query.q).toBeUndefined();
  });

  it('should support keyword as an alias for q', () => {
    const query = parseJobQuery({
      keyword: 'backend',
    });

    expect(query.q).toBe('backend');
  });

  it('should prefer q when q and keyword are both provided', () => {
    const query = parseJobQuery({
      q: 'frontend',
      keyword: 'backend',
    });

    expect(query.q).toBe('frontend');
  });

  it('should parse enum filters and salary filters', () => {
    const query = parseJobQuery({
      workMode: WorkMode.HYBRID,
      category: JobCategory.SOFTWARE_ENGINEERING,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: '120000',
      salaryMax: '160000',
      page: '2',
      limit: '10',
      sort: 'salary_desc',
    });

    expect(query).toEqual(
      expect.objectContaining({
        workMode: WorkMode.HYBRID,
        category: JobCategory.SOFTWARE_ENGINEERING,
        employmentType: EmploymentType.FULL_TIME,
        salaryMin: 120000,
        salaryMax: 160000,
        page: 2,
        limit: 10,
        sort: 'salary_desc',
      }),
    );
  });

  it.each([
    [{ page: '0' }, 'page'],
    [{ page: '1.5' }, 'page'],
    [{ limit: '0' }, 'limit'],
    [{ limit: '101' }, 'limit'],
    [{ workMode: 'FLEXIBLE' }, 'workMode'],
    [{ category: 'ENGINEERING' }, 'category'],
    [{ employmentType: 'PERMANENT' }, 'employmentType'],
    [{ salaryMin: '-1' }, 'salaryMin'],
    [{ salaryMax: '100000', salaryMin: '120000' }, 'salaryMax'],
    [{ sort: 'relevance' }, 'sort'],
  ])('should reject invalid %s', (rawQuery, field) => {
    expect(() => parseJobQuery(rawQuery)).toThrow(HttpError);

    try {
      parseJobQuery(rawQuery);
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({
            field,
          }),
        ]),
      });
    }
  });
});
