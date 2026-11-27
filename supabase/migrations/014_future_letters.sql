begin;

-- Baseline for fresh databases; an existing production table and its rows stay intact.
create table if not exists public.future_letters (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    task_id bigint not null references public.tasks(id) on delete cascade,
    recipient_email text not null,
    body text not null check (char_length(btrim(body)) > 0 and octet_length(body) <= 60000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    due_at timestamptz not null default (now() + interval '15 minutes'),
    next_attempt_at timestamptz not null default (now() + interval '15 minutes'),
    status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
    attempts integer not null default 0 check (attempts >= 0),
    claim_token uuid,
    locked_until timestamptz,
    send_started_at timestamptz,
    delivery_uncertain boolean not null default false,
    sent_at timestamptz,
    last_error text,
    provider_message_id text,
    unique (user_id, task_id)
);

-- Fail transactionally on schema drift instead of silently changing a live column.
do $$
declare expected record;
begin
    for expected in select * from (values
        ('id','uuid'), ('user_id','uuid'), ('task_id','bigint'),
        ('recipient_email','text'), ('body','text'), ('created_at','timestamp with time zone'),
        ('updated_at','timestamp with time zone'), ('due_at','timestamp with time zone'),
        ('next_attempt_at','timestamp with time zone'), ('status','text'), ('attempts','integer'),
        ('claim_token','uuid'), ('locked_until','timestamp with time zone'),
        ('send_started_at','timestamp with time zone'), ('delivery_uncertain','boolean'),
        ('sent_at','timestamp with time zone'), ('last_error','text'), ('provider_message_id','text')
    ) columns(name, type_name)
    loop
        if not exists (select 1 from pg_catalog.pg_attribute
            where attrelid = 'public.future_letters'::regclass and attname = expected.name
                and not attisdropped and pg_catalog.format_type(atttypid, atttypmod) = expected.type_name) then
            raise exception 'Incompatible future_letters column: %', expected.name;
        end if;
    end loop;
    if exists (select 1 from public.future_letters where user_id is null or task_id is null
        or recipient_email is null or body is null or due_at is null or next_attempt_at is null
        or status is null or status not in ('pending','processing','sent','failed')
        or attempts is null or attempts < 0 or delivery_uncertain is null) then
        raise exception 'Incompatible future_letters data; inspect manually';
    end if;
end $$;

-- Keep the existing production unique constraint, regardless of its name.
do $$
begin
    if not exists (select 1 from pg_catalog.pg_constraint c
        where c.conrelid = 'public.future_letters'::regclass and c.contype in ('u','p')
          and (select array_agg(a.attname::text order by a.attname)
              from pg_catalog.pg_attribute a where a.attrelid = c.conrelid and a.attnum = any(c.conkey))
              = array['task_id','user_id']::text[]) then
        create unique index if not exists future_letters_user_task_delivery_key on public.future_letters(user_id, task_id);
    end if;
end $$;
create index if not exists future_letters_pending_delivery on public.future_letters(next_attempt_at, due_at)
    where status = 'pending';
create index if not exists future_letters_processing_delivery on public.future_letters(locked_until)
    where status = 'processing';
alter table public.future_letters enable row level security;
revoke all on public.future_letters from public, anon, authenticated, service_role;

-- Existing production RPC is a prerequisite. Its exact supplied definition is
-- recorded in tests/sql/production-submit-future-letter.sql for compatibility tests.
-- Do not create, replace, or duplicate the installed RPC during this migration.
do $baseline$
begin
    if to_regprocedure('public.submit_future_letter(text)') is null then
        raise exception 'Install the reviewed production submit_future_letter definition first';
    end if;
    if not exists (select 1 from pg_catalog.pg_proc
        where oid = 'public.submit_future_letter(text)'::regprocedure and prosecdef
            and prorettype in ('json'::regtype, 'jsonb'::regtype) and not proretset
            and proargnames = array['p_body']::text[]) then
        raise exception 'Incompatible submit_future_letter; inspect production definition';
    end if;
end $baseline$;
revoke all on function public.submit_future_letter(text) from public, anon;
grant execute on function public.submit_future_letter(text) to authenticated;

commit;
