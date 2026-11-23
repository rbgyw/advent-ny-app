type ResourceKind = 'image' | 'background' | 'font' | 'module' | 'navigation' | 'screen';
export type ResourceFailure = 'load' | 'decode' | 'timeout' | 'unexpected';

// Only deployed, fingerprinted static files have paths safe to share. Signed
// links, user uploads and inline content can contain credentials or personal data.
export function safeResourceUrl(source: string) {
  if (!source) return '[unknown URL]';
  try {
    const url = new URL(source, window.location.href);
    if (url.protocol === 'data:' || url.protocol === 'blob:') return `${url.protocol}[redacted]`;
    if (url.origin === window.location.origin && /^\/assets\/[\w.-]+-[\w-]{8}\.(?:avif|css|gif|jpe?g|js|png|svg|webp|woff2?)$/i.test(url.pathname)) {
      return `${url.origin}${url.pathname}`;
    }
  } catch { /* Malformed input may itself contain private data. */ }
  return '[redacted URL]';
}

export function reportResourceFailure(kind: ResourceKind, reason: ResourceFailure, source = '', critical = false) {
  const message = `[advent] ${critical ? 'critical' : 'optional'} ${kind} ${reason}: ${safeResourceUrl(source)}`;
  if (critical) console.error(message);
  else console.warn(message);
}

export function reportNavigationFailure(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const match = message.match(/^(?:Failed to fetch dynamically imported module:|Importing a module script failed\.|Unable to preload CSS for)\s*(\S+)?/i);
  reportResourceFailure(match ? 'module' : 'navigation', match ? 'load' : 'unexpected', match?.[1], true);
}
