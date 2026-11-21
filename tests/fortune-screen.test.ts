import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import TwentyFifthTaskScreen from '../src/components/TwentyFifthTaskScreen.vue';
import { fortunes } from '../src/content/fortunes';
import { assignment, savedAssignment } from './fixtures';

function mountScreen(overrides: Record<string, unknown> = {}) {
  return mount(TwentyFifthTaskScreen, {
    props: {
      assignment: assignment(), day: 25, total: 25, loading: false,
      saving: false, error: null, saveError: null, ...overrides,
    },
  });
}

describe('fortune cookie', () => {
  it('restores the DB fortune immediately and ignores old local progress', () => {
    localStorage.setItem('advent:fortune:v1:user-1:assignment-25', '9');
    const random = vi.spyOn(Math, 'random');
    const screen = mountScreen({ assignment: savedAssignment(0) });
    expect(screen.attributes('data-stage')).toBe('open');
    expect(screen.get('.fortune-text').text()).toBe(fortunes[0]);
    expect(screen.find('.fortune-open-button').exists()).toBe(false);
    expect(screen.emitted('complete')).toBeUndefined();
    expect(random).not.toHaveBeenCalled();
  });

  it('does not reveal an old local fortune before saving', () => {
    localStorage.setItem('advent:fortune:v1:user-1:assignment-25', '9');
    const screen = mountScreen();
    expect(screen.attributes('data-stage')).toBe('closed');
    expect(screen.find('.fortune-result').exists()).toBe(false);
  });

  it.each(['.fortune-cookie-hit', '.fortune-open-button'])('opens via %s only after the saved response arrives', async selector => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const screen = mountScreen();
    await screen.get(selector).trigger('click');
    expect(screen.emitted('complete')).toEqual([[1]]);
    expect(screen.attributes('data-stage')).toBe('closed');
    expect(screen.find('.fortune-result').exists()).toBe(false);
    await screen.setProps({ saving: true });
    expect(screen.get<HTMLButtonElement>('.fortune-open-button').element.disabled).toBe(true);

    // Another device may have saved a different choice: show the server's value.
    await screen.setProps({ assignment: savedAssignment(7), saving: false });
    expect(screen.attributes('data-stage')).toBe('opening');
    expect(screen.find('.fortune-result').exists()).toBe(false);
    await screen.get('.fortune-ribbon').trigger('animationend');
    expect(screen.attributes('data-stage')).toBe('open');
    expect(screen.get('.fortune-text').text()).toBe(fortunes[7]);
    expect(screen.get('.fortune-result').classes()).toContain('is-revealing');
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('blocks a double click before the parent updates saving', () => {
    const screen = mountScreen();
    const cookie = screen.get('.fortune-cookie-hit').element;
    cookie.dispatchEvent(new MouseEvent('click'));
    cookie.dispatchEvent(new MouseEvent('click'));
    expect(screen.emitted('complete')).toHaveLength(1);
  });

  it('shows save errors on the closed cookie and retries the same choice', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.4);
    const screen = mountScreen();
    await screen.get('.fortune-open-button').trigger('click');
    await screen.setProps({ saving: true });
    await screen.setProps({ saving: false, saveError: 'Нет соединения с Supabase' });
    expect(screen.get('[role="alert"]').text()).toBe('Нет соединения с Supabase');
    expect(screen.get('.fortune-open-button').text()).toContain('Попробовать снова');
    await screen.get('.fortune-open-button').trigger('click');
    expect(screen.emitted('complete')).toEqual([[4], [4]]);
    expect(random).toHaveBeenCalledTimes(1);
    expect(localStorage.length).toBe(0);
  });

  it('skips animation when reduced motion is preferred', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    const screen = mountScreen();
    await screen.get('.fortune-open-button').trigger('click');
    await screen.setProps({ assignment: savedAssignment(9) });
    await nextTick();
    expect(screen.attributes('data-stage')).toBe('open');
    expect(screen.get('.fortune-text').text()).toBe(fortunes[9]);
    expect(screen.get('.fortune-result').classes()).not.toContain('is-revealing');
  });

  it('finishes opening when the animation event is lost', async () => {
    vi.useFakeTimers();
    const screen = mountScreen();
    await screen.get('.fortune-open-button').trigger('click');
    await screen.setProps({ assignment: savedAssignment() });
    expect(screen.attributes('data-stage')).toBe('opening');
    await vi.advanceTimersByTimeAsync(1200);
    expect(screen.attributes('data-stage')).toBe('open');
  });

  it('resets pending choices and animation when the assignment changes', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.9);
    const screen = mountScreen();
    await screen.get('.fortune-open-button').trigger('click');
    await screen.setProps({ assignment: savedAssignment() });
    expect(screen.attributes('data-stage')).toBe('opening');
    await screen.setProps({ assignment: assignment({ id: 'other', user_id: 'other-user' }) });
    expect(screen.attributes('data-stage')).toBe('closed');
    await screen.get('.fortune-open-button').trigger('click');
    expect(screen.emitted('complete')).toEqual([[0], [9]]);
    expect(random).toHaveBeenCalledTimes(2);
  });

  it.each([undefined, null, -1, 0.5, '2', fortunes.length])('offers reload for a completed task with invalid index %s', async index => {
    const saved = savedAssignment(index);
    if (index === undefined) delete saved.response!.response.fortune_index;
    const screen = mountScreen({ assignment: saved });
    expect(screen.get('[role="alert"]').text()).toContain('Не удалось загрузить');
    expect(screen.find('.fortune-open-button').exists()).toBe(false);
    await screen.get('.fortune-notice button').trigger('click');
    expect(screen.emitted('retry')).toHaveLength(1);
    expect(screen.emitted('complete')).toBeUndefined();
  });

  it.each([
    { loading: true }, { error: 'Ошибка загрузки' }, { assignment: undefined },
    { assignment: assignment({ task: null }) },
  ])('does not offer opening for an unavailable task (%j)', overrides => {
    const screen = mountScreen(overrides);
    expect(screen.find('.fortune-open-button').exists()).toBe(false);
    expect(screen.emitted('complete')).toBeUndefined();
  });
});
