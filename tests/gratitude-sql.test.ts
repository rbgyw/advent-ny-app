// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let db: PGlite;
const user = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const id = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const hash = (n: number) => n.toString(16).padStart(64, '0');
async function reserve(n = 1, payload = n, userId = user, task = 8) {
  return (await db.query<{ result: { decision: string; id: string; reason?: string } }>(
    'select public.reserve_gratitude_send($1,$2,$3,$4) result', [userId, task, id(n), hash(payload)],
  )).rows[0]!.result;
}
async function finish(sendId: string, state: string, messageId: string | null = null, reason: string | null = null) {
  return db.query('select public.finish_gratitude_send($1,$2,$3,$4)', [sendId, state, messageId, reason]);
}
async function age(minutes: number) {
  await db.exec(`reset role; update public.gratitude_sends set created_at=created_at-interval '${minutes} minutes'; set role service_role;`);
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users(id uuid primary key);`);
  await db.exec(await readFile(new URL('../supabase/migrations/001_init_schema.sql', import.meta.url), 'utf8'));
  await db.exec(`insert into auth.users values ('${user}'),('${other}');
    insert into public.tasks(id,slug,title,task_type) values (8,'task-08','Письмо','content'),(9,'task-09','Other','content');
    insert into public.user_tasks(user_id,task_id,position,available_date) values
      ('${user}',8,8,current_date-1),('${user}',9,9,current_date-1),('${other}',8,8,current_date+2);`);
  await db.exec(await readFile(new URL('../supabase/migrations/013_gratitude_send_journal.sql', import.meta.url), 'utf8'));
}, 30_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await db.exec('reset role; truncate public.gratitude_sends; set role service_role;'); });

describe('durable Postbox reservations in PostgreSQL', () => {
  it('denies client reads, writes, reservations and forged outcomes', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      await expect(db.query('select * from public.gratitude_sends')).rejects.toThrow(/permission denied/);
      await expect(reserve()).rejects.toThrow(/permission denied/);
      await expect(finish(id(1), 'accepted', 'forged')).rejects.toThrow(/permission denied/);
      await expect(db.query("update public.gratitude_sends set state='accepted'")).rejects.toThrow(/permission denied/);
    }
    await db.exec('set role service_role');
    await expect(db.query('select * from public.gratitude_sends')).rejects.toThrow(/permission denied/);
    expect((await reserve()).decision).toBe('send');
  });
  it('reserves only active, assigned, open task 08', async () => {
    expect((await reserve(1, 1, other)).decision).toBe('forbidden');
    expect((await reserve(1, 1, user, 9)).decision).toBe('forbidden');
    await db.exec('reset role; update public.tasks set is_active=false where id=8; set role service_role;');
    expect((await reserve()).decision).toBe('forbidden');
    await db.exec('reset role; update public.tasks set is_active=true where id=8;');
  });
  it('allows exactly one concurrent reservation and deduplicates new UUIDs indefinitely', async () => {
    const results = await Promise.all([reserve(), reserve(), reserve(2, 1)]);
    expect(results.map(row => row.decision)).toEqual(['send', 'pending', 'pending']);
    await age(60 * 48);
    expect((await reserve(3, 1)).decision).toBe('pending');
    await finish(results[0]!.id, 'accepted', 'postbox-id');
    expect((await reserve()).decision).toBe('accepted');
    expect((await reserve(4, 1)).decision).toBe('accepted');
    expect((await reserve(1, 99)).decision).toBe('conflict');
  });
  it('keeps unknown outcomes locked, and never rewrites a terminal outcome', async () => {
    const row = await reserve(); await finish(row.id, 'unknown');
    await age(60 * 48);
    expect((await reserve()).decision).toBe('unknown');
    expect((await reserve(2, 1)).decision).toBe('unknown');
    await expect(finish(row.id, 'accepted', 'late')).rejects.toThrow('already recorded');
  });
  it('requires a MessageId for acceptance and validates outcome consistency', async () => {
    const row = await reserve();
    await expect(finish(row.id, 'delivered')).rejects.toThrow('Invalid send outcome');
    await expect(finish(row.id, 'accepted')).rejects.toThrow('Invalid send outcome');
    await expect(finish(row.id, 'rejected', null, null)).rejects.toThrow(/check constraint/);
    expect((await reserve()).decision).toBe('pending');
  });
  it('permits explicit new attempts only after definitive rejection and the cooldown', async () => {
    const row = await reserve(); await finish(row.id, 'rejected', null, 'quota');
    expect(await reserve()).toMatchObject({ decision: 'rejected', reason: 'quota' });
    expect((await reserve(2, 1)).decision).toBe('limited');
    await age(2);
    expect((await reserve(2, 1)).decision).toBe('send');
    expect((await reserve()).decision).toBe('rejected');
  });
  it('enforces cooldown and five new attempts per rolling hour, counting rejected mail', async () => {
    expect((await reserve(1)).decision).toBe('send');
    expect((await reserve(2)).decision).toBe('limited');
    for (let n = 2; n <= 5; n++) {
      await age(2);
      const row = await reserve(n); expect(row.decision).toBe('send');
      await finish(row.id, 'rejected', null, 'provider');
    }
    await age(2);
    expect((await reserve(6)).decision).toBe('limited');
    await age(61);
    expect((await reserve(6)).decision).toBe('send');
  });
  it('enforces twenty new attempts per rolling 24 hours', async () => {
    for (let n = 1; n <= 20; n++) {
      const row = await reserve(n); expect(row.decision).toBe('send');
      await finish(row.id, 'rejected', null, 'provider');
      await age(n % 5 === 0 ? 61 : 2);
    }
    expect((await reserve(21)).decision).toBe('limited');
    await age(24 * 60);
    expect((await reserve(21)).decision).toBe('send');
  });
  it('stores no recipient, sender name or message body in the journal', async () => {
    await reserve();
    await db.exec('reset role');
    const columns = (await db.query<{ column_name: string }>("select column_name from information_schema.columns where table_name='gratitude_sends'")).rows.map(row => row.column_name);
    expect(columns).toEqual(['id', 'user_id', 'task_id', 'request_id', 'payload_hash', 'state', 'provider_message_id', 'reason', 'created_at', 'updated_at']);
    expect((await db.query('select * from public.task_responses')).rows).toHaveLength(0);
  });
});
