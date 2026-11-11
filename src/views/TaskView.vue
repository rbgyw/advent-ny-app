<template>
  <FirstTaskScreen
    v-if="day === 1"
    :assignment="assignment"
    :loading="calendarStore.loading"
    :error="calendarStore.error"
    :total="calendarStore.totalCount"
    @back="goBack"
    @retry="reloadFirstTask"
  />
  <SecondTaskScreen
    v-else-if="isCipherTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @submit="solveCipher"
    @edit="calendarStore.saveError = null"
  />
  <ThirdTaskScreen
    v-else-if="isMemoryTask"
    v-model="answer"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :user-id="authStore.user?.id"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @submit="shareMemory"
    @busy="attachmentsBusy = $event"
    @edit="calendarStore.saveError = null"
  />
  <FourthTaskScreen
    v-else-if="isCrosswordTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :user-id="authStore.user?.id"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @submit="solveCrossword"
    @edit="calendarStore.saveError = null"
  />
  <FifthTaskScreen
    v-else-if="isPairsTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :user-id="authStore.user?.id"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @submit="solvePairs"
    @edit="calendarStore.saveError = null"
  />
  <SixthTaskScreen
    v-else-if="isTarotTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :user-id="authStore.user?.id"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @draw="drawTarot"
    @edit="calendarStore.saveError = null"
  />
  <EighthTaskScreen
    v-else-if="isGratitudeTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :error="calendarStore.error"
    :send="sendLetter"
    @back="goBack"
    @retry="reloadFirstTask"
  />
  <EleventhTaskScreen
    v-else-if="isStereogramTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @submit="solveStereogram"
    @edit="calendarStore.saveError = null"
  />
  <TwelfthTaskScreen
    v-else-if="isFilmTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @submit="recommendFilm"
    @edit="calendarStore.saveError = null"
  />
  <ThirteenthTaskScreen
    v-else-if="isWishTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @confirm="makeWish"
    @edit="calendarStore.saveError = null"
  />
  <FourteenthTaskScreen
    v-else-if="isRaskobkiTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @submit="solveRaskobki"
    @edit="calendarStore.saveError = null"
  />
  <TwentyFirstTaskScreen
    v-else-if="isNonogramTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @submit="solveNonogram"
    @edit="calendarStore.saveError = null"
  />
  <main v-else class="task-page">
    <button type="button" @click="goBack">← Назад к календарю</button>

    <h1>День {{ day }}</h1>

    <p v-if="calendarStore.loading">Загружаем задание...</p>

    <p v-else-if="calendarStore.error" class="error">
      {{ calendarStore.error }}
    </p>

    <p v-else-if="!assignment">Задание не найдено.</p>

    <section v-else-if="!assignment.task">
      <h2>Задание пока закрыто</h2>
      <p>Откроется {{ formatDate(assignment.available_date) }}</p>
    </section>

    <section v-else>
      <h2>{{ assignment.task.title }}</h2>

      <p>{{ assignment.task.description }}</p>

      <p>
        Статус:
        <strong>{{ taskStatusLabels[assignment.status] }}</strong>
      </p>

      <!-- Временный универсальный редактор -->
      <div class="task-editor">
        <label for="task-answer"> Ваш ответ </label>

        <textarea
          id="task-answer"
          v-model="answer"
          rows="6"
          :disabled="
            calendarStore.saving ||
            editingSaving ||
            (isCompleted && !editingCompleted)
          "
          placeholder="Введите ответ..."
        />
      </div>

      <TaskAttachments
        v-if="supportsPhotos && authStore.user"
        :key="`${authStore.user.id}:${assignment.task_id}`"
        :task-id="assignment.task_id"
        :readonly="isCompleted && !(isAdmin && editingCompleted)"
        :disabled="calendarStore.saving || editingSaving"
        @busy="attachmentsBusy = $event"
      />

      <p v-if="calendarStore.saveError" class="error">
        {{ calendarStore.saveError }}
      </p>

      <div v-if="isCompleted">
        <p class="success">Задание выполнено!</p>

        <button
          v-if="isAdmin && !editingCompleted"
          type="button"
          :disabled="calendarStore.loading || attachmentsBusy"
          @click="editingCompleted = true"
        >
          Редактировать ответ
        </button>

        <div v-if="isAdmin && editingCompleted" class="task-actions">
          <button
            type="button"
            :disabled="editingSaving || attachmentsBusy || !answer.trim()"
            @click="saveCompletedEdit"
          >
            {{ editingSaving ? "Сохраняем..." : "Сохранить изменения" }}
          </button>

          <button
            type="button"
            :disabled="editingSaving || attachmentsBusy"
            @click="cancelCompletedEdit"
          >
            Отмена
          </button>
        </div>

        <p v-if="editingError" class="error">
          {{ editingError }}
        </p>
      </div>

      <div v-else class="task-actions">
        <button
          type="button"
          :disabled="calendarStore.saving || attachmentsBusy"
          @click="saveDraft"
        >
          Сохранить черновик
        </button>

        <button
          type="button"
          :disabled="calendarStore.saving || attachmentsBusy || !answer.trim()"
          @click="completeTask"
        >
          Завершить задание
        </button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

