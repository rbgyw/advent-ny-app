<script setup lang="ts">
defineProps<{ backgroundVariant?: 'warm' | 'night' }>();
</script>
<template>
  <main :class="backgroundVariant ? `page-background--${backgroundVariant}` : undefined"><slot /></main>
</template>
<style scoped>
.page-background--warm { background:var(--background-warm); }
.page-background--night { background:var(--background-night); }
</style>
