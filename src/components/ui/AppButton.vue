<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'plain' | 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
}>(), { variant: 'plain', loading: false, disabled: false });
</script>

<template>
  <button :type="type" :class="variant !== 'plain' ? ['ui-button', `ui-button--${variant}`] : undefined" :disabled="disabled || loading" :aria-busy="loading || undefined">
    <slot />
  </button>
</template>

<style scoped>
.ui-button { box-sizing:border-box; min-height:var(--control-height); padding:0 var(--space-4); border:1px solid transparent; border-radius:var(--radius-control); font:700 14px/20px var(--font-ui); cursor:pointer; }
.ui-button--primary { background:var(--color-action); color:var(--color-cream); }
.ui-button--outline { border-color:var(--color-action); background:var(--color-paper); color:var(--color-action); }
.ui-button--ghost { background:transparent; color:inherit; }
.ui-button:disabled { cursor:default; opacity:.65; }
.ui-button:focus-visible { outline:2px solid var(--color-ink); outline-offset:3px; }
</style>
