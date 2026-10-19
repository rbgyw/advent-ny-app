import { supabase } from "../lib/supabase";
import type {
  Task,
  UserTask,
  TaskResponse,
  CalendarTask,
  SaveTaskProgressResult,
} from "../types/models";

export const calendarService = {
  async getUserCalendar(userId: string): Promise<CalendarTask[]> {
    const { error: initializationError } = await supabase.rpc(
      "initialize_user_calendar",
    );

    if (initializationError) {
      throw initializationError;
    }

    // 1. Получаем персональные назначения
    const { data: assignments, error: assignmentsError } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    if (assignmentsError) {
      throw assignmentsError;
    }

    if (!assignments?.length) {
      return [];
    }

    const userTasks = assignments as UserTask[];

    // 2. Получаем открытые задания
    const taskIds = userTasks.map((item) => item.task_id);

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .in("id", taskIds);

    if (tasksError) {
      throw tasksError;
    }

    // 3. Получаем сохранённые ответы
    const { data: responses, error: responsesError } = await supabase
      .from("task_responses")
      .select("*")
      .eq("user_id", userId);

    if (responsesError) {
      throw responsesError;
    }

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
