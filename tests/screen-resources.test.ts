import { nextTick } from 'vue';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { observeScreenResources } from '../src/utils/screen-resources';

let stop: (() => void) | undefined;
let root: HTMLDivElement;
beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { stop?.(); stop = undefined; root.remove(); });
function image(source = '/assets/picture-aBcDe123.svg') {
  const image = document.createElement('img');
  image.src = source;
  image.loading = 'lazy';
  root.append(image);
  return image;
}

it('diagnoses a broken image and preserves native lazy loading', async () => {
  const img = image();
  Object.defineProperty(img, 'complete', { value: true });
  stop = observeScreenResources(root);
  await vi.advanceTimersByTimeAsync(1);
  await nextTick();
  expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/optional image load: .*picture-aBcDe123.svg$/));
  expect(img.hasAttribute('data-screen-image-fallback')).toBe(true);
  expect(img.loading).toBe('lazy');
});

it('handles decode rejection locally and recovers after a later successful load', async () => {
  const img = image();
  Object.defineProperty(img, 'complete', { value: true });
  Object.defineProperty(img, 'naturalWidth', { value: 100 });
  img.decode = vi.fn().mockRejectedValue(new DOMException('bad bytes', 'EncodingError'));
  stop = observeScreenResources(root);
  await vi.advanceTimersByTimeAsync(1);
  expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/optional image decode:/));
  expect(img.hasAttribute('data-screen-image-fallback')).toBe(true);
  img.dispatchEvent(new Event('load'));
  expect(img.hasAttribute('data-screen-image-fallback')).toBe(false);
});

it('bounds a slow resource probe and cancels diagnostics after leaving the screen', async () => {
  const img = image();
  Object.defineProperty(img, 'complete', { value: false });
  stop = observeScreenResources(root);
  await vi.advanceTimersByTimeAsync(4001);
  expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/optional image timeout:/));
  stop(); stop = undefined;
  vi.mocked(console.warn).mockClear();
  img.src = '/assets/another-aBcDe123.svg';
  img.dispatchEvent(new Event('error'));
  await vi.advanceTimersByTimeAsync(5000);
  expect(console.warn).not.toHaveBeenCalled();
});

it('does not begin a probe for an image outside the initial viewport', async () => {
  const img = image();
  vi.spyOn(img, 'getBoundingClientRect').mockReturnValue({ top: 2000, bottom: 2200, left: 0, right: 100 } as DOMRect);
  stop = observeScreenResources(root);
  await vi.advanceTimersByTimeAsync(5000);
  expect(console.warn).not.toHaveBeenCalled();
});

it('successful images remain visible even without the optional decode API', async () => {
  const img = image();
  Object.defineProperty(img, 'complete', { value: true });
  Object.defineProperty(img, 'naturalWidth', { value: 100 });
  stop = observeScreenResources(root);
  await vi.advanceTimersByTimeAsync(1);
  expect(img.hasAttribute('data-screen-image-fallback')).toBe(false);
  expect(console.warn).not.toHaveBeenCalled();
});

it('logs a repeated failed artwork URL only once per screen and reason', async () => {
  for (let index = 0; index < 3; index++) {
    const img = image();
    Object.defineProperty(img, 'complete', { value: true });
  }
  stop = observeScreenResources(root);
  await vi.advanceTimersByTimeAsync(1);
  expect(console.warn).toHaveBeenCalledTimes(1);
});
