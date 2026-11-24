<template>
  <div v-if="calendarStore.loading && !assignment" />
  <FirstTaskScreen
    v-else-if="day === 1"
    :assignment="assignment"
    :day="day"
    :loading="calendarStore.loading && !assignment"
    :error="assignment ? null : calendarStore.error"
    :total="calendarStore.totalCount"
    @back="goBack"
    @retry="reloadFirstTask"
  />
  <SecondTaskScreen
    v-else-if="isCipherTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading && !assignment"
    :saving="calendarStore.saving"
    :error="assignment ? null : calendarStore.error"
    :save-error="taskSaveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @submit="solveCipher"
    @edit="calendarStore.saveError = null"
  />
  <ThirdTaskScreen
    v-else-if="isMemoryTask"
    v-model="answer"
    v-model:author="memoryAuthor"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :user-id="authStore.user?.id"
    :loading="calendarStore.loading && !assignment"
    :saving="calendarStore.saving"
    :error="assignment ? null : calendarStore.error"
    :save-error="taskSaveError"
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
    :loading="calendarStore.loading && !assignment"
    :saving="calendarStore.saving"
    :error="assignment ? null : calendarStore.error"
    :save-error="taskSaveError"
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
    :loading="calendarStore.loading && !assignment"
    :saving="calendarStore.saving"
    :error="assignment ? null : calendarStore.error"
    :save-error="taskSaveError"
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
    :loading="calendarStore.loading && !assignment"
    :saving="calendarStore.saving"
    :error="assignment ? null : calendarStore.error"
    :save-error="taskSaveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @draw="drawTarot"
    @edit="calendarStore.saveError = null"
  />
  <SeventhTaskScreen
    v-else-if="isSportTask"
    :key="`task-07:${assignment?.id ?? day}`"
    v-model="answer"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @choose="saveSportLevel"
    @submit="submitSportPhoto"
    @edit="calendarStore.saveError = null"
  />
  <FifteenthTaskScreen
    v-else-if="matchesTask(15)"
    :key="`task-15:${assignment?.id ?? day}`"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @save="saveDecemberTask(15, $event)"
    @edit="calendarStore.saveError = null"
  />
  <NinthTaskScreen
    v-else-if="matchesTask(9)"
    :key="`task-09:${assignment?.id ?? day}`"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @save="saveDecemberTask(9, $event)"
    @edit="calendarStore.saveError = null"
  />
  <TenthTaskScreen
    v-else-if="matchesTask(10)"
    :key="`task-10:${assignment?.id ?? day}`"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @save="saveDecemberTask(10, $event)"
    @edit="calendarStore.saveError = null"
  />
  <SixteenthTaskScreen
    v-else-if="matchesTask(16)"
    :key="`task-16:${assignment?.id ?? day}`"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @save="saveDecemberTask(16, $event)"
    @edit="calendarStore.saveError = null"
  />
  <SeventeenthTaskScreen
    v-else-if="matchesTask(17)"
    :key="`task-17:${assignment?.id ?? day}`"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @save="saveDecemberTask(17, $event)"
    @edit="calendarStore.saveError = null"
  />
  <EighteenthTaskScreen
    v-else-if="matchesTask(18)"
    :key="`task-18:${assignment?.id ?? day}`"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @save="saveDecemberTask(18, $event)"
    @edit="calendarStore.saveError = null"
  />
  <NineteenthTaskScreen
    v-else-if="matchesTask(19)"
    :key="`task-19:${assignment?.id ?? day}`"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @save="saveDecemberTask(19, $event)"
    @edit="calendarStore.saveError = null"
  />
  <TwentiethTaskScreen
    v-else-if="matchesTask(20)"
    :key="`task-20:${assignment?.id ?? day}`"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @save="saveDecemberTask(20, $event)"
    @edit="calendarStore.saveError = null"
  />
  <EighthTaskScreen
    v-else-if="isGratitudeTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading && !assignment"
    :error="assignment ? null : calendarStore.error"
    :send="sendLetter"
    @back="goBack"
    @retry="reloadFirstTask"
  />
  <EleventhTaskScreen
    v-else-if="isStereogramTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading && !assignment"
    :saving="calendarStore.saving"
    :error="assignment ? null : calendarStore.error"
    :save-error="taskSaveError"
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
    :loading="calendarStore.loading && !assignment"
    :saving="calendarStore.saving"
    :error="assignment ? null : calendarStore.error"
    :save-error="taskSaveError"
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
    :loading="calendarStore.loading && !assignment"
    :saving="calendarStore.saving"
    :error="assignment ? null : calendarStore.error"
    :save-error="taskSaveError"
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
    :loading="calendarStore.loading && !assignment"
    :saving="calendarStore.saving"
    :error="assignment ? null : calendarStore.error"
    :save-error="taskSaveError"
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
    :loading="calendarStore.loading && !assignment"
    :saving="calendarStore.saving"
    :error="assignment ? null : calendarStore.error"
    :save-error="taskSaveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @submit="solveNonogram"
    @edit="calendarStore.saveError = null"
  />
  <TwentySecondTaskScreen
    v-else-if="matchesTask(22)"
    :key="`task-22:${assignment?.id ?? day}`"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @completed="reloadFirstTask"
  />
  <TwentyThirdTaskScreen
    v-else-if="matchesTask(23)"
    :key="`task-23:${assignment?.id ?? day}`"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @save="saveDecemberTask(23, $event)"
  />
  <TwentyFourthTaskScreen
    v-else-if="matchesTask(24)"
    :key="`task-24:${assignment?.id ?? day}`"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading"
    :saving="calendarStore.saving"
    :error="calendarStore.error"
    :save-error="calendarStore.saveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @save="saveDecemberTask(24, $event)"
  />
  <TwentyFifthTaskScreen
    v-else-if="isFortuneTask"
    :assignment="assignment"
    :day="day"
    :total="calendarStore.totalCount"
    :loading="calendarStore.loading && !assignment"
    :saving="calendarStore.saving"
    :error="assignment ? null : calendarStore.error"
    :save-error="taskSaveError"
    @back="goBack"
    @retry="reloadFirstTask"
    @complete="completeFortune"
    @edit="calendarStore.saveError = null"
  />
  <TaskLayout v-else class="task-page">
    <AppButton type="button" @click="goBack">← Назад к календарю</AppButton>

    <TaskDateLabel v-if="assignment" :available-date="assignment.available_date" :day="day" />
    <h1>День {{ day }}</h1>

    <LoadingState v-if="calendarStore.loading && !assignment" />

    <FeedbackState v-else-if="calendarStore.error" kind="error" class="error"><p>{{ calendarStore.error }}</p><AppButton variant="outline" @click="reloadFirstTask">Попробовать снова</AppButton></FeedbackState>

    <FeedbackState v-else-if="!assignment" message="Задание не найдено." />

    <section v-else-if="!assignment.task">
      <template v-if="assignment.available_date > campaignDate()">
        <h2>Задание пока закрыто</h2>
        <p>Откроется {{ formatDate(assignment.available_date) }}</p>
      </template>
      <template v-else>
        <h2>Не удалось получить задание</h2>
        <p>Дата открытия уже наступила.</p>
        <AppButton type="button" variant="outline" @click="reloadFirstTask">Обновить задание</AppButton>
      </template>
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

      <p v-if="taskSaveError" class="error">
        {{ taskSaveError }}
      </p>

      <div v-if="isCompleted">
        <p class="success">Задание выполнено!</p>

        <AppButton
          v-if="isAdmin && !editingCompleted"
          type="button"
          :disabled="calendarStore.loading || attachmentsBusy"
          @click="editingCompleted = true"
        >
          Редактировать ответ
        </AppButton>

        <div v-if="isAdmin && editingCompleted" class="task-actions">
          <AppButton
            type="button"
            :disabled="editingSaving || attachmentsBusy || !answer.trim()"
            @click="saveCompletedEdit"
          >
            {{ editingSaving ? "Сохраняем..." : "Сохранить изменения" }}
          </AppButton>

          <AppButton
            type="button"
            :disabled="editingSaving || attachmentsBusy"
            @click="cancelCompletedEdit"
          >
            Отмена
          </AppButton>
        </div>

        <p v-if="editingError" class="error">
          {{ editingError }}
        </p>
      </div>

      <div v-else class="task-actions">
        <AppButton
          type="button"
          :disabled="calendarStore.saving || attachmentsBusy"
          @click="saveDraft"
        >
          Сохранить черновик
        </AppButton>

        <AppButton
          type="button"
          :disabled="calendarStore.saving || attachmentsBusy || !answer.trim()"
          @click="completeTask"
        >
          Завершить задание
        </AppButton>
      </div>
    </section>
  </TaskLayout>
  <FeedbackState v-if="calendarStore.error && assignment" kind="error" class="task-refresh-error"><p>Не удалось обновить задание. Ваш ответ остаётся на экране.</p><AppButton variant="outline" @click="reloadFirstTask">Попробовать снова</AppButton></FeedbackState>
