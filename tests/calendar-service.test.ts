import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calendarService } from '../src/services/calendar.service';
import { supabase } from '../src/lib/supabase';
import { savedAssignment } from './fixtures';

vi.mock('../src/lib/supabase', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));

beforeEach(() => {
  vi.mocked(supabase.rpc).mockReset();
  vi.mocked(supabase.from).mockReset();
});

describe('calendar service', () => {
  it('joins assigned status and saved fortune from Supabase', async () => {
    const { task, response, ...userTask } = savedAssignment(0);
    const queries: Record<string, unknown> = {
      user_tasks: [userTask], tasks: [task], task_responses: [response],
    };
    const filters: unknown[][] = [];
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never);
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      const result = { data: queries[table], error: null };
      const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn((...args) => { filters.push([table, ...args]); return query; }),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(result),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
      };
      return query as never;
    });
    expect(await calendarService.getUserCalendar('user-1')).toEqual([savedAssignment(0)]);
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('initialize_user_calendar');
    expect(filters).toContainEqual(['user_tasks', 'user_id', 'user-1']);
    expect(filters).toContainEqual(['task_responses', 'user_id', 'user-1']);
  });

  it('calls the current save RPC with the complete fortune payload', async () => {
    const result = { task_id: 25, status: 'completed', completed_at: '2026-12-25T09:00:00Z', response: { solved: true, fortune_index: 0 } };
    vi.mocked(supabase.rpc).mockResolvedValue({ data: result, error: null } as never);
    expect(await calendarService.saveTaskProgress(25, result.response, true)).toEqual(result);
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('save_task_progress', {
      p_task_id: 25, p_response: { solved: true, fortune_index: 0 }, p_complete: true,
    });
  });

  it('propagates a Supabase RPC failure', async () => {
    const error = { message: 'Задание ещё закрыто', code: 'P0001' };
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error } as never);
    await expect(calendarService.saveTaskProgress(25, { solved: true, fortune_index: 1 }, true)).rejects.toBe(error);
  });

  it('rejects an empty RPC result', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never);
    await expect(calendarService.saveTaskProgress(25, { solved: true, fortune_index: 1 }, true)).rejects.toThrow('Сервер не вернул результат сохранения');
  });
});
