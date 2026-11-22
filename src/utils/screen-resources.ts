import { nextTick } from 'vue';

function aborted() { return new DOMException('Screen left', 'AbortError'); }

export function abortable<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(aborted());
  return new Promise((resolve, reject) => {
    const cancel = () => reject(aborted());
    signal.addEventListener('abort', cancel, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener('abort', cancel));
  });
}

function imageReady(image: HTMLImageElement, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
      signal.removeEventListener('abort', cancelled);
    };
    const loaded = () => {
      cleanup();
      // decode() also covers cached images, so reveal cannot precede decoding.
      abortable(image.decode(), signal).then(resolve, reject);
    };
    const failed = () => { cleanup(); reject(new Error('Screen image unavailable')); };
    const cancelled = () => { cleanup(); reject(aborted()); };
    if (signal.aborted) { cancelled(); return; }
    image.addEventListener('load', loaded, { once: true });
    image.addEventListener('error', failed, { once: true });
    signal.addEventListener('abort', cancelled, { once: true });
    if (image.complete) {
      if (image.naturalWidth) loaded();
      else failed();
    }
  });
}

export async function waitForScreenResources(root: HTMLElement, signal: AbortSignal) {
  const images: Promise<void>[] = [];
  const urls = new Set<string>();
  const fonts = new Map<string, string>();
  function cssImages(value: string) {
    for (const match of value.matchAll(/url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g)) {
      const url = match[1] ?? match[2] ?? match[3];
      if (url) urls.add(url.trim());
    }
  }
  function visit(element: Element) {
    // Closed dialogs/menus and alternate hidden game states are not initial UI.
    if (element.matches('dialog:not([open]):not([data-screen-dialog-pending]), [hidden]')) return;
    const style = getComputedStyle(element);
    if (style.display === 'none') return;
    if (element instanceof HTMLImageElement && (element.currentSrc || element.src)) {
      element.loading = 'eager';
      const source = element.currentSrc || element.src;
      images.push(imageReady(element, signal).catch(async error => {
        // A collection may replace a missing optional photo with its designed
        // placeholder. Wait for that render instead of rejecting a valid screen.
        await nextTick();
        if (!signal.aborted && !root.contains(element)) return;
        if (!signal.aborted && (element.currentSrc || element.src) !== source) {
          return imageReady(element, signal);
        }
        throw error;
      }));
    }
    if (element instanceof HTMLVideoElement && element.poster) urls.add(element.poster);
    for (const current of [style, getComputedStyle(element, '::before'), getComputedStyle(element, '::after')]) {
      cssImages(current.backgroundImage);
      cssImages(current.borderImageSource);
      cssImages(current.maskImage);
      const text = current === style
        ? Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('').trim()
        : current.content.replace(/^["']|["']$/g, '');
      if (text && text !== 'none' && text !== 'normal') {
        const font = `${current.fontStyle} ${current.fontWeight} ${current.fontSize} ${current.fontFamily}`;
        fonts.set(font, (fonts.get(font) ?? '') + text);
      }
    }
    for (const child of element.children) {
      if (element instanceof HTMLDetailsElement && !element.open && child.tagName !== 'SUMMARY') continue;
      visit(child);
    }
  }
  visit(root);
  for (const url of urls) {
    const image = new Image();
    image.src = url;
    images.push(imageReady(image, signal));
  }
  await Promise.all([
    ...images,
    ...Array.from(fonts, ([font, text]) => abortable(document.fonts.load(font, text), signal)),
  ]);
  await abortable(document.fonts.ready, signal);
}
