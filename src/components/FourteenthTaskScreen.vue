<script setup lang="ts">
import TaskContainer from './ui/TaskContainer.vue';
import CalendarReturnButton from './ui/CalendarReturnButton.vue';
import AdventPopup from './AdventPopup.vue';
import TaskDateLabel from './ui/TaskDateLabel.vue';
import FeedbackState from './ui/FeedbackState.vue';
import { useElementRef } from '../composables/useElementRef';
import LoadingState from './ui/LoadingState.vue';
import AppButton from './ui/AppButton.vue';
import TaskLayout from './ui/TaskLayout.vue';
import AppHeader from './ui/AppHeader.vue';
import AppCard from './ui/AppCard.vue';
import { computed, nextTick, ref, watch } from 'vue';
import type { CalendarTask } from '../types/models';
import { formatDate } from '../utils/date';
import {
  findRaskobkiAnswer, raskobkiAnswers, raskobkiSlots, type RaskobkiAnswer,
} from '../content/raskobki';
import wordmark from '../assets/wish/wordmark.svg';
import dot from '../assets/raskobki/dot.svg';
import wreath from '../assets/raskobki/wreath.svg';

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
  submit: [answers: RaskobkiAnswer[]];
  edit: [];
}>();

const guess = ref('');
const solved = ref<RaskobkiAnswer[]>([]);
const feedback = ref('');
const invalid = ref(false);
const { element: panel, bind: bindPanel } = useElementRef();
const resultPopup = ref<InstanceType<typeof AdventPopup>>();
const dotCount = ref(0);
const answerIds = raskobkiAnswers;

const completed = computed(() => props.assignment?.status === 'completed');
const progressKey = computed(() => {
  const assignment = props.assignment;
  return assignment?.task ? `advent:raskobki:v2:${assignment.user_id}:${assignment.id}` : null;
});
const revealed = (answer: RaskobkiAnswer) => completed.value || solved.value.includes(answer);
const solvedCount = computed(() => answerIds.filter(revealed).length);
const allSolved = computed(() => solvedCount.value === answerIds.length);

watch(panel, (element, _, onCleanup) => {
  if (!element) return;
  const observer = new ResizeObserver(entries => {
    const box = entries[0]?.borderBoxSize[0];
    if (!box) return;
    const width = box.inlineSize, height = box.blockSize;
    // Rounded inset path has 10px removed from each axis and four 17px corners.
    const perimeter = 2 * (width + height - 20) - (8 - 2 * Math.PI) * 17;
    dotCount.value = Math.max(1, Math.round(perimeter / 11));
  });
  observer.observe(element, { box: 'border-box' });
  onCleanup(() => observer.disconnect());
}, { flush: 'post' });

