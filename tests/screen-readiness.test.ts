import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { beforeEach, expect, it, vi } from 'vitest';
import ScreenReadyBoundary from '../src/components/ui/ScreenReadyBoundary.vue';
import { useScreenReadiness } from '../src/composables/useScreenReadiness';
import { navigationDestination, navigationPending, navigationError, screenPending, screenError } from '../src/router/status';

beforeEach(() => {
  navigationDestination.value = '/calendar';
  navigationPending.value = false;
  navigationError.value = screenError.value = '';
  screenPending.value = true;
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  // Browsers pause animation frames in hidden tabs. This must not pause readiness.
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

it('reveals tracked data without waiting for images, fonts or animation frames', async () => {
  let resolve!: () => void;
  const data = new Promise<void>(done => { resolve = done; });
  const Child = defineComponent({ setup() {
    useScreenReadiness().track(data);
    return () => h('main', [h('img', { src: '/missing.svg', loading: 'lazy' }), 'Calendar']);
  } });
  const wrapper = mount(ScreenReadyBoundary, { props: { destination: '/calendar' }, slots: { default: () => h(Child) } });
  await flushPromises();
  expect(screenPending.value).toBe(true);
  expect(wrapper.attributes('inert')).toBeDefined();
  resolve();
  await flushPromises();
  expect(screenPending.value).toBe(false);
  expect(wrapper.classes()).not.toContain('screen-content-pending');
  expect(wrapper.get('img').attributes('loading')).toBe('lazy');
  expect(screenError.value).toBe('');
});

it('restores a ready boundary after navigation redirects back to its mounted route', async () => {
  const wrapper = mount(ScreenReadyBoundary, { props: { destination: '/calendar' }, slots: { default: '<main>Calendar</main>' } });
  await flushPromises();
  navigationDestination.value = '/auth';
  navigationPending.value = screenPending.value = true;
  await nextTick();
  expect(wrapper.attributes('inert')).toBeDefined();
  navigationDestination.value = '/calendar';
  navigationPending.value = false;
  await flushPromises();
  expect(screenPending.value).toBe(false);
  expect(wrapper.classes()).not.toContain('screen-content-pending');
});

it('reports a runtime component error as an application failure without leaking its message', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const Broken = defineComponent({ setup() { throw new Error('secret-token=user@example.invalid'); } });
  mount(ScreenReadyBoundary, { props: { destination: '/calendar' }, slots: { default: () => h(Broken) } });
  await flushPromises();
  expect(screenError.value).toContain('Ошибка приложения');
  expect(error.mock.calls.flat().join()).not.toContain('secret-token');
});

it('bounds unresolved critical data independently of optional resources', async () => {
  vi.useFakeTimers();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const Child = defineComponent({ setup() {
    useScreenReadiness().track(new Promise<void>(() => {}));
    return () => h('main', 'Calendar');
  } });
  mount(ScreenReadyBoundary, { props: { destination: '/calendar' }, slots: { default: () => h(Child) } });
  await vi.advanceTimersByTimeAsync(30_001);
  expect(screenError.value).toContain('Загрузка занимает слишком много времени');
  expect(console.error).toHaveBeenCalledWith('[advent] critical screen timeout: [unknown URL]');
});

it('keeps the loader label and recovery available when its snowflake fails', async () => {
  const { default: ScreenLoader } = await import('../src/components/ui/ScreenLoader.vue');
  const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const wrapper = mount(ScreenLoader, { props: { label: 'Открываем календарь...', theme: 'calendar' } });
  await wrapper.get('img').trigger('error');
  expect(wrapper.get('[role="status"]').text()).toBe('Открываем календарь...');
  expect(wrapper.get('img').attributes('style')).toContain('opacity: 0');
  expect(log).toHaveBeenCalledWith(expect.stringContaining('optional image load:'));
});
