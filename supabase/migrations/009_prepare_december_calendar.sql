begin;

-- Undo the fixed dates introduced in 008. The legacy initializer owns the
-- campaign dates and uses its original fixed-window configuration.
update public.tasks
set fixed_date = null
where (slug = 'task-15' and fixed_date = date '2026-12-10')
   or (slug = 'task-10' and fixed_date = date '2026-12-15');

-- Keep the position key intact for the legacy initializer and its upserts.
-- Only the assignments moved by the Advent schedule need a display position.
alter table public.user_tasks
    add column calendar_position smallint check (calendar_position between 1 and 25);

create function public.prepare_advent_calendar()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    caller uuid := auth.uid();
    target record;
begin
    if caller is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;

    -- Serialize preparation for this account, including first visits in two tabs.
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(caller::text, 903));

    if (select count(*) from public.user_tasks where user_id = caller) <> 25 then
        perform public.initialize_user_calendar();
    end if;
    if (select count(*) from public.user_tasks where user_id = caller) <> 25 then
        raise exception 'Calendar assignments are inconsistent';
    end if;

    for target in
        select task.id, schedule.position
        from (values ('task-15', 10), ('task-10', 15)) as schedule(slug, position)
        join public.tasks task on task.slug = schedule.slug
        order by schedule.position
    loop
        with move as (
            select chosen.id,
                   coalesce(chosen.calendar_position, chosen.position) as original_position,
                   chosen.available_date as original_date,
                   neighbor.id as neighbor_id,
                   neighbor.available_date as window_date
            from public.user_tasks chosen
            join public.user_tasks neighbor on neighbor.user_id = chosen.user_id
                and coalesce(neighbor.calendar_position, neighbor.position) = target.position
            where chosen.user_id = caller and chosen.task_id = target.id
                and coalesce(chosen.calendar_position, chosen.position) <> target.position
        )
        update public.user_tasks assignment
        set calendar_position = case
                when assignment.id = move.id then target.position else move.original_position end,
            available_date = case
                when assignment.id = move.id then move.window_date else move.original_date end
        from move
        where assignment.user_id = caller and assignment.id in (move.id, move.neighbor_id);
    end loop;
end;
$$;

revoke all on function public.prepare_advent_calendar() from public, anon;
grant execute on function public.prepare_advent_calendar() to authenticated;

commit;
