<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { lockPopupScroll, unlockPopupScroll } from '../utils/popup-scroll';

// A native modal provides focus trapping, Escape and focus restoration.
// Slots and inherited attributes preserve each task's artwork and animations.
const model = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>();
const open = computed(() => model.value);
let previousFocus: HTMLElement | null = null;
let lastOutsideFocus: HTMLElement | null = null;
function rememberFocus(event: FocusEvent) {
  if (event.target instanceof HTMLElement && event.target !== document.body && !dialog.value?.contains(event.target)) lastOutsideFocus = event.target;
}
function restoreFocus() { if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); previousFocus = null; }
onMounted(() => document.addEventListener('focusin', rememberFocus));
let disposed = false;
let requestedOpen = false;

async function showModal() {
  requestedOpen = true;
  model.value = true;
  await nextTick();
  const element = dialog.value;
  if (disposed || !requestedOpen || !element?.isConnected || element.open) return;
  previousFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : lastOutsideFocus;
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
  restoreFocus();
  emit('close');
}

watch(model, value => { if (value) void showModal(); else close(); }, { immediate: true });
onBeforeUnmount(() => { disposed = true; close(); restoreFocus(); document.removeEventListener('focusin', rememberFocus); });
defineExpose({ showModal, close, open });
</script>

<template>
  <dialog ref="dialog" @close="onClose"><slot /></dialog>
</template>
