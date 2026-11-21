<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCalendarStore } from '../stores/calendar'
import { campaignDate, shortCalendarDate, canOpenAssignment, calendarWindowLabel, calendarWindowBounds } from '../utils/calendar'
import '../assets/calendar/calendar-fonts.css'
import completedCircle from '../assets/calendar/451730f3-8fe7-403b-be98-c03b022d0574.svg'
import completedCheck from '../assets/calendar/e284dc00-d9d6-4583-a830-d4c8f80ee1c9.svg'
import todayOutline from '../assets/calendar/3fa47fbb-be3a-4dbf-b56a-851ff9e456ee.svg'
import todayBadge from '../assets/calendar/2365cce0-774a-4a72-b2a8-f3f1535ce46f.svg'
import dailyButton from '../assets/calendar/17cfb417-a7e1-4f43-be07-25f27aeb5c8b.svg'
const CalendarIllustration = defineAsyncComponent(() => import('../components/CalendarIllustration.vue'))
const router = useRouter()
const authStore = useAuthStore()
const calendarStore = useCalendarStore()
const { user, loading, error } = storeToRefs(authStore)
const today = ref(campaignDate())
const layout = ref<HTMLElement | null>(null)
const menu = ref<HTMLDetailsElement | null>(null)
const scale = ref(1)
const assignments = computed(() => new Map(calendarStore.tasks.map(task => [task.position, task])))
const windows = computed(() => Array.from({ length: 25 }, (_, index) => {
  const day = index + 1
  const assignment = assignments.value.get(day)
  return {
    day, assignment, bounds: calendarWindowBounds(day),
    completed: assignment?.status === 'completed',
    isToday: assignment?.available_date === today.value,
    available: canOpenAssignment(assignment, today.value),
    label: calendarWindowLabel(day, assignment, today.value),
  }
}))
const dailyAssignment = computed(() => {
  const available = calendarStore.tasks.filter(task => canOpenAssignment(task, today.value))
  return available.find(task => task.available_date === today.value)
    ?? available.find(task => task.status !== 'completed')
    ?? available[available.length - 1]
})
const dailyLabel = computed(() => {
  if (calendarStore.loading) return 'Загружаем задание дня…'
  const assignment = dailyAssignment.value
  if (assignment) return `${shortCalendarDate(assignment.available_date)} · Открыть задание дня →`
  const next = [...calendarStore.tasks].sort((a, b) => a.available_date.localeCompare(b.available_date))[0]
  return next ? `Первое окошко — ${shortCalendarDate(next.available_date)}` : 'Задания появятся здесь'
})
let observer: ResizeObserver | undefined
let clock: ReturnType<typeof setInterval> | undefined

function refreshDate() {
  const current = campaignDate()
  if (current !== today.value) {
    today.value = current
    // Fetch tasks that server policies have made visible after midnight.
    void loadCalendar(user.value?.id)
  }
}
function closeMenu() {
  if (menu.value?.open) {
    menu.value.open = false
    menu.value.querySelector('summary')?.focus()
  }
}
function openWindow(day: number) {
  if (canOpenAssignment(assignments.value.get(day), today.value)) {
    void router.push({ name: 'task', params: { id: day } })
  }
}
async function loadCalendar(userId: string | undefined) {
  if (!userId) { calendarStore.reset(); return }
  await calendarStore.loadCalendar(userId)
}
async function handleLogout() {
  if (await authStore.logout()) {
    calendarStore.reset()
    await router.replace({ name: 'auth' })
  }
}
watch(() => user.value?.id, userId => { void loadCalendar(userId) }, { immediate: true })
onMounted(() => {
  observer = new ResizeObserver(entries => {
    const width = entries[0]?.contentRect.width
    if (width) scale.value = width / 393
  })
  if (layout.value) observer.observe(layout.value)
  clock = setInterval(refreshDate, 60_000)
  document.addEventListener('visibilitychange', refreshDate)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  if (clock) clearInterval(clock)
  document.removeEventListener('visibilitychange', refreshDate)
})
</script>