</template>

<script setup lang="ts">
import { asyncScreen } from '../utils/async-screen';
import FeedbackState from '../components/ui/FeedbackState.vue';
import { useScreenReadiness } from '../composables/useScreenReadiness';
import LoadingState from '../components/ui/LoadingState.vue';
import AppButton from '../components/ui/AppButton.vue';
import TaskLayout from '../components/ui/TaskLayout.vue';
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

import { useAuthStore } from "../stores/auth";
import { useCalendarStore } from "../stores/calendar";
import { formatDate } from "../utils/date";
import { campaignDate } from "../utils/calendar";
import { taskStatusLabels } from "../const/task_status";
import TaskAttachments from "../components/TaskAttachments.vue";
import TaskDateLabel from "../components/ui/TaskDateLabel.vue";
import { sendGratitude } from '../services/gratitude.service';
import type { GratitudeLetter } from '../utils/gratitude';
import type { FilmRecommendation } from '../utils/film';
const { track } = useScreenReadiness();
const FirstTaskScreen = asyncScreen(() => import("../components/FirstTaskScreen.vue"));
import { memorySubmissionOpen } from "../utils/memory";
import type { DecemberTaskSave } from '../types/december';
import type { CrosswordValues } from "../utils/crossword";
import { isSportLevel, isTeamPose, type SportLevel, type SportSubmission } from '../content/sport-task';
import type { RaskobkiAnswer } from '../content/raskobki';
import type { CellMark } from '../content/nonogram';
const SecondTaskScreen = asyncScreen(() => import("../components/SecondTaskScreen.vue"));
const ThirdTaskScreen = asyncScreen(() => import("../components/ThirdTaskScreen.vue"));
const FourthTaskScreen = asyncScreen(() => import("../components/FourthTaskScreen.vue"));
const FifthTaskScreen = asyncScreen(() => import("../components/FifthTaskScreen.vue"));
const SixthTaskScreen = asyncScreen(() => import("../components/SixthTaskScreen.vue"));
const SeventhTaskScreen = asyncScreen(() => import('../components/SeventhTaskScreen.vue'));
const FifteenthTaskScreen = asyncScreen(() => import('../components/FifteenthTaskScreen.vue'));
const NinthTaskScreen = asyncScreen(() => import('../components/NinthTaskScreen.vue'));
const TenthTaskScreen = asyncScreen(() => import('../components/TenthTaskScreen.vue'));
const SixteenthTaskScreen = asyncScreen(() => import('../components/SixteenthTaskScreen.vue'));
const SeventeenthTaskScreen = asyncScreen(() => import('../components/SeventeenthTaskScreen.vue'));
const EighteenthTaskScreen = asyncScreen(() => import('../components/EighteenthTaskScreen.vue'));
const NineteenthTaskScreen = asyncScreen(() => import('../components/NineteenthTaskScreen.vue'));
const TwentiethTaskScreen = asyncScreen(() => import('../components/TwentiethTaskScreen.vue'));
const EighthTaskScreen = asyncScreen(() => import('../components/EighthTaskScreen.vue'));
const EleventhTaskScreen = asyncScreen(() => import('../components/EleventhTaskScreen.vue'));
const TwelfthTaskScreen = asyncScreen(() => import('../components/TwelfthTaskScreen.vue'));
const ThirteenthTaskScreen = asyncScreen(() => import('../components/ThirteenthTaskScreen.vue'));
const FourteenthTaskScreen = asyncScreen(() => import('../components/FourteenthTaskScreen.vue'));
const TwentyFirstTaskScreen = asyncScreen(() => import('../components/TwentyFirstTaskScreen.vue'));
const TwentySecondTaskScreen = asyncScreen(() => import('../components/TwentySecondTaskScreen.vue'));
const TwentyThirdTaskScreen = asyncScreen(() => import('../components/TwentyThirdTaskScreen.vue'));
const TwentyFourthTaskScreen = asyncScreen(() => import('../components/TwentyFourthTaskScreen.vue'));
const TwentyFifthTaskScreen = asyncScreen(() => import('../components/TwentyFifthTaskScreen.vue'));

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const calendarStore = useCalendarStore();

