// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let db: PGlite;
const user = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const apply = async (name: string) => db.exec(await read(`supabase/migrations/${name}.sql`));
const login = async (role = 'authenticated', id = user) => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec(`set role ${role}`);
};
const submit = async (body = 'Письмо себе') => (await db.query<{ result: Record<string, any> }>(
  'select public.submit_future_letter($1) result', [body],
)).rows[0]!.result;
const claim = async () => (await db.query<{ id: string; claim_token: string }>('select * from public.claim_future_letters(10)')).rows;
const start = async (row: { id: string; claim_token: string }) => (await db.query<{ result: boolean }>(
  'select public.begin_future_letter_send($1,$2) result', [row.id, row.claim_token],
)).rows[0]!.result;
const finish = async (row: { id: string; claim_token: string }, outcome: string) => (await db.query<{ result: boolean }>(
  'select public.finish_future_letter_send($1,$2,$3,$4,$5) result', [row.id, row.claim_token, outcome,
    outcome === 'sent' ? 'postbox-1' : null, outcome === 'temporary' ? 'provider_throttled' : outcome === 'permanent' ? 'provider_rejected' : outcome === 'uncertain' ? 'provider_connection_lost' : null],
)).rows[0]!.result;
async function due() {
  await db.exec("reset role; update public.future_letters set due_at=now()-interval '1 minute', next_attempt_at=now()-interval '1 minute'; set role service_role;");
}
async function row() {
  await db.exec('reset role'); return (await db.query<Record<string, any>>('select * from public.future_letters')).rows[0]!;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function public.is_admin() returns boolean language sql as $$ select false $$;`);
  await apply('001_init_schema');
  await db.exec(`alter table public.user_tasks add column status text not null default 'not_started', add column completed_at timestamptz;
    insert into auth.users values ('${user}','confirmed@example.org',now()),('${other}','other@example.org',now());
    insert into public.tasks(id,slug,title,task_type) values (16,'task-16','Future','content'),(8,'task-08','Gratitude','content'),(6,'task-06','Tarot','content');
    insert into public.user_tasks(user_id,task_id,position,available_date) values ('${user}',16,16,current_date-1),('${other}',16,16,current_date-1),('${user}',8,8,current_date-1),('${user}',6,6,current_date-1);`);
  await db.exec(await read('tests/sql/production-submit-future-letter.sql'));
  await db.exec(await read('tests/sql/production-save-task-progress.sql'));
  await apply('014_future_letters'); await apply('015_future_letter_delivery');
  await apply('016_block_legacy_future_letter_save');
}, 30_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec(`reset role; truncate public.future_letters, public.task_responses;
    update public.user_tasks set status='not_started', completed_at=null, available_date=current_date-1;
    update auth.users set email_confirmed_at=now();`);
  await login();
});

describe('production RPC and delivery SQL compatibility', () => {
  it('atomically saves the private letter, confirmed recipient, safe metadata, and exactly 15 minutes', async () => {
    const result = await submit(); expect(result).toMatchObject({ already_submitted: false, status: 'completed', task_id: 16 });
    expect(Date.parse(result.due_at) - Date.parse(result.completed_at)).toBe(900_000);
    expect(result.response).toEqual({ letter_id: result.letter_id, deliver_on: result.due_at, scheduled: true });
    const stored = await row(); expect(stored.recipient_email).toBe('confirmed@example.org'); expect(stored.body).toBe('Письмо себе');
    const response = (await db.query('select response from public.task_responses')).rows[0]!;
    expect(JSON.stringify(response)).not.toContain('Письмо себе'); expect(JSON.stringify(response)).not.toContain('@');
    expect((await db.query("select status from public.user_tasks where user_id=$1 and task_id=16", [user])).rows[0]).toEqual({ status: 'completed' });
  });
  it('returns the reduced repeat response without overwriting the first letter', async () => {
    const first = await submit(); const again = await submit('Другое письмо');
    expect(again).toEqual({ letter_id: first.letter_id, task_id: 16, status: 'completed', due_at: first.due_at, already_submitted: true });
    expect((await row()).body).toBe('Письмо себе');
  });
  it('preserves existing rows and the production submit RPC when reapplying the baseline', async () => {
    const saved = await submit(); await db.exec('reset role');
    const before = await db.query("select pg_get_functiondef('public.submit_future_letter(text)'::regprocedure) source");
    await apply('014_future_letters');
    expect(await db.query("select pg_get_functiondef('public.submit_future_letter(text)'::regprocedure) source")).toEqual(before);
    expect((await row()).id).toBe(saved.letter_id);
  });
  it('rejects schema drift transactionally without deleting data', async () => {
    await submit(); await db.exec('reset role; alter table public.future_letters rename column body to unexpected_body');
    await expect(apply('014_future_letters')).rejects.toThrow('Incompatible future_letters column: body');
    await db.exec('rollback; alter table public.future_letters rename column unexpected_body to body');
    expect((await row()).body).toBe('Письмо себе');
  });
  it('rejects unconfirmed users, unavailable tasks, invalid bodies, and unauthenticated calls', async () => {
    await db.exec('reset role; update auth.users set email_confirmed_at=null'); await login();
    await expect(submit()).rejects.toThrow('Confirmed email');
    await db.exec('reset role; update auth.users set email_confirmed_at=now(); update public.user_tasks set available_date=current_date+1'); await login();
    await expect(submit()).rejects.toThrow('not available');
    await expect(submit(' ')).rejects.toThrow('Invalid letter body');
    await login('anon', ''); await expect(submit()).rejects.toThrow('permission denied');
  });
  it('denies client table access and every internal RPC', async () => {
    for (const role of ['anon','authenticated']) {
      await login(role);
      await expect(db.query('select * from public.future_letters')).rejects.toThrow('permission denied');
      await expect(claim()).rejects.toThrow('permission denied');
      await expect(db.query('select public.reap_future_letter_locks()')).rejects.toThrow('permission denied');
      await expect(start({ id: user, claim_token: user })).rejects.toThrow('permission denied');
      await expect(finish({ id: user, claim_token: user }, 'sent')).rejects.toThrow('permission denied');
    }
  });
  it('blocks old task-16 saves and retains production gratitude and Tarot behavior', async () => {
    await expect(db.query("select public.save_task_progress(16,'{}',true)")).rejects.toThrow('submit_future_letter');
    const saved = await db.query<{ result: any }>(`select public.save_task_progress(8,'{"sent":true}',true) result`);
    expect(saved.rows[0]!.result).toMatchObject({ task_id: 8, status: 'completed', response: { sent: true } });
    await expect(db.query("select public.save_task_progress(6,'{}',true)")).rejects.toThrow('claim_tarot_card');
  });
  it('refuses to overwrite an unreviewed production save function', async () => {
    await db.exec('reset role');
    await expect(apply('016_block_legacy_future_letter_save')).rejects.toThrow('differs from reviewed');
    await db.exec('rollback');
  });
  it('does not claim before due_at or next_attempt_at', async () => {
    await submit(); await login('service_role'); expect(await claim()).toEqual([]);
    await db.exec("reset role; update public.future_letters set due_at=now()-interval '1 minute'; set role service_role");
    expect(await claim()).toEqual([]);
  });
  it('never gives the same letter to two claimers and consumes a token only once', async () => {
    await submit(); await due();
    const claims = await Promise.all([claim(), claim()]); expect(claims.flat()).toHaveLength(1);
    const claimed = claims.flat()[0]!;
    expect(await start({ ...claimed, claim_token: other })).toBe(false);
    expect(await start(claimed)).toBe(true); expect(await start(claimed)).toBe(false);
    expect(await finish(claimed, 'sent')).toBe(true); expect(await finish(claimed, 'sent')).toBe(false);
    expect(await row()).toMatchObject({ status: 'sent', provider_message_id: 'postbox-1', attempts: 1, claim_token: null });
  });
  it('backs off a definitive temporary rejection and stops at five attempts', async () => {
    await submit(); await due(); let claimed = (await claim())[0]!;
    await start(claimed); await finish(claimed, 'temporary');
    let stored = await row(); expect(stored.status).toBe('pending');
    expect(new Date(stored.next_attempt_at).getTime() - Date.now()).toBeGreaterThan(55_000);
    await login('service_role'); expect(await claim()).toEqual([]);
    await db.exec('reset role; update public.future_letters set attempts=4'); await due();
    claimed = (await claim())[0]!; await start(claimed); await finish(claimed, 'temporary');
    stored = await row(); expect(stored).toMatchObject({ status: 'failed', attempts: 5, delivery_uncertain: false });
    await due(); expect(await claim()).toEqual([]);
  });
  it.each(['permanent','uncertain'])('never automatically retries %s results', async outcome => {
    await submit(); await due(); const claimed = (await claim())[0]!;
    await start(claimed); await finish(claimed, outcome);
    expect(await row()).toMatchObject({ status: 'failed', delivery_uncertain: outcome === 'uncertain' });
    await due(); expect(await claim()).toEqual([]);
  });
  it.each([false,true])('safely reaps expired locks when sending started=%s', async started => {
    await submit(); await due(); const claimed = (await claim())[0]!;
    if (started) await start(claimed);
    await db.exec("reset role; update public.future_letters set locked_until=now()-interval '1 minute'; set role service_role");
    expect(await start(claimed)).toBe(false);
    await db.exec('select public.reap_future_letter_locks()');
    expect(await row()).toMatchObject({ status: started ? 'failed' : 'pending', delivery_uncertain: started, claim_token: null });
    await login('service_role'); const next = await claim();
    expect(next).toHaveLength(started ? 0 : 1);
    expect(await start(claimed)).toBe(false); expect(await finish(claimed, 'sent')).toBe(false);
  });
});
