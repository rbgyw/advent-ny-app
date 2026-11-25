<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import ImageSearchBoard from './ImageSearchBoard.vue';
import type { DecemberTaskEvents, DecemberTaskProps } from '../types/december';
import { freshSearch, isSearchHit, remainingSearchSeconds, restoreSearch, searchAttempts, settleSearch, startSearch, type SearchPoint, type SearchProgress } from '../utils/podzhik';
import { podzhikBounds, podzhikTarget } from '../content/podzhik';
import sample from '../assets/dec-19/podzhik-sample.png';
import found from '../assets/dec-19/podzhik-found.png';
import scene from '../assets/dec-19/search-panorama.webp';

const props = defineProps<DecemberTaskProps>();
const emit = defineEmits<DecemberTaskEvents>();
const progress = ref<SearchProgress>(freshSearch());
const now = ref(Date.now());
const feedback = ref('');
const selection = ref<SearchPoint | null>(null);
const storageWarning = ref(false);
const sceneReady = ref(false);
const targetReady = ref(false);
const imagesReady = computed(() => sceneReady.value && targetReady.value);
const sceneFailed = ref(false);
const targetFailed = ref(false);
const imagesFailed = computed(() => sceneFailed.value || targetFailed.value);
const imageRetry = ref(0);
const awaitingSave = ref(false);
const board = ref<HTMLElement>();
const completed = computed(() => props.assignment?.status === 'completed');
const success = computed(() => completed.value || progress.value.found);
const active = computed(() => !success.value && progress.value.deadline !== null);
const seconds = computed(() => remainingSearchSeconds(progress.value, now.value));
const timer = computed(() => `${Math.floor(seconds.value / 60).toString().padStart(2, '0')}:${(seconds.value % 60).toString().padStart(2, '0')}`);
const ready = computed(() => Boolean(props.assignment?.task) && !props.loading && !props.error);
const progressKey = computed(() => {
  const assignment = props.assignment;
  return assignment?.task ? `advent:podzhik:v1:${assignment.user_id}:${assignment.id}` : null;
});
const sceneSource = computed(() => imageRetry.value ? `${scene}?retry=${imageRetry.value}` : scene);

function persist(next: SearchProgress) {
  progress.value = next;
  if (!progressKey.value) return;
  try {
    localStorage.setItem(progressKey.value, JSON.stringify(next));
  } catch {
    storageWarning.value = true;
  }
}

function tick() {
  now.value = Date.now();
  const settled = settleSearch(progress.value, now.value);
  if (settled !== progress.value) {
    persist(settled);
    feedback.value = '';
    selection.value = null;
  }
}

function sendSuccess() {
  if (!ready.value || completed.value || props.saving || awaitingSave.value || !progress.value.found) return;
  awaitingSave.value = true;
  emit('edit');
  // Attempts, coordinates and elapsed time remain in the browser.
  emit('save', { response: { solved: true }, complete: true });
}

watch([progressKey, completed], async ([key, done]) => {
  awaitingSave.value = false;
  feedback.value = '';
  selection.value = null;
  storageWarning.value = false;
  progress.value = freshSearch();
  now.value = Date.now();
  if (!key) return;
  try {
    if (done) localStorage.removeItem(key);
    else {
      const saved = localStorage.getItem(key);
      progress.value = restoreSearch(saved, now.value);
      if (saved !== null && JSON.stringify(progress.value) !== saved) persist(progress.value);
    }
  } catch {
    storageWarning.value = true;
  }
  if (progress.value.found && !done) {
    await nextTick();
    if (key === progressKey.value) sendSuccess();
  }
}, { immediate: true });

watch([() => props.saving, () => props.saveError], ([saving, error]) => {
  if (!saving || error) awaitingSave.value = false;
});

watch(() => progress.value.deadline, (deadline, _, onCleanup) => {
  if (deadline === null) return;
  const interval = window.setInterval(tick, 250);
  onCleanup(() => window.clearInterval(interval));
});

function syncStorage(event: StorageEvent) {
  if (event.key !== progressKey.value || completed.value) return;
  const next = restoreSearch(event.newValue);
  // A confirmed local find cannot be erased by a stale tab.
  if (progress.value.found && !next.found) return;
  progress.value = next;
  tick();
}
onMounted(() => {
  document.addEventListener('visibilitychange', tick);
  window.addEventListener('storage', syncStorage);
});
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', tick);
  window.removeEventListener('storage', syncStorage);
});

async function begin() {
  if (!ready.value || props.saving || !imagesReady.value || success.value) return;
  // Re-read before starting so another tab's running attempt is never restarted.
  try {
    const saved = progressKey.value && localStorage.getItem(progressKey.value);
    if (saved) progress.value = restoreSearch(saved);
  } catch { storageWarning.value = true; }
  tick();
  const next = startSearch(progress.value, now.value);
  if (next.found || next.attemptsLeft === 0) return;
  persist(next);
  feedback.value = '';
  selection.value = null;
  emit('edit');
  const key = progressKey.value;
  await nextTick();
  if (key !== progressKey.value) return;
  board.value?.scrollIntoView({ block: 'start', behavior: 'instant' });
  board.value?.focus({ preventScroll: true });
}

