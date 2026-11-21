<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router';
import { navigationPending as navigating, navigationError, navigationDestination as destination } from './router/status';
import { usePageMotion } from './composables/usePageMotion';
import LoadingState from './components/ui/LoadingState.vue';
import FeedbackState from './components/ui/FeedbackState.vue';
import AppButton from './components/ui/AppButton.vue';
usePageMotion();
const router = useRouter();
function retry() { void router.push(destination.value).catch(() => {}); }
</script>
<template>
  <LoadingState v-if="navigating" compact class="route-status" label="Открываем страницу…" />
  <FeedbackState v-if="navigationError" kind="error" class="route-status"><p>{{ navigationError }}</p><AppButton variant="outline" @click="retry">Попробовать снова</AppButton></FeedbackState>
  <RouterView />
</template>
<style scoped>
.route-status { position:fixed; z-index:100; top:12px; left:50%; transform:translateX(-50%); width:max-content; max-width:calc(100% - 48px); padding:12px 16px; border-radius:var(--radius-control); background:var(--color-paper); color:var(--color-ink); box-shadow:0 4px 20px #29120926; font:14px/20px var(--font-ui); }
</style>
