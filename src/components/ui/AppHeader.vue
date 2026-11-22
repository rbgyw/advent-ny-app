<script setup lang="ts">
import AppButton from './AppButton.vue';
defineProps<{ wordmark?: string; variant?: 'task' }>();
defineEmits<{ back: [] }>();
</script>
<template>
  <header :class="{ 'task-header': variant === 'task' }">
    <slot name="brand"><img v-if="wordmark" decoding="async" :src="wordmark" alt="ГЕРОФАРМ" /></slot>
    <slot><AppButton type="button" @click="$emit('back')">← К календарю</AppButton></slot>
  </header>
</template>
<style scoped>
.task-header { position:relative; box-sizing:border-box; height:94px; padding-top:34px; }
.task-header img { display:block; margin:0 auto; }
.task-header button { position:absolute; top:48px; left:0; min-height:44px; padding:0 8px; border:0; background:transparent; color:#fff1cf; font:400 12px/15px var(--font-ui); cursor:pointer; }
</style>