import { useAuthStore } from "../stores/auth";
import { useCalendarStore } from "../stores/calendar";
import { formatDate } from "../utils/date";
import { taskStatusLabels } from "../const/task_status";
import TaskAttachments from "../components/TaskAttachments.vue";
import { sendGratitude } from '../services/gratitude.service';
import type { GratitudeLetter } from '../utils/gratitude';
import type { FilmRecommendation } from '../utils/film';
import FirstTaskScreen from "../components/FirstTaskScreen.vue";
import { memorySubmissionOpen } from "../utils/memory";
import type { CrosswordValues } from "../utils/crossword";
import type { RaskobkiAnswer } from '../content/raskobki';
import type { CellMark } from '../content/nonogram';
const SecondTaskScreen = defineAsyncComponent(() => import("../components/SecondTaskScreen.vue"));
const ThirdTaskScreen = defineAsyncComponent(() => import("../components/ThirdTaskScreen.vue"));
const FourthTaskScreen = defineAsyncComponent(() => import("../components/FourthTaskScreen.vue"));
const FifthTaskScreen = defineAsyncComponent(() => import("../components/FifthTaskScreen.vue"));
const SixthTaskScreen = defineAsyncComponent(() => import("../components/SixthTaskScreen.vue"));
const EighthTaskScreen = defineAsyncComponent(() => import('../components/EighthTaskScreen.vue'));
const EleventhTaskScreen = defineAsyncComponent(() => import('../components/EleventhTaskScreen.vue'));
const TwelfthTaskScreen = defineAsyncComponent(() => import('../components/TwelfthTaskScreen.vue'));
const ThirteenthTaskScreen = defineAsyncComponent(() => import('../components/ThirteenthTaskScreen.vue'));
const FourteenthTaskScreen = defineAsyncComponent(() => import('../components/FourteenthTaskScreen.vue'));
const TwentyFirstTaskScreen = defineAsyncComponent(() => import('../components/TwentyFirstTaskScreen.vue'));

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const calendarStore = useCalendarStore();

const answer = ref("");
const isAdmin = ref(false);
const editingCompleted = ref(false);
const editingSaving = ref(false);
const editingError = ref("");
const attachmentsBusy = ref(false);

const day = computed(() => {
  const raw = route.params.id;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return Number(value);
});

const assignment = computed(() =>
  Number.isInteger(day.value) && day.value >= 1 && day.value <= 25
    ? calendarStore.tasks.find((task) => task.position === day.value)
    : undefined,
);

// Match task identity: personalised calendars may place it in another window.
const isCipherTask = computed(() => assignment.value?.task?.slug === 'task-02' ||
  (!assignment.value?.task && (assignment.value?.task_id === 2 || day.value === 2)));
const isMemoryTask = computed(() => assignment.value?.task?.slug === 'task-03' ||
  (!assignment.value?.task && (assignment.value?.task_id === 3 || day.value === 3)));
