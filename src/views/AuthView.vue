<template>
  <RegistrationForm
    v-if="mode === 'register' && !confirmationEmail"
    :loading="authStore.loading"
    :error="authStore.error"
    @submit="handleRegistration"
    @login="switchMode('login')"
  />
  <main v-else class="auth-page">
    <div class="auth-layout">
      <header class="auth-header">
        <RouterLink to="/rules" class="auth-back" aria-label="Вернуться к правилам"><span aria-hidden="true"></span></RouterLink>
        <p>ГЕРОФАРМ</p>
      </header>
      <section class="auth-card" :aria-labelledby="confirmationEmail ? 'confirmation-title' : 'login-title'">
        <template v-if="confirmationEmail">
          <h1 id="confirmation-title">Проверьте почту</h1>
          <p class="auth-intro">Мы отправили письмо для подтверждения регистрации на <strong class="confirmation-email">{{ confirmationEmail }}</strong>.</p>
          <p class="auth-intro">Перейдите по ссылке в письме, чтобы активировать аккаунт.</p>
          <button class="auth-submit" type="button" @click="switchMode('login')">Перейти ко входу</button>
        </template>
        <template v-else>
          <h1 id="login-title">Вход</h1>
          <p class="auth-intro">Войдите в новогодний адвент-календарь с корпоративной почтой и паролем.</p>
          <form @submit.prevent="handleLogin" :aria-busy="authStore.loading">
            <fieldset :disabled="authStore.loading">
              <div class="auth-field email-field">
                <label for="login-email">Email</label>
                <input id="login-email" v-model="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="ivan.ivanov@geropharm.com" required />
              </div>
              <div class="auth-field password-field">
                <label for="login-password">Пароль</label>
                <input id="login-password" v-model="password" type="password" autocomplete="current-password" placeholder="Введите пароль" required />
              </div>
              <p v-if="authStore.error" class="auth-error" role="alert">{{ authStore.error }}</p>
              <button class="auth-submit" type="submit">{{ authStore.loading ? 'Подождите...' : 'Войти' }}</button>
            </fieldset>
          </form>
        </template>
      </section>
      <button v-if="!confirmationEmail" class="auth-login" type="button" :disabled="authStore.loading" @click="switchMode('register')">Нет аккаунта? Зарегистрироваться</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import RegistrationForm from '../components/RegistrationForm.vue';
import type { RegistrationFormData } from '../types/registration';

type AuthMode = 'login' | 'register';
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const mode = ref<AuthMode>(route.query.mode === 'register' ? 'register' : 'login');
const email = ref('');
const password = ref('');
const confirmationEmail = ref<string | null>(null);

function resetMode(newMode: AuthMode) {
  mode.value = newMode;
  authStore.error = null;
  password.value = '';
  confirmationEmail.value = null;
}

function switchMode(newMode: AuthMode) {
  resetMode(newMode);
  if (route.query.mode !== newMode) {
    void router.replace({ query: { ...route.query, mode: newMode } });
  }
}

watch(() => route.query.mode, (value) => {
  resetMode(value === 'register' ? 'register' : 'login');
});

async function goToDestination() {
  const redirect = route.query.redirect;
  const destination = typeof redirect === 'string' && redirect.startsWith('/') &&
    !redirect.startsWith('//') && !redirect.startsWith('/\\') ? redirect : '/calendar';
  await router.replace(destination);
}

async function handleLogin() {
  if (authStore.loading) return;
  const success = await authStore.login(email.value.trim().toLowerCase(), password.value);
  if (success) await goToDestination();
}

async function handleRegistration(data: RegistrationFormData) {
  if (authStore.loading) return;
  const result = await authStore.register(data.email, data.password, {
    fullName: data.fullName, workplace: data.workplace, consent: data.consent,
  });
  if (!result.success) return;
  email.value = data.email;
  if (result.needsEmailConfirmation) {
    confirmationEmail.value = data.email;
    return;
  }
  await goToDestination();
}
</script>

<style scoped src="../assets/auth-form.css"></style>
<style scoped>
.confirmation-email { overflow-wrap: anywhere; }
</style>
