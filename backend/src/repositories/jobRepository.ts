import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export const jobListSelect = {
  id: true,
  title: true,
  slug: true,
  location: true,
  category: true,
  workMode: true,
  employmentType: true,
  salaryMin: true,
  salaryMax: true,
  datePosted: true,
  validThrough: true,
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
      websiteUrl: true,
    },
  },
} satisfies Prisma.JobSelect;

export const jobDetailSelect = {
  ...jobListSelect,
  description: true,
} satisfies Prisma.JobSelect;

export type JobListRecord = Prisma.JobGetPayload<{
  select: typeof jobListSelect;
}>;

export type JobDetailRecord = Prisma.JobGetPayload<{
  select: typeof jobDetailSelect;
}>;

export interface FindJobsInput {
  where: Prisma.JobWhereInput;
  orderBy: Prisma.JobOrderByWithRelationInput[];
  skip: number;
  take: number;
}

export class JobRepository {
  async findJobs(input: FindJobsInput): Promise<{
    jobs: JobListRecord[];
    total: number;
  }> {
    const [jobs, total] = await prisma.$transaction([
      prisma.job.findMany({
        where: input.where,
        orderBy: input.orderBy,
        skip: input.skip,
        take: input.take,
        select: jobListSelect,
      }),
      prisma.job.count({
        where: input.where,
      }),
    ]);

    return { jobs, total };
  }

  async findJobBySlug(slug: string): Promise<JobDetailRecord | null> {
    return prisma.job.findUnique({
      where: {
        slug,
      },
      select: jobDetailSelect,
    });
  }
}
