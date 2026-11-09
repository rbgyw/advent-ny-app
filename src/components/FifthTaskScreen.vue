<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CalendarTask } from '../types/models';
import { formatDate } from '../utils/date';
import { shortCalendarDate } from '../utils/calendar';
import { createPairDeck, initialPairDeck, isPairDeck, isPairsSolution, pairIds } from '../utils/pairs';
import { pairProducts } from '../content/pairs-task';
import wordmark from '../assets/first-task/wordmark.svg';
import panel from '../assets/pairs/panel.svg';
import back from '../assets/pairs/back.svg';
import sparkle from '../assets/pairs/sparkle.svg';
import backSecond from '../assets/pairs/back-second.svg';
import backMiddle from '../assets/pairs/back-middle.svg';
import backRight from '../assets/pairs/back-right.svg';
import front from '../assets/pairs/front.svg';

const props = defineProps<{ assignment?: CalendarTask; day: number; total?: number; userId?: string; loading: boolean; saving: boolean; error?: string | null; saveError?: string | null }>();
const emit = defineEmits<{ back: []; retry: []; submit: [pairs: number[]]; edit: [] }>();
const deck = ref([...initialPairDeck]), matched = ref<number[]>([]), opened = ref<number[]>([]);
const moves = ref(0), started = ref(false), resolving = ref(false), announcement = ref('');
const ready = ref(false), imageError = ref(false);
const board = ref<HTMLElement>(), background = ref<HTMLElement>();
const cardScale = ref(1), ratio = ref(1477 / 393);
const completed = computed(() => props.assignment?.status === 'completed');
const won = computed(() => isPairsSolution(matched.value));
const playable = computed(() => started.value && ready.value && !resolving.value && !won.value && !props.saving && !!props.assignment?.task && !props.loading && !props.error);
const date = computed(() => props.assignment ? shortCalendarDate(props.assignment.available_date).toLocaleUpperCase('ru-RU') : `${props.day} ДЕКАБРЯ`);
const storageKey = computed(() => props.userId && props.assignment?.task_id ? `advent-pairs-v1:${props.userId}:${props.assignment.task_id}` : '');
const gradientTransform = computed(() => `translate(-50%, -50%) matrix(1.8204429496, ${.4559142329 * ratio.value}, 3.0590994236, ${-1.8204429496 * ratio.value}, 0, 0)`);
const cssUrl = (url: string) => `url("${url}")`;
let timer: ReturnType<typeof setTimeout> | undefined;
let observer: ResizeObserver | undefined;
let resizeFrame = 0, imageVersion = 0;
const pendingSizes = new Map<Element, { width: number; height: number }>();
function clearTurn() { clearTimeout(timer); opened.value = []; resolving.value = false; }
function restore() {
  clearTurn(); deck.value = [...initialPairDeck]; matched.value = []; moves.value = 0; started.value = false; announcement.value = '';
  if (completed.value) { matched.value = [...pairIds]; started.value = true; }
  if (!storageKey.value) return;
  try {
    const draft = JSON.parse(sessionStorage.getItem(storageKey.value) || 'null');
    if (!draft || !isPairDeck(draft.deck) || !Array.isArray(draft.matched) || !draft.matched.every((id: unknown) => typeof id === 'number' && pairIds.includes(id as typeof pairIds[number])) || new Set(draft.matched).size !== draft.matched.length || !Number.isSafeInteger(draft.moves) || draft.moves < draft.matched.length || draft.moves > 10_000_000) return;
    if (completed.value && !isPairsSolution(draft.matched)) return;
    deck.value = draft.deck; matched.value = draft.matched; moves.value = draft.moves; started.value = true;
  } catch { /* Local storage is optional. */ }
}
watch(storageKey, restore, { immediate: true });
watch([deck, matched, moves, started], () => {
  if (!storageKey.value) return;
  try {
    if (started.value && (!completed.value || won.value) && moves.value >= matched.value.length) sessionStorage.setItem(storageKey.value, JSON.stringify({ deck: deck.value, matched: matched.value, moves: moves.value }));
  } catch { /* Keep playing when storage is unavailable. */ }
}, { deep: true });
watch(board, element => { if (element) observer?.observe(element); });
function isOpen(index: number) { return opened.value.includes(index) || matched.value.includes(deck.value[index]!); }
function backArt(index: number) { return index === 0 ? back : index === 1 ? backSecond : index % 4 === 3 ? backRight : backMiddle; }
function restart() {
  if (!ready.value || props.saving) return;
  clearTurn(); deck.value = createPairDeck(); matched.value = []; moves.value = 0; started.value = true;
  announcement.value = 'Игра началась. Найдите восемь пар.'; emit('edit');
}
function submitWin() { if (won.value && !completed.value && !props.saving) emit('submit', [...matched.value]); }
function flip(index: number) {
  if (!playable.value || isOpen(index)) return;
  emit('edit'); opened.value = [...opened.value, index];
  announcement.value = `Открыта карточка ${pairProducts[deck.value[index]!]!.name}.`;
  if (opened.value.length < 2) return;
  moves.value++; resolving.value = true;
  const first = deck.value[opened.value[0]!]!, second = deck.value[opened.value[1]!]!;
  const match = first === second;
  if (match) { matched.value = [...matched.value, first]; announcement.value = `Пара ${pairProducts[first]!.name} найдена. Найдено ${matched.value.length} из 8 пар.`; if (won.value) submitWin(); }
  else announcement.value = 'Карточки не совпали. Запомните их расположение.';
  timer = setTimeout(() => {
    opened.value = []; resolving.value = false;
    if (won.value) announcement.value = 'Все восемь пар найдены!';
  }, match ? 480 : 1300);
}
async function loadImages() {
  const version = ++imageVersion; ready.value = false; imageError.value = false;
  try {
    await Promise.all(pairProducts.map(product => new Promise<void>((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(); image.onerror = () => reject(new Error('image')); image.src = product.image;
    })));
    if (version === imageVersion) ready.value = true;
  } catch { if (version === imageVersion) imageError.value = true; }
}
onMounted(() => {
  void loadImages();
  observer = new ResizeObserver(entries => {
    for (const entry of entries) pendingSizes.set(entry.target, { width: entry.contentRect.width, height: entry.contentRect.height });
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      for (const [element, size] of pendingSizes) {
        if (element === board.value) cardScale.value = (size.width - 21) / 4 / 73;
        else if (element === background.value && size.width) ratio.value = size.height / size.width;
      }
      pendingSizes.clear();
    });
  });
  if (background.value) observer.observe(background.value);
  if (board.value) observer.observe(board.value);
});
onBeforeUnmount(() => { clearTimeout(timer); observer?.disconnect(); cancelAnimationFrame(resizeFrame); imageVersion++; });
</script>

