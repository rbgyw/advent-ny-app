import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NineteenthTaskScreen from '../src/components/NineteenthTaskScreen.vue';
import ImageSearchBoard from '../src/components/ImageSearchBoard.vue';
import { podzhikBounds } from '../src/content/podzhik';
import { assignment } from './fixtures';
import type { CalendarTask } from '../src/types/models';

const key = 'advent:podzhik:v1:user-1:assignment-19';
const hit = { x: (podzhikBounds.left + podzhikBounds.right) / 2, y: (podzhikBounds.top + podzhikBounds.bottom) / 2 };
function task(): CalendarTask {
  const value = assignment({ id: 'assignment-19', task_id: 19, position: 19, available_date: '2026-12-19' });
  value.task = { ...value.task!, id: 19, slug: 'task-19', title: 'Где же Поджик?' };
  return value;
}
function screen(overrides: Record<string, unknown> = {}) {
  return mount(NineteenthTaskScreen, { props: {
    assignment: task(), day: 19, total: 25, loading: false, saving: false, error: null, saveError: null, ...overrides,
  } });
}
type Screen = ReturnType<typeof screen>;
async function loadImages(view: Screen) {
  for (const image of view.findAll('.podzhik-preload')) await image.trigger('load');
}
async function begin(view: Screen) {
  await loadImages(view);
  await view.get('.podzhik-start').trigger('click');
}
async function choose(view: Screen, point = hit) {
  view.getComponent(ImageSearchBoard).vm.$emit('choose', point, 313, 419);
  await nextTick();
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-12-19T09:00:00Z'));
});

