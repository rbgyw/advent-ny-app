-- Production definition supplied by the user on 2026-11-27. Test fixture only.
CREATE OR REPLACE FUNCTION public.submit_future_letter(p_body text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid;
    v_email text;
    v_task_id bigint;
    v_assignment_id uuid;
    v_available_date date;
    v_status text;

    v_letter_id uuid;
    v_due_at timestamptz;
    v_response jsonb;

    v_now timestamptz := now();

    -- Тестовая задержка отправки
    v_delay interval := interval '15 minutes';

BEGIN

    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_body IS NULL
        OR char_length(btrim(p_body)) = 0
        OR octet_length(p_body) > 60000
    THEN
        RAISE EXCEPTION 'Invalid letter body';
    END IF;

    SELECT email
    INTO v_email
    FROM auth.users
    WHERE id = v_user_id
      AND email_confirmed_at IS NOT NULL;

    IF v_email IS NULL THEN
        RAISE EXCEPTION 'Confirmed email required';
    END IF;

    SELECT
        t.id,
        ut.id,
        ut.available_date,
        ut.status
    INTO
        v_task_id,
        v_assignment_id,
        v_available_date,
        v_status
    FROM public.tasks t
    JOIN public.user_tasks ut
        ON ut.task_id = t.id
    WHERE t.slug = 'task-16'
      AND t.is_active = true
      AND ut.user_id = v_user_id
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

    SELECT id, due_at
    INTO v_letter_id, v_due_at
    FROM public.future_letters
    WHERE user_id = v_user_id
      AND task_id = v_task_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'letter_id', v_letter_id,
            'task_id', v_task_id,
            'status', 'completed',
            'due_at', v_due_at,
            'already_submitted', true
        );
    END IF;

    IF v_status = 'completed' THEN
        RAISE EXCEPTION 'Task is already completed';
    END IF;

    v_due_at := v_now + v_delay;

    INSERT INTO public.future_letters (
        user_id,
        task_id,
        recipient_email,
        body,
        due_at,
        next_attempt_at
    )
    VALUES (
        v_user_id,
        v_task_id,
        v_email,
        p_body,
        v_due_at,
        v_due_at
    )
    RETURNING id INTO v_letter_id;

    v_response := jsonb_build_object(
        'letter_id', v_letter_id,
        'deliver_on', v_due_at,
        'scheduled', true
    );

    INSERT INTO public.task_responses (
        user_id,
        task_id,
        response,
        completed_at
    )
    VALUES (
        v_user_id,
        v_task_id,
        v_response,
        v_now
    )
    ON CONFLICT (user_id, task_id)
    DO UPDATE SET
        response = EXCLUDED.response,
        completed_at = EXCLUDED.completed_at;

    UPDATE public.user_tasks
    SET
        status = 'completed',
        completed_at = v_now
    WHERE id = v_assignment_id;

    RETURN jsonb_build_object(
        'letter_id', v_letter_id,
        'task_id', v_task_id,
        'status', 'completed',
        'completed_at', v_now,
        'due_at', v_due_at,
        'response', v_response,
        'already_submitted', false
    );

END;
$function$;
