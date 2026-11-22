<script setup lang="ts">
import FeedbackState from './ui/FeedbackState.vue';
import { useElementRef } from '../composables/useElementRef';
import LoadingState from './ui/LoadingState.vue';
import AppButton from './ui/AppButton.vue';
import TaskLayout from './ui/TaskLayout.vue';
import AppHeader from './ui/AppHeader.vue';
import AppCard from './ui/AppCard.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CalendarTask } from '../types/models';
import { formatDate } from '../utils/date';
import { crosswordCells, crosswordSolution, crosswordWords, isCrosswordSolution, normalizeCrossword, wordKeys, type CrosswordValues } from '../utils/crossword';
import wordmark from '../assets/first-task/wordmark.svg';
import wreath from '../assets/crossword/wreath.svg';
import dot from '../assets/crossword/dot.svg';
import rulesArt from '../assets/crossword/rules.svg';
import numberArt from '../assets/crossword/number.svg';
import badge from '../assets/crossword/badge.svg';
import zoomArt from '../assets/crossword/zoom.svg';
import zoomDivider from '../assets/crossword/zoom-divider.svg';
import questionsArt from '../assets/crossword/questions.svg';
import questionArt from '../assets/crossword/question.svg';
import inputArt from '../assets/crossword/input.svg';
import gridArt from '../assets/crossword/grid.svg';
import cellArt from '../assets/crossword/cell.svg';
import selectedArt from '../assets/crossword/selected.svg';
import correctArt from '../assets/crossword/correct.svg';
import selectedCorrectArt from '../assets/crossword/selectedCorrect.svg';
import wrongArt from '../assets/crossword/wrong.svg';
import clueArt from '../assets/crossword/clue.svg';

