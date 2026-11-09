<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CalendarTask } from '../types/models';
import { formatDate } from '../utils/date';
import { shortCalendarDate } from '../utils/calendar';
import { shuffleTarotDeck, tarotCardId } from '../utils/tarot';
import { tarotCards } from '../content/tarot-task';
import { tarotDecorations, tarotDecorationImage } from '../content/tarot-decorations';
import wordmark from '../assets/first-task/wordmark.svg';
import introPanel from '../assets/tarot/intro-panel.svg';
import choosePanel from '../assets/tarot/choose-panel.svg';
import resultPanel from '../assets/tarot/result-panel.svg';
import goldButton from '../assets/tarot/gold-button.svg';
import cardBack from '../assets/tarot/card-back.png';
import fanBorder from '../assets/tarot/fan-border.svg';
import fanBorderLeft from '../assets/tarot/fan-border-left.svg';
import fanBorderRight from '../assets/tarot/fan-border-right.svg';
import handle from '../assets/tarot/handle.svg';
import closeRing from '../assets/tarot/close-ring.svg';

const props = defineProps<{ assignment?: CalendarTask; day: number; total?: number; userId?: string; loading: boolean; saving: boolean; error?: string | null; saveError?: string | null }>();
const emit = defineEmits<{ back: []; retry: []; draw: [card: number]; edit: [] }>();
const stage = ref<'intro' | 'choose' | 'result'>('intro');
const deck = ref(shuffleTarotDeck()), pending = ref<number | null>(null);
const page = ref<HTMLElement>(), fan = ref<HTMLElement>(), focusTitle = ref<HTMLElement>();
const pageHeight = ref(938), fanScale = ref(1), imageError = ref(false), imageKey = ref(0);
const selectedId = computed(() => tarotCardId(props.assignment?.response?.response));
const selectedCard = computed(() => selectedId.value !== null ? tarotCards[selectedId.value] : undefined);
const completed = computed(() => props.assignment?.status === 'completed');
const inaccessibleResult = computed(() => completed.value && !selectedCard.value);
const date = computed(() => props.assignment ? shortCalendarDate(props.assignment.available_date).toLocaleUpperCase('ru-RU') : `${props.day} ДЕКАБРЯ`);
const canChoose = computed(() => !!props.assignment?.task && !props.loading && !props.error && !props.saving && pending.value === null && !completed.value && selectedId.value === null);
const decorations = computed(() => stage.value === 'intro' ? tarotDecorations.intro : tarotDecorations.choose);
const decorHeight = computed(() => stage.value === 'intro' ? 938 : stage.value === 'choose' ? 1530 : 1275);
const cssUrl = (url: string) => `url("${url}")`;
const fanCards = [
  { x: 59.69, y: 44.545, angle: -24, border: fanBorderLeft },
  { x: 91.5, y: 31.82, angle: -12, border: fanBorder },
  { x: 176.94, y: 44.545, angle: 24, border: fanBorderRight },
  { x: 145.136, y: 31.82, angle: 12, border: fanBorder },
  { x: 118.318, y: 24.545, angle: 0, border: fanBorder },
];
let observer: ResizeObserver | undefined, resizeFrame = 0;
const pendingSizes = new Map<Element, { width: number; height: number }>();
watch(() => `${props.userId || ''}:${props.assignment?.task_id || ''}`, () => {
  pending.value = null; deck.value = shuffleTarotDeck(); imageError.value = false;
  stage.value = selectedCard.value ? 'result' : 'intro';
}, { immediate: true });
watch(selectedId, id => { if (id !== null) { pending.value = null; stage.value = 'result'; imageError.value = false; nextTick(() => { window.scrollTo({ top: 0, behavior: 'instant' }); focusTitle.value?.focus({ preventScroll: true }); }); } });
watch(fan, element => { if (element) observer?.observe(element); });
async function changeStage(value: 'intro' | 'choose') {
  if (props.saving) return;
  stage.value = value; if (pending.value === null) emit('edit'); await nextTick(); window.scrollTo({ top: 0, behavior: 'instant' }); focusTitle.value?.focus({ preventScroll: true });
}
function choose(id: number) { if (!canChoose.value) return; pending.value = id; emit('draw', id); }
function retryDraw() { const id = selectedId.value ?? pending.value; if (id !== null && !props.saving) emit('draw', id); }
onMounted(() => {
  observer = new ResizeObserver(entries => {
    for (const entry of entries) pendingSizes.set(entry.target, { width: entry.contentRect.width, height: entry.contentRect.height });
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      for (const [element, size] of pendingSizes) {
        if (element === page.value) pageHeight.value = size.height;
        else if (element === fan.value) fanScale.value = size.width / 313;
      }
      pendingSizes.clear();
    });
  });
  if (page.value) observer.observe(page.value);
  if (fan.value) observer.observe(fan.value);
});
onBeforeUnmount(() => { observer?.disconnect(); cancelAnimationFrame(resizeFrame); });
</script>

