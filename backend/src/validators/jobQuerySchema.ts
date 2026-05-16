import { EmploymentType, JobCategory, WorkMode } from '@prisma/client';
import { HttpError, type ApiErrorDetail } from '../errors/httpError.js';

export type JobSort = 'recent' | 'salary_desc' | 'salary_asc';

export interface JobSearchQuery {
  q?: string;
  location?: string;
  workMode?: WorkMode;
  category?: JobCategory;
  employmentType?: EmploymentType;
  company?: string;
  salaryMin?: number;
  salaryMax?: number;
  page: number;
  limit: number;
  sort: JobSort;
}

const maxLimit = 100;
const sortValues = ['recent', 'salary_desc', 'salary_asc'] as const;

function readSingleString(
  query: Record<string, unknown>,
  field: string,
  details: ApiErrorDetail[],
): string | undefined {
  const value = query[field];

  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    details.push({
      field,
      message: `${field} must be provided once`,
    });
    return undefined;
  }

  if (typeof value !== 'string') {
    details.push({
      field,
      message: `${field} must be a string`,
    });
    return undefined;
  }

  return value;
}

function parsePositiveInteger(
  query: Record<string, unknown>,
  field: string,
  defaultValue: number | undefined,
  details: ApiErrorDetail[],
): number | undefined {
  const rawValue = readSingleString(query, field, details);

  if (rawValue === undefined) {
    return defaultValue;
  }

  const trimmedValue = rawValue.trim();

  if (!/^[1-9]\d*$/.test(trimmedValue)) {
    details.push({
      field,
      message: `${field} must be a positive integer`,
    });
    return undefined;
  }

  return Number(trimmedValue);
}

function parseEnum<T extends string>(
  query: Record<string, unknown>,
  field: string,
  allowedValues: readonly T[],
  details: ApiErrorDetail[],
): T | undefined {
  const rawValue = readSingleString(query, field, details);

  if (rawValue === undefined) {
    return undefined;
  }

  const trimmedValue = rawValue.trim();

  if (!allowedValues.includes(trimmedValue as T)) {
    details.push({
      field,
      message: `${field} must be one of: ${allowedValues.join(', ')}`,
    });
    return undefined;
  }

  return trimmedValue as T;
}

function parseOptionalTrimmedString(
  query: Record<string, unknown>,
  field: string,
  details: ApiErrorDetail[],
): string | undefined {
  const rawValue = readSingleString(query, field, details);

  if (rawValue === undefined) {
    return undefined;
  }

  const trimmedValue = rawValue.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export function parseJobQuery(query: Record<string, unknown>): JobSearchQuery {
  const details: ApiErrorDetail[] = [];
  const q = parseOptionalTrimmedString(query, 'q', details);
  const keyword = parseOptionalTrimmedString(query, 'keyword', details);
  const page = parsePositiveInteger(query, 'page', 1, details);
  const limit = parsePositiveInteger(query, 'limit', 20, details);
  const salaryMin = parsePositiveInteger(query, 'salaryMin', undefined, details);
  const salaryMax = parsePositiveInteger(query, 'salaryMax', undefined, details);
  const sort = parseEnum(query, 'sort', sortValues, details) ?? 'recent';
  const location = parseOptionalTrimmedString(query, 'location', details);
  const workMode = parseEnum(
    query,
    'workMode',
    Object.values(WorkMode),
    details,
  );
  const category = parseEnum(
    query,
    'category',
    Object.values(JobCategory),
    details,
  );
  const employmentType = parseEnum(
    query,
    'employmentType',
    Object.values(EmploymentType),
    details,
  );
  const company = parseOptionalTrimmedString(query, 'company', details);

  if (limit !== undefined && limit > maxLimit) {
    details.push({
      field: 'limit',
      message: `limit must be less than or equal to ${maxLimit}`,
    });
  }

  if (
    salaryMin !== undefined &&
    salaryMax !== undefined &&
    salaryMax < salaryMin
  ) {
    details.push({
      field: 'salaryMax',
      message: 'salaryMax must be greater than or equal to salaryMin',
    });
  }

  if (details.length > 0) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'Invalid query parameter',
      details,
    );
  }

  return {
    q: q ?? keyword,
    location,
    workMode,
    category,
    employmentType,
    company,
    salaryMin,
    salaryMax,
    page: page ?? 1,
    limit: limit ?? 20,
    sort,
  };
}
