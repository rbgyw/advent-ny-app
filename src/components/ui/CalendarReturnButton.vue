<script setup lang="ts">
withDefaults(defineProps<{ completed?: boolean; placement?: 'content' | 'header'; disabled?: boolean }>(), {
  completed: false, placement: 'content', disabled: false,
});
</script>

<template>
  <button type="button" class="calendar-return" :class="{ 'calendar-return--filled': completed, 'calendar-return--header': placement === 'header' }" :disabled="disabled">
    <span v-if="placement === 'header'" aria-hidden="true">← </span>К календарю
  </button>
</template>

<style scoped>
button.calendar-return.calendar-return {
  display: block; box-sizing: border-box; width: 100%; min-width: 0; min-height: 52px; height: auto;
  padding: 12px 16px; border: 1px solid #dcc8a8; border-radius: 13px;
  background: #fcf6e8; color: #a7280b; font: 700 14px/20px 'Advent Inter', sans-serif;
  letter-spacing: 0; text-align: center; text-decoration: none; overflow-wrap: anywhere; cursor: pointer;
}
button.calendar-return.calendar-return--filled { border-color: #a7280b; background: #a7280b; color: #fff0d2; }
button.calendar-return.calendar-return--header { width: auto; min-height: 44px; padding: 0 8px; border: 0; border-radius: 0; background: transparent; color: #fff1cf; font-size: 12px; line-height: 16px; font-weight: 400; text-align: left; }
button.calendar-return:hover:not(:disabled) { filter: brightness(.96); }
button.calendar-return:disabled { opacity: .65; cursor: default; }
button.calendar-return:focus-visible { outline: 2px solid #623c28; outline-offset: 3px; }
</style>
