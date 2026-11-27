<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import type { DecemberTaskEvents, DecemberTaskProps } from '../types/december';
import { guidingSky, guidingStars, guidingStarOverlay, guidingStarExhaustedText, guidingStarFoundText, guidingStarHints, guidingStarWishText } from '../content/guiding-star';
import { chooseGuidingStar, createGuidingStarProgress, guidingStarPhase, restoreGuidingStarProgress, serializeGuidingStarProgress, type GuidingStarResult } from '../utils/guiding-star';
const sky = new URL('../assets/dec-20/sky.png', import.meta.url).href;

const props = defineProps<DecemberTaskProps>();
const emit = defineEmits<DecemberTaskEvents>();
const starIds = guidingStars.map(star => star.id);
const progress = ref(createGuidingStarProgress('', starIds));
const skyElement = ref<HTMLDivElement>();
const skyScale = ref(1);
const loadedAssets = ref(new Set<string>());
const assetError = ref(false);
const assetRetry = ref(0);
const animatedStar = ref<string | null>(null);
const celebrating = ref(false);
const reducedMotion = ref(false);
const discoveryDurationMs = 1400;
let motionPreference: MediaQueryList | undefined;
function updateMotionPreference() {
  reducedMotion.value = motionPreference?.matches ?? false;
  if (reducedMotion.value) celebrating.value = false;
}
const storageWarning = ref(false);
const awaitingSave = ref(false);
const serverResult = computed<GuidingStarResult | null>(() => props.assignment?.status === 'completed'
  ? props.assignment.response?.response.search_exhausted === true ? 'exhausted' : 'wished'
  : null);
// A submitted result stays in memory while saving; only Supabase confirms completion.
const pendingResult = ref<GuidingStarResult | null>(null);
const phase = computed(() => serverResult.value ?? pendingResult.value ?? guidingStarPhase(progress.value));
const checked = computed(() => new Set(progress.value.checkedStars));
const winningStar = computed(() => checked.value.has(progress.value.targetStarId) ? progress.value.targetStarId : undefined);
const ready = computed(() => Boolean(props.assignment?.task) && !props.loading && !props.error);
const assetCount = 2;
const imagesReady = computed(() => loadedAssets.value.size === assetCount && !assetError.value);
const feedback = computed(() => {
  if (phase.value !== 'searching' || !progress.value.checkedStars.length) return '';
  return guidingStarHints[(progress.value.checkedStars.length - 1) % guidingStarHints.length];
});
const identity = computed(() => `${props.assignment?.user_id ?? ''}:${props.assignment?.task_id ?? 20}`);
const storageKey = computed(() => props.assignment?.task
  ? `advent:guiding-star:v1:${props.assignment.user_id}:${props.assignment.id}` : null);

function persist() {
  if (!storageKey.value) return;
  try { localStorage.setItem(storageKey.value, serializeGuidingStarProgress(progress.value)); }
  catch { storageWarning.value = true; }
}
function clearStoredSearch() {
  if (!storageKey.value) return;
  try { localStorage.removeItem(storageKey.value); }
  catch { storageWarning.value = true; }
}
function saveCompletion() {
  if (!ready.value || serverResult.value || !pendingResult.value || props.saving || awaitingSave.value) return;
  awaitingSave.value = true;
  emit('edit');
  emit('save', { response: pendingResult.value === 'wished' ? { wish_made: true } : { search_exhausted: true }, complete: true });
}

watch(storageKey, key => {
  animatedStar.value = null;
  celebrating.value = false;
  pendingResult.value = null;
  awaitingSave.value = false;
  storageWarning.value = false;
  progress.value = createGuidingStarProgress(identity.value, starIds);
  if (!key) return;
  if (serverResult.value) { clearStoredSearch(); return; }
  try { progress.value = restoreGuidingStarProgress(localStorage.getItem(key), identity.value, starIds); }
  catch { storageWarning.value = true; }
  persist();
}, { immediate: true });

