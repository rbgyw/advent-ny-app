<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CalendarTask } from '../types/models';
import { formatDate } from '../utils/date';
import { shortCalendarDate } from '../utils/calendar';
import { animateWishStar } from '../utils/wish-motion';
import { wishSnow } from '../content/wish-snow';
import WishGlobe from './WishGlobe.vue';
import wordmark from '../assets/wish/wordmark.svg';
import panelArt from '../assets/wish/panel.svg';
import buttonArt from '../assets/wish/button.svg';
import mainStar from '../assets/wish/star-main.svg';
import starTrail from '../assets/wish/star-trail.svg';
import starSparkles from '../assets/wish/star-sparkles.svg';

const props = defineProps<{ assignment?: CalendarTask; day: number; total?: number; loading: boolean; saving: boolean; error?: string | null; saveError?: string | null }>();
const emit = defineEmits<{ back: []; retry: []; confirm: []; edit: [] }>();
const started = ref(false), confirmed = ref(false);
const completed = computed(() => props.assignment?.status === 'completed');
const stage = computed(() => completed.value ? 'accepted' : started.value ? 'wishing' : 'intro');
const snowfall = computed(() => started.value && !completed.value && !confirmed.value);
const date = computed(() => props.assignment ? shortCalendarDate(props.assignment.available_date).toLocaleUpperCase('ru-RU') : `${props.day} ДЕКАБРЯ`);
const background = ref<HTMLElement>(), heading = ref<HTMLElement>(), starOuter = ref<HTMLElement>(), starImage = ref<HTMLImageElement>(), starTrailImage = ref<HTMLImageElement>();
const ratio = ref(1529 / 393), motionPhase = ref<'idle' | 'flying' | 'spinning'>('idle');
const gradientTransform = computed(() => `translate(-50%, -50%) matrix(1.8204429496, ${.4559142329 * ratio.value}, 3.0590994236, ${-1.8204429496 * ratio.value}, 0, 0)`);
const cssUrl = (url: string) => `url("${url}")`;
let observer: ResizeObserver | undefined, motion: AbortController | undefined, reducedMotion: MediaQueryList | undefined;
let disposed = false;
let motionViewportWidth = 0;
function settleMotion() { motion?.abort(); motion = undefined; motionPhase.value = 'idle'; }
function onMotionPreference() { if (reducedMotion?.matches) settleMotion(); }
function onResize() { if (motionPhase.value !== 'idle' && innerWidth !== motionViewportWidth) settleMotion(); }
async function focusHeading() { await nextTick(); if (!disposed) { window.scrollTo({ top: 0, behavior: 'instant' }); heading.value?.focus({ preventScroll: true }); } }
function activate() {
  if (props.loading || props.saving || !props.assignment?.task || props.error || completed.value) return;
  started.value = true; confirmed.value = false; emit('edit'); void focusHeading();
}
function confirmWish() {
  if (props.loading || props.saving || !props.assignment?.task || stage.value !== 'wishing') return;
  // User action is the only in-page event that stops the endless snowfall.
  confirmed.value = true; emit('edit'); emit('confirm');
}
watch(completed, async (value, previous) => {
  if (!value || previous !== false) return;
  await focusHeading();
  if (disposed || !confirmed.value || !starOuter.value || !starImage.value || !starTrailImage.value) return;
  motion = new AbortController(); const current = motion;
  if (reducedMotion?.matches) return;
  motionViewportWidth = innerWidth;
  motionPhase.value = 'flying';
  try { await animateWishStar(starOuter.value, starImage.value, starTrailImage.value, current.signal, () => { if (!disposed && !current.signal.aborted) motionPhase.value = 'spinning'; }); }
  finally { if (motion === current) { motion = undefined; motionPhase.value = 'idle'; } }
});
watch(() => props.assignment?.id, () => { settleMotion(); started.value = false; confirmed.value = false; });
onMounted(() => {
  observer = new ResizeObserver(entries => { const size = entries[0]?.contentRect; if (size?.width) ratio.value = size.height / size.width; });
  if (background.value) observer.observe(background.value);
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)'); reducedMotion.addEventListener('change', onMotionPreference);
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => { disposed = true; settleMotion(); observer?.disconnect(); reducedMotion?.removeEventListener('change', onMotionPreference); window.removeEventListener('resize', onResize); });
</script>

