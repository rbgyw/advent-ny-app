export function collectionRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a collection item');
  }
  return value as Record<string, unknown>;
}

export function collectionText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function collectionImage(value: unknown, source: URL) {
  const path = collectionText(value);
  if (!path) return undefined;
  const url = new URL(path, source);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Expected a public image URL');
  }
  return url.href;
}