watch([serverResult, ready, storageKey], ([result, isReady]) => {
  if (!result || !isReady) return;
  clearStoredSearch();
  celebrating.value = false;
  pendingResult.value = null;
  awaitingSave.value = false;
}, { immediate: true });
watch([() => props.saving, () => props.saveError], ([saving, error]) => {
  if (!saving || error) awaitingSave.value = false;
});
watch([phase, ready, storageKey], ([current, isReady]) => {
  if (isReady && current === 'exhausted' && !serverResult.value) {
    pendingResult.value = 'exhausted';
    saveCompletion();
  }
}, { immediate: true });
watch(celebrating, (active, _, onCleanup) => {
  if (!active) return;
  const timer = window.setTimeout(() => { celebrating.value = false; }, discoveryDurationMs);
  onCleanup(() => window.clearTimeout(timer));
});
watch(animatedStar, (id, _, onCleanup) => {
  if (!id) return;
  const timeout = window.setTimeout(() => { animatedStar.value = null; }, 480);
  onCleanup(() => window.clearTimeout(timeout));
});
watch(skyElement, (element, _, onCleanup) => {
  if (!element) return;
  const observer = new ResizeObserver(entries => {
    const width = entries[0]?.contentRect.width;
    if (width) skyScale.value = width / guidingSky.width;
  });
  observer.observe(element);
  onCleanup(() => observer.disconnect());
}, { flush: 'post' });

function syncStorage(event: StorageEvent) {
  if (event.key !== storageKey.value || !event.newValue || serverResult.value || pendingResult.value) return;
  const next = restoreGuidingStarProgress(event.newValue, identity.value, starIds);
  if (next.checkedStars.length < progress.value.checkedStars.length) return;
  progress.value = next;
}
onMounted(() => {
  window.addEventListener('storage', syncStorage);
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  updateMotionPreference();
  motionPreference.addEventListener?.('change', updateMotionPreference);
});
onBeforeUnmount(() => {
  window.removeEventListener('storage', syncStorage);
  motionPreference?.removeEventListener?.('change', updateMotionPreference);
});

function chooseStar(id: string) {
  if (!ready.value || !imagesReady.value || props.saving || phase.value !== 'searching') return;
  const next = chooseGuidingStar(progress.value, id, starIds);
  if (next === progress.value) return;
  celebrating.value = guidingStarPhase(next) === 'found' && !reducedMotion.value;
  progress.value = next;
  animatedStar.value = id;
  persist();
}
function confirmWish() {
  if (!ready.value || props.saving || celebrating.value || phase.value !== 'found') return;
  pendingResult.value = 'wished';
  saveCompletion();
}
function markLoaded(id: string) { loadedAssets.value.add(id); }
function retryAssets() { loadedAssets.value = new Set(); assetError.value = false; assetRetry.value++; }
function assetSource(src: string) { return assetRetry.value ? `${src}?retry=${assetRetry.value}` : src; }
</script>

