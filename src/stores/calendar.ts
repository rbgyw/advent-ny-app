import { defineStore } from "pinia";
import { campaignDate } from "../utils/calendar";
import { calendarService } from "../services/calendar.service";
import type { CalendarTask } from "../types/models";
import { isCipherSolution } from "../utils/cipher";
import { isCrosswordSolution, type CrosswordValues } from "../utils/crossword";
import { isPairsSolution } from "../utils/pairs";
import { isTarotCardId, tarotCardId } from "../utils/tarot";
import { tarotService } from "../services/tarot.service";
import { isStereogramSolution } from "../utils/stereogram";
import {
  filmError,
  filmSubmissionOpen,
  normalizeFilm,
  type FilmRecommendation,
} from "../utils/film";
import { isRaskobkiSolution, type RaskobkiAnswer } from "../content/raskobki";
import { isNonogramSolution, type CellMark } from "../content/nonogram";
import { isFortuneIndex } from "../utils/fortune";

const pendingLoads = new WeakMap<object, { userId: string; controller: AbortController; promise: Promise<void> }>();

interface CalendarState {
  tasks: CalendarTask[];

  loading: boolean;
  saving: boolean;

  error: string | null;
  saveError: string | null;
  saveErrorTaskId: number | null;

  currentUserId: string | null;
  loadVersion: number;
  loadedAt: number;
  loadedDate: string;
  initializedUserId: string | null;
}

function errorMessage(error: unknown, fallback: string): string {
  return typeof error === "object" && error !== null &&
    "message" in error && typeof error.message === "string"
    ? error.message
    : fallback;
}

