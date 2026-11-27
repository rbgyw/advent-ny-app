import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calendarService } from '../src/services/calendar.service';
import { useCalendarStore } from '../src/stores/calendar';
import SixteenthTaskScreen from '../src/components/SixteenthTaskScreen.vue';
import { assignment, deferred } from './fixtures';
import type { FutureLetterResult } from '../src/types/models';

vi.mock('../src/services/calendar.service', () => ({ calendarService: {
  submitFutureLetter: vi.fn(), getTaskProgress: vi.fn(), saveTaskProgress: vi.fn(),
} }));
vi.mock('../src/services/tarot.service', () => ({ tarotService: { claimCard: vi.fn() } }));
const due = '2026-11-27T12:15:00Z';
const current = () => assignment({ task_id: 16, position: 16, task: { ...assignment().task!, id: 16, slug: 'task-16' } });
const result: FutureLetterResult = { letter_id: 'letter-1', task_id: 16, status: 'completed', due_at: due,
  already_submitted: false, completed_at: '2026-11-27T12:00:00Z', response: { letter_id: 'letter-1', deliver_on: due, scheduled: true } };
function setup() {
  const store = useCalendarStore(); store.currentUserId = 'user-1'; store.tasks = [current()]; return store;
}
beforeEach(() => {
  setActivePinia(createPinia());
  vi.mocked(calendarService.submitFutureLetter).mockReset().mockResolvedValue(result);
  vi.mocked(calendarService.getTaskProgress).mockReset().mockResolvedValue({
    assignment: { ...current(), status: 'completed', completed_at: result.completed_at },
    response: { id: 'response', user_id: 'user-1', task_id: 16, response: result.response,
      completed_at: result.completed_at, created_at: result.completed_at, updated_at: result.completed_at },
  });
});
describe('future letter calendar progress', () => {
  it('waits for durable storage and refreshed progress before completing', async () => {
    const store = setup(), pending = deferred<FutureLetterResult>();
    vi.mocked(calendarService.submitFutureLetter).mockReturnValueOnce(pending.promise);
    const saving = store.submitFutureLetter(16, '  Личное письмо  ');
    expect(store.completedCount).toBe(0); expect(store.saving).toBe(true);
    pending.resolve(result);
    expect(await saving).toBe(true);
    expect(store.completedCount).toBe(1);
    expect(store.tasks[0]?.response?.response).toEqual(result.response);
    expect(calendarService.submitFutureLetter).toHaveBeenCalledExactlyOnceWith('Личное письмо');
    expect(calendarService.saveTaskProgress).not.toHaveBeenCalled();
  });
  it('recovers a lost response by submitting the same body again', async () => {
    const store = setup();
    vi.mocked(calendarService.submitFutureLetter).mockRejectedValueOnce(new Error('network'));
    expect(await store.submitFutureLetter(16, 'Текст')).toBe(false);
    expect(store.completedCount).toBe(0); expect(store.saveError).toContain('Повторите');
    vi.mocked(calendarService.submitFutureLetter).mockResolvedValueOnce({ letter_id: 'letter-1', task_id: 16,
      status: 'completed', due_at: due, already_submitted: true });
    expect(await store.submitFutureLetter(16, 'Текст')).toBe(true);
    expect(store.completedCount).toBe(1);
  });
  it('keeps the form incomplete when progress refresh fails after saving', async () => {
    const store = setup(); vi.mocked(calendarService.getTaskProgress).mockRejectedValueOnce(new Error('network'));
    expect(await store.submitFutureLetter(16, 'Текст')).toBe(false);
    expect(store.completedCount).toBe(0);
  });
  it('ignores a response after logout and blocks duplicate clicks', async () => {
    const store = setup(), pending = deferred<FutureLetterResult>();
    vi.mocked(calendarService.submitFutureLetter).mockReturnValueOnce(pending.promise);
    const saving = store.submitFutureLetter(16, 'Текст');
    expect(await store.submitFutureLetter(16, 'Текст')).toBe(false);
    store.reset(); pending.resolve(result);
    expect(await saving).toBe(false); expect(store.tasks).toEqual([]);
  });
  it('rejects legacy progress writes for task 16', async () => {
    const store = setup(); expect(await store.completeTask(16, { text: 'private' })).toBe(false);
    expect(calendarService.saveTaskProgress).not.toHaveBeenCalled();
  });
});
describe('future letter form', () => {
  function screen() {
    return mount(SixteenthTaskScreen, { props: { assignment: current(), day: 16, total: 25, loading: false,
      saving: false, error: null, saveError: null, recipientEmail: 'confirmed@example.org' },
      global: { stubs: { DecemberTaskLayout: { template: '<div><slot /></div>' }, PopupDialog: { template: '<div><slot /></div>' } } } });
  }
  it('shows a read-only confirmed email and emits only the letter body', async () => {
    const view = screen();
    expect(view.get('input').element.value).toBe('confirmed@example.org');
    expect(view.get('input').attributes()).toHaveProperty('readonly');
    await view.get('textarea').setValue('  Привет из прошлого  ');
    await view.get('form').trigger('submit');
    expect(view.emitted('submit')).toEqual([['Привет из прошлого']]);
    expect(view.text()).not.toContain('Запланированная отправка:');
    await view.setProps({ saveError: 'Не удалось сохранить' });
    expect(view.get('textarea').element.value).toBe('  Привет из прошлого  ');
    expect(view.text()).toContain('Не удалось сохранить');
  });
  it('restores the actual server schedule from production deliver_on metadata', async () => {
    const view = screen();
    await view.setProps({ assignment: { ...current(), status: 'completed', response: {
      id: 'response', task_id: 16, user_id: 'user-1', response: result.response,
      completed_at: result.completed_at, created_at: result.completed_at, updated_at: result.completed_at,
    } } });
    expect(view.text()).toContain('27 ноября 2026'); expect(view.text()).toContain('15:15');
    expect(view.text()).toContain('(МСК)'); expect(view.find('textarea').exists()).toBe(false);
  });
  it('blocks submission without a confirmed address or body', async () => {
    const view = screen(); await view.get('form').trigger('submit'); expect(view.emitted('submit')).toBeUndefined();
    await view.setProps({ recipientEmail: '' }); await view.get('textarea').setValue('Текст');
    await view.get('form').trigger('submit'); expect(view.emitted('submit')).toBeUndefined();
  });
});
