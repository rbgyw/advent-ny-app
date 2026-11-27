// @vitest-environment node
// Production rollout state: 014/015 installed, 016 deliberately not installed.
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';

const user = '10000000-0000-4000-8000-000000000001';
let db: PGlite;
const sql = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const submit = async () => (await db.query<{ result: Record<string, unknown> }>(
  "select public.submit_future_letter('Письмо для будущего себя') result",
)).rows[0]!.result;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function public.is_admin() returns boolean language sql as $$ select false $$;`);
  await db.exec(await sql('supabase/migrations/001_init_schema.sql'));
  await db.exec(`alter table public.user_tasks add column status text not null default 'not_started', add column completed_at timestamptz;
    insert into auth.users values ('${user}','account@geropharm.com',now());
    insert into public.tasks(id,slug,title,task_type) values (16,'task-16','Future','content'),(8,'task-08','Gratitude','content');
    insert into public.user_tasks(user_id,task_id,position,available_date) values ('${user}',16,16,current_date-1),('${user}',8,8,current_date-1);`);
  await db.exec(await sql('tests/sql/production-submit-future-letter.sql'));
  await db.exec(await sql('tests/sql/production-save-task-progress.sql'));
  await db.exec(await sql('supabase/migrations/014_future_letters.sql'));
  await db.exec(await sql('supabase/migrations/015_future_letter_delivery.sql'));
}, 30_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec('reset role; truncate public.future_letters, public.task_responses; update public.user_tasks set status=\'not_started\', completed_at=null');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec('set role authenticated');
});

it('supports the frontend first-submit and retry contracts without migration 016', async () => {
  const first = await submit(), repeated = await submit();
  expect(first).toMatchObject({ task_id: 16, status: 'completed', already_submitted: false });
  expect(repeated).toEqual({ task_id: 16, status: 'completed', already_submitted: true,
    due_at: first.due_at, letter_id: first.letter_id });
  expect(first.response).toEqual({ letter_id: first.letter_id, deliver_on: first.due_at, scheduled: true });
  expect(Date.parse(first.due_at as string) - Date.parse(first.completed_at as string)).toBe(15 * 60_000);
});
it('leaves gratitude progress saving available before switchover', async () => {
  const saved = (await db.query<{ result: unknown }>(`select public.save_task_progress(8,'{"sent":true}',true) result`)).rows[0]!.result;
  expect(saved).toMatchObject({ task_id: 8, status: 'completed', response: { sent: true } });
});
it('surfaces an old completion without a queued letter instead of claiming successful storage', async () => {
  await db.exec(`select public.save_task_progress(16,'{"legacy":true}',true)`);
  await expect(submit()).rejects.toThrow('Task is already completed');
  await db.exec('reset role');
  expect((await db.query('select id from public.future_letters')).rows).toHaveLength(0);
});