const isCrosswordTask = computed(() => assignment.value?.task?.slug === 'task-04' ||
  (!assignment.value?.task && (assignment.value?.task_id === 4 || day.value === 4)));
const isPairsTask = computed(() => assignment.value?.task?.slug === 'task-05' ||
  (!assignment.value?.task && (assignment.value?.task_id === 5 || day.value === 5)));
const isTarotTask = computed(() => assignment.value?.task?.slug === 'task-06' ||
  (!assignment.value?.task && (assignment.value?.task_id === 6 || day.value === 6)));

const isGratitudeTask = computed(() => assignment.value?.task?.slug === 'task-08' ||
  (!assignment.value?.task && (assignment.value?.task_id === 8 || day.value === 8)));

const isStereogramTask = computed(() => assignment.value?.task?.slug === 'task-11' ||
  (!assignment.value?.task && (assignment.value?.task_id === 11 || day.value === 11)));

async function solveStereogram(letters: string[]) {
  if (!assignment.value?.task || calendarStore.saving) return;
  await calendarStore.completeStereogramTask(assignment.value.task_id, letters);
}

const isFilmTask = computed(() => assignment.value?.task?.slug === 'task-12' ||
  (!assignment.value?.task && (assignment.value?.task_id === 12 || day.value === 12)));

async function recommendFilm(recommendation: FilmRecommendation) {
  if (!assignment.value?.task || calendarStore.saving) return;
  await calendarStore.completeFilmTask(assignment.value.task_id, recommendation);
}

const isWishTask = computed(() => assignment.value?.task?.slug === 'task-13' ||
  (!assignment.value?.task && (assignment.value?.task_id === 13 || day.value === 13)));

async function makeWish() {
  if (!assignment.value?.task || calendarStore.saving) return;
  await calendarStore.completeWishTask(assignment.value.task_id);
}

const isRaskobkiTask = computed(() => assignment.value?.task?.slug === 'task-14' ||
  (!assignment.value?.task && (assignment.value?.task_id === 14 || day.value === 14)));

async function solveRaskobki(answers: RaskobkiAnswer[]) {
  if (!assignment.value?.task || calendarStore.saving) return;
  await calendarStore.completeRaskobkiTask(assignment.value.task_id, answers);
}

const isNonogramTask = computed(() => assignment.value?.task?.slug === 'task-21' ||
  (!assignment.value?.task && (assignment.value?.task_id === 21 || day.value === 21)));

async function solveNonogram(cells: CellMark[]) {
  if (!assignment.value?.task || calendarStore.saving) return;
  await calendarStore.completeNonogramTask(assignment.value.task_id, cells);
}

async function sendLetter(letter: GratitudeLetter, requestId: string) {
  const current = assignment.value;
  const userId = authStore.user?.id;
  if (!current?.task || current.task.slug !== 'task-08' || !userId) throw new Error('Задание недоступно. Обновите страницу.');
  await sendGratitude(current.task_id, letter, requestId);
  if (authStore.user?.id === userId) {
    current.status = 'completed';
    current.completed_at = new Date().toISOString();
  }
}

async function drawTarot(cardId: number) {
  if (!assignment.value?.task || calendarStore.saving) return;
  await calendarStore.drawTarotTask(assignment.value.task_id, cardId);
}

async function solvePairs(pairs: number[]) {
  if (!assignment.value?.task || calendarStore.saving) return;
  await calendarStore.completePairsTask(assignment.value.task_id, pairs);
}

async function solveCrossword(values: CrosswordValues) {
  if (!assignment.value?.task || calendarStore.saving) return;
  await calendarStore.completeCrosswordTask(assignment.value.task_id, values);
}

async function shareMemory() {
  if (!isMemoryTask.value || !assignment.value?.task || isCompleted.value ||
    calendarStore.saving || attachmentsBusy.value || !answer.value.trim()) return;
  if (!memorySubmissionOpen(assignment.value.available_date)) {
    calendarStore.saveError = 'Приём воспоминаний завершён 10 декабря.';
    return;
  }
  await calendarStore.completeTask(assignment.value.task_id, { text: answer.value.trim() });
}

