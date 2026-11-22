import { ref, type CSSProperties } from 'vue';
export const navigationPending = ref(false);
export const navigationError = ref('');
export const navigationDestination = ref('');

export const screenPending = ref(true);
export const screenError = ref('');
export const screenBackground = ref('');

export const screenBackgroundLayer = ref<CSSProperties>();
