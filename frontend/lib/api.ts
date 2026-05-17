import { getBackendApiUrl } from './config';

export interface Company {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
}

export interface JobListItem {
  id: string;
  title: string;
  slug: string;
  location: string;
  category: string;
  workMode: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  datePosted: string;
  validThrough: string | null;
  company: Company;
}

export interface JobDetail extends JobListItem {
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

export interface JobsListData {
  jobs: JobListItem[];
  pagination: Pagination;
}

interface ApiEnvelope<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export class ApiFetchError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiFetchError';
  }
}

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${getBackendApiUrl()}${path}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiFetchError(
      response.status,
      `Backend request failed for ${path}`,
    );
  }

  const body = (await response.json()) as ApiEnvelope<T>;

  return body.data;
}

export async function getJobs(options: { limit?: number } = {}) {
  const params = new URLSearchParams();

  if (options.limit) {
    params.set('limit', String(options.limit));
  }

  const query = params.toString();

  return fetchApi<JobsListData>(`/api/jobs${query ? `?${query}` : ''}`);
}

export async function getJobBySlug(slug: string) {
  return fetchApi<JobDetail>(`/api/jobs/${encodeURIComponent(slug)}`);
}

export async function getJobBySlugOrNull(slug: string) {
  try {
    return await getJobBySlug(slug);
  } catch (error) {
    if (error instanceof ApiFetchError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