export const useCalendarStore = defineStore("calendar", {
  state: (): CalendarState => ({
    tasks: [],

    loading: false,
    saving: false,

    error: null,
    saveError: null,
    saveErrorTaskId: null,

    currentUserId: null,
    loadVersion: 0,
    loadedAt: 0,
    loadedDate: "",
    initializedUserId: null,
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
    async loadCalendar(userId: string, force = false) {
      const pending = pendingLoads.get(this);
      if (pending?.userId === userId) return pending.promise;
      if (this.saving && this.currentUserId === userId) return;
      const date = campaignDate();
      if (!force && this.currentUserId === userId && this.loadedDate === date &&
        this.loadedAt > 0 && Date.now() - this.loadedAt < 30_000 && !this.error) return;
      pending?.controller.abort();
      const controller = new AbortController();
      const version = ++this.loadVersion;
      if (this.currentUserId !== userId) {
        this.tasks = [];
        this.saving = false;
        this.initializedUserId = null;
        this.loadedAt = 0;
      }
      this.currentUserId = userId;
      this.loading = true;
      this.saving = false;
      this.error = null;
      const promise = (async () => {
        try {
          const tasks = await calendarService.getUserCalendar(userId, {
            initialize: this.initializedUserId !== userId, signal: controller.signal,
          });
          if (version !== this.loadVersion) return;
          this.tasks = tasks;
          this.initializedUserId = userId;
          this.loadedAt = Date.now();
          this.loadedDate = date;
        } catch (error) {
          if (version !== this.loadVersion || controller.signal.aborted) return;
          this.error = errorMessage(error, "Не удалось загрузить календарь");
        } finally {
          if (version === this.loadVersion) this.loading = false;
          if (pendingLoads.get(this)?.controller === controller) pendingLoads.delete(this);
        }
      })();
      pendingLoads.set(this, { userId, controller, promise });
      return promise;
    },

    // 2. Общая функция сохранения
    async saveProgress(
      taskId: number,
      response: Record<string, unknown>,
      complete: boolean,
    ): Promise<boolean> {
      this.saveErrorTaskId = taskId;
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
        [
          "task-02",
          "task-04",
          "task-05",
          "task-11",
          "task-14",
          "task-19",
          "task-21",
        ].includes(assignment.task.slug) &&
        (!complete ||
          response.solved !== true ||
          Object.keys(response).length !== 1)
      ) {
        this.saveError = "Для этого задания сохраняется только верное решение";
        return false;
      }

      if (assignment.task.slug === "task-25") {
        const index = response.fortune_index;

        if (
          !complete ||
          response.solved !== true ||
          !isFortuneIndex(index) ||
          Object.keys(response).length !== 2
        ) {
          this.saveError = "Некорректные данные пожелания";
          return false;
        }
      }

      if (assignment.task.slug === "task-06") {
        this.saveError = "Карта выбирается только один раз через колоду.";
        return false;
      }

      if (assignment.task.slug === "task-12") {
        if (
          !complete ||
          typeof response.title !== "string" ||
          typeof response.reason !== "string" ||
          Object.keys(response).length !== 2 ||
          filmError({ title: response.title, reason: response.reason })
        ) {
          this.saveError =
            "Укажите название фильма и проверьте длину комментария.";
          return false;
        }
        if (!filmSubmissionOpen(assignment.available_date)) {
          this.saveError = "Приём рекомендаций завершён 17 декабря.";
          return false;
        }
      }

      if (
        assignment.task.slug === "task-13" &&
        (!complete ||
          response.wish_made !== true ||
          Object.keys(response).length !== 1)
      ) {
        this.saveError = "Подтвердите, что желание загадано.";
        return false;
      }

      if (assignment.task.slug === "task-20" &&
        (!complete || Object.keys(response).length !== 1 ||
          (response.wish_made !== true && response.search_exhausted !== true))) {
        this.saveError = "Некорректный результат поиска звезды.";
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
        const updated = await calendarService.getTaskProgress(userId, taskId);

        if (version !== this.loadVersion || userId !== this.currentUserId) {
          return false;
        }

        Object.assign(assignment, updated.assignment, { response: updated.response });

        return true;
      } catch (error) {
        if (version === this.loadVersion && userId === this.currentUserId) {
          this.saveErrorTaskId = taskId;
          this.saveError =
            errorMessage(error, "Не удалось сохранить задание");
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

    async completeStereogramTask(
      taskId: number,
      letters: readonly string[],
    ): Promise<boolean> {
      const assignment = this.tasks.find((item) => item.task_id === taskId);
      if (
        assignment?.task?.slug !== "task-11" ||
        !isStereogramSolution(letters)
      )
        return false;
      if (assignment.status === "completed") return true;
      return this.saveProgress(taskId, { solved: true }, true);
    },

    async completeFilmTask(taskId: number, recommendation: FilmRecommendation): Promise<boolean> {
      const assignment = this.tasks.find(item => item.task_id === taskId);
      if (assignment?.task?.slug !== 'task-12') return false;
      const payload = normalizeFilm(recommendation), validation = filmError(payload);
      if (validation) { this.saveErrorTaskId = taskId; this.saveError = validation.message; return false; }
      if (assignment.status === 'completed') return true;
      return this.saveProgress(taskId, { ...payload }, true);
    },

    async completeWishTask(taskId: number): Promise<boolean> {
      const assignment = this.tasks.find((item) => item.task_id === taskId);
      if (assignment?.task?.slug !== "task-13") return false;
      if (assignment.status === "completed") return true;
      // The wish stays private: only the confirmation flag is saved.
      return this.saveProgress(taskId, { wish_made: true }, true);
    },

    async completeRaskobkiTask(
      taskId: number,
      answers: readonly RaskobkiAnswer[],
    ): Promise<boolean> {
      const assignment = this.tasks.find((item) => item.task_id === taskId);
      if (assignment?.task?.slug !== "task-14" || !isRaskobkiSolution(answers))
        return false;
      if (assignment.status === "completed") return true;
      return this.saveProgress(taskId, { solved: true }, true);
    },

    async completeNonogramTask(
      taskId: number,
      cells: readonly CellMark[],
    ): Promise<boolean> {
      const assignment = this.tasks.find((item) => item.task_id === taskId);
      if (assignment?.task?.slug !== "task-21" || !isNonogramSolution(cells))
        return false;
      if (assignment.status === "completed") return true;
      return this.saveProgress(taskId, { solved: true }, true);
    },

    async completeFortuneTask(
      taskId: number,
      fortuneIndex: number,
    ): Promise<boolean> {
      const assignment = this.tasks.find((item) => item.task_id === taskId);

      if (assignment?.task?.slug !== "task-25") return false;

      if (assignment.status === "completed") {
        return isFortuneIndex(assignment.response?.response.fortune_index);
      }

      if (!isFortuneIndex(fortuneIndex)) {
        this.saveError = "Некорректное пожелание";
        return false;
      }

      const saved = await this.saveProgress(
        taskId,
        { solved: true, fortune_index: fortuneIndex },
        true,
      );
      if (!saved) return false;

      const updated = this.tasks.find((item) => item.task_id === taskId);
      if (updated?.status !== "completed" || !isFortuneIndex(updated.response?.response.fortune_index)) {
        this.saveError = "Не удалось загрузить сохранённое пожелание. Попробуйте ещё раз.";
        return false;
      }
      return true;
    },

    async drawTarotTask(taskId: number, candidate: number): Promise<boolean> {
      this.saveErrorTaskId = taskId;
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

        const updated = await calendarService.getTaskProgress(userId, taskId);

        if (version !== this.loadVersion || userId !== this.currentUserId) {
          return false;
        }

        Object.assign(assignment, updated.assignment, { response: updated.response });

        return true;
      } catch (error) {
        if (version === this.loadVersion && userId === this.currentUserId) {
          this.saveErrorTaskId = taskId;
          this.saveError =
            errorMessage(error, "Не удалось сохранить карту.");
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
      pendingLoads.get(this)?.controller.abort();
      pendingLoads.delete(this);
      ++this.loadVersion;

      this.tasks = [];
      this.loading = false;
      this.saving = false;

      this.error = null;
      this.saveError = null;

      this.saveErrorTaskId = null;
      this.currentUserId = null;
      this.initializedUserId = null;
      this.loadedAt = 0;
      this.loadedDate = "";
    },
  },
});
