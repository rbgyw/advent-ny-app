-- A published catalog can change. Completion is the saved task result.
create or replace function public.get_advent_video_state(p_task_id bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
    own_votes jsonb;
    ranking jsonb;
    total integer;
    completed boolean;
begin
    perform public.assert_advent_video_access(p_task_id);
    select count(*) into total from public.advent_video_catalog where task_id = p_task_id and is_active;
    select coalesce(jsonb_agg(jsonb_build_object('video_id', v.video_id, 'liked', v.liked) order by c.sort_order, c.video_id), '[]'::jsonb)
      into own_votes
      from public.advent_video_votes v join public.advent_video_catalog c using (task_id, video_id)
      where v.task_id = p_task_id and v.user_id = auth.uid() and c.is_active;
    select coalesce(jsonb_agg(jsonb_build_object('video_id', r.video_id, 'likes', r.likes) order by r.likes desc, r.video_id), '[]'::jsonb)
      into ranking from (
        select c.video_id, count(v.user_id) filter (where v.liked) as likes
        from public.advent_video_catalog c left join public.advent_video_votes v using (task_id, video_id)
        where c.task_id = p_task_id and c.is_active group by c.video_id
      ) r;
    select exists (
        select 1 from public.task_responses
        where task_id = p_task_id and user_id = auth.uid() and completed_at is not null
    ) into completed;
    return jsonb_build_object('votes', own_votes, 'ranking', ranking, 'total_videos', total, 'complete', completed);
end;
$$;

create or replace function public.vote_advent_video(p_task_id bigint, p_video_id text, p_liked boolean)
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
    if not (state ->> 'complete')::boolean
        and jsonb_array_length(state -> 'votes') = (state ->> 'total_videos')::integer then
        perform public.save_task_progress(p_task_id, '{"voted":true}'::jsonb, true);
        return public.get_advent_video_state(p_task_id);
    end if;
    return state;
end;
$$;
