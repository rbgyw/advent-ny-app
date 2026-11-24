// @vitest-environment node
import { createHash, createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHandler } from '../supabase/functions/send-gratitude/handler';
import { renderGratitudeEmail } from '../supabase/functions/send-gratitude/email-template';
import { postboxConfig, sendPostbox } from '../supabase/functions/send-gratitude/postbox';

const userId = '10000000-0000-4000-8000-000000000001';
const requestId = '20000000-0000-4000-8000-000000000001';
const letter = { taskId: 8, requestId, anonymous: false, senderName: 'Иван', recipient: 'colleague@geropharm.com', message: 'Спасибо за помощь' };
const secrets: Record<string, string> = {
  APP_ORIGIN: 'https://advent.example', SUPABASE_URL: 'https://supabase.example', SUPABASE_ANON_KEY: 'mock-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'mock-service', POSTBOX_ACCESS_KEY_ID: 'mock-access', POSTBOX_SECRET_ACCESS_KEY: 'mock-secret',
  POSTBOX_REGION: 'ru-central1', POSTBOX_ENDPOINT: 'https://postbox.cloud.yandex.net', POSTBOX_FROM_EMAIL: 'ded-moroz@geropharm-advent.ru',
};
const env = (name: string) => secrets[name];
function request(body: unknown = letter, headers: HeadersInit = {}) {
  return new Request('https://supabase.example/functions/v1/send-gratitude', {
    method: 'POST', headers: { Origin: secrets.APP_ORIGIN!, Authorization: 'Bearer mock-user', ...headers }, body: JSON.stringify(body),
  });
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
function fixture() {
  const sends: Request[] = [];
  const progress: unknown[] = [];
  const records = new Map<string, { hash: string; id: string; state: string; reason?: string }>();
  const options = {
    authStatus: 200, confirmed: true, email: 'employee@geropharm.com', slug: 'task-08', active: true,
    date: '2020-01-01', progressFails: false, journalFails: false, finishFails: false, limited: false,
    provider: async (_req: Request): Promise<Response> => json({ MessageId: 'mock-message-id' }),
  };
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const url = new URL(req.url);
    if (url.hostname === 'postbox.cloud.yandex.net') {
      sends.push(req.clone());
      return options.provider(req);
    }
    expect(url.origin).toBe(secrets.SUPABASE_URL);
    const body = req.method === 'POST' ? await req.json() : undefined;
    if (url.pathname.includes('gratitude_send')) {
      expect(req.headers.get('authorization')).toBe('Bearer mock-service');
      if (options.journalFails) return json({}, 503);
      if (url.pathname.endsWith('reserve_gratitude_send')) {
        expect(body.p_user_id).toBe(userId);
        expect(body.p_payload_hash).toMatch(/^[0-9a-f]{64}$/);
        const existing = records.get(body.p_request_id);
        if (existing) return json({ decision: existing.hash === body.p_payload_hash ? existing.state : 'conflict', ...existing });
        const duplicate = [...records.values()].find(row => row.hash === body.p_payload_hash && row.state !== 'rejected');
        if (duplicate) return json({ decision: duplicate.state, ...duplicate });
        if (options.limited) return json({ decision: 'limited' });
        const row = { hash: body.p_payload_hash, id: body.p_request_id, state: 'pending' };
        records.set(body.p_request_id, row);
        return json({ decision: 'send', id: row.id });
      }
      if (options.finishFails) return json({}, 503);
      const row = [...records.values()].find(row => row.id === body.p_id)!;
      row.state = body.p_state; row.reason = body.p_reason;
      return json({ saved: true });
    }
    expect(req.headers.get('authorization')).toBe('Bearer mock-user');
    if (url.pathname === '/auth/v1/user') return json({ id: userId, email: options.email, email_confirmed_at: options.confirmed ? '2020-01-01' : null }, options.authStatus);
    if (url.pathname === '/rest/v1/tasks') return json([{ slug: options.slug, is_active: options.active }]);
    if (url.pathname === '/rest/v1/user_tasks') return json([{ available_date: options.date }]);
    if (url.pathname.endsWith('/save_task_progress')) {
      progress.push(body);
      return json({}, options.progressFails ? 503 : 200);
    }
    throw new Error(`Unexpected mocked request: ${url.pathname}`);
  });
  return { options, fetcher, sends, progress, records, handler: createHandler(env, fetcher) };
}
beforeEach(() => {
  // Any accidental use of live networking fails. Only the explicit mock is used.
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live networking forbidden'); }));
});

