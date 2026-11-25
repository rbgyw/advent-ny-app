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
  --calendar-return-fill: #fcf6e8;
  display: block; box-sizing: border-box; width: 100%; min-width: 0; min-height: 52px; height: 52px;
  padding: 12px 16px; border: 1px solid #dcc8a8; border-radius: 13px;
  background: var(--calendar-return-fill); color: #a7280b; font: 700 14px/20px 'Advent Inter', sans-serif;
  letter-spacing: 0; text-align: center; text-decoration: none; overflow-wrap: anywhere; cursor: pointer;
}
button.calendar-return.calendar-return--filled { --calendar-return-fill: #a7280b; border-color: #a7280b; background: var(--calendar-return-fill); color: #fff0d2; }
button.calendar-return.calendar-return--header { width: auto; height: auto; min-height: 44px; padding: 0 8px; border: 0; border-radius: 0; background: transparent; color: #fff1cf; font-size: 12px; line-height: 16px; font-weight: 400; text-align: left; }
button.calendar-return.calendar-return:not(.calendar-return--header, .gratitude-calendar, .fortune-action, .tarot-button) { margin-top: 16px; }
button.calendar-return.calendar-return:not(.calendar-return--header, .fortune-action, .tarot-button):hover:not(:disabled) { background-color: var(--calendar-return-fill); filter: brightness(.94); }
button.calendar-return:disabled { opacity: .65; cursor: default; }
button.calendar-return:focus-visible { outline: 2px solid #623c28; outline-offset: 3px; }
</style>
