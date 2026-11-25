<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import VideoSwipeCard from './VideoSwipeCard.vue';
import { useVideoVoting } from '../composables/useVideoVoting';
import type { DecemberTaskProps } from '../types/december';
import brand from '../assets/dec-22/brand.svg';

const props = defineProps<DecemberTaskProps>();
const emit = defineEmits<{ back: []; retry: []; completed: [] }>();
const { videos, state, loading, busy, error, swipe, rankingOpen, current, ranking, load, vote, finishSwipe, refreshState } = useVideoVoting(props, () => emit('completed'));
const votedCount = computed(() => state.value?.votes.length ?? 0);
const likedCount = computed(() => state.value?.votes.filter(vote => vote.liked).length ?? 0);
const progress = computed(() => videos.value.length ? votedCount.value / videos.value.length * 100 : 0);
const top = computed(() => ranking.value.slice(0, 3));
const hasLikes = computed(() => state.value?.ranking.some(video => video.likes > 0));
function refreshOnFocus() { if (document.visibilityState !== 'hidden') void refreshState(); }
onMounted(() => {
  window.addEventListener('focus', refreshOnFocus);
  document.addEventListener('visibilitychange', refreshOnFocus);
});
onBeforeUnmount(() => {
  window.removeEventListener('focus', refreshOnFocus);
  document.removeEventListener('visibilitychange', refreshOnFocus);
});
</script>

<template>
  <DecemberTaskLayout v-bind="props" :brand-src="brand"
    :title="rankingOpen ? 'Топ-3 роликов' : 'Свет, камера, контент!'" @back="emit('back')" @retry="emit('retry')">
    <template v-if="rankingOpen">
      <p class="video-thanks" role="status">Спасибо! Ваши оценки учтены.</p>
      <p class="video-summary">Вам понравилось {{ likedCount }} из {{ state?.totalVideos ?? 0 }} видео.</p>
      <ol v-if="top.length" class="video-ranking" aria-label="Общий топ роликов по лайкам всех пользователей">
        <li v-for="(video, index) in top" :key="video.id" class="video-rank-row">
          <span class="video-rank-number">{{ index + 1 }}</span>
          <span class="video-rank-title">{{ video.title }}</span>
          <span class="video-rank-likes" :aria-label="`Лайков: ${video.likes}`">{{ video.likes }} <span aria-hidden="true">❤</span></span>
        </li>
      </ol>
      <p v-else class="video-no-likes" role="status">{{ hasLikes ? 'Рейтинг пока недоступен.' : 'Пока у роликов нет лайков. Топ появится, когда участники выберут понравившиеся видео.' }}</p>
      <div v-if="error" class="video-error" role="alert">
        <p>{{ error }}</p>
        <button class="december-link" type="button" :disabled="busy" @click="refreshState">Обновить рейтинг</button>
      </div>

    </template>
    <template v-else>
      <div class="december-copy video-intro">
        <p>Как выглядит жизнь ГЕРОФАРМ через камеру сотрудников? Участники «Мастерской контента» снимают видео о компании, своих командах и событиях, в которых участвуют сами.</p>
        <p>«Мастерская контента» — одно из направлений программы амбассадоров ГЕРОФАРМ. Сегодня смотрите работы участников и выбирайте ролики, которые понравились больше всего.</p>
        <p>Понравилось видео — нажмите кнопку «Понравилось», не очень — «Пропустить». По итогам голосования здесь появится тройка лидеров</p>
      </div>
      <p v-if="loading" class="video-loading" role="status">Загружаем ролики…</p>
      <template v-else-if="!error || state">
        <p class="video-counter" role="status">{{ videos.length ? `Видео ${Math.min(votedCount + 1, videos.length)} из ${videos.length}` : 'Видео скоро появятся' }}</p>
        <div class="video-progress" role="progressbar" aria-label="Оценено видео" :aria-valuenow="votedCount" :aria-valuemin="0" :aria-valuemax="videos.length || 1">
          <div :style="{ width: `${progress}%` }" />
        </div>
        <VideoSwipeCard :key="current?.id ?? 'placeholder'" :video="current" :busy="busy || !current" :swipe="swipe" class="video-deck" @vote="vote" @settled="finishSwipe" />
        <div class="video-choices" aria-label="Оценить ролик">
          <button class="december-button secondary" type="button" :disabled="busy || !current" @click="vote(false)">Пропустить</button>
          <button class="december-button secondary" type="button" :disabled="busy || !current" @click="vote(true)">Понравилось <span aria-hidden="true">❤</span></button>
        </div>
        <p v-if="busy && !swipe" class="video-saving" role="status">Сохраняем оценку…</p>
      </template>
      <div v-if="error" class="video-error" role="alert">
        <p>{{ error }}</p>
        <button v-if="!state" class="december-link" type="button" @click="load">Попробовать ещё раз</button>
      </div>

    </template>
  </DecemberTaskLayout>
</template>

<style scoped>
:deep(.december-card) { padding-top: 30px; }
:deep(.december-card:has(.video-summary)) { padding-bottom: 33px; }
:deep(.december-date) { margin-bottom: 13px; }
:deep(.december-content) { margin-top: 25px; }
:deep(h1) { max-width: 291px; }
.video-intro { width: 100%; }
.video-counter { margin-top: 22px; color: var(--dec-red); font-size: 12px; font-weight: 700; line-height: 15px; }
.video-progress { height: 7px; margin-top: 13px; overflow: hidden; border-radius: 4px; background: #ebd6b7; }
.video-progress > div { height: 100%; border-radius: inherit; background: var(--dec-red); transition: width 200ms ease; }
.video-deck { margin-top: 15px; }
.video-choices { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; margin-top: 14px; }
.video-choices button { min-width: 0; padding-inline: 6px; border-color: #dcc8a8; border-radius: 14px; background: #fff8e9; }
.video-choices button:disabled { opacity: .65; }
.video-calendar { margin-top: 10px; border-radius: 14px; }
.video-calendar span { color: transparent; background: var(--dec-gold); background-clip: text; }
.video-summary { margin-top: 8px; line-height: 20px; }
.video-ranking { display: grid; gap: 8px; padding: 0; margin: 25px 0 0; list-style: none; }
.video-rank-row { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 46px; box-sizing: border-box; padding: 10px; border: 1px solid #dcc8a8; border-radius: 14px; background: #fffaf0; }
.video-rank-number { color: var(--dec-red); font-weight: 700; }
.video-rank-title { color: var(--dec-ink); font-weight: 700; overflow-wrap: anywhere; }
.video-rank-likes { color: var(--dec-ink); font-size: 12px; white-space: nowrap; }
.video-ranking-back { margin-top: 37px; }
.video-no-likes { margin-top: 25px; }
.video-loading, .video-error, .video-saving { margin-top: 20px; }
.video-error { color: var(--dec-red); }
.video-saving { font-size: 12px; }
@media (min-width: 700px) {
  .video-deck, .video-progress, .video-counter, .video-choices { max-width: 400px; margin-inline: auto; }
}
@media (max-width: 359px) { .video-choices button { font-size: 12px; } }
@media (prefers-reduced-motion: reduce) { .video-progress > div { transition: none; } }
@media (min-width: 700px) { :deep(h1) { max-width: none; } }
</style>
