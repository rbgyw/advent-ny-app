<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { AdventVideo } from '../utils/video-voting';
import playIcon from '../assets/dec-22/play.svg';

const props = defineProps<{ video?: AdventVideo; busy: boolean; swipe: 'left' | 'right' | null }>();
const emit = defineEmits<{ vote: [liked: boolean]; settled: [] }>();
const media = ref<HTMLVideoElement>();
const mediaFailed = ref(false);
const playing = ref(false);
const drag = ref(0);
const dragging = ref(false);
let pointer: { id: number; x: number; y: number } | null = null;
const movement = computed(() => ({ '--drag-x': `${drag.value}px`, '--drag-rotation': `${drag.value / 22}deg` }));

function resetDrag() { pointer = null; dragging.value = false; drag.value = 0; }
watch([() => props.video?.id, () => props.busy], () => resetDrag());
watch(() => props.video?.id, () => { mediaFailed.value = false; playing.value = false; });
function pointerDown(event: PointerEvent) {
  if (!props.video || props.busy || event.button > 0 || event.isPrimary === false ||
    (event.target instanceof Element && event.target.closest('button, a'))) return;
  const player = media.value;
  // Leave the native video control strip available for playback, seeking and volume.
  if (playing.value && player && event.clientY >= player.getBoundingClientRect().bottom - 54 && event.target === player) return;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
}
function pointerMove(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id || props.busy) return;
  const x = event.clientX - pointer.x;
  const y = event.clientY - pointer.y;
  if (!dragging.value && Math.abs(y) > 8 && Math.abs(y) > Math.abs(x)) { resetDrag(); return; }
  if (!dragging.value && Math.abs(x) > 8 && Math.abs(x) > Math.abs(y) * 1.2) {
    dragging.value = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }
  if (dragging.value) { drag.value = x; event.preventDefault(); }
}
function pointerUp(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id) return;
  const width = (event.currentTarget as HTMLElement).getBoundingClientRect().width;
  const accepted = dragging.value && Math.abs(drag.value) >= Math.min(84, width * 0.24);
  const liked = drag.value > 0;
  resetDrag();
  if (accepted) emit('vote', liked);
}
function lostCapture(event: PointerEvent) {
  // Touch implicitly captures the original child. Moving capture to the card
  // fires a bubbling loss on that child; it must not cancel the card's drag.
  if (event.target === event.currentTarget) resetDrag();
}
async function play() {
  if (!media.value) return;
  try { await media.value.play(); playing.value = true; }
  catch { mediaFailed.value = true; }
}
async function reloadMedia() {
  mediaFailed.value = false;
  playing.value = false;
  await nextTick();
  media.value?.load();
}
function animationEnd(event: AnimationEvent) {
  if (event.target === event.currentTarget && props.swipe) emit('settled');
}
</script>

<template>
  <div class="video-card-viewport">
    <article class="video-swipe-card" :class="[swipe && `swipe-${swipe}`, { 'is-dragging': dragging }]" :style="movement"
      :aria-label="video?.title ?? 'Видео скоро появится'" @pointerdown="pointerDown" @pointermove="pointerMove"
      @pointerup="pointerUp" @pointercancel="resetDrag" @lostpointercapture="lostCapture" @animationend="animationEnd">
      <div class="video-portrait">
        <video v-if="video && !mediaFailed" :key="video.id" ref="media" :src="video.videoUrl" :poster="video.posterUrl"
          :controls="playing" playsinline preload="metadata" :aria-label="video.title" @play="playing = true" @error="mediaFailed = true" />
        <div v-if="!playing || mediaFailed || !video" class="video-placeholder" :class="{ 'has-poster': video?.posterUrl && !mediaFailed }">
          <template v-if="mediaFailed">
            <p role="status">Видео не удалось загрузить.</p>
            <button class="video-reload" type="button" @click="reloadMedia">Попробовать ещё раз</button>
          </template>
          <template v-else>
            <button v-if="video" class="video-play" type="button" :aria-label="`Смотреть: ${video.title}`" @click="play">
              <img :src="playIcon" alt="" width="72" height="72" draggable="false" />
            </button>
            <img v-else :src="playIcon" alt="" width="72" height="72" draggable="false" />
            <p v-if="!video">Здесь будет видео</p>
          </template>
        </div>
        <span v-if="dragging" class="video-choice-stamp" :class="{ 'is-like': drag > 0 }" aria-hidden="true">{{ drag > 0 ? 'Понравилось ❤' : 'Пропустить' }}</span>
      </div>
      <h2 class="video-card-title">{{ video?.title ?? 'Ролик №1' }}</h2>
      <p v-if="video?.author" class="video-card-author">{{ video.author }}</p>
      <p v-if="video?.description || !video" class="video-card-description">{{ video?.description ?? 'Видео участников «Мастерской контента» скоро появятся здесь.' }}</p>
    </article>
  </div>
</template>

<style scoped>
.video-card-viewport { min-width: 0; overflow: hidden; margin-inline: -8px; padding-inline: 8px; }
.video-swipe-card { touch-action: pan-y; transform: translateX(var(--drag-x)) rotate(var(--drag-rotation)); transition: transform 180ms ease; transform-origin: 50% 75%; user-select: none; }
.video-swipe-card.is-dragging { transition: none; cursor: grabbing; }
.video-portrait { position: relative; width: calc(100% - 2px); aspect-ratio: 311 / 468; margin-inline: 1px; overflow: hidden; border-radius: 16px; background: url('../assets/dec-22/placeholder.svg') center / cover no-repeat; }
.video-portrait video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.video-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; padding: 16px; color: #fff0c4; text-align: center; }
.video-placeholder:not(.has-poster) { background: url('../assets/dec-22/placeholder.svg') center / cover no-repeat; }
.video-placeholder:not(.has-poster) > :first-child { margin-top: -12px; }
.video-placeholder.has-poster { background: #31130e30; }
.video-placeholder p { font-size: 14px; line-height: 17px; }
.video-play { display: grid; place-items: center; width: 72px; height: 72px; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; }
.video-play img { display: block; }
.video-reload { min-height: 44px; padding: 8px 12px; border: 1px solid #ffe6bc; border-radius: 10px; background: #31130e; color: #fff0c4; font: inherit; cursor: pointer; }
.video-portrait button:focus-visible { outline: 2px solid #ffe6bc; outline-offset: 3px; }
.video-card-title { margin: 27px 0 0; color: var(--dec-ink); font: 400 20px/25px 'Advent STIX', serif; }
.video-card-author, .video-card-description { margin-top: 8px; color: #70492c; font-size: 12px; line-height: 16px; white-space: pre-line; overflow-wrap: anywhere; }
.video-card-author { font-weight: 600; }
.video-card-description { min-height: 39px; margin-top: 11px; }
.video-choice-stamp { position: absolute; top: 24px; right: 16px; padding: 8px; border: 2px solid #ffe6bc; border-radius: 8px; background: #623c28d9; color: #fff0d2; font-size: 14px; font-weight: 700; transform: rotate(9deg); }
.video-choice-stamp.is-like { right: auto; left: 16px; transform: rotate(-9deg); }
.swipe-right { animation: video-swipe-right 400ms ease-in forwards; }
.swipe-left { animation: video-swipe-left 400ms ease-in forwards; }
@keyframes video-swipe-right { to { transform: translateX(120%) rotate(14deg); opacity: 0; } }
@keyframes video-swipe-left { to { transform: translateX(-120%) rotate(-14deg); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .video-swipe-card { transition: none; } .swipe-right, .swipe-left { animation-duration: 1ms; } }
</style>
