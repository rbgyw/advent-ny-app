// Real independent PostgreSQL sessions, isolated container, no ports or mail traffic.
import { spawn, execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const container = `future-letter-test-${process.pid}`;
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
function query(sql, marker) {
  const child = spawn('docker', ['exec', '-i', container, 'psql', '-h', '127.0.0.1', '-U', 'postgres', '-qAt', '-v', 'ON_ERROR_STOP=1'], { stdio: ['pipe','pipe','pipe'] });
  let output = '', error = '';
  let ready;
  const started = new Promise(resolve => { ready = resolve; });
  child.stdout.on('data', data => { output += data; if (output.includes(marker ?? '')) ready(); });
  child.stderr.on('data', data => { error += data; });
  const done = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(output.trim()) : reject(new Error(error)));
  });
  child.stdin.end(sql);
  return { started: marker ? Promise.race([started, done.then(() => {
    if (!output.includes(marker)) throw new Error(`PostgreSQL session ended before ${marker}`);
  })]) : started, done };
}
const sqlFile = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const user = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
try {
  docker('run', '--detach', '--name', container, '--network', 'none', '--tmpfs', '/var/lib/postgresql/data',
    '--env', 'POSTGRES_HOST_AUTH_METHOD=trust', 'postgres:17-alpine');
  let available = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { docker('exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres'); available = true; break; } catch { await delay(250); }
  }
  assert.ok(available, 'Local PostgreSQL did not start');
  const setup = `create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function public.is_admin() returns boolean language sql as $$ select false $$;
    ${await sqlFile('supabase/migrations/001_init_schema.sql')}
    alter table public.user_tasks add column status text default 'not_started', add column completed_at timestamptz;
    insert into auth.users values ('${user}','test@example.org',now()),('${other}','test2@example.org',now());
    insert into public.tasks(id,slug,title,task_type) values (16,'task-16','Future','content');
    insert into public.user_tasks(user_id,task_id,position,available_date) values ('${user}',16,16,current_date-1),('${other}',16,16,current_date-1);
    ${await sqlFile('tests/sql/production-submit-future-letter.sql')}
    ${await sqlFile('tests/sql/production-save-task-progress.sql')}
    ${await sqlFile('supabase/migrations/014_future_letters.sql')}
    ${await sqlFile('supabase/migrations/015_future_letter_delivery.sql')}
    ${await sqlFile('supabase/migrations/016_block_legacy_future_letter_save.sql')}`;
  await query(setup).done;
  // Hold the assignment lock in session 1. A simultaneous retry must return
  // already_submitted=true after commit, preserving the first private body.
  const firstSubmit = query(`begin; set local request.jwt.claim.sub='${user}'; set local role authenticated;
    select public.submit_future_letter('first private body');
    \\echo SUBMITTED
    select pg_sleep(1); commit;`, 'SUBMITTED');
  await firstSubmit.started;
  const retry = await query(`set request.jwt.claim.sub='${user}'; set role authenticated;
    select public.submit_future_letter('second body');`).done;
  const submitted = JSON.parse((await firstSubmit.done).split('\n')[0]);
  assert.equal(JSON.parse(retry).already_submitted, true);
  assert.equal(JSON.parse(retry).letter_id, submitted.letter_id);
  assert.equal(await query('select body from public.future_letters').done, 'first private body');
  await query(`set request.jwt.claim.sub='${other}'; select public.submit_future_letter('other letter');
    update public.future_letters set due_at=now()-interval '1 minute', next_attempt_at=now()-interval '1 minute';`).done;
  // Session 1 retains row locks. Session 2 must skip those rows without waiting,
  // and claim another eligible letter instead of claiming the same one.
  const first = query(`begin; set local role service_role;
    select row_to_json(c) from public.claim_future_letters(1) c;
    \\echo LOCKED
    select pg_sleep(1); commit;`, 'LOCKED');
  await first.started;
  const second = JSON.parse(await query('set role service_role; select row_to_json(c) from public.claim_future_letters(10) c;').done);
  const held = JSON.parse((await first.done).split('\n')[0]);
  assert.notEqual(held.id, second.id);
  const beginSql = `set role service_role; select public.begin_future_letter_send('${held.id}','${held.claim_token}');`;
  const starts = await Promise.all([query(beginSql).done, query(beginSql).done]);
  assert.deepEqual(starts.sort(), ['f','t']);
  assert.equal(await query(`select attempts from public.future_letters where id='${held.id}'`).done, '1');
  console.log('PASS: concurrent submit deduplication, FOR UPDATE SKIP LOCKED across sessions, single send-start per token (PostgreSQL 17).');
} finally {
  try { docker('rm', '--force', '--volumes', container); } catch { /* The test may have failed before container creation. */ }
}
