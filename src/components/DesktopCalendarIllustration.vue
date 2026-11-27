<script setup lang="ts">
import house from '../assets/calendar/desktop/house.svg';
import foreground from '../assets/calendar/desktop/house-foreground.svg';
import normal from '../assets/calendar/desktop/window.svg';
import required from '../assets/calendar/desktop/window-required.svg';
import tall from '../assets/calendar/desktop/window-tall.svg';
import tallRequired from '../assets/calendar/desktop/window-tall-required.svg';
import bow from '../assets/calendar/40962ceb-81dc-4a6b-877f-8504f8ce54f6.webp';
import { calendarDesktopWindowBounds, isMandatoryCalendarDay } from '../utils/calendar';
defineProps<{ availableDays: number[] }>();
// Match each mask to the exact glass contour in its source SVG, including the
// different arch and sill geometry of mandatory and ground-floor windows.
const windowArt = [
  { image: normal, viewBox: '0 0 76 68', glass: 'M4.56665 62.1195V32.9273C4.56665 25.4032 8.03943 18.1872 14.221 12.8668C20.4026 7.54644 28.7866 4.5575 37.5287 4.5575C46.2708 4.5575 54.6549 7.54644 60.8364 12.8668C67.018 18.1872 70.4908 25.4032 70.4908 32.9273V62.1195H4.56665Z' },
  { image: required, viewBox: '0 0 76 68', glass: 'M4.59912 62.604V33.1825C4.59912 25.5992 8.09919 18.3265 14.3294 12.9643C20.5595 7.60215 29.0094 4.58972 37.8202 4.58972C46.631 4.58972 55.0809 7.60215 61.3111 12.9643C67.5412 18.3265 71.0413 25.5992 71.0413 33.1825V62.604H4.59912Z' },
  { image: tall, viewBox: '0 0 76 87', glass: 'M4.66431 81.1425V33.0079C4.66431 25.4878 8.13454 18.2762 14.3118 12.9596C20.4889 7.64202 28.8669 4.65576 37.6028 4.65576C46.3386 4.65576 54.7166 7.64202 60.8942 12.9596C67.071 18.2762 70.5418 25.4878 70.5418 33.0079V81.1425H4.66431Z' },
  { image: tallRequired, viewBox: '0 0 76 87', glass: 'M4.66382 81.1425V33.0079C4.66382 25.4878 8.13459 18.2762 14.3114 12.9596C20.4893 7.64202 28.8673 4.65576 37.6033 4.65576C46.3384 4.65576 54.7164 7.64202 60.8942 12.9596C67.0711 18.2762 70.5418 25.4878 70.5418 33.0079V81.1425H4.66382Z' },
];
const windows = Array.from({ length: 24 }, (_, i) => {
  const day = i + 1;
  return { day, art: windowArt[(day > 20 ? 2 : 0) + (isMandatoryCalendarDay(day) ? 1 : 0)]! };
});
</script>

<template>
  <div class="calendar-illustration calendar-desktop-illustration" aria-hidden="true">
    <img class="desktop-house" :src="house" alt="" width="524" height="627" />
    <div v-for="{ day, art } in windows" :key="day" class="desktop-window" :data-name="`window-${day}`" :data-mandatory="isMandatoryCalendarDay(day)" :class="{ 'is-locked': !availableDays.includes(day) }" :style="calendarDesktopWindowBounds(day)">
      <img :src="art.image" :data-name="isMandatoryCalendarDay(day) ? 'window-ornament' : undefined" alt="" />
      <p>{{ day }}</p>
      <svg v-if="!availableDays.includes(day)" class="desktop-window-shade" :viewBox="art.viewBox"><path :d="art.glass" /></svg>
    </div>
    <svg v-if="!availableDays.includes(25)" class="desktop-door-shade" viewBox="0 0 524 627" width="524" height="627">
      <path d="M220.071 591.851V503.853C220.071 485.724 239.531 471.027 263.536 471.027C287.542 471.027 307.002 485.724 307.002 503.853V591.851Z" />
    </svg>
    <img class="desktop-house-foreground" :src="foreground" alt="" width="524" height="627" />
    <img class="desktop-house-bow" :src="bow" alt="" width="134" height="134" />
  </div>
</template>

<style scoped>
.calendar-desktop-illustration { position:absolute; inset:0; pointer-events:none; }
.desktop-house, .desktop-house-foreground { position:absolute; left:454px; top:162px; }
.desktop-house-bow { position:absolute; left:649.56px; top:216.39px; }
.desktop-window { position:absolute; }
.desktop-window > img, .desktop-window-shade { position:absolute; inset:-.5px; width:calc(100% + 1px); height:calc(100% + 1px); }
.desktop-window p { position:absolute; left:0; right:0; top:18px; margin:0; color:#a7280b; text-align:center; font:400 37px/1 'Rozha One',serif; }
.desktop-window[data-name='window-21'] p,.desktop-window[data-name='window-22'] p,.desktop-window[data-name='window-23'] p,.desktop-window[data-name='window-24'] p { top:30px; }
.desktop-window[data-mandatory=true] p { color:#fff8e1; }
.desktop-window-shade { fill:rgb(82 42 22 / .6); }
.desktop-door-shade { position:absolute; left:454px; top:162px; fill:rgb(82 42 22 / .6); }
</style>
