begin;

create or replace function public.reap_future_letter_locks()
returns integer language plpgsql security definer set search_path = '' as $$
declare affected integer;
begin
    with expired as (
        select id from public.future_letters
        where status = 'processing' and locked_until <= clock_timestamp()
        order by locked_until for update skip locked limit 100
    )
    update public.future_letters letter set
        status = case when send_started_at is not null or delivery_uncertain or attempts >= 5 then 'failed' else 'pending' end,
        delivery_uncertain = delivery_uncertain or send_started_at is not null,
        last_error = case when send_started_at is not null then 'expired_after_send_started'
            when delivery_uncertain then 'delivery_uncertain' when attempts >= 5 then 'attempts_exhausted' else 'expired_before_send_started' end,
        next_attempt_at = clock_timestamp(), claim_token = null, locked_until = null, updated_at = clock_timestamp()
    where letter.id in (select id from expired);
    get diagnostics affected = row_count;
    return affected;
end $$;

create or replace function public.claim_future_letters(p_limit integer default 10)
returns table(id uuid, claim_token uuid, recipient_email text, body text)
language plpgsql security definer set search_path = '' as $$
begin
    if p_limit is null or p_limit not between 1 and 20 then raise exception 'Invalid batch size'; end if;
    return query
    with candidates as (
        select letter.id from public.future_letters letter
        where letter.status = 'pending' and letter.due_at <= clock_timestamp()
            and letter.next_attempt_at <= clock_timestamp() and letter.attempts < 5
            and not letter.delivery_uncertain and letter.send_started_at is null
        order by letter.next_attempt_at, letter.id for update skip locked limit p_limit
    )
    update public.future_letters letter set status = 'processing', claim_token = gen_random_uuid(),
        locked_until = clock_timestamp() + interval '2 minutes', updated_at = clock_timestamp()
    from candidates where letter.id = candidates.id
    returning letter.id, letter.claim_token, letter.recipient_email, letter.body;
end $$;

create or replace function public.begin_future_letter_send(p_id uuid, p_claim_token uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
    update public.future_letters set send_started_at = clock_timestamp(), attempts = attempts + 1,
        updated_at = clock_timestamp()
    where id = p_id and claim_token = p_claim_token and status = 'processing'
        and locked_until > clock_timestamp() and send_started_at is null
        and not delivery_uncertain and due_at <= clock_timestamp()
        and next_attempt_at <= clock_timestamp() and attempts < 5;
    return found;
end $$;

create or replace function public.finish_future_letter_send(
    p_id uuid, p_claim_token uuid, p_outcome text, p_message_id text default null, p_error text default null
)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
    if p_outcome is null or p_outcome not in ('sent','temporary','permanent','uncertain') then raise exception 'Invalid outcome'; end if;
    if p_outcome = 'sent' and coalesce(p_message_id, '') = '' then raise exception 'Message ID required'; end if;
    -- Only codes are retained, never raw provider errors containing private data.
    if p_error is not null and p_error not in ('provider_throttled', 'provider_rejected',
        'invalid_provider_response', 'missing_message_id', 'unclassified_provider_response', 'provider_connection_lost') then
        raise exception 'Invalid error code';
    end if;
    update public.future_letters set
        status = case when p_outcome = 'sent' then 'sent'
            when p_outcome = 'temporary' and attempts < 5 then 'pending' else 'failed' end,
        delivery_uncertain = p_outcome = 'uncertain',
        provider_message_id = case when p_outcome = 'sent' then p_message_id else null end,
        sent_at = case when p_outcome = 'sent' then clock_timestamp() else null end,
        last_error = case when p_outcome = 'sent' then null else p_error end,
        next_attempt_at = case when p_outcome = 'temporary'
            then clock_timestamp() + make_interval(secs => least(3600, (60 * power(2, least(attempts - 1, 6)))::integer))
            else next_attempt_at end,
        send_started_at = case when p_outcome = 'temporary' then null else send_started_at end,
        claim_token = null, locked_until = null, updated_at = clock_timestamp()
    where id = p_id and claim_token = p_claim_token and status = 'processing' and send_started_at is not null;
    return found;
end $$;

revoke all on function public.reap_future_letter_locks() from public, anon, authenticated;
revoke all on function public.claim_future_letters(integer) from public, anon, authenticated;
revoke all on function public.begin_future_letter_send(uuid, uuid) from public, anon, authenticated;
revoke all on function public.finish_future_letter_send(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.reap_future_letter_locks() to service_role;
grant execute on function public.claim_future_letters(integer) to service_role;
grant execute on function public.begin_future_letter_send(uuid, uuid) to service_role;
grant execute on function public.finish_future_letter_send(uuid, uuid, text, text, text) to service_role;

commit;
