<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CalendarTask } from '../types/models';
import { formatDate } from '../utils/date';
import { shortCalendarDate } from '../utils/calendar';
import { isStereogramSolution, STEREOGRAM_LETTERS, stereogramLetters } from '../utils/stereogram';
import wordmark from '../assets/stereogram/wordmark.svg';
import panelArt from '../assets/stereogram/panel.svg';
import wreath from '../assets/stereogram/wreath.svg';
import badge from '../assets/stereogram/badge.svg';
import instructions from '../assets/stereogram/instructions.svg';
import placeholder from '../assets/stereogram/photo-placeholder.svg';
import cell from '../assets/stereogram/cell.svg';
import button from '../assets/stereogram/button.svg';
import errorArt from '../assets/stereogram/error.svg';
import successArt from '../assets/stereogram/success.svg';
import dot from '../assets/crossword/dot.svg';

const props = defineProps<{ assignment?: CalendarTask; day: number; total?: number; loading: boolean; saving: boolean; error?: string | null; saveError?: string | null }>();
const emit = defineEmits<{ back: []; retry: []; submit: [letters: string[]]; edit: [] }>();
const letters = ref<string[]>(STEREOGRAM_LETTERS.map(() => ''));
const incorrect = ref(false), inputRefs = ref<HTMLInputElement[]>([]);
const panel = ref<HTMLElement>(), panelWidth = ref(361), panelHeight = ref(1095);
const completed = computed(() => props.assignment?.status === 'completed');
const locked = computed(() => props.loading || props.saving || completed.value || !props.assignment?.task);
const date = computed(() => props.assignment ? shortCalendarDate(props.assignment.available_date).toLocaleUpperCase('ru-RU') : `${props.day} ДЕКАБРЯ`);
const cssUrl = (url: string) => `url("${url}")`;
const borderDots = computed(() => {
  // Same responsive dot geometry as the existing crossword card; reuse its original SVG.
  const points: { left: string; top: string }[] = [];
  const add = (x: number, y: number) => points.push({ left: `${x - 1.45}px`, top: `${y - 1.45}px` });
  const w = panelWidth.value, h = panelHeight.value, inset = 6, radius = 18;
  const horizontal = Math.max(1, Math.round((w - 2 * (inset + radius)) / 11));
  const vertical = Math.max(1, Math.round((h - 2 * (inset + radius)) / 11));
  for (let i = 0; i <= horizontal; i++) { const x = inset + radius + i * (w - 2 * (inset + radius)) / horizontal; add(x, inset); add(x, h - inset); }
  for (let i = 0; i <= vertical; i++) { const y = inset + radius + i * (h - 2 * (inset + radius)) / vertical; add(inset, y); add(w - inset, y); }
  for (const [cx, cy, start] of [[inset + radius, inset + radius, 180], [w - inset - radius, inset + radius, 270], [w - inset - radius, h - inset - radius, 0], [inset + radius, h - inset - radius, 90]]) for (const angle of [30, 60]) { const rad = (start! + angle) * Math.PI / 180; add(cx! + radius * Math.cos(rad), cy! + radius * Math.sin(rad)); }
  return points;
});
let observer: ResizeObserver | undefined;
function focus(index: number) { const input = inputRefs.value[Math.min(letters.value.length - 1, Math.max(0, index))]; input?.focus(); input?.select(); }
function edit() { incorrect.value = false; emit('edit'); }
function distribute(text: string, index: number) {
  const clean = stereogramLetters(text);
  if (!clean.length || locked.value) return;
  edit(); const start = clean.length >= letters.value.length ? 0 : index;
  clean.slice(0, letters.value.length - start).forEach((letter, offset) => { letters.value[start + offset] = letter; });
  void nextTick(() => focus(start + clean.length));
}
function input(event: Event, index: number) {
  const target = event.target as HTMLInputElement;
  if (locked.value) { target.value = letters.value[index] || ''; return; }
  if (event instanceof InputEvent && event.isComposing) return;
  const clean = stereogramLetters(target.value);
  if (clean.length > 1) distribute(target.value, index);
  else { edit(); letters.value[index] = clean[0] || ''; if (clean.length && index < letters.value.length - 1) focus(index + 1); }
  target.value = letters.value[index] || '';
}
function paste(event: ClipboardEvent, index: number) { event.preventDefault(); distribute(event.clipboardData?.getData('text') || '', index); }
function keydown(event: KeyboardEvent, index: number) {
  if (locked.value) return;
  if (event.key === 'Backspace') {
    event.preventDefault(); edit();
    if (letters.value[index]) letters.value[index] = '';
    else if (index) { letters.value[index - 1] = ''; focus(index - 1); }
  } else if (event.key === 'Delete') { event.preventDefault(); edit(); letters.value[index] = ''; }
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); focus(index + (event.key === 'ArrowLeft' ? -1 : 1)); }
  else if (event.key === 'Home') { event.preventDefault(); focus(0); }
  else if (event.key === 'End') { event.preventDefault(); focus(letters.value.length - 1); }
}
function submit() {
  if (locked.value) return;
  if (!isStereogramSolution(letters.value)) { incorrect.value = true; const empty = letters.value.findIndex(letter => !letter); if (empty >= 0) focus(empty); return; }
  incorrect.value = false; emit('submit', [...letters.value]);
}
watch([() => props.assignment?.id, completed], () => {
  letters.value = completed.value ? [...STEREOGRAM_LETTERS] : STEREOGRAM_LETTERS.map(() => ''); incorrect.value = false;
}, { immediate: true });
onMounted(() => {
  observer = new ResizeObserver(entries => { const size = entries[0]?.borderBoxSize[0]; if (size) { panelWidth.value = size.inlineSize; panelHeight.value = size.blockSize; } });
  if (panel.value) observer.observe(panel.value, { box: 'border-box' });
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <main class="stereo-page">
    <div class="stereo-layout">
      <header class="stereo-header"><img :src="wordmark" alt="ГЕРОФАРМ" /><button type="button" @click="emit('back')">← К календарю</button></header>
      <article ref="panel" class="stereo-panel" :class="{ 'has-error': incorrect || saveError, 'is-complete': completed }" :style="{ '--panel-art': cssUrl(panelArt) }" aria-labelledby="stereo-title">
        <div class="stereo-dots" aria-hidden="true"><img v-for="(point, index) in borderDots" :key="index" :src="dot" :style="point" alt="" /></div>
        <img class="stereo-wreath" :src="wreath" alt="" />
        <p class="stereo-date">{{ date }}</p>
        <h1 id="stereo-title">Что скрывается<br />за узором?</h1>
        <p class="stereo-badge" :style="{ backgroundImage: cssUrl(badge) }"><span>Обязательное задание</span></p>
        <p v-if="loading" class="stereo-notice" role="status">Загружаем задание…</p>
        <div v-else-if="error" class="stereo-notice" role="alert"><p>{{ error }}</p><button class="stereo-check" @click="emit('retry')">Попробовать снова</button></div>
        <p v-else-if="!assignment" class="stereo-notice">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="stereo-notice">Задание откроется {{ formatDate(assignment.available_date) }}.</p>
        <template v-else>
          <div class="stereo-copy"><p>На первый взгляд перед вами пестрый хаос.</p><p>Но стоит посмотреть иначе, и среди узоров появится объемное изображение. Что именно скрывается в сегодняшней стереокартинке? Попробуйте разглядеть!</p></div>
          <section class="stereo-instructions stereo-surface" :style="{ '--surface-art': cssUrl(instructions) }" aria-labelledby="stereo-instructions-title">
            <h2 id="stereo-instructions-title">Как увидеть изображение</h2>
            <ol><li>Посмотрите на картинку так, будто смотрите сквозь нее, вдаль.</li><li>Расслабьте взгляд и не фокусируйтесь на отдельных деталях узора. Через некоторое время может появиться объемное изображение.</li><li>Если не получилось сразу, немного приблизьте или отодвиньте изображение и попробуйте снова.</li></ol>
          </section>
          <div class="stereo-photo stereo-surface" :style="{ '--surface-art': cssUrl(placeholder) }" aria-label="Место для стереокартинки"></div>
          <form class="stereo-form" @submit.prevent="submit">
            <fieldset :disabled="locked" aria-describedby="stereo-answer-hint stereo-feedback">
              <legend>Что вам удалось увидеть?</legend><p id="stereo-answer-hint">Впишите ответ в ячейки.</p>
              <div class="stereo-cells">
                <div v-for="(_, index) in letters" :key="index" class="stereo-cell stereo-surface" :style="{ '--surface-art': cssUrl(cell) }">
                  <input :ref="el => { if (el) inputRefs[index] = el as HTMLInputElement }" :value="letters[index]" :aria-label="`Буква ${index + 1} из ${letters.length}`" :aria-invalid="incorrect" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" @input="input($event, index)" @compositionend="input($event, index)" @paste="paste($event, index)" @keydown="keydown($event, index)" @focus="($event.target as HTMLInputElement).select()" />
                </div>
              </div>
            </fieldset>
            <button class="stereo-check" :style="{ backgroundImage: cssUrl(button) }" type="submit" :disabled="locked"><span>{{ saving ? 'Сохраняем…' : 'Проверить ответ' }}</span></button>
            <p v-if="completed" id="stereo-feedback" class="stereo-feedback stereo-success stereo-surface" :style="{ '--surface-art': cssUrl(successArt) }" role="status">Изображение раскрыто! Вы увидели, что скрывалось за узором. Обязательное задание выполнено</p>
            <p v-else-if="saveError || incorrect" id="stereo-feedback" class="stereo-feedback stereo-error stereo-surface" :style="{ '--surface-art': cssUrl(errorArt) }" role="alert">{{ saveError || 'Пока не совпало. Расслабьте взгляд и попробуйте еще раз' }}</p>
          </form>
          <button v-if="completed" class="stereo-calendar" type="button" @click="emit('back')">К календарю</button>
        </template>
      </article>
      <footer class="stereo-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
  </main>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.ttf') format('truetype'); font-weight: 400 700; font-display: swap; }
:global(#app:has(.stereo-page)) { width: 100%; border: 0; }
.stereo-page { min-height: 100svh; width: 100%; overflow: clip; color-scheme: light; color: #70492c; background: linear-gradient(to bottom right, #090807 0%, #291209 22%, #743012 48%, #cf5515 73%, #ff941f 100%); font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; }
.stereo-layout { box-sizing: border-box; width: 100%; max-width: 760px; margin-inline: auto; padding: 0 16px 25px; }
.stereo-header { position: relative; box-sizing: border-box; height: 94px; padding-top: 34px; }
.stereo-header > img { display: block; margin-inline: auto; }
button { cursor: pointer; font-family: inherit; letter-spacing: 0; }
.stereo-header button { position: absolute; top: 48px; left: 0; min-height: 44px; padding: 0 8px; border: 0; background: transparent; color: #fff1cf; font: 400 12px/15px 'Advent Inter', sans-serif; }
.stereo-panel { position: relative; isolation: isolate; box-sizing: border-box; width: 100%; padding: 29px 24px 32px; }
.stereo-panel.has-error:not(.is-complete) { padding-bottom: 43px; }
.stereo-panel.is-complete { padding-bottom: 30px; }
.stereo-panel::before { content: ''; position: absolute; z-index: -1; inset: 0; border: 24px solid transparent; border-image: var(--panel-art) 24 fill / 24px stretch; pointer-events: none; }
.stereo-dots { position: absolute; inset: 0; pointer-events: none; }
.stereo-dots img { position: absolute; }
.stereo-wreath { position: absolute; right: 25.46px; top: 24.93px; }
.stereo-date { margin: 0 0 14px; color: #a7280b; font-size: 12px; line-height: 15px; font-weight: 700; }
.stereo-panel h1 { margin: 0; color: #623c28; font: 500 28px/30px 'Advent STIX', serif; letter-spacing: 0; }
.stereo-badge { display: flex; align-items: center; justify-content: center; width: 140px; height: 25px; margin-top: 11px; font-size: 11px; line-height: 13px; }
.stereo-badge span, .stereo-check span { color: transparent; background-clip: text; background-image: linear-gradient(77.653deg, #e8b77e .55732%, #ffe6bc 19.578%, #fff0d2 72.836%, #efc087 99.465%); }
.stereo-copy { margin: 23px 0 0 4px; min-height: 125px; }
.stereo-copy p { margin: 0; }
.stereo-copy p + p { margin-top: 20px; }
.stereo-surface { position: relative; isolation: isolate; }
.stereo-surface::before { content: ''; position: absolute; z-index: -1; inset: -.5px; border: 12px solid transparent; border-image: var(--surface-art) 12 fill / 12px stretch; pointer-events: none; }
.stereo-instructions { box-sizing: border-box; margin-top: 10px; padding: 22px 16px 26px; }
.stereo-instructions h2 { margin: 0 0 14px; color: #623c28; font: 500 20px/25px 'Advent STIX', serif; letter-spacing: 0; }
.stereo-instructions ol { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; counter-reset: stereo-step; }
.stereo-instructions li { position: relative; counter-increment: stereo-step; padding-left: 22px; }
.stereo-instructions li::before { position: absolute; left: 0; top: 0; content: counter(stereo-step) '.'; color: #a7280b; font-weight: 700; }
.stereo-photo { width: 100%; height: 200px; margin-top: 21px; }
.stereo-form { margin-top: 25px; }
fieldset { border: 0; margin: 0; padding: 0; min-width: 0; }
legend { padding: 0; font-size: 14px; line-height: 17px; font-weight: 700; }
#stereo-answer-hint { margin-top: 11px; font-size: 14px; line-height: 17px; }
.stereo-cells { display: grid; grid-template-columns: repeat(8, minmax(0, 44px)); gap: 6px; margin-top: 14px; }
.stereo-cell { min-width: 0; height: 48px; }
.stereo-cell input { display: block; box-sizing: border-box; width: 100%; min-width: 0; height: 48px; padding: 0; border: 0; border-radius: 7px; background: transparent; color: #623c28; font: 700 18px/22px 'Advent Inter', sans-serif; text-align: center; text-transform: uppercase; box-shadow: none; }
.stereo-cell input:disabled { opacity: 1; -webkit-text-fill-color: #623c28; }
.stereo-cell input:focus-visible { outline: 2px solid #a7280b; outline-offset: 2px; }
.stereo-check { display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 100%; height: 52px; margin-top: 24px; padding: 0 12px; border: 0; border-radius: 13px; background: #a7280b center / 100% 100% no-repeat; color: #fff0d2; font: 700 14px/17px 'Advent Inter', sans-serif; text-align: center; }
.stereo-check:disabled { cursor: default; }
.stereo-check:hover:not(:disabled) { filter: brightness(1.08); }
.stereo-feedback { box-sizing: border-box; margin: 16px 0 0; padding: 12px 16px; font-size: 14px; line-height: 20px; overflow-wrap: anywhere; }
.stereo-error { color: #a7280b; }
.stereo-success { color: #2e7d32; }
.stereo-calendar { display: block; min-height: 44px; margin: 6px auto -12px; padding: 0 12px; border: 0; background: transparent; color: #a7280b; font: 700 14px/17px 'Advent Inter', sans-serif; text-decoration: underline; }
.stereo-footer { margin-top: 27px; color: #fff1cf; font-size: 12px; line-height: 15px; text-align: center; }
.stereo-panel.has-error:not(.is-complete) + .stereo-footer { margin-top: 23px; }
.stereo-notice { min-height: 140px; margin-top: 24px; }
button:focus-visible { outline: 2px solid #a7280b; outline-offset: 2px; }
@media (max-width: 360px) { .stereo-layout { padding-inline: 12px; } .stereo-panel { padding-inline: 18px; } .stereo-cells { gap: 4px; } .stereo-panel h1 { font-size: 26px; } .stereo-wreath { right: 19px; } .stereo-instructions { padding-inline: 12px; } .stereo-instructions h2 { font-size: 18px; } }
@media (min-width: 768px) { .stereo-layout { padding-inline: 32px; } .stereo-panel { padding-inline: 32px; } .stereo-photo { height: auto; min-height: 240px; aspect-ratio: 313 / 200; } }
</style>
