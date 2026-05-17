import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page-shell">
      <h1 className="page-title">Job not found</h1>
      <p className="page-intro">
        The job page could not be found in the current SearchOps dataset.
      </p>
      <p>
        <Link className="button-link" href="/jobs">
          View jobs
        </Link>
      </p>
    </main>
  );
}
