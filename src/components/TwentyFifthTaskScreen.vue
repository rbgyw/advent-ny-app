<script setup lang="ts">
import TaskContainer from './ui/TaskContainer.vue';
import CalendarReturnButton from './ui/CalendarReturnButton.vue';
import TaskDateLabel from './ui/TaskDateLabel.vue';
import AppButton from './ui/AppButton.vue';
import TaskLayout from './ui/TaskLayout.vue';
import AppHeader from './ui/AppHeader.vue';
import AppCard from './ui/AppCard.vue';
import LoadingState from './ui/LoadingState.vue';
import { computed, nextTick, ref, watch } from 'vue';
import type { CalendarTask } from '../types/models';
import { fortuneSky } from '../content/fortune-sky';
import { fortuneHeading, fortunes } from '../content/fortunes';
import { formatDate } from '../utils/date';
import { downloadFortuneCard } from '../utils/fortune-card';
import { isFortuneIndex } from '../utils/fortune';
import FortuneCookieArtwork from './FortuneCookieArtwork.vue';
import wordmark from '../assets/wish/wordmark.svg';

const props = defineProps<{
  assignment?: CalendarTask;
  day: number;
  total: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
}>();
const emit = defineEmits<{
  back: [];
  retry: [];
  complete: [fortuneIndex: number];
  edit: [];
}>();

const fortuneIndex = computed<number | null>(() => {
  if (props.assignment?.status !== 'completed') {
    return null;
  }

  const value = props.assignment.response?.response.fortune_index;
  return isFortuneIndex(value) ? value : null;
});

// Keep only the pending choice in memory. The displayed fortune always comes from Supabase.
const pendingIndex = ref<number | null>(null);
const requesting = ref(false);
const opening = ref(false);
const animateCard = ref(false);
const exporting = ref(false);
const actionMessage = ref('');
const result = ref<HTMLElement>();
const resultHeading = ref<HTMLElement>();

const completed = computed(() => props.assignment?.status === 'completed');
const fortune = computed(() =>
  fortuneIndex.value === null ? null : fortunes[fortuneIndex.value]
);
const stage = computed(() => opening.value ? 'opening' : fortune.value ? 'open' : 'closed');
const assignmentKey = computed(() => {
  const assignment = props.assignment;
  return assignment ? `${assignment.user_id}:${assignment.id}:${assignment.task_id}` : null;
});
const ready = computed(() => Boolean(props.assignment?.task) && !props.loading && !props.error);
const openingBusy = computed(() => opening.value || props.saving || requesting.value);

watch(assignmentKey, () => {
  pendingIndex.value = null;
  requesting.value = false;
  opening.value = false;
  animateCard.value = false;
  actionMessage.value = '';
});

watch([fortuneIndex, () => props.saving, () => props.saveError], ([index, saving, error]) => {
  if (!requesting.value) return;
  if (index !== null) {
    requesting.value = false;
    pendingIndex.value = null;
    animateCard.value = !reducedMotion();
    opening.value = animateCard.value;
    if (!opening.value) void showFortune();
  } else if (!saving || error) {
    requesting.value = false;
  }
});

// Finish even if the browser drops the CSS animation event.
watch(opening, (active, _, onCleanup) => {
  if (!active) return;
  const timeout = window.setTimeout(reveal, 1200);
  onCleanup(() => window.clearTimeout(timeout));
});

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function showFortune() {
  const key = assignmentKey.value;
  await nextTick();
  if (key !== assignmentKey.value || !result.value) return;
  result.value.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'instant' : 'smooth' });
  resultHeading.value?.focus({ preventScroll: true });
}

function openCookie() {
  if (
    !ready.value ||
    props.saving ||
    requesting.value ||
    completed.value ||
    stage.value !== 'closed'
  ) return;

  pendingIndex.value ??= Math.floor(Math.random() * fortunes.length);
  requesting.value = true;
  emit('edit');
  emit('complete', pendingIndex.value);
}

function reveal() {
  if (!opening.value) return;
  opening.value = false;
  void showFortune();
}

async function saveCard() {
  if (!fortune.value || exporting.value) return;
  exporting.value = true;
  actionMessage.value = '';
  try {
    await downloadFortuneCard(fortune.value);
  } catch {
    actionMessage.value = 'Не удалось скачать пожелание. Попробуйте ещё раз.';
  } finally {
    exporting.value = false;
  }
}

</script>

