import { defineStore } from "pinia";
import { calendarService } from "../services/calendar.service";
import type { CalendarTask } from "../types/models";
import { isCipherSolution } from "../utils/cipher";
import { isCrosswordSolution, type CrosswordValues } from "../utils/crossword";
import { isPairsSolution } from "../utils/pairs";
import { isTarotCardId, tarotCardId } from "../utils/tarot";
import { tarotService } from "../services/tarot.service";
import { isStereogramSolution } from '../utils/stereogram';
import { filmError, filmSubmissionOpen, normalizeFilm, type FilmRecommendation } from '../utils/film';
import { isRaskobkiSolution, type RaskobkiAnswer } from '../content/raskobki';

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
      state.tasks.filter((item) => item.status === "completed").length,

    totalCount: (state) => state.tasks.length,

    progressPercent(): number {
      if (this.totalCount === 0) return 0;

      return Math.round((this.completedCount / this.totalCount) * 100);
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
        const tasks = await calendarService.getUserCalendar(userId);

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
      complete: boolean,
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

      const assignment = this.tasks.find((item) => item.task_id === taskId);

      if (!assignment || !assignment.task) {
        this.saveError = "Задание не найдено или ещё не открыто";
        return false;
      }

      if (
        ["task-02", "task-04", "task-05", "task-11", "task-14"].includes(assignment.task.slug) &&
        (!complete ||
          response.solved !== true ||
          Object.keys(response).length !== 1)
      ) {
        this.saveError = "Для этого задания сохраняется только верное решение";
        return false;
      }

      if (assignment.task.slug === "task-06") {
        this.saveError = "Карта выбирается только один раз через колоду.";
        return false;
      }

      if (assignment.task.slug === 'task-12') {
        if (!complete || typeof response.title !== 'string' || typeof response.reason !== 'string' ||
          Object.keys(response).length !== 2 || filmError({ title: response.title, reason: response.reason })) {
          this.saveError = 'Укажите название фильма и проверьте длину комментария.';
          return false;
        }
        if (!filmSubmissionOpen(assignment.available_date)) {
          this.saveError = 'Приём рекомендаций завершён 17 декабря.';
          return false;
        }
      }

      if (assignment.task.slug === 'task-13' &&
        (!complete || response.wish_made !== true || Object.keys(response).length !== 1)) {
        this.saveError = 'Подтвердите, что желание загадано.';
        return false;
      }

      this.saving = true;
      this.saveError = null;

      try {
        // Сохраняем на сервере
        await calendarService.saveTaskProgress(taskId, response, complete);

        // Пользователь мог выйти во время запроса
        if (version !== this.loadVersion || userId !== this.currentUserId) {
          return false;
        }

        // Загружаем актуальный статус и ответ
        const updatedTasks = await calendarService.getUserCalendar(userId);

        if (version !== this.loadVersion || userId !== this.currentUserId) {
          return false;
        }

        this.tasks = updatedTasks;

        return true;
      } catch (error) {
        if (version === this.loadVersion && userId === this.currentUserId) {
          this.saveError =
            error instanceof Error
              ? error.message
              : "Не удалось сохранить задание";
        }

        return false;
      } finally {
        if (version === this.loadVersion && userId === this.currentUserId) {
          this.saving = false;
        }
      }
    },

    // 3. Сохранение черновика
    async saveDraft(
      taskId: number,
      response: Record<string, unknown>,
    ): Promise<boolean> {
      return this.saveProgress(taskId, response, false);
    },

    // 4. Завершение задания
    async completeCipherTask(
      taskId: number,
      letters: readonly string[],
    ): Promise<boolean> {
      const assignment = this.tasks.find((item) => item.task_id === taskId);
      if (assignment?.task?.slug !== "task-02" || !isCipherSolution(letters))
        return false;
      if (assignment.status === "completed") return true;
      // No draft, raw answer, individual letters or failed attempt leaves the browser.
      return this.saveProgress(taskId, { solved: true }, true);
    },

    async completeCrosswordTask(
      taskId: number,
      values: Readonly<CrosswordValues>,
    ): Promise<boolean> {
      const assignment = this.tasks.find((item) => item.task_id === taskId);
      if (assignment?.task?.slug !== "task-04" || !isCrosswordSolution(values))
        return false;
      if (assignment.status === "completed") return true;
      return this.saveProgress(taskId, { solved: true }, true);
    },

    async completePairsTask(
      taskId: number,
      pairs: readonly number[],
    ): Promise<boolean> {
      const assignment = this.tasks.find((item) => item.task_id === taskId);
      if (assignment?.task?.slug !== "task-05" || !isPairsSolution(pairs))
        return false;
      if (assignment.status === "completed") return true;
      return this.saveProgress(taskId, { solved: true }, true);
    },

    async completeStereogramTask(taskId: number, letters: readonly string[]): Promise<boolean> {
      const assignment = this.tasks.find(item => item.task_id === taskId);
      if (assignment?.task?.slug !== 'task-11' || !isStereogramSolution(letters)) return false;
      if (assignment.status === 'completed') return true;
      return this.saveProgress(taskId, { solved: true }, true);
    },

    async completeFilmTask(taskId: number, recommendation: FilmRecommendation): Promise<boolean> {
      const assignment = this.tasks.find(item => item.task_id === taskId);
      if (assignment?.task?.slug !== 'task-12') return false;
      const payload = normalizeFilm(recommendation), validation = filmError(payload);
      if (validation) { this.saveError = validation.message; return false; }
      if (assignment.status === 'completed') return true;
      return this.saveProgress(taskId, { ...payload }, true);
    },

    async completeWishTask(taskId: number): Promise<boolean> {
      const assignment = this.tasks.find(item => item.task_id === taskId);
      if (assignment?.task?.slug !== 'task-13') return false;
      if (assignment.status === 'completed') return true;
      // The wish stays private: only the confirmation flag is saved.
      return this.saveProgress(taskId, { wish_made: true }, true);
    },

    async completeRaskobkiTask(taskId: number, answers: readonly RaskobkiAnswer[]): Promise<boolean> {
      const assignment = this.tasks.find(item => item.task_id === taskId);
      if (assignment?.task?.slug !== 'task-14' || !isRaskobkiSolution(answers)) return false;
      if (assignment.status === 'completed') return true;
      return this.saveProgress(taskId, { solved: true }, true);
    },

    async drawTarotTask(taskId: number, candidate: number): Promise<boolean> {
      const userId = this.currentUserId;
      const version = this.loadVersion;

      const assignment = this.tasks.find((item) => item.task_id === taskId);

      if (
        !userId ||
        this.loading ||
        this.saving ||
        assignment?.task?.slug !== "task-06" ||
        !isTarotCardId(candidate)
      ) {
        return false;
      }

      if (assignment.status === "completed") {
        return tarotCardId(assignment.response?.response) !== null;
      }

      this.saving = true;
      this.saveError = null;

      try {
        await tarotService.claimCard(taskId, candidate);

        if (version !== this.loadVersion || userId !== this.currentUserId) {
          return false;
        }

        const updated = await calendarService.getUserCalendar(userId);

        if (version !== this.loadVersion || userId !== this.currentUserId) {
          return false;
        }

        this.tasks = updated;

        return true;
      } catch (error) {
        if (version === this.loadVersion && userId === this.currentUserId) {
          this.saveError =
            error instanceof Error
              ? error.message
              : "Не удалось сохранить карту.";
        }

        return false;
      } finally {
        if (version === this.loadVersion && userId === this.currentUserId) {
          this.saving = false;
        }
      }
    },

    async completeTask(
      taskId: number,
      response: Record<string, unknown>,
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
