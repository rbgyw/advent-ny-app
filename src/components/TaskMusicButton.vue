<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import AppButton from './ui/AppButton.vue';
import defaultMusic from '../assets/cipher/winter-loop.mp3';

withDefaults(defineProps<{ src?: string }>(), { src: defaultMusic });

const audio = ref<HTMLAudioElement>();
const playing = ref(false);
const error = ref('');

async function toggleMusic() {
  if (!audio.value) return;
  error.value = '';
  if (!audio.value.paused) {
    audio.value.pause();
    return;
  }
  try {
    await audio.value.play();
  } catch {
    error.value = 'Не удалось включить музыку. Попробуйте ещё раз.';
  }
}

onBeforeUnmount(() => audio.value?.pause());
</script>

<template>
  <div class="task-music">
    <AppButton class="task-music-button" type="button" :aria-pressed="playing" @click="toggleMusic">
      <span aria-hidden="true">♫</span>
      {{ playing ? 'Выключить музыку' : 'Включить музыку' }}
    </AppButton>
    <audio ref="audio" :src="src" preload="none" loop
      @playing="playing = true" @pause="playing = false"
      @error="playing = false; error = 'Не удалось загрузить музыку.'" />
    <p v-if="error" class="task-music-error" role="status">{{ error }}</p>
  </div>
</template>

<style scoped>
.task-music-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-sizing: border-box;
  width: min(100%, 313px);
  min-height: 52px;
  margin-inline: auto;
  padding: 10px 16px;
  border: 0;
  border-radius: 13px;
  background: transparent url('../assets/cipher/imgVector1.svg') center / 100% 100% no-repeat;
  color: var(--color-action);
  font: 700 14px/17px var(--font-ui);
  text-align: center;
  cursor: pointer;
}
.task-music-button:focus-visible { outline: 2px solid var(--color-ink); outline-offset: 3px; }
.task-music-button:hover { filter: brightness(.96); }
.task-music-error { margin-top: 8px; color: var(--color-action); font-size: 13px; }
</style>
