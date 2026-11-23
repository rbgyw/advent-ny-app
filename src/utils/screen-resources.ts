import { nextTick } from 'vue';
import { reportResourceFailure, type ResourceFailure } from './resource-diagnostics';

const OPTIONAL_RESOURCE_TIMEOUT = 4_000;

function aborted() { return new DOMException('Screen left', 'AbortError'); }

export function abortable<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    // The caller has already started work, which can still reject after abort.
    void work.catch(() => {});
    return Promise.reject(aborted());
  }
  return new Promise((resolve, reject) => {
    const cancel = () => reject(aborted());
    signal.addEventListener('abort', cancel, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener('abort', cancel));
  });
}

export class ImageReadinessError extends Error {
  readonly reason: 'load' | 'decode';

  constructor(reason: 'load' | 'decode') {
    super(reason);
    this.reason = reason;
  }
}

async function imageReady(image: HTMLImageElement, signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
      signal.removeEventListener('abort', cancelled);
    };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new ImageReadinessError('load')); };
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
  // A successful load event (including a cache hit) can precede decoding.
  if (typeof image.decode === 'function') {
    await abortable(image.decode().catch(() => { throw new ImageReadinessError('decode'); }), signal);
  }
}

function urlsIn(value: string) {
  return Array.from(value.matchAll(/url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g), match =>
    (match[1] ?? match[2] ?? match[3]).trim()).filter(Boolean);
}

