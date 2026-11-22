<script setup lang="ts">
import { ref } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import DecemberCollection from './DecemberCollection.vue';
import television from '../assets/dec-24/christmas-movies.png';
import { collectionImage, collectionRecord, collectionText } from '../utils/collection';
import type { DecemberTaskProps, DecemberTaskEvents } from '../types/december';

const props = defineProps<DecemberTaskProps>();
const emit = defineEmits<Pick<DecemberTaskEvents, 'back' | 'retry' | 'save'>>();
const brokenImages = ref(new Set<string>());

function parseMovie(value: unknown, source: URL) {
  const item = collectionRecord(value);
  const title = collectionText(item.title);
  const year = item.year;
  if (!title || typeof year !== 'number' || !Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new Error('Expected a title and a four-digit year');
  }
  return {
    title,
    year,
    comment: collectionText(item.comment),
    image: collectionImage(item.imageUrl, source),
    alt: collectionText(item.imageAlt),
  };
}

function markViewed() {
  if (props.assignment?.status !== 'completed' && !props.saving) {
    emit('save', { response: { opened: true }, complete: true });
  }
}

function downloadMovies(items: readonly ReturnType<typeof parseMovie>[]) {
  const text = items.map(movie => [
    movie.title + ' (' + movie.year + ')',
    movie.comment,
  ].filter(Boolean).join('\r\n')).join('\r\n\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Киноподборка ГЕРОФАРМ.txt';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<template>
  <DecemberTaskLayout v-bind="props" title="Киноподборка от сотрудников ГЕРОФАРМ"
    @back="emit('back')" @retry="emit('retry')">
    <img class="movie-television" :src="television" width="550" height="460" alt="Ретро-телевизор с надписью Christmas Movies" />
    <div class="december-copy">
      <p>До Нового года осталась ровно неделя — пора выбирать не только подарки и рецепты, но и кино для праздничных вечеров!</p>
      <p>Помните, мы предлагали вам поделиться фильмами, которые стоит посмотреть каждому? Мы получили множество рекомендаций и составили из них интересную и многогранную подборку. Сегодня делимся любимыми праздничными фильмами от сотрудников ГЕРОФАРМ.</p>
      <p>Листайте карточки, выбирайте фильм по душе и сохраняйте подборку на каникулы!</p>
    </div>
    <DecemberCollection title="Фильмы от коллег" filename="movies.json" empty-message="Киноподборка пока не опубликована."
      :parse-item="parseMovie" @ready="markViewed">
      <template #default="{ item }">
        <img v-if="item.image && !brokenImages.has(item.image)" class="movie-image" :src="item.image" :alt="item.alt"
          @error="brokenImages.add(item.image)" />
        <div class="movie-details">
          <h3>{{ item.title }}</h3>
          <p class="movie-year">{{ item.year }} год</p>
          <template v-if="item.comment">
            <p class="movie-note">Совет коллеги</p>
            <p class="movie-comment">{{ item.comment }}</p>
          </template>
        </div>
      </template>
      <template #actions="{ items }">
        <button class="december-button secondary" type="button" @click="downloadMovies(items)">Сохранить подборку</button>
      </template>
    </DecemberCollection>
    <div class="movie-actions december-stack">
      <div v-if="saveError">
        <p class="december-error" role="alert">{{ saveError }}</p>
        <button class="december-link" type="button" :disabled="saving" @click="markViewed">Повторить сохранение прогресса</button>
      </div>
      <button class="december-button" type="button" @click="emit('back')">К календарю</button>
    </div>
  </DecemberTaskLayout>
</template>

<style scoped>
@media (min-width: 380px) and (max-width: 699px) {
  :deep(h1) { width: calc(100% + 17px); }
}
.movie-television { display: block; width: 100%; height: auto; margin-bottom: 26px; }
.movie-image { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.movie-details { padding: 18px; color: #70492c; }
.movie-details h3 { margin: 0 0 6px; color: var(--dec-ink); font: 400 20px/24px 'Advent Inter', sans-serif; }
.movie-year { font-size: 12px; }
.movie-note { margin-top: 14px; color: var(--dec-red); font-size: 12px; font-weight: 700; }
.movie-comment { margin-top: 4px; white-space: pre-line; }
.movie-actions { margin-top: 24px; }
</style>
