<script setup lang="ts">
import AppHeader from './AppHeader.vue';
import AppCard from './AppCard.vue';
import TaskLayout from './TaskLayout.vue';
import LoadingState from './LoadingState.vue';
import wordmark from '../../assets/wish/wordmark.svg';
defineEmits<{ back: [] }>();
</script>
<template>
  <TaskLayout background-variant="warm" class="task-loading-page">
    <div class="task-loading-layout">
      <AppHeader variant="task" :wordmark="wordmark" @back="$emit('back')" />
      <AppCard class="task-loading-card"><LoadingState /></AppCard>
    </div>
  </TaskLayout>
</template>
<style scoped>
.task-loading-page { min-height:100svh; color:var(--color-ink); font:14px/20px var(--font-ui); color-scheme:light; }
.task-loading-layout { max-width:393px; box-sizing:border-box; padding:0 16px 26px; margin:0 auto; }
.task-loading-card { min-height:560px; border-radius:var(--radius-card); background:var(--color-paper); }
</style>
