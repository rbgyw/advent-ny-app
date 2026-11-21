import type { CalendarTask } from '../src/types/models';

const timestamp = '2026-12-25T09:00:00Z';

export function assignment(overrides: Partial<CalendarTask> = {}): CalendarTask {
  return {
    id: 'assignment-25', user_id: 'user-1', task_id: 25, position: 25,
    available_date: '2026-12-25', created_at: timestamp,
    status: 'not_started', completed_at: null, response: null,
    task: {
      id: 25, slug: 'task-25', title: 'Печенье на счастье', description: null,
      task_type: 'content', fixed_date: '2026-12-25', config: {}, is_active: true,
      created_at: timestamp, updated_at: timestamp,
    },
    ...overrides,
  };
}

export function savedAssignment(index: unknown = 3): CalendarTask {
  return assignment({
    status: 'completed', completed_at: timestamp,
    response: {
      id: 'response-25', user_id: 'user-1', task_id: 25,
      response: { solved: true, fortune_index: index },
      completed_at: timestamp, created_at: timestamp, updated_at: timestamp,
    },
  });
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
