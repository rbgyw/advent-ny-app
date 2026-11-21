import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { h } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCalendarStore } from '../src/stores/calendar';
import { calendarService } from '../src/services/calendar.service';
import { fortunes } from '../src/content/fortunes';
import { assignment, deferred, savedAssignment } from './fixtures';
import type { SaveTaskProgressResult } from '../src/types/models';
import type { CalendarTask } from '../src/types/models';
import TwentyFifthTaskScreen from '../src/components/TwentyFifthTaskScreen.vue';

vi.mock('../src/services/calendar.service', () => ({
  calendarService: { getUserCalendar: vi.fn(), saveTaskProgress: vi.fn() },
}));
vi.mock('../src/services/tarot.service', () => ({ tarotService: { claimCard: vi.fn() } }));

const savedResult: SaveTaskProgressResult = {
  task_id: 25, status: 'completed', completed_at: '2026-12-25T09:00:00Z',
  response: { solved: true, fortune_index: 3 },
};

function readyStore() {
  const store = useCalendarStore();
  store.currentUserId = 'user-1';
  store.tasks = [assignment()];
  return store;
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.mocked(calendarService.saveTaskProgress).mockReset().mockResolvedValue(savedResult);
  vi.mocked(calendarService.getUserCalendar).mockReset().mockResolvedValue([savedAssignment(7)]);
});

