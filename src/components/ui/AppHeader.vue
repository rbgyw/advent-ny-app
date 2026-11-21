<script setup lang="ts">
defineProps<{ wordmark?: string }>();
defineEmits<{ back: [] }>();
</script>
<template>
  <header>
    <slot name="brand"><img v-if="wordmark" :src="wordmark" alt="ГЕРОФАРМ" /></slot>
    <slot><button type="button" @click="$emit('back')">← К календарю</button></slot>
  </header>
</template>
