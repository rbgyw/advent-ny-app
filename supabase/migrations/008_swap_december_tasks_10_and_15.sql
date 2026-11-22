begin;

-- The calendar initializer uses fixed dates for designated windows.
update public.tasks
set fixed_date = case slug
    when 'task-15' then date '2026-12-10'
    when 'task-10' then date '2026-12-15'
end
where slug in ('task-10', 'task-15');

-- Move existing assignments and keep their IDs, status and task ownership.
-- Rebuild the unique key in the same transaction so a swap can update both rows.
alter table public.user_tasks drop constraint user_tasks_unique_position;
do $$
declare
    target record;
begin
    for target in
        select id, fixed_date, extract(day from fixed_date)::integer as position
        from public.tasks where slug in ('task-10', 'task-15')
        order by fixed_date
    loop
        with moves as (
            select chosen.id, chosen.position, chosen.available_date,
                   neighbor.id as neighbor_id, neighbor.available_date as window_date
            from public.user_tasks chosen
            left join public.user_tasks neighbor on neighbor.user_id = chosen.user_id
                and neighbor.position = target.position
            where chosen.task_id = target.id and chosen.position <> target.position
        )
        update public.user_tasks assignment
        set position = case when assignment.id = moves.id then target.position else moves.position end,
            available_date = case when assignment.id = moves.id
                then coalesce(moves.window_date, target.fixed_date) else moves.available_date end
        from moves
        where assignment.id in (moves.id, moves.neighbor_id);
    end loop;
end $$;

alter table public.user_tasks add constraint user_tasks_unique_position unique (user_id, position);
commit;
