// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createHandler } from '../supabase/functions/send-future-letters/handler';
import { futureLetterTemplate } from '../supabase/functions/send-future-letters/template';

const secrets: Record<string, string> = { FUTURE_LETTER_CRON_SECRET: 'cron-test', SUPABASE_URL: 'https://db.example',
  SUPABASE_SERVICE_ROLE_KEY: 'service-test', POSTBOX_ACCESS_KEY_ID: 'access-test', POSTBOX_SECRET_ACCESS_KEY: 'secret-test', FUTURE_LETTER_FROM: 'verified@example.org' };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
const request = (secret = secrets.FUTURE_LETTER_CRON_SECRET) => new Request('https://db.example/functions/v1/send-future-letters', {
  method: 'POST', headers: { 'x-future-letter-cron-secret': secret! },
});
function fixture() {
  const calls: string[] = [], sends: Request[] = [], outcomes: Record<string, unknown>[] = [];
  const options = { claim: true, begin: true, finish: true, finishError: false,
    provider: async (): Promise<Response> => json({ MessageId: 'postbox-1' }) };
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    if (req.url.startsWith('https://postbox.cloud.yandex.net/')) {
      calls.push('provider'); sends.push(req.clone()); return options.provider();
    }
    expect(req.headers.get('authorization')).toBe('Bearer service-test');
    const name = new URL(req.url).pathname.split('/').pop()!; calls.push(name);
    const args = await req.json();
    if (name === 'reap_future_letter_locks') return json(0);
    if (name === 'claim_future_letters') {
      expect(args).toEqual({ p_limit: 10 });
      const claim = options.claim; options.claim = false;
      return json(claim ? [{ id: 'letter-1', claim_token: 'claim-1', recipient_email: 'private@example.org', body: '<b>Личное письмо</b>' }] : []);
    }
    if (name === 'begin_future_letter_send') { expect(args).toEqual({ p_id: 'letter-1', p_claim_token: 'claim-1' }); return json(options.begin); }
    if (name === 'finish_future_letter_send') { outcomes.push(args); return json(options.finish, options.finishError ? 503 : 200); }
    throw new Error('Unexpected mocked request');
  });
  return { options, calls, sends, outcomes, fetcher, handler: createHandler(key => secrets[key], fetcher) };
}
describe('future letter delivery handler', () => {
  it('authenticates server calls before touching the database', async () => {
    const f = fixture();
    for (const secret of ['', 'wrong', 'Bearer service-test']) expect((await f.handler(request(secret))).status).toBe(401);
    expect(f.fetcher).not.toHaveBeenCalled();
    expect((await f.handler(new Request('https://db.example'))).status).toBe(405);
  });
  it('fails closed when sender or other configuration is missing', async () => {
    const f = fixture();
    expect((await createHandler(key => key === 'FUTURE_LETTER_FROM' ? undefined : secrets[key], f.fetcher)(request())).status).toBe(503);
    expect(f.fetcher).not.toHaveBeenCalled();
  });
  it('records send-start immediately before Postbox and retains provider acceptance', async () => {
    const f = fixture(); expect((await f.handler(request())).status).toBe(200);
    expect(f.calls).toEqual(['reap_future_letter_locks', 'claim_future_letters', 'begin_future_letter_send', 'provider', 'finish_future_letter_send']);
    const mail = await f.sends[0]!.json();
    expect(mail.FromEmailAddress).toContain('<verified@example.org>');
    expect(mail.Content.Simple.Body.Html.Data).toContain('&lt;b&gt;Личное письмо&lt;/b&gt;');
    expect(mail.Content.Simple.Body.Text.Charset).toBe('UTF-8');
    expect(f.outcomes[0]).toMatchObject({ p_outcome: 'sent', p_message_id: 'postbox-1', p_error: null });
  });
  it('does not send when no letters are due', async () => {
    const f = fixture(); f.options.claim = false;
    expect(await (await f.handler(request())).json()).toEqual({ processed: 0, sent: 0 }); expect(f.sends).toHaveLength(0);
  });
  it('two simultaneous handler calls send a claimed letter only once', async () => {
    const f = fixture(); const responses = await Promise.all([f.handler(request()), f.handler(request())]);
    expect(responses.map(r => r.status)).toEqual([200, 200]); expect(f.sends).toHaveLength(1);
  });
  it('a stale or expired token prevents the provider call', async () => {
    const f = fixture(); f.options.begin = false; expect((await f.handler(request())).status).toBe(200);
    expect(f.sends).toHaveLength(0); expect(f.outcomes).toHaveLength(0);
  });
  it.each([
    [429, { code: 'TooManyRequestsException' }, 'temporary'],
    [400, { code: 'MessageRejected' }, 'permanent'],
    [403, { code: 'AccessDeniedException' }, 'permanent'],
    [500, {}, 'uncertain'], [200, {}, 'uncertain'],
  ])('classifies provider status %i without HTTP retries', async (status, data, outcome) => {
    const f = fixture(); f.options.provider = async () => json(data, status);
    await f.handler(request()); expect(f.sends).toHaveLength(1);
    expect(f.outcomes[0]?.p_outcome).toBe(outcome);
    await f.handler(request()); expect(f.sends).toHaveLength(1);
  });
  it('records connection loss as uncertain without exposing diagnostics', async () => {
    const f = fixture(); f.options.provider = async () => { throw new Error('secret email private@example.org'); };
    const response = await f.handler(request());
    expect(f.outcomes[0]?.p_outcome).toBe('uncertain'); expect(await response.text()).not.toContain('private');
    expect(f.sends).toHaveLength(1);
  });
  it('leaves a started claim for safe reaping when result persistence fails', async () => {
    const f = fixture(); f.options.finishError = true;
    expect((await f.handler(request())).status).toBe(503);
    await f.handler(request()); expect(f.sends).toHaveLength(1);
  });
  it('escapes HTML while preserving plain UTF-8 text', () => {
    const body = '<script>"Привет" & \'ты\'</script>\nНовая строка'; const template = futureLetterTemplate(body);
    expect(template.text).toContain(body); expect(template.html).not.toContain('<script>');
    expect(template.html).toContain('&lt;script&gt;&quot;Привет&quot; &amp; &#39;ты&#39;&lt;/script&gt;');
  });
});