<template>
  <main ref="page" class="tarot-page" :class="`tarot-state-${stage}`">
    <div class="tarot-decorations" aria-hidden="true"><img v-for="item in decorations" :key="item.id" :src="tarotDecorationImage(item.asset)" :style="{ left: `${item.x / 393 * 100}%`, top: `${item.y / decorHeight * pageHeight}px` }" alt="" /></div>
    <div class="tarot-layout">
      <header class="tarot-header"><img :src="wordmark" alt="ГЕРОФАРМ" /><button class="tarot-back" type="button" @click="emit('back')">← К календарю</button><button v-if="stage === 'result'" class="tarot-result-close" type="button" aria-label="Закрыть карту и вернуться к календарю" @click="emit('back')"><img :src="closeRing" alt="" />×</button></header>
      <section v-if="loading || error || !assignment || !assignment.task || inaccessibleResult" class="tarot-notice tarot-surface" :style="{ '--surface-art': cssUrl(introPanel) }">
        <h1>Что подскажет карта?</h1>
        <p v-if="loading" role="status">Загружаем задание…</p>
        <template v-else-if="error"><p role="alert">{{ error }}</p><button class="tarot-button" type="button" @click="emit('retry')">Попробовать ещё раз</button></template>
        <p v-else-if="!assignment">Задание не найдено.</p>
        <p v-else-if="!assignment.task">Задание пока закрыто. Откроется {{ formatDate(assignment.available_date) }}.</p>
        <p v-else>Для задания уже сохранён результат. Повторный выбор карты недоступен. Обратитесь к организатору, чтобы уточнить сохранённый результат.</p>
      </section>
      <article v-else-if="stage === 'intro'" class="tarot-intro-panel tarot-surface" :style="{ '--surface-art': cssUrl(introPanel) }" aria-labelledby="tarot-intro-title">
        <button class="tarot-close" type="button" aria-label="Закрыть задание и вернуться к календарю" @click="emit('back')">×</button>
        <p class="tarot-date">{{ date }}</p>
        <h1 id="tarot-intro-title" ref="focusTitle" tabindex="-1">Что подскажет карта?</h1>
        <button ref="fan" class="tarot-fan" type="button" :style="{ height: `${200 * fanScale}px` }" aria-label="Перейти к выбору карты" @click="changeStage('choose')">
          <span class="tarot-fan-stage" :style="{ transform: `scale(${fanScale})` }"><span v-for="(item, index) in fanCards" :key="index" class="tarot-fan-card" :style="{ left: `${item.x}px`, top: `${item.y}px`, transform: `rotate(${item.angle}deg)` }"><img class="tarot-fan-image" :src="cardBack" alt="" /><img class="tarot-fan-border" :src="item.border" alt="" /></span><img class="tarot-fan-star" :src="tarotDecorationImage('imgVector7')" alt="" /></span>
        </button>
        <div class="tarot-intro-copy">
          <p>Сегодня добавим в декабрь немного загадочности: предлагаем заглянуть в будущее с помощью карт таро.</p>
          <p>Подумайте, что вам хотелось бы узнать у карт, и задайте свой сокровенный вопрос про себя. Не торопитесь: вытянуть карту можно только один раз за весь адвент.</p>
          <p>Когда будете готовы, нажмите на любую карту в колоде. Перед вами появится карта с небольшим пояснением. Какой смысл найти в ее образах и словах — решать вам.</p>
          <p>Помните: это игра, а не точный прогноз. Пусть карта станет поводом для размышлений, а решения остаются за вами.</p>
        </div>
        <button class="tarot-button tarot-draw" :style="{ backgroundImage: cssUrl(goldButton) }" type="button" @click="changeStage('choose')">✦ Вытащить карту ✦</button>
      </article>
      <article v-else-if="stage === 'choose'" class="tarot-choose-panel tarot-surface" :style="{ '--surface-art': cssUrl(choosePanel) }" aria-labelledby="tarot-choose-title" :aria-busy="saving">
        <button class="tarot-close" type="button" :disabled="saving" aria-label="Вернуться к описанию задания" @click="changeStage('intro')">×</button>
        <h1 id="tarot-choose-title" ref="focusTitle" tabindex="-1">Выберите карту</h1>
        <p class="tarot-instruction">Нажмите на любую карту в колоде.</p>
        <p class="tarot-once">Выбрать можно только один раз за весь адвент.</p>
        <p v-if="saving" class="tarot-status" role="status">Сохраняем вашу карту…</p>
        <div v-if="saveError" class="tarot-error" role="alert"><p>{{ saveError }}</p><button class="tarot-button" :style="{ backgroundImage: cssUrl(goldButton) }" type="button" :disabled="saving" @click="retryDraw">Повторить сохранение</button></div>
        <div class="tarot-deck" role="group" aria-label="Колода из 78 карт">
          <button v-for="(id, index) in deck" :key="index" class="tarot-deck-card" :class="{ 'is-pending': pending === id }" type="button" :aria-label="`Выбрать карту ${index + 1}`" :disabled="!canChoose" @click="choose(id)"><img :src="cardBack" alt="" /></button>
        </div>
      </article>
      <article v-else-if="selectedCard" class="tarot-result" aria-labelledby="tarot-card-title" :aria-busy="saving">
        <div class="tarot-chosen-frame"><img :key="imageKey" class="tarot-chosen-image" :src="selectedCard.image" :alt="`Карта «${selectedCard.name}»`" @error="imageError = true" @load="imageError = false" /></div>
        <p v-if="imageError" role="alert">Не удалось загрузить изображение. <button type="button" @click="imageKey++">Загрузить ещё раз</button></p>
        <section class="tarot-reading tarot-surface" :style="{ '--surface-art': cssUrl(resultPanel) }">
          <img class="tarot-handle" :src="handle" alt="" />
          <h1 id="tarot-card-title" ref="focusTitle" tabindex="-1">{{ selectedCard.name }}</h1>
          <div class="tarot-reading-copy" :class="{ 'has-advice': selectedCard.paragraphs[selectedCard.paragraphs.length - 1]?.startsWith('Совет дня:') }"><p v-for="(paragraph, index) in selectedCard.paragraphs" :key="index">{{ paragraph }}</p></div>
          <p class="tarot-disclaimer">Это игра, а не точный прогноз. Какой смысл найти в карте — решать вам.</p>
          <p v-if="saving" class="tarot-status" role="status">Сохраняем результат…</p>
          <div v-else-if="saveError" class="tarot-error" role="alert"><p>{{ saveError }}</p><p>Выбранная карта сохранена. Повторная попытка не изменит её.</p><button class="tarot-button" :style="{ backgroundImage: cssUrl(goldButton) }" type="button" @click="retryDraw">Повторить сохранение</button></div>
          <button v-else-if="!completed" class="tarot-button tarot-finish" :style="{ backgroundImage: cssUrl(goldButton) }" type="button" @click="retryDraw">Сохранить результат</button>
          <button class="tarot-button tarot-finish" :style="{ backgroundImage: cssUrl(goldButton) }" type="button" @click="emit('back')">✦ К календарю ✦</button>
        </section>
      </article>
      <footer class="tarot-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
  </main>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.ttf') format('truetype'); font-weight: 400 700; font-display: swap; }