<template>
  <main class="pairs-page">
    <div ref="background" class="pairs-background" aria-hidden="true"><div class="pairs-gradient" :style="{ transform: gradientTransform }"></div></div>
    <div class="pairs-layout">
      <header class="pairs-header"><img :src="wordmark" alt="ГЕРОФАРМ" /><button type="button" class="pairs-back" @click="emit('back')">← К календарю</button></header>
      <article class="pairs-panel" :class="{ 'is-won': won }" :style="{ '--panel-art': cssUrl(panel) }" aria-labelledby="pairs-title">
        <p class="pairs-date">{{ date }}</p>
        <h1 id="pairs-title">Что скрывают карточки?</h1>
        <p v-if="loading" class="pairs-notice" role="status">Загружаем задание…</p>
        <div v-else-if="error" class="pairs-notice"><p role="alert">{{ error }}</p><button type="button" class="pairs-button" @click="emit('retry')"><span>Попробовать ещё раз</span></button></div>
        <p v-else-if="!assignment" class="pairs-notice" role="status">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="pairs-notice" role="status">Задание пока закрыто. Откроется {{ formatDate(assignment.available_date) }}.</p>
        <template v-else>
          <div class="pairs-copy">
            <p>Готовы проверить, насколько хорошо вы запоминаете детали?</p>
            <p>Сегодня тренируем память и внимание в игре с карточками. На их обороте — упаковки препаратов ГЕРОФАРМ. У каждой карточки есть пара: ваша задача — найти все совпадения.</p>
            <p>Открывайте по две карточки за ход и запоминайте, где какая упаковка находится. Если изображения совпадут, пара останется открытой. Если нет — карточки снова перевернутся. Продолжайте, пока не найдете все пары!</p>
          </div>
          <div class="pairs-counters" aria-live="polite" aria-atomic="true"><p>Найдено пар: {{ matched.length }} / 8</p><p>Ходов: {{ completed && won && !moves ? '—' : moves }}</p></div>
          <div ref="board" class="pairs-board" :style="{ '--card-scale': cardScale }" role="group" aria-label="Игровое поле: 16 карточек, 8 пар">
            <button v-for="(id, index) in deck" :key="`${index}:${id}`" class="pair-card" :class="{ 'is-open': isOpen(index), 'is-matched': matched.includes(id) }" type="button" :disabled="!playable || isOpen(index)" :aria-label="`Карточка ${index + 1}. ${isOpen(index) ? pairProducts[id]!.name + (matched.includes(id) ? ', пара найдена' : '') : 'Закрыта'}`" :aria-pressed="isOpen(index)" @click="flip(index)">
              <span class="pair-card-scale"><span class="pair-card-rotator">
                <span class="pair-card-face pair-card-back" aria-hidden="true"><img class="pair-art" :src="backArt(index)" alt="" /><img v-if="index === 0" class="pair-sparkle" :src="sparkle" alt="" /></span>
                <span class="pair-card-face pair-card-front" aria-hidden="true"><img class="pair-art" :src="front" alt="" /><img class="pair-product" :src="pairProducts[id]!.image" :style="{ left: `${pairProducts[id]!.x}px`, top: `${pairProducts[id]!.y}px`, width: `${pairProducts[id]!.width}px`, height: `${pairProducts[id]!.height}px` }" alt="" /><span class="pair-product-name">{{ pairProducts[id]!.name }}</span></span>
              </span></span>
            </button>
          </div>
          <p v-if="imageError" class="pairs-error" role="alert">Не удалось загрузить изображения карточек. <button type="button" @click="loadImages">Попробовать ещё раз</button></p>
          <p v-else-if="!ready" class="pairs-loading" role="status">Загружаем карточки…</p>
          <button class="pairs-button pairs-start" type="button" :disabled="!ready || saving" @click="restart"><span>{{ started ? 'Начать заново' : 'Начать игру' }}</span></button>
          <div v-if="won" class="pairs-result" role="status"><p>Все пары найдены!</p><p>Вы были внимательны к каждой детали.</p></div>
          <p v-if="saving" class="pairs-save-status" role="status">Сохраняем результат…</p>
          <div v-else-if="saveError" class="pairs-error" role="alert"><p>{{ saveError }}</p><button v-if="won" type="button" class="pairs-button" @click="submitWin"><span>Сохранить результат</span></button></div>
          <p v-else-if="won && !completed" class="pairs-save-status">Результат ещё не сохранён. <button type="button" @click="submitWin">Сохранить результат</button></p>
          <p class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
        </template>
      </article>
      <footer class="pairs-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
  </main>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.ttf') format('truetype'); font-weight: 400 700; font-display: swap; }
