-- READ ONLY. Run manually before applying 014/015/016. No addresses or bodies.
select pg_get_functiondef('public.submit_future_letter(text)'::regprocedure);
select pg_get_functiondef('public.save_task_progress(bigint,jsonb,boolean)'::regprocedure);
select column_name, data_type, is_nullable, column_default
from information_schema.columns where table_schema='public' and table_name='future_letters'
order by ordinal_position;
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.future_letters'::regclass;
select indexname, indexdef from pg_indexes where schemaname='public' and tablename='future_letters';
select relrowsecurity, relforcerowsecurity from pg_class where oid='public.future_letters'::regclass;
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='future_letters';
select status, delivery_uncertain, count(*) as letters,
    count(*) filter (where due_at<=now() and next_attempt_at<=now()) as due,
    count(*) filter (where status='processing' and (locked_until is null or locked_until<=now())) as stale
from public.future_letters group by status, delivery_uncertain;

-- Existing old-frontend completions cannot be repaired by resubmitting: the
-- production RPC rejects completed assignments with no future_letters row.
-- Counts only: inspect and resolve privately before switching, never auto-copy bodies.
select count(*) as completed_task16_without_letter
from public.user_tasks assignment
join public.tasks task on task.id=assignment.task_id and task.slug='task-16'
left join public.future_letters letter on letter.user_id=assignment.user_id and letter.task_id=assignment.task_id
where assignment.status='completed' and letter.id is null;
select count(*) as task16_responses_with_legacy_private_fields
from public.task_responses response
join public.tasks task on task.id=response.task_id and task.slug='task-16'
where response.response ?| array['text','body','email'];
