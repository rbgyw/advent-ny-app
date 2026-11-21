<script setup lang="ts">
import house from '../assets/calendar/desktop/house.svg';
import normal from '../assets/calendar/desktop/window.svg';
import required from '../assets/calendar/desktop/window-required.svg';
import tall from '../assets/calendar/desktop/window-tall.svg';
import tallRequired from '../assets/calendar/desktop/window-tall-required.svg';
import bow from '../assets/calendar/40962ceb-81dc-4a6b-877f-8504f8ce54f6.webp';
import title from '../assets/calendar/desktop/title.svg';
import { calendarDesktopWindowBounds, isMandatoryCalendarDay } from '../utils/calendar';
defineProps<{ availableDays: number[] }>();
const days = Array.from({ length: 24 }, (_, i) => i + 1);
</script>

<template>
  <div class="calendar-illustration calendar-desktop-illustration" aria-hidden="true">
    <img class="desktop-calendar-title" :src="title" alt="" width="624" height="89" />
    <img class="desktop-house" :src="house" alt="" width="524" height="627" />
    <div v-for="day in days" :key="day" class="desktop-window" :data-name="`window-${day}`" :data-mandatory="isMandatoryCalendarDay(day)" :style="calendarDesktopWindowBounds(day)">
      <img :src="day > 20 ? (isMandatoryCalendarDay(day) ? tallRequired : tall) : (isMandatoryCalendarDay(day) ? required : normal)" :data-name="isMandatoryCalendarDay(day) ? 'window-ornament' : undefined" alt="" />
      <p>{{ day }}</p>
      <span v-if="!availableDays.includes(day)" class="desktop-window-shade" />
    </div>
    <img class="desktop-house-bow" :src="bow" alt="" width="134" height="134" />
    <span v-if="!availableDays.includes(25)" class="desktop-door-shade" :style="calendarDesktopWindowBounds(25)" />
  </div>
</template>

<style scoped>
.calendar-desktop-illustration { position:absolute; inset:0; pointer-events:none; }
.desktop-calendar-title { position:absolute; width:clamp(490px, 43.33vw, 624px); height:auto; left:50%; transform:translateX(-50%); top:calc(28px - var(--calendar-headroom, 0px) / var(--design-scale)); }
.desktop-house { position:absolute; left:454px; top:162px; }
.desktop-house-bow { position:absolute; left:649.56px; top:216.39px; }
.desktop-window { position:absolute; }
.desktop-window > img { position:absolute; inset:-.5px; width:calc(100% + 1px); height:calc(100% + 1px); }
.desktop-window p { position:absolute; left:0; right:0; top:18px; margin:0; color:#a7280b; text-align:center; font:400 37px/1 'Rozha One',serif; }
.desktop-window[data-name='window-21'] p,.desktop-window[data-name='window-22'] p,.desktop-window[data-name='window-23'] p,.desktop-window[data-name='window-24'] p { top:30px; }
.desktop-window[data-mandatory=true] p { color:#fff8e1; }
.desktop-window-shade,.desktop-door-shade { position:absolute; inset:4px; border-radius:40px 40px 0 0; background:#23170b99; }
</style>
