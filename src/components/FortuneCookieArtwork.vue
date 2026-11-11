<script setup lang="ts">
import closedCookie from '../assets/fortune/closed.svg';
import openCookie from '../assets/fortune/opened.svg';
import leftBack from '../assets/fortune/left-back.svg';
import leftSeam from '../assets/fortune/left-seam.svg';
import leftFront from '../assets/fortune/left-front.svg';
import rightBack from '../assets/fortune/right-back.svg';
import rightSeam from '../assets/fortune/right-seam.svg';
import rightFront from '../assets/fortune/right-front.svg';
import ribbon from '../assets/fortune/ribbon.svg';
import notches from '../assets/fortune/notches.svg';
import highlights from '../assets/fortune/highlights.svg';

defineProps<{ stage: 'closed' | 'opening' | 'open' }>();
const emit = defineEmits<{ reveal: [] }>();

// Positions are relative to the original 307 × 172 px artwork, including exported strokes.
const halves = [
  {
    side: 'left',
    direction: -1,
    layers: [
      [leftBack, 14.19, 13.38, 109.842],
      [leftSeam, 74.56, 17.25, 42.7501],
      [leftFront, 14.19, 13.38, 105.045],
    ],
  },
  {
    side: 'right',
    direction: 1,
    layers: [
      [rightBack, 182.97, 13.38, 109.842],
      [rightSeam, 189.69, 17.25, 42.7501],
      [rightFront, 187.76, 13.38, 105.045],
    ],
  },
] as const;

const details = [
  [notches, 38.54, 107.40, 230.873],
  [highlights, 45.26, 29.26, 216.482],
] as const;

const crumbs = [
  [-48, -29, 4], [-36, -42, 3], [-21, -19, 5], [-7, -48, 3],
  [15, -37, 4], [33, -24, 5], [49, -34, 3], [42, 10, 4],
] as const;

function placement(left: number, top: number, width: number) {
  return { left: `${left / 307 * 100}%`, top: `${top / 172 * 100}%`, width: `${width / 307 * 100}%` };
}
</script>

<template>
  <div class="fortune-art" aria-hidden="true">
    <img v-if="stage === 'closed'" class="fortune-cookie-closed" :src="closedCookie" alt="" />
    <template v-else-if="stage === 'opening'">
      <img class="fortune-cookie-shadow" :src="openCookie" alt="" />
      <img
        class="fortune-ribbon"
        :src="ribbon"
        :style="placement(94.978, 58.022, 117.044)"
        alt=""
        @animationend.self="emit('reveal')"
        @animationcancel.self="emit('reveal')"
      />
      <div
        v-for="{ side, direction, layers } in halves"
        :key="side"
        class="fortune-half"
        :class="`fortune-half--${side}`"
        :style="{ '--direction': direction }"
      >
        <img v-for="[src, x, y, width] in layers" :key="src" :src="src" :style="placement(x, y, width)" alt="" />
        <img
          v-for="[src, x, y, width] in details"
          :key="src"
          class="fortune-half-detail"
          :src="src"
          :style="placement(x, y, width)"
          alt=""
        />
      </div>
      <div class="fortune-cookie-crack">
        <img class="fortune-fragment-left" :src="closedCookie" alt="" />
        <img class="fortune-fragment-right" :src="closedCookie" alt="" />
      </div>
      <span
        v-for="[x, y, size] in crumbs"
        :key="x"
        class="fortune-crumb"
        :style="{ '--crumb-x': `${x}px`, '--crumb-y': `${y}px`, '--crumb-size': `${size}px` }"
      ></span>
    </template>
    <img v-show="stage === 'open'" class="fortune-cookie-open" :src="openCookie" alt="" />
  </div>
</template>

<style scoped>
.fortune-art {
  --break-duration: 780ms;
  position: relative;
  width: 100%;
  aspect-ratio: 307 / 172;
  pointer-events: none;
}

