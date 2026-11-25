<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import PopupDialog from './PopupDialog.vue';
import { findWord, normalizeWord, wordPrediction, wordSearchRows } from '../content/word-search';
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
const prediction = computed(() => wordPrediction(savedWord.value));
const result = ref<HTMLElement>();
watch(completed, async (value) => {
  if (!value) return;
  enlarged.value = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
  result.value?.focus({ preventScroll: true });
}, { flush: 'post' });

function submit() {
  if (props.saving || completed.value) return;
  const word = normalizeWord(answer.value);
  invalid.value = !findWord(word).length;
  if (!invalid.value) emit('save', { response: { word }, complete: true });
}
</script>

<template>
  <DecemberTaskLayout v-bind="props" :title="completed ? 'Ваше напутствие на 2027 год' : 'Найдите свое предсказание на Новый год'" @back="emit('back')" @retry="emit('retry')">
    <template v-if="!completed" #title><span class="word-heading-line">Найдите свое предсказание</span> <span class="word-heading-line">на Новый год</span></template>
    <section v-if="completed" ref="result" class="december-panel word-result december-stack" tabindex="-1" aria-label="Напутствие">
      <strong v-if="prediction">{{ savedWord }}</strong>
      <p>{{ prediction ?? 'Напутствие не удалось восстановить.' }}</p>

    </section>
    <template v-else>
      <div class="december-copy">
        <p>Иногда для хорошего напутствия достаточно одного слова. Посмотрите на поле с буквами: слова спрятаны по горизонтали и вертикали.</p>
        <p>Какое из них первым бросилось вам в глаза? Впишите его в поле и нажмите «Сверить курс».</p>
        <p>Пусть найденное слово станет добрым напутствием на 2027 год — или подсказкой, что стоит впустить в свою жизнь</p>
      </div>
      <section class="december-panel word-panel">
        <div class="word-toolbar">
          <span>Поле с буквами</span>
          <button class="december-link" type="button" @click="enlarged = true">Увеличить ↗</button>
        </div>
        <div class="word-grid" aria-label="Поле с буквами">
          <span v-for="(letter, index) in letters" :key="index">{{ letter }}</span>
        </div>
        <p>Ищите слова по горизонтали и вертикали.</p>
      </section>
      <form class="december-stack word-result" @submit.prevent="submit">
        <label class="december-field">
          Первое найденное слово
          <input v-model="answer" autocomplete="off" placeholder="Введите слово" :aria-invalid="invalid" :disabled="saving" @input="invalid = false; emit('edit')" />
        </label>
        <p v-if="invalid || saveError" class="december-error" role="alert">{{ invalid ? 'Кажется, это слово пока прячется даже от нас. Проверьте написание: введите одно из слов, спрятанных в сетке.' : saveError }}</p>
        <button class="december-button task-action" :disabled="saving">Сверить курс</button>
      </form>
      <PopupDialog v-model:open="enlarged" class="december-dialog word-dialog december-stack" aria-labelledby="word-dialog-title">
        <button class="december-dialog-close" type="button" aria-label="Закрыть" @click="enlarged = false">×</button>
        <h2 id="word-dialog-title">Найдите свои слова</h2>
        <p>Прокручивайте поле в любую сторону.</p>
        <div class="word-scroll" tabindex="0" aria-label="Увеличенное поле с буквами">
          <div class="word-grid">
            <span v-for="(letter, index) in letters" :key="index">{{ letter }}</span>
          </div>
        </div>
      </PopupDialog>
    </template>
  </DecemberTaskLayout>
</template>

<style scoped>
:deep(h1) { max-width: none; font-size: clamp(20px, 5.5vw, 28px); line-height: 1.15; }
.word-heading-line { display: block; white-space: nowrap; }
.word-panel, .word-result { margin-top: 24px; }
.word-panel { padding: 10px; font-size: 12px; }
.word-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 14px; }
.word-toolbar button { font-weight: 700; }
.word-panel > p { margin-top: 10px; }
.word-grid { display: grid; grid-template-columns: repeat(18, minmax(0, 1fr)); border-top: 1px solid #e6d6bc; border-left: 1px solid #e6d6bc; }
.word-grid > span { display: grid; place-items: center; aspect-ratio: 1; border-right: 1px solid #e6d6bc; border-bottom: 1px solid #e6d6bc; background: #fffbf2; color: var(--dec-ink); font-size: clamp(8px, 2.6vw, 16px); line-height: 1; font-weight: 700; }
.word-result strong { background: #f4cd7b; text-transform: capitalize; justify-self: start; padding: 7px 12px; border-radius: 8px; color: var(--dec-red); }
.word-dialog { width: min(520px, calc(100% - 20px)); padding: 18px; }
.word-dialog[open] { display: grid; }
.word-scroll { max-height: 65svh; overflow: auto; }
.word-scroll .word-grid { width: 648px; }
.word-scroll .word-grid > span { font-size: 20px; }
@media (min-width: 768px) { .word-heading-line { display: inline; } }
</style>
