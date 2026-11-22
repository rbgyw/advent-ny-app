<script setup lang="ts">
import { shortCalendarDate } from '../../utils/calendar';

defineProps<{ availableDate?: string; day: number }>();
</script>

<template>
  <p data-task-date>
    <span v-if="!availableDate || Number(availableDate.slice(8, 10)) !== day">ОКОШКО {{ day }}<template v-if="availableDate"> · </template></span>
    <time v-if="availableDate" :datetime="availableDate">{{ shortCalendarDate(availableDate).toLocaleUpperCase('ru-RU') }}</time>
  </p>
</template>
