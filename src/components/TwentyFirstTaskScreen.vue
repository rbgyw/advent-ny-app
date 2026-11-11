<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { CalendarTask } from '../types/models';
import { shortCalendarDate } from '../utils/calendar';
import { formatDate } from '../utils/date';
import {
  crossed, filled, isNonogramSolution, nonogramSize, solvedNonogram, unmarked,
  type CellMark, type MarkingTool,
} from '../content/nonogram';
import NonogramBoard from './NonogramBoard.vue';
import wordmark from '../assets/wish/wordmark.svg';
import dot from '../assets/raskobki/dot.svg';
import wreath from '../assets/nonogram/wreath.svg';

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
  submit: [cells: CellMark[]];
  edit: [];
}>();

const cellCount = nonogramSize * nonogramSize;
const cells = ref<CellMark[]>(Array(cellCount).fill(unmarked));
const tool = ref<MarkingTool>(filled);
const enlarged = ref(false);
const validation = ref('');
const panel = ref<HTMLElement>();
const dialog = ref<HTMLDialogElement>();
const dotCount = ref(0);
let awaitingCompletion = false;

const completed = computed(() => props.assignment?.status === 'completed');
const date = computed(() => props.assignment
  ? shortCalendarDate(props.assignment.available_date).toLocaleUpperCase('ru-RU')
  : '21 ДЕКАБРЯ');
const draftKey = computed(() => {
  const assignment = props.assignment;
  return assignment?.task ? `advent:nonogram:v1:${assignment.user_id}:${assignment.id}` : null;
});

const rules = [
  'Числа слева от строк и сверху над столбцами обозначают длину групп черных клеток. Например, «2, 5, 9» — это три группы: из двух, пяти и девяти клеток.',
  'Располагайте группы в указанном порядке: в строках — слева направо, в столбцах — сверху вниз.',
  'Между соседними группами должна оставаться хотя бы одна пустая клетка.',
  'Группы не обязательно начинаются у края поля. Пустые клетки могут быть и перед первой группой, и после последней.',
  'Отмечайте крестиками клетки, которые точно должны остаться пустыми: так будет проще находить решение.',
  'Сверяйте подсказки строк и столбцов. Когда все клетки окажутся на своих местах, появится изображение!',
];

watch(panel, (element, _, onCleanup) => {
  if (!element) return;
  const observer = new ResizeObserver(() => {
    const { width, height } = element.getBoundingClientRect();
    const perimeter = 2 * (width + height - 20) - (8 - 2 * Math.PI) * 17;
    dotCount.value = Math.max(1, Math.round(perimeter / 11));
  });
  observer.observe(element);
  onCleanup(() => observer.disconnect());
}, { flush: 'post' });

watch([draftKey, completed], async ([key, done], [previousKey]) => {
  if (key !== previousKey) {
    awaitingCompletion = false;
    validation.value = '';
    tool.value = filled;
    enlarged.value = false;
    dialog.value?.close();
  }

  if (done) {
    if (key) {
      try {
        for (let index = 0; index < cellCount; index++) localStorage.removeItem(`${key}:${index}`);
      } catch {
        // The confirmed result is authoritative when browser storage is unavailable.
      }
    }
    if (awaitingCompletion) {
      awaitingCompletion = false;
      await nextTick();
      if (key === draftKey.value && completed.value && dialog.value && !dialog.value.open) {
        dialog.value.showModal();
      }
    }
    return;
  }

  cells.value = Array<CellMark>(cellCount).fill(unmarked);
  if (!key) return;
  try {
    cells.value = cells.value.map((_, index) => {
      const mark = localStorage.getItem(`${key}:${index}`);
      if (mark === String(filled)) return filled;
      if (mark === String(crossed)) return crossed;
      return unmarked;
    });
  } catch {
    // Keep the board playable when browser storage is unavailable.
  }
}, { immediate: true });

