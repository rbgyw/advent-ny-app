
import {
  createRouter,
  createWebHistory,
} from 'vue-router'

import { useAuthStore } from '../stores/auth'

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

router.beforeEach(async (to) => {
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
