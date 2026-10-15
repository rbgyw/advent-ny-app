import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

import './style.css'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const authStore = useAuthStore(pinia)

  await authStore.initialize()

  app.use(router)

  await router.isReady()

  app.mount('#app')
}

bootstrap().catch(console.error)