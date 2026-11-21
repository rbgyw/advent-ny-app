<script setup lang="ts">
defineProps<{ forId: string; label: string }>();
</script>
<template><div class="auth-field"><label :for="forId">{{ label }}</label><slot /></div></template>