function choose(point: SearchPoint) {
  tick();
  if (!ready.value || !active.value || props.saving || seconds.value === 0) return;
  selection.value = point;
  feedback.value = 'Метка поставлена. Нажмите «Проверить выбор».';
}

function checkSelection() {
  tick();
  const selected = selection.value;
  if (!ready.value || !active.value || props.saving || seconds.value === 0 || !selected) return;
  if (!isSearchHit(selected, podzhikTarget, podzhikBounds)) {
    feedback.value = 'Здесь Поджика нет. Продолжайте искать!';
    return;
  }
  persist({ ...progress.value, found: true, deadline: null });
  feedback.value = '';
  sendSuccess();
}

function retryImage() {
  sceneFailed.value = false;
  targetFailed.value = false;
  sceneReady.value = false;
  targetReady.value = false;
  imageRetry.value++;
}
</script>

<template>
  <DecemberTaskLayout v-if="!success" :assignment="assignment" :day="day" :total="total" :loading="loading" :error="error"
    title="Где же Поджик?" mandatory @back="emit('back')" @retry="emit('retry')">
    <img v-if="!success" :key="imageRetry" class="podzhik-preload" :src="sceneSource" alt="" aria-hidden="true"
      @load="sceneReady = true; sceneFailed = false" @error="sceneFailed = true; sceneReady = false" />
    <img v-if="!success" :key="`target:${imageRetry}`" class="podzhik-preload podzhik-target-preload" :src="found" alt="" aria-hidden="true"
      @load="targetReady = true; targetFailed = false" @error="targetFailed = true; targetReady = false" />

    <section v-if="progress.attemptsLeft === 0" class="december-stack podzhik-result" role="status">
      <h2>Попытки закончились</h2>
      <p>Пять попыток использованы. В этот раз найти Поджика не удалось.</p>
      <p class="podzhik-attempts">Осталось попыток: 0</p>

    </section>

    <template v-else>
      <div v-if="active" ref="board" class="podzhik-game" tabindex="-1">
        <div class="podzhik-stats december-panel">
          <div><p>Время</p><output role="timer" :aria-label="`Осталось ${seconds} секунд`">{{ timer }}</output></div>
          <div><p>Осталось попыток</p><strong>{{ progress.attemptsLeft }} / {{ searchAttempts }}</strong></div>
        </div>
        <ImageSearchBoard :src="sceneSource" :scene-width="2617" :scene-height="1982" :max-zoom="6" :disabled="saving || !imagesReady" @choose="choose" />
        <button class="december-button podzhik-check task-action" type="button" :disabled="saving || !imagesReady || !selection" @click="checkSelection">Проверить выбор</button>
        <p v-if="feedback" class="podzhik-feedback" role="status">{{ feedback }}</p>
        <p v-else class="podzhik-note">Сначала выберите точку на картинке.</p>
        <p class="podzhik-note">Таймер продолжает идти, даже если свернуть или перезагрузить страницу. Промахи не расходуют попытку.</p>
      </div>

      <div v-else-if="progress.attemptsLeft < searchAttempts" class="december-stack podzhik-result" role="status">
        <h2>Время вышло</h2>
        <p>Минута пролетела, а Поджик все еще прячется! Попробуйте снова — теперь вы знаете, где уже искали.</p>
        <p class="podzhik-attempts">Осталось попыток: {{ progress.attemptsLeft }}</p>
        <button class="december-button task-action" type="button" :disabled="!imagesReady || saving" @click="begin">Попробовать еще раз</button>
      </div>

      <template v-else>
        <div class="december-copy">
          <p>Знакомьтесь, Поджик — персонаж ГЕРОФАРМ, символизирующий поджелудочную железу. Он помогает рассказывать о сахарном диабете и важности заботы о здоровье.</p>
          <p>Поджика можно встретить в книге «Лисёна-сластёна», в детской поликлинике в Серпухове и даже в виде мягкой игрушки. А сегодня он спрятался на картинке — попробуйте его найти!</p>
          <p>Сначала рассмотрите персонажа на образце и запомните его приметы. Затем нажмите «Начать»: на поиски будет 1 минута. Всего доступно 5 попыток.</p>
          <p><em>Это обязательное задание для получения подарка.</em></p>
        </div>
        <figure class="podzhik-sample december-panel">
          <img :src="sample" width="104" height="159" alt="Белый пушистый Поджик с голубыми глазами, красным сердечком и красными ножками" />
          <figcaption>Его приметы — белый пушистый силуэт, голубые глаза, красное сердечко и красные ножки.</figcaption>
        </figure>
        <section class="podzhik-rules" aria-labelledby="podzhik-rules-title">
          <h2 id="podzhik-rules-title">Как играть</h2>
          <ol>
            <li>Запомните, как выглядит Поджик на образце, и нажмите «Начать».</li>
            <li>Появится картинка и запустится таймер — на поиски есть 60 секунд.</li>
            <li>Найдите Поджика, нажмите на него и затем на кнопку «Проверить выбор» до окончания времени.</li>
            <li>Если время закончится, можно попробовать снова. Картинка останется прежней — используйте то, что уже успели рассмотреть!</li>
          </ol>
        </section>
        <p class="podzhik-tip">На поиск — 1 минута и 5 попыток. Можно увеличивать и прокручивать изображение. Промах не останавливает таймер.</p>
        <p class="podzhik-attempts">Осталось попыток: {{ progress.attemptsLeft }}</p>
        <button class="december-button podzhik-start task-action" type="button" :disabled="!imagesReady || saving" @click="begin">
          {{ imagesReady ? 'Начать' : imagesFailed ? 'Картинка недоступна' : 'Загружаем картинку…' }}
        </button>
      </template>

      <div v-if="imagesFailed" class="podzhik-image-error december-stack" role="alert">
        <p>Не удалось загрузить картинку для поиска.</p>
        <button class="december-button secondary task-action" type="button" @click="retryImage">Загрузить картинку ещё раз</button>
      </div>
    </template>
    <p v-if="storageWarning && !completed" class="podzhik-note" role="status">Браузер не разрешил сохранить прогресс. Не закрывайте страницу до завершения игры.</p>
  </DecemberTaskLayout>
  <DecemberTaskLayout v-else :assignment="assignment" :day="day" :total="total" :loading="loading" :error="error"
    title="" result mandatory @back="emit('back')" @retry="emit('retry')">
    <section class="december-stack podzhik-result" aria-labelledby="podzhik-result-title" role="status">
      <h2 id="podzhik-result-title">Вот он! Поджик найден.</h2>
      <p v-if="completed">Отличная работа! Обязательное задание выполнено.</p>
      <p v-else-if="saving || awaitingSave" role="status">Отличная работа! Сохраняем успешное прохождение…</p>
      <p v-else>Поджик найден. Сохраните успешное прохождение, чтобы задание было отмечено выполненным.</p>
      <p v-if="saveError && !completed" class="december-error" role="alert">{{ saveError }}</p>
      <button v-if="!completed" class="december-button task-action" type="button" :disabled="saving || awaitingSave" @click="sendSuccess">
        {{ saving || awaitingSave ? 'Сохраняем…' : 'Повторить сохранение' }}
      </button>
    </section>
  </DecemberTaskLayout>
