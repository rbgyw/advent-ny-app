import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TaskView from '../src/views/TaskView.vue';
import { useAuthStore } from '../src/stores/auth';
import { useCalendarStore } from '../src/stores/calendar';
import { calendarService } from '../src/services/calendar.service';
import { crosswordCells } from '../src/utils/crossword';
import { assignment } from './fixtures';
import type { CalendarTask } from '../src/types/models';

const route = reactive({ params: { id: '3' } });
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../src/lib/supabase', () => ({ supabase: { rpc: vi.fn().mockResolvedValue({ data: false, error: null }) } }));
vi.mock('../src/services/calendar.service', () => ({ calendarService: { getUserCalendar: vi.fn(),
    getTaskProgress: vi.fn(async (userId: string, taskId: number) => {
      const tasks = await calendarService.getUserCalendar(userId);
      const current = tasks.find(item => item.task_id === taskId);
      if (!current) return { assignment: {}, response: null };
      const { task: _detail, response, ...assignment } = current;
      return { assignment, response };
    }), saveTaskProgress: vi.fn() } }));
let tasks: CalendarTask[];

function earlyTask(day: number) {
  const item = assignment({ id: `task-${day}`, task_id: day, position: day, available_date: `2026-12-0${day}` });
  item.task = { ...item.task!, id: day, slug: `task-0${day}`, title: day === 3 ? 'Воспоминание' : 'Качество' };
  return item;
}
async function open(day: number) {
  route.params.id = String(day);
  const view = mount(TaskView, { global: { stubs: {
    TaskAttachments: { template: '<div class="attachments-stub" />' },
    PopupDialog: { props: ['open'], template: '<div v-if="open" role="dialog"><slot /></div>' },
  } } });
  await vi.dynamicImportSettled();
  await flushPromises();
  return view;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-12-04T09:00:00Z'));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  setActivePinia(createPinia());
  const auth = useAuthStore();
  auth.user = { id: 'user-1', user_metadata: { full_name: 'Мария Иванова' } } as never;
  tasks = [earlyTask(1), earlyTask(3), earlyTask(4)];
  const calendar = useCalendarStore(); calendar.currentUserId = 'user-1'; calendar.tasks = tasks;
  vi.mocked(calendarService.getUserCalendar).mockReset().mockImplementation(async () => tasks);
  vi.mocked(calendarService.saveTaskProgress).mockReset().mockImplementation(async (taskId, response, complete) => {
    tasks = tasks.map(item => item.task_id !== taskId ? item : { ...item,
      status: complete ? 'completed' : 'in_progress',
      response: { id: `response-${taskId}`, user_id: 'user-1', task_id: taskId, response, completed_at: '2026-12-04T09:00:00Z', created_at: '', updated_at: '' },
    });
    return { task_id: taskId, response, status: complete ? 'completed' : 'in_progress', completed_at: '2026-12-04T09:00:00Z' };
  });
});

describe('December 1, 3 and 4 conflict resolution', () => {
  it('keeps the active emoji link in the updated first screen', async () => {
    const view = await open(1);
    const link = view.get('a[href="https://t.me/addemoji/newyeargeropharm"]');
    expect(link.text()).toBe('Добавить эмодзи');
    expect(link.attributes('target')).toBe('_blank');
  });
  it('routes day 3 to the optional memory form and persists the text and sender to task 3', async () => {
    const view = await open(3);
    expect(view.find('.crossword-page').exists()).toBe(false);
    expect(view.get('.memory-date').text()).toBe('3 ДЕКАБРЯ');
    expect(view.text()).toContain('Если вам есть чем поделиться');
    expect(view.get('label[for="memory-author"]').text()).toBe('От кого');
    await view.get('#memory-answer').setValue('  Запуск совместного проекта  ');
    await view.get('#memory-author').setValue('  Анна Петрова  ');
    await view.get('.memory-form').trigger('submit'); await flushPromises();
    expect(calendarService.saveTaskProgress).toHaveBeenCalledExactlyOnceWith(3, { text: 'Запуск совместного проекта', author: 'Анна Петрова' }, true);
    view.unmount();
    const reopened = await open(3);
    expect(reopened.get<HTMLTextAreaElement>('#memory-answer').element.value).toBe('Запуск совместного проекта');
    expect(reopened.get<HTMLInputElement>('#memory-author').element.value).toBe('Анна Петрова');
    expect(reopened.get<HTMLInputElement>('#memory-author').element.readOnly).toBe(true);
  });
  it('does not submit a memory without a sender', async () => {
    const view = await open(3);
    await view.get('#memory-answer').setValue('Совместный проект');
    await view.get('#memory-author').setValue('');
    await view.get('.memory-form').trigger('submit');
    expect(view.get('[role="alert"]').text()).toContain('Укажите, от кого');
    expect(calendarService.saveTaskProgress).not.toHaveBeenCalled();
  });
  it('routes day 4 to the quality crossword and saves its solution to task 4', async () => {
    const view = await open(4);
    expect(view.find('.memory-page').exists()).toBe(false);
    expect(view.get('.crossword-date').text()).toBe('4 ДЕКАБРЯ');
    expect(view.get('h1').text()).toContain('Качество');
    await view.get('.start-button').trigger('click');
    for (const cell of crosswordCells) await view.get(`[data-cell="${cell.key}"]`).setValue(cell.answer);
    await view.get('.check-button').trigger('click'); await flushPromises();
    expect(calendarService.saveTaskProgress).toHaveBeenCalledExactlyOnceWith(4, { solved: true }, true);
  });
});
