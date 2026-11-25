// @vitest-environment node
import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthEmailPolicyHandler } from '../supabase/functions/auth-email-policy/handler';

const userId = '10000000-0000-4000-8000-000000000001';
const signupKey = Buffer.alloc(32, 17).toString('base64');
const tokenKey = Buffer.alloc(32, 29).toString('base64');
type Kind = 'signup' | 'token';
function event(kind: Kind, email: unknown = 'qa@geropharm.com') {
  return kind === 'signup' ? { metadata: { name: 'before-user-created' }, user: { id: userId, email } }
    : { user_id: userId, authentication_method: 'otp', claims: {
      sub: userId, email, role: 'authenticated', aud: 'authenticated', aal: 'aal1',
      iss: 'http://127.0.0.1/auth/v1', iat: 1, exp: 2, phone: '', is_anonymous: false,
      session_id: 'local-session', app_metadata: { provider: 'email' }, user_metadata: { test: true },
    } };
}
function signed(kind: Kind, body: unknown = event(kind), timestamp = new Date(), key = kind === 'signup' ? signupKey : tokenKey) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  const id = 'local-hook-event';
  const seconds = String(Math.floor(timestamp.getTime() / 1000));
  // Independent Node HMAC, using the Standard Webhooks wire format.
  const signature = createHmac('sha256', Buffer.from(key, 'base64')).update(`${id}.${seconds}.${raw}`).digest('base64');
  return new Request('https://supabase.example/functions/v1/auth-email-policy', {
    method: 'POST', body: raw, headers: {
      'Content-Type': 'application/json', 'webhook-id': id, 'webhook-timestamp': seconds, 'webhook-signature': `v1,${signature}`,
    },
  });
}
function handler(flag?: string, extra: Record<string, string | undefined> = {}) {
  const settings: Record<string, string | undefined> = {
    AUTH_EMAIL_SIGNUP_HOOK_SECRET: `v1,whsec_${signupKey}`, AUTH_EMAIL_TOKEN_HOOK_SECRET: `v1,whsec_${tokenKey}`,
    ENFORCE_CORPORATE_EMAIL: flag, ...extra,
  };
  return createAuthEmailPolicyHandler(name => settings[name]);
}
beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live networking forbidden'); })));

describe.each<Kind>(['signup', 'token'])('signed %s email policy hook', kind => {
  it.each([undefined, 'true', '', 'False', '0', ' false '])('denies external email for %j even with client/body flags false', async flag => {
    const body = { ...event(kind, 'qa@example.org'), ENFORCE_CORPORATE_EMAIL: 'false', VITE_ENFORCE_CORPORATE_EMAIL: 'false' };
    const response = await handler(flag, { VITE_ENFORCE_CORPORATE_EMAIL: 'false' })(signed(kind, body));
    expect(response.status).toBe(403);
    expect((await response.json()).error.message).toContain('корпоративную');
  });
  it.each([undefined, 'true', 'false', 'invalid'])('allows a valid corporate email for %j', async flag => {
    const body = event(kind, 'QA@Geropharm.com');
    const response = await handler(flag)(signed(kind, body));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual('claims' in body ? { claims: body.claims } : {});
  });
  it('allows external email only with exact server false', async () => {
    expect((await handler('false')(signed(kind, event(kind, 'qa+test@example.org')))).status).toBe(200);
  });
  it.each(['not-an-email', 'qa@', 'qa@bad..org', 'qa@example.org\r\nBcc: evil@example.net', null])('rejects bad email with policy disabled: %j', async email => {
    expect((await handler('false')(signed(kind, event(kind, email)))).status).toBe(403);
  });
  it('requires a signature in development too', async () => {
    expect((await handler('false')(new Request('https://local.example', { method: 'POST', body: JSON.stringify(event(kind)) }))).status).toBe(401);
  });
  it('rejects tampering and a signature made with the other hook secret', async () => {
    const original = signed(kind);
    const tampered = new Request(original, { body: JSON.stringify(event(kind, 'qa@example.org')) });
    expect((await handler('false')(tampered)).status).toBe(401);
    const otherKey = kind === 'signup' ? tokenKey : signupKey;
    expect((await handler('false')(signed(kind, event(kind), new Date(), otherKey))).status).toBe(401);
  });
  it.each([-601_000, 601_000])('rejects a stale/future webhook timestamp %i', async offset => {
    expect((await handler('false')(signed(kind, event(kind), new Date(Date.now() + offset)))).status).toBe(401);
  });
  it('fails closed for missing signing configuration', async () => {
    const secretName = kind === 'signup' ? 'AUTH_EMAIL_SIGNUP_HOOK_SECRET' : 'AUTH_EMAIL_TOKEN_HOOK_SECRET';
    expect((await handler('false', { [secretName]: undefined })(signed(kind))).status).toBe(503);
    expect((await handler('false', { [secretName]: 'invalid base64' })(signed(kind))).status).toBe(503);
    expect((await handler('false', { [secretName]: 'whsec_' })(signed(kind))).status).toBe(503);
    expect((await handler('false', { [secretName]: `whsec_${Buffer.alloc(31).toString('base64')}` })(signed(kind))).status).toBe(503);
  });
});

it('never changes Auth claims, including role, OTP method and session identity', async () => {
  const body = { ...event('token'), authentication_method: 'token_refresh' };
  const response = await handler('false')(signed('token', body));
  expect(await response.json()).toEqual({ claims: body.claims });
});
it('rejects a mismatched token subject', async () => {
  const body = { ...event('token'), user_id: 'someone-else' };
  expect((await handler('false')(signed('token', body))).status).toBe(400);
});
it('rejects malformed/unknown/oversized payloads and unsupported methods', async () => {
  const run = handler('false');
  for (const body of ['{', 'null', '[]', '{}']) expect((await run(signed('signup', body))).status).toBe(400);
  expect((await run(signed('signup', 'x'.repeat(20_001)))).status).toBe(413);
  expect((await run(new Request('https://local.example'))).status).toBe(405);
});
