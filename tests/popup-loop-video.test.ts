import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PopupLoopVideo from '../src/components/PopupLoopVideo.vue';

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});
const props = { src: '/gift.mp4', active: false, label: 'Спортивная сумка ГЕРОФАРМ' };

describe('looping popup video', () => {
  it('loads and plays only while the popup is open and restarts on reopening', async () => {
    const view = mount(PopupLoopVideo, { props });
    expect(view.find('video').exists()).toBe(false);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    await view.setProps({ active: true });
    await flushPromises();
    const first = view.get<HTMLVideoElement>('video').element;
    expect(first.muted).toBe(true);
    expect(first.loop).toBe(true);
    expect(first.autoplay).toBe(true);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    await view.setProps({ active: false });
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();
    expect(first.hasAttribute('src')).toBe(false);
    expect(view.find('video').exists()).toBe(false);
    await view.setProps({ active: true });
    expect(view.get('video').element).not.toBe(first);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
    view.unmount();
  });
  it('exposes no native controls, download, fullscreen, remote playback or picture in picture', () => {
    const view = mount(PopupLoopVideo, { props: { ...props, active: true } });
    const player = view.get<HTMLVideoElement>('video');
    expect(player.element.controls).toBe(false);
    expect(player.attributes('controlslist')).toBe('nodownload nofullscreen noremoteplayback');
    expect(player.attributes('disablepictureinpicture')).toBeDefined();
    expect(player.attributes('disableremoteplayback')).toBeDefined();
    expect(player.element.playsInline).toBe(true);
    expect(player.element.tabIndex).toBe(-1);
    const contextMenu = new Event('contextmenu', { cancelable: true });
    player.element.dispatchEvent(contextMenu);
    expect(contextMenu.defaultPrevented).toBe(true);
    view.unmount();
  });
  it('stops and releases media when navigating away with an open popup', async () => {
    const view = mount(PopupLoopVideo, { props: { ...props, active: true } });
    await flushPromises();
    const player = view.get('video').element;
    view.unmount();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledOnce();
    expect(player.hasAttribute('src')).toBe(false);
  });
});
