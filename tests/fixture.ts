import type { Page } from '@playwright/test';
export const userId = '00000000-0000-4000-8000-000000000001';
export function taskIdAtPosition(position: number): number {
  return position === 10 ? 15 : position === 15 ? 10 : position;
}
export async function mockBackend(page: Page, options: { lockedAfter?: number; genericTasks?: boolean; failCalendar?: boolean; failSave?: boolean; delay?: number; completed?: boolean; authenticated?: boolean } = {}) {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '127.0.0.1') return route.abort();
    return route.continue();
  });
  const calls: string[] = [];
  const responses: Record<number, Record<string, unknown>> = {};
  const completed = new Set<number>(options.completed ? Array.from({ length: 25 }, (_, i) => i + 1) : []);
  const user = { id: userId, email: 'audit@geropharm.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
  if (options.authenticated !== false) await page.addInitScript(({ user }) => {
    if (sessionStorage.getItem('audit-session-seeded')) return;
    sessionStorage.setItem('audit-session-seeded', 'true');
    localStorage.setItem('sb-127-auth-token', JSON.stringify({ access_token: 'local-audit-token', refresh_token: 'local-refresh-token', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user }));
  }, { user });
  await page.route('http://127.0.0.1:54321/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    calls.push(path);
    if (options.delay) await new Promise(resolve => setTimeout(resolve, options.delay));
    if (options.failSave && path.endsWith('/save_task_progress')) { await route.fulfill({ status: 503, json: { message: 'Сохранение недоступно' } }); return; }
    if (options.failCalendar && path.endsWith('/user_tasks')) {
      await route.fulfill({ status: 400, json: { message: 'Сеть недоступна' } }); return;
    }
    let data: unknown = null;
    if (path.endsWith('/user')) data = user;
    else if (path.endsWith('/is_admin')) data = false;
    else if (path.endsWith('/user_tasks')) data = Array.from({ length: 25 }, (_, i) => {
      const position = i + 1;
      const taskId = taskIdAtPosition(position);
      return {
        id: `assignment-${taskId}`, user_id: userId, task_id: taskId, position,
        available_date: options.lockedAfter !== undefined && position > options.lockedAfter ? '2026-12-25' : '2026-11-01',
        status: completed.has(taskId) ? 'completed' : responses[taskId] ? 'in_progress' : 'not_started',
        completed_at: completed.has(taskId) ? '2026-11-01T00:00:00Z' : null,
      };
    });
    else if (path.endsWith('/tasks')) data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, slug: options.genericTasks && [7, 9, 10, 15, 16, 17, 18, 19, 20, 22, 23, 24].includes(i + 1) ? `custom-task-${i + 1}` : `task-${String(i + 1).padStart(2, '0')}`, title: `Задание ${i + 1}`, description: `Описание задания ${i + 1}`, is_active: true, config: {} }));
    else if (path.endsWith('/task_responses')) data = Object.entries(responses).map(([id, response]) => ({ id: `response-${id}`, user_id: userId, task_id: Number(id), response }));
    else if (path.endsWith('/save_task_progress')) {
      const body = request.postDataJSON(); responses[body.p_task_id] = body.p_response;
      if (body.p_complete) completed.add(body.p_task_id);
      data = { task_id: body.p_task_id, status: body.p_complete ? 'completed' : 'in_progress', completed_at: body.p_complete ? new Date().toISOString() : null, response: body.p_response };
    } else if (path.endsWith('/claim_tarot_card')) {
      const body = request.postDataJSON(); completed.add(body.p_task_id); responses[body.p_task_id] = { card_id: body.p_card_id }; data = { card_id: body.p_card_id };
    } else if (path.endsWith('/get_advent_video_state')) data = { votes: [], ranking: [], total_videos: 0, complete: completed.has(22) };
    else if (path.endsWith('/attachments') || path.endsWith('/guiding_star_results')) data = [];
    const taskFilter = new URL(request.url()).searchParams.get('task_id');
    if (taskFilter && Array.isArray(data)) data = data.filter(item => item.task_id === Number(taskFilter.slice(3)));
    if (request.headers()['accept']?.includes('application/vnd.pgrst.object+json') && Array.isArray(data)) data = data[0] ?? null;
    await route.fulfill({ status: 200, json: data, headers: { 'access-control-allow-origin': '*' } });
  });
  return { calls, completed, responses, options };
}
