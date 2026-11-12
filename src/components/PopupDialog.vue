<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { lockPopupScroll, unlockPopupScroll } from '../utils/popup-scroll';

// A native modal provides focus trapping, Escape and focus restoration.
// Slots and inherited attributes preserve each task's artwork and animations.
const model = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>();
const open = computed(() => model.value);
let disposed = false;
let requestedOpen = false;

async function showModal() {
  requestedOpen = true;
  model.value = true;
  await nextTick();
  const element = dialog.value;
  if (disposed || !requestedOpen || !element?.isConnected || element.open) return;
  lockPopupScroll(element);
  try {
    element.showModal();
  } catch (error) {
    unlockPopupScroll(element);
    requestedOpen = false;
    model.value = false;
    throw error;
  }
}

function close() {
  requestedOpen = false;
  model.value = false;
  if (!dialog.value) return;
  dialog.value.close();
  unlockPopupScroll(dialog.value);
}

function onClose() {
  // Ignore a queued close event if the same dialog was reopened meanwhile.
  if (dialog.value?.open) return;
  requestedOpen = false;
  model.value = false;
  if (dialog.value) unlockPopupScroll(dialog.value);
  emit('close');
}

watch(model, value => { if (value) void showModal(); else close(); }, { immediate: true });
onBeforeUnmount(() => { disposed = true; close(); });
defineExpose({ showModal, close, open });
</script>

<template>
  <dialog ref="dialog" @close="onClose"><slot /></dialog>
</template>
