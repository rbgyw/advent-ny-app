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
const totalPairs = computed(() => pairs.value.filter(value => value >= 0).length);
const pairColors = ['#f5d086', '#d5e6c0', '#eac1ad', '#d7ceeb'];

function pick(column: 'place' | 'wizard', index: number) {
  if (completed.value || props.saving) return;
  const current = column === 'place' ? selectedPlace : selectedWizard;
  current.value = current.value === index ? -1 : index;
  checked.value = false;
  emit('edit');
  if (selectedPlace.value < 0 || selectedWizard.value < 0) return;
  const previous = links.value.indexOf(selectedWizard.value);
  if (previous >= 0) links.value[previous] = -1;
  links.value[selectedPlace.value] = selectedWizard.value;
  selectedPlace.value = -1;
  selectedWizard.value = -1;
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
  <DecemberTaskLayout v-bind="props" :task-number="day" title="Кто здесь Дед Мороз?" @back="emit('back')" @retry="emit('retry')">
    <img class="frost-art" :src="frost" alt="" />
    <div class="december-copy">
      <p>ГЕРОФАРМ объединяет коллег из разных регионов и стран. У каждой территории — свои традиции, в том числе новогодние. И даже того, кто приносит подарки, везде зовут по-разному!</p>
      <p>Помните, как в детстве мы ждали новогоднего чуда? Сегодня предлагаем познакомиться с зимними волшебниками поближе. Сможете определить, где какого Деда Мороза ждут в гости?</p>
      <p>Сопоставьте карточки: каждой республике или стране подберите имя ее новогоднего героя. Когда все пары будут готовы, проверьте себя!</p>
    </div>
    <section class="frost-game december-stack">
      <div><h2>Найдите пары</h2><p>Нажмите на карточки, чтобы составить пару.</p></div>
      <div class="frost-pairs">
        <div>
          <h3>Территории</h3>
          <button v-for="(place, index) in places" :key="place" type="button" :style="pairStyle(index)"
            :aria-pressed="selectedPlace === index" :disabled="completed || saving" @click="pick('place', index)">
            <img :src="location" alt="" />{{ place }}
          </button>
        </div>
        <div>
          <h3>Волшебники</h3>
          <button v-for="(wizard, index) in wizards" :key="wizard" type="button" :style="pairStyle(pairs.indexOf(index))"
            :aria-pressed="selectedWizard === index" :disabled="completed || saving" @click="pick('wizard', index)">
            <img :src="star" alt="" />{{ wizard }}
          </button>
        </div>
      </div>
      <p aria-live="polite"><strong>{{ totalPairs }} из {{ places.length }} пар</strong></p>
      <p v-if="checked && !completed && !links.every((value, index) => value === solution[index])" class="december-error" role="alert">Некоторые волшебники заблудились. Проверьте пары и попробуйте еще раз.</p>
      <p v-if="saveError" class="december-error" role="alert">{{ saveError }}</p>
      <p v-if="completed" role="status">Все волшебники нашли дорогу домой! Теперь вы знаете, кого ждут на Новый год в разных уголках мира.</p>
      <button v-if="completed" class="december-button" type="button" @click="emit('back')">К календарю</button>
      <button v-else class="december-button" type="button" :disabled="saving || totalPairs < places.length" @click="check">Проверить пары</button>
    </section>
    <aside class="december-panel frost-gifts">В ГЕРОФАРМ новогодние подарки вручают детям сотрудников в возрасте от 2 до 14 лет включительно. Если у вас есть ребенок этого возраста, обратитесь к своему HR бизнес-партнеру, чтобы получить подарок.</aside>
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
