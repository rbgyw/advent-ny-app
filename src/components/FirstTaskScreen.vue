<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CalendarTask } from '../types/models'
import { formatDate } from '../utils/date'
import { firstTaskPacks } from '../content/first-task'
import wordmark from '../assets/first-task/wordmark.svg'
import card from '../assets/first-task/card.svg'
import panel from '../assets/first-task/panel.svg'

defineProps<{
  assignment: CalendarTask | undefined
  loading: boolean
  error: string | null
  total: number
}>()
const emit = defineEmits<{ back: []; retry: [] }>()
const gradient = ref<HTMLElement | null>(null)
const gradientRatio = ref(1428 / 393)
// Inverse of the Figma radial gradient transform. Only the paint transforms;
// the content and the 313 × 52 px buttons remain in normal document flow.
const gradientTransform = computed(() =>
  `translate(-50%, -50%) matrix(1.8204429496, ${.4559142329 * gradientRatio.value}, 3.0590994236, ${-1.8204429496 * gradientRatio.value}, 0, 0)`,
)
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(entries => {
    const size = entries[0]?.contentRect
    if (size?.width) gradientRatio.value = size.height / size.width
  })
  if (gradient.value) observer.observe(gradient.value)
})
onBeforeUnmount(() => observer?.disconnect())
function cssUrl(url: string) { return `url("${url}")` }
</script>

<template>
  <main class="first-task-page">
    <div ref="gradient" class="first-task-background" aria-hidden="true">
      <div class="first-task-gradient" :style="{ transform: gradientTransform }"></div>
    </div>
    <div class="first-task-layout">
      <header class="first-task-header">
        <img class="first-task-wordmark" :src="wordmark" alt="ГЕРОФАРМ" data-figma-node="39:14" />
        <button type="button" class="first-task-back" @click="emit('back')">← К календарю</button>
      </header>

      <article class="first-task-card" :style="{ '--card-art': cssUrl(card) }" aria-labelledby="first-task-title" data-figma-node="28:39189">
        <p class="first-task-date">1 ДЕКАБРЯ</p>
        <h1 id="first-task-title">Праздник в каждую переписку</h1>

        <p v-if="loading" class="first-task-notice" role="status">Загружаем задание…</p>
        <div v-else-if="error" class="first-task-notice">
          <p role="alert">{{ error }}</p>
          <button class="first-task-button first-task-primary" type="button" @click="emit('retry')">Попробовать ещё раз</button>
        </div>
        <p v-else-if="!assignment" class="first-task-notice" role="status">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="first-task-notice" role="status">Задание пока закрыто. Откроется {{ formatDate(assignment.available_date) }}.</p>
        <template v-else>
          <div class="first-task-copy" data-figma-node="28:39192">
            <p>Новый год начинается с мелочей — например, с маленькой снежинки в сообщении коллеге.</p>
            <p>Для тех, кто активно пользуется Telegram и Max, мы подготовили праздничные стикеры ГЕРОФАРМ. Добавьте их в свои коллекции, чтобы делиться новогодним настроением в поздравлениях, переписке и постах. Для пользователей Telegram также доступен новогодний пак эмодзи.</p>
            <p>А если вы общаетесь на других площадках, пусть сегодняшнее окошко просто станет первым маленьким поводом почувствовать приближение праздника!</p>
          </div>
          <div class="first-task-panel" :style="{ '--panel-art': cssUrl(panel) }" data-figma-node="28:39193" aria-hidden="true"></div>
          <div class="first-task-actions" aria-label="Праздничные наборы">
            <template v-for="pack in firstTaskPacks" :key="pack.id">
              <a v-if="pack.href" :href="pack.href" target="_blank" rel="noopener noreferrer" class="first-task-button" :class="pack.primary ? 'first-task-primary' : 'first-task-secondary'">{{ pack.label }}</a>
              <button v-else type="button" class="first-task-button" :class="pack.primary ? 'first-task-primary' : 'first-task-secondary'" disabled>{{ pack.label }}</button>
            </template>
          </div>
        </template>
      </article>
      <footer class="first-task-footer">1 / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
  </main>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.ttf') format('truetype'); font-weight: 400 700; font-display: swap; }