const props = defineProps<{ assignment?: CalendarTask; day: number; total?: number; userId?: string; loading: boolean; saving: boolean; error?: string | null; saveError?: string | null }>();
const emit = defineEmits<{ back: []; retry: []; submit: [values: CrosswordValues]; edit: [] }>();
const started = ref(false), expanded = ref(false), selected = ref(1), values = ref<CrosswordValues>({});
const bulk = ref(''), lengthError = ref(false), inserted = ref(false), checked = ref(false);
const zoom = ref(59), manualZoom = ref(false), gridViewport = ref<HTMLElement>(), activeCard = ref<HTMLElement>();
const { element: card, bind: bindCard } = useElementRef();
const cardWidth = ref(361), cardHeight = ref(906);
const borderDots = computed(() => {
  const points: { left: string; top: string }[] = [];
  const add = (x: number, y: number) => points.push({ left: `${x - 1.45}px`, top: `${y - 1.45}px` });
  const w = cardWidth.value, h = cardHeight.value, inset = 6, radius = 18;
  const horizontal = Math.max(1, Math.round((w - 2 * (inset + radius)) / 11));
  const vertical = Math.max(1, Math.round((h - 2 * (inset + radius)) / 11));
  for (let i = 0; i <= horizontal; i++) { const x = inset + radius + i * (w - 2 * (inset + radius)) / horizontal; add(x, inset); add(x, h - inset); }
  for (let i = 0; i <= vertical; i++) { const y = inset + radius + i * (h - 2 * (inset + radius)) / vertical; add(inset, y); add(w - inset, y); }
  for (const [cx, cy, start] of [[inset + radius, inset + radius, 180], [w - inset - radius, inset + radius, 270], [w - inset - radius, h - inset - radius, 0], [inset + radius, h - inset - radius, 90]]) for (const angle of [30, 60]) { const rad = (start! + angle) * Math.PI / 180; add(cx! + radius * Math.cos(rad), cy! + radius * Math.sin(rad)); }
  return points;
});
const completed = computed(() => props.assignment?.status === 'completed');
const word = computed(() => crosswordWords.find(w => w.number === selected.value)!);
const path = computed(() => wordKeys(word.value));
const count = computed(() => crosswordWords.filter(w => wordKeys(w).every(key => values.value[key])).length);
const size = computed(() => Math.round(34 * zoom.value / 100));
const date = computed(() => `${Number(props.assignment?.available_date?.slice(8, 10)) || props.day} ДЕКАБРЯ`);
const storageKey = computed(() => props.userId && props.assignment?.task_id ? `advent-crossword-v1:${props.userId}:${props.assignment.task_id}` : '');
const wordsByDirection = { across: crosswordWords.filter(word => word.direction === 'across'), down: crosswordWords.filter(word => word.direction === 'down') };
const cssUrl = (url: string) => `url("${url}")`;
const art = (url: string) => ({ '--surface-art': cssUrl(url) });
let observer: ResizeObserver | undefined;
let resizeFrame = 0;
const pendingSizes = new Map<Element, { width: number; height: number }>();
function readWord() { bulk.value = path.value.map(key => values.value[key] || '').join(''); lengthError.value = false; inserted.value = false; }
watch([storageKey, completed], () => {
  values.value = {}; started.value = false; checked.value = false; selected.value = 1;
  if (completed.value) { values.value = { ...crosswordSolution }; started.value = true; checked.value = true; }
  else if (storageKey.value) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey.value) || 'null');
      if (saved && typeof saved === 'object') {
        for (const cell of crosswordCells) if (typeof saved[cell.key] === 'string') values.value[cell.key] = normalizeCrossword(saved[cell.key]).slice(0, 1);
        started.value = Object.values(values.value).some(Boolean);
      }
    } catch { /* Storage may be unavailable; the crossword still works. */ }
  }
  readWord();
}, { immediate: true });
watch(values, () => {
  if (!storageKey.value) return;
  try { if (completed.value) sessionStorage.removeItem(storageKey.value); else sessionStorage.setItem(storageKey.value, JSON.stringify(values.value)); } catch { /* Optional local draft. */ }
}, { deep: true });
watch(gridViewport, element => { if (element) observer?.observe(element); });
function edited() { checked.value = false; inserted.value = false; lengthError.value = false; emit('edit'); }
function selectWord(number: number) { selected.value = number; readWord(); }
function navigate(delta: number) { selectWord((selected.value - 1 + delta + 10) % 10 + 1); }
function inputBulk(event: Event) {
  bulk.value = normalizeCrossword((event.target as HTMLInputElement).value).slice(0, 32);
  (event.target as HTMLInputElement).value = bulk.value; lengthError.value = false; inserted.value = false; emit('edit');
}
function insertWord() {
  if (props.saving || completed.value) return;
  if (bulk.value.length !== word.value.answer.length) { lengthError.value = true; inserted.value = false; return; }
  edited(); path.value.forEach((key, i) => { values.value[key] = bulk.value[i]!; }); inserted.value = true;
}
function focusCell(key: string) {
  nextTick(() => {
    const input = gridViewport.value?.querySelector<HTMLInputElement>(`[data-cell="${key}"]`);
    input?.focus({ preventScroll: true }); input?.select();
    if (input && gridViewport.value) {
      const r = input.getBoundingClientRect(), v = gridViewport.value.getBoundingClientRect();
      if (r.left < v.left) gridViewport.value.scrollLeft -= v.left - r.left + 4;
      if (r.right > v.right) gridViewport.value.scrollLeft += r.right - v.right + 4;
    }
  });
}
function chooseCell(cell: typeof crosswordCells[number], cycle = false) {
  if (!cell.words.includes(selected.value)) selectWord(cell.words[0]!);
  else if (cycle && cell.words.length > 1) selectWord(cell.words[(cell.words.indexOf(selected.value) + 1) % cell.words.length]!);
}
function setCell(key: string, raw: string) {
  if (props.saving || completed.value) return;
  const text = normalizeCrossword(raw); const index = path.value.indexOf(key);
  edited();
  if (!text) values.value[key] = '';
  else if (index >= 0) {
    const letters = text.slice(0, path.value.length - index);
    for (let i = 0; i < letters.length; i++) values.value[path.value[index + i]!] = letters[i]!;
    focusCell(path.value[Math.min(index + letters.length, path.value.length - 1)]!);
  }
  readWord();
}
function cellInput(cell: typeof crosswordCells[number], event: Event) {
  const input = event.target as HTMLInputElement; chooseCell(cell); setCell(cell.key, input.value); input.value = values.value[cell.key] || '';
}
function cellKey(cell: typeof crosswordCells[number], event: KeyboardEvent) {
  const directions: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
  const direction = directions[event.key];
  if (direction) {
    event.preventDefault(); const next = crosswordCells.find(c => c.row === cell.row + direction[0] && c.col === cell.col + direction[1]);
    if (next) { const axis = direction[0] ? 'down' : 'across'; const match = crosswordWords.find(w => w.direction === axis && wordKeys(w).includes(next.key)); if (match) selectWord(match.number); focusCell(next.key); }
  } else if (event.key === 'Backspace' && !props.saving && !completed.value) {
    event.preventDefault(); const index = path.value.indexOf(cell.key); const key = values.value[cell.key] ? cell.key : path.value[Math.max(0, index - 1)]!;
    edited(); values.value[key] = ''; readWord(); focusCell(key);
  } else if (event.key === 'Enter') { event.preventDefault(); navigate(1); focusCell(path.value[0]!); }
}
function pasteCell(cell: typeof crosswordCells[number], event: ClipboardEvent) { event.preventDefault(); chooseCell(cell); setCell(cell.key, event.clipboardData?.getData('text') || ''); }
function cellSurface(cell: typeof crosswordCells[number]) {
  if (checked.value) return values.value[cell.key] === cell.answer ? (path.value.includes(cell.key) ? selectedCorrectArt : correctArt) : wrongArt;
  return path.value.includes(cell.key) ? selectedArt : cellArt;
}
function check() {
  if (props.saving || completed.value) return;
  checked.value = true; emit('edit');
  if (isCrosswordSolution(values.value)) emit('submit', { ...values.value });
}
function changeZoom(delta: number) { manualZoom.value = true; zoom.value = Math.max(40, Math.min(150, zoom.value + delta)); }
onMounted(() => {
  observer = new ResizeObserver(entries => {
    for (const entry of entries) pendingSizes.set(entry.target, { width: entry.contentRect.width, height: entry.contentRect.height });
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      for (const [element, dimensions] of pendingSizes) {
        if (element === card.value) { cardWidth.value = (element as HTMLElement).offsetWidth; cardHeight.value = (element as HTMLElement).offsetHeight; }
        else if (!manualZoom.value) {
          const fittingCellSize = Math.floor((dimensions.width + 2) / 13) - 2;
          zoom.value = Math.min(100, Math.max(40, Math.floor(fittingCellSize / 34 * 100)));
        }
      }
      pendingSizes.clear();
    });
  });
  if (card.value) observer.observe(card.value);
  if (gridViewport.value) observer.observe(gridViewport.value);
});
onBeforeUnmount(() => { observer?.disconnect(); cancelAnimationFrame(resizeFrame); pendingSizes.clear(); });
</script>

