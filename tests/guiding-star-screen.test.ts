import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TwentiethTaskScreen from '../src/components/TwentiethTaskScreen.vue';
import { guidingStars, guidingStarExhaustedText, guidingStarHints } from '../src/content/guiding-star';
import { createGuidingStarProgress, guidingStarAttempts } from '../src/utils/guiding-star';
import { assignment } from './fixtures';
import type { CalendarTask } from '../src/types/models';

let userId: string;
const starIds = guidingStars.map(star => star.id);
function userForTarget(targetIndex: number) {
  for (let index = 0; index < 10000; index++) {
    const id = `star-user-${index}`;
    if (createGuidingStarProgress(`${id}:20`, starIds).targetStarId === starIds[targetIndex - 1]) return id;
  }
  throw new Error('No test user for target');
}
function key() { return `advent:guiding-star:v1:${userId}:assignment-20`; }
function task(): CalendarTask {
  const value = assignment({ id: 'assignment-20', user_id: userId, task_id: 20, position: 20, available_date: '2026-12-20' });
  value.task = { ...value.task!, id: 20, slug: 'task-20' };
  return value;
}
function completedTask(exhausted = false): CalendarTask {
  const value = task();
  return { ...value, status: 'completed', response: {
    id: 'response-20', user_id: userId, task_id: 20,
    response: exhausted ? { search_exhausted: true } : { wish_made: true },
    created_at: '', updated_at: '', completed_at: '',
  } };
}
function localProgress(targetIndex = 3, count = 0) {
  userId = userForTarget(targetIndex);
  localStorage.setItem(key(), JSON.stringify({ attempts: count, checkedStars: guidingStars.slice(0, count).map(star => star.id) }));
}
function screen(overrides: Record<string, unknown> = {}) {
  return mount(TwentiethTaskScreen, {
    props: { assignment: task(), day: 20, total: 25, loading: false, saving: false, error: null, saveError: null, ...overrides },
    global: { stubs: { PopupDialog: { props: ['open'], emits: ['close'], template: '<div v-if="open" class="dialog-stub" role="dialog"><slot /></div>' } } },
  });
}
type Screen = ReturnType<typeof screen>;
async function loadImages(view: Screen) {
  for (const image of view.findAll('.guiding-sky img')) await image.trigger('load');
}
async function choose(view: Screen, index: number) { await view.findAll('.guiding-star')[index]!.trigger('click'); }
async function wish(view: Screen) { await view.get('.guiding-confirm').trigger('click'); }
beforeEach(() => {
  userId = userForTarget(3);
  vi.useFakeTimers();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

describe('20 December guiding-star screen', () => {
  it('renders the poem and all 24 vector stars without an attempt counter', () => {
    const view = screen();
    expect(view.get('h1').text()).toBe('Путеводная звезда');
    expect(view.get('.guiding-poem em').text()).toContain('Звезд на небе тьма.');
    expect(view.findAll('.guiding-poem br')).toHaveLength(2);
    expect(view.text()).not.toContain('Осталось попыток');
    expect(view.find('.guiding-attempts').exists()).toBe(false);
    expect(view.findAll('.guiding-star')).toHaveLength(24);
    expect(view.findAll('.guiding-stars-overlay')).toHaveLength(1);
    expect(view.findAll<HTMLButtonElement>('.guiding-star').every(button => button.element.disabled)).toBe(true);
  });

  it('cycles hints, animates stars and ignores repeated choices without saving a result locally', async () => {
    localProgress(10);
    const view = screen();
    await loadImages(view);
    for (let index = 0; index < 4; index++) {
      await choose(view, index);
      expect(view.text()).toContain(guidingStarHints[index % 3]);
      expect(view.findAll('.guiding-star')[index]!.classes()).toContain('is-twinkling');
    }
    await choose(view, 0);
    expect(JSON.parse(localStorage.getItem(key())!)).toEqual({ attempts: 4, checkedStars: guidingStars.slice(0, 4).map(star => star.id) });
    expect(view.emitted('save')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(480);
    expect(view.findAll('.is-twinkling')).toHaveLength(0);
  });

  it('shows the found message on a separate screen after selecting the target star', async () => {
    localProgress(2);
    const view = screen();
    await loadImages(view);
    await choose(view, 0);
    expect(view.find('[role="dialog"]').exists()).toBe(false);
    await choose(view, 1);
    expect(view.text()).toContain('Ваша звезда найдена!');
    expect(view.emitted('save')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(420);
    expect(view.get('.guiding-result').text()).toContain('Ваша звезда найдена!');
    expect(view.find('[role="dialog"]').exists()).toBe(false);
  });

  it.each([1, 15])('can find a target beyond the first fifteen stars on attempt %s', async attempt => {
    localProgress(16);
    const view = screen();
    await loadImages(view);
    for (let index = 0; index < attempt - 1; index++) await choose(view, index);
    await choose(view, 15);
    expect(view.find('.guiding-sky').exists()).toBe(false);
    expect(view.get('.guiding-result').text()).toContain('Ваша звезда найдена!');
    expect(view.emitted('save')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(420);
    expect(view.get('.guiding-result').text()).toContain('Ваша звезда найдена!');
  });

  it('saves a wish only on confirmation and clears search data only after Supabase confirms completion', async () => {
    localProgress(1);
    const view = screen();
    await loadImages(view);
    await choose(view, 0);
    await vi.advanceTimersByTimeAsync(420);
    await wish(view);
    expect(view.emitted('save')).toEqual([[{ response: { wish_made: true }, complete: true }]]);
    expect(JSON.parse(localStorage.getItem(key())!)).toEqual({ attempts: 1, checkedStars: [guidingStars[0]!.id] });
    await view.setProps({ saving: true });
    await view.setProps({ assignment: completedTask(), saving: false });
    expect(localStorage.getItem(key())).toBeNull();
    expect(view.get('.guiding-result').text()).toContain('Желание загадано!');
    expect(view.find('.guiding-sky').exists()).toBe(false);
    expect(view.find('.december-card--result').exists()).toBe(true);
    expect(view.find('.december-date').exists()).toBe(false);
  });

  it('shows exhaustion on a separate screen and sends that outcome to Supabase', async () => {
    localProgress(guidingStars.length);
    const view = screen();
    await loadImages(view);
    for (let index = 0; index < 15; index++) await choose(view, index);
    expect(view.emitted('save')).toEqual([[{ response: { search_exhausted: true }, complete: true }]]);
    expect(view.text()).toContain(guidingStarExhaustedText);
    await vi.advanceTimersByTimeAsync(420);
    expect(view.get('.guiding-result').text()).toContain(guidingStarExhaustedText);
    expect(view.find('.guiding-sky').exists()).toBe(false);
    expect(JSON.parse(localStorage.getItem(key())!).attempts).toBe(15);
    await view.setProps({ assignment: completedTask(true) });
    expect(localStorage.getItem(key())).toBeNull();
    expect(view.get('.guiding-result').text()).toContain(guidingStarExhaustedText);
    expect(view.find('.guiding-sky').exists()).toBe(false);
  });

  it.each([false, true])('opens the Supabase result screen on a return visit (exhausted: %s)', async exhausted => {
    localProgress(8, 4);
    const view = screen({ assignment: completedTask(exhausted) });
    await nextTick();
    expect(view.get('.guiding-result').text()).toContain(exhausted ? guidingStarExhaustedText : 'Желание загадано!');
    expect(view.find('.december-card--result').exists()).toBe(true);
    expect(view.find('.december-date').exists()).toBe(false);
    expect(view.find('.guiding-sky').exists()).toBe(false);
    expect(view.find('.guiding-poem').exists()).toBe(false);
    expect(view.emitted('save')).toBeUndefined();
    expect(localStorage.getItem(key())).toBeNull();
    await view.get('.december-calendar').trigger('click');
    expect(view.emitted('back')).toHaveLength(1);
  });

  it('restores only the number of attempts and selected stars for an unfinished search', async () => {
    localProgress(8, 4);
    const view = screen();
    expect(view.findAll('.is-checked')).toHaveLength(4);
    expect(view.emitted('save')).toBeUndefined();
    await loadImages(view);
    await choose(view, 4);
    expect(JSON.parse(localStorage.getItem(key())!).attempts).toBe(5);
  });

  it('ignores a legacy locally saved wish instead of treating it as a completed task', async () => {
    localProgress(8);
    localStorage.setItem(key(), JSON.stringify({ requiredClicks: 1, checkedStars: [guidingStars[0]!.id], wishMade: true }));
    const view = screen();
    await vi.advanceTimersByTimeAsync(500);
    expect(view.find('[role="dialog"]').exists()).toBe(false);
    expect(view.find('.guiding-sky').exists()).toBe(true);
    expect(view.emitted('save')).toBeUndefined();
    expect(JSON.parse(localStorage.getItem(key())!)).toEqual({ attempts: 1, checkedStars: [guidingStars[0]!.id] });
  });

  it('resumes an exhausted search and saves only when the assignment is ready', async () => {
    localProgress(guidingStars.length, guidingStarAttempts);
    const view = screen({ loading: true });
    expect(view.emitted('save')).toBeUndefined();
    await view.setProps({ loading: false });
    expect(view.emitted('save')).toEqual([[{ response: { search_exhausted: true }, complete: true }]]);
  });

  it.each([false, true])('retains search data on save failure and lets the result screen retry (exhausted: %s)', async exhausted => {
    localProgress(exhausted ? guidingStars.length : 1, exhausted ? guidingStarAttempts - 1 : 0);
    const view = screen();
    await loadImages(view);
    await choose(view, exhausted ? guidingStarAttempts - 1 : 0);
    await vi.advanceTimersByTimeAsync(420);
    if (!exhausted) await wish(view);
    await view.setProps({ saving: true });
    await view.setProps({ saving: false, saveError: 'Нет соединения с Supabase' });
    expect(localStorage.getItem(key())).not.toBeNull();
    expect(view.get('.guiding-result [role="alert"]').text()).toContain('Нет соединения с Supabase');
    await view.get('.guiding-result [role="alert"] button').trigger('click');
    expect(view.emitted('save')).toHaveLength(2);
  });

  it('isolates searches and pending results between accounts', async () => {
    localProgress(1);
    const view = screen();
    await loadImages(view);
    await choose(view, 0);
    await vi.advanceTimersByTimeAsync(420);
    await wish(view);
    await view.setProps({ assignment: { ...task(), user_id: userForTarget(20) } });
    expect(view.find('[role="dialog"]').exists()).toBe(false);
    expect(view.findAll('.is-checked')).toHaveLength(0);
    expect(view.emitted('save')).toHaveLength(1);
  });

  it('retries loading unavailable images without losing selections', async () => {
    localProgress(4);
    const view = screen();
    await view.get('.guiding-sky-image').trigger('error');
    await view.get('[role="alert"] button').trigger('click');
    await loadImages(view);
    await choose(view, 0);
    expect(JSON.parse(localStorage.getItem(key())!).attempts).toBe(1);
  });
});
