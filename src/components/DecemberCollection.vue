<script setup lang="ts" generic="Item">
import { computed, onMounted, onUnmounted, ref, shallowRef, useId } from 'vue';

const props = defineProps<{
  title: string;
  filename: string;
  emptyMessage: string;
  parseItem: (value: unknown, source: URL) => Item;
}>();
const emit = defineEmits<{ ready: [] }>();
defineSlots<{
  default: (props: { item: Item }) => unknown;
  actions?: (props: { items: readonly Item[] }) => unknown;
}>();

const headingId = useId();
const items = shallowRef<Item[]>([]);
const index = ref(0);
const loading = ref(true);
const failed = ref(false);
const item = computed(() => items.value[index.value]);
const controller = new AbortController();

async function load() {
  loading.value = true;
  failed.value = false;
  try {
    const root = new URL(import.meta.env.BASE_URL, window.location.origin);
    const source = new URL('collections/' + props.filename, root);
    const response = await fetch(source, { signal: controller.signal, cache: 'no-cache' });
    if (!response.ok) throw new Error('Collection request failed');
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error('Expected an array');
    const parsed = data.map(value => props.parseItem(value, source));
    if (controller.signal.aborted) return;
    items.value = parsed;
    index.value = 0;
    if (parsed.length) emit('ready');
  } catch {
    if (!controller.signal.aborted) failed.value = true;
  } finally {
    if (!controller.signal.aborted) loading.value = false;
  }
}

function step(offset: number) {
  index.value = Math.min(items.value.length - 1, Math.max(0, index.value + offset));
}

onMounted(load);
onUnmounted(() => controller.abort());
</script>

<template>
  <section class="december-collection december-stack" :aria-labelledby="headingId" :aria-busy="loading">
    <h2 :id="headingId">{{ title }}</h2>
    <p v-if="loading" role="status">Загружаем подборку…</p>
    <div v-else-if="failed" class="december-panel">
      <p class="december-error" role="alert">Не удалось загрузить подборку.</p>
      <button class="december-link" type="button" @click="load">Попробовать ещё раз</button>
    </div>
    <p v-else-if="item === undefined" class="december-panel" role="status">{{ emptyMessage }}</p>
    <template v-else>
      <nav class="collection-navigation" :aria-label="title">
        <button type="button" :disabled="index === 0" aria-label="Предыдущая карточка" @click="step(-1)">←</button>
        <output aria-live="polite">{{ index + 1 }} из {{ items.length }}</output>
        <button type="button" :disabled="index === items.length - 1" aria-label="Следующая карточка" @click="step(1)">→</button>
      </nav>
      <article :key="index" class="collection-card">
        <slot :item="item" />
      </article>
      <slot name="actions" :items="items" />
    </template>
  </section>
</template>

<style scoped>
.december-collection { margin-top: 26px; }
.collection-navigation { display: flex; align-items: center; justify-content: space-between; margin-top: 9px; color: var(--dec-ink); }
.collection-navigation button {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--dec-border);
  border-radius: 12px;
  background: var(--dec-paper);
  color: var(--dec-red);
  font: 700 17px/1 'Advent Inter', sans-serif;
  cursor: pointer;
}
.collection-navigation button:disabled { color: #b6846d; cursor: default; }
.collection-card { min-width: 0; overflow: hidden; border: 1px solid var(--dec-border); border-radius: 15px; background: #fcf8ef; }
</style>
