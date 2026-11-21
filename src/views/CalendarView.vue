<script setup lang="ts">
import { useCampaignClock } from '../composables/useCampaignClock';
import { asyncScreen } from '../utils/async-screen';
import { useScreenReadiness } from '../composables/useScreenReadiness';
import AppButton from '../components/ui/AppButton.vue';
import PageLayout from '../components/ui/PageLayout.vue';
import DesignCanvas from '../components/ui/DesignCanvas.vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCalendarStore } from '../stores/calendar'
import { shortCalendarDate, canOpenAssignment, calendarWindowLabel, calendarWindowBounds, calendarDesktopWindowBounds, isMandatoryCalendarDay } from '../utils/calendar'
import '../assets/calendar/calendar-fonts.css'
import completedCircle from '../assets/calendar/451730f3-8fe7-403b-be98-c03b022d0574.svg'
import completedCheck from '../assets/calendar/e284dc00-d9d6-4583-a830-d4c8f80ee1c9.svg'
import todayOutline from '../assets/calendar/3fa47fbb-be3a-4dbf-b56a-851ff9e456ee.svg'
import todayBadge from '../assets/calendar/2365cce0-774a-4a72-b2a8-f3f1535ce46f.svg'
import dailyButton from '../assets/calendar/17cfb417-a7e1-4f43-be07-25f27aeb5c8b.svg'
import DesktopCalendarIllustration from '../components/DesktopCalendarIllustration.vue'
import curtainLeft from '../assets/calendar/desktop/curtain-left.svg'
import curtainRight from '../assets/calendar/desktop/curtain-right.svg'
import snowFront from '../assets/calendar/desktop/snow-front.svg'
import snowBack from '../assets/calendar/desktop/snow-back.svg'
import treeLeft from '../assets/calendar/desktop/tree-left.svg'
import treeRight from '../assets/calendar/desktop/tree-right.svg'
import skyline from '../assets/calendar/desktop/skyline.svg'
import snowfall from '../assets/splash/snowfall-wide.svg'
import lantern from '../assets/calendar/desktop/lantern.svg'
import brand from '../assets/calendar/66d4a818-5417-4c1c-ac45-147152fb77f1.svg'
const desktopMedia = window.matchMedia('(min-width: 900px)')
const desktop = ref(desktopMedia.matches)
function updateDesktop() { desktop.value = desktopMedia.matches }
const CalendarIllustration = asyncScreen(() => import('../components/CalendarIllustration.vue'))
const { track } = useScreenReadiness()
const router = useRouter()
const authStore = useAuthStore()
const calendarStore = useCalendarStore()
const { user, loading, error } = storeToRefs(authStore)
const { today } = useCampaignClock()
const menu = ref<HTMLDetailsElement | null>(null)
const assignments = computed(() => new Map(calendarStore.tasks.map(task => [task.position, task])))
const windows = computed(() => Array.from({ length: 25 }, (_, index) => {
  const day = index + 1
  const assignment = assignments.value.get(day)
  return {
    day, assignment, mandatory: isMandatoryCalendarDay(day), bounds: desktop.value ? calendarDesktopWindowBounds(day) : calendarWindowBounds(day),
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
  const assignment = dailyAssignment.value
  if (assignment) return `${shortCalendarDate(assignment.available_date)} · Открыть задание дня →`
  const next = [...calendarStore.tasks].sort((a, b) => a.available_date.localeCompare(b.available_date))[0]
  return next ? `Первое окошко — ${shortCalendarDate(next.available_date)}` : 'Задания появятся здесь'
})
watch(today, () => { void loadCalendar(user.value?.id, true) })
function refreshVisibleCalendar() { if (!document.hidden) void loadCalendar(user.value?.id, true) }
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
async function loadCalendar(userId: string | undefined, force = false) {
  if (!userId) { calendarStore.reset(); return }
  await calendarStore.loadCalendar(userId, force)
}
async function handleLogout() {
  if (await authStore.logout()) {
    calendarStore.reset()
    await router.replace({ name: 'auth' })
  }
}
watch(() => user.value?.id, userId => { void track(loadCalendar(userId)) }, { immediate: true })
onMounted(() => {
  document.addEventListener('visibilitychange', refreshVisibleCalendar)
  desktopMedia.addEventListener('change', updateDesktop)
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', refreshVisibleCalendar)
  desktopMedia.removeEventListener('change', updateDesktop)
})
</script>

<template>
  <PageLayout background-variant="calendar" class="calendar-page" @keydown.esc="closeMenu">
    <div class="calendar-layout" :class="{ 'calendar-layout-desktop': desktop }">
      <div class="calendar-fullbleed" aria-hidden="true">
        <img class="calendar-snowfall" :src="snowfall" alt="" />
        <img class="calendar-lantern calendar-lantern-left" :src="lantern" alt="" />
        <img class="calendar-lantern calendar-lantern-right" :src="lantern" alt="" />
        <img class="calendar-skyline calendar-skyline-left" :src="skyline" alt="" />
        <img class="calendar-skyline calendar-skyline-right" :src="skyline" alt="" />
        <img class="calendar-ground-back" :src="snowBack" alt="" />
        <img class="calendar-tree calendar-tree-left" :src="treeLeft" alt="" />
        <img class="calendar-tree calendar-tree-right" :src="treeRight" alt="" />
        <img class="calendar-curtain calendar-curtain-left" :src="curtainLeft" alt="" />
        <img class="calendar-curtain calendar-curtain-right" :src="curtainRight" alt="" />
      </div>
      <h1 class="sr-only">Новогодний адвент ГЕРОФАРМ</h1>
      <DesignCanvas class="calendar-stage" :width="desktop ? 1440 : 393" :height="desktop ? 811 : 852" role="region" aria-label="Календарь на 25 дней" :aria-busy="calendarStore.loading">
        <div class="calendar-canvas">
          <component :is="desktop ? DesktopCalendarIllustration : CalendarIllustration" :available-days="windows.filter(window => window.available).map(window => window.day)" />
          <RouterLink class="calendar-brand-link" to="/" aria-label="ГЕРОФАРМ — на главную"><img v-if="desktop" :src="brand" alt="" width="112" height="15" /></RouterLink>
          <p class="calendar-intro">Нажмите на окошко - и задание откроется.</p>
          <AppButton class="calendar-daily" type="button" :disabled="!dailyAssignment || calendarStore.loading" @click="dailyAssignment && openWindow(dailyAssignment.position)">
            <img :src="dailyButton" alt="" width="197" height="21" />
            <span>{{ dailyLabel }}</span>
          </AppButton>

          <details ref="menu" class="calendar-menu">
            <summary aria-label="Открыть меню"><svg v-if="desktop" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><circle cx="16" cy="16" r="15.5" fill="none" stroke="currentColor" /><path d="M9 12h14M9 16h14M9 20h14" fill="none" stroke="currentColor" stroke-width="1.5" /></svg><span class="sr-only">Меню</span></summary>
            <nav class="calendar-menu-panel" aria-label="Меню календаря">
              <p v-if="user?.email" class="calendar-account">{{ user.email }}</p>
              <RouterLink to="/rules">Правила участия</RouterLink>
              <AppButton type="button" :disabled="loading" @click="handleLogout">{{ loading ? 'Выходим…' : 'Выйти из аккаунта' }}</AppButton>
            </nav>
          </details>

          <AppButton v-for="window in windows" :key="window.day" class="calendar-window" :class="{ 'is-today': window.isToday, 'is-door': window.day === 25, 'is-mandatory': window.mandatory }" :style="window.bounds" type="button" :disabled="!window.available || calendarStore.loading" :aria-label="window.label" :aria-current="window.isToday ? 'date' : undefined" :title="window.label" @click="openWindow(window.day)">
            <template v-if="window.isToday">
              <img class="calendar-today-outline" :src="todayOutline" alt="" width="70.3" height="61.3" />
              <span class="calendar-today-badge"><img :src="todayBadge" alt="" width="48" height="14" />Сегодня</span>
            </template>
            <span v-if="window.completed" class="calendar-completed" aria-hidden="true">
              <img :src="completedCircle" alt="" width="12" height="12" />
              <img :src="completedCheck" alt="" width="6.3" height="4.8" />
            </span>
          </AppButton>

          <div v-if="calendarStore.error" class="calendar-notice" role="alert"><p>{{ calendarStore.error }}</p><AppButton type="button" @click="loadCalendar(user?.id, true)">Попробовать ещё раз</AppButton></div>
          <p v-else-if="!calendarStore.loading && !calendarStore.tasks.length" class="calendar-notice" role="status">Задания пока не назначены. Загляните чуть позже.</p>
          <p v-if="error" class="calendar-notice calendar-auth-error" role="alert">{{ error }}</p>
        </div>
      </DesignCanvas>
      <div class="calendar-ground-front" aria-hidden="true"><img :src="snowFront" alt="" /></div>
    </div>
  </PageLayout>
</template>

<style scoped>
:global(#app:has(.calendar-page)) { width:100%; border:0; }
.calendar-page { min-height:100svh; color:#fff0d0; font:400 12px/1.3 'Advent Inter',sans-serif; letter-spacing:0; color-scheme:light; }
.calendar-canvas { position:absolute; width:393px; height:1018px; left:0; top:0; }
.calendar-intro { position:absolute; top:147px; left:24px; right:24px; font-size:max(10px, calc(10px / var(--design-scale))); line-height:max(12px, calc(12px / var(--design-scale))); font-weight:500; text-align:center; margin:0; }
.calendar-brand-link { position:absolute; left:22px; top:10px; width:112px; height:max(44px, calc(44px / var(--design-scale))); }
.calendar-daily { position:absolute; top:162px; left:88px; width:217px; min-height:max(44px, calc(44px / var(--design-scale))); padding:0; border:0; background:transparent; color:#68381f; font:700 max(9px, calc(9px / var(--design-scale)))/max(11px, calc(11px / var(--design-scale))) 'Advent Inter',sans-serif; cursor:pointer; display:grid; place-items:center; }
.calendar-daily > img { position:absolute; left:10px; top:50%; transform:translateY(-50%); pointer-events:none; }
.calendar-daily > span { position:relative; white-space:nowrap; }
.calendar-daily:disabled { cursor:default; }
.calendar-menu { position:absolute; right:19px; top:9px; z-index:5; }
.calendar-menu summary { width:max(44px, calc(44px / var(--design-scale))); height:max(44px, calc(44px / var(--design-scale))); list-style:none; cursor:pointer; border-radius:50%; }
.calendar-menu summary::-webkit-details-marker { display:none; }
.calendar-menu-panel { position:absolute; top:max(49px, calc(49px / var(--design-scale))); right:0; width:228px; box-sizing:border-box; padding:10px; border:1px solid #dfbc7f; border-radius:16px; background:#fff3da; color:#68381f; box-shadow:0 12px 35px #160a0666; text-align:left; }
.calendar-menu-panel a,.calendar-menu-panel button { display:flex; align-items:center; min-height:max(44px, calc(44px / var(--design-scale))); width:100%; box-sizing:border-box; padding:10px; color:inherit; background:none; border:0; border-radius:8px; text-decoration:none; font:500 max(13px, calc(13px / var(--design-scale)))/max(20px, calc(20px / var(--design-scale))) 'Advent Inter',sans-serif; text-align:left; cursor:pointer; }
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
.calendar-notice button { min-height:44px; padding:8px 14px; margin-top:12px; border:0; border-radius:12px; background:var(--color-action); color:#fff3dd; font:600 12px/18px 'Advent Inter',sans-serif; cursor:pointer; }
.calendar-auth-error { top:354px; }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0; }

.calendar-layout { position:relative; isolation:isolate; display:flex; flex-direction:column; width:100%; min-height:100svh; overflow:clip; }
.calendar-stage { flex:none; width:min(100%, clamp(393px, calc(24vw + 299px), 430px)); margin:auto auto 0; z-index:1; }
.calendar-fullbleed { position:absolute; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.calendar-fullbleed img { position:absolute; display:block; max-width:none; }
.calendar-snowfall { inset:0; width:100%; height:100%; object-fit:cover; opacity:.65; }
.calendar-skyline { bottom:22px; width:clamp(280px, 28.7vw, 550px); opacity:.6; }
.calendar-skyline-left { left:4.16%; }
.calendar-skyline-right { right:0; transform:scaleX(-1); }
.calendar-ground-back { width:100%; height:clamp(110px, 12.36vw, 210px); bottom:0; }
.calendar-tree,.calendar-curtain,.calendar-lantern { display:none; }
.calendar-ground-front { position:absolute; inset:auto 0 0; height:clamp(24px, 4.86vw, 90px); pointer-events:none; z-index:2; background:none; }
.calendar-ground-front::after { content:""; position:absolute; inset:auto 0 -1px; height:5px; background:#faf7ee; }
.calendar-ground-front img { display:block; position:absolute; width:100%; height:100%; inset:0; max-width:none; }
/* The desktop facade keeps readable windows while side scenery fills the viewport. */
.calendar-layout-desktop { min-height:max(811px, 100svh); --calendar-headroom:max(0px, calc(100svh - 811px)); }
.calendar-layout-desktop .calendar-stage { width:1440px; left:50%; margin:auto 0 0; transform:translateX(-50%); }
.calendar-layout-desktop .calendar-canvas { width:1440px; height:811px; }
.calendar-layout-desktop .calendar-intro { top:calc(119px - var(--calendar-headroom) / var(--design-scale)); left:400px; right:400px; font-size:max(14px, calc(14px / var(--design-scale))); line-height:22px; }
.calendar-layout-desktop .calendar-brand-link { top:calc(26px - var(--calendar-headroom) / var(--design-scale)); left:calc(720px - 50vw + clamp(24px, 4.5vw, 65px)); display:flex; align-items:flex-start; }
.calendar-layout-desktop .calendar-menu { top:calc(24px - var(--calendar-headroom) / var(--design-scale)); right:calc(720px - 50vw + clamp(24px, 4.5vw, 65px)); }
.calendar-layout-desktop summary { display:grid; place-items:center; }
.calendar-layout-desktop .calendar-daily { left:610px; top:calc(138px - var(--calendar-headroom) / var(--design-scale)); }
.calendar-layout-desktop .calendar-lantern { display:block; width:clamp(54px, 6.94vw, 100px); top:74px; }
.calendar-layout-desktop .calendar-lantern-left { left:calc(50% - min(30.9vw, 445px)); }
.calendar-layout-desktop .calendar-lantern-right { right:calc(50% - min(30.9vw, 445px)); }
.calendar-layout-desktop .calendar-tree { display:block; bottom:17px; width:clamp(140px, 16vw, 280px); }
.calendar-layout-desktop .calendar-tree-left { left:max(20px, calc(50% - 536px)); }
.calendar-layout-desktop .calendar-tree-right { right:max(20px, calc(50% - 536px)); }
.calendar-layout-desktop .calendar-curtain { display:block; height:100%; width:clamp(130px, 18.2vw, 300px); object-fit:fill; top:0; }
.calendar-layout-desktop .calendar-curtain-left { left:0; }
.calendar-layout-desktop .calendar-curtain-right { right:0; }
.calendar-layout-desktop .calendar-today-outline { width:100%; height:100%; left:0; top:0; }
.calendar-layout-desktop .calendar-today-badge { left:calc(50% - 24px); }
.calendar-layout-desktop .calendar-notice { left:560px; }
</style>