describe('Supabase fortune progress', () => {
  it('connects cookie opening to RPC persistence, DB refresh, and restored UI', async () => {
    const store = readyStore();
    const request = deferred<SaveTaskProgressResult>();
    const refresh = deferred<CalendarTask[]>();
    vi.mocked(calendarService.saveTaskProgress).mockReturnValueOnce(request.promise);
    vi.mocked(calendarService.getUserCalendar).mockReturnValueOnce(refresh.promise);
    const screen = mount({
      setup: () => () => h(TwentyFifthTaskScreen, {
        assignment: store.tasks[0], day: 25, total: store.totalCount,
        loading: store.loading, saving: store.saving, error: store.error, saveError: store.saveError,
        onEdit: () => { store.saveError = null; },
        onComplete: (index: number) => { void store.completeFortuneTask(25, index); },
      }),
    });
    await screen.get('.fortune-cookie-hit').trigger('click');
    expect(store.saving).toBe(true);
    expect(screen.attributes('data-stage')).toBe('closed');
    request.resolve(savedResult);
    await flushPromises();
    expect(store.saving).toBe(true);
    expect(screen.find('.fortune-result').exists()).toBe(false);
    refresh.resolve([savedAssignment(7)]);
    await flushPromises();
    expect(store.saving).toBe(false);
    expect(screen.attributes('data-stage')).toBe('opening');
    await screen.get('.fortune-ribbon').trigger('animationend');
    expect(screen.attributes('data-stage')).toBe('open');
    expect(screen.get('.fortune-text').text()).toBe(fortunes[7]);
    expect(screen.findAll('.fortune-ribbon-lettering path')).toHaveLength(3);
  });

  it('loads saved progress and completion counts from the DB', async () => {
    const store = useCalendarStore();
    await store.loadCalendar('user-1');
    expect(store.tasks[0]?.response?.response.fortune_index).toBe(7);
    expect(store.completedCount).toBe(1);
    expect(store.progressPercent).toBe(100);
  });

  it('saves the choice and uses the refreshed DB result rather than the local candidate', async () => {
    const store = readyStore();
    expect(await store.completeFortuneTask(25, 3)).toBe(true);
    expect(calendarService.saveTaskProgress).toHaveBeenCalledExactlyOnceWith(25, { solved: true, fortune_index: 3 }, true);
    expect(calendarService.getUserCalendar).toHaveBeenCalledExactlyOnceWith('user-1');
    expect(store.tasks[0]?.response?.response.fortune_index).toBe(7);
    expect(store.completedCount).toBe(1);
    expect(store.saving).toBe(false);
  });

  it.each([-1, 0.5, NaN, Infinity, fortunes.length])('rejects invalid index %s in both save entry points', async index => {
    const store = readyStore();
    expect(await store.completeFortuneTask(25, index)).toBe(false);
    expect(await store.saveProgress(25, { solved: true, fortune_index: index }, true)).toBe(false);
    expect(calendarService.saveTaskProgress).not.toHaveBeenCalled();
    expect(store.saveError).toBeTruthy();
  });

  it.each([0, fortunes.length - 1])('accepts boundary index %s', async index => {
    const store = readyStore();
    expect(await store.completeFortuneTask(25, index)).toBe(true);
    expect(calendarService.saveTaskProgress).toHaveBeenCalledWith(25, { solved: true, fortune_index: index }, true);
  });

  it.each([
    { solved: true }, { solved: false, fortune_index: 2 },
    { solved: true, fortune_index: '2' }, { solved: true, fortune_index: 2, extra: true },
  ])('rejects malformed payload %j', async response => {
    const store = readyStore();
    expect(await store.saveProgress(25, response, true)).toBe(false);
    expect(calendarService.saveTaskProgress).not.toHaveBeenCalled();
  });

  it('does not save a draft fortune or overwrite a completed fortune', async () => {
    const store = readyStore();
    expect(await store.saveDraft(25, { solved: true, fortune_index: 1 })).toBe(false);
    store.tasks = [savedAssignment(0)];
    expect(await store.completeFortuneTask(25, 8)).toBe(true);
    expect(calendarService.saveTaskProgress).not.toHaveBeenCalled();
    expect(store.tasks[0]?.response?.response.fortune_index).toBe(0);
  });

  it('preserves Supabase error messages and allows retry without false completion', async () => {
    const store = readyStore();
    vi.mocked(calendarService.saveTaskProgress).mockRejectedValueOnce({ message: 'Сохранение недоступно', code: 'P0001' });
    expect(await store.completeFortuneTask(25, 3)).toBe(false);
    expect(store.saveError).toBe('Сохранение недоступно');
    expect(store.completedCount).toBe(0);
    expect(store.saving).toBe(false);
    expect(await store.completeFortuneTask(25, 3)).toBe(true);
    expect(store.saveError).toBeNull();
  });

  it('reports a failed reload after RPC without inventing a fortune', async () => {
    const store = readyStore();
    vi.mocked(calendarService.getUserCalendar).mockRejectedValueOnce({ message: 'Не удалось прочитать ответ' });
    expect(await store.completeFortuneTask(25, 3)).toBe(false);
    expect(store.saveError).toBe('Не удалось прочитать ответ');
    expect(store.tasks[0]?.response).toBeNull();
    expect(store.completedCount).toBe(0);
  });

  it.each([assignment(), savedAssignment(99)])('reports missing or invalid refreshed progress', async updated => {
    const store = readyStore();
    vi.mocked(calendarService.getUserCalendar).mockResolvedValue([updated]);
    expect(await store.completeFortuneTask(25, 3)).toBe(false);
    expect(store.saveError).toContain('Не удалось загрузить сохранённое пожелание');
  });

  it('rejects duplicate submissions while saving', async () => {
    const store = readyStore();
    const request = deferred<SaveTaskProgressResult>();
    vi.mocked(calendarService.saveTaskProgress).mockReturnValueOnce(request.promise);
    const first = store.completeFortuneTask(25, 3);
    expect(store.saving).toBe(true);
    expect(await store.completeFortuneTask(25, 4)).toBe(false);
    expect(calendarService.saveTaskProgress).toHaveBeenCalledTimes(1);
    request.resolve(savedResult);
    expect(await first).toBe(true);
  });

  it('ignores a save that completes after logout', async () => {
    const store = readyStore();
    const request = deferred<SaveTaskProgressResult>();
    vi.mocked(calendarService.saveTaskProgress).mockReturnValueOnce(request.promise);
    const save = store.completeFortuneTask(25, 3);
    store.reset();
    request.resolve(savedResult);
    expect(await save).toBe(false);
    expect(store.tasks).toEqual([]);
    expect(store.saveError).toBeNull();
    expect(store.saving).toBe(false);
    expect(calendarService.getUserCalendar).not.toHaveBeenCalled();
  });

  it('unlocks saving when a calendar load supersedes an in-flight save', async () => {
    const store = readyStore();
    const request = deferred<SaveTaskProgressResult>();
    vi.mocked(calendarService.saveTaskProgress).mockReturnValueOnce(request.promise);
    const save = store.completeFortuneTask(25, 3);
    vi.mocked(calendarService.getUserCalendar).mockResolvedValue([assignment()]);
    await store.loadCalendar('user-2');
    expect(store.saving).toBe(false);
    request.resolve(savedResult);
    expect(await save).toBe(false);
    expect(store.currentUserId).toBe('user-2');
    expect(store.tasks[0]?.status).toBe('not_started');
  });
});