<template>
  <DecemberTaskLayout v-if="phase === 'searching' || celebrating || !ready" :assignment="assignment" :day="day" :total="total" :loading="loading" :error="error"
    title="Путеводная звезда" @back="emit('back')" @retry="emit('retry')">
    <p class="guiding-poem"><em>Звезд на небе тьма.<br />Но попробуй отыскать<br />ту, что светит вам.</em></p>
    <div class="december-copy">
      <p>К картам Таро вы уже обращались, желание со снежинкой ГЕРОФАРМ тоже загадывали. Сегодня подключаем звёзды — пусть у задуманного будет ещё больше поддержки.</p>
      <p>Но одного желания порой недостаточно: важно еще понимать, куда двигаться, чтобы его осуществить. Когда-то звезды помогали морякам определять направление и держать курс. А мы предлагаем найти собственную путеводную звезду, которая напомнит о том, к чему хочется прийти в новом году.</p>
      <p>Посмотрите на небо: среди его звезд где-то спряталась ваша путеводная. Нажимайте на звезды, пока не найдете ее.</p>
    </div>
    <section class="guiding-search" :class="{ 'is-celebrating': celebrating }" :style="{ '--discovery-duration': `${discoveryDurationMs}ms` }" :data-phase="celebrating ? 'celebrating' : phase" :data-search-identity="identity" aria-label="Поиск путеводной звезды">
      <p class="guiding-instruction">{{ celebrating ? 'Ваша звезда засияла!' : 'Нажимайте на золотые звёзды. Каждую можно проверить один раз.' }}</p>
      <div ref="skyElement" class="guiding-sky" :aria-busy="!imagesReady && !assetError">
        <div class="guiding-sky-canvas" :style="{ transform: `scale(${skyScale})` }">
          <img :key="`sky:${assetRetry}`" class="guiding-sky-image" :src="assetSource(sky)" alt="Звёздное зимнее небо над облаками и силуэтами елей" width="313" height="557"
            @load="markLoaded('sky')" @error="assetError = true" />
          <img :key="`overlay:${assetRetry}`" class="guiding-stars-overlay" :src="assetSource(guidingStarOverlay)" alt="" aria-hidden="true" width="313" height="624"
            @load="markLoaded('stars')" @error="assetError = true" />
          <button v-for="(star, index) in guidingStars" :key="star.id" type="button" class="guiding-star"
            :data-star-id="star.id"
            :class="{ 'is-checked': checked.has(star.id), 'is-twinkling': animatedStar === star.id, 'is-guiding': winningStar === star.id }"
            :style="{ '--twinkle-delay': `${index % 6 * 70}ms`, left: `${star.x - 6 / skyScale}px`, top: `${star.y - 6 / skyScale}px`, width: `${star.width + 12 / skyScale}px`, height: `${star.height + 12 / skyScale}px` }"
            :aria-label="`Звезда ${star.id.slice(5)}${checked.has(star.id) ? ', уже проверена' : ''}`"
            :disabled="!imagesReady || saving || phase !== 'searching' || checked.has(star.id)" @click="chooseStar(star.id)">
            <span class="guiding-star-art" :style="{ left: `${6 / skyScale}px`, top: `${6 / skyScale}px`, width: `${star.width}px`, height: `${star.height}px` }">
              <img v-if="celebrating || animatedStar === star.id || winningStar === star.id" class="guiding-star-image" :src="assetSource(guidingStarOverlay)" :style="{ left: `${-star.x}px`, top: `${-star.y - 42}px` }" alt="" aria-hidden="true" width="313" height="624" />
            </span>
          </button>
        </div>
      </div>
      <p v-if="!imagesReady && !assetError" class="guiding-message" role="status">Загружаем звёздное небо…</p>
      <div v-if="assetError" class="december-stack guiding-message" role="alert">
        <p>Не удалось загрузить звёздное небо. Попробуйте ещё раз.</p>
        <button class="december-button secondary task-action" type="button" @click="retryAssets">Загрузить небо</button>
      </div>
      <p v-if="celebrating" class="guiding-message" role="status">Ваша путеводная звезда сияет!</p>
      <p v-if="phase === 'searching'" class="guiding-message" role="status">{{ feedback || 'Ваша звезда уже здесь. Найдите её!' }}</p>
      <p v-if="storageWarning" class="guiding-message" role="status">Браузер не разрешил сохранить поиск. Не закрывайте страницу до завершения.</p>
    </section>
  </DecemberTaskLayout>
  <DecemberTaskLayout v-else :assignment="assignment" :day="day" :total="total" :loading="loading" :error="error"
    title="" result @back="emit('back')" @retry="emit('retry')">
    <section class="guiding-result" aria-labelledby="guiding-result-title" role="status">
      <div class="guiding-dialog-star" :class="{ 'is-found': phase === 'found' }" aria-hidden="true">✦</div>
      <h2 id="guiding-result-title">{{ phase === 'exhausted' ? 'Поиски завершены' : phase === 'wished' ? 'Желание загадано!' : 'Ваша звезда найдена!' }}</h2>
      <p>{{ phase === 'exhausted' ? guidingStarExhaustedText : phase === 'wished' ? guidingStarWishText : guidingStarFoundText }}</p>
      <p v-if="(saving || awaitingSave) && pendingResult" class="guiding-message" role="status">Сохраняем результат…</p>
      <div v-if="saveError && pendingResult && !serverResult" class="guiding-message december-stack" role="alert">
        <p>{{ saveError }}</p>
        <button class="december-button secondary task-action" type="button" :disabled="saving || awaitingSave" @click="saveCompletion">Повторить сохранение</button>
      </div>
      <button v-if="phase === 'found'" class="december-button guiding-confirm task-action" type="button" :disabled="saving || awaitingSave" @click="confirmWish">Загадать желание</button>
    </section>
  </DecemberTaskLayout>
</template>

