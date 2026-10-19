import type { TaskStatus } from "../types/models";

export const taskStatusLabels: Record<TaskStatus, string> = {
  not_started: "Не начато",
  in_progress: "В процессе",
  completed: "Выполнено",
};