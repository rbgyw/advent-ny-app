<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  columnClues, crossed, nonogramSize, rowClues, unmarked,
  type CellMark, type MarkingTool,
} from '../content/nonogram';

const props = defineProps<{
  cells: readonly CellMark[];
  tool: MarkingTool;
  enlarged: boolean;
  disabled: boolean;
}>();
const emit = defineEmits<{ mark: [index: number, value: CellMark] }>();

const scrollArea = ref<HTMLDivElement>();
const table = ref<HTMLTableElement>();
const focusIndex = ref(0);
const markLabels = ['без отметки', 'закрашена', 'отмечена крестиком'];
const arrows: Record<string, [number, number]> = {
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
};
let mouseActivated = false;
let stroke: CellMark | null = null;

watch(() => props.enlarged, enlarged => {
  if (enlarged) scrollArea.value?.scrollTo({ left: 0, top: 0, behavior: 'instant' });
}, { flush: 'post' });

function cellIndex(row: number, column: number) {
  return row * nonogramSize + column;
}

function nextMark(index: number, tool: MarkingTool) {
  return props.cells[index] === tool ? unmarked : tool;
}

function startStroke(event: PointerEvent, index: number) {
  mouseActivated = event.pointerType === 'mouse' && event.button === 0;
  if (!mouseActivated || props.disabled) return;
  stroke = nextMark(index, props.tool);
  emit('mark', index, stroke);
}

function extendStroke(event: PointerEvent, index: number) {
  if (stroke !== null && event.pointerType === 'mouse' && event.buttons === 1 && !props.disabled) {
    emit('mark', index, stroke);
  }
}

function finishStroke() {
  stroke = null;
}

function activate(event: MouseEvent, index: number) {
  if (!props.disabled && (!mouseActivated || event.detail === 0)) {
    emit('mark', index, nextMark(index, props.tool));
  }
  mouseActivated = false;
}

function markEmpty(index: number) {
  if (!props.disabled) emit('mark', index, nextMark(index, crossed));
}

function moveFocus(event: KeyboardEvent, row: number, column: number) {
  const direction = arrows[event.key];
  if (!direction) return;
  event.preventDefault();
  const nextRow = row + direction[0];
  const nextColumn = column + direction[1];
  if (nextRow < 0 || nextRow >= nonogramSize || nextColumn < 0 || nextColumn >= nonogramSize) return;
  const nextIndex = cellIndex(nextRow, nextColumn);
  table.value?.querySelector<HTMLButtonElement>(`[data-cell-index="${nextIndex}"]`)?.focus();
}
</script>

<template>
  <div class="nonogram-viewport" :class="{ 'is-enlarged': enlarged }">
    <div
      ref="scrollArea"
      class="nonogram-scroll"
      :tabindex="enlarged ? 0 : undefined"
      :role="enlarged ? 'region' : undefined"
      :aria-label="enlarged ? 'Прокрутка увеличенного нонограма' : undefined"
    >
      <table
        ref="table"
        class="nonogram-board"
        aria-label="Японский кроссворд, поле 10 на 10"
        @pointerup="finishStroke"
        @pointerleave="finishStroke"
        @pointercancel="finishStroke"
      >
        <colgroup><col class="nonogram-row-clue-width" /><col :span="nonogramSize" /></colgroup>
        <thead>
          <tr>
            <td class="nonogram-corner" aria-hidden="true"></td>
            <th v-for="(clue, column) in columnClues" :key="column" scope="col">
              <span v-for="(number, index) in clue" :key="index" class="nonogram-column-number">{{ number }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(clue, row) in rowClues" :key="row">
            <th scope="row" class="nonogram-row-clue">
              <span class="nonogram-row-numbers">
                <span v-for="(number, index) in clue" :key="index" class="nonogram-row-number">{{ number }}</span>
              </span>
            </th>
            <td
              v-for="(_, column) in columnClues"
              :key="column"
              class="nonogram-cell"
              :data-mark="cells[cellIndex(row, column)]"
            >
              <button
                type="button"
                :data-cell-index="cellIndex(row, column)"
                :tabindex="focusIndex === cellIndex(row, column) ? 0 : -1"
                :aria-label="`Строка ${row + 1}, столбец ${column + 1}, ${markLabels[cells[cellIndex(row, column)] ?? unmarked]}`"
                :disabled="disabled"
                @focus="focusIndex = cellIndex(row, column)"
                @pointerdown="startStroke($event, cellIndex(row, column))"
                @pointerenter="extendStroke($event, cellIndex(row, column))"
                @click="activate($event, cellIndex(row, column))"
                @contextmenu.prevent="markEmpty(cellIndex(row, column))"
                @keydown="moveFocus($event, row, column)"
              >
                <span v-if="cells[cellIndex(row, column)] === crossed" aria-hidden="true">×</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.nonogram-viewport {
  --grid-line: #c5ab81;
  --clue-border: #c38e77;
  --clue-background: #f3c4b2;
  width: min(100%, 560px);
  margin: 4px auto 0;
}

.is-enlarged .nonogram-scroll { overflow: auto; overflow-anchor: none; overscroll-behavior: contain; }
.nonogram-scroll:focus-visible { outline: 2px solid var(--color-action); outline-offset: 2px; }

.nonogram-board {
  width: 100%;
  table-layout: fixed;
  border-spacing: 0;
  color: var(--color-ink);
  font: 400 11px/14px var(--font-ui);
  text-align: center;
  user-select: none;
}

.is-enlarged .nonogram-board { width: max(150%, 456px); font-size: 14px; }
.nonogram-row-clue-width { width: 16.6667%; }
.nonogram-board th { padding: 0; font-weight: 600; }
.nonogram-board thead th { vertical-align: bottom; }
.nonogram-column-number, .nonogram-row-number {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  background: var(--clue-background);
  border: 1px solid var(--clue-border);
}
.nonogram-column-number { aspect-ratio: 1.15; border-block-end: 0; }
.nonogram-row-numbers { display: flex; justify-content: flex-end; }
.nonogram-row-number { width: 50%; aspect-ratio: 1; border-inline-end: 0; }
.nonogram-row-number + .nonogram-row-number { margin-inline-start: -1px; }

.nonogram-cell {
  padding: 0;
  border-inline-end: 1px solid var(--grid-line);
  border-block-end: 1px solid var(--grid-line);
  background-color: #fffdf5;
}

.nonogram-cell:first-of-type { border-inline-start: 1px solid var(--grid-line); }
.nonogram-board tbody tr:first-child .nonogram-cell { border-block-start: 1px solid var(--grid-line); }
.nonogram-cell[data-mark='1'] { background-color: #231d16; }

.nonogram-cell button {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: 600 clamp(13px, 4vw, 19px)/1 var(--font-ui);
  cursor: pointer;
  touch-action: manipulation;
}

.nonogram-cell button:disabled { cursor: default; }
.nonogram-cell button:focus-visible { outline: 2px solid var(--color-action); outline-offset: -3px; }

@media (hover: hover) {
  .nonogram-cell button:hover:not(:disabled) { box-shadow: inset 0 0 0 2px var(--color-action); }
}
</style>
