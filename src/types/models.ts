export type UUID = string;
export type ISODateTime = string;
export type ISODate = string;

export type UserRole = "user" | "admin";

export interface Profile {
  id: UUID;
  email: string | null;
  role: UserRole;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Task {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  task_type: string;
  fixed_date: ISODate | null;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type TaskStatus = "not_started" | "in_progress" | "completed";

export interface UserTask {
  id: UUID;
  user_id: UUID;
  task_id: number;
  position: number;
  available_date: ISODate;
  created_at: ISODateTime;
  status: TaskStatus;
  completed_at: ISODateTime | null;
}

export interface TaskResponse {
  id: UUID;
  user_id: UUID;
  task_id: number;
  response: Record<string, unknown>;
  completed_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface CalendarTask extends UserTask {
  task: Task | null;
  response: TaskResponse | null;
}


export interface SaveTaskProgressResult {
  task_id: number;
  status: "in_progress" | "completed";
  completed_at: ISODateTime | null;
  response: Record<string, unknown>;
}