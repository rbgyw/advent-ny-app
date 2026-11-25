<template><div class="task-container"><slot /></div></template>

<style scoped>
div.task-container {
  box-sizing: border-box; width: 100%; max-width: 760px; min-width: 0;
  margin-inline: auto; padding-inline: 16px;
}
@media (max-width: 360px) { div.task-container { padding-inline: 12px; } }
@media (min-width: 768px) { div.task-container { padding-inline: 32px; } }
</style>
