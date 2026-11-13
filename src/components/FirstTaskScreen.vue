<script setup lang="ts">
import type { CalendarTask } from '../types/models'
import { formatDate } from '../utils/date'
import { firstTaskPacks } from '../content/first-task'
import wordmark from '../assets/first-task/wordmark.svg'
import card from '../assets/first-task/card.svg'
import panel from '../assets/first-task/panel.svg'
import emojiPreview from '../assets/first-task/emoji-preview.png'

defineProps<{
  assignment: CalendarTask | undefined
  loading: boolean
  error: string | null
  total: number
}>()
const emit = defineEmits<{ back: []; retry: [] }>()
function cssUrl(url: string) { return `url("${url}")` }
</script>

<template>
  <main class="first-task-page">
    <div class="first-task-layout">
      <header class="first-task-header">
        <img class="first-task-wordmark" :src="wordmark" alt="ГЕРОФАРМ" data-figma-node="39:14" />
        <button type="button" class="first-task-back" @click="emit('back')">← К календарю</button>
      </header>

      <article class="first-task-card" :style="{ '--card-art': cssUrl(card) }" aria-labelledby="first-task-title" data-figma-node="91:20">
        <p class="first-task-date">1 ДЕКАБРЯ</p>
        <h1 id="first-task-title">Праздник к нам приходит</h1>

        <p v-if="loading" class="first-task-notice" role="status">Загружаем задание…</p>
        <div v-else-if="error" class="first-task-notice">
          <p role="alert">{{ error }}</p>
          <button class="first-task-button first-task-primary" type="button" @click="emit('retry')">Попробовать ещё раз</button>
        </div>
        <p v-else-if="!assignment" class="first-task-notice" role="status">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="first-task-notice" role="status">Задание пока закрыто. Откроется {{ formatDate(assignment.available_date) }}.</p>
        <template v-else>
          <div class="first-task-copy" data-figma-node="91:23">
            <p>Новый год начинается с мелочей — например, с маленькой снежинки в сообщении коллеге.</p>
            <p>Для тех, кто активно пользуется Telegram и Max, мы подготовили праздничные стикеры ГЕРОФАРМ. Добавьте их в свои коллекции, чтобы делиться новогодним настроением в поздравлениях, переписке и постах. Для пользователей Telegram также доступен новогодний пак эмодзи.</p>
            <p>А если вы общаетесь на других площадках, пусть сегодняшнее окошко просто станет первым маленьким поводом почувствовать приближение праздника!</p>
          </div>
          <div class="first-task-panel" :style="{ '--panel-art': cssUrl(panel) }" data-figma-node="91:24"><img :src="emojiPreview" alt="Праздничные эмодзи ГЕРОФАРМ" width="282" height="78" /></div>
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
.first-task-page { position: relative; isolation: isolate; overflow: clip; box-sizing: border-box; width: 100%; min-height: 100svh; color-scheme: light; color: #623c28; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; background: #c63d0f url('../assets/first-task/background.svg') center top / 393px 962px repeat-x; }
.first-task-layout { box-sizing: border-box; position: relative; width: 100%; max-width: 393px; margin-inline: auto; padding: 0 clamp(0px, calc((100vw - 313px) / 2), 16px) 31px; }
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
.first-task-panel img { position: relative; display: block; margin-inline: auto; max-width: 100%; height: auto; object-fit: contain; }
.first-task-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 23px; }
.first-task-button { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; box-sizing: border-box; width: 100%; min-width: 0; max-width: 313px; height: 52px; min-height: 52px; padding: 0 16px; margin: 0; border: 0; border-radius: 13px; font: 700 14px/17px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: center; text-decoration: none; white-space: nowrap; cursor: pointer; }
.first-task-primary { background: #a7280b; color: #fff7df; }
.first-task-secondary { background: #fffaf0; border: 1px solid #dcc8a8; color: #a7280b; }
.first-task-button:disabled { cursor: default; opacity: 1; -webkit-text-fill-color: currentColor; }
.first-task-primary:not(:disabled):hover { background: #962107; }
.first-task-secondary:not(:disabled):hover { background: #f8e8c8; }
.first-task-button:focus-visible, .first-task-back:focus-visible { outline: 2px solid #623c28; outline-offset: 4px; }
.first-task-notice { min-height: 120px; margin: 0; color: #836045; overflow-wrap: anywhere; }
.first-task-notice .first-task-button { display: flex; margin: 24px auto 0; }
.first-task-footer { margin-top: 26px; color: #623c28; font-size: 12px; line-height: 15px; text-align: center; }
</style>