:global(#app:has(.tarot-page)) { width: 100%; border: 0; }
.tarot-page { position: relative; isolation: isolate; overflow: clip; width: 100%; min-height: 100svh; color-scheme: dark; color: #fff3df; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; background: linear-gradient(to bottom right, #090807 0%, #291209 22%, #743012 48%, #cf5515 73%, #ff941f 100%); }
.tarot-decorations { position: absolute; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
.tarot-decorations img { position: absolute; }
.tarot-layout { position: relative; box-sizing: border-box; max-width: 960px; margin-inline: auto; padding: 0 clamp(0px, calc((100vw - 313px) / 2), 16px) 27px; }
.tarot-state-choose .tarot-layout, .tarot-state-result .tarot-layout { padding-bottom: 25px; }
.tarot-header { position: relative; box-sizing: border-box; height: 95px; padding-top: 34px; }
.tarot-header > img { display: block; margin-inline: auto; }
.tarot-back { display: flex; align-items: center; position: absolute; top: 48px; left: 0; min-height: 44px; padding: 0 8px; margin: 0; border: 0; background: transparent; color: #fff0c4; font: 400 12px/15px 'Advent Inter', sans-serif; cursor: pointer; }
.tarot-surface { position: relative; isolation: isolate; box-sizing: border-box; }
.tarot-surface::before { content: ''; position: absolute; inset: 0 -.5px; z-index: -1; border: 24px solid transparent; border-image: var(--surface-art) 24 fill / 24px stretch; pointer-events: none; }
.tarot-intro-panel { padding: 34px clamp(16px, calc((100vw - 345px) / 2), 24px) 32px; }
.tarot-date { margin: 0 0 8px; color: #ffe0a0; font-size: 11px; line-height: 13px; font-weight: 700; text-align: center; }
.tarot-intro-panel h1 { margin: 0; color: #ffe3a7; font: 400 28px/35px 'Advent STIX', serif; letter-spacing: 0; text-align: center; }
.tarot-close { position: absolute; top: 9px; right: 6px; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: #fff0c4; font: 400 26px/31px 'Advent Inter', sans-serif; cursor: pointer; }
.tarot-intro-panel .tarot-close { top: 13px; }
.tarot-close:disabled { opacity: .6; cursor: default; }
.tarot-fan { position: relative; display: block; width: 100%; max-width: 420px; padding: 0; margin: 7px auto 10px; border: 0; background: transparent; cursor: pointer; }
.tarot-fan-stage { position: absolute; left: 0; top: 0; display: block; width: 313px; height: 200px; transform-origin: top left; }
.tarot-fan-card { position: absolute; display: block; width: 76.36364px; height: 132.72728px; }
.tarot-fan-image { display: block; width: 76.36364px; height: 132.72728px; border-radius: 4px; }
.tarot-fan-border { position: absolute; left: -.31818px; top: -.31818px; pointer-events: none; }
.tarot-fan-star { position: absolute; left: 277px; top: 0; pointer-events: none; }
.tarot-intro-copy { width: calc(100% + 7px); color: #fff7e8; }
.tarot-intro-copy p { margin: 0 0 20px; }
.tarot-intro-copy p:last-child { margin-bottom: 0; }
.tarot-button { position: relative; left: 50%; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 313px; min-width: 313px; max-width: 313px; height: 60px; min-height: 60px; padding: 0 16px; margin-inline: 0; border: 0; border-radius: 18px; background-color: #e0b965; background-size: 100% 100%; color: #663319; font: 700 15px/18px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: center; cursor: pointer; }
.tarot-button:disabled { opacity: .7; cursor: default; }
.tarot-button:not(:disabled):hover { filter: brightness(1.06); }
.tarot-draw { margin-top: 38px; }
.tarot-choose-panel { width: calc(100% - 1px); margin-left: 1px; padding: 23px 14px 32px; }
.tarot-choose-panel h1 { margin: 0 40px 14px 0; color: #f4dca8; font: 400 26px/33px 'Advent STIX', serif; letter-spacing: 0; }
.tarot-instruction { margin: 0; color: #fff0c4; font-size: 13px; line-height: 16px; }
.tarot-once { margin: 5px 0 0; color: #fff0c4; font-size: 12px; line-height: 15px; }
.tarot-deck { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); column-gap: 6px; row-gap: 11px; width: min(100%, 660px); margin: 21px auto 0; }
.tarot-deck-card { display: block; box-sizing: border-box; min-width: 0; width: 100%; aspect-ratio: 50 / 83; padding: 0; margin: 0; border: 0; border-radius: 3px; background: transparent; cursor: pointer; transition: transform 160ms ease; }
.tarot-deck-card img { display: block; width: 100%; height: 100%; border-radius: 3px; }
.tarot-deck-card:not(:disabled):hover { transform: translateY(-3px); }
.tarot-deck-card:disabled { opacity: .7; cursor: default; }
.tarot-deck-card.is-pending { outline: 2px solid #ffe0a0; opacity: 1; }
.tarot-result { margin-top: 2px; }
.tarot-chosen-frame { width: min(100%, 303px); aspect-ratio: 303 / 474; margin: 0 auto 16px; }
.tarot-chosen-image { display: block; width: 100%; height: 100%; object-fit: fill; }
.tarot-reading { width: calc(100% - 2px); margin-left: 1px; padding: 36px clamp(16px, calc((100vw - 345px) / 2), 24px) 35px clamp(16px, calc((100vw - 343px) / 2), 25px); }
.tarot-handle { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); }
.tarot-reading h1 { margin: 0 0 14px; color: #ffe3a7; font: 400 26px/33px 'Advent STIX', serif; letter-spacing: 0; }
.tarot-reading-copy p { margin: 0 0 20px; }
.tarot-reading-copy p:last-child { margin-bottom: 0; }
.tarot-reading-copy.has-advice p:nth-last-child(2) { margin-bottom: 0; }
.tarot-disclaimer { margin: 20px 0 0; color: #f5d99d; font-size: 14px; line-height: 20px; font-style: italic; }
.tarot-finish { margin-top: 27px; }
.tarot-result-close { position: absolute; display: flex; align-items: center; justify-content: center; top: 48px; right: -1px; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: #fff0c4; font: 400 26px/31px 'Advent Inter', sans-serif; cursor: pointer; }
.tarot-result-close img { position: absolute; z-index: -1; top: 5px; left: 5px; }
.tarot-status, .tarot-error { margin-top: 16px; color: #ffe0a0; font-size: 13px; line-height: 18px; overflow-wrap: anywhere; }
.tarot-error p { margin: 0 0 12px; }
.tarot-notice { padding: 32px 24px; min-height: 250px; }
.tarot-notice h1 { color: #ffe3a7; font: 400 28px/35px 'Advent STIX', serif; letter-spacing: 0; }
.tarot-footer { margin-top: 24px; color: #fff0c4; font-size: 12px; line-height: 15px; text-align: center; }
.tarot-result + .tarot-footer { margin-top: 23px; }
.tarot-choose-panel + .tarot-footer { margin-top: 25px; }
.tarot-back:focus-visible, .tarot-close:focus-visible, .tarot-result-close:focus-visible, .tarot-button:focus-visible, .tarot-fan:focus-visible, .tarot-deck-card:focus-visible { outline: 2px solid #ffe0a0; outline-offset: 0; }
h1:focus { outline: 0; }
@media (min-width: 768px) { .tarot-layout { padding-inline: 32px; } .tarot-intro-panel, .tarot-reading { padding-inline: 32px; } .tarot-choose-panel { padding-inline: 24px; } }
@media (max-width: 767px) { .tarot-deck { max-width: 330px; } }
@media (prefers-reduced-motion: reduce) { .tarot-deck-card { transition: none; } .tarot-deck-card:not(:disabled):hover { transform: none; } }
</style>
