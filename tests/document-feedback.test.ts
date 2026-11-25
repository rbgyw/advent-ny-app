import { mount } from '@vue/test-utils';
import { beforeEach, expect, it, vi } from 'vitest';
import FourthTaskScreen from '../src/components/FourthTaskScreen.vue';
import TaskMusicButton from '../src/components/TaskMusicButton.vue';
import { assignment } from './fixtures';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

it('keeps a crossing letter out of an unanswered word field while the grid still shows it', async () => {
  const view = mount(FourthTaskScreen, { props: {
    assignment: assignment(), day: 4, loading: false, saving: false,
  }, global: { stubs: { AdventPopup: true } } });
  await view.findAll('button').find(button => button.text() === 'Начать кроссворд')!.trigger('click');
  await view.get('#crossword-answer').setValue('КАРАНТИН');
  await view.get('form').trigger('submit');
  await view.get('[data-cell="1:1"]').trigger('click');
  expect(view.get<HTMLInputElement>('#crossword-answer').element.value).toBe('');
  expect(view.get<HTMLInputElement>('[data-cell="1:2"]').element.value).toBe('А');
  expect(view.get<HTMLInputElement>('[data-cell="1:2"]').element.readOnly).toBe(true);
  await view.get('[data-cell="0:2"]').trigger('click');
  expect(view.get<HTMLInputElement>('#crossword-answer').element.value).toBe('КАРАНТИН');
});

it('plays the requested task-specific track without preloading it', () => {
  const view = mount(TaskMusicButton, { props: { src: '/music/13_dec.mp3' } });
  expect(view.get('audio').attributes()).toMatchObject({ src: '/music/13_dec.mp3', preload: 'none', loop: '' });
});
