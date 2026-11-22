<script setup lang="ts">
import { ref } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import DecemberCollection from './DecemberCollection.vue';
import { collectionImage, collectionRecord, collectionText } from '../utils/collection';
import type { DecemberTaskProps, DecemberTaskEvents } from '../types/december';

const props = defineProps<DecemberTaskProps>();
const emit = defineEmits<Pick<DecemberTaskEvents, 'back' | 'retry' | 'save'>>();
const brokenImages = ref(new Set<string>());

function parseMemory(value: unknown, source: URL) {
  const item = collectionRecord(value);
  const name = collectionText(item.name);
  const text = collectionText(item.text);
  if (!name || !text) throw new Error('Expected a name and a story');
  return {
    name,
    text,
    photo: collectionImage(item.photoUrl, source),
    alt: collectionText(item.photoAlt),
  };
}

function markViewed() {
  if (props.assignment?.status !== 'completed' && !props.saving) {
    emit('save', { response: { opened: true }, complete: true });
  }
}
</script>

<template>
  <DecemberTaskLayout v-bind="props" title="Этот год запомнится нам"
    @back="emit('back')" @retry="emit('retry')">
    <div class="december-copy">
      <p>В этом году в ГЕРОФАРМ было много событий, но для каждого он запомнился чем-то своим: новым проектом, личной победой, поддержкой коллег или первым участием в корпоративном мероприятии.</p>
      <p>В начале декабря мы предложили вам поделиться такими моментами. Спасибо за ваши истории! Сегодня предлагаем узнать, какие события стали особенными для сотрудников ГЕРОФАРМ.</p>
      <p>Листайте карточки с воспоминаниями коллег — давайте еще раз порадуемся тому, сколько всего произошло за этот год.</p>
    </div>
    <DecemberCollection title="Истории коллег" filename="memories.json" empty-message="Истории коллег пока не опубликованы."
      :parse-item="parseMemory" @ready="markViewed">
      <template #default="{ item }">
        <div class="memory-photo">
          <img v-if="item.photo && !brokenImages.has(item.photo)" :src="item.photo" :alt="item.alt"
            @error="brokenImages.add(item.photo)" />
          <p v-else>Место для фотографии</p>
        </div>
        <div class="memory-story" tabindex="0" :aria-label="'История: ' + item.name">
          <h3>{{ item.name }}</h3>
          <p>{{ item.text }}</p>
        </div>
      </template>
    </DecemberCollection>
    <div class="memory-actions december-stack">
      <div v-if="saveError">
        <p class="december-error" role="alert">{{ saveError }}</p>
        <button class="december-link" type="button" :disabled="saving" @click="markViewed">Повторить сохранение прогресса</button>
      </div>
      <button class="december-button" type="button" @click="emit('back')">К календарю</button>
    </div>
  </DecemberTaskLayout>
</template>

<style scoped>
:deep(h1) { max-width: 292px; }
.memory-photo {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: url('../assets/dec-23/photo-placeholder.svg') center / cover no-repeat,
    linear-gradient(150deg, #7b210e, #a7280b 55%, #d25820);
  color: #ffe6bc;
  font-weight: 700;
  text-align: center;
}
.memory-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.memory-story { box-sizing: border-box; height: 192px; overflow-y: auto; padding: 20px 18px; color: #70492c; }
.memory-story:focus-visible { outline-offset: -3px; }
.memory-story h3 { margin: 0 0 10px; color: var(--dec-red); font: 700 14px/20px 'Advent Inter', sans-serif; }
.memory-story p { white-space: pre-line; }
.memory-actions { margin-top: 24px; }
</style>
