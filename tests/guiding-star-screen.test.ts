import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TwentiethTaskScreen from '../src/components/TwentiethTaskScreen.vue';
import PopupDialog from '../src/components/PopupDialog.vue';
import { guidingStars, guidingStarExhaustedText, guidingStarHints } from '../src/content/guiding-star';
import { assignment } from './fixtures';
import type { CalendarTask } from '../src/types/models';

const key = 'advent:guiding-star:v1:user-1:assignment-20';
function task(): CalendarTask {
  const value = assignment({ id: 'assignment-20', task_id: 20, position: 20, available_date: '2026-12-20' });
  value.task = { ...value.task!, id: 20, slug: 'task-20' };
  return value;
}
function localProgress(requiredClicks = 3, checkedStars: string[] = [], wishMade = false) {
  localStorage.setItem(key, JSON.stringify({ requiredClicks, checkedStars, wishMade }));
}
function screen(overrides: Record<string, unknown> = {}) {
  return mount(TwentiethTaskScreen, {
    props: { assignment: task(), day: 20, total: 25, loading: false, saving: false, error: null, saveError: null, ...overrides },
    global: { stubs: { PopupDialog: { props: ['open'], template: '<div v-if="open" class="dialog-stub" role="dialog"><slot /></div>' } } },
  });
}
type Screen = ReturnType<typeof screen>;
async function loadImages(view: Screen) {
  for (const image of view.findAll('.guiding-sky img')) await image.trigger('load');
}
async function choose(view: Screen, index: number) {
  await view.findAll('.guiding-star')[index]!.trigger('click');
}
async function wish(view: Screen) {
  await view.findAll('button').find(button => button.text() === 'Загадать желание')!.trigger('click');
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  });
});