function markCell(index: number, mark: CellMark) {
  if (props.saving || completed.value || !props.assignment?.task || cells.value[index] === mark) return;
  cells.value[index] = mark;
  validation.value = '';
  if (props.saveError) emit('edit');
  const key = draftKey.value;
  if (!key) return;

  try {
    // Independent cell keys preserve edits to different cells made in parallel tabs.
    const cellKey = `${key}:${index}`;
    if (mark === unmarked) localStorage.removeItem(cellKey);
    else localStorage.setItem(cellKey, String(mark));
  } catch {
    // Keep the mark for the current visit if the browser denies the write.
  }
}

function check() {
  if (completed.value) {
    emit('back');
    return;
  }
  if (props.loading || props.saving || !props.assignment?.task) return;
  emit('edit');
  if (!isNonogramSolution(cells.value)) {
    validation.value = 'Пока не все клетки на своих местах. Проверьте длину групп и промежутки между ними — и попробуйте снова.';
    return;
  }
  validation.value = '';
  awaitingCompletion = true;
  emit('submit', [...cells.value]);
}

function backFromResult() {
  dialog.value?.close();
  emit('back');
}
</script>

<template>
  <main class="nonogram-page">
    <div class="nonogram-layout">
      <header class="nonogram-header">
        <img :src="wordmark" alt="ГЕРОФАРМ" width="108" height="13" />
        <button type="button" @click="emit('back')">← К календарю</button>
      </header>
      <article ref="panel" class="nonogram-panel" aria-labelledby="nonogram-title">
        <div class="nonogram-dots" aria-hidden="true">
          <img
            v-for="n in dotCount"
            :key="n"
            :src="dot"
            alt=""
            :style="{ offsetDistance: `${(n - 1) * 100 / dotCount}%` }"
          />
        </div>
        <div class="nonogram-heading">
          <img class="nonogram-wreath" :src="wreath" alt="" />
          <p class="nonogram-date">{{ date }}</p>
          <h1 id="nonogram-title">Что скрывает нонограм?</h1>
          <p class="nonogram-badge">Обязательное задание</p>
        </div>

        <p v-if="loading" class="nonogram-notice" role="status">Загружаем задание…</p>
        <div v-else-if="error" class="nonogram-notice" role="alert">
          <p>{{ error }}</p>
          <button class="nonogram-primary" type="button" @click="emit('retry')">Попробовать снова</button>
        </div>
        <p v-else-if="!assignment" class="nonogram-notice">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="nonogram-notice">
          Задание откроется {{ formatDate(assignment.available_date) }}.
        </p>
        <template v-else>
          <div class="nonogram-intro">
            <p>Сегодня соберем изображение без карандашей и красок — с помощью логики! Перед вами японский кроссворд: цифры по краям поля подсказывают, какие клетки нужно закрасить.</p>
            <p>Разберитесь в подсказках, заполните поле — и узнайте, какая картинка в нем спрятана. Это обязательное задание для получения приза.</p>
          </div>

          <details class="nonogram-rules">
            <summary>Правила японского кроссворда</summary>
            <ol>
              <li v-for="rule in rules" :key="rule">{{ rule }}</li>
            </ol>
          </details>

          <section class="nonogram-game" aria-label="Поле японского кроссворда" :aria-busy="saving">
            <div class="nonogram-tools" role="group" aria-label="Отметка клетки">
              <button type="button" :aria-pressed="tool === filled" :disabled="completed || saving" @click="tool = filled">
                <span aria-hidden="true">■</span> Закрасить
              </button>
              <button type="button" :aria-pressed="tool === crossed" :disabled="completed || saving" @click="tool = crossed">
                <span aria-hidden="true">×</span> Пустая клетка
              </button>
            </div>
            <div class="nonogram-meta">
              <p>Поле {{ nonogramSize }} × {{ nonogramSize }}</p>
              <button type="button" :aria-pressed="enlarged" @click="enlarged = !enlarged">
                {{ enlarged ? 'Уменьшить ↙' : 'Увеличить ↗' }}
              </button>
            </div>
            <NonogramBoard
              :cells="completed ? solvedNonogram : cells"
              :tool="tool"
              :enlarged="enlarged"
              :disabled="completed || saving"
              :completed="completed"
              @mark="markCell"
            />
            <p v-if="!completed" class="nonogram-board-note">Повторное нажатие снимает отметку.</p>
          </section>
          <button class="nonogram-primary" type="button" :disabled="saving" @click="check">
            {{ completed ? 'К календарю' : saving ? 'Сохраняем…' : 'Проверить кроссворд' }}
          </button>
          <p v-if="completed" class="nonogram-feedback nonogram-success" role="status">Нонограм разгадан!</p>
          <p v-else-if="validation || saveError" class="nonogram-feedback nonogram-error" role="alert">
            {{ validation || saveError }}
          </p>
        </template>
      </article>
      <footer class="nonogram-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>

    <dialog ref="dialog" class="nonogram-popup" aria-labelledby="nonogram-result-title" aria-describedby="nonogram-result-copy">
      <button class="nonogram-close" type="button" aria-label="Закрыть окно результата" @click="dialog?.close()">×</button>
      <h2 id="nonogram-result-title">Нонограм разгадан!</h2>
      <p id="nonogram-result-copy">Поздравляем, кроссворд полностью разгадан! Обязательное задание выполнено.</p>
      <button class="nonogram-primary" type="button" @click="backFromResult">К календарю</button>
    </dialog>
  </main>
