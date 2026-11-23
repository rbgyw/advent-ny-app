<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onErrorCaptured, provide, ref, watch } from 'vue';
import { screenReadinessKey } from '../../composables/useScreenReadiness';
import { navigationDestination, navigationPending, navigationError, screenPending, screenError, screenBackground, screenBackgroundLayer } from '../../router/status';
import { observeScreenResources } from '../../utils/screen-resources';
import { reportResourceFailure } from '../../utils/resource-diagnostics';

const props = defineProps<{ destination: string }>();
const root = ref<HTMLElement>();
const ready = ref(false);
// Also cover a failed route import: the old page can remain mounted underneath
// the error screen, and must stay outside keyboard navigation until recovery.
const blocked = computed(() => !ready.value || navigationPending.value || screenPending.value || Boolean(navigationError.value || screenError.value));
let mounted = false;
let disposed = false;
let failed = false;
let resizeObserver: ResizeObserver | undefined;
let backgroundObserver: MutationObserver | undefined;
let pending = 0;
let version = 0;
let stopResources: (() => void) | undefined;
let timeout: ReturnType<typeof setTimeout>;
let resizeFrame = 0;
function resizeBackground() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => { if (isCurrent() && !ready.value) background(); });
}

function isCurrent() { return !disposed && props.destination === navigationDestination.value; }
function background() {
  const page = root.value?.querySelector('main');
  if (!page) return;
  const style = getComputedStyle(page);
  // Use the destination's actual background, including its SVG artwork. Warm
  // task pages put the radial glow in a separate, transformed background layer.
  const gradient = page.querySelector('[class$="-gradient"]');
  screenBackground.value = style.background;
  if (gradient) {
    const layer = getComputedStyle(gradient);
    const parent = gradient.parentElement!.getBoundingClientRect();
    const origin = page.getBoundingClientRect();
    screenBackgroundLayer.value = {
      position: 'absolute', background: layer.background,
      width: layer.width, height: layer.height,
      left: `${parent.left - origin.left + parseFloat(layer.left)}px`,
      top: `${parent.top - origin.top + parseFloat(layer.top)}px`,
      transform: layer.transform, transformOrigin: layer.transformOrigin,
    };
  } else screenBackgroundLayer.value = undefined;
}

async function check() {
  if (!mounted || pending || ready.value || failed || !isCurrent()) return;
  const attempt = ++version;
  try {
    await nextTick();
    if (attempt !== version || pending || !isCurrent() || !root.value) return;
    // Only tracked data and component imports gate visibility. Images, fonts
    // and animation frames (paused in background tabs) never gate readiness.
    background();
    ready.value = true;
    try { stopResources = observeScreenResources(root.value); }
    catch { reportResourceFailure('screen', 'unexpected'); }
    resizeObserver?.disconnect();
    backgroundObserver?.disconnect();
    screenPending.value = false;
    clearTimeout(timeout);
    await nextTick();
    // The old screen is inert during navigation. Start reading the new page at
    // its main landmark once it is visible; let initial native dialogs keep focus.
    if (isCurrent() && document.activeElement === document.body) {
      const page = root.value?.querySelector('main');
      if (page) { page.tabIndex = -1; page.focus({ preventScroll: true }); }
    }
  } catch {
    if (attempt === version && isCurrent()) {
      reportResourceFailure('screen', 'unexpected', undefined, true);
      failed = true;
      screenError.value = 'Ошибка приложения при открытии экрана. Попробуйте обновить страницу.';
      clearTimeout(timeout);
    }
  }
}

// Redirecting back to the already-mounted page does not mount a new boundary.
// Restore its readiness after a cancelled/redirected navigation resets status.
watch([navigationPending, navigationDestination], () => {
  if (isCurrent() && ready.value && !navigationPending.value) screenPending.value = false;
});
onErrorCaptured(() => {
  if (!isCurrent()) return false;
  failed = true;
  version++;
  clearTimeout(timeout);
  reportResourceFailure('screen', 'unexpected', undefined, true);
  screenError.value = 'Ошибка приложения при открытии экрана. Попробуйте обновить страницу.';
  return false;
});

provide(screenReadinessKey, {
  ready,
  track<T>(work: Promise<T>): Promise<T> {
    if (ready.value || disposed) return work;
    pending++;
    version++;
    // Attach both handlers without creating an unhandled rejected promise.
    const settled = () => { pending--; void check(); };
    work.then(settled, settled);
    return work;
  },
});
onMounted(() => {
  mounted = true;
  window.addEventListener('resize', resizeBackground);
  resizeObserver = new ResizeObserver(resizeBackground);
  if (root.value) {
    resizeObserver.observe(root.value);
    // Task gradients receive their transform from their own ResizeObservers.
    // Mirror that final transform after Vue applies it, including font reflow.
    backgroundObserver = new MutationObserver(resizeBackground);
    backgroundObserver.observe(root.value, { subtree: true, attributes: true, childList: true, characterData: true });
  }
  timeout = setTimeout(() => {
    if (isCurrent() && !ready.value) {
      reportResourceFailure('screen', 'timeout', undefined, true);
      failed = true;
      screenError.value = 'Загрузка занимает слишком много времени. Проверьте подключение и попробуйте снова.';
    }
  }, 30_000);
  void check();
});
onBeforeUnmount(() => { disposed = true; stopResources?.(); clearTimeout(timeout); cancelAnimationFrame(resizeFrame); window.removeEventListener('resize', resizeBackground); resizeObserver?.disconnect(); backgroundObserver?.disconnect(); });
</script>

<template>
  <div ref="root" class="screen-content" :class="{ 'screen-content-pending': blocked }" :inert="blocked">
    <slot />
  </div>
</template>

<style>
.screen-content { width: 100%; min-height: 100svh; }
/* main receives reading focus after navigation, but is never a tab stop.
   Interactive controls keep their own visible keyboard focus indicators. */
.screen-content > main[tabindex="-1"]:focus { outline: none; }
.screen-content-pending { height: 100svh; overflow: clip; visibility: hidden; pointer-events: none; }
/* Explicit visibility on a child must not expose it before the whole screen. */
.screen-content-pending * { visibility: hidden !important; }
.screen-content-pending dialog[data-screen-dialog-pending] { display: block !important; }
/* Preserve layout when decorative artwork is missing. Informative images keep
   their native text alternative inside a neutral placeholder. */
img[data-screen-image-fallback] { background-color: var(--color-paper); color: var(--color-ink); }
img[data-screen-image-fallback][alt=""] { opacity: 0 !important; }
</style>
