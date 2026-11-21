-- Publish the video IDs from public/collections/videos.json with scripts/generate-video-catalog.mjs.
-- Metadata/media stay in the JSON; this catalog is the server-side voting allowlist.
create table public.advent_video_catalog (
    task_id bigint not null references public.tasks(id) on delete cascade,
    video_id text not null check (video_id ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
    title text not null check (char_length(title) between 1 and 200),
    sort_order integer not null check (sort_order >= 0),
    is_active boolean not null default true,
    primary key (task_id, video_id)
);

create table public.advent_video_votes (
    task_id bigint not null,
    video_id text not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    liked boolean not null,
    created_at timestamptz not null default now(),
    primary key (task_id, video_id, user_id),
    foreign key (task_id, video_id) references public.advent_video_catalog(task_id, video_id) on delete cascade
);
create index advent_video_votes_user on public.advent_video_votes (task_id, user_id);

-- No direct client writes or reads of other people's choices. The RPCs below expose
-- only the caller's votes and aggregate like counts, deriving user_id from auth.uid().
alter table public.advent_video_catalog enable row level security;
alter table public.advent_video_votes enable row level security;
revoke all on public.advent_video_catalog from anon, authenticated;
revoke all on public.advent_video_votes from anon, authenticated;

create function public.assert_advent_video_access(p_task_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
    if auth.uid() is null then
        raise exception 'Войдите, чтобы оценивать видео.' using errcode = '42501';
    end if;
    if not exists (
        select 1 from public.user_tasks ut join public.tasks t on t.id = ut.task_id
        where ut.user_id = auth.uid() and ut.task_id = p_task_id
          and ut.available_date <= current_date and t.slug = 'task-22' and t.is_active
    ) then
        raise exception 'Задание пока недоступно.' using errcode = '42501';
    end if;
end;
$$;
revoke all on function public.assert_advent_video_access(bigint) from public, anon, authenticated;

create function public.get_advent_video_state(p_task_id bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
    own_votes jsonb;
    ranking jsonb;
    total integer;
    voted integer;
begin
    perform public.assert_advent_video_access(p_task_id);
    select count(*) into total from public.advent_video_catalog where task_id = p_task_id and is_active;
    select coalesce(jsonb_agg(jsonb_build_object('video_id', v.video_id, 'liked', v.liked) order by c.sort_order, c.video_id), '[]'::jsonb), count(*)
      into own_votes, voted
      from public.advent_video_votes v join public.advent_video_catalog c using (task_id, video_id)
      where v.task_id = p_task_id and v.user_id = auth.uid() and c.is_active;
    select coalesce(jsonb_agg(jsonb_build_object('video_id', r.video_id, 'likes', r.likes) order by r.likes desc, r.video_id), '[]'::jsonb)
      into ranking from (
        select c.video_id, count(v.user_id) filter (where v.liked) as likes
        from public.advent_video_catalog c left join public.advent_video_votes v using (task_id, video_id)
        where c.task_id = p_task_id and c.is_active group by c.video_id
      ) r;
    return jsonb_build_object('votes', own_votes, 'ranking', ranking, 'total_videos', total, 'complete', total > 0 and voted = total);
end;
$$;
revoke all on function public.get_advent_video_state(bigint) from public, anon;
grant execute on function public.get_advent_video_state(bigint) to authenticated;

create function public.vote_advent_video(p_task_id bigint, p_video_id text, p_liked boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
    state jsonb;
begin
    perform public.assert_advent_video_access(p_task_id);
    if p_liked is null then raise exception 'Выберите оценку видео.'; end if;
    -- Serialize this user's votes, so simultaneous last votes also complete the task.
    perform 1 from public.user_tasks where user_id = auth.uid() and task_id = p_task_id for update;
    perform 1 from public.advent_video_catalog where task_id = p_task_id and video_id = p_video_id and is_active for share;
    if not found then raise exception 'Видео больше не участвует в подборке.'; end if;
    -- First choice wins. Retries and concurrent tabs cannot inflate the ranking.
    insert into public.advent_video_votes (task_id, video_id, user_id, liked)
    values (p_task_id, p_video_id, auth.uid(), p_liked)
    on conflict (task_id, video_id, user_id) do nothing;
    state := public.get_advent_video_state(p_task_id);
    if (state ->> 'complete')::boolean and not exists (
        select 1 from public.task_responses where task_id = p_task_id and user_id = auth.uid() and completed_at is not null
    ) then
        perform public.save_task_progress(p_task_id, '{"voted":true}'::jsonb, true);
    end if;
    return state;
end;
$$;
revoke all on function public.vote_advent_video(bigint, text, boolean) from public, anon;
grant execute on function public.vote_advent_video(bigint, text, boolean) to authenticated;
