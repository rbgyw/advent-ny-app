<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { screenReadinessKey } from '../../composables/useScreenReadiness';
import { navigationDestination, navigationPending, screenPending, screenError, screenBackground, screenBackgroundLayer } from '../../router/status';
import { waitForScreenResources } from '../../utils/screen-resources';

const props = defineProps<{ destination: string }>();
const root = ref<HTMLElement>();
const ready = ref(false);
let mounted = false;
let disposed = false;
let failed = false;
let resizeObserver: ResizeObserver | undefined;
let backgroundObserver: MutationObserver | undefined;
let pending = 0;
let version = 0;
let controller: AbortController | undefined;
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
  controller?.abort();
  const current = new AbortController();
  controller = current;
  try {
    await nextTick();
    if (attempt !== version || pending || !isCurrent() || !root.value) return;
    background();
    await waitForScreenResources(root.value, current.signal);
    // Child image handlers and ResizeObservers may update the final layout.
    await nextTick();
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    if (attempt !== version || pending || !isCurrent()) return;
    background();
    ready.value = true;
    resizeObserver?.disconnect();
    backgroundObserver?.disconnect();
    screenPending.value = false;
    clearTimeout(timeout);
  } catch (error) {
    if (!current.signal.aborted && attempt === version && isCurrent()) {
      failed = true;
      screenError.value = 'Не удалось загрузить экран. Проверьте подключение и попробуйте снова.';
      clearTimeout(timeout);
    }
  }
}

provide(screenReadinessKey, {
  ready,
  track<T>(work: Promise<T>): Promise<T> {
    if (ready.value || disposed) return work;
    pending++;
    version++;
    controller?.abort();
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
      controller?.abort();
      failed = true;
      screenError.value = 'Загрузка занимает слишком много времени. Проверьте подключение и попробуйте снова.';
    }
  }, 30_000);
  void check();
});
onBeforeUnmount(() => { disposed = true; controller?.abort(); clearTimeout(timeout); cancelAnimationFrame(resizeFrame); window.removeEventListener('resize', resizeBackground); resizeObserver?.disconnect(); backgroundObserver?.disconnect(); });
</script>

<template>
  <div ref="root" class="screen-content" :class="{ 'screen-content-pending': !ready || navigationPending }" :inert="!ready || navigationPending" :aria-hidden="!ready || navigationPending ? 'true' : undefined">
    <slot />
  </div>
</template>

<style>
.screen-content { width: 100%; min-height: 100svh; }
.screen-content-pending { height: 100svh; overflow: clip; visibility: hidden; pointer-events: none; }
/* Explicit visibility on a child must not expose it before the whole screen. */
.screen-content-pending * { visibility: hidden !important; }
.screen-content-pending dialog[data-screen-dialog-pending] { display: block !important; }
</style>