const answer = ref("");
const memoryAuthor = ref("");
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

const taskSaveError = computed(() => calendarStore.saveErrorTaskId === assignment.value?.task_id ? calendarStore.saveError : null);

// Match task identity: personalised calendars may place it in another window.
const isCipherTask = computed(() => assignment.value?.task?.slug === 'task-02' ||
  (!assignment.value?.task && (assignment.value?.task_id === 2 || day.value === 2)));
const isMemoryTask = computed(() => matchesTask(3));
const isCrosswordTask = computed(() => assignment.value?.task?.slug === 'task-04' ||
  (!assignment.value?.task && (assignment.value?.task_id === 4 || day.value === 4)));
const isPairsTask = computed(() => assignment.value?.task?.slug === 'task-05' ||
  (!assignment.value?.task && (assignment.value?.task_id === 5 || day.value === 5)));
const isTarotTask = computed(() => assignment.value?.task?.slug === 'task-06' ||
  (!assignment.value?.task && (assignment.value?.task_id === 6 || day.value === 6)));
const isSportTask = computed(() => assignment.value?.task?.slug === 'task-07' ||
  (!assignment.value?.task && (assignment.value?.task_id ?? day.value) === 7));

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

const isFortuneTask = computed(() => assignment.value?.task?.slug === 'task-25' ||
  (!assignment.value?.task && (assignment.value?.task_id === 25 || day.value === 25)));

