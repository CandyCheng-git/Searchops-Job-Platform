function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getBackendApiUrl(): string {
  return withoutTrailingSlash(
    process.env.BACKEND_API_URL ?? 'http://localhost:5000',
  );
}

export function getFrontendSiteUrl(): string {
  return withoutTrailingSlash(
    process.env.FRONTEND_SITE_URL ?? 'http://localhost:3000',
  );
}

export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${getFrontendSiteUrl()}${normalizedPath}`;
}
