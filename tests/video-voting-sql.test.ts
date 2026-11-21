// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
// @ts-expect-error Standalone Node publishing script.
import { generateVideoCatalogSql } from '../scripts/generate-video-catalog.mjs';

let db: PGlite;
const user1 = '10000000-0000-4000-8000-000000000001';
const user2 = '10000000-0000-4000-8000-000000000002';
const stranger = '10000000-0000-4000-8000-000000000003';
async function login(user: string | null, role = 'authenticated') {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user ?? ''}', false); set role ${role};`);
}
async function state() {
  return (await db.query<{ state: { votes: { video_id: string; liked: boolean }[]; ranking: { video_id: string; likes: number }[]; complete: boolean } }>('select public.get_advent_video_state(22) as state')).rows[0]!.state;
}
async function vote(id: string, liked = true) {
  return db.query('select public.vote_advent_video(22, $1, $2)', [id, liked]);
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`);
  await db.exec(await readFile(new URL('../supabase/migrations/001_init_schema.sql', import.meta.url), 'utf8'));
  // The deployed generic RPC is not versioned in this repository. Use its existing
  // response/completion contract here to exercise the new voting transaction.
  await db.exec(`create function public.save_task_progress(p_task_id bigint, p_response jsonb, p_complete boolean)
    returns jsonb language plpgsql security definer set search_path = '' as $$ begin
      insert into public.task_responses(user_id,task_id,response,completed_at)
      values(auth.uid(),p_task_id,p_response,case when p_complete then now() else null end)
      on conflict (user_id,task_id) do update set response=excluded.response, completed_at=excluded.completed_at;
      return p_response;
    end $$;
    insert into auth.users values ('${user1}'),('${user2}'),('${stranger}');
    insert into public.tasks(id,slug,title,task_type) values (22,'task-22','Видео','content'),(99,'other','Other','content');
    insert into public.user_tasks(user_id,task_id,position,available_date) values
      ('${user1}',22,22,current_date),('${user2}',22,22,current_date),('${stranger}',22,22,current_date+1);`);
  await db.exec(await readFile(new URL('../supabase/migrations/006_advent_video_voting.sql', import.meta.url), 'utf8'));
  await db.exec(generateVideoCatalogSql([
    { id: 'a', title: "Видео ' $$ ; drop table public.tasks; --", videoUrl: 'a.mp4' },
    { id: 'b', title: 'B', videoUrl: 'b.mp4' },
  ]));
}, 30000);
afterAll(async () => { await db?.close(); });

describe('PostgreSQL video voting permissions and counts', () => {
  it('rejects anonymous access and a task whose date has not arrived', async () => {
    await login(null, 'anon');
    await expect(state()).rejects.toThrow(/permission denied/);
    await login(stranger);
    await expect(state()).rejects.toThrow('Задание пока недоступно');
    await login(user1);
    expect((await state()).complete).toBe(false);
  });
  it('blocks direct table access and exposes only aggregate counts plus own choices', async () => {
    await login(user1);
    await expect(db.query('select * from public.advent_video_votes')).rejects.toThrow(/permission denied/);
    await expect(db.query(`insert into public.advent_video_votes values (22,'a','${user2}',true,now())`)).rejects.toThrow(/permission denied/);
    expect((await state()).votes).toEqual([]);
  });
  it('does not accept unknown videos or missing choices', async () => {
    await expect(vote('missing')).rejects.toThrow('Видео больше не участвует');
    await expect(db.query("select public.vote_advent_video(22,'a',null)")).rejects.toThrow('Выберите оценку');
  });
  it('counts one immutable choice per person, including conflicting retries', async () => {
    await vote('a', true);
    await vote('a', true);
    await vote('a', false);
    const current = await state();
    expect(current.votes).toEqual([{ video_id: 'a', liked: true }]);
    expect(current.ranking.find(row => row.video_id === 'a')!.likes).toBe(1);
    expect(current.complete).toBe(false);
    await db.exec('reset role');
    expect((await db.query('select * from public.task_responses')).rows).toHaveLength(0);
  });
  it('aggregates likes from multiple users without revealing their votes', async () => {
    await login(user2);
    await vote('a', true);
    await vote('b', false);
    const current = await state();
    expect(current.ranking.find(row => row.video_id === 'a')!.likes).toBe(2);
    expect(current.ranking.find(row => row.video_id === 'b')!.likes).toBe(0);
    expect(current.votes).toHaveLength(2);
    expect(current.complete).toBe(true);
    await login(user1);
    expect((await state()).votes).toEqual([{ video_id: 'a', liked: true }]);
    expect((await state()).ranking.find(row => row.video_id === 'a')!.likes).toBe(2);
  });
  it('atomically completes the task only after every published video is rated', async () => {
    await vote('b', true);
    expect((await state()).complete).toBe(true);
    await db.exec('reset role');
    const rows = (await db.query<{ response: unknown; completed_at: unknown }>('select response,completed_at from public.task_responses order by user_id')).rows;
    expect(rows).toHaveLength(2);
    expect(rows.every(row => row.completed_at !== null && JSON.stringify(row.response) === '{"voted":true}')).toBe(true);
  });
  it('keeps historical votes but removes unpublished videos from the top', async () => {
    await db.exec(generateVideoCatalogSql([{ id: 'b', title: 'Updated B', videoUrl: 'b.mp4' }]));
    await login(user1);
    expect((await state()).ranking).toEqual([{ video_id: 'b', likes: 1 }]);
    await expect(vote('a')).rejects.toThrow('Видео больше не участвует');
    await db.exec('reset role');
    expect((await db.query('select * from public.advent_video_votes')).rows).toHaveLength(4);
    expect((await db.query('select * from public.tasks')).rows).toHaveLength(2);
  });
});