<template>
  <TaskLayout class="fortune-page" :data-stage="stage">
    <div class="fortune-sky" aria-hidden="true">
      <img v-for="(shape, index) in fortuneSky" :key="index" :src="shape.src" :style="{ left: shape.left, top: shape.top }" alt="" />
    </div>
    <TaskContainer class="fortune-layout">
      <AppHeader class="fortune-header">
        <img :src="wordmark" alt="ГЕРОФАРМ" width="108" height="13" />
        <CalendarReturnButton @click="emit('back')" placement="header" />
      </AppHeader>
      <AppCard class="fortune-panel" aria-labelledby="fortune-title">
        <TaskDateLabel class="fortune-date" :available-date="assignment?.available_date" :day="day" />
        <h1 id="fortune-title">Печенье на счастье</h1>
        <LoadingState v-if="loading" class="fortune-notice" role="status" />
        <div v-else-if="error" class="fortune-notice" role="alert">
          <p>{{ error }}</p>
          <AppButton class="fortune-action" type="button" @click="emit('retry')">Попробовать снова</AppButton>
        </div>
        <p v-else-if="!assignment" class="fortune-notice">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="fortune-notice">
          Задание откроется {{ formatDate(assignment.available_date) }}.
        </p>
        <div v-else-if="completed && fortuneIndex === null" class="fortune-notice" role="alert">
          <p>Не удалось загрузить сохранённое пожелание. Попробуйте обновить задание.</p>
          <AppButton class="fortune-action" type="button" @click="emit('retry')">Обновить задание</AppButton>
        </div>
        <template v-else>
          <div class="fortune-copy">
            <p>Кажется, совсем недавно открылось первое задание — а сегодня уже последнее окошко новогоднего адвента.</p>
            <p>За эти недели вы разгадывали головоломки, делились воспоминаниями, рекомендовали любимые фильмы, благодарили коллег и участвовали в спортивных заданиях. Спасибо каждому, кто присоединился! Благодаря вашим фотографиям, историям и рекомендациям этот календарь получился именно о сотрудниках ГЕРОФАРМ.</p>
            <p>Завершает адвент печенье с предсказанием. По традиции внутри такого печенья спрятана записка — с пожеланием или напутствием. Сегодня свое послание на 2027 год можете получить и вы.</p>
            <p>Нажмите на печенье, чтобы разломить его и прочитать записку.</p>
            <p>Послание можно скачать, поделиться им в истории в социальных сетях или сохранить до следующего декабря — чтобы через год проверить, что сбылось.</p>
            <p>С наступающим Новым годом, коллеги!</p>
          </div>
          <div class="fortune-artwork">
            <FortuneCookieArtwork :stage="stage" @reveal="reveal" />
            <AppButton
              v-if="stage === 'closed'"
              class="fortune-cookie-hit"
              type="button"
              aria-label="Разломить печенье"
              :disabled="saving || requesting"
              @click="openCookie"
            ></AppButton>
          </div>
          <AppButton
            v-if="stage !== 'open'"
            class="fortune-action fortune-open-button"
            type="button"
            :disabled="openingBusy"
            @click="openCookie"
          >
            <span aria-hidden="true">✦</span>
            {{ openingBusy ? 'Открываем печеньку…' : saveError ? 'Попробовать снова' : 'Открыть печеньку' }}
            <span aria-hidden="true">✦</span>
          </AppButton>
          <div v-else-if="fortune" ref="result" class="fortune-result" :class="{ 'is-revealing': animateCard }">
            <section class="fortune-card" aria-labelledby="fortune-result-title">
              <h2 id="fortune-result-title" ref="resultHeading" tabindex="-1">{{ fortuneHeading }}</h2>
              <p class="fortune-text">{{ fortune }}</p>
            </section>
            <div class="fortune-actions">
              <AppButton class="fortune-action" type="button" :disabled="exporting" @click="saveCard">
                {{ exporting ? 'Готовим открытку…' : 'Сохранить пожелание' }}
              </AppButton>
              <CalendarReturnButton class="fortune-action fortune-calendar-button" @click="emit('back')" :completed="completed" />
            </div>
            <p v-if="actionMessage" class="fortune-message" role="status">{{ actionMessage }}</p>
          </div>
          <CalendarReturnButton v-if="stage !== 'open'" class="task-content-return" @click="emit('back')" />
          <p v-if="saveError" class="fortune-message" role="alert">{{ saveError }}</p>
        </template>
      </AppCard>
      <footer class="fortune-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </TaskContainer>
  </TaskLayout>
</template>

