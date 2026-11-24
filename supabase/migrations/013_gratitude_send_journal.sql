-- Postbox SendEmail has no idempotency token. Reserve durably BEFORE calling it.
-- Never expire/release a pending or unknown send automatically: it may be queued.
create table public.gratitude_sends (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    task_id bigint not null references public.tasks(id) on delete cascade,
    request_id uuid not null,
    payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
    state text not null default 'pending' check (state in ('pending', 'accepted', 'rejected', 'unknown')),
    provider_message_id text,
    reason text check (reason in ('quota', 'provider')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, request_id),
    check ((state = 'accepted') = (provider_message_id is not null)),
    check ((state = 'rejected') = (reason is not null))
);
-- Deduplicate even after a reload/new UUID. Definitive rejections may be retried
-- explicitly with a NEW request ID; they still count towards rate limits.
create unique index gratitude_sends_payload on public.gratitude_sends (user_id, task_id, payload_hash)
    where state <> 'rejected';
create index gratitude_sends_rate on public.gratitude_sends (user_id, created_at);

alter table public.gratitude_sends enable row level security;
revoke all on public.gratitude_sends from public, anon, authenticated, service_role;

create function public.reserve_gratitude_send(p_user_id uuid, p_task_id bigint, p_request_id uuid, p_payload_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
    existing public.gratitude_sends%rowtype;
begin
    if p_request_id is null or p_payload_hash is null or p_payload_hash !~ '^[0-9a-f]{64}$' then
        raise exception 'Invalid send reservation';
    end if;
    -- Serialize concurrent requests from this user for task 08, including limits.
    perform 1 from public.user_tasks ut join public.tasks t on t.id = ut.task_id
      where ut.user_id = p_user_id and ut.task_id = p_task_id
        and ut.available_date <= (now() at time zone 'Europe/Moscow')::date
        and t.slug = 'task-08' and t.is_active for update of ut;
    if not found then return jsonb_build_object('decision', 'forbidden'); end if;

    select * into existing from public.gratitude_sends where user_id = p_user_id and request_id = p_request_id;
    if found then
        if existing.task_id <> p_task_id or existing.payload_hash <> p_payload_hash then
            return jsonb_build_object('decision', 'conflict');
        end if;
        return jsonb_build_object('decision', existing.state, 'id', existing.id, 'reason', existing.reason);
    end if;
    select * into existing from public.gratitude_sends
      where user_id = p_user_id and task_id = p_task_id and payload_hash = p_payload_hash and state <> 'rejected';
    if found then
        return jsonb_build_object('decision', existing.state, 'id', existing.id, 'reason', existing.reason);
    end if;
    if exists (select 1 from public.gratitude_sends where user_id = p_user_id and created_at > now() - interval '60 seconds')
       or (select count(*) from public.gratitude_sends where user_id = p_user_id and created_at > now() - interval '1 hour') >= 5
       or (select count(*) from public.gratitude_sends where user_id = p_user_id and created_at > now() - interval '24 hours') >= 20 then
        return jsonb_build_object('decision', 'limited');
    end if;
    insert into public.gratitude_sends (user_id, task_id, request_id, payload_hash)
      values (p_user_id, p_task_id, p_request_id, p_payload_hash) returning * into existing;
    return jsonb_build_object('decision', 'send', 'id', existing.id);
end;
$$;
revoke all on function public.reserve_gratitude_send(uuid, bigint, uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_gratitude_send(uuid, bigint, uuid, text) to service_role;

create function public.finish_gratitude_send(p_id uuid, p_state text, p_message_id text, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
    if p_state is null or p_state not in ('accepted', 'rejected', 'unknown')
      or (p_state = 'accepted' and coalesce(length(btrim(p_message_id)), 0) = 0) then
        raise exception 'Invalid send outcome';
    end if;
    update public.gratitude_sends set state = p_state, provider_message_id = p_message_id,
      reason = p_reason, updated_at = now() where id = p_id and state = 'pending';
    if not found then raise exception 'Send outcome already recorded or reservation missing'; end if;
    return jsonb_build_object('saved', true);
end;
$$;
revoke all on function public.finish_gratitude_send(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.finish_gratitude_send(uuid, text, text, text) to service_role;
