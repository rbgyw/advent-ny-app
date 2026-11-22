<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import type { SearchBounds, SearchPoint } from '../utils/podzhik';

defineProps<{ src: string; targetSrc: string; target: SearchBounds; disabled?: boolean }>();
const emit = defineEmits<{ choose: [point: SearchPoint, width: number, height: number] }>();
const viewport = ref<HTMLDivElement>();
const picture = ref<HTMLDivElement>();
const zoom = ref(1);
const marker = ref<SearchPoint | null>(null);
const percent = computed(() => Math.round(zoom.value * 100));
let pointerStart: SearchPoint | null = null;
let moved = false;

async function changeZoom(offset: number) {
  const element = viewport.value;
  if (!element) return;
  const centerX = (element.scrollLeft + element.clientWidth / 2) / element.scrollWidth;
  const centerY = (element.scrollTop + element.clientHeight / 2) / element.scrollHeight;
  zoom.value = Math.max(1, Math.min(3, zoom.value + offset));
  await nextTick();
  element.scrollLeft = centerX * element.scrollWidth - element.clientWidth / 2;
  element.scrollTop = centerY * element.scrollHeight - element.clientHeight / 2;
}

function pointerDown(event: PointerEvent) {
  pointerStart = { x: event.clientX, y: event.clientY };
  moved = false;
}
function pointerMove(event: PointerEvent) {
  if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) moved = true;
}
function choose(point: SearchPoint) {
  const rect = picture.value?.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return;
  marker.value = point;
  emit('choose', point, rect.width, rect.height);
}
function click(event: MouseEvent) {
  if (moved) return;
  const rect = picture.value?.getBoundingClientRect();
  if (!rect) return;
  choose({ x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height });
}
function keydown(event: KeyboardEvent) {
  const steps: Record<string, SearchPoint> = {
    ArrowLeft: { x: -0.02, y: 0 }, ArrowRight: { x: 0.02, y: 0 },
    ArrowUp: { x: 0, y: -0.02 }, ArrowDown: { x: 0, y: 0.02 },
  };
  const step = steps[event.key];
  if (step) {
    event.preventDefault();
    const point = marker.value ?? { x: 0.5, y: 0.5 };
    choose({ x: Math.max(0, Math.min(1, point.x + step.x)), y: Math.max(0, Math.min(1, point.y + step.y)) });
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    choose(marker.value ?? { x: 0.5, y: 0.5 });
  }
}
</script>

<template>
  <div class="search-board">
    <div class="search-zoom" role="group" aria-label="Масштаб изображения">
      <button type="button" :disabled="disabled || zoom === 1" aria-label="Уменьшить изображение" @click="changeZoom(-0.5)">−</button>
      <output aria-live="polite">{{ percent }}%</output>
      <button type="button" :disabled="disabled || zoom === 3" aria-label="Увеличить изображение" @click="changeZoom(0.5)">+</button>
    </div>
    <p id="search-board-help" class="search-board-help">Увеличивайте и прокручивайте картинку. Поставьте метку на Поджике и нажмите «Проверить выбор».</p>
    <div ref="viewport" class="search-viewport" :class="{ 'is-zoomed': zoom > 1 }" tabindex="0" aria-label="Поиск Поджика на зимней картинке"
      aria-describedby="search-board-help search-keyboard-help" :aria-disabled="disabled" @keydown="!disabled && keydown($event)">
      <div ref="picture" class="search-picture" :style="{ width: `${percent}%` }"
        @pointerdown="pointerDown" @pointermove="pointerMove" @pointercancel="moved = true"
        @click="!disabled && click($event)">
        <img class="search-scene" :src="src" alt="Заснеженный горнолыжный склон с множеством людей, ёлок и небольших домиков" width="626" height="838" draggable="false" />
        <img class="search-target" :src="targetSrc" :style="{ left: `${target.left * 100}%`, top: `${target.top * 100}%`, width: `${(target.right - target.left) * 100}%` }" alt="" aria-hidden="true" width="104" height="159" draggable="false" />
        <span v-if="marker" class="search-marker" :style="{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }" aria-hidden="true"></span>
      </div>
    </div>
    <p id="search-keyboard-help" class="search-keyboard-help">С клавиатуры: перемещайте метку стрелками, нажмите Enter для выбора точки. Затем перейдите к кнопке «Проверить выбор».</p>
  </div>
</template>

<style scoped>
.search-zoom { display: flex; align-items: center; justify-content: center; gap: 20px; margin-block: 14px; }
.search-zoom button { width: 44px; height: 44px; border: 1px solid var(--dec-red); border-radius: 13px; background: var(--dec-paper); color: var(--dec-red); font: 400 22px/1 'Advent Inter', sans-serif; cursor: pointer; }
.search-zoom button:disabled { opacity: .45; cursor: default; }
.search-zoom output { min-width: 48px; color: #70492c; font-size: 12px; text-align: center; }
.search-board-help { margin-block: 0 16px; font-size: 12px; line-height: 18px; }
.search-viewport { box-sizing: border-box; width: 100%; margin-inline: auto; overflow: auto; border: 1px solid #b98765; border-radius: 13px; background: var(--dec-paper); touch-action: pan-x pan-y pinch-zoom; overscroll-behavior: contain; overflow-anchor: none; }
.search-viewport.is-zoomed { max-height: min(70svh, 680px); }
.search-picture { position: relative; min-width: 100%; margin-inline: auto; cursor: crosshair; }
.search-picture img { display: block; width: 100%; height: auto; user-select: none; -webkit-user-drag: none; }
.search-picture .search-target { position: absolute; pointer-events: none; }
.search-marker { position: absolute; width: 24px; height: 24px; box-sizing: border-box; transform: translate(-50%, -50%); border: 2px solid #a7280b; border-radius: 50%; background: #fff4; box-shadow: 0 0 0 2px #fff; pointer-events: none; }
.search-keyboard-help { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