<template>
  <main class="wish-page" :data-stage="stage" :data-motion-phase="motionPhase">
    <div ref="background" class="wish-background" aria-hidden="true"><div class="wish-gradient" :style="{ transform: gradientTransform }"></div></div>
    <div class="wish-layout">
      <header class="wish-header"><img :src="wordmark" alt="ГЕРОФАРМ" /><button type="button" @click="emit('back')">← К календарю</button></header>
      <article class="wish-panel" :class="`wish-${stage}`" :style="{ '--panel-art': cssUrl(panelArt) }" aria-labelledby="wish-title">
        <p class="wish-date">{{ date }}</p>
        <p v-if="loading" class="wish-notice" role="status">Загружаем задание…</p>
        <div v-else-if="error" class="wish-notice" role="alert"><p>{{ error }}</p><button class="wish-button" @click="emit('retry')">Попробовать снова</button></div>
        <p v-else-if="!assignment" class="wish-notice">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="wish-notice">Задание откроется {{ formatDate(assignment.available_date) }}.</p>
        <template v-else>
          <div v-if="stage === 'accepted'" class="wish-star-scene" role="img" aria-label="Золотая звезда с сияющим следом">
            <img ref="starTrailImage" class="wish-star-trail" :class="{ 'is-hidden': motionPhase === 'flying' }" :src="starTrail" alt="" />
            <img class="wish-star-sparkles" :src="starSparkles" alt="" />
            <div ref="starOuter" class="wish-star-outer"><img ref="starImage" class="wish-main-star" :src="mainStar" alt="" /></div>
          </div>
          <h1 id="wish-title" ref="heading" tabindex="-1"><template v-if="stage === 'intro'">А снег идет, а снег идет…</template><template v-else-if="stage === 'wishing'">Загадайте желание</template><template v-else>Пусть желание<br />сбудется!</template></h1>
          <WishGlobe v-if="stage !== 'accepted'" class="wish-illustration" />
          <div v-if="stage === 'intro'" class="wish-copy">
            <p>За окном зима, в чашке — что-нибудь горячее, а до Нового года остается совсем немного. В такие дни особенно хочется верить, что чудо где-то рядом: стоит только протянуть руку.</p>
            <p>Сегодня оно спряталось в нашем окошке. Нажмите кнопку — и впустите немного зимней магии!</p>
          </div>
          <div v-else-if="stage === 'wishing'" class="wish-copy" role="status"><p>Поймайте этот волшебный момент: загадайте желание, пока снежинки не растаяли!</p><p>Произнесите его про себя — пусть оно останется вашим маленьким секретом.</p></div>
          <div v-else class="wish-copy" role="status"><p>Желание принято! Эльфы уже засучили рукава и приступили к работе. Пусть у вашей мечты появится шанс стать настоящим новогодним чудом.</p></div>
          <p v-if="stage === 'accepted'" class="wish-note">Сохраните это настроение с собой</p>
          <p v-if="saveError" class="wish-error" role="alert">{{ saveError }}</p>
          <button v-if="stage === 'intro'" class="wish-button" :style="{ backgroundImage: cssUrl(buttonArt) }" type="button" @click="activate"><span>Впустить волшебство</span></button>
          <button v-else-if="stage === 'wishing'" class="wish-button" :style="{ backgroundImage: cssUrl(buttonArt) }" type="button" :disabled="saving" @click="confirmWish"><span>{{ saving ? 'Принимаем желание…' : 'Желание загадано' }}</span></button>
          <button v-else class="wish-button" :style="{ backgroundImage: cssUrl(buttonArt) }" type="button" @click="emit('back')"><span>К календарю</span></button>
          <p v-if="stage !== 'accepted'" class="wish-note">{{ stage === 'intro' ? 'Маленький момент — только для вас' : 'Ваше желание останется только вашим' }}</p>
        </template>
      </article>
      <footer class="wish-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
    <div v-if="stage === 'wishing' && !loading && !error && assignment?.task" class="wish-snow" :class="{ 'is-falling': snowfall }" aria-hidden="true">
      <span v-for="(flake, index) in wishSnow" :key="index" class="wish-flake" :style="{ left: `${flake.x}%`, '--rest-y': `${flake.y}svh`, animationDuration: `${flake.duration}s`, animationDelay: `${flake.delay}s`, '--drift': `${flake.drift}px`, '--turn': `${flake.turn}deg` }"><img :src="flake.src" alt="" /></span>
    </div>
  </main>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.ttf') format('truetype'); font-weight: 400 700; font-display: swap; }
