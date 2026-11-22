// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, expect, it } from 'vitest';

const user = '10000000-0000-4000-8000-000000000001';
const otherUser = '10000000-0000-4000-8000-000000000002';
let db: PGlite;

async function allowed(taskId: number, owner = user) {
  const { rows } = await db.query<{ allowed: boolean }>(
    'select public.can_upload_task_attachment($1, $2) as allowed', [owner, taskId],
  );
  return rows[0]!.allowed;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create function public.is_admin() returns boolean language sql stable as $$
      select current_setting('test.is_admin', true) = 'true'
    $$;`);
  await db.exec(await readFile(new URL('../supabase/migrations/001_init_schema.sql', import.meta.url), 'utf8'));
  await db.exec("alter table public.user_tasks add status text not null default 'not_started'");
  await db.query('insert into auth.users values ($1), ($2)', [user, otherUser]);
  // The slug identifies the memory even if Supabase assigned it a different ID.
  await db.exec(`insert into public.tasks(id, slug, title, task_type) values
    (103, 'task-03', 'Воспоминание', 'text'), (7, 'task-07', 'Фото', 'content'),
    (17, 'task-17', 'Фото', 'content'), (4, 'task-04', 'Кроссворд', 'crossword');`);
  await db.query(`insert into public.user_tasks(user_id, task_id, position, available_date)
    select $1, id, row_number() over (order by id), (now() at time zone 'Europe/Moscow')::date - 1
    from public.tasks`, [user]);
  await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('test.is_admin', 'false', false)", [user]);
  await db.exec(await readFile(new URL('../supabase/migrations/010_enable_memory_attachments.sql', import.meta.url), 'utf8'));
}, 30_000);

afterAll(async () => { await db?.close(); });

it('allows photos for the open memory and the previous photo tasks', async () => {
  await expect(allowed(103)).resolves.toBe(true);
  await expect(allowed(7)).resolves.toBe(true);
  await expect(allowed(17)).resolves.toBe(true);
  await expect(allowed(4)).resolves.toBe(false);
  await expect(allowed(103, otherUser)).resolves.toBe(false);
});

it('preserves ownership, activation, date, status and existing admin behavior', async () => {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [otherUser]);
  await expect(allowed(103, otherUser)).resolves.toBe(false);
  await expect(allowed(103)).resolves.toBe(false);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user]);

  await db.exec("update public.user_tasks set available_date = (now() at time zone 'Europe/Moscow')::date + 1 where task_id = 103");
  await expect(allowed(103)).resolves.toBe(false);
  await db.exec("update public.user_tasks set available_date = (now() at time zone 'Europe/Moscow')::date, status = 'completed' where task_id = 103");
  await expect(allowed(103)).resolves.toBe(false);
  await db.exec("select set_config('test.is_admin', 'true', false)");
  await expect(allowed(103)).resolves.toBe(true);
  await db.exec('update public.tasks set is_active = false where id = 103');
  await expect(allowed(103)).resolves.toBe(false);
});
