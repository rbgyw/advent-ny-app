<template>
  <main class="calendar">
    <header class="calendar-header">
      <div>
        <h1>Адвент-календарь</h1>
        <p v-if="user">Вы вошли как: {{ user.email }}</p>
      </div>

      <button type="button" @click="handleLogout" :disabled="loading">
        {{ loading ? "Выход..." : "Выйти" }}
      </button>
    </header>

    <!-- Ошибки авторизации -->
    <p v-if="error" class="error">
      {{ error }}
    </p>

    <!-- Ошибки календаря -->
    <p v-if="calendarStore.error" class="error">
      {{ calendarStore.error }}
    </p>

    <section>
      <h2>Ваш календарь</h2>

      <!-- Загрузка -->
      <p v-if="calendarStore.loading">Загружаем задания...</p>

      <!-- Нет назначений -->
      <p v-else-if="calendarTasks.length === 0">Задания пока не назначены.</p>

      <!-- Есть назначения -->
      <template v-else>
        <div class="calendar-progress">
          <div class="progress-header">
            <span>
              Выполнено:
              {{ completedCount }} из {{ calendarTasks.length }}
            </span>

            <strong> {{ calendarStore.progressPercent }}% </strong>
          </div>

          <progress :value="completedCount" :max="calendarTasks.length" />

          <p v-if="calendarStore.saving">Сохраняем результат...</p>

          <p v-if="calendarStore.saveError" class="error">
            {{ calendarStore.saveError }}
          </p>
        </div>

        <ul class="task-list">
          <li v-for="assignment in calendarTasks" :key="assignment.id">
            <strong>День {{ assignment.position }}</strong>

            <span v-if="assignment.task"> — {{ assignment.task.title }} </span>

            <span v-else> — Задание пока закрыто </span>

            <small> Доступно с: {{ formatDate(assignment.available_date) }} </small>

            <small> Статус: {{ taskStatusLabels[assignment.status] }} </small>
          </li>
        </ul>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

import { useAuthStore } from "../stores/auth";
import { useCalendarStore } from "../stores/calendar";
import { formatDate } from "../utils/date";
import { taskStatusLabels } from "../const/task_status";

const router = useRouter();

const authStore = useAuthStore();
const calendarStore = useCalendarStore();

const { user, loading, error } = storeToRefs(authStore);

const calendarTasks = computed(() => calendarStore.tasks);

const completedCount = computed(() => calendarStore.completedCount);

// Загрузка календаря
async function loadCalendar(userId: string | undefined) {
  if (!userId) {
    calendarStore.reset();
    return;
  }

  await calendarStore.loadCalendar(userId);

  if (calendarStore.error) {
    console.error("Ошибка загрузки календаря:", calendarStore.error);
    return;
  }

  console.log("Назначения:", calendarTasks.value);
  console.log("Выполнено:", completedCount.value);
}

// Следим за авторизованным пользователем
watch(
  () => user.value?.id,
  (userId) => {
    void loadCalendar(userId);
  },
  { immediate: true },
);

// Выход из аккаунта
async function handleLogout() {
  const success = await authStore.logout();

  if (success) {
    calendarStore.reset();
    await router.replace({ name: "auth" });
  }
}
</script>

<style scoped>
.calendar {
  padding: 24px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

button {
  padding: 10px 20px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 20px;
}

.task-list li {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.task-list small {
  display: block;
  margin-top: 4px;
  color: #6b7280;
}

.calendar-progress {
  margin: 20px 0 28px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.calendar-progress progress {
  width: 100%;
  height: 12px;
  display: block;
  accent-color: #37866a;
}
</style>
