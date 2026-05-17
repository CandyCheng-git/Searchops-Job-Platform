import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SearchOps Jobs',
    template: '%s',
  },
  description: 'Public SearchOps job pages for Australian technology roles.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="site-header__inner">
            <Link className="brand" href="/jobs">
              SearchOps
            </Link>
            <nav aria-label="Primary navigation">
              <Link className="nav-link" href="/jobs">
                Jobs
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
