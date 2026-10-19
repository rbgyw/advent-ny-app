
import { defineStore } from "pinia";
import { calendarService } from "../services/calendar.service";
import type { CalendarTask } from "../types/models";

interface CalendarState {
  tasks: CalendarTask[];

  loading: boolean;
  saving: boolean;

  error: string | null;
  saveError: string | null;

  currentUserId: string | null;
  loadVersion: number;
}

export const useCalendarStore = defineStore("calendar", {
  state: (): CalendarState => ({
    tasks: [],

    loading: false,
    saving: false,

    error: null,
    saveError: null,

    currentUserId: null,
    loadVersion: 0,
  }),

  getters: {
    completedCount: (state) =>
      state.tasks.filter(
        (item) => item.status === "completed"
      ).length,

    totalCount: (state) => state.tasks.length,

    progressPercent(): number {
      if (this.totalCount === 0) return 0;

      return Math.round(
        (this.completedCount / this.totalCount) * 100
      );
    },
  },

  actions: {
    // 1. Загрузка персонального календаря
    async loadCalendar(userId: string) {
      const version = ++this.loadVersion;

      this.currentUserId = userId;
      this.loading = true;
      this.error = null;
      this.saveError = null;
      this.tasks = [];

      try {
        const tasks =
          await calendarService.getUserCalendar(userId);

        // Не применяем устаревший ответ
        if (version !== this.loadVersion) return;

        this.tasks = tasks;
      } catch (error) {
        if (version !== this.loadVersion) return;

        this.error =
          error instanceof Error
            ? error.message
            : "Не удалось загрузить календарь";
      } finally {
        if (version === this.loadVersion) {
          this.loading = false;
        }
      }
    },

    // 2. Общая функция сохранения
    async saveProgress(
      taskId: number,
      response: Record<string, unknown>,
      complete: boolean
    ): Promise<boolean> {
      const userId = this.currentUserId;
      const version = this.loadVersion;

      if (!userId) {
        this.saveError = "Пользователь не авторизован";
        return false;
      }

      if (this.loading || this.saving) {
        this.saveError = "Дождитесь завершения операции";
        return false;
      }

      const assignment = this.tasks.find(
        (item) => item.task_id === taskId
      );

      if (!assignment || !assignment.task) {
        this.saveError =
          "Задание не найдено или ещё не открыто";
        return false;
      }

      this.saving = true;
      this.saveError = null;

      try {
        // Сохраняем на сервере
        await calendarService.saveTaskProgress(
          taskId,
          response,
          complete
        );

        // Пользователь мог выйти во время запроса
        if (
          version !== this.loadVersion ||
          userId !== this.currentUserId
        ) {
          return false;
        }

        // Загружаем актуальный статус и ответ
        const updatedTasks =
          await calendarService.getUserCalendar(userId);

        if (
          version !== this.loadVersion ||
          userId !== this.currentUserId
        ) {
          return false;
        }

        this.tasks = updatedTasks;

        return true;
      } catch (error) {
        if (
          version === this.loadVersion &&
          userId === this.currentUserId
        ) {
          this.saveError =
            error instanceof Error
              ? error.message
              : "Не удалось сохранить задание";
        }

        return false;
      } finally {
        if (
          version === this.loadVersion &&
          userId === this.currentUserId
        ) {
          this.saving = false;
        }
      }
    },

    // 3. Сохранение черновика
    async saveDraft(
      taskId: number,
      response: Record<string, unknown>
    ): Promise<boolean> {
      return this.saveProgress(taskId, response, false);
    },

    // 4. Завершение задания
    async completeTask(
      taskId: number,
      response: Record<string, unknown>
    ): Promise<boolean> {
      return this.saveProgress(taskId, response, true);
    },

    // 5. Очистка состояния
    reset() {
      ++this.loadVersion;

      this.tasks = [];
      this.loading = false;
      this.saving = false;

      this.error = null;
      this.saveError = null;

      this.currentUserId = null;
    },
  },
});
