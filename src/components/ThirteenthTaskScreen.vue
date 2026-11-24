<script setup lang="ts">
import AdventPopup from './AdventPopup.vue';
import TaskDateLabel from './ui/TaskDateLabel.vue';
import FeedbackState from './ui/FeedbackState.vue';
import LoadingState from './ui/LoadingState.vue';
import AppButton from './ui/AppButton.vue';
import TaskLayout from './ui/TaskLayout.vue';
import AppHeader from './ui/AppHeader.vue';
import AppCard from './ui/AppCard.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CalendarTask } from '../types/models';
import { formatDate } from '../utils/date';
import { wishSnow } from '../content/wish-snow';
import WishGlobe from './WishGlobe.vue';
import TaskMusicButton from './TaskMusicButton.vue';
import wordmark from '../assets/wish/wordmark.svg';
import panelArt from '../assets/wish/panel.svg';
import buttonArt from '../assets/wish/button.svg';

const props = defineProps<{ assignment?: CalendarTask; day: number; total?: number; loading: boolean; saving: boolean; error?: string | null; saveError?: string | null }>();
const emit = defineEmits<{ back: []; retry: []; confirm: []; edit: [] }>();
const wishPopup = ref<InstanceType<typeof AdventPopup>>();
const resultPopup = ref<InstanceType<typeof AdventPopup>>();
const started = ref(false), confirmed = ref(false);
const completed = computed(() => props.assignment?.status === 'completed');
const stage = computed(() => completed.value ? 'accepted' : started.value ? 'wishing' : 'intro');
const snowfall = computed(() => started.value && !completed.value && !confirmed.value);
const background = ref<HTMLElement>(), heading = ref<HTMLElement>();
const ratio = ref(1529 / 393);
const gradientTransform = computed(() => `translate(-50%, -50%) matrix(1.8204429496, ${.4559142329 * ratio.value}, 3.0590994236, ${-1.8204429496 * ratio.value}, 0, 0)`);
const cssUrl = (url: string) => `url("${url}")`;
let observer: ResizeObserver | undefined;
let disposed = false;
async function focusHeading() { await nextTick(); if (!disposed) { window.scrollTo({ top: 0, behavior: 'instant' }); heading.value?.focus({ preventScroll: true }); } }
async function activate() {
  if (props.loading || props.saving || !props.assignment?.task || props.error || completed.value) return;
  started.value = true; confirmed.value = false; emit('edit'); void focusHeading();
  await nextTick(); wishPopup.value?.showModal();
}
function confirmWish() {
  if (props.loading || props.saving || !props.assignment?.task || stage.value !== 'wishing') return;
  // User action is the only in-page event that stops the endless snowfall.
  confirmed.value = true; emit('edit'); emit('confirm');
}
watch(completed, async (value, previous) => { if (value) { void focusHeading(); if (previous === false) { await nextTick(); resultPopup.value?.showModal(); } } });
watch(() => props.saveError, error => { if (error) confirmed.value = false; });
watch(() => props.assignment?.id, () => { started.value = false; confirmed.value = false; });
onMounted(() => {
  observer = new ResizeObserver(entries => { const size = entries[0]?.contentRect; if (size?.width) ratio.value = size.height / size.width; });
  if (background.value) observer.observe(background.value);
});
onBeforeUnmount(() => { disposed = true; observer?.disconnect(); });
</script>

