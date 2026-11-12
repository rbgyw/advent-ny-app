<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId } from 'vue';
import popupArt from '../assets/film/popup.svg';
import popupButton from '../assets/film/popup-button.svg';
import closeArt from '../assets/film/close.svg';

// Based on the existing December 12 popup artwork and layout.
defineProps<{ title: string; message: string; buttonText: string }>();
const emit = defineEmits<{ action: []; close: [] }>();
const dialog = ref<HTMLDialogElement>();
const id = useId();
const cssUrl = (url: string) => `url("${url}")`;
let previousOverflow: string | undefined;
let previousScroll = 0;
let disposed = false;
let requestedOpen = false;

function unlockScroll() {
  if (previousOverflow === undefined) return;
  document.documentElement.style.overflow = previousOverflow;
  previousOverflow = undefined;
  window.scrollTo({ top: previousScroll, behavior: 'instant' });
}

async function showModal() {
  requestedOpen = true;
  await nextTick();
  if (disposed || !requestedOpen || !dialog.value?.isConnected || dialog.value.open) return;
  dialog.value.showModal();
  previousOverflow = document.documentElement.style.overflow;
  previousScroll = window.scrollY;
  document.documentElement.style.overflow = 'hidden';
}

function close() {
  requestedOpen = false;
  dialog.value?.close();
  unlockScroll();
}

function onClose() {
  // A close event can arrive after the dialog has already been reopened.
  if (dialog.value?.open) return;
  requestedOpen = false;
  unlockScroll();
  emit('close');
}

function action() {
  close();
  emit('action');
}

onBeforeUnmount(() => { disposed = true; close(); });
defineExpose({ showModal, close });
</script>

<template>
  <dialog ref="dialog" class="advent-popup" :style="{ '--popup-art': cssUrl(popupArt) }" :aria-labelledby="`${id}-title`" :aria-describedby="`${id}-copy`" @close="onClose">
    <button class="advent-popup-close" type="button" aria-label="Закрыть окно" @click="close"><img :src="closeArt" alt="" /></button>
    <h2 :id="`${id}-title`">{{ title }}</h2>
    <p :id="`${id}-copy`" class="advent-popup-copy">{{ message }}</p>
    <button class="advent-popup-action" :style="{ backgroundImage: cssUrl(popupButton) }" type="button" @click="action">{{ buttonText }}</button>
  </dialog>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.ttf') format('truetype'); font-weight: 400 700; font-display: swap; }
.advent-popup { position: fixed; isolation: isolate; top: 50%; left: 50%; transform: translate(-50%, -50%); box-sizing: border-box; width: 345px; max-width: calc(100vw - 24px); max-height: calc(100svh - 32px); margin: 0; padding: 28px 24px; border: 0; border-radius: 23px; background: transparent; color: #623c28; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; overflow-y: auto; }
.advent-popup::before { content: ''; position: absolute; z-index: -1; inset: 0; border: 23px solid transparent; border-image: var(--popup-art) 23 fill / 23px stretch; pointer-events: none; }
.advent-popup::backdrop { background: rgb(66 35 19 / 55%); }
.advent-popup-close { position: absolute; top: 8px; right: 8px; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; }
.advent-popup-close img { display: block; }
.advent-popup h2 { margin: 0 32px 16px 0; color: #623c28; font: 600 26px/33px 'Advent STIX', serif; letter-spacing: 0; }
.advent-popup-copy { margin: 0; color: #836045; font-size: 14px; line-height: 20px; }
.advent-popup-action { margin-top: 26px; }
.advent-popup-action { display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 100%; min-height: 52px; padding: 12px; border: 0; border-radius: 13px; background: #a7280b center / 100% 100% no-repeat; color: #fff7df; font: 700 14px/17px 'Advent Inter', sans-serif; text-align: center; cursor: pointer; }
.advent-popup-action:hover { filter: brightness(1.08); }
.advent-popup button:focus-visible { outline: 2px solid #623c28; outline-offset: 2px; }
.advent-popup-close { cursor: pointer; }
.advent-popup :is(h2, p, button) { overflow-wrap: anywhere; }
@media (max-width: 360px) { .advent-popup { padding-inline: 20px; } }
</style>
