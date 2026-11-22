<script setup lang="ts">
import PageLayout from './PageLayout.vue';
defineProps<{ backgroundVariant?: 'warm' | 'night' }>();
</script>
<template><PageLayout :background-variant="backgroundVariant"><slot /></PageLayout></template>
