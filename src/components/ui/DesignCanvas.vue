<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{ width: number; height: number }>();
const root = ref<HTMLElement>();
const scale = ref(1);
let observer: ResizeObserver | undefined;
function measure() {
  if (root.value) scale.value = root.value.getBoundingClientRect().width / props.width;
}
onMounted(() => {
  measure();
  observer = new ResizeObserver(measure);
  if (root.value) observer.observe(root.value);
});
watch(() => props.width, measure);
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div ref="root" class="design-canvas" :style="{ aspectRatio: `${width} / ${height}`, '--design-scale': scale }">
    <div class="design-canvas-art" :style="{ width: `${width}px`, height: `${height}px`, transform: `scale(${scale})` }"><slot /></div>
  </div>
</template>

<style scoped>
.design-canvas { position: relative; min-width: 0; }
.design-canvas-art :slotted(img) { display: block; max-width: none; }
.design-canvas-art { position: absolute; inset: 0 auto auto 0; transform-origin: top left; }
</style>