<template>
  <TaskLayout background-variant="night" class="crossword-page">
    <div class="crossword-layout">
      <AppHeader class="crossword-header"><img decoding="async" :src="wordmark" alt="ГЕРОФАРМ" /><AppButton class="calendar-back" @click="emit('back')">← К календарю</AppButton></AppHeader>
      <AppCard :ref="bindCard" class="crossword-card" :class="{ 'is-playing': started }" aria-labelledby="crossword-title">
        <div class="card-dots" aria-hidden="true"><img decoding="async" v-for="(point, index) in borderDots" :key="index" :src="dot" :style="point" alt="" /></div>
        <img decoding="async" class="crossword-wreath" :src="wreath" alt="" />
        <p class="crossword-date">{{ date }}</p>
        <h1 id="crossword-title">Качество начинается с деталей</h1>
        <div class="crossword-badge" :style="{ backgroundImage: cssUrl(badge) }">Обязательное задание</div>
        <LoadingState v-if="loading" class="notice" role="status" />
        <FeedbackState v-else-if="error" kind="error" class="notice"><p>{{ error }}</p><AppButton class="crossword-button" @click="emit('retry')">Попробовать ещё раз</AppButton></FeedbackState>
        <FeedbackState v-else-if="!assignment" class="notice" role="status" message="Задание не найдено." />
        <p v-else-if="!assignment.task" class="notice" role="status">Задание пока закрыто. Откроется {{ formatDate(assignment.available_date) }}.</p>
        <template v-else-if="!started">
          <div class="crossword-copy">
            <p>В нашей работе важна каждая деталь. Департамент качества помогает следить за тем, чтобы процессы и продукция соответствовали установленным требованиям.</p>
            <p>Сегодня коллеги предлагают проверить свои знания и внимательность — разгадать кроссворд о качестве.</p>
            <p class="mandatory">*Прочитайте вопросы и заполните все клетки. Это обязательное задание: для его выполнения нужно правильно разгадать весь кроссворд.</p>
          </div>
          <section class="crossword-rules surface" :style="art(rulesArt)" aria-labelledby="rules-title">
            <h2 id="rules-title">Правила</h2>
            <ol>
              <li><span :style="{ backgroundImage: cssUrl(numberArt) }">1</span><p>Номер вопроса соответствует номеру начальной клетки слова. Ответы вписывайте по горизонтали или вертикали — в зависимости от раздела с вопросами.</p></li>
              <li><span :style="{ backgroundImage: cssUrl(numberArt) }">2</span><p>В каждую клетку впишите только одну букву.</p></li>
              <li><span :style="{ backgroundImage: cssUrl(numberArt) }">3</span><p>Если в вопросе не указано иначе, используйте существительное в именительном падеже и единственном числе.</p></li>
            </ol>
          </section>
          <AppButton class="crossword-button start-button" @click="started = true"><span>Начать кроссворд</span></AppButton>
        </template>
        <div v-else class="crossword-game" :class="{ completed, 'is-expanded': expanded }" :aria-busy="saving">
          <AppButton class="crossword-button outline" @click="started = false">← К описанию задания</AppButton>
          <section class="questions surface" :style="art(questionsArt)">
            <AppButton class="questions-toggle" :aria-expanded="expanded" aria-controls="all-crossword-questions" @click="expanded = !expanded">{{ expanded ? '▾' : '▸' }} Все вопросы · 10</AppButton>
            <div v-if="expanded" id="all-crossword-questions" class="all-questions">
              <section v-for="direction in ['across', 'down']" :key="direction">
                <h2>{{ direction === 'across' ? 'По горизонтали' : 'По вертикали' }}</h2>
                <AppButton v-for="item in wordsByDirection[direction]" :key="item.number" class="clue-option surface" :style="art(clueArt)" :aria-pressed="selected === item.number" @click="selectWord(item.number); expanded = false; nextTick(() => activeCard?.scrollIntoView({ block: 'nearest' }))">{{ item.number }}. {{ item.clue }} ({{ item.answer.length }} {{ item.answer.length === 4 ? 'буквы' : 'букв' }})</AppButton>
              </section>
            </div>
          </section>
          <p class="filled-count" aria-live="polite">Заполнено {{ count }} из 10 слов</p>
          <section ref="activeCard" class="active-question surface" :style="art(questionArt)" aria-labelledby="active-clue-title">
            <h2 id="active-clue-title">Вопрос {{ word.number }} · {{ word.direction === 'across' ? 'По горизонтали' : 'По вертикали' }}</h2>
            <p id="active-clue-copy" class="clue-copy">{{ word.clue }}</p>
            <form @submit.prevent="insertWord">
              <label for="crossword-answer">Ответ</label>
              <div class="word-input surface" :class="{ invalid: lengthError }" :style="art(inputArt)"><input id="crossword-answer" :value="bulk" :readonly="completed" :disabled="saving" autocomplete="off" autocapitalize="characters" spellcheck="false" :aria-invalid="lengthError" aria-describedby="active-clue-copy answer-length" @input="inputBulk" /></div>
              <p id="answer-length" class="answer-length" :class="{ invalid: lengthError }" :role="lengthError ? 'alert' : 'status'">{{ lengthError ? `Нужно ${word.answer.length} букв. Введено ${bulk.length}` : inserted ? 'Ответ вставлен в сетку' : `${bulk.length} из ${word.answer.length} букв` }}</p>
              <AppButton class="crossword-button insert-button" :disabled="saving || completed"><span>Вставить в сетку</span></AppButton>
            </form>
            <nav class="question-navigation" aria-label="Вопросы кроссворда"><AppButton @click="navigate(-1)">← Предыдущий</AppButton><span>{{ selected }} / 10</span><AppButton @click="navigate(1)">Следующий →</AppButton></nav>
          </section>
          <p class="grid-help">Вводите буквы прямо в клетки или вставьте целое слово через поле выше.</p>
          <div class="crossword-zoom" aria-label="Масштаб кроссворда"><img decoding="async" class="zoom-art" :src="zoomArt" alt="" /><img decoding="async" class="zoom-divider" :src="zoomDivider" alt="" /><AppButton :disabled="zoom <= 40" aria-label="Уменьшить кроссворд" @click="changeZoom(-10)">−</AppButton><output aria-live="polite">{{ zoom }}%</output><AppButton :disabled="zoom >= 150" aria-label="Увеличить кроссворд" @click="changeZoom(10)">+</AppButton></div>
          <div class="grid-panel surface" :style="art(gridArt)">
            <div ref="gridViewport" class="grid-viewport" tabindex="0" aria-label="Сетка кроссворда. Стрелки перемещают по клеткам; увеличенную сетку можно прокручивать.">
              <div class="crossword-grid" :style="{ width: `${13 * (size + 2) - 2}px`, height: `${15 * (size + 2) - 2}px`, '--cell-size': `${size}px` }">
                <div v-for="cell in crosswordCells" :key="cell.key" class="crossword-cell surface" :style="{ ...art(cellSurface(cell)), left: `${cell.col * (size + 2)}px`, top: `${cell.row * (size + 2)}px` }" :class="{ selected: path.includes(cell.key), correct: checked && values[cell.key] === cell.answer, wrong: checked && values[cell.key] !== cell.answer }">
                  <span v-if="cell.number" class="cell-number">{{ cell.number }}</span>
                  <input :data-cell="cell.key" :value="values[cell.key] || ''" :readonly="completed" :disabled="saving" :aria-label="`Строка ${cell.row + 1}, столбец ${cell.col + 1}${cell.number ? `, начало вопроса ${cell.number}` : ''}`" :aria-invalid="checked && values[cell.key] !== cell.answer" autocomplete="off" autocapitalize="characters" spellcheck="false" @focus="chooseCell(cell)" @click="chooseCell(cell, true); ($event.target as HTMLInputElement).select()" @input="cellInput(cell, $event)" @keydown="cellKey(cell, $event)" @paste="pasteCell(cell, $event)" />
                </div>
              </div>
            </div>
          </div>
          <AppButton class="crossword-button check-button" :disabled="saving || completed" @click="check"><span>{{ saving ? 'Сохраняем…' : 'Проверить кроссворд' }}</span></AppButton>
          <p v-if="completed" class="result success" role="status">Все слова на своих местах! Кроссворд разгадан, обязательное задание выполнено</p>
          <p v-else-if="saveError" class="result invalid" role="alert">{{ saveError }}</p>
          <p v-else-if="checked && !isCrosswordSolution(values)" class="result invalid" role="alert">Не все ответы совпали. Проверьте вопросы и пересечения слов — и попробуйте еще раз</p>
        </div>
      </AppCard>
      <footer class="crossword-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
  </TaskLayout>
