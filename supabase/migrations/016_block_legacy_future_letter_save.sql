-- SWITCHOVER ONLY. Based on the production definition supplied on 2026-11-27.
-- Refuse source drift; never overwrite a newer production implementation.
begin;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_proc
        where oid = to_regprocedure('public.save_task_progress(bigint,jsonb,boolean)')
          and prosecdef and prorettype = 'jsonb'::regtype and not proretset
          and proargnames = array['p_task_id','p_response','p_complete']::text[]
          and md5(replace(prosrc, chr(13), '')) = 'b2b2c235dca5d716465cbf66e9bcd8ba') then
        raise exception 'save_task_progress differs from reviewed production source; stop and compare';
    end if;
end $$;

CREATE OR REPLACE FUNCTION public.save_task_progress(
  p_task_id bigint,
  p_response jsonb,
  p_complete boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_assignment_id uuid;
  v_available_date date;
  v_status text;
  v_completed_at timestamptz;
  v_existing_response jsonb;
  v_now timestamptz := now();
BEGIN
  v_user_id := (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_response IS NULL
     OR jsonb_typeof(p_response) <> 'object'
     OR p_complete IS NULL
  THEN
    RAISE EXCEPTION 'Invalid response parameters';
  END IF;

  IF octet_length(p_response::text) > 65536 THEN
    RAISE EXCEPTION 'Response is too large';
  END IF;

  -- Задание Таро сохраняется только через claim_tarot_card.
  IF EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE id = p_task_id
      AND slug = 'task-06'
  ) THEN
    RAISE EXCEPTION
      'Tarot task must be completed using claim_tarot_card';
  END IF;


  -- Письмо в будущее сохраняется только атомарно через отдельную RPC.
  IF EXISTS (
    SELECT 1 FROM public.tasks WHERE id = p_task_id AND slug = 'task-16'
  ) THEN
    RAISE EXCEPTION 'Future letter task must be completed using submit_future_letter';
  END IF;

  SELECT
    ut.id,
    ut.available_date,
    ut.status,
    ut.completed_at
  INTO
    v_assignment_id,
    v_available_date,
    v_status,
    v_completed_at
  FROM public.user_tasks ut
  JOIN public.tasks t
    ON t.id = ut.task_id
  WHERE ut.user_id = v_user_id
    AND ut.task_id = p_task_id
    AND t.is_active = true
  FOR UPDATE OF ut;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task is not assigned or inactive';
  END IF;

  IF v_available_date >
     (now() AT TIME ZONE 'Europe/Moscow')::date
     AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'Task is not available yet';
  END IF;

  IF v_status = 'completed' THEN
    IF NOT p_complete THEN
      RAISE EXCEPTION 'Task is already completed';
    END IF;

    SELECT tr.response
    INTO v_existing_response
    FROM public.task_responses tr
    WHERE tr.user_id = v_user_id
      AND tr.task_id = p_task_id;

    RETURN jsonb_build_object(
      'task_id', p_task_id,
      'status', 'completed',
      'completed_at', v_completed_at,
      'response', coalesce(v_existing_response, '{}'::jsonb)
    );
  END IF;

  IF p_complete THEN
    v_completed_at := v_now;
  ELSE
    v_completed_at := NULL;
  END IF;

  INSERT INTO public.task_responses (
    user_id,
    task_id,
    response,
    completed_at
  )
  VALUES (
    v_user_id,
    p_task_id,
    p_response,
    v_completed_at
  )
  ON CONFLICT (user_id, task_id)
  DO UPDATE SET
    response = EXCLUDED.response,
    completed_at = EXCLUDED.completed_at;

  UPDATE public.user_tasks
  SET
    status = CASE
      WHEN p_complete THEN 'completed'
      ELSE 'in_progress'
    END,
    completed_at = v_completed_at
  WHERE id = v_assignment_id;

  RETURN jsonb_build_object(
    'task_id', p_task_id,
    'status', CASE
      WHEN p_complete THEN 'completed'
      ELSE 'in_progress'
    END,
    'completed_at', v_completed_at,
    'response', p_response
  );
END;
$function$;

commit;
