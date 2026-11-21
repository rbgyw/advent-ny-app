
import {
  createRouter,
  createWebHistory,
} from 'vue-router'
import { navigationPending, navigationError, navigationDestination, screenPending, screenError, screenBackground, screenBackgroundLayer } from './status'


const SplashView = () => import('../views/SplashView.vue')
const RulesView = () => import('../views/RulesView.vue')

const AuthView = () => import('../views/AuthView.vue')
const CalendarView = () => import('../views/CalendarView.vue')
const TaskView = () => import('../views/TaskView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },

  routes: [
    {
      path: '/rules',
      name: 'rules',
      component: RulesView,
    },
    {
      path: '/',
      name: 'splash',
      component: SplashView,
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      meta: {
        requiresGuest: true,
      },
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: CalendarView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/task/:id',
      name: 'task',
      component: TaskView,
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach(to => {
  navigationDestination.value = to.fullPath
  navigationError.value = ''
  navigationPending.value = true
  screenPending.value = true
  screenError.value = ''
  screenBackground.value = ''
  screenBackgroundLayer.value = undefined
})
router.afterEach((to, _from, failure) => {
  if (to.fullPath !== navigationDestination.value) return
  navigationPending.value = false
  if (failure) screenPending.value = false
})
router.onError((_error, to) => {
  if (to.fullPath !== navigationDestination.value) return
  navigationPending.value = false
  navigationError.value = 'Не удалось открыть страницу. Проверьте подключение.'
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.requiresGuest) return
  const { useAuthStore } = await import('../stores/auth')
  const authStore = useAuthStore()

  // Дожидаемся восстановления сессии
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  // Неавторизованный пользователь
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'auth',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  // Авторизованный пользователь на странице входа
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    const redirect = to.query.redirect

    if (
      typeof redirect === 'string' &&
      redirect.startsWith('/') &&
      !redirect.startsWith('//') &&
      !redirect.startsWith('/\\')
    ) {
      return redirect
    }

    return {
      name: 'calendar',
    }
  }
})

export default router
