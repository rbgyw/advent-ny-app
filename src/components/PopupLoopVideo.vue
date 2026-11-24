<script setup lang="ts">
import { ref, watch } from 'vue';

defineProps<{ src: string; active: boolean; label: string }>();
const media = ref<HTMLVideoElement>();

watch(media, (element, _, onCleanup) => {
  if (!element) return;
  // Muted inline playback can start automatically on mobile browsers too.
  element.muted = true;
  void element.play().catch(() => { /* Loading errors are handled by the browser. */ });
  onCleanup(() => {
    element.pause();
    element.removeAttribute('src');
    element.load();
  });
});
</script>

<template>
  <video v-if="active" ref="media" class="popup-loop-video" :src="src" :aria-label="label"
    autoplay loop muted playsinline preload="auto" tabindex="-1"
    controlslist="nodownload nofullscreen noremoteplayback" disablepictureinpicture disableremoteplayback
    @contextmenu.prevent @dblclick.prevent />
</template>

<style scoped>
.popup-loop-video { display: block; width: 100%; height: auto; max-height: min(40svh, 300px); object-fit: contain; border-radius: 13px; pointer-events: none; }
</style>