<template>
  <main class="calendar-page" @keydown.esc="closeMenu">
    <div ref="layout" class="calendar-layout" :style="{ '--calendar-scale': scale }">
      <h1 class="sr-only">Новогодний адвент ГЕРОФАРМ</h1>
      <section class="calendar-stage" aria-label="Календарь на 25 дней" :aria-busy="calendarStore.loading">
        <div class="calendar-canvas">
          <CalendarIllustration :available-days="windows.filter(window => window.available).map(window => window.day)" />
          <RouterLink class="calendar-brand-link" to="/" aria-label="ГЕРОФАРМ — на главную" />
          <p class="calendar-intro">Нажмите на окошко - и задание откроется.</p>
          <button class="calendar-daily" type="button" :disabled="!dailyAssignment || calendarStore.loading" @click="dailyAssignment && openWindow(dailyAssignment.position)">
            <img :src="dailyButton" alt="" width="197" height="21" />
            <span>{{ dailyLabel }}</span>
          </button>

          <details ref="menu" class="calendar-menu">
            <summary aria-label="Открыть меню"><span class="sr-only">Меню</span></summary>
            <nav class="calendar-menu-panel" aria-label="Меню календаря">
              <p v-if="user?.email" class="calendar-account">{{ user.email }}</p>
              <RouterLink to="/rules">Правила участия</RouterLink>
              <button type="button" :disabled="loading" @click="handleLogout">{{ loading ? 'Выходим…' : 'Выйти из аккаунта' }}</button>
            </nav>
          </details>

          <button v-for="window in windows" :key="window.day" class="calendar-window" :class="{ 'is-today': window.isToday, 'is-door': window.day === 25 }" :style="window.bounds" type="button" :disabled="!window.available || calendarStore.loading" :aria-label="window.label" :aria-current="window.isToday ? 'date' : undefined" :title="window.label" @click="openWindow(window.day)">
            <template v-if="window.isToday">
              <img class="calendar-today-outline" :src="todayOutline" alt="" width="70.3" height="61.3" />
              <span class="calendar-today-badge"><img :src="todayBadge" alt="" width="48" height="14" />Сегодня</span>
            </template>
            <span v-if="window.completed" class="calendar-completed" aria-hidden="true">
              <img :src="completedCircle" alt="" width="12" height="12" />
              <img :src="completedCheck" alt="" width="6.3" height="4.8" />
            </span>
          </button>

          <div v-if="calendarStore.loading" class="calendar-notice" role="status">Загружаем задания…</div>
          <div v-else-if="calendarStore.error" class="calendar-notice" role="alert"><p>{{ calendarStore.error }}</p><button type="button" @click="loadCalendar(user?.id)">Попробовать ещё раз</button></div>
          <p v-else-if="!calendarStore.tasks.length" class="calendar-notice" role="status">Задания пока не назначены. Загляните чуть позже.</p>
          <p v-if="error" class="calendar-notice calendar-auth-error" role="alert">{{ error }}</p>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