<style scoped>
@font-face {
  font-family: 'Advent Inter';
  src: url('../assets/splash/Inter.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: 'Advent STIX';
  src: url('../assets/splash/STIXTwoText.woff2') format('woff2');
  font-weight: 400 700;
  font-display: swap;
}

:global(#app:has(.fortune-page)) { width: 100%; border: 0; }

.fortune-page {
  --fortune-gold: #ffe3a7;
  position: relative;
  isolation: isolate;
  min-height: 100svh;
  background: linear-gradient(to bottom right, #090807, #291209 22%, #743012 48%, #cf5515 73%, #ff941f);
  color: #fff7e8;
  color-scheme: light;
  font: 400 14px/20px 'Advent Inter', sans-serif;
  letter-spacing: 0;
  text-align: left;
}

.fortune-sky { position: absolute; z-index: -1; inset: 0; overflow: clip; pointer-events: none; }
.fortune-sky img { position: absolute; display: block; }
.fortune-layout { box-sizing: border-box; max-width: 760px; margin-inline: auto; padding: 0 16px 26px; }
.fortune-header { position: relative; box-sizing: border-box; height: 95px; padding-top: 34px; }
.fortune-header img { display: block; margin-inline: auto; }
button { cursor: pointer; font: inherit; letter-spacing: inherit; }
button:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }

.fortune-header button {
  position: absolute;
  top: 47px;
  left: 0;
  min-height: 44px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: #fff0c4;
  font-size: 12px;
}

.fortune-panel { position: relative; isolation: isolate; padding: 34px 24px 32px; }
.fortune-panel::before, .fortune-card::before, .fortune-action::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  content: '';
  pointer-events: none;
}
.fortune-panel::before { border-image: url('../assets/fortune/panel-closed.svg') 25 fill / 25px stretch; }
[data-stage='open'] .fortune-panel { padding-bottom: 40px; }
[data-stage='open'] .fortune-panel::before { border-image-source: url('../assets/fortune/panel-open.svg'); }

.fortune-date { color: #ffe0a0; font-size: 11px; line-height: 13px; font-weight: 700; text-align: center; }
.fortune-panel h1 {
  margin: 8px 0 0;
  color: var(--fortune-gold);
  font: 400 28px/30px 'Advent STIX', serif;
  letter-spacing: 0;
  text-align: center;
}
.fortune-copy, .fortune-notice { margin-top: 23px; }
.fortune-copy p + p { margin-top: 20px; }
.fortune-notice { min-height: 80px; }
.fortune-notice button { margin-top: 20px; }

.fortune-artwork { position: relative; width: min(100%, 307px); margin: 3px auto 0; }
[data-stage='opening'] .fortune-artwork, [data-stage='open'] .fortune-artwork { margin-top: 28px; }
[data-stage='opening'] .fortune-artwork { transition: margin-top 350ms ease-out; }
.fortune-cookie-hit { position: absolute; inset: 0 auto 0 9.446%; width: 73.616%; border: 0; border-radius: 24px; background: transparent; color: var(--fortune-gold); }

.fortune-action {
  position: relative;
  isolation: isolate;
  display: block;
  width: 100%;
  min-height: 52px;
  padding: 8px 12px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: var(--fortune-gold);
  font-weight: 700;
  text-align: center;
}
.fortune-action::before { border-image: url('../assets/fortune/button-outline.svg') 15 fill / 15px stretch; }
.fortune-action:hover:not(:disabled) { filter: brightness(1.1); }
.fortune-action:disabled { cursor: wait; }
.fortune-open-button { min-height: 60px; margin-top: 22px; color: #663319; font-size: 15px; }
.fortune-open-button::before { border-image: url('../assets/fortune/button-open.svg') 17 fill / 17px stretch; }
.fortune-calendar-button { color: #663319; }
.fortune-calendar-button::before { border-image-source: url('../assets/fortune/button-calendar.svg'); }
.fortune-open-button:focus-visible, .fortune-calendar-button:focus-visible { outline-color: var(--fortune-gold); }

.fortune-result { margin-top: 33px; scroll-margin-block: 20px; }
.fortune-card { position: relative; isolation: isolate; padding: 27px 24px 31px 21px; }
.fortune-card::before { border-image: url('../assets/fortune/paper-card.svg') 21 fill / 21px stretch; }
.fortune-card h2 {
  margin: 0;
  color: #a7280b;
  font: 700 10px/13px 'Advent Inter', sans-serif;
  letter-spacing: 0;
  text-transform: uppercase;
}
.fortune-text { margin-top: 13px; color: #623c28; font: 500 22px/26px 'Advent STIX', serif; overflow-wrap: anywhere; }
.fortune-signature { margin-top: 20px; color: #a7280b; font-style: italic; font-weight: 500; font-synthesis: style; }
.fortune-actions { display: grid; gap: 12px; margin-top: 27px; }
.fortune-message { margin-top: 12px; color: #fff7e8; overflow-wrap: anywhere; }
.fortune-footer { margin-top: 24px; color: #fff0c4; font-size: 12px; line-height: 15px; text-align: center; }

.is-revealing .fortune-card { animation: fortune-paper-appear 520ms cubic-bezier(.2,.8,.25,1) both; }
.is-revealing .fortune-actions { animation: fortune-actions-appear 340ms 180ms ease-out both; }

@keyframes fortune-paper-appear {
  from { opacity: 0; transform: translateY(-18px) scale(.97); clip-path: inset(0 0 75% round 18px); }
  to { opacity: 1; transform: none; clip-path: inset(0 round 18px); }
}
@keyframes fortune-actions-appear {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}

@media (max-width: 359px) {
  .fortune-layout { padding-inline: 12px; }
  .fortune-panel { padding-inline: 18px; }
  .fortune-panel h1 { font-size: 26px; }
  .fortune-card { padding-inline: 18px; }
}

@media (min-width: 768px) {
  .fortune-layout, .fortune-panel { padding-inline: 32px; }
}

@media (prefers-reduced-motion: reduce) {
  [data-stage='opening'] .fortune-artwork { transition: none; }
  .is-revealing .fortune-card, .is-revealing .fortune-actions { animation: none; }
}

.task-content-return { margin-top: 16px; }
</style>
