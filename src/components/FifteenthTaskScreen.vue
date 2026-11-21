<script setup lang="ts">
import { computed, ref } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import PopupDialog from './PopupDialog.vue';
import { findWord, normalizeWord, wordSearchRows } from '../content/word-search';
import type { DecemberTaskProps, DecemberTaskEvents } from '../types/december';

const props = defineProps<DecemberTaskProps>();
const emit = defineEmits<DecemberTaskEvents>();
const letters = wordSearchRows.join('').split('');
const answer = ref('');
const enlarged = ref(false);
const invalid = ref(false);
const completed = computed(() => props.assignment?.status === 'completed');
const savedWord = computed(() => {
  const word = props.assignment?.response?.response.word;
  return typeof word === 'string' ? word : '';
});
const marked = computed(() => new Set(completed.value ? findWord(savedWord.value) : []));

function submit() {
  if (props.saving || completed.value) return;
  const word = normalizeWord(answer.value);
  invalid.value = !findWord(word).length;
  if (!invalid.value) emit('save', { response: { word }, complete: true });
}
</script>

<template>
  <DecemberTaskLayout v-bind="props" :task-number="15" title="Найдите свое предсказание на Новый год" @back="emit('back')" @retry="emit('retry')">
    <div class="december-copy">
      <p>Иногда для хорошего напутствия достаточно одного слова. Посмотрите на поле с буквами: слова спрятаны по горизонтали и вертикали.</p>
      <p>Какое из них первым бросилось вам в глаза? Впишите его в поле и нажмите «Сверить курс».</p>
      <p>Пусть найденное слово станет добрым напутствием на 2027 год — или подсказкой, чего хочется добавить в свою жизнь.</p>
    </div>
    <section class="december-panel word-panel">
      <div class="word-toolbar">
        <span>Поле с буквами</span>
        <button class="december-link" type="button" @click="enlarged = true">Увеличить ↗</button>
      </div>
      <div class="word-grid" aria-label="Поле с буквами">
        <span v-for="(letter, index) in letters" :key="index" :class="{ marked: marked.has(index) }">{{ letter }}</span>
      </div>
      <p>Ищите слова по горизонтали и вертикали.</p>
    </section>
    <section v-if="completed" class="december-panel word-result december-stack">
      <h2>Ваше напутствие на 2027 год</h2>
      <strong v-if="savedWord">{{ savedWord }}</strong>
      <p>Отличное напутствие на следующий год! Пусть за этим словом появятся счастливые события, новые возможности и ваши личные победы.</p>
      <button class="december-button" type="button" @click="emit('back')">К календарю</button>
    </section>
    <form v-else class="december-stack word-result" @submit.prevent="submit">
      <label class="december-field">
        Первое найденное слово
        <input v-model="answer" autocomplete="off" placeholder="Введите слово" :aria-invalid="invalid" :disabled="saving" @input="invalid = false; emit('edit')" />
      </label>
      <p v-if="invalid || saveError" class="december-error" role="alert">{{ invalid ? 'Кажется, это слово пока прячется даже от нас. Проверьте написание: введите одно из слов, спрятанных в сетке.' : saveError }}</p>
      <button class="december-button" :disabled="saving">Сверить курс</button>
    </form>
    <PopupDialog v-model:open="enlarged" class="december-dialog word-dialog december-stack" aria-labelledby="word-dialog-title">
      <button class="december-dialog-close" type="button" aria-label="Закрыть" @click="enlarged = false">×</button>
      <h2 id="word-dialog-title">Найдите свои слова</h2>
      <p>Прокручивайте поле в любую сторону.</p>
      <div class="word-scroll" tabindex="0" aria-label="Увеличенное поле с буквами">
        <div class="word-grid">
          <span v-for="(letter, index) in letters" :key="index" :class="{ marked: marked.has(index) }">{{ letter }}</span>
        </div>
      </div>
    </PopupDialog>
  </DecemberTaskLayout>
</template>

<style scoped>
:deep(h1) { max-width: 225px; }
.word-panel, .word-result { margin-top: 24px; }
.word-panel { padding: 10px; font-size: 12px; }
.word-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 14px; }
.word-toolbar button { font-weight: 700; }
.word-panel > p { margin-top: 10px; }
.word-grid { display: grid; grid-template-columns: repeat(18, minmax(0, 1fr)); border-top: 1px solid #e6d6bc; border-left: 1px solid #e6d6bc; }
.word-grid > span { display: grid; place-items: center; aspect-ratio: 1; border-right: 1px solid #e6d6bc; border-bottom: 1px solid #e6d6bc; background: #fffbf2; color: var(--dec-ink); font-size: clamp(8px, 2.6vw, 16px); line-height: 1; font-weight: 700; }
.word-grid > .marked, .word-result strong { background: #f4cd7b; }
.word-result strong { justify-self: start; padding: 7px 12px; border-radius: 8px; color: var(--dec-red); }
.word-dialog { width: min(520px, calc(100% - 20px)); padding: 18px; }
.word-dialog[open] { display: grid; }
.word-scroll { max-height: 65svh; overflow: auto; }
.word-scroll .word-grid { width: 648px; }
.word-scroll .word-grid > span { font-size: 20px; }
</style>
