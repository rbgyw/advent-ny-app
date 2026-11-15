import type { CalendarTask } from './models';

export interface DecemberTaskProps {
  assignment?: CalendarTask;
  day: number;
  total: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
}

export interface DecemberTaskSave {
  response: Record<string, unknown>;
  complete: boolean;
}

export interface DecemberTaskEvents {
  back: [];
  retry: [];
  edit: [];
  save: [submission: DecemberTaskSave];
}
