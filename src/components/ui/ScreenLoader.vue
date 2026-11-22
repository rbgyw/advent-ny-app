<script setup lang="ts">
import type { CSSProperties } from 'vue';
import snowflake from '../../assets/loading/snowflake.svg';
defineProps<{ label: string; theme: string; background?: string; backgroundLayer?: CSSProperties; error?: string }>();
</script>

<template>
  <div class="screen-loader" :data-theme="theme" :style="background ? { background } : undefined">
    <div v-if="backgroundLayer" class="screen-loader-background" aria-hidden="true"><div :style="backgroundLayer" /></div>
    <div class="screen-loader-content">
      <img class="screen-loader-snowflake" :class="{ 'screen-loader-stopped': error }" :src="snowflake" width="75" height="76" alt="" />
      <p v-if="!error" class="screen-loader-label" role="status" aria-live="polite">{{ label }}</p>
      <div v-else class="screen-loader-error">
        <p role="alert">{{ error }}</p>
        <button type="button" @click="$emit('retry')">Попробовать снова</button>
      </div>
    </div>
  </div>
</template>
