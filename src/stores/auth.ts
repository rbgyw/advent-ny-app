import { defineStore } from "pinia";
import type { User } from "@supabase/supabase-js";
import { authService } from "../services/auth.service";

type RegisterResult = {
  success: boolean;
  needsEmailConfirmation: boolean;
};

let initializationPromise: Promise<void> | null = null;
let listenerRegistered = false;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    loading: false,
    initialized: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    async initialize() {
      if (this.initialized) return;

      if (initializationPromise) {
        return initializationPromise;
      }

      initializationPromise = (async () => {
        this.loading = true;
        this.error = null;

        if (!listenerRegistered) {
          authService.onAuthStateChange((_event, session) => {
            this.user = session?.user ?? null;
          });

          listenerRegistered = true;
        }

        try {
          const { data, error } = await authService.getCurrentUser();

          if (error) {
            if (error.name !== "AuthSessionMissingError") {
              this.error = error.message;
            }

            this.user = null;
          } else {
            this.user = data.user;
          }
        } catch (error) {
          this.error =
            error instanceof Error
              ? error.message
              : "Ошибка проверки авторизации";

          this.user = null;
        } finally {
          this.initialized = true;
          this.loading = false;
        }
      })();

      try {
        await initializationPromise;
      } finally {
        initializationPromise = null;
      }
    },

    async register(email: string, password: string): Promise<RegisterResult> {
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await authService.register(email, password);

        if (error) {
          this.error = error.message;

          return {
            success: false,
            needsEmailConfirmation: false,
          };
        }

        this.user = data.session?.user ?? null;

        return {
          success: true,
          needsEmailConfirmation: !data.session,
        };
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Ошибка регистрации";

        return {
          success: false,
          needsEmailConfirmation: false,
        };
      } finally {
        this.loading = false;
      }
    },

    async login(email: string, password: string) {
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await authService.login(email, password);

        if (error) {
          this.error = error.message;
          return false;
        }

        this.user = data.user;
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Ошибка входа";

        return false;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;
      this.error = null;

      try {
        const { error } = await authService.logout();

        if (error) {
          this.error = error.message;
          return false;
        }

        this.user = null;
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Ошибка выхода";

        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
