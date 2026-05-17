import type { Metadata } from 'next';
import Link from 'next/link';
import { getJobs } from '../../lib/api';
import { absoluteUrl } from '../../lib/config';
import { formatDate, formatEnumLabel, formatSalary } from '../../lib/format';

export const dynamic = 'force-dynamic';

const title = 'Tech Jobs | SearchOps';
const description =
  'Browse public SearchOps job listings across software, data, design, cloud, product, and security roles in Australia.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: absoluteUrl('/jobs'),
  },
  openGraph: {
    title,
    description,
    url: absoluteUrl('/jobs'),
  },
};

export default async function JobsPage() {
  const { jobs, pagination } = await getJobs();

  return (
    <main className="page-shell">
      <section className="listing-header" aria-labelledby="jobs-heading">
        <div>
          <p className="eyebrow">Public job listings</p>
          <h1 className="page-title" id="jobs-heading">
            Tech jobs in Australia
          </h1>
          <p className="page-intro">
            Current roles from the SearchOps demo dataset across engineering,
            analytics, product, design, cloud, and security teams.
          </p>
        </div>
        <div className="summary-pill">{pagination.total} open roles</div>
      </section>

      {jobs.length > 0 ? (
        <section className="job-list" aria-label="Job listings">
          {jobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div>
                <h2 className="job-card__title">
                  <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
                </h2>
                <p className="job-card__company">
                  {job.company.name} · {job.location} · Posted{' '}
                  {formatDate(job.datePosted)}
                </p>
                <div className="meta-row" aria-label={`${job.title} details`}>
                  <span className="tag">{formatEnumLabel(job.workMode)}</span>
                  <span className="tag">
                    {formatEnumLabel(job.employmentType)}
                  </span>
                  <span className="tag">{formatEnumLabel(job.category)}</span>
                  <span className="tag salary">{formatSalary(job)}</span>
                </div>
              </div>
              <Link className="button-link" href={`/jobs/${job.slug}`}>
                View role
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <p className="empty-state">No jobs are currently available.</p>
      )}
    </main>
  );
}
