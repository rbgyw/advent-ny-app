<script setup lang="ts">
import { useCampaignClock } from '../composables/useCampaignClock';
import { asyncScreen } from '../utils/async-screen';
import { useScreenReadiness } from '../composables/useScreenReadiness';
import AppButton from '../components/ui/AppButton.vue';
import PageLayout from '../components/ui/PageLayout.vue';
import DesignCanvas from '../components/ui/DesignCanvas.vue';
import MobileCalendarFlurries from '../components/MobileCalendarFlurries.vue';
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
import DesktopCalendarIllustration from '../components/DesktopCalendarIllustration.vue'
import mobileGround from '../assets/calendar/snow-mobile.svg'
import curtainLeft from '../assets/calendar/desktop/curtain-left.svg'
import curtainRight from '../assets/calendar/desktop/curtain-right.svg'
import snowFront from '../assets/calendar/desktop/snow-front.svg'
import snowBack from '../assets/calendar/desktop/snow-back.svg'
import treeLeft from '../assets/calendar/desktop/tree-left.svg'
import treeRight from '../assets/calendar/desktop/tree-right.svg'
import skylineRight from '../assets/calendar/desktop/skyline-right.svg'
import skyline from '../assets/calendar/desktop/skyline.svg'
import snowfall from '../assets/splash/snowfall-wide.svg'
import lantern from '../assets/calendar/desktop/lantern.svg'
import brand from '../assets/calendar/desktop/brand.svg'
import mobileBrand from '../assets/calendar/66d4a818-5417-4c1c-ac45-147152fb77f1.svg'
import titleFirstLine from '../assets/calendar/5e929305-14cc-4c7e-b15c-88ab39f775ff.svg'
import titleSecondLine from '../assets/calendar/7ff83ef7-96b0-4a2f-8b3e-d975d90e8b02.svg'
import titleSpark from '../assets/calendar/411be528-dba9-4de9-addb-406232bee064.svg'
import mobileStarLeft from '../assets/calendar/be3c7010-44cc-44ef-a778-90b223d6fdd7.svg'
import mobileStarRight from '../assets/calendar/2c2c774d-e39f-4325-a179-bd18a53b9966.svg'
import desktopTitle from '../assets/calendar/desktop/title.svg'
const desktopMedia = window.matchMedia('(min-width: 640px)')
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
      <img v-if="desktop" class="calendar-snowfall" :src="snowfall" alt="" />
      <MobileCalendarFlurries v-else />
      <div v-if="desktop" class="calendar-fullbleed" aria-hidden="true">
        <div class="calendar-lantern calendar-lantern-left"><img :src="lantern" alt="" /></div>
        <div class="calendar-lantern calendar-lantern-right"><img :src="lantern" alt="" /></div>
        <img class="calendar-skyline calendar-skyline-left" :src="skyline" alt="" />
        <img class="calendar-skyline calendar-skyline-right" :src="skylineRight" alt="" />
        <img class="calendar-ground-back" :src="snowBack" alt="" />
        <img class="calendar-tree calendar-tree-left" :src="treeLeft" alt="" />
        <img class="calendar-tree calendar-tree-right" :src="treeRight" alt="" />
        <img class="calendar-curtain calendar-curtain-left" :src="curtainLeft" alt="" />
        <img class="calendar-curtain calendar-curtain-right" :src="curtainRight" alt="" />
      </div>
      <div v-else class="calendar-mobile-stars" aria-hidden="true">
        <img :src="mobileStarLeft" alt="" />
        <img :src="mobileStarRight" alt="" />
      </div>

      <header class="calendar-toolbar">
        <RouterLink class="calendar-brand-link" to="/" aria-label="ГЕРОФАРМ — на главную">
          <img :src="desktop ? brand : mobileBrand" alt="" />
        </RouterLink>
        <details ref="menu" class="calendar-menu">
          <summary aria-label="Открыть меню">
            <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
              <circle cx="16" cy="16" r="15.5" fill="none" stroke="currentColor" />
              <path d="M9 12h14M9 16h14M9 20h14" fill="none" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </summary>
          <nav class="calendar-menu-panel" aria-label="Меню календаря">
            <p v-if="user?.email" class="calendar-account">{{ user.email }}</p>
            <RouterLink to="/rules">Правила участия</RouterLink>
            <AppButton type="button" :disabled="loading" @click="handleLogout">{{ loading ? 'Выходим…' : 'Выйти из аккаунта' }}</AppButton>
          </nav>
        </details>
      </header>
      <div class="calendar-copy">
        <h1 class="calendar-heading" aria-label="Новогодний адвент ГЕРОФАРМ">
          <img v-if="desktop" class="desktop-calendar-title" :src="desktopTitle" alt="" width="624" height="89" />
          <span v-else class="mobile-calendar-title" aria-hidden="true">
            <img class="mobile-title-first" :src="titleFirstLine" alt="" />
            <img class="mobile-title-second" :src="titleSecondLine" alt="" />
            <img class="mobile-title-spark" :src="titleSpark" alt="" />
          </span>
        </h1>
        <p class="calendar-intro">Нажмите на окошко — и задание откроется.</p>
        <AppButton class="calendar-daily" type="button" :disabled="!dailyAssignment || calendarStore.loading" @click="dailyAssignment && openWindow(dailyAssignment.position)">
          <span class="calendar-daily-label">{{ dailyLabel }}</span>
        </AppButton>
      </div>

      <div class="calendar-building">
        <DesignCanvas class="calendar-stage" :width="desktop ? 1440 : 393" :height="desktop ? 811 : 852" role="region" aria-label="Календарь на 25 дней" :aria-busy="calendarStore.loading">
          <div class="calendar-canvas">
            <component :is="desktop ? DesktopCalendarIllustration : CalendarIllustration" :available-days="windows.filter(window => window.available).map(window => window.day)" />
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
      </div>
      <div class="calendar-ground-front" aria-hidden="true"><img :src="desktop ? snowFront : mobileGround" alt="" /></div>
    </div>
  </PageLayout>
