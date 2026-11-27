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
