type Env = (name: string) => string | undefined;

/** Example mail endpoint. All provider secrets stay in the Edge Function. */
export function createHandler(env: Env, fetcher: typeof fetch = fetch) {
  return async (request: Request): Promise<Response> => {
    const allowedOrigin = env('APP_ORIGIN') || 'http://localhost:5173';
    const headers = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
      Vary: 'Origin',
    };
    const reply = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (request.headers.get('origin') && request.headers.get('origin') !== allowedOrigin)
      return reply({ error: 'Недопустимый источник запроса.' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply({ error: 'Метод не поддерживается.' }, 405);
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return reply({ error: 'Войдите в аккаунт.' }, 401);
    const url = env('SUPABASE_URL'), anonKey = env('SUPABASE_ANON_KEY');
    const apiKey = env('RESEND_API_KEY'), from = env('GRATITUDE_FROM');
    if (!url || !anonKey || !apiKey || !from) return reply({ error: 'Отправка писем ещё не настроена.' }, 503);
    try {
      const raw = await request.text();
      if (raw.length > 16000) return reply({ error: 'Письмо слишком длинное.' }, 400);
      let body: Record<string, unknown>;
      try { body = JSON.parse(raw); } catch { return reply({ error: 'Некорректный запрос.' }, 400); }
      if (!body || typeof body !== 'object') return reply({ error: 'Некорректный запрос.' }, 400);
      const taskId = body.taskId, requestId = body.requestId;
      const anonymous = body.anonymous;
      const recipient = typeof body.recipient === 'string' ? body.recipient.trim().toLowerCase() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const senderName = anonymous === true ? '' : typeof body.senderName === 'string' ? body.senderName.trim() : '';
      if (!Number.isSafeInteger(taskId) || typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) || typeof anonymous !== 'boolean')
        return reply({ error: 'Некорректные параметры письма.' }, 400);
      if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@geropharm\.com$/i.test(recipient) || recipient.length > 254)
        return reply({ error: 'Используйте корпоративную почту @geropharm.com.' }, 400);
      if (!message || message.length > 5000 || (!anonymous && (!senderName || senderName.length > 120)))
        return reply({ error: 'Заполните имя и текст благодарности.' }, 400);
      const authHeaders = { apikey: anonKey, Authorization: authorization, 'Content-Type': 'application/json' };
      // Verify the session with Auth; never trust a user ID supplied by the browser.
      const userResponse = await fetcher(`${url}/auth/v1/user`, { headers: authHeaders });
      if (!userResponse.ok) return reply({ error: 'Сессия истекла. Войдите снова.' }, 401);
      const user = await userResponse.json();
      if (typeof user.id !== 'string' || !user.email_confirmed_at || !/^[^\s@]+@geropharm\.com$/i.test(user.email || ''))
        return reply({ error: 'Доступно только сотрудникам ГЕРОФАРМ.' }, 403);
      // User-scoped REST calls preserve RLS and check that the requested task is open.
      const [taskResponse, assignmentResponse] = await Promise.all([
        fetcher(`${url}/rest/v1/tasks?id=eq.${taskId}&select=slug,is_active`, { headers: authHeaders }),
        fetcher(`${url}/rest/v1/user_tasks?user_id=eq.${encodeURIComponent(user.id)}&task_id=eq.${taskId}&select=available_date`, { headers: authHeaders }),
      ]);
      if (!taskResponse.ok || !assignmentResponse.ok) return reply({ error: 'Не удалось проверить доступ к заданию.' }, 503);
      const task = (await taskResponse.json())[0], assignment = (await assignmentResponse.json())[0];
      const today = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (task?.slug !== 'task-08' || !task.is_active || !assignment?.available_date || assignment.available_date > today)
        return reply({ error: 'Задание ещё не открыто.' }, 403);
      const signature = anonymous ? 'Твой тайный Дед Мороз' : senderName;
      // Plain text keeps user input out of HTML; the sender address is fixed on the server.
      const provider = await fetcher('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `gratitude/${user.id}/${requestId}` },
        body: JSON.stringify({ from, to: [recipient], subject: 'Вам письмо благодарности · ГЕРОФАРМ', text: `${message}\n\nС наилучшими пожеланиями,\n${signature}\n\nПраздничная почта ГЕРОФАРМ` }),
      });
      if (!provider.ok) return reply({ error: 'Почтовый сервис временно недоступен. Повторите отправку.' }, 502);
      const email = await provider.json();
      if (typeof email.id !== 'string' || !email.id) return reply({ error: 'Почтовый сервис не подтвердил отправку.' }, 502);
      // Retrying uses the same provider key, including when saving progress failed after send.
      const progress = await fetcher(`${url}/rest/v1/rpc/save_task_progress`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ p_task_id: taskId, p_response: { sent: true }, p_complete: true }),
      });
      if (!progress.ok) return reply({ error: 'Письмо принято почтой, но статус задания не сохранился. Повторите отправку для обновления статуса.' }, 503);
      return reply({ sent: true });
    } catch {
      return reply({ error: 'Не удалось связаться с почтовым сервисом. Попробуйте ещё раз.' }, 503);
    }
  };
}