describe('Podzhik success persistence', () => {
  function gameStore() {
    const store = readyStore();
    const game = assignment({ task_id: 19, position: 19 });
    game.task = { ...game.task!, id: 19, slug: 'task-19' };
    store.tasks = [game];
    return store;
  }

  it('saves only a successful completion flag through the existing calendar RPC service', async () => {
    const store = gameStore();
    vi.mocked(calendarService.getUserCalendar).mockResolvedValue([{ ...store.tasks[0]!, status: 'completed' }]);
    expect(await store.saveProgress(19, { solved: true }, true)).toBe(true);
    expect(calendarService.saveTaskProgress).toHaveBeenCalledExactlyOnceWith(19, { solved: true }, true);
    expect(store.completedCount).toBe(1);
  });

  it.each([
    { response: { solved: true }, complete: false },
    { response: { solved: false }, complete: true },
    { response: { solved: true, attemptsLeft: 3 }, complete: true },
    { response: { solved: true, deadline: 1234 }, complete: true },
    { response: { solved: true, x: 0.5, y: 0.6 }, complete: true },
  ])('keeps unsuccessful progress and local game details out of Supabase: %j', async ({ response, complete }) => {
    const store = gameStore();
    expect(await store.saveProgress(19, response, complete)).toBe(false);
    expect(calendarService.saveTaskProgress).not.toHaveBeenCalled();
  });
});

describe('guiding-star wish persistence', () => {
  function wishStore() {
    const store = readyStore();
    const task = assignment({ task_id: 20, position: 20 });
    task.task = { ...task.task!, id: 20, slug: 'task-20' };
    store.tasks = [task];
    return store;
  }
  it.each([{ wish_made: true }, { search_exhausted: true }])('saves only the final outcome: %j', async response => {
    const store = wishStore();
    vi.mocked(calendarService.getUserCalendar).mockResolvedValue([{ ...store.tasks[0]!, status: 'completed' }]);
    expect(await store.saveProgress(20, response, true)).toBe(true);
    expect(calendarService.saveTaskProgress).toHaveBeenCalledExactlyOnceWith(20, response, true);
  });
  it.each([
    { response: { wish_made: true }, complete: false },
    { response: { wish_made: false }, complete: true },
    { response: { search_exhausted: false }, complete: true },
    { response: { search_exhausted: true }, complete: false },
    { response: { wish_made: true, search_exhausted: true }, complete: true },
    { response: { wish_made: true, requiredClicks: 4 }, complete: true },
    { response: { wish_made: true, checkedStars: ['star-01'] }, complete: true },
  ])('keeps search details and unsuccessful attempts out of Supabase: %j', async ({ response, complete }) => {
    const store = wishStore();
    expect(await store.saveProgress(20, response, complete)).toBe(false);
    expect(calendarService.saveTaskProgress).not.toHaveBeenCalled();
  });
});
