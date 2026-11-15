<script setup lang="ts">
import { computed } from 'vue';
import wordmark from '../assets/first-task/wordmark.svg';
import wreath from '../assets/sports/wreath.svg';
import { shortCalendarDate } from '../utils/calendar';
import { formatDate } from '../utils/date';
import type { CalendarTask } from '../types/models';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  assignment?: CalendarTask;
  day: number;
  total: number;
  loading: boolean;
  error: string | null;
  title: string;
  taskNumber: number;
  mandatory?: boolean;
}>();
const emit = defineEmits<{ back: []; retry: [] }>();
const date = computed(() => props.assignment
  ? shortCalendarDate(props.assignment.available_date).toLocaleUpperCase('ru-RU')
  : `${props.taskNumber} ДЕКАБРЯ`);
</script>

<template>
  <main class="december-page" :class="{ 'december-mandatory': mandatory }">
    <div class="december-layout">
      <header class="december-header">
        <img :src="wordmark" width="108" height="13" alt="ГЕРОФАРМ" />
        <button class="december-back" type="button" @click="emit('back')">← К календарю</button>
      </header>
      <article class="december-card" aria-labelledby="december-title">
        <img v-if="mandatory" class="december-wreath" :src="wreath" alt="" />
        <p class="december-date">{{ date }}</p>
        <h1 id="december-title">{{ title }}</h1>
        <p v-if="mandatory" class="december-badge">Обязательное задание</p>
        <div class="december-content">
          <p v-if="loading" role="status">Загружаем задание…</p>
          <div v-else-if="error" class="december-stack">
            <p role="alert">{{ error }}</p>
            <button class="december-button" type="button" @click="emit('retry')">Попробовать ещё раз</button>
          </div>
          <p v-else-if="!assignment" role="status">Задание не найдено.</p>
          <p v-else-if="!assignment.task" role="status">Задание пока закрыто. Откроется {{ formatDate(assignment.available_date) }}.</p>
          <slot v-else />
        </div>
      </article>
      <footer>{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
  </main>
</template>

<style>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.ttf') format('truetype'); font-weight: 400 700; font-display: swap; }

#app:has(.december-page) { width: 100%; border: 0; }
.december-page {
  --dec-red: #a7280b;
  --dec-ink: #623c28;
  --dec-body: #836045;
  --dec-border: #dcc8a8;
  --dec-paper: #fcf6e8;
  --dec-gold: linear-gradient(90deg, #e8b77e, #ffe6bc 19.23%, #fff0d2 73.08%, #efc087);
  width: 100%;
  min-height: 100svh;
  background: radial-gradient(ellipse 165% 108% at 30% 100%, #ffb451, #f78028 54%, #c63d0f 100%);
  color: var(--dec-body);
  color-scheme: light;
  font: 400 14px/20px 'Advent Inter', sans-serif;
  letter-spacing: 0;
  text-align: left;
}
.december-mandatory { background: linear-gradient(to bottom right, #090807, #291209 22%, #743012 48%, #cf5515 73%, #ff941f); color: #70492c; }
.december-layout { max-width: 680px; margin-inline: auto; padding: 0 16px 24px; }
.december-header { padding: 34px 8px 0; }
.december-header img { display: block; margin-inline: auto; }
.december-back { min-height: 47px; padding: 0; border: 0; background: transparent; color: #fff1cf; font: 400 12px/15px 'Advent Inter', sans-serif; cursor: pointer; }
.december-card { position: relative; border-radius: 24px; padding: 29px clamp(16px, 6.1vw, 24px) 28px; background: #fff5e3; overflow-wrap: anywhere; }
.december-mandatory .december-card { background: var(--dec-gold); }
.december-mandatory .december-card::before {
  --dot: radial-gradient(circle closest-side, var(--dec-red) 66%, transparent 90%);
  position: absolute;
  inset: 4px;
  border-radius: 19px;
  background: var(--dot) center top / 11px 4px round no-repeat,
    var(--dot) center bottom / 11px 4px round no-repeat,
    var(--dot) left center / 4px 11px no-repeat round,
    var(--dot) right center / 4px 11px no-repeat round;
  content: '';
  pointer-events: none;
}
.december-wreath { position: absolute; right: 25px; top: 25px; }
.december-date { margin-bottom: 12px; color: var(--dec-red); font-size: 12px; font-weight: 700; line-height: 15px; }
.december-page h1, .december-page h2 { margin: 0; color: var(--dec-ink); font: 500 28px/30px 'Advent STIX', serif; letter-spacing: 0; }
.december-page h2 { font-size: 21px; line-height: 25px; }
.december-mandatory h1 { padding-right: 16px; }
.december-badge { display: inline-block; margin-top: 12px; padding: 5px 8px; border-radius: 5px; background: var(--dec-red); color: #fff0d2; font-size: 11px; line-height: 15px; }
.december-content { margin-top: 24px; }
.december-layout > footer { margin-top: 27px; color: var(--dec-ink); font-size: 12px; text-align: center; }
.december-mandatory footer { color: #fff1cf; }
.december-stack { display: grid; min-width: 0; gap: 16px; }
.december-copy { display: grid; gap: 20px; }
.december-button { box-sizing: border-box; width: 100%; min-height: 52px; padding: 8px 14px; border: 1px solid var(--dec-red); border-radius: 13px; background: var(--dec-red); color: #fff0d2; font: 700 14px/18px 'Advent Inter', sans-serif; cursor: pointer; }
.december-button.secondary { background: var(--dec-paper); color: var(--dec-red); }
.december-button:disabled { opacity: .55; cursor: default; }
.december-link { min-height: 36px; padding: 0; border: 0; background: transparent; color: var(--dec-red); text-align: left; font: inherit; cursor: pointer; }
.december-panel { min-width: 0; padding: 16px; border: 1px solid var(--dec-border); border-radius: 15px; background: var(--dec-paper); }
.december-error { color: var(--dec-red); }
.december-field { display: grid; gap: 8px; color: var(--dec-ink); font-weight: 700; }
.december-field input, .december-field textarea { box-sizing: border-box; width: 100%; min-width: 0; padding: 13px 14px; border: 1px solid var(--dec-border); border-radius: 13px; background: var(--dec-paper); color: var(--dec-ink); font: 400 16px/21px 'Advent Inter', sans-serif; }
.december-field [aria-invalid="true"] { border-color: var(--dec-red); }
.december-page :focus-visible { outline: 2px solid var(--dec-ink); outline-offset: 2px; }
.december-dialog { box-sizing: border-box; width: min(355px, calc(100% - 24px)); max-height: calc(100% - 28px); padding: 24px; border: 1px solid var(--dec-border); border-radius: 20px; background: #fff5e3; color: var(--dec-ink); }
.december-dialog:not([open]) { display: none; }
.december-dialog::backdrop { background: rgb(66 35 19 / 55%); }
.december-dialog h2 { padding-right: 24px; }
.december-dialog-close { position: absolute; top: 5px; right: 7px; width: 42px; height: 42px; border: 0; background: transparent; color: var(--dec-red); font-size: 24px; cursor: pointer; }
@media (min-width: 700px) { .december-card { padding-inline: 32px; } }
</style>
