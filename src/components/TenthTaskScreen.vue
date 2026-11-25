<script setup lang="ts">
import { computed, ref } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import frost from '../assets/dec-10/frost.svg';
import location from '../assets/dec-10/location.svg';
import star from '../assets/dec-10/star.svg';
import type { DecemberTaskProps, DecemberTaskEvents } from '../types/december';

const props = defineProps<DecemberTaskProps>();
const emit = defineEmits<DecemberTaskEvents>();
const places = ['Азербайджан', 'Казахстан', 'Узбекистан', 'Венесуэла'];
const wizards = ['Корбобо (Qor Bobo)', 'Сан-Николас (San Nicolás)', 'Аяз Ата (Ayaz Ata)', 'Шахта Баба (Şaxta Baba)'];
const solution = [3, 2, 0, 1];
const links = ref<number[]>([-1, -1, -1, -1]);
const selectedPlace = ref(-1);
const selectedWizard = ref(-1);
const checked = ref(false);
const completed = computed(() => props.assignment?.status === 'completed');
const pairs = computed(() => completed.value ? solution : links.value);
const wizardOrder = computed(() => {
  const free = wizards.map((_, index) => index).filter(index => !pairs.value.includes(index));
  return pairs.value.map(value => value >= 0 ? value : free.shift()!);
});
const draggedWizard = ref(-1);
function connect(place: number, wizard: number) {
  if (completed.value || props.saving || wizard < 0 || wizard >= wizards.length) return;
  const previous = links.value.indexOf(wizard);
  const displaced = links.value[place]!;
  if (previous >= 0) links.value[previous] = previous === place ? -1 : displaced;
  links.value[place] = wizard;
  selectedPlace.value = selectedWizard.value = -1;
  checked.value = false;
  emit('edit');
}
function dragWizard(event: DragEvent, wizard: number) {
  draggedWizard.value = wizard;
  event.dataTransfer?.setData('text/plain', String(wizard));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}
function dropWizard(place: number) {
  connect(place, draggedWizard.value);
  draggedWizard.value = -1;
}
const totalPairs = computed(() => pairs.value.filter(value => value >= 0).length);
const pairColors = ['#f5d086', '#d5e6c0', '#eac1ad', '#d7ceeb'];

function pick(column: 'place' | 'wizard', index: number) {
  if (completed.value || props.saving) return;
  const current = column === 'place' ? selectedPlace : selectedWizard;
  current.value = current.value === index ? -1 : index;
  checked.value = false;
  emit('edit');
  if (selectedPlace.value < 0 || selectedWizard.value < 0) return;
  connect(selectedPlace.value, selectedWizard.value);
}

function check() {
  if (props.saving || totalPairs.value !== places.length) return;
  checked.value = true;
  if (links.value.every((value, index) => value === solution[index])) {
    emit('save', { response: { solved: true }, complete: true });
  }
}

function pairStyle(place: number) {
  if (place < 0 || pairs.value[place] === -1) return;
  return { '--pair-color': pairColors[place] };
}
</script>

<template>
  <DecemberTaskLayout v-bind="props" title="Кто здесь Дед Мороз?" @back="emit('back')" @retry="emit('retry')">
    <img class="frost-art" :src="frost" alt="" />
    <div class="december-copy">
            <p>ГЕРОФАРМ объединяет коллег из разных уголков мира. У каждой страны свои традиции, в том числе новогодние. И даже тех, кто приносит подарки, везде зовут по-разному!</p>
            <p>Перед праздниками новогодним волшебникам предстоит добраться до представительств ГЕРОФАРМ. Но сначала нужно разобраться, кто из них откуда родом.</p>
            <p>Помогите каждому найти дорогу домой: сопоставьте страну и имя ее новогоднего героя. Когда все пары будут готовы, проверьте себя!</p>
    </div>
    <section class="frost-game december-stack">
      <div><h2>Найдите пары</h2><p>Перетащите имя волшебника к стране или нажмите на имя и страну. Выбранная карточка встанет напротив страны.</p></div>
      <div class="frost-pairs">
        <div>
          <h3>Территории</h3>
          <button v-for="(place, index) in places" :key="place" type="button" :style="pairStyle(index)"
            :aria-pressed="selectedPlace === index" :disabled="completed || saving" @click="pick('place', index)" @dragover.prevent @drop.prevent="dropWizard(index)">
            <img :src="location" alt="" />{{ place }}
          </button>
        </div>
        <div>
          <h3>Волшебники</h3>
          <button v-for="wizard in wizardOrder" :key="wizard" type="button" :style="pairStyle(pairs.indexOf(wizard))"
            :aria-pressed="selectedWizard === wizard" :draggable="!completed && !saving" @dragstart="dragWizard($event, wizard)" @dragend="draggedWizard = -1" :disabled="completed || saving" @click="pick('wizard', wizard)">
            <img :src="star" alt="" />{{ wizards[wizard] }}
          </button>
        </div>
      </div>
      <p aria-live="polite"><strong>{{ totalPairs }} из {{ places.length }} пар</strong></p>
      <p v-if="checked && !completed && !links.every((value, index) => value === solution[index])" class="december-error" role="alert">Некоторые волшебники заблудились. Проверьте пары и попробуйте еще раз.</p>
      <p v-if="saveError" class="december-error" role="alert">{{ saveError }}</p>
      <p v-if="completed" role="status">Все волшебники нашли дорогу домой! Теперь вы знаете, кого ждут на Новый год в разных уголках мира.</p>

      <button v-else class="december-button task-action" type="button" :disabled="saving || totalPairs < places.length" @click="check">Проверить пары</button>
    </section>
  </DecemberTaskLayout>
</template>

<style scoped>
.frost-art { display: block; max-width: 100%; height: auto; margin: 16px auto 24px; }
.frost-game, .frost-gifts { margin-top: 24px; }
.frost-game h2 { margin-bottom: 4px; }
.frost-pairs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.frost-pairs > div { display: grid; grid-template-rows: auto repeat(4, 1fr); gap: 8px; }
.frost-pairs h3 { margin: 0; font-size: 12px; }
.frost-pairs button { display: flex; min-width: 0; min-height: 76px; align-items: center; gap: 6px; padding: 9px; border: 1px solid var(--dec-border); border-radius: 13px; background: var(--pair-color, var(--dec-paper)); color: var(--dec-ink); font: 700 13px/16px 'Advent Inter', sans-serif; overflow-wrap: anywhere; text-align: left; cursor: pointer; }
.frost-pairs button[aria-pressed="true"] { border-color: var(--dec-red); outline: 1px solid var(--dec-red); }
.frost-pairs button:disabled { cursor: default; }
.frost-pairs img { flex: none; }
</style>