watch([progressKey, completed], ([key, isComplete]) => {
  guess.value = '';
  solved.value = [];
  feedback.value = '';
  invalid.value = false;
  if (!key) return;

  try {
    if (isComplete) {
      for (const answer of answerIds) localStorage.removeItem(`${key}:${answer}`);
    } else {
      solved.value = answerIds.filter(answer => localStorage.getItem(`${key}:${answer}`) === '1');
    }
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}, { immediate: true });

watch(completed, async (isComplete, wasComplete) => {
  if (isComplete && !wasComplete) {
    await nextTick();
    resultPopup.value?.showModal();
  }
});

function edit() {
  if (!invalid.value) return;
  invalid.value = false;
  feedback.value = '';
}

function submit() {
  if (props.loading || props.saving || completed.value || !props.assignment?.task) return;
  emit('edit');
  if (allSolved.value) {
    emit('submit', [...solved.value]);
    return;
  }

  const answer = findRaskobkiAnswer(guess.value);
  invalid.value = !answer || (answer === 'technologist' && !revealed('process'));
  if (invalid.value || !answer) {
    feedback.value = 'Пока не подходит. Попробуйте другой ответ или переключитесь на соседнюю подсказку';
    return;
  }
  if (solved.value.includes(answer)) {
    feedback.value = 'Этот ответ уже вставлен. Попробуйте другую скобку.';
    return;
  }

  solved.value.push(answer);
  if (progressKey.value) {
    try {
      // Store each answer separately so parallel tabs cannot overwrite each other's progress.
      localStorage.setItem(`${progressKey.value}:${answer}`, '1');
    } catch {
      // Keep the answer in memory if the browser denies the write.
    }
  }
  guess.value = '';
  feedback.value = 'Верно! Слово появилось в тексте.';
  if (allSolved.value) emit('submit', [...solved.value]);
}
</script>

<template>
  <TaskLayout class="raskobki-page">
    <TaskContainer class="raskobki-layout">
      <AppHeader class="raskobki-header">
        <img decoding="async" :src="wordmark" alt="ГЕРОФАРМ" width="108" height="13" />
        <CalendarReturnButton @click="emit('back')" placement="header" />
      </AppHeader>
      <AppCard :ref="bindPanel" class="raskobki-panel" aria-labelledby="raskobki-title">
        <div class="raskobki-dots" aria-hidden="true">
          <img
            v-for="n in dotCount"
            :key="n"
            :src="dot"
            alt=""
            :style="{ offsetDistance: `${(n - 1) * 100 / dotCount}%` }"
          />
        </div>
        <div class="raskobki-heading">
          <img decoding="async" class="raskobki-wreath" :src="wreath" alt="" />
          <TaskDateLabel class="raskobki-date" :available-date="assignment?.available_date" :day="day" />
          <h1 id="raskobki-title">Ра[скобки]</h1>
          <p class="raskobki-badge">Обязательное задание</p>
        </div>
        <LoadingState v-if="loading" class="raskobki-notice" role="status" />
        <FeedbackState v-else-if="error" kind="error" class="raskobki-notice">
          <p>{{ error }}</p>
          <AppButton class="raskobki-button" type="button" @click="emit('retry')">Попробовать снова</AppButton>
        </FeedbackState>
        <FeedbackState v-else-if="!assignment" class="raskobki-notice" message="Задание не найдено." />
        <p v-else-if="!assignment.task" class="raskobki-notice">
          Задание откроется {{ formatDate(assignment.available_date) }}.
        </p>
        <template v-else>
          <div class="raskobki-instructions">
            <p>Чтобы увидеть целую картину, нужно разобраться в деталях. Разгадайте зашифрованное позиционирование компании в игре «ра[скобки]» — рекурсивном кроссворде, где за одной загадкой прячется следующая.</p>
            <p>Ответы на подсказки становятся словами в подсказках следующего уровня. Разгадывайте их слой за слоем, пока не раскроете всю цепочку.</p>
            <p>Если вы знаете любое слово, загаданное в квадратных скобках, — введите его в строку, и оно встанет на своё место. Когда разгадаете все слова, на экране появится зашифрованная фраза — позиционирование компании.</p>
            <p>Если какое-то слово не получается разгадать, загляните в ГЕРОФАРМ LIFE в <a href="https://t.me/+7ZwglYFwmIU3OGRi" target="_blank" rel="noopener noreferrer">Telegram</a> и <a href="https://max.ru/join/d-gd069xb3KizIdnYoydwqaBFBRk5kmEGGfmVGK5YMc" target="_blank" rel="noopener noreferrer">MAX</a> — сегодня там появятся подсказки.</p>
            <p>Это обязательное задание для получения подарка.</p>
          </div>
          <section class="raskobki-chain" aria-labelledby="raskobki-chain-title">
            <AppHeader class="raskobki-chain-header">
              <h2 id="raskobki-chain-title">Словесная цепочка</h2>
              <span role="status">{{ solvedCount }} из {{ answerIds.length }}</span>
            </AppHeader>
            <p class="raskobki-letter">
              <template v-if="revealed('gero')">{{ raskobkiSlots.gero.word }}</template><strong v-else>[{{ raskobkiSlots.gero.clue }}]</strong>ФАРМ — био<template v-if="revealed('technologist')">{{ raskobkiSlots.technologist.word }}</template><strong v-else-if="revealed('process')">[{{ raskobkiSlots.technologist.clue }}]</strong><strong v-else>[Специалист, управляющий [{{ raskobkiSlots.process.clue }}]ами на производстве]</strong>ическая компания, которая выводит Россию в <template v-if="revealed('leader')">{{ raskobkiSlots.leader.word }}</template><strong v-else>[{{ raskobkiSlots.leader.clue }}]</strong>ы по продолжительности <template v-if="revealed('asset')">{{ raskobkiSlots.asset.word }}</template><strong v-else>[{{ raskobkiSlots.asset.clue }}]</strong>ной жизни.
            </p>
          </section>
          <form v-if="!completed" class="raskobki-form" :aria-busy="saving" @submit.prevent="submit">
            <template v-if="!allSolved">
              <label for="raskobki-guess">Ваш ответ</label>
              <div class="raskobki-field" :class="{ 'is-invalid': invalid }">
                <input
                  id="raskobki-guess"
                  v-model="guess"
                  type="text"
                  placeholder="Ваш ответ"
                  autocomplete="off"
                  spellcheck="false"
                  maxlength="120"
                  :aria-invalid="invalid"
                  aria-describedby="raskobki-feedback"
                  @input="edit"
                />
              </div>
            </template>
            <p id="raskobki-feedback" class="raskobki-feedback" role="status">{{ saveError || feedback }}</p>
            <AppButton :loading="saving" class="raskobki-button" type="submit" :disabled="saving">
              {{ saving ? 'Сохраняем…' : allSolved ? 'Сохранить результат' : 'Вставить слово' }}
            </AppButton>
          </form>
        </template>
        <CalendarReturnButton v-if="!loading && !error && assignment?.task" class="task-content-return" :completed="completed" @click="emit('back')" />
      </AppCard>
      <footer class="raskobki-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </TaskContainer>
    <AdventPopup ref="resultPopup" title="Все скобки раскрыты — история разгадана!" message="Обязательное задание выполнено." button-text="К календарю" @action="emit('back')" />
  </TaskLayout>
</template>

<style scoped>
:global(#app:has(.raskobki-page)) { width: 100%; border: 0; }

.raskobki-page {
  --raskobki-red: var(--color-action);
  --raskobki-gold: #fff1cf;
  box-sizing: border-box;
  min-height: 100svh;
  background: linear-gradient(110deg, #090807, #291209 22%, #743012 48%, #cf5515 73%, #ff941f);
  color: #70492c;
  color-scheme: light;
  font: 400 14px/20px var(--font-ui);
  letter-spacing: 0;
  text-align: left;
}

.raskobki-layout {
  box-sizing: border-box;
  max-width: 760px;
  margin-inline: auto;
  padding: 0 16px 26px;
}

.raskobki-header {
  position: relative;
  box-sizing: border-box;
  height: 94px;
  padding-top: 34px;
}

.raskobki-header img { display: block; margin-inline: auto; }

button { cursor: pointer; font: inherit; letter-spacing: inherit; }

.raskobki-header button {
  position: absolute;
  top: 47px;
  left: 0;
  min-height: 44px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: var(--raskobki-gold);
  font-size: 12px;
}

.raskobki-panel {
  position: relative;
  isolation: isolate;
  padding: 30px 24px;
}

.raskobki-panel::before, .raskobki-chain::before, .raskobki-result::before, .raskobki-field::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  content: '';
  pointer-events: none;
}

.raskobki-panel::before {
  border-image: url('../assets/raskobki/panel.svg') 24 fill / 24px stretch;
}

.raskobki-dots { position: absolute; inset: 0; z-index: -1; overflow: clip; pointer-events: none; }

.raskobki-dots img {
  position: absolute;
  top: 0;
  left: 0;
  offset-path: inset(5px round 17px);
  offset-rotate: 0deg;
}

.raskobki-heading { position: relative; padding-right: 56px; }
.raskobki-wreath { position: absolute; top: -5px; right: 1px; display: block; }
.raskobki-date { color: var(--raskobki-red); font-size: 12px; line-height: 15px; font-weight: 700; }

.raskobki-heading h1 {
  margin: 13px 0 11px;
  color: var(--color-ink);
  font: 500 28px/30px var(--font-display);
  letter-spacing: 0;
}

.raskobki-badge {
  display: inline-flex;
  align-items: center;
  min-height: 25px;
  padding: 0 8px;
  border-radius: 5px;
  background: var(--raskobki-red) url('../assets/raskobki/badge.svg') center / 100% 100% no-repeat;
  color: var(--raskobki-gold);
  font-size: 11px;
  line-height: 15px;
}

.raskobki-instructions, .raskobki-notice { margin-top: 23px; }
.raskobki-instructions { padding-inline: 4px; }
.raskobki-instructions p + p { margin-top: 20px; }
.raskobki-notice { min-height: 90px; }
.raskobki-notice .raskobki-button { margin-top: 16px; }

.raskobki-chain, .raskobki-result {
  position: relative;
  isolation: isolate;
  padding: 14px 20px 24px;
  border-radius: 16px;
}

.raskobki-chain { margin-top: 24px; }
.raskobki-chain::before { border-image: url('../assets/raskobki/chain.svg') 17 fill / 17px stretch; }

.raskobki-chain-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 15px;
}

.raskobki-chain-header h2 { margin: 0; color: inherit; font: inherit; letter-spacing: 0; }
.raskobki-chain-header span { white-space: nowrap; }

.raskobki-letter {
  color: var(--raskobki-red);
  font: 400 16px/22px var(--font-display);
  overflow-wrap: anywhere;
}

.raskobki-letter strong { font-weight: 700; }

.raskobki-form { margin-top: 22px; }
.raskobki-form label { display: block; margin-bottom: 10px; }

.raskobki-field { position: relative; isolation: isolate; border-radius: 12px; }
.raskobki-field::before { border-image: url('../assets/raskobki/input.svg') 13 fill / 13px stretch; }
.raskobki-field.is-invalid::before { border-image-source: url('../assets/raskobki/input-error.svg'); }

.raskobki-field input {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 52px;
  padding: 0 16px;
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
}

.raskobki-field input::placeholder { color: #947a62; opacity: 1; }
.raskobki-field.is-invalid input { color: var(--raskobki-red); }

.raskobki-feedback { margin: 10px 0 0; color: var(--raskobki-red); font-size: 12px; line-height: 15px; }
.raskobki-feedback:empty { margin: 0; }

.raskobki-button {
  display: block;
  width: 100%;
  min-height: 52px;
  padding: 8px 12px;
  border: 0;
  border-radius: 13px;
  background: var(--raskobki-red) url('../assets/raskobki/button.svg') center / 100% 100% no-repeat;
  color: var(--raskobki-gold);
  font-weight: 700;
}

.raskobki-form .raskobki-button { margin-top: 24px; }
.raskobki-button:hover:not(:disabled) { filter: brightness(1.08); }
.raskobki-button:disabled { opacity: .75; cursor: wait; }
button:focus-visible, input:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }

.raskobki-result { margin-top: 18px; padding-bottom: 20px; }
.raskobki-result::before { border-image: url('../assets/raskobki/result.svg') 17 fill / 17px stretch; }

.raskobki-result h2 {
  margin: 0 0 12px;
  color: var(--color-ink);
  font: 400 22px/28px var(--font-display);
  letter-spacing: 0;
}

.raskobki-calendar {
  min-height: 42px;
  margin-top: 18px;
  background-image: url('../assets/raskobki/result-button.svg');
}

.raskobki-footer {
  margin-top: 27px;
  color: var(--raskobki-gold);
  font-size: 12px;
  line-height: 15px;
  text-align: center;
}

@media (max-width: 359px) {
  .raskobki-layout { padding-inline: 12px; }
  .raskobki-panel { padding-inline: 18px; }
  .raskobki-chain, .raskobki-result { padding-inline: 14px; }
}

@media (min-width: 768px) {
  .raskobki-layout { padding-inline: 32px; }
  .raskobki-panel { padding-inline: 32px; }
}

.task-content-return { margin-top: 24px; }
</style>
