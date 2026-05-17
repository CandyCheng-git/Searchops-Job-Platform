import type { JobListItem } from './api';

const salaryFormatter = new Intl.NumberFormat('en-AU', {
  maximumFractionDigits: 0,
});

export function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

export function formatSalary(job: Pick<JobListItem, 'salaryMin' | 'salaryMax'>) {
  if (job.salaryMin !== null && job.salaryMax !== null) {
    return `AUD ${salaryFormatter.format(job.salaryMin)}-${salaryFormatter.format(
      job.salaryMax,
    )}`;
  }

  if (job.salaryMin !== null) {
    return `AUD ${salaryFormatter.format(job.salaryMin)}+`;
  }

  if (job.salaryMax !== null) {
    return `Up to AUD ${salaryFormatter.format(job.salaryMax)}`;
  }

  return 'Salary not listed';
}

export function formatDate(value: string | null): string {
  if (!value) {
    return 'Not listed';
  }

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
