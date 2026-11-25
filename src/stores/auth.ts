import { defineStore } from "pinia";
import type { User } from "@supabase/supabase-js";
import { authService } from "../services/auth.service";
import type { RegistrationDetails } from "../types/registration";
import { getEmailError } from '../utils/email-policy';

function allowedUser(user: User | null): User | null {
  return user && !getEmailError(user.email) ? user : null;
}

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
            this.user = allowedUser(session?.user ?? null);
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
            this.user = allowedUser(data.user);
            if (data.user && !this.user) this.error = getEmailError(data.user.email);
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

    async register(email: string, details?: RegistrationDetails): Promise<RegisterResult> {
      this.loading = true;
      this.error = null;

      try {
        const { error } = await authService.register(email, details);

        if (error) {
          this.error = error.message;

          return {
            success: false,
            needsEmailConfirmation: false,
          };
        }

        this.user = null;

        return {
          success: true,
          needsEmailConfirmation: true,
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

    async login(email: string) {
      this.loading = true;
      this.error = null;

      try {
        const { error } = await authService.login(email);

        if (error) {
          this.error = error.message;
          return false;
        }

        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Ошибка входа";

        return false;
      } finally {
        this.loading = false;
      }
    },

    async verifyEmailCode(email: string, token: string) {
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await authService.verifyEmailCode(email, token);
        if (error) {
          const invalidCode = error.code === 'otp_expired';
          this.error = invalidCode
            ? 'Неверный код. Проверьте цифры и попробуйте ещё раз.'
            : 'Не удалось проверить код. Попробуйте ещё раз.';
          return { success: false, invalidCode };
        }
        if (!data.session) {
          this.error = 'Не удалось подтвердить вход. Запросите новый код.';
          return { success: false, invalidCode: false };
        }
        this.user = allowedUser(data.session.user);
        if (!this.user) {
          this.error = getEmailError(data.session.user.email);
          return { success: false, invalidCode: false };
        }
        return { success: true, invalidCode: false };
      } catch {
        this.error = 'Не удалось проверить код. Проверьте подключение и попробуйте ещё раз.';
        return { success: false, invalidCode: false };
      } finally {
        this.loading = false;
      }
    },

    async resendEmailCode(email: string) {
      this.error = null;
      try {
        const { error } = await authService.resendEmailCode(email);
        if (error) {
          this.error = error.status === 429
            ? 'Слишком много запросов. Подождите минуту и попробуйте ещё раз.'
            : 'Не удалось отправить код. Попробуйте ещё раз.';
          return false;
        }
        return true;
      } catch {
        this.error = 'Не удалось отправить код. Проверьте подключение и попробуйте ещё раз.';
        return false;
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
