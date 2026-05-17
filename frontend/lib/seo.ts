import type { JobDetail } from './api';
import { absoluteUrl } from './config';
import { formatEnumLabel, formatSalary } from './format';

function compactText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function truncate(value: string, maxLength: number): string {
  const text = compactText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trim()}...`;
}

export function buildJobPageTitle(job: JobDetail): string {
  return `${job.title} at ${job.company.name} | SearchOps`;
}

export function buildJobMetaDescription(job: JobDetail): string {
  const salary = formatSalary(job);
  const employmentType = formatEnumLabel(job.employmentType);

  return truncate(
    `${job.title} role at ${job.company.name} in ${job.location}. ${salary}. ${employmentType}.`,
    155,
  );
}

export function buildJobCanonicalUrl(job: JobDetail): string {
  return absoluteUrl(`/jobs/${job.slug}`);
}

export function buildJobPostingJsonLd(job: JobDetail) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.datePosted,
    employmentType: job.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.name,
      ...(job.company.websiteUrl ? { sameAs: job.company.websiteUrl } : {}),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    },
  };

  if (job.validThrough) {
    schema.validThrough = job.validThrough;
  }

  if (job.salaryMin !== null || job.salaryMax !== null) {
    const value: Record<string, unknown> = {
      '@type': 'QuantitativeValue',
    };

    if (job.salaryMin !== null) {
      value.minValue = job.salaryMin;
    }

    if (job.salaryMax !== null) {
      value.maxValue = job.salaryMax;
    }

    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'AUD',
      value,
    };
  }

  return schema;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
