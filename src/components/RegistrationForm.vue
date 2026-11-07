<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { RegistrationFormData } from '../types/registration'

defineProps<{ loading: boolean; error: string | null }>()
const emit = defineEmits<{ submit: [data: RegistrationFormData]; login: [] }>()
const fullName = ref('')
const email = ref('')
const workplace = ref('')
const password = ref('')
const passwordRepeat = ref('')
const consent = ref(false)
const validationError = ref('')
const workplaces = [
  'Завод в Пушкине', 'Завод в Оболенске', 'R&D Стрельна', 'R&D Кирочная',
  'Офис Санкт-Петербург', 'Офис Москва', 'ПП Возрождения', 'ПП Оптикс',
  'Региональный сотрудник', 'Другое',
]

function submit() {
  validationError.value = ''
  if (!fullName.value.trim() || !workplace.value || !consent.value) {
    validationError.value = 'Заполните все поля и подтвердите согласие.'
    return
  }
  if (!/^[^\s@]+@geropharm\.com$/i.test(email.value.trim())) {
    validationError.value = 'Укажите корпоративную почту @geropharm.com.'
    return
  }
  if (password.value.length < 6) {
    validationError.value = 'Пароль должен содержать минимум 6 символов.'
    return
  }
  if (password.value !== passwordRepeat.value) {
    validationError.value = 'Пароли не совпадают.'
    return
  }
  emit('submit', {
    email: email.value.trim().toLowerCase(), password: password.value,
    fullName: fullName.value.trim(), workplace: workplace.value, consent: true,
  })
}
</script>

<template>
  <main class="auth-page">
    <div class="auth-layout">
      <header class="auth-header">
        <RouterLink to="/rules" class="auth-back" aria-label="Вернуться к правилам"><span aria-hidden="true"></span></RouterLink>
        <p>ГЕРОФАРМ</p>
      </header>
      <section class="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title">Регистрация</h1>
        <p class="auth-intro">Присоединяйтесь к новогоднему адвенту.<br />Все поля обязательны для заполнения.</p>
        <form @submit.prevent="submit" @input="validationError = ''" :aria-busy="loading">
          <fieldset :disabled="loading">
            <div class="auth-field name-field">
              <label for="register-name">ФИО</label>
              <input id="register-name" v-model="fullName" autocomplete="name" placeholder="Иванов Иван Иванович" required />
            </div>
            <div class="auth-field email-field">
              <label for="register-email">Email</label>
              <input id="register-email" v-model="email" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="ivan.ivanov@geropharm.com" aria-describedby="register-email-hint" required />
              <p id="register-email-hint" class="auth-hint">Укажите корпоративную почту ГЕРОФАРМ (@geropharm.com).</p>
            </div>
            <div class="auth-field workplace-field">
              <label for="register-workplace">Площадка</label>
              <div class="auth-select">
                <select id="register-workplace" v-model="workplace" :class="{ placeholder: !workplace }" required>
                  <option value="" disabled>Выберите свою площадку</option>
                  <option v-for="item in workplaces" :key="item" :value="item">{{ item }}</option>
                </select>
              </div>
            </div>
            <div class="auth-field password-field">
              <label for="register-password">Пароль</label>
              <input id="register-password" v-model="password" type="password" autocomplete="new-password" minlength="6" placeholder="Минимум 6 символов" required />
            </div>
            <div class="auth-field password-repeat-field">
              <label for="register-password-repeat">Повторите пароль</label>
              <input id="register-password-repeat" v-model="passwordRepeat" type="password" autocomplete="new-password" minlength="6" placeholder="Введите пароль ещё раз" required />
            </div>
            <div class="auth-consent">
              <label class="auth-consent-label" for="register-consent">
                <input id="register-consent" v-model="consent" type="checkbox" :aria-describedby="!consent ? 'register-consent-hint' : undefined" required />
                <span>Я даю свое согласие на обработку персональных данных для того, чтобы организаторы адвент-календаря могли связаться со мной для получения подарка</span>
              </label>
              <p v-if="!consent" id="register-consent-hint" class="auth-consent-hint">Для регистрации необходимо ваше согласие.</p>
            </div>
            <p v-if="validationError || error" class="auth-error" role="alert">{{ validationError || error }}</p>
            <button class="auth-submit" type="submit">{{ loading ? 'Подождите...' : 'Зарегистрироваться' }}</button>
          </fieldset>
        </form>
      </section>
      <button class="auth-login" type="button" :disabled="loading" @click="emit('login')">Уже есть аккаунт? Войти</button>
    </div>
  </main>
</template>

<style scoped src="../assets/auth-form.css"></style>