async function solveCipher(letters: string[]) {
  if (!assignment.value?.task || calendarStore.saving) return;
  await calendarStore.completeCipherTask(assignment.value.task_id, letters);
}

watch(
  () => authStore.user?.id,
  async (userId, _previous, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    isAdmin.value = false;
    editingCompleted.value = false;
    editingError.value = "";

    if (!userId) return;

    const { data, error } = await supabase.rpc("is_admin");

    if (!cancelled) {
      isAdmin.value = !error && data === true;
    }
  },
  { immediate: true },
);

watch(
  () => assignment.value?.task_id,
  () => {
    editingCompleted.value = false;
    editingError.value = "";
  },
);

const isCompleted = computed(() => assignment.value?.status === "completed");

const supportsPhotos = computed(() =>
  [7, 17].includes(assignment.value?.task_id ?? -1),
);

watch(
  () => [authStore.user?.id, assignment.value?.task_id] as const,
  () => {
    attachmentsBusy.value = false;
  },
);

watch(
  () => authStore.user?.id,
  async (userId) => {
    if (!userId) {
      calendarStore.reset();
      return;
    }

    if (
      calendarStore.currentUserId !== userId ||
      calendarStore.tasks.length === 0
    ) {
      await calendarStore.loadCalendar(userId);
    }
  },
  { immediate: true },
);

// Восстанавливаем сохранённый текст
watch(
  () => [assignment.value?.id, assignment.value?.response?.response] as const,
  () => {
    const responseData = assignment.value?.response?.response;
    answer.value =
      typeof responseData?.text === "string" ? responseData.text : "";
  },
  { immediate: true },
);

async function saveDraft() {
  if (!assignment.value?.task || attachmentsBusy.value || calendarStore.saving)
    return;

  await calendarStore.saveDraft(assignment.value.task_id, {
    text: answer.value,
  });
}

async function completeTask() {
  if (
    !assignment.value?.task ||
    attachmentsBusy.value ||
    calendarStore.saving ||
    !answer.value.trim()
  )
    return;

  await calendarStore.completeTask(assignment.value.task_id, {
    text: answer.value.trim(),
  });
}

function cancelCompletedEdit() {
  const saved = assignment.value?.response?.response;

  answer.value = typeof saved?.text === "string" ? saved.text : "";

  editingCompleted.value = false;
  editingError.value = "";
}

async function saveCompletedEdit() {
  const current = assignment.value;
  const userId = authStore.user?.id;

  if (
    !current?.task ||
    !userId ||
    !isAdmin.value ||
    !isCompleted.value ||
    !editingCompleted.value ||
    editingSaving.value ||
    attachmentsBusy.value ||
    !answer.value.trim()
  )
    return;

  editingSaving.value = true;
  editingError.value = "";

  try {
    const { error } = await supabase.rpc("admin_update_task_answer", {
      p_task_id: current.task_id,
      p_response: { text: answer.value.trim() },
    });

    if (error) throw error;

    // Обновляем ответ в календарном store.
    if (authStore.user?.id === userId) {
      await calendarStore.loadCalendar(userId);
    }

    editingCompleted.value = false;
  } catch (error) {
    editingError.value =
      typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "Не удалось сохранить изменения.";
  } finally {
    editingSaving.value = false;
  }
}

async function goBack() {
  await router.push({ name: "calendar" });
}

async function reloadFirstTask() {
  if (authStore.user?.id) await calendarStore.loadCalendar(authStore.user.id);
}
</script>

<style scoped>
.task-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 24px;
}

.task-page h1 {
  margin: 24px 0;
}

.task-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 24px 0;
}

textarea {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font: inherit;
  resize: vertical;
}

textarea:disabled {
  opacity: 0.6;
}

.task-actions {
  display: flex;
  gap: 12px;
}

button {
  padding: 10px 16px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
}

.success {
  color: #15803d;
  font-weight: 600;
}
</style>
