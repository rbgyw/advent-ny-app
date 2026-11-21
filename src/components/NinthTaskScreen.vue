<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import PopupDialog from './PopupDialog.vue';
import board from '../assets/dec-09/board-original.svg';
import type { DecemberTaskProps, DecemberTaskEvents } from '../types/december';

const props = defineProps<DecemberTaskProps>();
const emit = defineEmits<DecemberTaskEvents>();
const artwork = import.meta.glob('../assets/dec-09/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const art = (file: string) => artwork['../assets/dec-09/' + file + '.svg'];
const people = [
  { id: 'mark', name: 'Марк', clue: 'Был в лаборатории фармакологии, но не рядом с ламинарным боксом.', cell: 6 },
  { id: 'oleg', name: 'Олег', clue: 'Работал с лиофильной сушилкой.', cell: 10 },
  { id: 'polina', name: 'Полина', clue: 'Была рядом с хроматографом и медицинским стерилизатором.', cell: 14 },
  { id: 'roman', name: 'Роман', clue: 'Был в аналитической лаборатории рядом с Полиной.', cell: 22 },
  { id: 'dmitry', name: 'Дмитрий', clue: 'Был единственным человеком, который работал за блистерной машиной.', cell: 30 },
  { id: 'natalya', name: 'Наталья', clue: 'Была рядом с ферментером и криохранилищем.', cell: 40 },
  { id: 'filipp', name: 'Филипп', clue: 'Был в одной зоне с виновником.', cell: 46 },
];
const rooms = [
  ['#f3ead9', 'Аналитическая лаборатория'],
  ['#f6ce6d', 'Цех производства продуктов из эндокринно-ферментного сырья'],
  ['#abd7d3', 'Лаборатория фармакологии'],
  ['#edb6a8', 'Цех производства готовых лекарственных форм'],
  ['#c5b8df', 'Цех производства субстанции инсулина'],
];
const equipment = [
  ['chromatograph', 'Хроматограф', '2:1'], ['sterilizer', 'Стерилизатор', '3:2'],
  ['dryer', 'Лиофильная сушилка', '2:4'], ['fridge', 'Холодильная камера', '3:6'],
  ['hood', 'Ламинарный бокс', '3:7'], ['blister', 'Блистерная машина', '5–6 : 2–3'],
  ['fermenter', 'Ферментер', '5:7'], ['cryo', 'Криохранилище для клеточных банков', '7:7'],
  ['autoclave', 'Автоклав', '7:5'],
];
const rules = [
  'Поле разделено на зоны. Внутри них находятся предметы, которые помогут разобраться в подсказках.',
  'В каждой строке и каждом столбце должен находиться ровно один человек.',
  'У каждого персонажа есть подсказка о его местоположении. Внимательно читайте, относится ли она к самому персонажу или к другому человеку в его зоне.',
  '«Рядом с предметом» означает соседнюю клетку слева, справа, сверху, снизу или по диагонали. Учитываются только клетки в той же зоне: соседство через ее границу не считается.',
  'Отмечайте невозможные варианты крестиками, чтобы постепенно сузить круг поиска.',
];
const started = ref(false);
const crossMode = ref(false);
const selected = ref<string>();
const positions = ref<Partial<Record<string, number>>>({});
const crosses = ref<number[]>([]);
const suspect = ref('');
const dialog = ref(false);
const success = ref(false);
const invalid = ref(false);
const completed = computed(() => props.assignment?.status === 'completed');
const placed = computed(() => new Map(people.flatMap(person => {
  const cell = completed.value ? person.cell : positions.value[person.id];
  return cell === undefined ? [] : [[cell, person] as const];
})));

watch(completed, (done, before) => {
  if (done) started.value = true;
  if (done && before === false) success.value = true;
}, { immediate: true });

function selectPerson(id: string) {
  if (completed.value || props.saving) return;
  selected.value = selected.value === id ? undefined : id;
  crossMode.value = false;
}
function markCell(cell: number) {
  if (completed.value || props.saving) return;
  const person = placed.value.get(cell);
  if (crossMode.value) {
    if (!person) crosses.value = crosses.value.includes(cell) ? crosses.value.filter(item => item !== cell) : [...crosses.value, cell];
    return;
  }
  if (selected.value) {
    if (person) delete positions.value[person.id];
    positions.value[selected.value] = cell;
    crosses.value = crosses.value.filter(item => item !== cell);
    selected.value = undefined;
  } else if (person) {
    delete positions.value[person.id];
    selected.value = person.id;
  }
  invalid.value = false;
}
function check() {
  if (props.saving || !suspect.value) return;
  dialog.value = false;
  invalid.value = suspect.value !== 'natalya' || people.some(person => positions.value[person.id] !== person.cell);
  if (!invalid.value) emit('save', { response: { solved: true }, complete: true });
}
</script>

<template>
  <DecemberTaskLayout v-bind="props" :task-number="9" mandatory title="Следствие ведут сотрудники ГЕРОФАРМ" @back="emit('back')" @retry="emit('retry')">
    <div v-if="!started" class="december-copy">
      <p>Внимание, детективы! Сегодня вам предстоит разгадать «Мурдоку» — логическую головоломку с персонажами, комнатами и уликами. Вооружайтесь логикой и подключайте детективное чутье, ведь это задание обязательное для получения памятного подарка.</p>
      <p>На заводе произошло загадочное происшествие: кто-то подменил образцы, и из-за этого была испорчена экспериментальная серия, над которой работала научная команда.</p>
      <p>Восстановите картину событий: сопоставьте показания, расположение помещений и оборудования, пока каждый персонаж не окажется на своем месте. Ваша задача — определить виновника подмены.</p>
      <section class="december-panel">
        <h2>Правила</h2>
        <ol class="factory-rules"><li v-for="rule in rules" :key="rule">{{ rule }}</li></ol>
      </section>
      <p>Когда все персонажи окажутся на своих местах, найдите Филиппа — свидетеля происшествия. В одной зоне с ним находится только один другой человек. Именно он и подменил образцы!</p>
      <button class="december-button" type="button" @click="started = true">Начать расследование</button>
    </div>
    <div v-else class="december-stack">
      <div>
        <h2>Схема завода</h2>
        <button class="december-link" type="button" @click="started = false">← К описанию и правилам</button><br />
        <button class="december-link" type="button" :disabled="completed" :aria-pressed="crossMode" @click="crossMode = !crossMode; selected = undefined">× Режим крестиков</button>
      </div>
      <div class="factory-board">
        <img class="factory-map" :src="board" alt="Схема комнат и оборудования завода" />
        <div class="factory-cells" aria-label="Сетка 7 на 7">
          <button v-for="cell in 49" :key="cell" type="button"
            :class="{ placed: placed.has(cell - 1) }"
            :aria-label="'Строка ' + Math.ceil(cell / 7) + ', столбец ' + ((cell - 1) % 7 + 1)"
            :disabled="completed || saving" @click="markCell(cell - 1)">
            <img v-if="placed.has(cell - 1)" :src="art(placed.get(cell - 1)!.id)" :alt="placed.get(cell - 1)!.name" />
            <span v-else-if="crosses.includes(cell - 1) && !completed">×</span>
          </button>
        </div>
      </div>
      <details class="factory-details">
        <summary>Комнаты и оборудование</summary>
        <section class="december-panel">
          <h3>Комнаты</h3>
          <p v-for="[color, room] in rooms" :key="room"><span class="room-color" :style="{ background: color }" />{{ room }}</p>
        </section>
        <section class="december-panel">
          <h3>Оборудование</h3>
          <p v-for="[icon, label, cell] in equipment" :key="icon" class="equipment-row"><img :src="art(icon + '-original')" alt="" />{{ label }}<strong>{{ cell }}</strong></p>
        </section>
      </details>
      <h2>Персонажи и подсказки</h2>
      <div class="factory-people">
        <button v-for="person in people" :key="person.id" class="factory-person" type="button" :disabled="completed || saving" :aria-pressed="selected === person.id" @click="selectPerson(person.id)">
          <img :src="art(person.id)" alt="" />
          <span><strong>{{ person.name }}</strong><br />{{ person.clue }}<small>{{ completed || positions[person.id] !== undefined ? 'На поле' : 'Не размещён' }}</small></span>
        </button>
      </div>
      <p v-if="selected" role="status">Выберите клетку для персонажа.</p>
      <template v-if="!completed">
        <button class="december-button" type="button" :disabled="saving" @click="dialog = true; invalid = false; emit('edit')">Проверить версию</button>
        <p v-if="invalid || saveError" class="december-error" role="alert">{{ invalid ? 'Кажется, мы что-то упустили. Проверьте подсказки и расположение персонажей — и попробуйте снова.' : saveError }}</p>
      </template>
      <div v-else class="december-panel"><strong>Дело раскрыто!</strong> Вы нашли виновника — обязательное задание выполнено.</div>
    </div>
    <PopupDialog v-model:open="dialog" class="december-dialog" aria-labelledby="factory-answer-title">
      <form class="december-stack" @submit.prevent="check">
        <h2 id="factory-answer-title">Кто виновник?</h2>
        <div class="factory-answers">
          <label v-for="person in people" :key="person.id"><input v-model="suspect" type="radio" name="suspect" :value="person.id" /> {{ person.name }}</label>
        </div>
        <button class="december-button" :disabled="!suspect || saving">Проверить ответ</button>
        <button class="december-button secondary" type="button" @click="dialog = false">Вернуться к полю</button>
      </form>
    </PopupDialog>
    <PopupDialog v-model:open="success" class="december-dialog" aria-labelledby="factory-success-title">
      <div class="december-stack">
        <button class="december-dialog-close" type="button" aria-label="Закрыть" @click="success = false">×</button>
        <h2 id="factory-success-title">Дело раскрыто!</h2>
        <p>Вы нашли виновника — обязательное задание выполнено.</p>
        <button class="december-button" type="button" @click="emit('back')">К календарю</button>
      </div>
    </PopupDialog>
  </DecemberTaskLayout>
</template>

<style scoped>
@media (min-width: 380px) and (max-width: 699px) {
  :deep(h1) { width: calc(100% + 17px); padding-right: 0; }
}
.factory-rules { display: grid; gap: 12px; margin: 12px 0 0; padding-left: 23px; }
.factory-rules li::marker { color: var(--dec-red); font-weight: 700; }
.factory-board { position: relative; max-width: 460px; width: 100%; margin-inline: auto; aspect-ratio: 1; overflow: hidden; border-radius: 9px; }
.factory-map { display: block; width: 100%; height: auto; }
.factory-cells { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-template-rows: repeat(7, minmax(0, 1fr)); }
.factory-cells button { display: grid; place-items: center; overflow: hidden; padding: 1px; border: 1px solid transparent; background: transparent; color: var(--dec-red); font: 700 22px/1 'Advent Inter', sans-serif; cursor: pointer; }
.factory-cells button:focus-visible { position: relative; z-index: 1; outline-offset: -2px; }
.factory-cells .placed { border-color: #52805a; background: rgb(82 128 90 / 36%); }
.factory-cells img { display: block; width: min(88%, 44px); height: auto; }
.factory-details summary { color: var(--dec-ink); font-weight: 700; cursor: pointer; }
.factory-details > section { margin-top: 10px; }
.factory-details h3 { margin: 0 0 8px; }
.factory-details p { margin: 7px 0; }
.room-color { display: inline-block; width: 12px; height: 12px; margin-right: 8px; border: 1px solid #a98768; vertical-align: -1px; }
.equipment-row { display: grid; align-items: center; grid-template-columns: 36px minmax(0, 1fr) auto; gap: 8px; }
.factory-people, .factory-answers { display: grid; gap: 8px; }
.factory-person { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid transparent; border-radius: 13px; background: var(--dec-paper); color: inherit; font: inherit; text-align: left; cursor: pointer; }
.factory-person[aria-pressed="true"] { border-color: var(--dec-red); }
.factory-person img { width: 44px; height: 44px; }
.factory-person small { display: block; color: var(--dec-red); }
</style>
