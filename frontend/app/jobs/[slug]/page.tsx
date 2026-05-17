import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJobBySlugOrNull } from '../../../lib/api';
import { formatDate, formatEnumLabel, formatSalary } from '../../../lib/format';
import {
  buildJobCanonicalUrl,
  buildJobMetaDescription,
  buildJobPageTitle,
  buildJobPostingJsonLd,
  serializeJsonLd,
} from '../../../lib/seo';

interface JobDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlugOrNull(slug);

  if (!job) {
    return {
      title: 'Job not found | SearchOps',
    };
  }

  const title = buildJobPageTitle(job);
  const description = buildJobMetaDescription(job);
  const canonical = buildJobCanonicalUrl(job);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const job = await getJobBySlugOrNull(slug);

  if (!job) {
    notFound();
  }

  const jsonLd = buildJobPostingJsonLd(job);

  return (
    <main className="page-shell">
      <nav className="detail-nav" aria-label="Job navigation">
        <Link href="/jobs">Back to jobs</Link>
      </nav>

      <section className="detail-header" aria-labelledby="job-heading">
        <p className="eyebrow">{job.company.name}</p>
        <h1 className="detail-title" id="job-heading">
          {job.title}
        </h1>
        <p className="detail-company">
          {job.location} · {formatEnumLabel(job.workMode)} ·{' '}
          {formatEnumLabel(job.employmentType)}
        </p>
        <div className="meta-row" aria-label={`${job.title} details`}>
          <span className="tag">{formatEnumLabel(job.category)}</span>
          <span className="tag salary">{formatSalary(job)}</span>
          <span className="tag">Posted {formatDate(job.datePosted)}</span>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-panel">
          <h2>Role overview</h2>
          <p>{job.description}</p>
        </article>

        <aside className="detail-panel" aria-label="Job facts">
          <dl className="facts">
            <div className="fact">
              <dt>Company</dt>
              <dd>{job.company.name}</dd>
            </div>
            <div className="fact">
              <dt>Location</dt>
              <dd>{job.location}</dd>
            </div>
            <div className="fact">
              <dt>Salary</dt>
              <dd>{formatSalary(job)}</dd>
            </div>
            <div className="fact">
              <dt>Valid through</dt>
              <dd>{formatDate(job.validThrough)}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        type="application/ld+json"
      />
    </main>
  );
}
