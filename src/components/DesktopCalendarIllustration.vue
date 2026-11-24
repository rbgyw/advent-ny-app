<script setup lang="ts">
import house from '../assets/calendar/desktop/house.svg';
import normal from '../assets/calendar/desktop/window.svg';
import required from '../assets/calendar/desktop/window-required.svg';
import tall from '../assets/calendar/desktop/window-tall.svg';
import tallRequired from '../assets/calendar/desktop/window-tall-required.svg';
import bow from '../assets/calendar/40962ceb-81dc-4a6b-877f-8504f8ce54f6.webp';
import { calendarDesktopWindowBounds, isMandatoryCalendarDay } from '../utils/calendar';
defineProps<{ availableDays: number[] }>();
const days = Array.from({ length: 24 }, (_, i) => i + 1);
</script>

<template>
  <div class="calendar-illustration calendar-desktop-illustration" aria-hidden="true">
    <img class="desktop-house" :src="house" alt="" width="524" height="627" />
    <div v-for="day in days" :key="day" class="desktop-window" :data-name="`window-${day}`" :data-mandatory="isMandatoryCalendarDay(day)" :class="{ 'is-locked': !availableDays.includes(day) }" :style="calendarDesktopWindowBounds(day)">
      <img :src="day > 20 ? (isMandatoryCalendarDay(day) ? tallRequired : tall) : (isMandatoryCalendarDay(day) ? required : normal)" :data-name="isMandatoryCalendarDay(day) ? 'window-ornament' : undefined" alt="" />
      <p>{{ day }}</p>
      <span v-if="!availableDays.includes(day)" class="desktop-window-shade" />
    </div>
    <img class="desktop-house-bow" :src="bow" alt="" width="134" height="134" />
    <svg v-if="!availableDays.includes(25)" class="desktop-door-shade" viewBox="0 0 524 627" width="524" height="627">
      <path d="M220.071 591.851V503.853C220.071 485.724 239.531 471.027 263.536 471.027C287.542 471.027 307.002 485.724 307.002 503.853V591.851Z" />
    </svg>
  </div>
</template>

<style scoped>
.calendar-desktop-illustration { position:absolute; inset:0; pointer-events:none; }
.desktop-house { position:absolute; left:454px; top:162px; }
.desktop-house-bow { position:absolute; left:649.56px; top:216.39px; }
.desktop-window { position:absolute; }
.desktop-window > img { position:absolute; inset:-.5px; width:calc(100% + 1px); height:calc(100% + 1px); }
.desktop-window p { position:absolute; left:0; right:0; top:18px; margin:0; color:#a7280b; text-align:center; font:400 37px/1 'Rozha One',serif; }
.desktop-window[data-name='window-21'] p,.desktop-window[data-name='window-22'] p,.desktop-window[data-name='window-23'] p,.desktop-window[data-name='window-24'] p { top:30px; }
.desktop-window[data-mandatory=true] p { color:#fff8e1; }
.desktop-window.is-locked { filter: grayscale(1); }
.desktop-window-shade { position:absolute; inset:4px; border-radius:40px 40px 0 0; background:#7779; }
.desktop-door-shade { position:absolute; left:454px; top:162px; fill:#7779; }
</style>