:global(#app:has(.wish-page)) { width: 100%; border: 0; }
.wish-page { position: relative; isolation: isolate; box-sizing: border-box; width: 100%; min-height: max(100svh, 875px); overflow: clip; color-scheme: light; color: #623c28; background: #c63d0f; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; }
.wish-background { position: absolute; top: 0; left: 0; width: 100%; height: 174.742857%; z-index: -1; overflow: hidden; pointer-events: none; }
.wish-gradient { position: absolute; top: 56.53241251%; left: 46.0559869%; width: 100%; aspect-ratio: 1; transform-origin: center; background: radial-gradient(circle closest-side at center, #ffb451 0%, #f78028 51.442307%, #c63d0f 100%); }
.wish-layout { box-sizing: border-box; width: 100%; max-width: 760px; margin-inline: auto; padding: 0 16px 30px; }
.wish-header { position: relative; box-sizing: border-box; height: 94px; padding-top: 34px; }
.wish-header > img { display: block; margin-inline: auto; }
button { cursor: pointer; font-family: inherit; letter-spacing: 0; }
.wish-header button { position: absolute; top: 48px; left: 0; min-height: 44px; padding: 0 8px; border: 0; background: transparent; color: #fff1cf; font: 400 12px/15px 'Advent Inter', sans-serif; }
.wish-panel { position: relative; isolation: isolate; box-sizing: border-box; width: 100%; padding: 29px 24px; }
.wish-panel::before { content: ''; position: absolute; z-index: -1; inset: -.5px; border: 24px solid transparent; border-image: var(--panel-art) 24 fill / 24px stretch; pointer-events: none; }
.wish-date { margin: 0 0 14px; color: #a7280b; font-size: 12px; line-height: 15px; font-weight: 700; }
.wish-panel h1 { margin: 0; color: #623c28; font: 500 28px/30px 'Advent STIX', serif; letter-spacing: 0; outline: none; }
.wish-illustration { margin: 21px auto 0; }
.wish-copy { margin-top: 8px; color: #836045; }
.wish-copy p { margin: 0; }
.wish-copy p + p { margin-top: 20px; }
.wish-button { display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 100%; height: 52px; margin-top: 30px; padding: 0 12px; border: 0; border-radius: 13px; background: #a7280b center / 100% 100% no-repeat; color: #fff0d2; font: 700 14px/17px 'Advent Inter', sans-serif; text-align: center; }
.wish-button span { color: transparent; background-clip: text; background-image: linear-gradient(74.3636deg, #e8b77e .55732%, #ffe6bc 19.578%, #fff0d2 72.836%, #efc087 99.465%); }
.wish-button:disabled { cursor: wait; opacity: .75; }
.wish-button:hover:not(:disabled) { filter: brightness(1.08); }
.wish-note { margin-top: 12px; color: #99744d; font-size: 11px; line-height: 14px; }
.wish-footer { margin-top: 27px; color: #623c28; font-size: 12px; line-height: 15px; text-align: center; }
.wish-wishing { padding-bottom: 26px; }
.wish-wishing .wish-illustration { margin-top: 19px; }
.wish-wishing .wish-copy { margin-top: 10px; }
.wish-wishing .wish-button { margin-top: 22px; }
.wish-accepted { padding-bottom: 24px; }
.wish-accepted .wish-date { margin-bottom: 0; }
.wish-star-scene { position: relative; width: 230px; height: 140px; margin: 17px auto 15px; }
.wish-star-trail { position: absolute; left: 54.132px; top: 31.893px; display: block; }
.wish-star-trail.is-hidden { opacity: 0; clip-path: inset(0 100% 0 0); transform: translate(-12px, 12px); }
.wish-star-sparkles { position: absolute; left: 30.804px; top: 29.75px; display: block; }
.wish-star-outer { position: absolute; left: 19.714px; top: 71.643px; width: 57.5px; height: 55.8571px; }
.wish-main-star { display: block; transform-origin: center; }
.wish-accepted .wish-copy { margin-top: 21px; }
.wish-accepted .wish-note { margin-top: 18px; }
.wish-accepted .wish-button { margin-top: 26px; }
.wish-notice { min-height: 140px; margin-top: 24px; color: #836045; }
.wish-error { margin-top: 16px; color: #a7280b; font-size: 13px; line-height: 18px; overflow-wrap: anywhere; }
button:focus-visible { outline: 2px solid #623c28; outline-offset: 2px; }
.wish-snow { position: fixed; z-index: 3; inset: 0; overflow: hidden; pointer-events: none; }
.wish-flake { position: absolute; top: -48px; opacity: .9; animation-name: wish-snowfall; animation-timing-function: linear; animation-iteration-count: infinite; animation-fill-mode: both; animation-play-state: paused; }
.wish-flake img { display: block; }
.wish-snow.is-falling .wish-flake { animation-play-state: running; }
@keyframes wish-snowfall { from { transform: translate3d(0, 0, 0) rotate(0deg); } to { transform: translate3d(var(--drift), calc(100svh + 96px), 0) rotate(var(--turn)); } }
@media (prefers-reduced-motion: reduce) { .wish-flake { top: var(--rest-y); animation: none; } }
@media (max-width: 360px) { .wish-layout { padding-inline: 12px; } .wish-panel { padding-inline: 18px; } .wish-panel h1 { font-size: 26px; } }
@media (min-width: 768px) { .wish-layout { padding-inline: 32px; } .wish-panel { padding-inline: 32px; } }
</style>
