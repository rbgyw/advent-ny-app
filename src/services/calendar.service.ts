import { supabase } from "../lib/supabase";
import type {
  Task,
  UserTask,
  TaskResponse,
  CalendarTask,
  SaveTaskProgressResult,
} from "../types/models";

export const calendarService = {
  async getUserCalendar(userId: string, options: { initialize?: boolean; signal?: AbortSignal } = {}): Promise<CalendarTask[]> {
    const signal = options.signal ?? new AbortController().signal;
    if (options.initialize !== false) {
      const { error: initializationError } = await supabase.rpc(
        "initialize_user_calendar",
      ).abortSignal(signal);
      if (initializationError) throw initializationError;
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

    if (!assignments?.length) {
      return [];
    }

    const userTasks = assignments as UserTask[];

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
    return { assignment: assignment.data as UserTask, response: response.data as TaskResponse | null };
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
