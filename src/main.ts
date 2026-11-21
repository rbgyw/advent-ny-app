import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/fonts.css'
import './style.css'
import './tokens.css'

document.querySelector('#startup-retry')?.addEventListener('click', () => window.location.reload())

async function bootstrap() {
  // Keep the HTML startup shell visible, including during module/auth failures.
  const [{ default: router }, { useAuthStore }] = await Promise.all([
    import('./router'), import('./stores/auth'),
  ])
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  // Guards still await initialization before entering protected routes.
  const auth = useAuthStore(pinia)
  app.provide('authStore', auth)
  void auth.initialize()
  app.use(router)
  await router.isReady()
  app.mount('#app')
}

bootstrap().catch(() => {
  const status = document.querySelector('#startup-status')
  if (status) {
    status.textContent = 'Не удалось запустить приложение. Проверьте подключение и обновите страницу.'
    status.setAttribute('role', 'alert')
  }
  document.querySelector<HTMLButtonElement>('#startup-retry')?.removeAttribute('hidden')
})
