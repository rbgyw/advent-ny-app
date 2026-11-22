<script setup lang="ts">
withDefaults(defineProps<{ label?: string; compact?: boolean }>(), { label: 'Загружаем задание…', compact: false });
</script>
<template>
  <div class="ui-loading" :class="{ 'ui-loading--compact': compact }" role="status" aria-live="polite" aria-busy="true">
    <span>{{ label }}</span>
    <div v-if="!compact" class="ui-skeleton" aria-hidden="true"><i></i><i></i><i></i></div>
  </div>
</template>
<style scoped>
.ui-loading { min-height:140px; box-sizing:border-box; padding:var(--space-6); color:inherit; font:inherit; animation:loading-appear 0s .15s both; }
.ui-loading--compact { min-height:1.5em; padding:0; }
.ui-skeleton { display:grid; gap:var(--space-3); margin-top:var(--space-6); }
.ui-skeleton i { display:block; height:14px; border-radius:7px; background:currentColor; opacity:.12; }
.ui-skeleton i:last-child { width:65%; }
@keyframes loading-appear { from { visibility:hidden; } to { visibility:visible; } }
</style>
