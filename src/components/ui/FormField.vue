<script setup lang="ts">
defineProps<{ forId: string; label: string }>();
</script>
<template><div class="auth-field"><label :for="forId">{{ label }}</label><slot /></div></template>

<style scoped>label { font-weight:700; line-height:17px; }</style>
