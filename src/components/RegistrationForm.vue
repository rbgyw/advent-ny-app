<script setup lang="ts">
import FormField from './ui/FormField.vue';
import AppButton from './ui/AppButton.vue';
import PageLayout from './ui/PageLayout.vue';
import AppHeader from './ui/AppHeader.vue';
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { RegistrationFormData } from '../types/registration'
import { corporateEmailRequired, getEmailError } from '../utils/email-policy'

const corporateOnly = corporateEmailRequired()

defineProps<{ loading: boolean; error: string | null }>()
const emit = defineEmits<{ submit: [data: RegistrationFormData]; login: [] }>()
const fullName = ref('')
const email = ref('')
const workplace = ref('')
const consent = ref(false)
const validationError = ref('')
const workplaces = [
  'Завод в Пушкине', 'Завод в Оболенске', 'R&D Стрельна', 'R&D Кирочная',
  'Офис Санкт-Петербург', 'Офис Москва', 'ПП Возрождения', 'ПП Оптиков',
  'Региональный сотрудник', 'Другое',
]

function submit() {
  validationError.value = ''
  if (!fullName.value.trim() || !workplace.value || !consent.value) {
    validationError.value = 'Заполните все поля и подтвердите согласие.'
    return
  }
  const emailError = getEmailError(email.value)
  if (emailError) {
    validationError.value = emailError
    return
  }
  emit('submit', {
    email: email.value.trim().toLowerCase(),
    fullName: fullName.value.trim(), workplace: workplace.value, consent: true,
  })
}
</script>

<template>
  <PageLayout background-variant="warm" class="auth-page">
    <div class="auth-layout">
      <AppHeader class="auth-header">
        <RouterLink to="/rules" class="auth-back" aria-label="Вернуться к правилам"><span aria-hidden="true"></span></RouterLink>
        <p>ГЕРОФАРМ</p>
      </AppHeader>
      <section class="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title">Регистрация</h1>
        <p class="auth-intro">Присоединяйтесь к новогоднему адвенту.<br />Все поля обязательны для заполнения.</p>
        <form @submit.prevent="submit" @input="validationError = ''" :aria-busy="loading">
          <fieldset :disabled="loading">
            <FormField class="name-field" for-id="register-name" label="ФИО">
              <input id="register-name" v-model="fullName" autocomplete="name" placeholder="Иванов Иван Иванович" required />
            </FormField>
            <FormField class="email-field" for-id="register-email" label="Email">
              <input id="register-email" v-model="email" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="ivan.ivanov@geropharm.com" aria-describedby="register-email-hint" required />
              <p id="register-email-hint" class="auth-hint">{{ corporateOnly ? 'Укажите корпоративную почту ГЕРОФАРМ (@geropharm.com).' : 'Укажите email — на него придёт код подтверждения.' }}</p>
            </FormField>
            <FormField class="workplace-field" for-id="register-workplace" label="Площадка">
              <div class="auth-select">
                <select id="register-workplace" v-model="workplace" :class="{ placeholder: !workplace }" required>
                  <option value="" disabled>Выберите свою площадку</option>
                  <option v-for="item in workplaces" :key="item" :value="item">{{ item }}</option>
                </select>
              </div>
            </FormField>
            <div class="auth-consent">
              <label class="auth-consent-label" for="register-consent">
                <input id="register-consent" v-model="consent" type="checkbox" :aria-describedby="!consent ? 'register-consent-hint' : undefined" required />
                <span>Я даю свое согласие на обработку персональных данных для того, чтобы организаторы адвент-календаря могли связаться со мной для получения подарка</span>
              </label>
              <p v-if="!consent" id="register-consent-hint" class="auth-consent-hint">Для регистрации необходимо ваше согласие.</p>
            </div>
            <p v-if="validationError || error" class="auth-error" role="alert">{{ validationError || error }}</p>
            <AppButton :loading="loading" class="auth-submit" type="submit">{{ loading ? 'Подождите...' : 'Зарегистрироваться' }}</AppButton>
          </fieldset>
        </form>
      </section>
      <AppButton class="auth-login" type="button" :disabled="loading" @click="emit('login')">Уже есть аккаунт? Войти</AppButton>
    </div>
  </PageLayout>
</template>

<style scoped src="../assets/auth-form.css"></style>
