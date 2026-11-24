create or replace function public.guard_sport_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    new_level text := new.response ->> 'level';
    old_level text;
    submitted boolean := (new.response -> 'submitted_for_review') is not distinct from 'true'::jsonb
        or (new.response -> 'submitted') is not distinct from 'true'::jsonb;
    attachment uuid;
begin
    if not exists (
        select 1 from public.tasks where id = new.task_id and slug = 'task-07'
    ) then
        return new;
    end if;

    if tg_op = 'UPDATE' then
        if (old.response -> 'submitted_for_review') is not distinct from 'true'::jsonb
            or (old.response -> 'submitted') is not distinct from 'true'::jsonb then
            if (new.response -> 'level') is distinct from (old.response -> 'level')
                or (new.response -> 'team_pose') is distinct from (old.response -> 'team_pose')
                or (new.response -> 'attachment_id') is distinct from (old.response -> 'attachment_id')
                or not submitted then
                raise exception 'Отправленный ответ уже зафиксирован.';
            end if;
            return new;
        end if;

        old_level := old.response ->> 'level';
        if old_level in ('basic', 'advanced', 'team') and new_level is distinct from old_level then
            raise exception 'Выбранный уровень уже зафиксирован.';
        end if;
    end if;

    if not submitted then
        return new;
    end if;

    if new_level is null or new_level not in ('basic', 'advanced', 'team') then
        raise exception 'Выберите уровень перед отправкой фотографии.';
    end if;

    if new_level = 'team' and coalesce(new.response ->> 'team_pose', '') not in ('01', '02', '03', '04') then
        raise exception 'Выберите командную позу перед отправкой фотографии.';
    end if;

    attachment := (new.response ->> 'attachment_id')::uuid;
    perform 1 from public.attachments
    where id = attachment and task_id = new.task_id and user_id = new.user_id and status = 'ready'
    for update;
    if not found then
        raise exception 'Загрузите фотографию перед отправкой на проверку.';
    end if;

    return new;
end;
$$;

