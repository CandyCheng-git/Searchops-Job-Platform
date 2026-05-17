import { absoluteUrl } from '../../lib/config';

export const dynamic = 'force-dynamic';

export function GET() {
  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${absoluteUrl('/sitemap.xml')}
`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  );
}