<template>
  <TaskLayout class="wish-page" :data-stage="stage">
    <div ref="background" class="wish-background" aria-hidden="true"><div class="wish-gradient" :style="{ transform: gradientTransform }"></div></div>
    <div class="wish-layout">
      <AppHeader variant="task" class="wish-header" :wordmark="wordmark" @back="emit('back')" />
      <AppCard class="wish-panel" :class="`wish-${stage}`" :style="{ '--panel-art': cssUrl(panelArt) }" aria-labelledby="wish-title">
        <TaskDateLabel class="wish-date" :available-date="assignment?.available_date" :day="day" />
        <LoadingState v-if="loading" class="wish-notice" role="status" />
        <FeedbackState v-else-if="error" kind="error" class="wish-notice"><p>{{ error }}</p><AppButton class="wish-button" @click="emit('retry')">Попробовать снова</AppButton></FeedbackState>
        <FeedbackState v-else-if="!assignment" class="wish-notice" message="Задание не найдено." />
        <p v-else-if="!assignment.task" class="wish-notice">Задание откроется {{ formatDate(assignment.available_date) }}.</p>
        <template v-else>
          <h1 id="wish-title" ref="heading" tabindex="-1"><template v-if="stage === 'intro'">А снег идет, а снег идет…</template><template v-else-if="stage === 'wishing'">Загадайте желание</template><template v-else>Пусть желание<br />сбудется!</template></h1>
          <WishGlobe v-if="stage !== 'accepted'" class="wish-illustration" />
          <div v-if="stage === 'intro'" class="wish-copy">
            <p>В Новый год принято загадывать желание на снежинке. Погода в регионах переменчива, и не всегда это возможно. Но в нашем новогоднем адвенте свои правила — мы гарантируем волшебный снегопад каждому сотруднику ГЕРОФАРМ.</p>
            <p>Нажмите на кнопку, чтобы увидеть снегопад из снежинок. А пока они не растаяли, загадайте желание.</p>
          </div>
          <div v-else-if="stage === 'wishing'" class="wish-copy" role="status"><p>Пока снежинки не растаяли, загадайте желание. Произнесите его про себя — записывать ничего не нужно.</p></div>
          <div v-else class="wish-copy" role="status"><p>Пусть задуманное сбудется!</p></div>
          <p v-if="stage === 'accepted'" class="wish-note">Сохраните это настроение с собой</p>
          <p v-if="saveError" class="wish-error" role="alert">{{ saveError }}</p>
          <TaskMusicButton v-if="stage === 'wishing'" class="wish-music" />
          <AppButton v-if="stage === 'intro'" class="wish-button" :style="{ backgroundImage: cssUrl(buttonArt) }" type="button" @click="activate"><span>Запустить снегопад</span></AppButton>
          <AppButton v-else-if="stage === 'wishing'" class="wish-button" :style="{ backgroundImage: cssUrl(buttonArt) }" type="button" :disabled="saving" @click="confirmWish"><span>{{ saving ? 'Принимаем желание…' : 'Желание загадано' }}</span></AppButton>
          <AppButton v-else class="wish-button" :style="{ backgroundImage: cssUrl(buttonArt) }" type="button" @click="emit('back')"><span>К календарю</span></AppButton>
          <p v-if="stage !== 'accepted'" class="wish-note">{{ stage === 'intro' ? 'Маленький момент — только для вас' : 'Ваше желание останется только вашим' }}</p>
        </template>
      </AppCard>
      <footer class="wish-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
    <div v-if="snowfall && !loading && !error && assignment?.task" class="wish-snow" aria-hidden="true">
      <span v-for="(flake, index) in wishSnow" :key="index" class="wish-flake" :style="{ left: `${flake.x}%`, '--rest-y': `${flake.y}svh`, animationDuration: `${flake.duration}s`, animationDelay: `${flake.delay}s`, '--drift': `${flake.drift}px`, '--turn': `${flake.turn}deg` }"><img decoding="async" :src="flake.src" alt="" /></span>
    </div>
    <AdventPopup ref="wishPopup" title="Загадайте желание" message="Пока снежинки не растаяли, загадайте желание. Произнесите его про себя — записывать ничего не нужно" button-text="Желание загадано" @action="confirmWish" />
    <AdventPopup ref="resultPopup" title="Пусть задуманное сбудется!" message="" button-text="К календарю" @action="emit('back')" />
  </TaskLayout>
</template>

