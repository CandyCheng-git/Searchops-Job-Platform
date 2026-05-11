import {
  EventType,
  ExperimentVariant,
  Prisma,
  type ExperimentAssignment,
} from '@prisma/client';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from './prisma.js';

const testAnonymousUserId = 'phase-2-prisma-test-user';
const testExperimentKey = 'apply_cta_copy_phase_2_test';

describe('Prisma data model integration', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany({
      where: {
        searchTerm: 'phase 2 prisma integration search',
      },
    });
    await prisma.experimentAssignment.deleteMany({
      where: {
        anonymousUserId: testAnonymousUserId,
        experimentKey: testExperimentKey,
      },
    });
  });

  afterAll(async () => {
    await prisma.event.deleteMany({
      where: {
        searchTerm: 'phase 2 prisma integration search',
      },
    });
    await prisma.experimentAssignment.deleteMany({
      where: {
        anonymousUserId: testAnonymousUserId,
        experimentKey: testExperimentKey,
      },
    });
    await prisma.$disconnect();
  });

  it('should have seeded companies', async () => {
    const companyCount = await prisma.company.count();

    expect(companyCount).toBeGreaterThanOrEqual(5);
  });

  it('should have seeded jobs', async () => {
    const jobCount = await prisma.job.count();

    expect(jobCount).toBeGreaterThanOrEqual(20);
  });

  it('should support one company having many jobs', async () => {
    const companies = await prisma.company.findMany({
      include: {
        jobs: true,
      },
    });

    expect(companies.some((company) => company.jobs.length > 1)).toBe(true);
  });

  it('should enforce unique job slugs', async () => {
    const jobs = await prisma.job.findMany({
      select: {
        slug: true,
      },
    });
    const uniqueSlugs = new Set(jobs.map((job) => job.slug));

    expect(uniqueSlugs.size).toBe(jobs.length);
  });

  it('should allow search events without a jobId', async () => {
    const event = await prisma.event.create({
      data: {
        eventType: EventType.SEARCH_PERFORMED,
        jobId: null,
        searchTerm: 'phase 2 prisma integration search',
        variant: ExperimentVariant.A,
      },
    });

    expect(event.jobId).toBeNull();
    expect(event.eventType).toBe(EventType.SEARCH_PERFORMED);
    expect(event.variant).toBe(ExperimentVariant.A);
  });

  it('should enforce one experiment variant per anonymous user and experiment key', async () => {
    const assignment: ExperimentAssignment =
      await prisma.experimentAssignment.create({
        data: {
          anonymousUserId: testAnonymousUserId,
          experimentKey: testExperimentKey,
          variant: ExperimentVariant.A,
        },
      });

    expect(assignment.variant).toBe(ExperimentVariant.A);

    await expect(
      prisma.experimentAssignment.create({
        data: {
          anonymousUserId: testAnonymousUserId,
          experimentKey: testExperimentKey,
          variant: ExperimentVariant.B,
        },
      }),
    ).rejects.toMatchObject<Partial<Prisma.PrismaClientKnownRequestError>>({
      code: 'P2002',
    });
  });
});
