import { AwsClient } from 'aws4fetch';

export type Env = (name: string) => string | undefined;
export type PostboxConfig = { accessKeyId: string; secretAccessKey: string; region: string; endpoint: string; from: string };
export type SendResult =
  | { state: 'accepted'; messageId: string }
  | { state: 'rejected'; reason: 'quota' | 'provider' }
  | { state: 'unknown' };

export function postboxConfig(env: Env): PostboxConfig | null {
  const accessKeyId = env('POSTBOX_ACCESS_KEY_ID');
  const secretAccessKey = env('POSTBOX_SECRET_ACCESS_KEY');
  const region = env('POSTBOX_REGION') || 'ru-central1';
  const endpoint = env('POSTBOX_ENDPOINT') || 'https://postbox.cloud.yandex.net';
  const from = env('POSTBOX_FROM_EMAIL') || 'ded-moroz@geropharm-advent.ru';
  // A typo must not leak a signed request to a different host or sender.
  if (!accessKeyId || !secretAccessKey || region !== 'ru-central1'
    || endpoint.replace(/\/$/, '') !== 'https://postbox.cloud.yandex.net'
    || from !== 'ded-moroz@geropharm-advent.ru') return null;
  return { accessKeyId, secretAccessKey, region, endpoint: endpoint.replace(/\/$/, ''), from };
}

export async function sendPostbox(
  config: PostboxConfig,
  recipient: string,
  email: { subject: string; text: string; html: string },
  fetcher: typeof fetch,
): Promise<SendResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const signer = new AwsClient({ ...config, service: 'ses', retries: 0 });
    // Only sign(): AwsClient.fetch() includes retries, unsafe for SES SendEmail.
    const signed = await signer.sign(`${config.endpoint}/v2/email/outbound-emails`, {
      method: 'POST', signal: controller.signal, redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
      aws: { allHeaders: true },
      body: JSON.stringify({
        // RFC 2047 encoded UTF-8 display name: Дед Мороз.
        FromEmailAddress: `=?UTF-8?B?0JTQtdC0INCc0L7RgNC+0Lc=?= <${config.from}>`,
        ReplyToAddresses: [config.from],
        Destination: { ToAddresses: [recipient] },
        Content: { Simple: {
          Subject: { Data: email.subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: email.text, Charset: 'UTF-8' },
            Html: { Data: email.html, Charset: 'UTF-8' },
          },
        } },
      }),
    });
    const response = await fetcher(signed);
    if (response.ok) {
      const result = await response.json();
      return typeof result.MessageId === 'string' && result.MessageId.trim()
        ? { state: 'accepted', messageId: result.MessageId }
        : { state: 'unknown' };
    }
    // A timeout, redirect or 5xx can occur AFTER acceptance. Never resend these.
    if (![400, 401, 403, 404, 413, 422, 429].includes(response.status)) return { state: 'unknown' };
    const detail = await response.json().catch(() => ({}));
    const code = String(detail.__type || detail.code || detail.Code || '').split('#').pop();
    const quota = response.status === 429 || code === 'TooManyRequestsException' || code === 'LimitExceededException';
    return { state: 'rejected', reason: quota ? 'quota' : 'provider' };
  } catch {
    return { state: 'unknown' };
  } finally {
    clearTimeout(timer);
  }
}
