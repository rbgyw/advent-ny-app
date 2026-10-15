
import {
  createRouter,
  createWebHistory,
} from 'vue-router'

import { useAuthStore } from '../stores/auth'

import AuthView from '../views/AuthView.vue'
import CalendarView from '../views/CalendarView.vue'
import TaskView from '../views/TaskView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      redirect: '/calendar',
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