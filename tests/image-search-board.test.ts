import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ImageSearchBoard from '../src/components/ImageSearchBoard.vue';
import { podzhikBounds } from '../src/content/podzhik';

function board(disabled = false) {
  const view = mount(ImageSearchBoard, { props: { src: '/scene.png', targetSrc: '/podzhik.png', target: podzhikBounds, disabled } });
  vi.spyOn(view.get('.search-picture').element, 'getBoundingClientRect').mockReturnValue({
    x: -100, y: -200, left: -100, top: -200, width: 626, height: 838, right: 526, bottom: 638, toJSON: () => ({}),
  });
  return view;
}

describe('zoomable image board', () => {
  it('maps a tap to image coordinates after scrolling and zooming', async () => {
    const view = board();
    await view.get('.search-picture').trigger('click', { clientX: 213, clientY: 219 });
    expect(view.emitted('choose')).toEqual([[{ x: 0.5, y: 0.5 }, 626, 838]]);
    await view.get('[aria-label="Увеличить изображение"]').trigger('click');
    expect(view.get('output').text()).toBe('150%');
    expect(view.get('.search-picture').attributes('style')).toContain('150%');
  });

  it('does not count a touch drag as a selection', async () => {
    const view = board();
    await view.get('.search-picture').trigger('pointerdown', { clientX: 100, clientY: 100 });
    await view.get('.search-picture').trigger('pointermove', { clientX: 100, clientY: 140 });
    await view.get('.search-picture').trigger('click', { clientX: 100, clientY: 140 });
    expect(view.emitted('choose')).toBeUndefined();
  });

  it('allows keyboard selection and blocks input while disabled', async () => {
    const view = board();
    await view.get('.search-viewport').trigger('keydown', { key: 'ArrowRight' });
    await view.get('.search-viewport').trigger('keydown', { key: 'Enter' });
    expect(view.emitted('choose')).toEqual([
      [{ x: 0.52, y: 0.5 }, 626, 838],
      [{ x: 0.52, y: 0.5 }, 626, 838],
    ]);
    await view.setProps({ disabled: true });
    await view.get('.search-picture').trigger('click', { clientX: 50, clientY: 50 });
    await view.get('.search-viewport').trigger('keydown', { key: 'Enter' });
    expect(view.emitted('choose')).toHaveLength(2);
  });
});
