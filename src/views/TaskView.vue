
<template>
  <main class="task-page">
    <button type="button" @click="goBack">
      ← Назад к календарю
    </button>

    <h1>День {{ day }}</h1>

    <p v-if="calendarStore.loading">
      Загружаем задание...
    </p>

    <p v-else-if="calendarStore.error" class="error">
      {{ calendarStore.error }}
    </p>

    <p v-else-if="!assignment">
      Задание не найдено.
    </p>

    <section v-else-if="!assignment.task">
      <h2>Задание пока закрыто</h2>
      <p>
        Откроется {{ formatDate(assignment.available_date) }}
      </p>
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
        <label for="task-answer">
          Ваш ответ
        </label>

        <textarea
          id="task-answer"
          v-model="answer"
          rows="6"
          :disabled="calendarStore.saving || isCompleted"
          placeholder="Введите ответ..."
        />
      </div>

      <p v-if="calendarStore.saveError" class="error">
        {{ calendarStore.saveError }}
      </p>

      <p v-if="isCompleted" class="success">
        Задание выполнено!
      </p>

      <div v-else class="task-actions">
        <button
          type="button"
          :disabled="calendarStore.saving"
          @click="saveDraft"
        >
          Сохранить черновик
        </button>

        <button
          type="button"
          :disabled="calendarStore.saving || !answer.trim()"
          @click="completeTask"
        >
          Завершить задание
        </button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "../stores/auth";
import { useCalendarStore } from "../stores/calendar";
import { formatDate } from "../utils/date";
import { taskStatusLabels } from "../const/task_status";

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const calendarStore = useCalendarStore();

const answer = ref("");

const day = computed(() => {
  const raw = route.params.id;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return Number(value);
});

const assignment = computed(() =>
  Number.isInteger(day.value) &&
  day.value >= 1 &&
  day.value <= 25
    ? calendarStore.tasks.find(
        (task) => task.position === day.value
      )
    : undefined
);

const isCompleted = computed(
  () => assignment.value?.status === "completed"
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
  { immediate: true }
);

// Восстанавливаем сохранённый текст
watch(
  () => [
    assignment.value?.id,
    assignment.value?.response?.response
  ] as const,
  () => {
    const responseData = assignment.value?.response?.response;
    answer.value =
      typeof responseData?.text === "string"
        ? responseData.text
        : "";
  },
  { immediate: true }
);

async function saveDraft() {
  if (!assignment.value?.task) return;

  await calendarStore.saveDraft(
    assignment.value.task_id,
    { text: answer.value }
  );
}

async function completeTask() {
  if (!assignment.value?.task || !answer.value.trim()) return;

  await calendarStore.completeTask(
    assignment.value.task_id,
    { text: answer.value.trim() }
  );
}

async function goBack() {
  await router.push({ name: "calendar" });
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