.fortune-art img { position: absolute; display: block; height: auto; }
.fortune-cookie-closed, .fortune-cookie-crack { top: 0; left: 9.446%; width: 73.616%; }
.fortune-cookie-open, .fortune-cookie-shadow { inset: 0 auto auto 0; width: 100%; }
.fortune-cookie-shadow { clip-path: inset(79% 0 0); animation: fortune-shadow var(--break-duration) linear both; }

.fortune-cookie-crack {
  position: absolute;
  z-index: 2;
  animation: fortune-press var(--break-duration) ease-in-out both;
}

.fortune-cookie-crack img { width: 100%; }
.fortune-fragment-left {
  --direction: -1;
  clip-path: polygon(0 0, 53% 0, 51% 30%, 55% 39%, 49% 49%, 53% 59%, 48% 70%, 51% 80%, 47% 100%, 0 100%);
}
.fortune-fragment-right {
  --direction: 1;
  clip-path: polygon(53% 0, 100% 0, 100% 100%, 47% 100%, 51% 80%, 48% 70%, 53% 59%, 49% 49%, 55% 39%, 51% 30%);
}
.fortune-fragment-left, .fortune-fragment-right { animation: fortune-crack var(--break-duration) ease-out both; }

.fortune-half { position: absolute; inset: 0; z-index: 1; animation: fortune-split var(--break-duration) ease-out both; }
.fortune-half--left { transform-origin: 24% 53%; }
.fortune-half--right { transform-origin: 76% 53%; }
.fortune-half--left .fortune-half-detail { clip-path: inset(0 50% 0 0); }
.fortune-half--right .fortune-half-detail { clip-path: inset(0 0 0 50%); }
.fortune-ribbon { transform-origin: center; animation: fortune-unroll var(--break-duration) ease-out both; }

.fortune-crumb {
  position: absolute;
  z-index: 3;
  top: 49%;
  left: 49%;
  width: var(--crumb-size);
  height: var(--crumb-size);
  border-radius: 35% 55% 30% 45%;
  background: #f6c571;
  animation: fortune-crumb var(--break-duration) ease-out both;
}

@keyframes fortune-press {
  0%, 29%, 100% { transform: none; }
  11% { transform: translateY(-3px) rotate(-4deg) scaleX(.96); }
  21% { transform: rotate(3deg) scaleY(1.04); }
}

@keyframes fortune-crack {
  0%, 29% { opacity: 1; transform: none; }
  41% { opacity: 1; transform: translate(calc(var(--direction) * 10%), -7px) rotate(calc(var(--direction) * 11deg)); }
  52%, 100% { opacity: 0; transform: translate(calc(var(--direction) * 22%), 8px) rotate(calc(var(--direction) * 19deg)); }
}

@keyframes fortune-split {
  0%, 42% { opacity: 0; transform: translate(calc(var(--direction) * -13%), 4px) rotate(calc(var(--direction) * -14deg)); }
  48% { opacity: .44; }
  60% { opacity: 1; transform: translate(calc(var(--direction) * 2%), -6px) rotate(calc(var(--direction) * 5deg)); }
  82% { opacity: 1; transform: translateY(2px) rotate(calc(var(--direction) * -2deg)); }
  100% { opacity: 1; transform: none; }
}

@keyframes fortune-unroll {
  0%, 39% { opacity: 0; transform: translateY(8px) rotate(-8deg) scale(.08, .36); }
  61% { opacity: 1; transform: translateY(-4px) rotate(2deg) scale(.83, .89); }
  84% { opacity: 1; transform: rotate(-1deg) scale(1.02); }
  100% { opacity: 1; transform: none; }
}

@keyframes fortune-shadow {
  0%, 33% { opacity: 0; }
  69%, 100% { opacity: 1; }
}

@keyframes fortune-crumb {
  0%, 30% { opacity: 0; transform: none; }
  37% { opacity: .9; }
  63% { opacity: .75; transform: translate(var(--crumb-x), var(--crumb-y)) rotate(110deg); }
  100% { opacity: 0; transform: translate(calc(var(--crumb-x) * 1.25), calc(var(--crumb-y) + 34px)) rotate(200deg); }
}

@media (prefers-reduced-motion: reduce) {
  .fortune-art { --break-duration: 1ms; }
}
</style>
