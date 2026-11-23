import { describe, expect, it, vi } from 'vitest';
import { reportNavigationFailure, safeResourceUrl } from '../src/utils/resource-diagnostics';

describe('screen resource diagnostics', () => {
  it('keeps the public Vite asset URL and strips credentials, query and fragment', () => {
    const { protocol, host, origin } = window.location;
    expect(safeResourceUrl(`${protocol}//user:password@${host}/assets/calendar-aBcDe123.svg?token=secret#private`))
      .toBe(`${origin}/assets/calendar-aBcDe123.svg`);
  });

  it('redacts user paths, external hosts and inline data', () => {
    expect(safeResourceUrl('/storage/v1/object/sign/photos/user@example.com.webp?token=secret')).toBe('[redacted URL]');
    expect(safeResourceUrl('https://uploads.example.com/assets/private-aBcDe123.svg')).toBe('[redacted URL]');
    expect(safeResourceUrl('data:image/svg+xml,<svg>user@example.com</svg>')).toBe('data:[redacted]');
    expect(safeResourceUrl(`blob:${window.location.origin}/user@example.com`)).toBe('blob:[redacted]');
  });

  it('records an unexpected navigation failure without logging the raw error', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      reportNavigationFailure(new Error('Unexpected response from /auth?email=user@example.com'));
      expect(log).toHaveBeenCalledWith('[advent] critical navigation unexpected: [unknown URL]');
    } finally {
      log.mockRestore();
    }
  });
});