const fontFamily = (value: string) => value.trim().replace(/^["']|["']$/g, '').toLowerCase();

function fontSources() {
  const sources = new Map<string, Set<string>>();
  function visit(rules: CSSRuleList, base: string) {
    for (const rule of rules) {
      if (rule instanceof CSSFontFaceRule) {
        const family = fontFamily(rule.style.getPropertyValue('font-family'));
        const urls = sources.get(family) ?? new Set<string>();
        for (const url of urlsIn(rule.style.getPropertyValue('src'))) urls.add(new URL(url, base).href);
        sources.set(family, urls);
      } else if (rule instanceof CSSGroupingRule) visit(rule.cssRules, base);
    }
  }
  for (const sheet of document.styleSheets) {
    try { visit(sheet.cssRules, sheet.href ?? document.baseURI); }
    catch { /* An unreadable stylesheet cannot supply a diagnostic URL. */ }
  }
  return sources;
}

const imageSource = (image: HTMLImageElement) => image.currentSrc || image.src;

// Diagnostics run independently of screen readiness. Never force lazy images or
// font downloads merely to reveal a page. Abort on navigation and bound each probe.
export function observeScreenResources(root: HTMLElement): () => void {
  const lifetime = new AbortController();
  const seenImages = new WeakMap<HTMLImageElement, string>();
  const seenUrls = new Set<string>();
  const reported = new Set<string>();
  const fontTimers = new Map<FontFace, ReturnType<typeof setTimeout>>();
  let frame = 0;
  const changed = new Set<Element>([root]);

  function report(kind: 'image' | 'background' | 'font' | 'screen', reason: ResourceFailure, source = '') {
    const key = `${kind}:${reason}:${source}`;
    if (reported.has(key)) return;
    reported.add(key);
    reportResourceFailure(kind, reason, source);
  }

  function probe(kind: 'image' | 'background', image: HTMLImageElement, source: string) {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    lifetime.signal.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(cancel, OPTIONAL_RESOURCE_TIMEOUT);
    void imageReady(image, controller.signal).then(() => {
      if (kind === 'image' && imageSource(image) === source) image.removeAttribute('data-screen-image-fallback');
    }, async error => {
      if (lifetime.signal.aborted) return;
      const reason = controller.signal.aborted ? 'timeout' : error instanceof ImageReadinessError ? error.reason : 'unexpected';
      report(kind, reason, source);
      await nextTick(); // Let component-specific onerror replacements take priority.
      if (lifetime.signal.aborted || kind !== 'image' || imageSource(image) !== source) return;
      if (reason !== 'timeout' || !image.naturalWidth) image.setAttribute('data-screen-image-fallback', '');
    }).finally(() => {
      clearTimeout(timer);
      lifetime.signal.removeEventListener('abort', cancel);
    });
  }

  function watchImage(image: HTMLImageElement) {
    const source = imageSource(image);
    if (!source || seenImages.get(image) === source) return;
    seenImages.set(image, source);
    probe('image', image, source);
  }
  function assetEvent(event: Event) {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (event.type === 'load') image.removeAttribute('data-screen-image-fallback');
    watchImage(image);
  }
  function scan() {
    if (lifetime.signal.aborted) return;
    const visit = (element: Element) => {
      if (element.matches('dialog:not([open]), [hidden]')) return;
      const style = getComputedStyle(element);
      if (style.display === 'none') return;
      const box = element.getBoundingClientRect();
      const visible = box.bottom >= 0 && box.top <= innerHeight && box.right >= 0 && box.left <= innerWidth;
      if (visible) {
        if (element instanceof HTMLImageElement) watchImage(element);
        const urls = new Set<string>();
        if (element instanceof HTMLVideoElement && element.poster) urls.add(element.poster);
        const layers = [style, getComputedStyle(element, '::before'), getComputedStyle(element, '::after')];
        if (element instanceof HTMLDialogElement && element.open) layers.push(getComputedStyle(element, '::backdrop'));
        for (const current of layers) {
          for (const property of [current.backgroundImage, current.borderImageSource, current.maskImage]) {
            for (const url of urlsIn(property)) urls.add(url);
          }
        }
        for (const url of urls) {
          if (seenUrls.has(url)) continue;
          seenUrls.add(url);
          const image = new Image();
          image.src = url;
          probe('background', image, url);
        }
      }
      // Inline SVG paths have no independent CSS resource layers in our UI.
      if (element instanceof SVGElement) return;
      for (const child of element.children) {
        if (element instanceof HTMLDetailsElement && !element.open && child.tagName !== 'SUMMARY') continue;
        visit(child);
      }
    };
    try { for (const element of changed) if (root.contains(element) || element === root) visit(element); }
    catch { report('screen', 'unexpected'); }
    finally { changed.clear(); }
  }
  function schedule() {
    changed.clear();
    changed.add(root);
    scheduleFrame();
  }
  function scheduleFrame() {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; scan(); });
  }
  function fontFailure(event: Event) {
    const faces = (event as Event & { fontfaces?: FontFace[] }).fontfaces ?? [];
    const sources = fontSources();
    for (const face of faces) for (const url of sources.get(fontFamily(face.family)) ?? ['']) {
      report('font', 'load', url);
    }
  }
  function watchFonts() {
    document.fonts?.forEach(face => {
      if (face.status !== 'loading' || fontTimers.has(face)) return;
      fontTimers.set(face, setTimeout(() => {
        if (face.status !== 'loading' || lifetime.signal.aborted) return;
        const sources = fontSources().get(fontFamily(face.family)) ?? [''];
        for (const source of sources) report('font', 'timeout', source);
      }, OPTIONAL_RESOURCE_TIMEOUT));
    });
  }
  root.addEventListener('error', assetEvent, true);
  root.addEventListener('load', assetEvent, true);
  document.fonts?.addEventListener('loadingerror', fontFailure);
  document.fonts?.addEventListener('loading', watchFonts);
  watchFonts();
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') changed.add(record.target as Element);
      else for (const node of record.addedNodes) if (node instanceof Element) changed.add(node);
    }
    if (changed.size) scheduleFrame();
  });
  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'srcset', 'class', 'style', 'open', 'hidden'] });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  // A task's font can have failed before this observer was installed.
  if (document.fonts) {
    const failed: FontFace[] = [];
    document.fonts.forEach(face => { if (face.status === 'error') failed.push(face); });
    if (failed.length) fontFailure({ fontfaces: failed } as unknown as Event);
  }
  schedule();
  return () => {
    lifetime.abort();
    cancelAnimationFrame(frame);
    observer.disconnect();
    root.removeEventListener('error', assetEvent, true);
    root.removeEventListener('load', assetEvent, true);
    document.fonts?.removeEventListener('loadingerror', fontFailure);
    document.fonts?.removeEventListener('loading', watchFonts);
    for (const timer of fontTimers.values()) clearTimeout(timer);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
  };
}