describe('gratitude email and Postbox transport', () => {
  it('preserves the original text and safely escapes every HTML substitution', () => {
    const email = renderGratitudeEmail({ message: '<img src=x onerror="alert(1)"> & \'hello\'\nСпасибо', anonymous: false, senderName: '<b>Иван</b>' });
    expect(email.text).toBe('<img src=x onerror="alert(1)"> & \'hello\'\nСпасибо\n\nС наилучшими пожеланиями,\n<b>Иван</b>\n\nПраздничная почта ГЕРОФАРМ');
    expect(email.html).not.toContain('<img');
    expect(email.html).not.toContain('<b>');
    expect(email.html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;hello&#39;');
    const anonymous = renderGratitudeEmail({ ...letter, anonymous: true });
    expect(anonymous.text).toContain('Твой тайный Дед Мороз');
    expect(anonymous.html).not.toContain('Иван');
  });
  it('uses fixed safe defaults and rejects a misconfigured endpoint or sender', () => {
    const minimal = (key: string) => ({ POSTBOX_ACCESS_KEY_ID: 'test', POSTBOX_SECRET_ACCESS_KEY: 'test' })[key];
    expect(postboxConfig(minimal)?.endpoint).toBe('https://postbox.cloud.yandex.net');
    for (const [key, value] of [['POSTBOX_ENDPOINT', 'https://attacker.example'], ['POSTBOX_FROM_EMAIL', 'evil\r\nBcc: bad@example.com'], ['POSTBOX_REGION', 'us-east-1']]) {
      expect(postboxConfig(name => name === key ? value : env(name))).toBeNull();
    }
  });
  it('signs the exact SESv2 payload with independently verified AWS Signature V4', async () => {
    const f = fixture();
    expect(await (await f.handler(request())).json()).toEqual({ sent: true });
    expect(f.sends).toHaveLength(1);
    const sent = f.sends[0]!;
    expect(sent.url).toBe('https://postbox.cloud.yandex.net/v2/email/outbound-emails');
    expect(sent.method).toBe('POST');
    expect(sent.redirect).toBe('error');
    const raw = await sent.text();
    const payload = JSON.parse(raw);
    const displayName = payload.FromEmailAddress.match(/\?B\?(.+)\?=/)[1];
    expect(Buffer.from(displayName, 'base64').toString()).toBe('Дед Мороз');
    expect(payload.FromEmailAddress).toContain('<ded-moroz@geropharm-advent.ru>');
    expect(payload.ReplyToAddresses).toEqual(['ded-moroz@geropharm-advent.ru']);
    expect(payload.Destination).toEqual({ ToAddresses: [letter.recipient] });
    expect(payload.Content.Simple.Body.Text.Data).toBe(renderGratitudeEmail(letter).text);
    expect(f.progress).toEqual([{ p_task_id: 8, p_response: { sent: true }, p_complete: true }]);

    // Recompute using Node crypto, independently of aws4fetch/Web Crypto.
    const hash = (text: string) => createHash('sha256').update(text).digest('hex');
    const hmac = (key: string | Buffer, text: string) => createHmac('sha256', key).update(text).digest();
    const date = sent.headers.get('x-amz-date')!;
    const signedHeaders = 'content-type;host;x-amz-date';
    const canonical = ['POST', '/v2/email/outbound-emails', '',
      `content-type:application/json\nhost:postbox.cloud.yandex.net\nx-amz-date:${date}\n`, signedHeaders, hash(raw)].join('\n');
    const scope = `${date.slice(0, 8)}/ru-central1/ses/aws4_request`;
    const key = hmac(hmac(hmac(hmac(`AWS4${secrets.POSTBOX_SECRET_ACCESS_KEY}`, date.slice(0, 8)), 'ru-central1'), 'ses'), 'aws4_request');
    const signature = hmac(key, `AWS4-HMAC-SHA256\n${date}\n${scope}\n${hash(canonical)}`).toString('hex');
    expect(sent.headers.get('authorization')).toBe(`AWS4-HMAC-SHA256 Credential=mock-access/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`);
  });
  it.each([429, 400, 403, 500, 503])('never retries Postbox HTTP %i automatically', async status => {
    const f = fixture(); f.options.provider = async () => json({ code: status === 429 ? 'TooManyRequestsException' : 'MessageRejected' }, status);
    const result = await f.handler(request());
    expect(result.status).toBe(status === 429 ? 429 : status >= 500 ? 409 : 502);
    expect(f.progress).toHaveLength(0);
    await f.handler(request());
    expect(f.sends).toHaveLength(1);
  });
  it.each([{}, { MessageId: '' }, { MessageId: null }])('treats a malformed success as unknown: %j', async body => {
    const f = fixture(); f.options.provider = async () => json(body);
    expect((await f.handler(request())).status).toBe(409);
    await f.handler(request()); expect(f.sends).toHaveLength(1); expect(f.progress).toHaveLength(0);
  });
  it('times out once, aborts the request, and records an unknown outcome', async () => {
    const f = fixture();
    let started!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    f.options.provider = req => new Promise((_resolve, reject) => {
      req.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      started();
    });
    vi.useFakeTimers();
    const result = f.handler(request());
    await ready;
    await vi.advanceTimersByTimeAsync(10_001);
    expect((await result).status).toBe(409);
    expect(f.sends[0]!.signal.aborted).toBe(true);
    expect([...f.records.values()][0]!.state).toBe('unknown');
    expect(f.sends).toHaveLength(1);
  });
  it('treats a lost connection and redirects as unknown without leaking provider errors', async () => {
    const f = fixture(); f.options.provider = async () => { throw new Error('provider secret diagnostics'); };
    const response = await f.handler(request());
    expect(response.status).toBe(409);
    expect(await response.text()).not.toContain('secret');
    await f.handler(request()); expect(f.sends).toHaveLength(1);
    const network = vi.fn<typeof fetch>(async () => new Response(null, { status: 307 }));
    expect(await sendPostbox(postboxConfig(env)!, letter.recipient, renderGratitudeEmail(letter), network)).toEqual({ state: 'unknown' });
    expect(network).toHaveBeenCalledTimes(1);
  });
});

describe('send-gratitude authorization and durable idempotency', () => {
  it('resumes only progress persistence after acceptance, including after reload/new UUID', async () => {
    const f = fixture(); f.options.progressFails = true;
    expect((await f.handler(request())).status).toBe(503);
    f.options.progressFails = false;
    expect(await (await f.handler(request())).json()).toEqual({ sent: true });
    expect(await (await f.handler(request({ ...letter, requestId: '30000000-0000-4000-8000-000000000001' }))).json()).toEqual({ sent: true });
    expect(f.sends).toHaveLength(1);
  });
  it('blocks concurrent requests before calling Postbox a second time', async () => {
    const f = fixture();
    let release!: () => void;
    let started!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { started = resolve; });
    f.options.provider = async () => { started(); await gate; return json({ MessageId: 'mock' }); };
    const first = f.handler(request()); await ready;
    expect((await f.handler(request())).status).toBe(409);
    expect(f.sends).toHaveLength(1);
    release(); expect((await first).status).toBe(200);
  });
  it('fails closed if the journal cannot reserve or cannot record acceptance', async () => {
    const f = fixture(); f.options.journalFails = true;
    expect((await f.handler(request())).status).toBe(503); expect(f.sends).toHaveLength(0);
    f.options.journalFails = false; f.options.finishFails = true;
    expect((await f.handler(request())).status).toBe(503);
    f.options.finishFails = false;
    expect((await f.handler(request())).status).toBe(409);
    expect(f.sends).toHaveLength(1); expect(f.progress).toHaveLength(0);
  });
  it('rejects reuse of an ID for different content and applies server rate limits', async () => {
    const f = fixture(); await f.handler(request());
    expect((await f.handler(request({ ...letter, message: 'Другое письмо' }))).status).toBe(409);
    f.options.limited = true;
    expect((await f.handler(request({ ...letter, message: 'Новое', requestId: '30000000-0000-4000-8000-000000000001' }))).status).toBe(429);
    expect(f.sends).toHaveLength(1);
  });
  it.each([
    { recipient: 'external@example.com' }, { recipient: 'user@geropharm.com\r\nBcc: bad@example.com' },
    { message: '' }, { message: 'x'.repeat(5001) }, { senderName: '' }, { anonymous: 'true' },
    { taskId: -8 }, { requestId: 'invalid' },
  ])('rejects invalid input before any network call: %j', async patch => {
    const f = fixture(); expect((await f.handler(request({ ...letter, ...patch }))).status).toBe(400);
    expect(f.fetcher).not.toHaveBeenCalled();
  });
  it('rejects malformed JSON and oversized streamed input', async () => {
    const f = fixture();
    for (const body of ['{', JSON.stringify(null), JSON.stringify([]), 'Ж'.repeat(9000)]) {
      expect((await f.handler(new Request(request(), { body }))).status).toBe(400);
    }
    expect(f.fetcher).not.toHaveBeenCalled();
  });
  it('handles CORS, methods, missing JWT and missing config before sending', async () => {
    const f = fixture();
    expect((await f.handler(request(letter, { Origin: 'https://attacker.example' }))).status).toBe(403);
    expect((await f.handler(request(letter, { Authorization: '' }))).status).toBe(401);
    expect((await f.handler(new Request(request(), { method: 'OPTIONS', body: null }))).status).toBe(204);
    expect((await f.handler(new Request('https://supabase.example', { method: 'GET' }))).status).toBe(405);
    expect((await createHandler(() => undefined, f.fetcher)(request())).status).toBe(403);
    expect((await createHandler(key => key === 'POSTBOX_ACCESS_KEY_ID' ? undefined : env(key), f.fetcher)(request())).status).toBe(503);
    expect(f.fetcher).not.toHaveBeenCalled();
  });
  it.each([
    { authStatus: 401 }, { confirmed: false }, { email: 'external@example.com' },
    { slug: 'task-09' }, { active: false }, { date: '2999-12-31' },
  ])('preserves Auth verification and task access checks: %j', async options => {
    const f = fixture(); Object.assign(f.options, options);
    expect((await f.handler(request())).status).toBe(options.authStatus ? 401 : 403);
    expect(f.sends).toHaveLength(0); expect(f.records.size).toBe(0);
  });
  it('keeps the sender anonymous in the actual outgoing message', async () => {
    const f = fixture();
    await f.handler(request({ ...letter, anonymous: true, senderName: 'NEVER EXPOSE' }));
    const payload = await f.sends[0]!.text();
    expect(payload).not.toContain('NEVER EXPOSE');
    expect(payload).not.toContain('employee@geropharm.com');
    expect(payload).not.toContain(userId);
    expect(payload).toContain('Твой тайный Дед Мороз');
  });
});