:global(#app:has(.first-task-page)) { width: 100%; border: 0; }
.first-task-page { position: relative; isolation: isolate; overflow: clip; box-sizing: border-box; width: 100%; min-height: 100svh; color-scheme: light; color: #623c28; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; background: #c63d0f; }
.first-task-background { position: absolute; z-index: -1; top: 0; left: 0; width: 100%; height: 148.440748%; overflow: hidden; pointer-events: none; }
.first-task-gradient { position: absolute; top: 56.53241251%; left: 46.0559869%; width: 100%; aspect-ratio: 1; transform-origin: center; background: radial-gradient(circle closest-side at center, #ffb451 0%, #f78028 51.442307%, #c63d0f 100%); }
.first-task-layout { box-sizing: border-box; position: relative; width: 100%; max-width: 960px; margin-inline: auto; padding: 0 clamp(0px, calc((100vw - 313px) / 2), 16px) 31px; }
.first-task-header { box-sizing: border-box; position: relative; height: 94px; padding-top: 34px; }
.first-task-wordmark { display: block; margin-inline: auto; }
.first-task-back { display: flex; align-items: center; box-sizing: border-box; position: absolute; left: 0; top: 48px; min-height: 44px; margin: 0; padding: 0 8px; border: 0; background: transparent; color: #fff1cf; font: 400 12px/15px 'Advent Inter', sans-serif; cursor: pointer; }
.first-task-card { position: relative; isolation: isolate; box-sizing: border-box; width: 100%; padding: 29px clamp(16px, calc((100vw - 345px) / 2), 24px); border-radius: 24px; }
.first-task-card::before { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; border: 24px solid transparent; border-image: var(--card-art) 24 fill / 24px stretch; }
.first-task-date { margin: 0 0 14px; color: #a7280b; font-size: 12px; line-height: 15px; font-weight: 700; }
.first-task-card h1 { margin: 0 0 21px; color: #623c28; font: 500 28px/30px 'Advent STIX', serif; letter-spacing: 0; }
.first-task-copy { color: #836045; }
.first-task-copy p { margin: 0 0 20px; }
.first-task-copy p:last-child { margin-bottom: 0; }
.first-task-panel { position: relative; width: 100%; aspect-ratio: 313 / 78; margin-top: 27px; }
.first-task-panel::before { content: ''; position: absolute; inset: 0; pointer-events: none; border: 13px solid transparent; border-image: var(--panel-art) 13 fill / 13px stretch; }
.first-task-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 23px; }
.first-task-button { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; box-sizing: border-box; width: 313px; min-width: 313px; max-width: 313px; height: 52px; min-height: 52px; padding: 0 16px; margin: 0; border: 0; border-radius: 13px; font: 700 14px/17px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: center; text-decoration: none; white-space: nowrap; cursor: pointer; }
.first-task-primary { background: #a7280b; color: #fff7df; }
.first-task-secondary { background: #fffaf0; border: 1px solid #dcc8a8; color: #a7280b; }
.first-task-button:disabled { cursor: default; opacity: 1; -webkit-text-fill-color: currentColor; }
.first-task-primary:not(:disabled):hover { background: #962107; }
.first-task-secondary:not(:disabled):hover { background: #f8e8c8; }
.first-task-button:focus-visible, .first-task-back:focus-visible { outline: 2px solid #623c28; outline-offset: 4px; }
.first-task-notice { min-height: 120px; margin: 0; color: #836045; overflow-wrap: anywhere; }
.first-task-notice .first-task-button { display: flex; margin: 24px auto 0; }
.first-task-footer { margin-top: 26px; color: #623c28; font-size: 12px; line-height: 15px; text-align: center; }
@media (min-width: 768px) {
  .first-task-layout { padding-inline: 32px; }
  .first-task-card { padding-inline: 32px; }
}
</style>
