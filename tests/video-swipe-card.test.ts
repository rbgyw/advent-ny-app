import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VideoSwipeCard from '../src/components/VideoSwipeCard.vue';
const video = { id: 'v1', title: 'Поздравление №1', description: 'С Новым годом!', author: 'Команда', videoUrl: 'https://example.com/1.mp4' };
function card(overrides = {}) { return mount(VideoSwipeCard, { props: { video, busy: false, swipe: null, ...overrides } }); }
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 313, height: 468, bottom: 468, top: 0, left: 0, right: 313, x: 0, y: 0, toJSON() {} });
});
async function drag(view: ReturnType<typeof card>, x: number, y = 0) {
  const element = view.get('article');
  await element.trigger('pointerdown', { pointerId: 1, clientX: 100, clientY: 100, button: 0, isPrimary: true });
  await element.trigger('pointermove', { pointerId: 1, clientX: 100 + x, clientY: 100 + y });
  await element.trigger('pointerup', { pointerId: 1, clientX: 100 + x, clientY: 100 + y });
}
describe('portrait swipe card', () => {
  it.each([[110, true], [-110, false]])('votes in the direction of a completed horizontal swipe (%s)', async (x, liked) => {
    const view = card(); await drag(view, x as number);
    expect(view.emitted('vote')).toEqual([[liked]]);
  });
  it.each([[20, 0], [110, 150]])('does not vote for a tap or vertical scroll (%s, %s)', async (x, y) => {
    const view = card(); await drag(view, x, y);
    expect(view.emitted('vote')).toBeUndefined();
  });
  it('keeps a touch drag when implicit capture moves from a child to the card', async () => {
    const view = card();
    const article = view.get('article');
    await article.trigger('pointerdown', { pointerId: 1, clientX: 100, clientY: 100, button: 0, isPrimary: true });
    await article.trigger('pointermove', { pointerId: 1, clientX: 210, clientY: 100 });
    await view.get('video').trigger('lostpointercapture', { pointerId: 1 });
    await article.trigger('pointerup', { pointerId: 1, clientX: 210, clientY: 100 });
    expect(view.emitted('vote')).toEqual([[true]]);
  });
  it('does not vote during a save or for an unpublished placeholder', async () => {
    const busy = card({ busy: true }); await drag(busy, 110);
    expect(busy.emitted('vote')).toBeUndefined();
    const placeholder = card({ video: undefined }); await drag(placeholder, 110);
    expect(placeholder.emitted('vote')).toBeUndefined();
    expect(placeholder.text()).toContain('Здесь будет видео');
    expect(placeholder.find('video').exists()).toBe(false);
  });
  it('allows native playback controls to work without turning seeking into a vote', async () => {
    const view = card();
    await view.get('video').trigger('play');
    expect(view.get('video').attributes('controls')).toBeDefined();
    await view.get('video').trigger('pointerdown', { pointerId: 1, clientX: 100, clientY: 450, button: 0, isPrimary: true });
    await view.get('article').trigger('pointermove', { pointerId: 1, clientX: 240, clientY: 450 });
    await view.get('article').trigger('pointerup', { pointerId: 1, clientX: 240, clientY: 450 });
    expect(view.emitted('vote')).toBeUndefined();
  });
  it('reports the end of an outgoing animation and offers a retry for failed media', async () => {
    const view = card({ swipe: 'right' });
    await view.get('article').trigger('animationend');
    expect(view.emitted('settled')).toHaveLength(1);
    await view.get('video').trigger('error');
    expect(view.text()).toContain('Видео не удалось загрузить');
    expect(view.get('.video-reload').text()).toContain('Попробовать ещё раз');
  });
});