describe('19 December game', () => {
  it('shows the corrected introduction, traits, rules and five attempts before starting', () => {
    const view = screen();
    expect(view.get('h1').text()).toBe('Где же Поджик?');
    expect(view.text()).toContain('символизирующий поджелудочную железу');
    expect(view.text()).toContain('голубые глаза');
    expect(view.text()).toContain('Осталось попыток: 5');
    expect(view.findAll('.podzhik-rules li')).toHaveLength(4);
    expect(view.find('[role="timer"]').exists()).toBe(false);
    expect(view.get<HTMLButtonElement>('.podzhik-start').element.disabled).toBe(true);
    expect(view.emitted('save')).toBeUndefined();
  });

  it('waits for all imagery before starting the timer', async () => {
    const view = screen();
    await view.findAll('.podzhik-preload')[0]!.trigger('load');
    expect(view.get<HTMLButtonElement>('.podzhik-start').element.disabled).toBe(true);
    await view.get('.podzhik-target-preload').trigger('load');
    await view.get('.podzhik-start').trigger('click');
    expect(view.get('[role="timer"]').text()).toBe('01:00');
    expect(JSON.parse(localStorage.getItem(key)!)).toMatchObject({ attemptsLeft: 5, deadline: Date.now() + 60_000 });
  });

  it('can retry when the target image fails before the scene finishes loading', async () => {
    const view = screen();
    await view.get('.podzhik-target-preload').trigger('error');
    await view.findAll('.podzhik-preload')[0]!.trigger('load');
    expect(view.get('[role="alert"]').text()).toContain('Не удалось загрузить картинку');
    expect(view.get('.podzhik-start').text()).toBe('Картинка недоступна');
    await view.get('.podzhik-image-error button').trigger('click');
    await begin(view);
    expect(view.get('[role="timer"]').text()).toBe('01:00');
  });

  it('keeps the timer running after a miss without spending another attempt or calling Supabase', async () => {
    const view = screen();
    await begin(view);
    await vi.advanceTimersByTimeAsync(10_000);
    await choose(view, { x: 0.1, y: 0.1 });
    expect(view.text()).toContain('Здесь Поджика нет. Продолжайте искать!');
    expect(view.get('[role="timer"]').text()).toBe('00:50');
    expect(JSON.parse(localStorage.getItem(key)!).attemptsLeft).toBe(5);
    expect(view.emitted('save')).toBeUndefined();
  });

  it('expires the round, preserves the scene, and allows another full minute', async () => {
    const view = screen();
    await begin(view);
    const src = view.getComponent(ImageSearchBoard).props('src');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(view.text()).toContain('Минута пролетела');
    expect(view.text()).toContain('Осталось попыток: 4');
    const retry = view.findAll('button').find(button => button.text() === 'Попробовать еще раз')!;
    await retry.trigger('click');
    expect(view.get('[role="timer"]').text()).toBe('01:00');
    expect(view.getComponent(ImageSearchBoard).props('src')).toBe(src);
    expect(view.emitted('save')).toBeUndefined();
  });

  it('restores the original deadline across reloads and time away', async () => {
    const first = screen();
    await begin(first);
    const deadline = JSON.parse(localStorage.getItem(key)!).deadline;
    first.unmount();
    vi.setSystemTime(Date.now() + 32_000);
    const restored = screen();
    expect(restored.get('[role="timer"]').text()).toBe('00:28');
    expect(JSON.parse(localStorage.getItem(key)!).deadline).toBe(deadline);
    restored.unmount();
    vi.setSystemTime(deadline + 60_000);
    const expired = screen();
    expect(expired.text()).toContain('Осталось попыток: 4');
    expect(expired.emitted('save')).toBeUndefined();
  });

  it('stops after five expired rounds and offers no reset', async () => {
    localStorage.setItem(key, JSON.stringify({ attemptsLeft: 1, deadline: Date.now() - 1, found: false }));
    const view = screen();
    expect(view.text()).toContain('Попытки закончились');
    expect(view.text()).toContain('Осталось попыток: 0');
    expect(view.findComponent(ImageSearchBoard).exists()).toBe(false);
    expect(view.findAll('button').map(button => button.text()).some(text => /Начать|снова|еще раз/.test(text))).toBe(false);
    expect(view.emitted('save')).toBeUndefined();
  });

  it('sends only a successful flag, then waits for DB confirmation before claiming completion', async () => {
    const view = screen();
    await begin(view);
    await choose(view);
    expect(view.emitted('save')).toEqual([[{ response: { solved: true }, complete: true }]]);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ attemptsLeft: 5, deadline: null, found: true });
    expect(view.text()).not.toContain('Обязательное задание выполнено');
    await view.setProps({ assignment: { ...task(), status: 'completed' }, saving: false });
    expect(view.text()).toContain('Вот он! Поджик найден — отличная работа! Обязательное задание выполнено.');
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('rejects a target tap at or after the deadline even before the next timer tick', async () => {
    const view = screen();
    await begin(view);
    vi.setSystemTime(Date.now() + 60_000);
    await choose(view);
    expect(view.emitted('save')).toBeUndefined();
    expect(view.text()).toContain('Время вышло');
  });

  it('preserves a find after a save failure and retries without replaying or spending attempts', async () => {
    const view = screen();
    await begin(view);
    await choose(view);
    await view.setProps({ saving: true });
    await view.setProps({ saving: false, saveError: 'Нет соединения' });
    expect(view.get('[role="alert"]').text()).toBe('Нет соединения');
    await view.findAll('button').find(button => button.text() === 'Повторить сохранение')!.trigger('click');
    expect(view.emitted('save')).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(key)!).found).toBe(true);
    expect(view.findComponent(ImageSearchBoard).exists()).toBe(false);
  });

  it('resends a locally found result after reopening and trusts completed DB progress', async () => {
    localStorage.setItem(key, JSON.stringify({ attemptsLeft: 2, deadline: null, found: true }));
    const restored = screen();
    await nextTick();
    expect(restored.emitted('save')).toEqual([[{ response: { solved: true }, complete: true }]]);
    restored.unmount();
    const completed = screen({ assignment: { ...task(), status: 'completed' } });
    await nextTick();
    expect(completed.text()).toContain('Обязательное задание выполнено');
    expect(completed.emitted('save')).toBeUndefined();
  });

  it('isolates local progress by user and assignment', async () => {
    localStorage.setItem(key, JSON.stringify({ attemptsLeft: 0, deadline: null, found: false }));
    const view = screen();
    expect(view.text()).toContain('Попытки закончились');
    await view.setProps({ assignment: { ...task(), id: 'another-assignment', user_id: 'another-user' } });
    expect(view.text()).toContain('Осталось попыток: 5');
    expect(view.find('.podzhik-start').exists()).toBe(true);
  });

  it('keeps playing in memory when storage is disabled', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage denied'); });
    const view = screen();
    await begin(view);
    expect(view.get('[role="timer"]').text()).toBe('01:00');
    expect(view.text()).toContain('Браузер не разрешил сохранить прогресс');
    await choose(view);
    expect(view.emitted('save')).toHaveLength(1);
  });
});
