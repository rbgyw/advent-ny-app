<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
const emit = defineEmits<{ close: [event: Event]; cancel: [event: Event] }>();
const element = ref<HTMLDialogElement>();
let previousFocus: HTMLElement | null = null;
let lastOutsideFocus: HTMLElement | null = null;
function rememberFocus(event: FocusEvent) {
  const target = event.target;
  if (target instanceof HTMLElement && target !== document.body && !element.value?.contains(target)) lastOutsideFocus = target;
}
onMounted(() => document.addEventListener('focusin', rememberFocus));
function showModal() {
  if (!element.value?.isConnected || element.value.open) return;
  previousFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : lastOutsideFocus;
  element.value.showModal();
}
function close() { if (element.value?.open) element.value.close(); }
function restoreFocus() { if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); previousFocus = null; }
function onClose(event: Event) { restoreFocus(); emit('close', event); }
onBeforeUnmount(() => { document.removeEventListener('focusin', rememberFocus); close(); restoreFocus(); });
defineExpose({ showModal, close, get open() { return element.value?.open ?? false; }, get isConnected() { return element.value?.isConnected ?? false; } });
</script>
<template><dialog ref="element" @close="onClose" @cancel="emit('cancel', $event)"><slot /></dialog></template>
