-- =========================================
-- RLS
-- =========================================

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.user_tasks enable row level security;
alter table public.task_responses enable row level security;


-- =========================================
-- DATA API PRIVILEGES
-- =========================================

grant usage on schema public to authenticated;

-- Profiles:
-- пользователь пока только читает свой профиль
grant select on public.profiles to authenticated;

-- Tasks:
-- пользователь только читает задания
grant select on public.tasks to authenticated;

-- User tasks:
-- пользователь только читает свою раскладку календаря
grant select on public.user_tasks to authenticated;

-- Responses:
-- пользователь может читать, создавать и изменять свои ответы
grant select, insert, update
on public.task_responses
to authenticated;


-- Анонимным пользователям данные пока не выдаём
revoke all on public.profiles from anon;
revoke all on public.tasks from anon;
revoke all on public.user_tasks from anon;
revoke all on public.task_responses from anon;


-- =========================================
-- PROFILES
-- =========================================

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (
    id = auth.uid()
);


-- =========================================
-- USER TASKS
-- =========================================

create policy "Users can view own task assignments"
on public.user_tasks
for select
to authenticated
using (
    user_id = auth.uid()
);


-- =========================================
-- TASKS
-- =========================================

-- Пользователь видит содержимое задания только если:
-- 1. оно активно;
-- 2. оно назначено именно ему;
-- 3. дата открытия уже наступила.

create policy "Users can view available assigned tasks"
on public.tasks
for select
to authenticated
using (
    is_active = true
    and exists (
        select 1
        from public.user_tasks
        where user_tasks.task_id = tasks.id
          and user_tasks.user_id = auth.uid()
          and user_tasks.available_date <= current_date
    )
);


-- =========================================
-- TASK RESPONSES
-- =========================================

-- Пользователь может читать только свои ответы

create policy "Users can view own responses"
on public.task_responses
for select
to authenticated
using (
    user_id = auth.uid()
);


-- Пользователь может создать ответ только:
-- для себя;
-- для назначенного ему задания;
-- после наступления даты открытия.

create policy "Users can create own responses"
on public.task_responses
for insert
to authenticated
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.user_tasks
        where user_tasks.user_id = auth.uid()
          and user_tasks.task_id = task_responses.task_id
          and user_tasks.available_date <= current_date
    )
);


-- Обновлять можно только собственный ответ,
-- и task_id нельзя подменить на недоступное задание.

create policy "Users can update own responses"
on public.task_responses
for update
to authenticated
using (
    user_id = auth.uid()
)
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.user_tasks
        where user_tasks.user_id = auth.uid()
          and user_tasks.task_id = task_responses.task_id
          and user_tasks.available_date <= current_date
    )
);