</template>

<style scoped>
@font-face {
  font-family: 'Advent Inter';
  src: url('../assets/splash/Inter.ttf') format('truetype');
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: 'Advent STIX';
  src: url('../assets/splash/STIXTwoText.ttf') format('truetype');
  font-weight: 400 700;
  font-display: swap;
}

:global(#app:has(.nonogram-page)) { width: 100%; border: 0; }
:global(html:has(.nonogram-popup[open])) { overflow: hidden; }

.nonogram-page {
  --accent: #a7280b;
  --light: #fff1cf;
  --heading-color: #623c28;
  box-sizing: border-box;
  min-height: 100svh;
  background: linear-gradient(107.4deg, #090807, #291209 22%, #743012 48%, #cf5515 73%, #ff941f);
  color: #70492c;
  color-scheme: light;
  font: 400 14px/20px 'Advent Inter', sans-serif;
  letter-spacing: 0;
  text-align: left;
}

.nonogram-layout { box-sizing: border-box; max-width: 760px; margin-inline: auto; padding: 0 16px 36px; }
.nonogram-header { position: relative; box-sizing: border-box; height: 94px; padding-top: 34px; }
.nonogram-header img { display: block; margin-inline: auto; }
button { font: inherit; letter-spacing: inherit; cursor: pointer; }
button:focus-visible, summary:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }

.nonogram-header button {
  position: absolute;
  top: 47px;
  left: 0;
  min-height: 44px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: var(--light);
  font-size: 12px;
}

.nonogram-panel { position: relative; isolation: isolate; padding: 30px 24px 35px; }

.nonogram-panel::before, .nonogram-rules::before, .nonogram-game::before, .nonogram-popup::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  content: '';
  pointer-events: none;
}

.nonogram-panel::before { border-image: url('../assets/nonogram/panel.svg') 24 fill / 24px stretch; }
.nonogram-dots { position: absolute; inset: 0; z-index: -1; overflow: clip; pointer-events: none; }
.nonogram-dots img { position: absolute; top: 0; left: 0; offset-path: inset(5px round 17px); offset-rotate: 0deg; }
.nonogram-heading { position: relative; padding-right: 56px; }
.nonogram-wreath { position: absolute; top: -5px; right: 1px; display: block; }
.nonogram-date { color: var(--accent); font-size: 12px; line-height: 15px; font-weight: 700; }

.nonogram-heading h1 {
  max-width: 254px;
  margin: 13px 0 11px;
  color: var(--heading-color);
  font: 500 28px/30px 'Advent STIX', serif;
  letter-spacing: 0;
}

.nonogram-badge {
  display: inline-flex;
  align-items: center;
  min-height: 25px;
  padding: 0 8px;
  border-radius: 5px;
  background: var(--accent) url('../assets/raskobki/badge.svg') center / 100% 100% no-repeat;
  color: var(--light);
  font-size: 11px;
  line-height: 15px;
}

