<script setup lang="ts">
import { computed } from 'vue';
import { shortCalendarDate } from '../../utils/calendar';

const props = defineProps<{ availableDate?: string; day: number }>();
const labelDate = computed(() => props.availableDate
  ? props.availableDate.slice(0, 8) + String(props.day).padStart(2, '0')
  : undefined);
</script>

<template>
  <p v-if="labelDate" data-task-date>
    <time :datetime="labelDate">{{ shortCalendarDate(labelDate).toLocaleUpperCase('ru-RU') }}</time>
  </p>
</template>
