<template>
  <VerificationCodeForm
    v-if="confirmationEmail"
    :loading="authStore.loading"
    :resending="resending"
    :error="authStore.error"
    :invalid-code="invalidCode"
    :resend-succeeded="resendSucceeded"
    @submit="handleVerification"
    @resend="handleResend"
    @back="switchMode('login')"
    @edit="clearVerificationError"
  />
  <RegistrationForm
    v-else-if="mode === 'register'"
    :loading="authStore.loading"
    :error="authStore.error"
    @submit="handleRegistration"
    @login="switchMode('login')"
  />
  <PageLayout background-variant="warm" v-else class="auth-page">
    <div class="auth-layout">
      <AppHeader class="auth-header">
        <RouterLink to="/rules" class="auth-back" aria-label="Вернуться к правилам"><span aria-hidden="true"></span></RouterLink>
        <p>ГЕРОФАРМ</p>
      </AppHeader>
      <section class="auth-card" aria-labelledby="login-title">
          <h1 id="login-title">Вход</h1>
          <p class="auth-intro">Укажите корпоративную почту — мы отправим код для входа.</p>
          <form @submit.prevent="handleLogin" :aria-busy="authStore.loading">
            <fieldset :disabled="authStore.loading">
              <FormField class="email-field" for-id="login-email" label="Email">
                <input id="login-email" v-model="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="ivan.ivanov@geropharm.com" required />
              </FormField>
              <p v-if="authStore.error" class="auth-error" role="alert">{{ authStore.error }}</p>
              <AppButton :loading="authStore.loading" class="auth-submit" type="submit">{{ authStore.loading ? 'Подождите...' : 'Войти' }}</AppButton>
            </fieldset>
          </form>
      </section>
      <AppButton class="auth-login" type="button" :disabled="authStore.loading" @click="switchMode('register')">Нет аккаунта? Зарегистрироваться</AppButton>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import FormField from '../components/ui/FormField.vue';
import AppButton from '../components/ui/AppButton.vue';
import PageLayout from '../components/ui/PageLayout.vue';
import AppHeader from '../components/ui/AppHeader.vue';
import { ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import RegistrationForm from '../components/RegistrationForm.vue';
import VerificationCodeForm from '../components/VerificationCodeForm.vue';
import type { RegistrationFormData } from '../types/registration';

type AuthMode = 'login' | 'register';
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const mode = ref<AuthMode>(route.query.mode === 'register' ? 'register' : 'login');
const email = ref('');
const pendingEmailKey = 'advent.pending-confirmation-email';
const confirmationEmail = ref<string | null>(sessionStorage.getItem(pendingEmailKey));
const resending = ref(false);
const invalidCode = ref(false);
const resendSucceeded = ref(0);

function clearVerificationError() {
  authStore.error = null;
  invalidCode.value = false;
}

async function handleVerification(code: string) {
  if (!confirmationEmail.value || authStore.loading || resending.value) return;
  const result = await authStore.verifyEmailCode(confirmationEmail.value, code);
  invalidCode.value = result.invalidCode;
  if (result.success) {
    sessionStorage.removeItem(pendingEmailKey);
    confirmationEmail.value = null;
    await goToDestination();
  }
}

async function handleResend() {
  if (!confirmationEmail.value || authStore.loading || resending.value) return;
  resending.value = true;
  invalidCode.value = false;
  try {
    if (await authStore.resendEmailCode(confirmationEmail.value)) resendSucceeded.value++;
  } finally { resending.value = false; }
}

function resetMode(newMode: AuthMode) {
  mode.value = newMode;
  authStore.error = null;
  confirmationEmail.value = null;
  sessionStorage.removeItem(pendingEmailKey);
  invalidCode.value = false;
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
  const success = await authStore.login(email.value.trim().toLowerCase());
  if (success) {
    confirmationEmail.value = email.value.trim().toLowerCase();
    sessionStorage.setItem(pendingEmailKey, confirmationEmail.value);
  }
}

async function handleRegistration(data: RegistrationFormData) {
  if (authStore.loading) return;
  const result = await authStore.register(data.email, {
    fullName: data.fullName, workplace: data.workplace, consent: data.consent,
  });
  if (!result.success) return;
  email.value = data.email;
  if (result.needsEmailConfirmation) {
    confirmationEmail.value = data.email;
      sessionStorage.setItem(pendingEmailKey, data.email);
    return;
  }
  await goToDestination();
}
</script>

<style scoped src="../assets/auth-form.css"></style>
