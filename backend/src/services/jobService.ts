import type {
  EmploymentType,
  JobCategory,
  Prisma,
  WorkMode,
} from '@prisma/client';
import { HttpError } from '../errors/httpError.js';
import {
  JobRepository,
  type JobDetailRecord,
  type JobListRecord,
} from '../repositories/jobRepository.js';
import type { JobSearchQuery, JobSort } from '../validators/jobQuerySchema.js';

interface CompanyDto {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
}

interface JobListItemDto {
  id: string;
  title: string;
  slug: string;
  location: string;
  category: JobCategory;
  workMode: WorkMode;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  datePosted: string;
  validThrough: string | null;
  company: CompanyDto;
}

interface JobDetailDto extends JobListItemDto {
  description: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface JobSearchResult {
  jobs: JobListItemDto[];
  pagination: Pagination;
}

export function calculatePagination(
  page: number,
  limit: number,
  total: number,
): Pagination {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function buildJobWhere(query: JobSearchQuery): Prisma.JobWhereInput {
  const andFilters: Prisma.JobWhereInput[] = [];

  if (query.q) {
    andFilters.push({
      OR: [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { location: { contains: query.q, mode: 'insensitive' } },
        { company: { name: { contains: query.q, mode: 'insensitive' } } },
        { company: { slug: { contains: query.q, mode: 'insensitive' } } },
      ],
    });
  }

  if (query.location) {
    andFilters.push({
      location: {
        contains: query.location,
        mode: 'insensitive',
      },
    });
  }

  if (query.workMode) {
    andFilters.push({
      workMode: query.workMode,
    });
  }

  if (query.category) {
    andFilters.push({
      category: query.category,
    });
  }

  if (query.employmentType) {
    andFilters.push({
      employmentType: query.employmentType,
    });
  }

  if (query.company) {
    andFilters.push({
      company: {
        OR: [
          { name: { contains: query.company, mode: 'insensitive' } },
          { slug: { contains: query.company, mode: 'insensitive' } },
        ],
      },
    });
  }

  if (query.salaryMin !== undefined) {
    andFilters.push({
      salaryMax: {
        gte: query.salaryMin,
      },
    });
  }

  if (query.salaryMax !== undefined) {
    andFilters.push({
      salaryMin: {
        lte: query.salaryMax,
      },
    });
  }

  return andFilters.length > 0 ? { AND: andFilters } : {};
}

export function buildJobOrderBy(
  sort: JobSort,
): Prisma.JobOrderByWithRelationInput[] {
  if (sort === 'salary_desc') {
    return [
      { salaryMax: { sort: 'desc', nulls: 'last' } },
      { datePosted: 'desc' },
      { slug: 'asc' },
    ];
  }

  if (sort === 'salary_asc') {
    return [
      { salaryMin: { sort: 'asc', nulls: 'last' } },
      { datePosted: 'desc' },
      { slug: 'asc' },
    ];
  }

  return [{ datePosted: 'desc' }, { slug: 'asc' }];
}

function toCompanyDto(company: JobListRecord['company']): CompanyDto {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    websiteUrl: company.websiteUrl,
  };
}

function toJobListItemDto(job: JobListRecord): JobListItemDto {
  return {
    id: job.id,
    title: job.title,
    slug: job.slug,
    location: job.location,
    category: job.category,
    workMode: job.workMode,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    datePosted: job.datePosted.toISOString(),
    validThrough: job.validThrough?.toISOString() ?? null,
    company: toCompanyDto(job.company),
  };
}

function toJobDetailDto(job: JobDetailRecord): JobDetailDto {
  return {
    ...toJobListItemDto(job),
    description: job.description,
  };
}

export class JobService {
  constructor(private readonly jobRepository = new JobRepository()) {}

  async searchJobs(query: JobSearchQuery): Promise<JobSearchResult> {
    const where = buildJobWhere(query);
    const orderBy = buildJobOrderBy(query.sort);
    const skip = (query.page - 1) * query.limit;
    const { jobs, total } = await this.jobRepository.findJobs({
      where,
      orderBy,
      skip,
      take: query.limit,
    });

    return {
      jobs: jobs.map(toJobListItemDto),
      pagination: calculatePagination(query.page, query.limit, total),
    };
  }

  async getJobBySlug(slug: string): Promise<JobDetailDto> {
    const job = await this.jobRepository.findJobBySlug(slug);

    if (!job) {
      throw new HttpError(404, 'NOT_FOUND', 'Job not found');
    }

    return toJobDetailDto(job);
  }
}