@font-face { font-family:'Calendar Inter'; src:url('../assets/splash/Inter.ttf') format('truetype'); font-weight:100 900; font-display:swap; }
:global(#app:has(.calendar-page)) { width:100%; border:0; }
.calendar-page { min-height:100svh; background:linear-gradient(135deg,#110c08,#8b3e16 55%,#ff941f); color:#fff0d0; font:400 12px/1.3 'Calendar Inter',sans-serif; letter-spacing:0; color-scheme:light; }
.calendar-layout { max-width:393px; margin:0 auto; overflow:hidden; background:linear-gradient(135deg,#110c08,#803711 55%,#ff941f); }
.calendar-stage { position:relative; width:100%; aspect-ratio:393 / 852; }
.calendar-canvas { position:absolute; width:393px; height:1018px; left:0; top:0; transform:scale(var(--calendar-scale)); transform-origin:top left; }
.calendar-intro { position:absolute; top:147px; left:77px; width:239px; font-size:10px; line-height:12px; font-weight:500; text-align:center; margin:0; }
.calendar-brand-link { position:absolute; left:22px; top:10px; width:112px; height:44px; }
.calendar-daily { position:absolute; top:162px; left:88px; width:217px; min-height:44px; padding:0; border:0; background:transparent; color:#68381f; font:700 9px/11px 'Calendar Inter',sans-serif; cursor:pointer; display:grid; place-items:center; }
.calendar-daily > img { position:absolute; left:10px; top:12px; pointer-events:none; }
.calendar-daily > span { position:relative; white-space:nowrap; }
.calendar-daily:disabled { cursor:default; }
.calendar-menu { position:absolute; right:19px; top:9px; z-index:5; }
.calendar-menu summary { width:44px; height:44px; list-style:none; cursor:pointer; border-radius:50%; }
.calendar-menu summary::-webkit-details-marker { display:none; }
.calendar-menu-panel { position:absolute; top:49px; right:0; width:228px; box-sizing:border-box; padding:10px; border:1px solid #dfbc7f; border-radius:16px; background:#fff3da; color:#68381f; box-shadow:0 12px 35px #160a0666; text-align:left; }
.calendar-menu-panel a,.calendar-menu-panel button { display:flex; align-items:center; min-height:44px; width:100%; box-sizing:border-box; padding:10px; color:inherit; background:none; border:0; border-radius:8px; text-decoration:none; font:500 13px/20px 'Calendar Inter',sans-serif; text-align:left; cursor:pointer; }
.calendar-menu-panel a:hover,.calendar-menu-panel button:hover { background:#f2dfbd; }
.calendar-account { padding:8px 10px 12px; margin:0; overflow-wrap:anywhere; color:#846443; font-size:11px; }
.calendar-window { position:absolute; padding:0; border:0; background:transparent; border-radius:36px 36px 0 0; cursor:pointer; -webkit-tap-highlight-color:#fff0d033; }
.calendar-window:disabled { cursor:default; }
.calendar-window:not(:disabled):hover { box-shadow:inset 0 0 18px #fff2ce70; }
.calendar-window:focus-visible,.calendar-daily:focus-visible,.calendar-brand-link:focus-visible,.calendar-menu summary:focus-visible,.calendar-menu-panel :focus-visible { outline:3px solid #2c624c; outline-offset:3px; }
.calendar-completed { position:absolute; right:7.7px; bottom:5.9px; width:12px; height:12px; pointer-events:none; }
.calendar-completed img { position:absolute; left:0; top:0; }
.calendar-completed img + img { left:2.45px; top:3px; }
.calendar-today-outline { position:absolute; left:.27px; top:1.05px; pointer-events:none; }
.calendar-today-badge { position:absolute; width:48px; height:14px; top:-3.3px; left:11.9px; color:#fff8e1; font-size:9px; line-height:14px; font-weight:700; text-align:center; isolation:isolate; z-index:1; }
.calendar-today-badge img { position:absolute; inset:0; z-index:-1; }
.is-door .calendar-today-outline { display:none; }
.is-door.is-today { box-shadow:inset 0 0 0 2px #315d44; }
.is-door .calendar-today-badge { left:26px; }
.calendar-notice { position:absolute; z-index:4; top:244px; left:38px; width:317px; box-sizing:border-box; padding:18px; border:1px solid #e3c58d; border-radius:16px; color:#68381f; background:#fff4e5f5; box-shadow:0 8px 28px #4d1c0c33; text-align:center; font-size:13px; line-height:20px; }
.calendar-notice button { min-height:44px; padding:8px 14px; margin-top:12px; border:0; border-radius:12px; background:#a7280b; color:#fff3dd; font:600 12px/18px 'Calendar Inter',sans-serif; cursor:pointer; }
.calendar-auth-error { top:354px; }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0; }
</style>