describe('20 December guiding-star screen', () => {
  it('renders the corrected poem, introduction, and every individual vector star', () => {
    const view = screen();
    expect(view.get('h1').text()).toBe('Найдите свою путеводную звезду');
    expect(view.get('.guiding-poem em').text()).toContain('Звезд на небе тьма.');
    expect(view.findAll('.guiding-poem br')).toHaveLength(2);
    expect(view.text()).toContain('К картам таро вы уже обращались');
    expect(view.text()).toContain('Осталось попыток: 10 / 10');
    expect(view.findAll('.guiding-star')).toHaveLength(24);
    expect(new Set(view.findAll('.guiding-star').map(button => button.attributes('aria-label'))).size).toBe(24);
    expect(view.findAll('.guiding-stars-overlay')).toHaveLength(1);
    expect(view.findAll('.guiding-star-image')).toHaveLength(0);
    expect(view.findAll<HTMLButtonElement>('.guiding-star').every(button => button.element.disabled)).toBe(true);
  });

  it('uses all the real vector layers as interactive stars, including the five extra grouped stars', async () => {
    localProgress(guidingStars.length);
    const view = screen();
    await loadImages(view);
    expect(view.findAll<HTMLButtonElement>('.guiding-star').every(button => !button.element.disabled)).toBe(true);
    await choose(view, guidingStars.length - 1);
    expect(view.findAll('.guiding-star')[guidingStars.length - 1]!.classes()).toContain('is-checked');
    expect(view.emitted('save')).toBeUndefined();
  });

  it('cycles the specified hints, animates clicks and ignores repeated stars', async () => {
    localProgress(10);
    const view = screen();
    await loadImages(view);
    for (let index = 0; index < 4; index++) {
      await choose(view, index);
      expect(view.text()).toContain(guidingStarHints[index % 3]);
      expect(view.findAll('.guiding-star')[index]!.classes()).toContain('is-twinkling');
    }
    await choose(view, 0);
    expect(JSON.parse(localStorage.getItem(key)!).checkedStars).toHaveLength(4);
    expect(view.text()).toContain('Осталось попыток: 6 / 10');
    expect(view.emitted('save')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(480);
    expect(view.findAll('.is-twinkling')).toHaveLength(0);
  });

  it('finds the guiding star at the individual threshold and does not save search details to Supabase', async () => {
    localProgress(2);
    const view = screen();
    await loadImages(view);
    await choose(view, 0);
    expect(view.find('[role="dialog"]').exists()).toBe(false);
    await choose(view, 1);
    expect(view.text()).toContain('Вы нашли свою путеводную звезду!');
    expect(view.findAll('.is-guiding')).toHaveLength(1);
    expect(view.emitted('save')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(420);
    expect(view.get('[role="dialog"]').text()).toContain('Ваша звезда найдена!');
  });

  it('accepts a private wish only after the user presses the wish button and sends only its confirmation flag', async () => {
    localProgress(1);
    const view = screen();
    await loadImages(view);
    await choose(view, 0);
    await vi.advanceTimersByTimeAsync(420);
    await wish(view);
    expect(view.emitted('save')).toEqual([[{ response: { wish_made: true }, complete: true }]]);
    expect(JSON.parse(localStorage.getItem(key)!).wishMade).toBe(true);
    expect(view.get('[role="dialog"]').text()).toContain('Желание загадано!');
    await view.setProps({ assignment: { ...task(), status: 'completed' } });
    expect(view.get('[role="dialog"]').text()).toContain('Желание загадано!');
    expect(view.text()).toContain('увлеченность и настойчивость помогают держать курс весь 2027 год');
  });

  it('ends with the requested consolation message after ten unsuccessful choices', async () => {
    localProgress(guidingStars.length);
    const view = screen();
    await loadImages(view);
    for (let index = 0; index < 10; index++) await choose(view, index);
    expect(view.text()).toContain(guidingStarExhaustedText);
    expect(view.findAll<HTMLButtonElement>('.guiding-star').every(button => button.element.disabled)).toBe(true);
    expect(view.emitted('save')).toBeUndefined();
    await choose(view, 10);
    expect(JSON.parse(localStorage.getItem(key)!).checkedStars).toHaveLength(10);
  });

  it('restores the threshold, checked stars and remaining attempts after reopening', async () => {
    localProgress(8, guidingStars.slice(0, 4).map(star => star.id));
    const view = screen();
    expect(view.text()).toContain('Осталось попыток: 6 / 10');
    expect(view.findAll('.is-checked')).toHaveLength(4);
    expect(JSON.parse(localStorage.getItem(key)!).requiredClicks).toBe(8);
    expect(view.emitted('save')).toBeUndefined();
  });

  it('retries saving a locally confirmed wish after reopening and trusts the DB completed status', async () => {
    localProgress(1, [guidingStars[0]!.id], true);
    const view = screen();
    await nextTick();
    expect(view.emitted('save')).toEqual([[{ response: { wish_made: true }, complete: true }]]);
    view.unmount();
    const completed = screen({ assignment: { ...task(), status: 'completed' } });
    await nextTick();
    expect(completed.text()).toContain('Желание загадано!');
    expect(completed.emitted('save')).toBeUndefined();
  });

  it('shows save errors and retry inside the open result dialog', async () => {
    localProgress(1);
    const view = screen();
    await loadImages(view);
    await choose(view, 0);
    await vi.advanceTimersByTimeAsync(420);
    await wish(view);
    await view.setProps({ saving: true });
    await view.setProps({ saving: false, saveError: 'Нет соединения с Supabase' });
    expect(view.get('[role="dialog"] [role="alert"]').text()).toContain('Нет соединения с Supabase');
    await view.get('[role="dialog"] [role="alert"] button').trigger('click');
    expect(view.emitted('save')).toHaveLength(2);
  });

  it('does not mix searches between user accounts', async () => {
    localProgress(20, guidingStars.slice(0, 9).map(star => star.id));
    const view = screen();
    expect(view.text()).toContain('Осталось попыток: 1 / 10');
    await view.setProps({ assignment: { ...task(), user_id: 'another-user' } });
    expect(view.text()).toContain('Осталось попыток: 10 / 10');
    expect(view.findAll('.is-checked')).toHaveLength(0);
  });

  it('lets the user retry loading unavailable images without losing attempts', async () => {
    localProgress(4);
    const view = screen();
    await view.get('.guiding-sky-image').trigger('error');
    expect(view.get('[role="alert"]').text()).toContain('Не удалось загрузить звёздное небо');
    await view.get('[role="alert"] button').trigger('click');
    await loadImages(view);
    await choose(view, 0);
    expect(view.text()).toContain('Осталось попыток: 9 / 10');
  });
});
