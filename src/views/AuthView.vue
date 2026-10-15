<template>
  <main class="auth-page">
    <section class="auth-card">
      <!-- Экран после регистрации -->
      <div v-if="confirmationEmail" class="confirmation">
        <h1>Проверьте почту</h1>

        <p>
          Мы отправили письмо для подтверждения регистрации на
          <strong>{{ confirmationEmail }}</strong
          >.
        </p>

        <p>Перейдите по ссылке в письме, чтобы активировать аккаунт.</p>

        <button
          type="button"
          @click="
            confirmationEmail = null;
            switchMode('login');
          "
        >
          Перейти ко входу
        </button>
      </div>

      <!-- Форма входа / регистрации -->
      <template v-else>
        <div class="auth-tabs">
          <button
            type="button"
            :class="{ active: mode === 'login' }"
            @click="switchMode('login')"
          >
            Вход
          </button>

          <button
            type="button"
            :class="{ active: mode === 'register' }"
            @click="switchMode('register')"
          >
            Регистрация
          </button>
        </div>

        <h1>
          {{ mode === "login" ? "Вход" : "Регистрация" }}
        </h1>

        <form @submit.prevent="handleSubmit">
          <div class="field">
            <label for="email"> Email </label>

            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
            />
          </div>

          <div class="field">
            <label for="password"> Пароль </label>

            <input
              id="password"
              v-model="password"
              type="password"
              :autocomplete="
                mode === 'login' ? 'current-password' : 'new-password'
              "
              required
            />
          </div>

          <div v-if="mode === 'register'" class="field">
            <label for="password-repeat"> Повторите пароль </label>

            <input
              id="password-repeat"
              v-model="passwordRepeat"
              type="password"
              autocomplete="new-password"
              required
            />
          </div>

          <p v-if="localError" class="error">
            {{ localError }}
          </p>

          <p v-if="authStore.error" class="error">
            {{ authStore.error }}
          </p>

          <button type="submit" :disabled="authStore.loading">
            {{
              authStore.loading
                ? "Подождите..."
                : mode === "login"
                  ? "Войти"
                  : "Зарегистрироваться"
            }}
          </button>
        </form>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "../stores/auth";

type AuthMode = "login" | "register";

const mode = ref<AuthMode>("login");

const email = ref("");
const password = ref("");
const passwordRepeat = ref("");
const localError = ref<string | null>(null);
const confirmationEmail = ref<string | null>(null);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

function switchMode(newMode: AuthMode) {
  mode.value = newMode;
  localError.value = null;
  authStore.error = null;
  passwordRepeat.value = "";
}

async function handleSubmit() {
  localError.value = null;
  authStore.error = null;

  if (mode.value === "register") {
    if (password.value !== passwordRepeat.value) {
      localError.value = "Пароли не совпадают";
      return;
    }

    if (password.value.length < 6) {
      localError.value = "Пароль должен содержать минимум 6 символов";
      return;
    }

    const result = await authStore.register(email.value, password.value);
    console.log("register result:", result);

    if (!result.success) return;

    if (result.needsEmailConfirmation) {
      confirmationEmail.value = email.value;
      password.value = "";
      passwordRepeat.value = "";
      return;
    }
  } else {
    const success = await authStore.login(email.value, password.value);

    if (!success) return;
  }

  const redirect = route.query.redirect;

  const destination =
    typeof redirect === "string" &&
    redirect.startsWith("/") &&
    !redirect.startsWith("//") &&
    !redirect.startsWith("/\\")
      ? redirect
      : "/calendar";

  await router.replace(destination);
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 24px;
}

.auth-tabs button {
  padding: 12px;
  cursor: pointer;
}

.auth-tabs button.active {
  font-weight: 700;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.field input {
  padding: 10px 12px;
}

.error {
  margin: 12px 0;
}

form > button {
  width: 100%;
  padding: 12px;
  cursor: pointer;
}

form > button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
