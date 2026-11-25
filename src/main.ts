import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/fonts.css'
import './style.css'
import './tokens.css'
import './assets/task-actions.css'
import { reportResourceFailure } from './utils/resource-diagnostics'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  // The plugin runs only when the calendar store is actually created.
  // Clear user data synchronously on identity changes without loading it on public pages.
  pinia.use(({ store }) => {
    if (store.$id === 'calendar') {
      watch(() => pinia.state.value.auth?.user?.id, (id, previous) => {
        if (previous && id !== previous) store.reset()
      }, { flush: 'sync' })
    }
  })
  app.use(pinia)
  // Supabase and auth are deferred until a route requires them.
  const { default: router } = await import('./router')
  app.use(router)
  app.mount('#app')
  window.dispatchEvent(new Event('advent:mounted'))
  await router.isReady()
}

bootstrap().catch(() => {
  reportResourceFailure('screen', 'unexpected', undefined, true)
  const status = document.querySelector('#startup-status')
  if (status) {
    status.textContent = 'Не удалось запустить приложение. Проверьте подключение и обновите страницу.'
    status.setAttribute('role', 'alert')
  }
  document.querySelector<HTMLButtonElement>('#startup-retry')?.removeAttribute('hidden')
})
