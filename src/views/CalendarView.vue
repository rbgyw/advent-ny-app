<template>
  <main class="calendar">
    <header class="calendar-header">
      <div>
        <h1>Адвент-календарь</h1>

        <p v-if="user">
          Вы вошли как: {{ user.email }}
        </p>
      </div>

      <button
        type="button"
        @click="handleLogout"
        :disabled="loading"
      >
        {{ loading ? 'Выход...' : 'Выйти' }}
      </button>
    </header>

    <p v-if="error" class="error">
      {{ error }}
    </p>

    <section>
      <h2>Ваш календарь</h2>
      <p>Здесь будут отображаться задания.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const { user, loading, error } = storeToRefs(authStore)

async function handleLogout() {
  const success = await authStore.logout()

  if (success) {
    await router.replace({ name: 'auth' })
  }
}
</script>

<style scoped>
.calendar {
  padding: 24px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

button {
  padding: 10px 20px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
}
</style>