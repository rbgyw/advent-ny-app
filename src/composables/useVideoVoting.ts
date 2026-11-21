import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { videoVotingService } from '../services/video-voting.service';
import { rankedVideos, type AdventVideo, type VideoVotingState } from '../utils/video-voting';
import type { DecemberTaskProps } from '../types/december';

export function useVideoVoting(props: DecemberTaskProps, onComplete: () => void) {
  const videos = shallowRef<AdventVideo[]>([]);
  const state = shallowRef<VideoVotingState | null>(null);
  const loading = ref(false);
  const busy = ref(false);
  const error = ref('');
  const swipe = ref<'left' | 'right' | null>(null);
  const rankingOpen = ref(false);
  const votes = computed(() => new Map(state.value?.votes.map(vote => [vote.videoId, vote.liked])));
  const current = computed(() => videos.value.find(video => !votes.value.has(video.id)));
  const ranking = computed(() => rankedVideos(videos.value, state.value?.ranking ?? []));
  const ready = computed(() => Boolean(props.assignment?.task) && !props.loading && !props.error);
  const identity = computed(() => props.assignment ? `${props.assignment.user_id}:${props.assignment.id}` : '');
  let version = 0;
  let controller: AbortController | undefined;
  let swipeTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingState: VideoVotingState | null = null;

  function clearSwipe() {
    clearTimeout(swipeTimer);
    pendingState = null;
    swipe.value = null;
  }
  function validateCatalog(catalog: readonly AdventVideo[], result: VideoVotingState) {
    const published = new Set(result.ranking.map(video => video.videoId));
    if (catalog.length !== published.size || catalog.some(video => !published.has(video.id))) {
      throw new Error('Подборка обновляется. Попробуйте чуть позже.');
    }
  }
  async function load() {
    const request = ++version;
    controller?.abort();
    controller = new AbortController();
    clearSwipe();
    videos.value = [];
    state.value = null;
    busy.value = false;
    error.value = '';
    rankingOpen.value = false;
    loading.value = ready.value;
    const taskId = props.assignment?.task_id;
    if (!ready.value || taskId === undefined) return;
    try {
      const catalog = await videoVotingService.loadCatalog(controller.signal);
      if (request !== version) return;
      // No placeholder or not-yet-published card may cast a vote or complete the task.
      if (!catalog.length) { videos.value = []; return; }
      const result = await videoVotingService.loadState(taskId);
      if (request !== version) return;
      validateCatalog(catalog, result);
      videos.value = catalog;
      state.value = result;
      rankingOpen.value = result.complete;
    } catch (reason) {
      if (request !== version) return;
      error.value = reason instanceof Error && reason.message === 'Подборка обновляется. Попробуйте чуть позже.'
        ? reason.message : 'Не удалось загрузить голосование. Попробуйте ещё раз.';
    } finally {
      if (request === version) loading.value = false;
    }
  }
  function finishSwipe() {
    if (!pendingState) return;
    const next = pendingState;
    clearSwipe();
    state.value = next;
    busy.value = false;
    if (next.complete) { rankingOpen.value = true; onComplete(); }
  }
  async function vote(liked: boolean) {
    const video = current.value;
    const taskId = props.assignment?.task_id;
    if (!ready.value || !video || !state.value || taskId === undefined || busy.value || loading.value) return;
    const request = version;
    busy.value = true;
    error.value = '';
    try {
      const result = await videoVotingService.vote(taskId, video.id, liked);
      if (request !== version) return;
      validateCatalog(videos.value, result);
      pendingState = result;
      // A retry from another tab may return the original, immutable choice.
      swipe.value = result.votes.find(vote => vote.videoId === video.id)!.liked ? 'right' : 'left';
      swipeTimer = setTimeout(finishSwipe, 420);
    } catch {
      if (request !== version) return;
      busy.value = false;
      error.value = 'Не удалось сохранить оценку. Попробуйте ещё раз — карточка останется здесь.';
    }
  }
  async function refreshRanking() {
    const taskId = props.assignment?.task_id;
    if (!ready.value || taskId === undefined || busy.value || loading.value || !videos.value.length) return;
    const request = version;
    busy.value = true;
    error.value = '';
    try {
      const result = await videoVotingService.loadState(taskId);
      if (request !== version) return;
      validateCatalog(videos.value, result);
      state.value = result;
    } catch {
      if (request === version) error.value = 'Не удалось обновить рейтинг. Попробуйте ещё раз.';
    } finally { if (request === version) busy.value = false; }
  }
  watch([identity, ready], () => { void load(); }, { immediate: true });
  onBeforeUnmount(() => { version++; controller?.abort(); clearSwipe(); });
  return { videos, state, loading, busy, error, swipe, rankingOpen, votes, current, ranking, load, vote, finishSwipe, refreshRanking };
}
