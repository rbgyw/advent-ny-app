-- The memory task accepts optional photographs through the same attachment RPCs.
create or replace function public.can_upload_task_attachment(p_user_id uuid, p_task_id bigint)
returns boolean
language sql
stable security definer
set search_path = ''
as $$
    select
        p_user_id = (select auth.uid())
        and exists (
            select 1
            from public.user_tasks ut
            join public.tasks t on t.id = ut.task_id
            where ut.user_id = p_user_id
              and ut.task_id = p_task_id
              and (ut.task_id in (7, 17) or t.slug = 'task-03')
              and t.is_active = true
              and (ut.status <> 'completed' or public.is_admin())
              and (
                  ut.available_date <= (now() at time zone 'Europe/Moscow')::date
                  or public.is_admin()
              )
        );
$$;
