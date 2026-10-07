import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import CalendarView from '../views/CalendarView.vue'
import TaskView from '../views/TaskView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/calendar',
    },
    {
      path: '/login',
      component: LoginView,
    },
    {
      path: '/calendar',
      component: CalendarView,
    },
    {
      path: '/task/:id',
      component: TaskView,
    },
  ],
})

export default router