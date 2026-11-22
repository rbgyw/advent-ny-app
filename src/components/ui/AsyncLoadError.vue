<script setup lang="ts">
import AppButton from './AppButton.vue';
import FeedbackState from './FeedbackState.vue';
function reload() { window.location.reload(); }
</script>
<template><FeedbackState kind="error" class="async-error"><p>Не удалось загрузить экран. Проверьте подключение.</p><AppButton variant="outline" @click="reload">Загрузить снова</AppButton></FeedbackState></template>
<style scoped>.async-error { padding:var(--space-6); color:var(--color-ink); background:var(--color-paper); min-height:140px; }.async-error p { margin-bottom:var(--space-4); }</style>
