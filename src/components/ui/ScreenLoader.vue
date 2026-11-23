<script setup lang="ts">
import { ref, watch, type CSSProperties } from 'vue';
import { reportResourceFailure } from '../../utils/resource-diagnostics';
import snowflake from '../../assets/loading/snowflake.svg';
defineProps<{ label: string; theme: string; background?: string; backgroundLayer?: CSSProperties; error?: string }>();

const snowflakeFailed = ref(false);
function imageError(event: Event) {
  snowflakeFailed.value = true;
  reportResourceFailure('image', 'load', (event.currentTarget as HTMLImageElement).src);
}
const retryButton = ref<HTMLButtonElement | null>(null);
// Move focus to the recovery action once it replaces the loading message.
watch(retryButton, button => button?.focus({ preventScroll: true }), { flush: 'post' });
</script>

<template>
  <div class="screen-loader" :data-theme="theme" :style="background ? { background } : undefined">
    <div v-if="backgroundLayer" class="screen-loader-background" aria-hidden="true"><div :style="backgroundLayer" /></div>
    <div class="screen-loader-content">
      <img class="screen-loader-snowflake" :style="snowflakeFailed ? { opacity: 0 } : undefined" @error="imageError" :class="{ 'screen-loader-stopped': error }" :src="snowflake" width="75" height="76" alt="" />
      <p v-if="!error" class="screen-loader-label" role="status" aria-live="polite">{{ label }}</p>
      <div v-else class="screen-loader-error">
        <p role="alert">{{ error }}</p>
        <button ref="retryButton" type="button" @click="$emit('retry')">Попробовать снова</button>
      </div>
    </div>
  </div>
</template>