</template>

<style scoped>
:deep(h1) { max-width: 245px; }
.podzhik-preload { display: none; }
.podzhik-sample { display: grid; grid-template-columns: 88px minmax(0, 1fr); align-items: center; gap: 14px; margin: 28px 0 24px; padding: 8px 16px 8px 0; }
.podzhik-sample img { display: block; width: 104px; height: 159px; max-width: none; margin-left: -5px; }
.podzhik-sample figcaption { font-size: 13px; line-height: 19px; }
.podzhik-rules h2 { font-weight: 600; font-size: 20px; }
.podzhik-rules ol { display: grid; gap: 12px; margin: 16px 0 0; padding-left: 20px; }
.podzhik-tip { margin-top: 22px; padding: 14px; border-left: 2px solid var(--dec-red); border-radius: 0 8px 8px 0; background: linear-gradient(160deg, #fffdf5, #f7e8cb); }
.podzhik-attempts { margin-top: 20px; color: var(--dec-red); font-weight: 700; }
.podzhik-start { margin-top: 16px; }
.podzhik-stats { display: grid; grid-template-columns: 1fr 1fr; padding: 13px 16px; background: #fff2d4; }
.podzhik-stats p { font-size: 12px; line-height: 16px; }
.podzhik-stats output, .podzhik-stats strong { display: block; margin-top: 3px; color: var(--dec-red); font-size: 22px; line-height: 27px; font-weight: 700; font-variant-numeric: tabular-nums; }
.podzhik-game { scroll-margin-top: 16px; }
.podzhik-check { margin-top: 20px; }
.podzhik-feedback { min-height: 40px; margin-top: 16px; color: var(--dec-red); }
.podzhik-note { margin-top: 16px; font-size: 12px; line-height: 18px; }
.podzhik-result { --dec-red: #a7280b; --dec-paper: #fcf6e8; --dec-ink: #623c28; color: #623c28; color-scheme: light; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; }
.podzhik-result h2 { color: #623c28; font: 600 22px/27px 'Advent STIX', serif; letter-spacing: 0; }
.podzhik-found { position: absolute; right: 0; top: 24px; display: block; }
.podzhik-result .podzhik-attempts { margin-top: 0; }
.podzhik-image-error { margin-top: 16px; color: var(--dec-red); }
@media (max-width: 359px) { .podzhik-sample { grid-template-columns: 74px minmax(0, 1fr); gap: 10px; padding-right: 12px; } .podzhik-sample img { margin-left: -14px; } }
</style>
