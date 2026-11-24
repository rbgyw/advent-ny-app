// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let db: PGlite;
const user = '10000000-0000-4000-8000-000000000001';
const photo = '20000000-0000-4000-8000-000000000001';
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create table public.tasks(id int primary key, slug text);
    create table public.attachments(id uuid primary key, task_id int, user_id uuid, status text);
    create table public.task_responses(user_id uuid, task_id int, response jsonb, primary key(user_id, task_id));
    insert into public.tasks values (7, 'task-07');
  `);
  await db.query("insert into public.attachments values ($1, 7, $2, 'ready')", [photo, user]);
  for (const name of ['005_guard_sport_submission', '012_validate_basic_sport_submission']) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), 'utf8'));
  }
}, 30_000);
afterAll(async () => db?.close());
async function save(response: object) {
  return db.query(`insert into public.task_responses values ($1, 7, $2)
    on conflict (user_id, task_id) do update set response = excluded.response`, [user, JSON.stringify(response)]);
}
describe('sport photo guard', () => {
  it('requires a ready owned photo for an automatic basic submission', async () => {
    await expect(save({ level: 'basic', submitted: true, attachment_id: null })).rejects.toThrow('Загрузите фотографию');
    await save({ level: 'basic', submitted: true, submitted_for_review: false, attachment_id: photo });
    await expect(save({ level: 'advanced', submitted: true, attachment_id: photo })).rejects.toThrow('зафиксирован');
  });
  it('continues validating review submissions and locks the chosen level', async () => {
    await db.exec('delete from public.task_responses');
    await save({ level: 'team' });
    await expect(save({ level: 'advanced' })).rejects.toThrow('уровень уже зафиксирован');
    await expect(save({ level: 'team', submitted_for_review: true, attachment_id: photo })).rejects.toThrow('позу');
    await save({ level: 'team', team_pose: '03', submitted_for_review: true, attachment_id: photo });
  });
});