async function completeFortune(
  fortuneIndex: number
) {
  if (!assignment.value?.task || calendarStore.saving) return;

  await calendarStore.completeFortuneTask(
    assignment.value.task_id,
    fortuneIndex,
  );
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
    calendarStore.saving || attachmentsBusy.value || !answer.value.trim() || !memoryAuthor.value.trim()) return;
  if (!memorySubmissionOpen(assignment.value.available_date)) {
    calendarStore.saveErrorTaskId = assignment.value.task_id;
    calendarStore.saveError = 'Приём воспоминаний завершён 10 декабря.';
    return;
  }
  await calendarStore.completeTask(assignment.value.task_id, {
    text: answer.value.trim(), author: memoryAuthor.value.trim(),
  });
}

async function saveSportLevel(level: SportLevel) {
  const current = assignment.value;
  const response = current?.response?.response;
  if (current?.task?.slug !== 'task-07' || current.status === 'completed' ||
    calendarStore.saving || isSportLevel(response?.level) || response?.submitted_for_review === true) return;
  await calendarStore.saveDraft(current.task_id, { level, text: answer.value });
}

async function submitSportPhoto({ attachmentId, teamPose }: SportSubmission) {
  const current = assignment.value;
  const response = current?.response?.response;
  if (current?.task?.slug !== 'task-07' || current.status === 'completed' ||
    calendarStore.saving || !isSportLevel(response?.level) || response.submitted_for_review === true ||
    !attachmentId || (response.level === 'team' && !isTeamPose(teamPose))) return;
  await calendarStore.saveProgress(current.task_id, {
    level: response.level,
    text: response.level === 'team' ? '' : answer.value.trim(),
    attachment_id: attachmentId,
    ...(response.level === 'team' && { team_pose: teamPose }),
    submitted_for_review: response.level !== 'basic',
    submitted: true,
  }, response.level === 'basic');
}

function matchesTask(number: number) {
  const current = assignment.value;
  return current?.task
    ? current.task.slug === `task-${String(number).padStart(2, '0')}`
    : (current?.task_id ?? day.value) === number;
}

async function saveDecemberTask(number: number, { response, complete }: DecemberTaskSave) {
  const current = assignment.value;
  if (!current?.task || !matchesTask(number) || calendarStore.saving || current.status === 'completed') return;
  await calendarStore.saveProgress(current.task_id, response, complete);
}

async function solveCipher(letters: string[]) {
  if (!assignment.value?.task || calendarStore.saving) return;
  await calendarStore.completeCipherTask(assignment.value.task_id, letters);
}

watch(
  () => [authStore.user?.id, assignment.value?.task?.slug] as const,
  async ([userId, slug], _previous, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    isAdmin.value = false;
    editingCompleted.value = false;
    editingError.value = "";

    if (!userId || !slug || ["task-01", "task-02", "task-03", "task-04", "task-05", "task-06", "task-08", "task-11", "task-12", "task-13", "task-14", "task-21", "task-25"].includes(slug)) return;

    const { data, error } = await track(Promise.resolve(supabase.rpc("is_admin")));

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
  assignment.value?.task_id === 17,
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

    const current = assignment.value;
    // The date on a cached assignment may predate a change to the campaign schedule.
    await track(calendarStore.loadCalendar(userId, Boolean(current && !current.task)));
  },
  { immediate: true },
);

// Восстанавливаем сохранённый текст
watch(
  [() => assignment.value?.id, () => assignment.value?.response?.response?.text],
  ([id, text], [previousId, previousText]) => {
    const previous = typeof previousText === "string" ? previousText : "";
    // A background refresh must not replace an unsaved local draft.
    if (id === previousId && answer.value !== previous) return;
    answer.value = typeof text === "string" ? text : "";
    const fullName = authStore.user?.user_metadata?.full_name;
    const responseData = assignment.value?.response?.response;
    memoryAuthor.value = typeof responseData?.author === 'string' ? responseData.author
      : typeof fullName === 'string' ? fullName : '';
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
      await calendarStore.loadCalendar(userId, true);
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
  if (authStore.user?.id) await calendarStore.loadCalendar(authStore.user.id, true);
}
</script>

<style scoped>
.task-refresh-error { padding:16px; color:var(--color-ink); background:var(--color-paper); }
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
