<script setup lang="ts">
defineProps<{ backgroundVariant?: 'warm' | 'night' | 'calendar' }>();
</script>
<template>
  <main :class="backgroundVariant ? `page-background--${backgroundVariant}` : undefined"><slot /></main>
</template>
<style scoped>
.page-background--warm { background:var(--background-warm); }
.page-background--night { background:var(--background-night); }
.page-background--calendar { background:var(--background-calendar); }
</style>