</template>

<style scoped>
:global(#app:has(.crossword-page)) { width: 100%; border: 0; }
.crossword-page { min-height: 100svh; width: 100%; overflow: clip; color-scheme: light; color: #70492c;  font: 400 14px/20px var(--font-ui); text-align: left; letter-spacing: 0; }
.crossword-layout { box-sizing: border-box; max-width: 960px; margin-inline: auto; padding: 0 clamp(0px, calc((100vw - 313px) / 2), 16px) 39px; }
.crossword-header { position: relative; height: 94px; box-sizing: border-box; padding-top: 34px; }
.crossword-header > img { display: block; margin-inline: auto; }
button { cursor: pointer; font-family: inherit; letter-spacing: 0; }
.calendar-back { display: flex; align-items: center; position: absolute; top: 48px; left: 0; min-height: 44px; padding: 0 8px; border: 0; background: transparent; color: #fff1cf; font-size: 12px; font-weight: 400; }
.crossword-card { position: relative; isolation: isolate; box-sizing: border-box; padding: 29px clamp(16px, calc((100vw - 345px) / 2), 24px) 28px; border-radius: 24px; background: linear-gradient(90deg, #e8b77e 0%, #ffe6bc 19.2308%, var(--color-cream) 73.0769%, #efc087 100%); }
.crossword-card.is-playing { padding-bottom: 42px; }
.card-dots { position: absolute; pointer-events: none; inset: 0; }
.card-dots img { position: absolute; }
.crossword-wreath { position: absolute; right: 25.46px; top: 25px; }
.crossword-date { margin: 0 0 14px; color: var(--color-action); font-size: 12px; line-height: 15px; font-weight: 700; }
h1 { margin: 0; color: var(--color-ink); font: 500 28px/30px var(--font-display); letter-spacing: 0; }
.crossword-badge { width: 140px; height: 25px; display: flex; align-items: center; justify-content: center; margin-top: 11px; color: var(--color-cream); font-size: 11px; line-height: 13px; background-repeat: no-repeat; }
.notice, .crossword-copy { margin-top: 24px; color: #836045; }
.crossword-copy p { margin: 0 0 20px; }
.crossword-copy .mandatory { margin-bottom: 0; color: var(--color-action); font-size: 12px; line-height: 18px; }
.surface { position: relative; isolation: isolate; }
.surface::before { content: ''; position: absolute; inset: -.5px; z-index: -1; pointer-events: none; border: 12px solid transparent; border-image: var(--surface-art) 12 fill / 12px stretch; }
.crossword-rules { margin-top: 28px; padding: 16px; }
.crossword-rules h2 { margin: 0 0 26px; color: var(--color-action); font: 500 20px/24px var(--font-display); }
.crossword-rules ol { padding: 0; margin: 0; list-style: none; display: grid; gap: 12px; }
.crossword-rules li { display: flex; gap: 10px; align-items: flex-start; }
.crossword-rules li > span { flex: 0 0 22px; height: 22px; text-align: center; color: var(--color-cream); font-weight: 700; font-size: 12px; line-height: 22px; }
.crossword-rules li p { margin: 0; }
.crossword-button { display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: min(100%, 313px); min-height: 52px; padding: 10px 16px; margin-inline: auto; border: 0; border-radius: 13px; background: var(--color-action); color: #fff7df; font: 700 14px/17px var(--font-ui); text-align: center; }
.crossword-button:disabled { opacity: .65; cursor: default; }
.completed .crossword-button:disabled { opacity: 1; }
.crossword-button > span { color: transparent; background-clip: text; background-image: linear-gradient(77.3594deg, #e8b77e .55732%, #ffe6bc 19.578%, var(--color-cream) 72.836%, #efc087 99.465%); }
.crossword-button:not(:disabled):hover { background: var(--color-action-hover); }
button:focus-visible, .grid-viewport:focus-visible { outline: 2px solid var(--color-ink); outline-offset: 0; }
.start-button { margin-top: 20px; border: 1px solid var(--color-action); }
.crossword-game { margin-top: 23px; }
.crossword-game.is-expanded { margin-top: 24px; }
.is-expanded .questions { margin-top: 16px; }
.outline { border: 1px solid var(--color-action); background: #fff8e9; color: var(--color-action); }
.outline:not(:disabled):hover { background: #fff1cf; }
.questions { margin-top: 11px; }
.questions-toggle { width: 100%; height: 48px; padding: 0 16px; border: 0; background: transparent; color: var(--color-action); font-size: 14px; font-weight: 700; text-align: left; }
.all-questions { padding: 2px 16px 22px; }
.all-questions section + section { margin-top: 24px; }
.all-questions h2 { margin: 0 0 12px; color: #70492c; letter-spacing: 0; font: 400 18px/22px var(--font-ui); }
.clue-option { display: block; width: 100%; padding: 16px; margin: 0 0 12px; border: 0; border-radius: 14px; background: transparent; color: #70492c; text-align: left; font: 400 14px/20px var(--font-ui); }
.clue-option:last-child { margin-bottom: 0; }
.clue-option:hover { border-color: var(--color-action); }
.filled-count { margin: 26px 0 14px; font-size: 13px; line-height: 16px; font-weight: 700; }
.is-expanded .filled-count { margin-top: 18px; }
.active-question { padding: 18px 16px 0; }
.active-question h2 { margin: 0 0 10px; color: var(--color-action); letter-spacing: 0; font: 700 12px/15px var(--font-ui); }
.clue-copy { margin: 0 0 12px; }
.active-question label { display: block; margin-bottom: 7px; font-weight: 700; line-height: 17px; }
.word-input { height: 48px; }
.word-input::before { border-width: 8px; border-image-slice: 8; border-image-width: 8px; }
.word-input input { display: block; box-sizing: border-box; width: 100%; height: 48px; border: 0; border-radius: 8px; padding: 0 10px; background: transparent; color: var(--color-ink); font: 400 18px/22px var(--font-ui); text-align: center; }
.word-input.invalid { outline: 1px solid var(--color-action); border-radius: 8px; }
.word-input input:focus-visible { outline: 1px solid #a7401d; outline-offset: 0; }
.answer-length { margin: 8px 0 12px; min-height: 16px; font-size: 13px; line-height: 16px; }
.invalid { color: var(--color-action); }
.insert-button { width: min(100%, 281px); }
.question-navigation { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 20px; min-height: 47px; font-size: 12px; line-height: 15px; color: #836045; }
.question-navigation button { min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--color-action); font-size: 12px; font-weight: 700; white-space: nowrap; }
.grid-help { margin: 12px 0 25px; max-width: 297px; color: #836045; font-size: 12px; line-height: 16px; }
.is-expanded .grid-help { line-height: 18px; }
.crossword-zoom { position: relative; isolation: isolate; display: flex; align-items: center; width: 118px; height: 34px; margin-bottom: 12px; }
.zoom-art { position: absolute; top: -.5px; left: -.5px; z-index: -1; pointer-events: none; }
.zoom-divider { position: absolute; top: 0; left: 36.5px; z-index: -1; pointer-events: none; }
.crossword-zoom button { flex: 0 0 37px; height: 34px; border: 0; padding: 0; background: transparent; color: var(--color-action); font-size: 18px; font-weight: 700; }
.crossword-zoom button:disabled { opacity: .4; }
.crossword-zoom output { flex: 1; color: #836045; font-size: 12px; text-align: center; }
.grid-panel { padding: 11px; }
.grid-viewport { display: flex; overflow: auto; padding: 4px; scrollbar-width: thin; scrollbar-color: #cfaa7e #fff8e9; touch-action: pan-x pan-y; }
.crossword-grid { position: relative; margin-inline: auto; flex: none; }
.crossword-cell { position: absolute; width: var(--cell-size); height: var(--cell-size); }
.crossword-cell::before { border: 3px solid transparent; border-image: var(--surface-art) 3 fill / 3px stretch; }
.cell-number { position: absolute; top: 1px; left: 2px; pointer-events: none; color: #836045; font-size: calc(var(--cell-size) * .22); line-height: 1.2; }
.crossword-cell input { display: block; box-sizing: border-box; width: 100%; height: 100%; padding: 0; margin: 0; border: 0; border-radius: 3px; outline-offset: 0; background: transparent; color: var(--color-ink); caret-color: var(--color-action); font: 400 calc(var(--cell-size) * .5)/1 var(--font-ui); text-align: center; }
.crossword-cell input:focus-visible { outline: 1px solid #a7401d; }
.check-button { margin-top: 24px; }
.result { margin: 20px 16px 0; line-height: 20px; }
.success { color: #447047; }
.crossword-footer { margin-top: 27px; color: #fff1cf; font-size: 12px; line-height: 15px; font-weight: 400; text-align: center; }
@media (min-width: 768px) { .crossword-layout { padding-inline: 32px; } .crossword-card { padding-inline: 32px; } }
</style>
