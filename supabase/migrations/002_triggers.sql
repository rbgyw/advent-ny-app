-- =========================================
-- updated_at trigger
-- =========================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();


create trigger set_task_responses_updated_at
before update on public.task_responses
for each row
execute function public.set_updated_at();


-- =========================================
-- Automatically create profile
-- =========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (
        id,
        email
    )
    values (
        new.id,
        new.email
    );

    return new;
end;
$$;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();