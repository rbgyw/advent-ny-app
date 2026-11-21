<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import LoadingState from './components/ui/LoadingState.vue';
import FeedbackState from './components/ui/FeedbackState.vue';
import AppButton from './components/ui/AppButton.vue';
const router = useRouter();
const navigating = ref(false), navigationError = ref(''), destination = ref('');
const removeBefore = router.beforeEach(to => { destination.value = to.fullPath; navigationError.value = ''; navigating.value = true; });
const removeAfter = router.afterEach(() => { navigating.value = false; });
const removeError = router.onError(() => { navigating.value = false; navigationError.value = 'Не удалось открыть страницу. Проверьте подключение.'; });
function retry() { void router.push(destination.value).catch(() => {}); }
onBeforeUnmount(() => { removeBefore(); removeAfter(); removeError(); });
</script>
<template>
  <LoadingState v-if="navigating" compact class="route-status" label="Открываем страницу…" />
  <FeedbackState v-if="navigationError" kind="error" class="route-status"><p>{{ navigationError }}</p><AppButton variant="outline" @click="retry">Попробовать снова</AppButton></FeedbackState>
  <RouterView />
</template>
<style scoped>
.route-status { position:fixed; z-index:100; top:12px; left:50%; transform:translateX(-50%); width:max-content; max-width:calc(100% - 48px); padding:12px 16px; border-radius:var(--radius-control); background:var(--color-paper); color:var(--color-ink); box-shadow:0 4px 20px #29120926; font:14px/20px var(--font-ui); }
</style>