</template>

<style scoped>
:global(#app:has(.calendar-page)) { width:100%; border:0; }
.calendar-page { min-height:100svh; color:#fff0d0; font:400 12px/1.3 'Advent Inter',sans-serif; letter-spacing:0; color-scheme:light; }
.calendar-canvas { position:absolute; width:393px; height:1018px; left:0; top:0; }
.calendar-toolbar {
  position: absolute;
  z-index: 3;
  top: 9px;
  left: 50%;
  transform: translateX(-50%);
  width: min(calc(var(--stage-width) - 36px), 392px);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.calendar-brand-link {
  display: flex;
  align-items: center;
  min-height: 44px;
  width: 112px;
}
.calendar-brand-link img { display: block; width: 100%; height: auto; }
.calendar-menu { position: relative; }
.calendar-menu summary {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  list-style: none;
  cursor: pointer;
  border-radius: 50%;
}
.calendar-menu summary svg { width: 32px; height: 32px; }
.calendar-copy {
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 20px var(--copy-bottom);
  text-align: center;
}
.calendar-heading { width: fit-content; margin: 0; line-height: 0; }
.mobile-calendar-title { position: relative; display: block; width: clamp(156px, 49.4vw, 212px); aspect-ratio: 194 / 74.45; }
.mobile-calendar-title img { position: absolute; display: block; height: auto; }
.mobile-title-first { top: 0; left: 0; width: 100%; }
.mobile-title-second { top: 48%; left: 22.15%; width: 57.08%; }
.mobile-title-spark { top: 8.62%; right: 2.38%; width: 5.66%; }
.desktop-calendar-title { display: block; width: var(--title-width); height: auto; }
.calendar-intro {
  max-inline-size: calc(var(--stage-width) * .58);
  margin: var(--title-gap) 0 0;
  font-size: clamp(11px, calc(var(--stage-width) * .0295), 12.5px);
  line-height: 1.35;
  font-weight: 500;
  text-wrap: balance;
}
.calendar-daily {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  min-height: var(--daily-hit-height);
  max-width: min(100%, 248px);
  margin-block-start: var(--daily-gap);
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}
.calendar-daily-label {
  padding: clamp(4px, .5cqw, 5px) clamp(10px, 1.6cqw, 14px);
  border-radius: inherit;
  background: #fff4dd;
  color: #68381f;
  font: 700 clamp(10px, 1.6cqw, 12px)/1.35 var(--font-ui);
}
.calendar-daily:hover:not(:disabled) .calendar-daily-label { background: #fffaed; }
.calendar-daily:disabled { cursor: default; }
.calendar-menu summary::-webkit-details-marker { display:none; }
.calendar-menu-panel { position:absolute; top:calc(100% + 5px); right:0; width:228px; box-sizing:border-box; padding:10px; border:1px solid #dfbc7f; border-radius:16px; background:#fff3da; color:#68381f; box-shadow:0 12px 35px #160a0666; text-align:left; }
.calendar-menu-panel a,.calendar-menu-panel button { display:flex; align-items:center; min-height:44px; width:100%; box-sizing:border-box; padding:10px; color:inherit; background:none; border:0; border-radius:8px; text-decoration:none; font:500 13px/20px var(--font-ui); text-align:left; cursor:pointer; }
.calendar-menu-panel a:hover,.calendar-menu-panel button:hover { background:#f2dfbd; }
.calendar-account { padding:8px 10px 12px; margin:0; overflow-wrap:anywhere; color:#846443; font-size:11px; }
.calendar-window { position:absolute; padding:0; border:0; background:transparent; border-radius:36px 36px 0 0; cursor:pointer; -webkit-tap-highlight-color:#fff0d033; }
.calendar-window:disabled { cursor:default; }
.calendar-window:not(:disabled):hover { box-shadow:inset 0 0 18px #fff2ce70; }
.calendar-window:focus-visible,.calendar-daily:focus-visible,.calendar-brand-link:focus-visible,.calendar-menu summary:focus-visible,.calendar-menu-panel :focus-visible { outline:3px solid #2c624c; outline-offset:3px; }
.calendar-completed { position:absolute; right:7.7px; bottom:5.9px; width:12px; height:12px; pointer-events:none; }
.calendar-window.is-door .calendar-completed { right: 17px; bottom: 15px; }
.calendar-layout-desktop .calendar-window.is-door .calendar-completed { bottom: 26px; }
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

.calendar-layout {
  --title-gap: clamp(14px, 2.65cqw, 28px);
  --daily-gap: clamp(8px, 1.3cqw, 16px);
  --daily-hit-height: 44px;
  --copy-bottom: 10px;
  --stage-width: min(100cqw, clamp(393px, calc(16vw + 330px), 430px));
  --facade-height: calc(var(--stage-width) * 644 / 393);
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  overflow: clip;
}
/* The roof reserves space beneath the copy. The rest of the native canvas extends above it. */
.calendar-building { position: relative; flex: 1 0 var(--facade-height); }
.calendar-building .calendar-stage {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: var(--stage-width);
  transform: translateX(-50%);
  z-index: 1;
}
.calendar-mobile-stars {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: var(--stage-width);
  height: calc(var(--stage-width) * 193 / 393);
  pointer-events: none;
}
.calendar-mobile-stars img { position: absolute; height: 100%; width: auto; }
.calendar-mobile-stars img:first-child { left: 5.6%; }
.calendar-mobile-stars img:last-child { right: 5.6%; transform: scaleX(-1); }
.calendar-ground-front {
  position: absolute;
  inset: auto 0 0;
  height: min(14.25vw, 61px);
  pointer-events: none;
}
.calendar-ground-front img { display: block; width: 100%; height: 100%; max-width: none; }

/* The wide facade and its hit areas scale as one. The scenery uses the entire viewport. */
.calendar-layout-desktop {
  --title-width: clamp(360px, 51vw, 624px);
  --intro-size: clamp(15px, 1.4vw, 20px);
  --copy-top: clamp(26px, calc(84px - (100vw - 1024px) / 3), 84px);
  --copy-bottom: 18px;
  --copy-height: calc(var(--copy-top) + var(--title-width) * 89 / 624 + var(--title-gap)
    + var(--intro-size) * 1.45 + var(--daily-gap) + var(--daily-hit-height) + var(--copy-bottom));
  --stage-target-width: clamp(1040px, calc(50vw + 768px), 1440px);
  --stage-width: min(var(--stage-target-width), max(1040px, calc((100svh - var(--copy-height)) * 1440 / 649)));
  --facade-height: calc(var(--stage-width) * 649 / 1440);
  --scene-scale: calc(var(--stage-width) / 1440px);
  --side-space: calc((100cqw - var(--stage-width) * 524 / 1440) / 2);
  --tree-width: min(clamp(88px, calc(13vw + 43px), 235px), calc(var(--side-space) - 10px));
  --tree-center: min(clamp(50px, calc(28vw - 104px), 422px), calc(var(--side-space) - var(--tree-width) / 2 + 4px));
  --lantern-center: clamp(76px, calc(28vw - 78px), 325px);
  --curtain-width: clamp(65px, calc(24vw - 84px), 262px);
  --lantern-width: clamp(58px, 7vw, 100px);
}
@media (min-width: 2560px) {
  .calendar-layout-desktop { --stage-target-width: 2880px; }
}
.calendar-layout-desktop .calendar-canvas { width: 1440px; height: 811px; }
.calendar-layout-desktop .calendar-toolbar {
  top: 18px;
  left: clamp(16px, 4.5vw, 65px);
  right: clamp(16px, 3.15vw, 45px);
  transform: none;
  width: auto;
}
.calendar-layout-desktop .calendar-brand-link { width: clamp(128px, 13.34vw, 192px); }
.calendar-layout-desktop .calendar-menu summary { width: 48px; height: 48px; }
.calendar-layout-desktop .calendar-menu summary svg { width: 100%; height: 100%; }
.calendar-layout-desktop .calendar-copy { padding-top: var(--copy-top); }
.calendar-layout-desktop .calendar-intro { max-inline-size: 100%; font-size: var(--intro-size); line-height: 1.45; }
@media (orientation: portrait) {
  .calendar-layout-desktop { --copy-top: 84px; }
  .calendar-layout-desktop .calendar-toolbar { inset-inline: clamp(16px, 4.5vw, 65px); }
  .calendar-layout-desktop .calendar-brand-link {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: clamp(156px, 22vw, 192px);
  }
  .calendar-layout-desktop .calendar-menu { margin-left: auto; }
}
.calendar-page { container-type: inline-size; }
.calendar-fullbleed { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.calendar-fullbleed > img { position: absolute; max-width: none; }
.calendar-snowfall { position: absolute; inset: 0; pointer-events: none; width: 100%; height: 100%; object-fit: fill; }
.calendar-skyline { bottom: 23px; }
.calendar-skyline-left { left: clamp(-15px, calc(14vw - 141.6px), 75px); width: clamp(270px, 28.68vw, 480px); }
.calendar-skyline-right { right: clamp(-15px, calc(14vw - 149.6px), 75px); width: clamp(290px, 30.83vw, 516px); }
.calendar-ground-back { left: 0; width: 100%; height: clamp(90px, 12.36vw, 178px); bottom: 0; }
.calendar-lantern {
  position: absolute;
  top: 0;
  width: var(--lantern-width);
  padding-top: calc(var(--lantern-width) * .74 + clamp(0px, calc((1024px - 100cqw) * .12), 44px));
}
.calendar-lantern img { display: block; width: 100%; }
.calendar-lantern::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  bottom: calc(var(--lantern-width) * 2.15);
  width: 1px;
  background: #eeca8c;
}
.calendar-lantern-left { left: calc(var(--lantern-center) - var(--lantern-width) / 2); }
.calendar-lantern-right { right: calc(var(--lantern-center) - var(--lantern-width) / 2); }
.calendar-tree { bottom: calc(17px * var(--scene-scale)); width: var(--tree-width); }
.calendar-tree-left { left: calc(var(--tree-center) - var(--tree-width) / 2); }
.calendar-tree-right { right: calc(var(--tree-center) - var(--tree-width) / 2); }
.calendar-curtain { bottom: 0; height: 100%; width: var(--curtain-width); }
.calendar-curtain-left { left: 0; }
.calendar-curtain-right { right: 0; }
.calendar-layout-desktop .calendar-ground-front { z-index: 2; height: clamp(38px, 4.86vw, 70px); }
.calendar-layout-desktop .calendar-ground-front::after {
  content: "";
  position: absolute;
  inset: auto 0 -1px;
  height: 6px;
  background: #faf7ee;
}
.calendar-layout-desktop .calendar-today-outline { width:100%; height:100%; left:0; top:0; }
.calendar-layout-desktop .calendar-today-badge { left:calc(50% - 24px); }
.calendar-layout-desktop .calendar-notice { left:560px; }
</style>