:global(#app:has(.pairs-page)) { width: 100%; border: 0; }
.pairs-page { position: relative; isolation: isolate; overflow: clip; box-sizing: border-box; width: 100%; min-height: 100svh; color-scheme: light; color: #623c28; background: #c63d0f; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; }
.pairs-background { position: absolute; top: 0; left: 0; width: 100%; height: max(100%, 1477px); z-index: -1; overflow: hidden; pointer-events: none; }
.pairs-gradient { position: absolute; top: 56.53241251%; left: 46.0559869%; width: 100%; aspect-ratio: 1; transform-origin: center; background: radial-gradient(circle closest-side at center, #ffb451 0%, #f78028 51.442307%, #c63d0f 100%); }
.pairs-layout { position: relative; box-sizing: border-box; width: 100%; max-width: 960px; margin-inline: auto; padding: 0 clamp(0px, calc((100vw - 313px) / 2), 16px) 25px; }
.pairs-header { position: relative; box-sizing: border-box; height: 94px; padding-top: 34px; }
.pairs-header > img { display: block; margin-inline: auto; }
.pairs-back { display: flex; align-items: center; position: absolute; top: 48px; left: 0; min-height: 44px; padding: 0 8px; border: 0; background: transparent; color: #fff1cf; font: 400 12px/15px 'Advent Inter', sans-serif; cursor: pointer; }
.pairs-panel { position: relative; isolation: isolate; box-sizing: border-box; width: 100%; padding: 30px clamp(16px, calc((100vw - 345px) / 2), 24px) 28px; }
.pairs-panel.is-won { padding-bottom: 49px; }
.pairs-panel::before { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; border: 24px solid transparent; border-image: var(--panel-art) 24 fill / 24px stretch; }
.pairs-date { margin: 0 0 13px; color: #a7280b; font-size: 12px; line-height: 15px; font-weight: 700; }
.pairs-panel h1 { box-sizing: border-box; width: calc(100% + 17px); margin: 0; color: #623c28; font: 500 28px/30px 'Advent STIX', serif; letter-spacing: 0; }
.pairs-copy { margin-top: 22px; color: #836045; }
.pairs-copy p { margin: 0 0 20px; }
.pairs-copy p:last-child { margin-bottom: 0; }
.pairs-counters { display: flex; justify-content: space-between; gap: 16px; margin: 26px -2px 29px; color: #a7280b; font-size: 12px; line-height: 15px; }
.pairs-counters p { margin: 0; }
.pairs-board { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; width: min(100%, 600px); margin-inline: auto; }
.pair-card { position: relative; display: block; box-sizing: border-box; min-width: 0; width: 100%; aspect-ratio: 73 / 101; border: 0; border-radius: 10px; margin: 0; padding: 0; background: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pair-card:disabled { opacity: 1; cursor: default; }
.pair-card-scale { position: absolute; display: block; top: 0; left: 0; width: 73px; height: 101px; transform: scale(var(--card-scale)); transform-origin: top left; perspective: 650px; }
.pair-card-rotator { position: relative; display: block; width: 73px; height: 101px; transform-style: preserve-3d; transform: rotateY(0deg); transition: transform 480ms cubic-bezier(.22,.65,.3,1); }
.is-open .pair-card-rotator { transform: rotateY(180deg); }
.pair-card-face { position: absolute; display: block; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.pair-card-back { transform: rotateY(0deg); }
.pair-card-front { transform: rotateY(180deg); }
.pair-art { position: absolute; left: -.5px; top: -.5px; pointer-events: none; }
.pair-sparkle { position: absolute; left: 22.175px; top: 36.175px; pointer-events: none; }
.pair-product { position: absolute; max-width: none; object-fit: cover; pointer-events: none; }
.pair-product-name { position: absolute; top: 80.6px; left: -4px; width: 81px; color: #623c28; font: 400 7.884px/10px 'Advent Inter', sans-serif; text-align: center; white-space: nowrap; }
.pairs-button { position: relative; left: 50%; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 313px; min-width: 313px; max-width: 313px; height: 52px; min-height: 52px; padding: 0 16px; margin-inline: 0; border: 0; border-radius: 13px; background: #a7280b; color: #fff7df; font: 700 14px/17px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: center; cursor: pointer; }
.pairs-button > span { color: transparent; background-clip: text; background-image: linear-gradient(77.3594deg, #e8b77e .55732%, #ffe6bc 19.578%, #fff0d2 72.836%, #efc087 99.465%); }
.pairs-button:disabled { opacity: .65; cursor: default; }
.pairs-button:not(:disabled):hover { background: #962107; }
.pairs-start { margin-top: 25px; }
.pairs-button:focus-visible, .pairs-back:focus-visible { outline: 2px solid #623c28; outline-offset: 0; }
.pair-card:focus-visible { outline: 2px solid #a7280b; outline-offset: 0; }
.pairs-result { margin-top: 20px; line-height: 17px; }
.pairs-result p { margin: 0; }
.pairs-result p + p { margin-top: 5px; }
.pairs-save-status, .pairs-error, .pairs-loading { margin-top: 16px; font-size: 13px; line-height: 18px; }
.pairs-error { color: #a7280b; overflow-wrap: anywhere; }
.pairs-error .pairs-button { margin-top: 16px; }
.pairs-notice { margin-top: 24px; min-height: 120px; }
.pairs-notice .pairs-button { margin-top: 24px; }
.pairs-footer { margin-top: 28px; font-size: 12px; line-height: 15px; text-align: center; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
@media (min-width: 768px) { .pairs-layout { padding-inline: 32px; } .pairs-panel { padding-inline: 32px; } }
@media (prefers-reduced-motion: reduce) { .pair-card-rotator { transition: none; } }
</style>
