import { nextTick } from 'vue';
import { reportResourceFailure } from './resource-diagnostics';

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
  await abortable(image.decode().catch(() => { throw new ImageReadinessError('decode'); }), signal);
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

export async function waitForScreenResources(root: HTMLElement, signal: AbortSignal) {
  if (signal.aborted) throw aborted();
  const optional = new AbortController();
  const stopOptional = () => optional.abort();
  const timer = setTimeout(stopOptional, OPTIONAL_RESOURCE_TIMEOUT);
  signal.addEventListener('abort', stopOptional, { once: true });
  let finished = false;

  const resources: Promise<void>[] = [];
  const urls = new Set<string>();
  const fonts = new Map<string, { text: string; families: string }>();

  async function waitForImage(image: HTMLImageElement) {
    const critical = image.hasAttribute('data-screen-critical');
    const resourceSignal = critical ? signal : optional.signal;
    let source = imageSource(image);
    while (source) {
      try {
        await imageReady(image, resourceSignal);
        image.removeAttribute('data-screen-image-fallback');
        return;
      } catch (error) {
        if (finished || signal.aborted) throw error;
        const reason = resourceSignal.aborted ? 'timeout' : error instanceof ImageReadinessError ? error.reason : 'unexpected';
        reportResourceFailure('image', reason, source, critical);
        // Allow Vue's own onerror handler to replace the image first.
        await nextTick();
        if (finished || signal.aborted) throw error;
        if (!root.contains(image)) return;
        const replacement = imageSource(image);
        if (!resourceSignal.aborted && source !== replacement) {
          source = replacement;
          continue;
        }
        if (critical || reason === 'unexpected') throw error;
        if (image.complete && image.naturalWidth && reason === 'timeout') return;
        image.setAttribute('data-screen-image-fallback', '');
        image.addEventListener('load', () => image.removeAttribute('data-screen-image-fallback'), { once: true, signal });
        return;
      }
    }
  }

  function visit(element: Element) {
    // Closed dialogs/menus and alternate hidden game states are not initial UI.
    if (element.matches('dialog:not([open]):not([data-screen-dialog-pending]), [hidden]')) return;
    const style = getComputedStyle(element);
    if (style.display === 'none') return;
    if (element instanceof HTMLImageElement && imageSource(element)) {
      element.loading = 'eager';
      resources.push(waitForImage(element));
    }
    if (element instanceof HTMLVideoElement && element.poster) urls.add(element.poster);
    for (const current of [style, getComputedStyle(element, '::before'), getComputedStyle(element, '::after')]) {
      for (const url of urlsIn(current.backgroundImage)) urls.add(url);
      for (const url of urlsIn(current.borderImageSource)) urls.add(url);
      for (const url of urlsIn(current.maskImage)) urls.add(url);
      const text = current === style
        ? Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('').trim()
        : current.content.replace(/^["']|["']$/g, '');
      if (text && text !== 'none' && text !== 'normal') {
        const font = `${current.fontStyle} ${current.fontWeight} ${current.fontSize} ${current.fontFamily}`;
        fonts.set(font, { text: (fonts.get(font)?.text ?? '') + text, families: current.fontFamily });
      }
    }
    for (const child of element.children) {
      if (element instanceof HTMLDetailsElement && !element.open && child.tagName !== 'SUMMARY') continue;
      visit(child);
    }
  }

  try {
    visit(root);
    for (const url of urls) {
      const image = new Image();
      image.src = url;
      // The browser skips unavailable CSS image layers, leaving the
      // underlying color, gradient or other layers visible.
      resources.push(imageReady(image, optional.signal).catch(error => {
        if (finished || signal.aborted) throw error;
        reportResourceFailure('background', optional.signal.aborted ? 'timeout' : error instanceof ImageReadinessError ? error.reason : 'unexpected', url);
      }));
    }
    let sources: ReturnType<typeof fontSources> | undefined;
    const reportedFonts = new Set<string>();
    for (const [font, { text, families }] of fonts) {
      resources.push(abortable(document.fonts.load(font, text), optional.signal).then(() => {}, error => {
        if (finished || signal.aborted) throw error;
        sources ??= fontSources();
        const urls = families.split(',').flatMap(family => [...(sources?.get(fontFamily(family)) ?? [])]);
        const reason = optional.signal.aborted ? 'timeout' : 'load';
        for (const url of urls.length ? urls : ['']) {
          const key = `${reason}:${url}`;
          if (reportedFonts.has(key)) continue;
          reportedFonts.add(key);
          reportResourceFailure('font', reason, url);
        }
      }));
    }
    await Promise.all(resources);
  } finally {
    finished = true;
    clearTimeout(timer);
    signal.removeEventListener('abort', stopOptional);
    stopOptional();
  }
}
