// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const existingUser = '10000000-0000-4000-8000-000000000001';
const newUser = '10000000-0000-4000-8000-000000000002';
const futureUser = '10000000-0000-4000-8000-000000000003';
let db: PGlite;

async function apply(name: string) {
  await db.exec(await readFile(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), 'utf8'));
}

async function login(user: string | null) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? '']);
  await db.exec(user ? 'set role authenticated' : 'set role anon');
}

async function prepare() {
  await db.exec('select public.prepare_advent_calendar()');
}

async function assignments(user: string) {
  return (await db.query<{ id: string; task_id: number; position: number; available_date: string }>(
    `select id, task_id::int, coalesce(calendar_position, position) as position, available_date::text
    from public.user_tasks where user_id = $1 order by 3`, [user],
  )).rows;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;`);
  await apply('001_init_schema');
  await apply('003_rls_policies');
  await apply('004_seed_tasks');
  await db.query('insert into auth.users values ($1), ($2), ($3)', [existingUser, newUser, futureUser]);

  // Model a legacy generator that depends on the original fixed-date count.
  // Use an October schedule to catch code that substitutes December dates.
  await db.exec(`create function public.initialize_user_calendar() returns void language plpgsql
    security definer set search_path = '' as $$ begin
      if (select count(*) from public.tasks where fixed_date is not null) <> 3 then
        raise exception 'Calendar assignments are inconsistent';
      end if;
      insert into public.user_tasks (user_id, task_id, position, available_date)
      select auth.uid(), id, slot, date '2026-10-01' + slot - 1
      from (
        select id, case id when 8 then 10 when 10 then 8 when 15 then 17 when 17 then 15
          else id::integer end as slot
        from public.tasks
      ) tasks on conflict (user_id, position) do nothing;
    end $$;`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [existingUser]);
  await db.exec('select public.initialize_user_calendar()');
  await db.query(
    `insert into public.task_responses (user_id, task_id, response, completed_at)
      values ($1, 15, '{"word":"уют"}', now())`, [existingUser],
  );

  await apply('008_swap_december_tasks_10_and_15');
  await expect(db.exec('select public.initialize_user_calendar()')).rejects.toThrow('Calendar assignments are inconsistent');

  await apply('009_prepare_december_calendar');
  await apply('011_swap_december_3_and_4');
}, 30_000);

afterAll(async () => { await db?.close(); });

describe('calendar preparation after the December swap', () => {
  it('preserves already moved assignments and the saved prediction', async () => {
    await login(existingUser);
    const before = await assignments(existingUser);
    await prepare();
    const after = await assignments(existingUser);
    expect(after[2]).toMatchObject({ task_id: 4, available_date: '2026-10-03' });
    expect(after[3]).toMatchObject({ task_id: 3, available_date: '2026-10-04' });
    expect(after.filter(row => ![3, 4].includes(row.task_id))).toEqual(before.filter(row => ![3, 4].includes(row.task_id)));
    expect(before[9]).toMatchObject({ task_id: 15, available_date: '2026-10-10' });
    expect(before[14]).toMatchObject({ task_id: 10, available_date: '2026-10-15' });
    const result = await db.query<{ response: unknown }>(
      'select response from public.task_responses where task_id = 15',
    );
    expect(result.rows).toEqual([{ response: { word: 'уют' } }]);
  });

  it('initializes a new account on its campaign dates and keeps the same assignments on retry', async () => {
    await login(newUser);
    expect(await assignments(newUser)).toHaveLength(0);
    await prepare();
    const rows = await assignments(newUser);
    expect(rows.map(row => row.position)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    expect(rows[2]).toMatchObject({ task_id: 4, available_date: '2026-10-03' });
    expect(rows[3]).toMatchObject({ task_id: 3, available_date: '2026-10-04' });
    expect(rows[9]).toMatchObject({ task_id: 15, available_date: '2026-10-10' });
    expect(rows[14]).toMatchObject({ task_id: 10, available_date: '2026-10-15' });
    expect(rows[7]).toMatchObject({ task_id: 17, available_date: '2026-10-08' });
    expect(rows[16]).toMatchObject({ task_id: 8, available_date: '2026-10-17' });
    await prepare();
    expect(await assignments(newUser)).toEqual(rows);
    expect(await assignments(existingUser)).toHaveLength(0);
  });

  it('keeps tasks closed until their new window opens', async () => {
    await login(futureUser);
    await db.exec('select public.initialize_user_calendar()');
    await db.exec('reset role');
    await db.query(`update public.user_tasks
        set available_date = case when position >= 15 then current_date + 1 else current_date end
        where user_id = $1`, [futureUser]);
    await login(futureUser);
    await prepare();
    const visible = await db.query<{ slug: string }>(
      "select slug from public.tasks where slug in ('task-10', 'task-15')",
    );
    expect(visible.rows).toEqual([{ slug: 'task-15' }]);
  });

  it('requires authorization', async () => {
    await login(null);
    await expect(prepare()).rejects.toThrow(/permission denied/);
  });
});
