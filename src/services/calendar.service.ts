import { supabase } from "../lib/supabase";
import type {
  FutureLetterResult,
  Task,
  UserTask,
  TaskResponse,
  CalendarTask,
  SaveTaskProgressResult,
} from "../types/models";

type StoredAssignment = UserTask & { calendar_position?: number | null };

function readAssignment({ calendar_position, ...assignment }: StoredAssignment): UserTask {
  return { ...assignment, position: calendar_position ?? assignment.position };
}

const inconsistentCalendar = "Calendar assignments are inconsistent";

export const calendarService = {
  async getUserCalendar(userId: string, options: { initialize?: boolean; signal?: AbortSignal } = {}): Promise<CalendarTask[]> {
    const signal = options.signal ?? new AbortController().signal;
    let initializationFailed = false;
    if (options.initialize !== false) {
      let { error } = await supabase.rpc("prepare_advent_calendar").abortSignal(signal);
      if (error?.code === "PGRST202") {
        ({ error } = await supabase.rpc("initialize_user_calendar").abortSignal(signal));
      }
      if (error) {
        if (error.message !== inconsistentCalendar) throw error;
        initializationFailed = true;
      }
    }

    // 1. Получаем персональные назначения
    const { data: assignments, error: assignmentsError } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true }).abortSignal(signal);

    if (assignmentsError) {
      throw assignmentsError;
    }

    const userTasks = ((assignments ?? []) as StoredAssignment[]).map(readAssignment)
      .sort((left, right) => left.position - right.position);

    if (initializationFailed && (userTasks.length !== 25 ||
      userTasks.some((assignment, index) => assignment.position !== index + 1))) {
      throw new Error("Не удалось восстановить календарь. Попробуйте ещё раз.");
    }
    if (!userTasks.length) return [];

    // 2. Получаем открытые задания
    const taskIds = userTasks.map((item) => item.task_id);

    // Task visibility still comes from RLS. These reads are independent.
    const [taskResult, responseResult] = await Promise.all([
      supabase.from("tasks").select("*").in("id", taskIds).abortSignal(signal),
      supabase.from("task_responses").select("*").eq("user_id", userId).abortSignal(signal),
    ]);
    if (taskResult.error) throw taskResult.error;
    if (responseResult.error) throw responseResult.error;
    const tasks = taskResult.data ?? [];
    const responses = responseResult.data ?? [];

    // 4. Объединяем данные
    const tasksById = new Map<number, Task>(
      (tasks as Task[]).map((task) => [task.id, task]),
    );

    const responsesByTaskId = new Map<number, TaskResponse>(
      (responses as TaskResponse[]).map((response) => [
        response.task_id,
        response,
      ]),
    );

    return userTasks.map((assignment) => ({
      ...assignment,
      task: tasksById.get(assignment.task_id) ?? null,
      response: responsesByTaskId.get(assignment.task_id) ?? null,
    }));
  },

  async getTaskProgress(userId: string, taskId: number): Promise<{ assignment: UserTask; response: TaskResponse | null }> {
    const [assignment, response] = await Promise.all([
      supabase.from("user_tasks").select("*").eq("user_id", userId).eq("task_id", taskId).single(),
      supabase.from("task_responses").select("*").eq("user_id", userId).eq("task_id", taskId).maybeSingle(),
    ]);
    if (assignment.error) throw assignment.error;
    if (response.error) throw response.error;
    return { assignment: readAssignment(assignment.data as StoredAssignment), response: response.data as TaskResponse | null };
  },

  async submitFutureLetter(body: string): Promise<FutureLetterResult> {
    const { data, error } = await supabase.rpc("submit_future_letter", { p_body: body });
    if (error) throw error;
    if (!data || typeof data.letter_id !== 'string' || !data.letter_id ||
      !Number.isSafeInteger(data.task_id) ||
      data.status !== 'completed' ||
      typeof data.due_at !== 'string' || !Number.isFinite(Date.parse(data.due_at)) ||
      typeof data.already_submitted !== 'boolean' ||
      (!data.already_submitted && (typeof data.completed_at !== 'string' ||
        !Number.isFinite(Date.parse(data.completed_at)) || !data.response ||
        typeof data.response !== 'object' || Array.isArray(data.response)))) {
      throw new Error("Сервер не подтвердил сохранение письма. Повторите запрос.");
    }
    return data as FutureLetterResult;
  },

  async saveTaskProgress(
    taskId: number,
    response: Record<string, unknown>,
    complete = false,
  ): Promise<SaveTaskProgressResult> {
    const { data, error } = await supabase.rpc("save_task_progress", {
      p_task_id: taskId,
      p_response: response,
      p_complete: complete,
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Сервер не вернул результат сохранения");
    }

    return data as SaveTaskProgressResult;
  },
};
