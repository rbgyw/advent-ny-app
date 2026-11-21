<script setup lang="ts">
import { computed } from 'vue';
import { getActivePinia } from 'pinia';
import { RouterView } from 'vue-router';
import { navigationPending, navigationError, navigationDestination, screenPending, screenError, screenBackground, screenBackgroundLayer } from './router/status';
import { usePageMotion } from './composables/usePageMotion';
import ScreenLoader from './components/ui/ScreenLoader.vue';
import ScreenReadyBoundary from './components/ui/ScreenReadyBoundary.vue';
usePageMotion();
const pinia = getActivePinia()!;
const task = computed(() => /^\/task\//.test(navigationDestination.value || location.pathname));
const theme = computed(() => {
  const path = navigationDestination.value || location.pathname;
  if (path.startsWith('/calendar')) return 'calendar';
  if (/^\/(?:[?#]|$)/.test(path) || path.startsWith('/rules')) return 'night';
  const day = Number(path.match(/^\/task\/(\d+)/)?.[1]);
  const assignment = pinia.state.value.calendar?.tasks?.find((item: { position: number }) => item.position === day);
  const number = Number(assignment?.task?.slug?.match(/^task-(\d+)$/)?.[1] ?? assignment?.task_id ?? day);
  return task.value && [4, 6, 7, 9, 11, 14, 17, 19, 21, 25].includes(number) ? 'night' : 'warm';
});
function retry() { window.location.reload(); }
</script>

<template>
  <ScreenLoader v-if="navigationPending || screenPending || navigationError || screenError"
    :label="task ? 'Загружаем задание...' : 'Открываем календарь...'"
    :theme="theme" :background="screenBackground" :background-layer="screenBackgroundLayer" :error="navigationError || screenError" @retry="retry" />
  <RouterView v-slot="{ Component, route }">
    <ScreenReadyBoundary v-if="Component" :key="route.fullPath" :destination="route.fullPath">
      <component :is="Component" />
    </ScreenReadyBoundary>
  </RouterView>
</template>
