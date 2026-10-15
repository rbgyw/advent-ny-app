
import { defineStore } from "pinia";
import { calendarService } from "../services/calendar.service";
import type { CalendarTask } from "../types/models";

interface CalendarState {
  tasks: CalendarTask[];
  loading: boolean;
  error: string | null;
}

export const useCalendarStore = defineStore("calendar", {
  state: (): CalendarState => ({
    tasks: [],
    loading: false,
    error: null,
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
    async loadCalendar(userId: string) {
      this.loading = true;
      this.error = null;
      this.tasks = [];

      try {
        this.tasks =
          await calendarService.getUserCalendar(userId);
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Не удалось загрузить календарь";
      } finally {
        this.loading = false;
      }
    },

    reset() {
      this.tasks = [];
      this.loading = false;
      this.error = null;
    },
  },
});
