import { renderGratitudeEmail } from './email-template.ts';
import { postboxConfig, sendPostbox, type Env } from './postbox.ts';
import { emailError, enforceCorporateEmail } from '../_shared/email-policy.ts';

async function readBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_000) { await reader.cancel(); throw new RangeError(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(bytes);
}

/** All provider credentials and the durable send journal stay on the server. */
export function createHandler(env: Env, fetcher: typeof fetch = fetch) {
  return async (request: Request): Promise<Response> => {
    const allowedOrigin = env('APP_ORIGIN');
    const headers = {
      'Access-Control-Allow-Origin': allowedOrigin || 'null',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    };
    const reply = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (request.headers.get('origin') && request.headers.get('origin') !== allowedOrigin)
      return reply({ error: 'Недопустимый источник запроса.' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply({ error: 'Метод не поддерживается.' }, 405);
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return reply({ error: 'Войдите в аккаунт.' }, 401);
    const url = env('SUPABASE_URL'), anonKey = env('SUPABASE_ANON_KEY');
    const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
    const mailConfig = postboxConfig(env);
    const corporateOnly = enforceCorporateEmail(env('ENFORCE_CORPORATE_EMAIL'));
    if (!url || !anonKey || !serviceKey || !mailConfig || !allowedOrigin)
      return reply({ error: 'Отправка писем ещё не настроена.' }, 503);
    // Auth, REST and journal calls also have bounded waits. No HTTP retries.
    const backend: typeof fetch = (input, init) => fetcher(input, { ...init, signal: AbortSignal.timeout(8_000), redirect: 'error' });
    const journal = async (name: string, body: object) => {
      const result = await backend(`${url}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!result.ok) throw new Error('Send journal unavailable');
      return result.json();
    };
    try {
      let raw: string;
      try { raw = await readBody(request); }
      catch (error) {
        if (error instanceof RangeError) return reply({ error: 'Письмо слишком длинное.' }, 400);
        throw error;
      }
      let body: Record<string, unknown>;
      try { body = JSON.parse(raw); } catch { return reply({ error: 'Некорректный запрос.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'Некорректный запрос.' }, 400);
      const taskId = body.taskId, requestId = body.requestId;
      const anonymous = body.anonymous;
      const recipient = typeof body.recipient === 'string' ? body.recipient.trim().toLowerCase() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const senderName = anonymous === true ? '' : typeof body.senderName === 'string' ? body.senderName.trim() : '';
      if (!Number.isSafeInteger(taskId) || Number(taskId) <= 0 || typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) || typeof anonymous !== 'boolean')
        return reply({ error: 'Некорректные параметры письма.' }, 400);
      const recipientError = emailError(recipient, corporateOnly);
      if (recipientError) return reply({ error: recipientError }, 400);
      if (!message || message.length > 5000 || (!anonymous && (!senderName || senderName.length > 120)))
        return reply({ error: 'Заполните имя и текст благодарности.' }, 400);
      const authHeaders = { apikey: anonKey, Authorization: authorization, 'Content-Type': 'application/json' };
      // Verify the session with Auth; never trust a user ID supplied by the browser.
      const userResponse = await backend(`${url}/auth/v1/user`, { headers: authHeaders });
      if (!userResponse.ok) return reply({ error: 'Сессия истекла. Войдите снова.' }, 401);
      const user = await userResponse.json();
      if (typeof user.id !== 'string' || !user.email_confirmed_at || emailError(user.email, corporateOnly))
        return reply({ error: corporateOnly ? 'Доступно только сотрудникам ГЕРОФАРМ с подтверждённой почтой.' : 'Подтвердите корректный email через OTP.' }, 403);
      // User-scoped REST calls preserve RLS and check that the requested task is open.
      const [taskResponse, assignmentResponse] = await Promise.all([
        backend(`${url}/rest/v1/tasks?id=eq.${taskId}&select=slug,is_active`, { headers: authHeaders }),
        backend(`${url}/rest/v1/user_tasks?user_id=eq.${encodeURIComponent(user.id)}&task_id=eq.${taskId}&select=available_date`, { headers: authHeaders }),
      ]);
      if (!taskResponse.ok || !assignmentResponse.ok) return reply({ error: 'Не удалось проверить доступ к заданию.' }, 503);
      const task = (await taskResponse.json())[0], assignment = (await assignmentResponse.json())[0];
      const today = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (task?.slug !== 'task-08' || !task.is_active || !assignment?.available_date || assignment.available_date > today)
        return reply({ error: 'Задание ещё не открыто.' }, 403);
      const payload = JSON.stringify({ taskId, anonymous, senderName, recipient, message });
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
      const payloadHash = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
      const reservation = await journal('reserve_gratitude_send', {
        p_user_id: user.id, p_task_id: taskId, p_request_id: requestId, p_payload_hash: payloadHash,
      });
      if (reservation.decision === 'conflict') return reply({ error: 'Этот запрос уже использован для другого письма.' }, 409);
      if (reservation.decision === 'forbidden') return reply({ error: 'Задание ещё не открыто.' }, 403);
      if (reservation.decision === 'limited') return reply({ error: 'Достигнут лимит отправки. Подождите перед следующей благодарностью.' }, 429);
      const unknown = () => reply({ error: 'Результат отправки пока неизвестен. Письмо могло быть принято почтой. Автоматическая повторная отправка заблокирована; обратитесь в поддержку.' }, 409);
      const rejected = (reason: string) => reply({ error: reason === 'quota'
        ? 'Почтовый сервис отклонил письмо из-за квоты. Новую попытку можно создать вручную позже, заново открыв задание.'
        : 'Почтовый сервис отклонил письмо. Обратитесь в поддержку перед новой попыткой.' }, reason === 'quota' ? 429 : 502);
      if (reservation.decision === 'pending' || reservation.decision === 'unknown') return unknown();
      if (reservation.decision === 'rejected') return rejected(reservation.reason);
      if (reservation.decision === 'send') {
        const result = await sendPostbox(mailConfig, recipient, renderGratitudeEmail({ message, anonymous, senderName }), fetcher);
        // If this write fails, the durable pending reservation still blocks resends.
        await journal('finish_gratitude_send', {
          p_id: reservation.id, p_state: result.state,
          p_message_id: result.state === 'accepted' ? result.messageId : null,
          p_reason: result.state === 'rejected' ? result.reason : null,
        });
        if (result.state === 'unknown') return unknown();
        if (result.state === 'rejected') return rejected(result.reason);
      } else if (reservation.decision !== 'accepted') {
        throw new Error('Invalid journal response');
      }
      // Accepted means queued by Postbox, NOT delivered to the recipient.
      // An accepted replay only retries saving progress, never SendEmail.
      const progress = await backend(`${url}/rest/v1/rpc/save_task_progress`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ p_task_id: taskId, p_response: { sent: true }, p_complete: true }),
      });
      if (!progress.ok) return reply({ error: 'Письмо принято почтой, но статус задания не сохранился. Повторите тот же запрос для обновления статуса; новое письмо не отправится.' }, 503);
      return reply({ sent: true });
    } catch {
      return reply({ error: 'Не удалось подтвердить результат. Повторите тот же запрос для проверки статуса; письмо повторно не отправляется.' }, 503);
    }
  };
}