<style scoped>
:deep(h1) { max-width: 303px; }
.guiding-poem { margin-bottom: 24px; text-align: right; font-style: italic; font-synthesis: style; }
.guiding-search { margin-top: 22px; }
.guiding-instruction { color: var(--dec-red); font-size: 12px; line-height: 18px; }
.guiding-sky { position: relative; width: 100%; max-width: 480px; aspect-ratio: 313 / 557; margin: 16px auto 0; overflow: hidden; border-radius: 16px; background: linear-gradient(#001d2c, #001a2a 60%, #000c16); }
.guiding-sky-canvas { position: absolute; top: 0; left: 0; width: 313px; height: 557px; transform-origin: top left; }
.guiding-sky-image { position: absolute; top: 0; left: 0; display: block; }
.guiding-stars-overlay { position: absolute; top: -42px; left: 0; display: block; pointer-events: none; }
.guiding-star { position: absolute; display: block; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.guiding-star-art { position: absolute; display: block; overflow: hidden; pointer-events: none; }
.guiding-star-image { position: absolute; display: block; max-width: none; }
.guiding-star:disabled { cursor: default; }
.guiding-star.is-guiding .guiding-star-art { filter: drop-shadow(0 0 7px #ffe3a7); }
.guiding-star.is-twinkling .guiding-star-art { animation: guiding-star-twinkle 420ms ease-out; }
.guiding-star:hover:not(:disabled) .guiding-star-art { filter: drop-shadow(0 0 5px #ffe3a7); }
.guiding-star:focus-visible { outline: 2px solid #ffe3a7; outline-offset: 1px; }
.guiding-message { margin-top: 14px; font-size: 13px; line-height: 19px; }
.guiding-dialog-star { margin: 3px 0 18px; color: #c69b3c; font-size: 44px; line-height: 53px; text-align: center; }
.is-celebrating .guiding-star .guiding-star-art { animation: guiding-constellation 900ms ease-in-out var(--twinkle-delay) both; }
.is-celebrating .guiding-star.is-guiding { z-index: 1; }
.is-celebrating .guiding-star.is-guiding .guiding-star-art { animation: guiding-discovery var(--discovery-duration) ease-in-out both; }
.is-celebrating .guiding-star.is-guiding::after {
  content: ''; position: absolute; inset: -14px; border: 2px solid #ffe3a7; border-radius: 50%;
  background: radial-gradient(circle, #ffe3a766, transparent 70%); pointer-events: none;
  animation: guiding-discovery-halo var(--discovery-duration) ease-out both;
}
@keyframes guiding-constellation {
  0% { opacity: .3; transform: scale(.65); }
  45% { opacity: 1; transform: scale(1.35); filter: drop-shadow(0 0 8px #ffe3a7); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes guiding-discovery {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 7px #ffe3a7); }
  40% { transform: scale(2.2) rotate(15deg); filter: drop-shadow(0 0 18px #fff0c9); }
  70% { transform: scale(1.5) rotate(-5deg); filter: drop-shadow(0 0 12px #ffe3a7); }
}
@keyframes guiding-discovery-halo {
  0% { opacity: 0; transform: scale(.3); }
  25% { opacity: 1; }
  100% { opacity: 0; transform: scale(2); }
}
.guiding-dialog-star.is-found { animation: guiding-star-found 900ms cubic-bezier(.22, 1, .36, 1) both, guiding-star-glow 2s ease-in-out 900ms infinite; }
@keyframes guiding-star-found {
  0% { transform: scale(.25) rotate(-35deg); opacity: 0; }
  55% { transform: scale(1.4) rotate(12deg); opacity: 1; filter: drop-shadow(0 0 18px #e8b77e); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
@keyframes guiding-star-glow {
  0%, 100% { filter: drop-shadow(0 0 3px #e8b77e); }
  50% { filter: drop-shadow(0 0 12px #e8b77e); }
}
@keyframes guiding-star-twinkle {
  0%, 100% { transform: scale(1); }
  45% { transform: scale(1.35) rotate(12deg); filter: drop-shadow(0 0 10px #ffe3a7); }
}
@media (prefers-reduced-motion: reduce) { .guiding-star.is-twinkling .guiding-star-art, .guiding-dialog-star.is-found, .is-celebrating .guiding-star .guiding-star-art, .is-celebrating .guiding-star.is-guiding .guiding-star-art, .is-celebrating .guiding-star.is-guiding::after { animation: none; } }
@media (min-width: 700px) { .guiding-sky { max-width: min(480px, calc((100svh - 96px) * 313 / 557)); } :deep(h1) { max-width: none; } }

.guiding-result > p { margin-top: 24px; }
.guiding-confirm { margin-top: 24px; }
.guiding-result h2 { font-size: 28px; line-height: 32px; }
</style>
