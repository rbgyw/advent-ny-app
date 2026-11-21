<script setup lang="ts">
withDefaults(defineProps<{ kind?: 'error' | 'empty' | 'success'; message?: string }>(), { kind: 'empty' });
</script>
<template><div :role="kind === 'error' ? 'alert' : 'status'"><slot>{{ message }}</slot><slot name="action" /></div></template>
