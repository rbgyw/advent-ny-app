import { Webhook } from 'standardwebhooks';
import { emailError, enforceCorporateEmail } from '../_shared/email-policy.ts';

type Env = (name: string) => string | undefined;
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Auth calls this endpoint with a signed hook, never with a browser's policy flag. */
export function createAuthEmailPolicyHandler(env: Env) {
  return async (request: Request): Promise<Response> => {
    const reply = (body: object, status = 200) => Response.json(body, {
      status, headers: { 'Cache-Control': 'no-store' },
    });
    const fail = (message: string, status: number) => reply({ error: { http_code: status, message } }, status);
    if (request.method !== 'POST') return fail('Method not allowed', 405);
    // Bound the unsigned body before parsing or signature verification.
    const reader = request.body?.getReader();
    if (!reader) return fail('Invalid hook payload', 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 20_000) { await reader.cancel(); return fail('Hook payload too large', 413); }
        chunks.push(value);
      }
    } catch {
      return fail('Invalid hook payload', 400);
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const raw = new TextDecoder().decode(bytes);
    let event: unknown;
    try { event = JSON.parse(raw); } catch { return fail('Invalid hook payload', 400); }
    if (!record(event)) return fail('Invalid hook payload', 400);
    const tokenHook = record(event.claims) && !('user' in event);
    const signupHook = record(event.user) && !('claims' in event);
    if (!tokenHook && !signupHook) return fail('Unknown hook event', 400);
    const secret = env(tokenHook ? 'AUTH_EMAIL_TOKEN_HOOK_SECRET' : 'AUTH_EMAIL_SIGNUP_HOOK_SECRET');
    if (!secret) return fail('Email policy hook is not configured', 503);
    let verifier: Webhook;
    try {
      const formatted = secret.replace(/^v1,/, '');
      if (atob(formatted.replace(/^whsec_/, '')).length < 32) throw new Error('Weak signing key');
      verifier = new Webhook(formatted);
    }
    catch { return fail('Email policy hook is not configured', 503); }
    try {
      // Standard Webhooks verifies HMAC in constant time and a bounded timestamp.
      verifier.verify(raw, Object.fromEntries(request.headers.entries()));
    } catch { return fail('Invalid hook signature', 401); }

    // Only after signature verification is the email/claims payload trusted.
    const identity = tokenHook ? event.claims : event.user;
    if (!record(identity)) return fail('Invalid hook identity', 400);
    if (tokenHook && (typeof event.user_id !== 'string' || identity.sub !== event.user_id))
      return fail('Invalid hook identity', 400);
    const error = emailError(identity.email, enforceCorporateEmail(env('ENFORCE_CORPORATE_EMAIL')));
    if (error) return fail(error, 403);
    // Preserve Auth's claims verbatim: no JWTs, roles or sessions are issued here.
    return reply(tokenHook ? { claims: identity } : {});
  };
}
