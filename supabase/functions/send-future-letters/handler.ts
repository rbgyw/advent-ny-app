import { sendPostbox, type PostboxConfig } from '../send-gratitude/postbox.ts';
import { isValidEmail } from '../_shared/email-policy.ts';
import { futureLetterTemplate } from './template.ts';

type Env = (name: string) => string | undefined;
type ClaimedLetter = { id: string; claim_token: string; recipient_email: string; body: string };

async function secretMatches(actual: string, expected: string) {
  const hash = (value: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const [left, right] = await Promise.all([hash(actual), hash(expected)]);
  const a = new Uint8Array(left), b = new Uint8Array(right);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i]! ^ b[i]!;
  return difference === 0;
}

export function createHandler(env: Env, fetcher: typeof fetch = fetch) {
  return async (request: Request): Promise<Response> => {
    const reply = (body: object, status = 200) => new Response(JSON.stringify(body), {
      status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
    if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
    const cronSecret = env('FUTURE_LETTER_CRON_SECRET');
    if (!cronSecret) return reply({ error: 'not_configured' }, 503);
    if (!await secretMatches(request.headers.get('x-future-letter-cron-secret') ?? '', cronSecret))
      return reply({ error: 'unauthorized' }, 401);
    const url = env('SUPABASE_URL'), serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
    const accessKey = env('POSTBOX_ACCESS_KEY_ID'), secret = env('POSTBOX_SECRET_ACCESS_KEY');
    const from = env('FUTURE_LETTER_FROM');
    if (!url || !serviceKey || !accessKey || !secret || !from || !isValidEmail(from))
      return reply({ error: 'not_configured' }, 503);
    const config: PostboxConfig = { accessKeyId: accessKey, secretAccessKey: secret, from,
      region: 'ru-central1', endpoint: 'https://postbox.cloud.yandex.net' };
    const rpc = async <T>(name: string, args: object): Promise<T> => {
      const response = await fetcher(`${url}/rest/v1/rpc/${name}`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      if (!response.ok) throw new Error('database_operation_failed');
      return await response.json() as T;
    };
    try {
      // Reaping a claim that started sending always produces an uncertain failure.
      await rpc('reap_future_letter_locks', {});
      const letters = await rpc<ClaimedLetter[]>('claim_future_letters', { p_limit: 10 });
      const results = await Promise.allSettled(letters.map(async letter => {
        const args = { p_id: letter.id, p_claim_token: letter.claim_token };
        let started = false;
        let beginChecked = false;
        let beginFailed = false;
        const delivery = await sendPostbox(config, letter.recipient_email, futureLetterTemplate(letter.body), async (input, init) => {
          // Existing transport signs first. Check the current claim and persist
          // send_started_at immediately before the only Postbox HTTP request.
          beginChecked = true;
          try {
            started = await rpc<boolean>('begin_future_letter_send', args) === true;
          } catch {
            beginFailed = true;
            throw new Error('begin_send_unconfirmed');
          }
          if (!started) throw new Error('stale_claim');
          return fetcher(input, init);
        });
        if (beginFailed) throw new Error('begin_send_unconfirmed');
        if (!beginChecked) throw new Error('signing_failed');
        if (!started) return 'skipped';
        const result = delivery.state === 'accepted'
          ? { outcome: 'sent', messageId: delivery.messageId, code: null }
          : { outcome: delivery.state === 'unknown' ? 'uncertain' : delivery.reason === 'quota' ? 'temporary' : 'permanent',
            messageId: null, code: delivery.state === 'unknown' ? 'provider_connection_lost' : delivery.reason === 'quota' ? 'provider_throttled' : 'provider_rejected' };
        const saved = await rpc<boolean>('finish_future_letter_send', {
          ...args, p_outcome: result.outcome,
          p_message_id: result.outcome === 'sent' ? result.messageId : null,
          p_error: result.outcome === 'sent' ? null : result.code,
        });
        if (saved !== true) throw new Error('claim_no_longer_current');
        return result.outcome;
      }));
      if (results.some(result => result.status === 'rejected')) return reply({ error: 'delivery_run_incomplete' }, 503);
      return reply({ processed: letters.length, sent: results.filter(result => result.status === 'fulfilled' && result.value === 'sent').length });
    } catch {
      // Never include provider/DB responses, email, private body, or secrets.
      // An unrecorded result is recovered by the lock reaper without resending.
      return reply({ error: 'delivery_run_incomplete' }, 503);
    }
  };
}