.nonogram-intro, .nonogram-notice { margin-top: 24px; color: #836045; }
.nonogram-intro p + p { margin-top: 20px; }
.nonogram-notice { min-height: 90px; }

.nonogram-rules, .nonogram-game { position: relative; isolation: isolate; }
.nonogram-rules { margin-top: 32px; }
.nonogram-rules::before { border-image: url('../assets/nonogram/rules.svg') 14 fill / 14px stretch; }
.nonogram-rules[open]::before { border-image-source: url('../assets/nonogram/rules-open.svg'); }

.nonogram-rules summary {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-height: 56px;
  padding: 12px 16px;
  list-style: none;
  gap: 4px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.nonogram-rules summary::-webkit-details-marker { display: none; }
.nonogram-rules summary::before { content: '▸'; font-size: 10px; }
.nonogram-rules[open] summary::before { content: '▾'; }
.nonogram-rules ol { margin: 0; padding: 3px 20px 24px 16px; list-style-position: inside; }
.nonogram-rules li + li { margin-top: 14px; }
.nonogram-game { margin-top: 19px; padding: 12px 12px 19px; }
.nonogram-game::before { border-image: url('../assets/nonogram/game.svg') 17 fill / 17px stretch; }

.nonogram-tools { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.nonogram-tools button {
  min-height: 44px;
  padding: 4px 5px;
  border: 0;
  border-radius: 14px;
  border-image: url('../assets/nonogram/mode-idle.svg') 15 fill / 15px stretch;
  background: transparent;
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
}

.nonogram-tools button[aria-pressed='true'] {
  border-image-source: url('../assets/nonogram/mode-active.svg');
  color: var(--light);
}

.nonogram-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  min-height: 40px;
  gap: 8px;
  font-size: 12px;
  line-height: 15px;
}

.nonogram-meta button { min-height: 40px; padding: 0; border: 0; background: transparent; color: var(--accent); }
.nonogram-board-note { margin-top: 8px; color: #836045; font-size: 11px; line-height: 13px; }

.nonogram-primary {
  display: block;
  width: 100%;
  min-height: 52px;
  margin-top: 24px;
  padding: 8px 12px;
  border: 0;
  border-radius: 13px;
  background: var(--accent) url('../assets/nonogram/submit.svg') center / 100% 100% no-repeat;
  color: var(--light);
  font-weight: 700;
}

.nonogram-primary:hover:not(:disabled), .nonogram-tools button:hover:not(:disabled) { filter: brightness(1.07); }
.nonogram-primary:disabled, .nonogram-tools button:disabled { opacity: .75; cursor: default; }
.nonogram-feedback { margin-top: 18px; font-size: 12px; line-height: 18px; overflow-wrap: anywhere; }
.nonogram-error { color: var(--accent); }
.nonogram-success { color: #315c3b; }
.nonogram-footer { margin-top: 28px; color: var(--light); font-size: 12px; line-height: 15px; text-align: center; }

.nonogram-popup {
  position: fixed;
  isolation: isolate;
  box-sizing: border-box;
  width: min(345px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  padding: 36px 24px 51px;
  border: 0;
  border-radius: 24px;
  background: transparent;
  color: inherit;
}

.nonogram-popup::before { border-image: url('../assets/nonogram/popup.svg') 24 fill / 24px stretch; }
.nonogram-popup::backdrop { background: url('../assets/nonogram/backdrop.svg') center / 100% 100% no-repeat; }

.nonogram-popup h2 {
  margin: 0 0 21px;
  color: var(--heading-color);
  font: 600 26px/33px 'Advent STIX', serif;
  letter-spacing: 0;
}

.nonogram-popup .nonogram-primary {
  margin-top: 34px;
  background-image: url('../assets/nonogram/calendar-button.svg');
}

.nonogram-close {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--heading-color);
  font-size: 24px;
}

@media (max-width: 359px) {
  .nonogram-layout { padding-inline: 12px; }
  .nonogram-panel { padding-inline: 18px; }
  .nonogram-heading h1 { font-size: 26px; }
}

@media (min-width: 768px) {
  .nonogram-layout { padding-inline: 32px; }
  .nonogram-panel { padding-inline: 32px; }
}
</style>
