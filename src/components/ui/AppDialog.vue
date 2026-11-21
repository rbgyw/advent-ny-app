<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
const emit = defineEmits<{ close: [event: Event]; cancel: [event: Event] }>();
const element = ref<HTMLDialogElement>();
let previousFocus: HTMLElement | null = null;
function showModal() {
  if (!element.value?.isConnected || element.value.open) return;
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  element.value.showModal();
}
function close() { if (element.value?.open) element.value.close(); }
function restoreFocus() { if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); previousFocus = null; }
function onClose(event: Event) { restoreFocus(); emit('close', event); }
onBeforeUnmount(() => { close(); restoreFocus(); });
defineExpose({ showModal, close, get open() { return element.value?.open ?? false; }, get isConnected() { return element.value?.isConnected ?? false; } });
</script>
<template><dialog ref="element" @close="onClose" @cancel="emit('cancel', $event)"><slot /></dialog></template>
