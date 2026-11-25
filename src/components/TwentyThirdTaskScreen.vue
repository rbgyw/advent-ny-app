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
  const photo = collectionImage(item.photoUrl, source);
  if (!photo) throw new Error('Expected a designed memory card image');
  return { photo, alt: collectionText(item.photoAlt) || 'Воспоминание сотрудника ГЕРОФАРМ' };
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
            <p>В этом году в ГЕРОФАРМ было много событий, но для каждого он запомнился чем-то своим: новым проектом, личной победой, поддержкой коллег или участием в корпоративном мероприятии.</p>
            <p>В начале декабря вы присылали фотографии и рассказывали, какие моменты этого года вам особенно запомнились. Спасибо за ваши истории!</p>
            <p>Сегодня они собраны в карточках. Листайте и узнавайте, что происходило в разных командах и какие события стали важными для ваших коллег.</p>
    </div>
    <DecemberCollection title="Истории коллег" filename="memories.json" empty-message="Истории коллег пока не опубликованы."
      :parse-item="parseMemory" @ready="markViewed">
      <template #default="{ item }">
        <div class="memory-photo">
          <img v-if="item.photo && !brokenImages.has(item.photo)" :src="item.photo" :alt="item.alt"
            @error="brokenImages.add(item.photo)" />
          <p v-else>Место для фотографии</p>
        </div>

      </template>
    </DecemberCollection>
    <div class="memory-actions december-stack">
      <div v-if="saveError">
        <p class="december-error" role="alert">{{ saveError }}</p>
        <button class="december-link" type="button" :disabled="saving" @click="markViewed">Повторить сохранение прогресса</button>
      </div>

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
  min-height: 180px;
  overflow: hidden;
  background: url('../assets/dec-23/photo-placeholder.svg') center / cover no-repeat,
    linear-gradient(150deg, #7b210e, #a7280b 55%, #d25820);
  color: #ffe6bc;
  font-weight: 700;
  text-align: center;
}
.memory-photo img { display: block; width: 100%; height: auto; object-fit: contain; }
.memory-story { box-sizing: border-box; height: 192px; overflow-y: auto; padding: 20px 18px; color: #70492c; }
.memory-story:focus-visible { outline-offset: -3px; }
.memory-story h3 { margin: 0 0 10px; color: var(--dec-red); font: 700 14px/20px 'Advent Inter', sans-serif; }
.memory-story p { white-space: pre-line; }
.memory-actions { margin-top: 24px; }
@media (min-width: 700px) { :deep(h1) { max-width: none; } }
</style>