<style scoped>
:global(#app:has(.wish-page)) { width: 100%; border: 0; }
.wish-page { position: relative; isolation: isolate; box-sizing: border-box; width: 100%; min-height: max(100svh, 875px); overflow: clip; color-scheme: light; color: var(--color-ink); background: #c63d0f; font: 400 14px/20px var(--font-ui); letter-spacing: 0; text-align: left; }
.wish-background { position: absolute; top: 0; left: 0; width: 100%; height: 174.742857%; z-index: -1; overflow: hidden; pointer-events: none; }
.wish-gradient { position: absolute; top: 56.53241251%; left: 46.0559869%; width: 100%; aspect-ratio: 1; transform-origin: center; background: var(--background-task-glow); }
.wish-layout { box-sizing: border-box; width: 100%; max-width: 760px; margin-inline: auto; padding: 0 16px 30px; }
.wish-header > img { display: block; margin-inline: auto; }
button { cursor: pointer; font-family: inherit; letter-spacing: 0; }
.wish-panel { position: relative; isolation: isolate; box-sizing: border-box; width: 100%; padding: 29px 24px; }
.wish-panel::before { content: ''; position: absolute; z-index: -1; inset: -.5px; border: 24px solid transparent; border-image: var(--panel-art) 24 fill / 24px stretch; pointer-events: none; }
.wish-date { margin: 0 0 14px; color: var(--color-action); font-size: 12px; line-height: 15px; font-weight: 700; }
.wish-panel h1 { margin: 0; color: var(--color-ink); font: 500 28px/30px var(--font-display); letter-spacing: 0; outline: none; }
.wish-illustration { margin: 21px auto 0; }
.wish-copy { margin-top: 8px; color: #836045; }
.wish-copy p { margin: 0; }
.wish-copy p + p { margin-top: 20px; }
.wish-button { display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 100%; height: 52px; margin-top: 30px; padding: 0 12px; border: 0; border-radius: 13px; background: var(--color-action) center / 100% 100% no-repeat; color: var(--color-cream); font: 700 14px/17px var(--font-ui); text-align: center; }
.wish-button span { color: transparent; background-clip: text; background-image: linear-gradient(74.3636deg, #e8b77e .55732%, #ffe6bc 19.578%, var(--color-cream) 72.836%, #efc087 99.465%); }
.wish-button:disabled { cursor: wait; opacity: .75; }
.wish-button:hover:not(:disabled) { filter: brightness(1.08); }
.wish-note { margin-top: 12px; color: #99744d; font-size: 11px; line-height: 14px; }
.wish-footer { margin-top: 27px; color: var(--color-ink); font-size: 12px; line-height: 15px; text-align: center; }
.wish-wishing { padding-bottom: 26px; }
.wish-wishing .wish-illustration { margin-top: 19px; }
.wish-wishing .wish-copy { margin-top: 10px; }
.wish-wishing .wish-button { margin-top: 22px; }
.wish-accepted { padding-bottom: 24px; }
.wish-music { margin-top: 22px; }
.wish-accepted .wish-date { margin-bottom: 14px; }
.wish-accepted .wish-copy { margin-top: 21px; }
.wish-accepted .wish-note { margin-top: 18px; }
.wish-accepted .wish-button { margin-top: 26px; }
.wish-notice { min-height: 140px; margin-top: 24px; color: #836045; }
.wish-error { margin-top: 16px; color: var(--color-action); font-size: 13px; line-height: 18px; overflow-wrap: anywhere; }
button:focus-visible { outline: 2px solid var(--color-ink); outline-offset: 2px; }
.wish-snow { position: fixed; z-index: 3; inset: 0; overflow: hidden; pointer-events: none; }
.wish-flake { position: absolute; top: -48px; opacity: .9; animation-name: wish-snowfall; animation-timing-function: linear; animation-iteration-count: infinite; animation-fill-mode: both; }
.wish-flake img { display: block; }
@keyframes wish-snowfall { from { transform: translate3d(0, 0, 0) rotate(0deg); } to { transform: translate3d(var(--drift), calc(100svh + 96px), 0) rotate(var(--turn)); } }
@media (prefers-reduced-motion: reduce) { .wish-flake { top: var(--rest-y); animation: none; } }
@media (max-width: 360px) { .wish-layout { padding-inline: 12px; } .wish-panel { padding-inline: 18px; } .wish-panel h1 { font-size: 26px; } }
@media (min-width: 768px) { .wish-layout { padding-inline: 32px; } .wish-panel { padding-inline: 32px; } }
</style>
