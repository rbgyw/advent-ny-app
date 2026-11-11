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
  completed: boolean;
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
  <div class="nonogram-viewport" :class="{ 'is-enlarged': enlarged, 'is-completed': completed }">
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
              <span v-for="index in (completed ? 3 - clue.length : 0)" :key="`empty-${index}`" class="nonogram-column-number" aria-hidden="true"></span>
              <span v-for="(number, index) in clue" :key="index" class="nonogram-column-number">{{ number }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(clue, row) in rowClues" :key="row">
            <th scope="row" class="nonogram-row-clue">
              <span v-if="completed" class="nonogram-row-numbers">
                <span>{{ clue.length === 2 ? clue[0] : '' }}</span><span>{{ clue.at(-1) }}</span>
              </span>
              <template v-else>{{ clue.join(' ') }}</template>
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
  width: min(100%, max(160px, 85svh));
  margin: 19px auto 0;
  container-type: inline-size;
}

.is-enlarged .nonogram-scroll { overflow: auto; overflow-anchor: none; overscroll-behavior: contain; }
.nonogram-scroll:focus-visible { outline: 2px solid #a7280b; outline-offset: 2px; }

.nonogram-board {
  width: 100cqw;
  table-layout: fixed;
  border-spacing: 0;
  color: #623c28;
  font: 400 11px/14px 'Advent Inter', sans-serif;
  text-align: center;
  user-select: none;
}

/* Keep the scroll area's layout size while doubling the table, clues and marks. */
.is-enlarged .nonogram-board { transform: scale(2); transform-origin: top left; }
.nonogram-row-clue-width { width: 30px; }
.nonogram-board th { font-weight: 400; }
.nonogram-board thead th { vertical-align: bottom; padding: 0 0 4px; }
.nonogram-column-number { display: block; }
.nonogram-row-clue { white-space: nowrap; padding: 0 4px 0 0; text-align: right; }

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
  font: 600 clamp(13px, 4vw, 19px)/1 'Advent Inter', sans-serif;
  cursor: pointer;
  touch-action: manipulation;
}

.nonogram-cell button:disabled { cursor: default; }
.nonogram-cell button:focus-visible { outline: 2px solid #a7280b; outline-offset: -3px; }

@media (hover: hover) {
  .nonogram-cell button:hover:not(:disabled) { box-shadow: inset 0 0 0 2px #a7280b; }
}

.is-completed { --grid-line: #999; }
.is-completed .nonogram-board {
  border: 3px solid #000;
  color: #000;
  font: 400 clamp(11px, 4vw, 17px)/1 Georgia, serif;
}
.is-completed .nonogram-row-clue-width { width: 16.6667%; }
.is-completed .nonogram-board thead th { padding: 0; border-inline-end: 1px solid var(--grid-line); }
.is-completed .nonogram-board th { background: #ddd; }
.is-completed .nonogram-corner { background: #eee; border-inline-end: 1px solid #000; border-block-end: 1px solid #000; }
.is-completed .nonogram-column-number {
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  box-shadow: inset 0 -1px var(--grid-line);
}
.is-completed .nonogram-row-clue { padding: 0; text-align: center; }
.nonogram-row-numbers { display: grid; grid-template-columns: 1fr 1fr; }
.nonogram-row-numbers span { display: grid; place-items: center; aspect-ratio: 1; }
.nonogram-row-numbers span:first-child { box-shadow: inset -1px 0 var(--grid-line); }
.is-completed .nonogram-row-clue { box-shadow: inset 0 -1px var(--grid-line); }
.is-completed .nonogram-cell { background: #fff; }
.is-completed .nonogram-cell[data-mark='1'] { background: #000; }
.is-completed .nonogram-cell:nth-of-type(5) { --split-column: 2px; }
.is-completed tbody tr:nth-child(5) .nonogram-cell { --split-row: 2px; }
.is-completed .nonogram-cell {
  box-shadow: inset calc(-1 * var(--split-column, 0px)) 0 var(--grid-line),
    inset 0 calc(-1 * var(--split-row, 0px)) var(--grid-line);
}
</style>
