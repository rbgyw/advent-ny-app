<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CalendarTask } from '../types/models'
import { formatDate } from '../utils/date'
import { shortCalendarDate } from '../utils/calendar'
import { memorySubmissionOpen } from '../utils/memory'
import TaskAttachments from './TaskAttachments.vue'
import wordmark from '../assets/first-task/wordmark.svg'
import card from '../assets/memory/card.svg'
import textareaArt from '../assets/memory/textarea.svg'
import thankYou from '../assets/memory/thank-you.svg'

const props = defineProps<{
  assignment: CalendarTask | undefined
  day: number
  total: number
  userId: string | undefined
  modelValue: string
  loading: boolean
  saving: boolean
  error: string | null
  saveError: string | null
}>()
const emit = defineEmits<{
  back: []; retry: []; submit: []; edit: []
  busy: [busy: boolean]; 'update:modelValue': [value: string]
}>()
const gradient = ref<HTMLElement | null>(null)
const textarea = ref<HTMLTextAreaElement | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const attachmentsBusy = ref(false)
const validation = ref('')
const popupOpen = ref(false)
const now = ref(Date.now())
const ratio = ref(1477 / 393)
const completed = computed(() => props.assignment?.status === 'completed')
const closed = computed(() => !memorySubmissionOpen(props.assignment?.available_date, new Date(now.value)))
const busy = computed(() => props.saving || attachmentsBusy.value)
const date = computed(() => props.assignment ? shortCalendarDate(props.assignment.available_date).toLocaleUpperCase('ru-RU') : '3 ДЕКАБРЯ')
const gradientTransform = computed(() => `translate(-50%, -50%) matrix(1.8204429496, ${.4559142329 * ratio.value}, 3.0590994236, ${-1.8204429496 * ratio.value}, 0, 0)`)
let observer: ResizeObserver | undefined
let timer: ReturnType<typeof setInterval> | undefined
let previousOverflow: string | undefined
function cssUrl(url: string) { return `url("${url}")` }
function refreshClock() { now.value = Date.now() }
function input(event: Event) {
  validation.value = ''; emit('edit')
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
function setAttachmentsBusy(value: boolean) { attachmentsBusy.value = value; emit('busy', value) }
function submit() {
  refreshClock()
  if (busy.value || props.loading || !props.assignment?.task) return
  if (completed.value) { popupOpen.value = true; return }
  if (closed.value) { validation.value = 'Приём воспоминаний завершён 10 декабря.'; return }
  if (!props.modelValue.trim()) {
    validation.value = 'Расскажите о своём воспоминании перед отправкой.'
    textarea.value?.focus(); return
  }
  validation.value = ''; emit('submit')
}
function unlockScroll() {
  if (previousOverflow !== undefined) { document.documentElement.style.overflow = previousOverflow; previousOverflow = undefined }
}
watch(() => props.assignment?.id, () => { validation.value = ''; popupOpen.value = false; setAttachmentsBusy(false) })
watch(completed, (value, previous) => { if (value && previous === false) popupOpen.value = true })
watch(popupOpen, async value => {
  await nextTick()
  if (value) {
    if (previousOverflow === undefined) previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    if (!dialog.value?.open) dialog.value?.showModal()
  } else { dialog.value?.close(); unlockScroll() }
})
onMounted(() => {
  observer = new ResizeObserver(entries => {
    const size = entries[0]?.contentRect
    if (size?.width) ratio.value = size.height / size.width
  })
  if (gradient.value) observer.observe(gradient.value)
  timer = setInterval(refreshClock, 60_000)
  document.addEventListener('visibilitychange', refreshClock)
})
onBeforeUnmount(() => {
  observer?.disconnect(); clearInterval(timer)
  document.removeEventListener('visibilitychange', refreshClock)
  dialog.value?.close(); unlockScroll(); emit('busy', false)
})
</script>

<template>
  <main class="memory-page">
    <div ref="gradient" class="memory-background" aria-hidden="true"><div class="memory-gradient" :style="{ transform: gradientTransform }"></div></div>
    <div class="memory-layout">
      <header class="memory-header">
        <img class="memory-wordmark" :src="wordmark" alt="ГЕРОФАРМ" data-figma-node="39:14" />
        <button class="memory-back" type="button" @click="emit('back')">← К календарю</button>
      </header>
      <article class="memory-card" :style="{ '--card-art': cssUrl(card) }" aria-labelledby="memory-title" data-figma-node="28:40847">
        <p class="memory-date">{{ date }}</p>
        <h1 id="memory-title">Момент, который хочется сохранить</h1>
        <p v-if="loading" class="memory-notice" role="status">Загружаем задание…</p>
        <div v-else-if="error" class="memory-notice"><p role="alert">{{ error }}</p><button class="memory-button" type="button" @click="emit('retry')">Попробовать ещё раз</button></div>
        <p v-else-if="!assignment" class="memory-notice" role="status">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="memory-notice" role="status">Задание пока закрыто. Откроется {{ formatDate(assignment.available_date) }}.</p>
        <template v-else>
          <div class="memory-copy" data-figma-node="28:40850">
            <p>За год в ГЕРОФАРМ происходит столько событий: деловые встречи, совместные проекты, спортивные мероприятия и корпоративные праздники… Но иногда самые яркие воспоминания связаны с обычными рабочими днями: когда удалось справиться со сложной задачей, коллега поддержал в нужный момент или вы впервые приняли участие в спортивном мероприятии.</p>
            <p>Если вам есть чем поделиться, расскажите о своем самом ярком воспоминании или достижении в компании за этот год. Что произошло и почему этот момент остался с вами? Вы также можете поделиться своими фотографиями.</p>
            <p>В конце адвента мы соберем истории коллег и вспомним этот год вместе.</p>
          </div>
          <p id="memory-deadline" class="memory-deadline">*Принимаем воспоминания до 10 декабря. Это задание необязательное и не влияет на получение подарка.</p>
          <form class="memory-form" novalidate :aria-busy="busy" @submit.prevent="submit">
            <label for="memory-answer">Мое яркое воспоминание</label>
            <div class="memory-input" :style="{ '--textarea-art': cssUrl(textareaArt) }" data-figma-node="28:40852">
              <textarea id="memory-answer" ref="textarea" :value="modelValue" :readonly="completed || closed" :disabled="saving" aria-describedby="memory-deadline" placeholder="Что произошло и почему запомнилось?" @input="input"></textarea>
            </div>
            <TaskAttachments v-if="userId" :key="`${userId}:${assignment.task_id}`" :task-id="assignment.task_id" :readonly="completed" :disabled="saving || closed" variant="memory" @busy="setAttachmentsBusy" />
            <p v-if="validation || saveError" class="memory-error" role="alert">{{ validation || saveError }}</p>
            <p v-else-if="closed && !completed" class="memory-error" role="status">Приём воспоминаний завершён 10 декабря.</p>
            <button class="memory-button memory-share" type="submit" :disabled="busy || (closed && !completed)">{{ saving ? 'Отправляем…' : 'Поделиться историей' }}</button>
          </form>
        </template>
      </article>
      <footer class="memory-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
    <dialog ref="dialog" class="memory-thanks" :style="{ '--thank-you-art': cssUrl(thankYou) }" aria-labelledby="memory-thanks-title" aria-describedby="memory-thanks-copy" @close="popupOpen = false" @cancel="popupOpen = false">
      <button class="memory-close" type="button" aria-label="Закрыть окно благодарности" @click="popupOpen = false">×</button>
      <h2 id="memory-thanks-title">Спасибо,<br />что поделились!</h2>
      <p id="memory-thanks-copy">В конце адвента соберём воспоминания коллег в праздничную подборку.</p>
      <button class="memory-button memory-calendar" type="button" @click="popupOpen = false; emit('back')"><span>К календарю</span></button>
    </dialog>
  </main>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.ttf') format('truetype'); font-weight: 400 700; font-display: swap; }
@font-face { font-family: 'Advent Source Serif'; src: url('../assets/cipher/SourceSerif4.ttf') format('truetype'); font-weight: 200 900; font-display: swap; }
:global(#app:has(.memory-page)) { width: 100%; border: 0; }
.memory-page { position: relative; isolation: isolate; overflow: clip; box-sizing: border-box; width: 100%; min-height: 100svh; color-scheme: light; color: #623c28; background: #c63d0f; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; }
.memory-background { position: absolute; top: 0; left: 0; width: 100%; height: 127.0%; z-index: -1; overflow: hidden; pointer-events: none; }
.memory-gradient { position: absolute; top: 56.53241251%; left: 46.0559869%; width: 100%; aspect-ratio: 1; transform-origin: center; background: radial-gradient(circle closest-side at center, #ffb451 0%, #f78028 51.442307%, #c63d0f 100%); }
.memory-layout { position: relative; box-sizing: border-box; width: 100%; max-width: 960px; margin-inline: auto; padding: 0 clamp(0px, calc((100vw - 313px) / 2), 16px) 27px; }
.memory-header { position: relative; box-sizing: border-box; height: 94px; padding-top: 34px; }
.memory-wordmark { display: block; margin-inline: auto; }
.memory-back { display: flex; align-items: center; position: absolute; top: 48px; left: 0; min-height: 44px; padding: 0 8px; margin: 0; border: 0; background: transparent; color: #fff1cf; font: 400 12px/15px 'Advent Inter', sans-serif; cursor: pointer; }
.memory-card { position: relative; isolation: isolate; box-sizing: border-box; width: 100%; padding: 29px clamp(16px, calc((100vw - 345px) / 2), 24px) 28px; }
.memory-card::before { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; border: 24px solid transparent; border-image: var(--card-art) 24 fill / 24px stretch; }
.memory-date { margin: 0 0 14px; color: #a7280b; font-size: 12px; line-height: 15px; font-weight: 700; }
.memory-card h1 { margin: 0 0 21px; color: #623c28; font: 500 28px/30px 'Advent STIX', serif; letter-spacing: 0; }
.memory-copy { color: #836045; }
.memory-copy p { margin: 0 0 20px; }
.memory-deadline { margin: 0; color: #a7280b; font-size: 12px; line-height: 20px; }
.memory-form { margin-top: 19px; }
.memory-form > label { display: block; margin-bottom: 16px; color: #623c28; font: 500 20px/27px 'Advent Source Serif', serif; }
.memory-input { position: relative; min-height: 156px; }
.memory-input::before { content: ''; position: absolute; inset: -.5px; border: 14px solid transparent; border-image: var(--textarea-art) 14 fill / 14px stretch; pointer-events: none; }
.memory-input textarea { position: relative; display: block; box-sizing: border-box; width: 100%; height: 156px; min-height: 156px; padding: 12px 14px; border: 0; border-radius: 14px; background: transparent; color: #623c28; font: 400 13px/18px 'Advent Inter', sans-serif; resize: none; box-shadow: none; }
.memory-input textarea::placeholder { color: #947a62; opacity: 1; }
.memory-input textarea:disabled { opacity: .7; }
.memory-input textarea:focus-visible { outline: 1px solid #a7401d; outline-offset: 0; }
.memory-button { position: relative; left: 50%; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 313px; min-width: 313px; max-width: 313px; height: 52px; min-height: 52px; padding: 0 16px; margin-inline: 0; border: 0; border-radius: 13px; background: #a7280b; color: #fff7df; font: 700 14px/17px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: center; cursor: pointer; }
.memory-button:disabled { cursor: default; opacity: .65; -webkit-text-fill-color: currentColor; }
.memory-button:not(:disabled):hover { background: #962107; }
.memory-button:focus-visible, .memory-back:focus-visible, .memory-close:focus-visible { outline: 2px solid #623c28; outline-offset: 2px; }
.memory-share { margin-top: 12px; }
.memory-error { margin: 12px 0 0; color: #a7280b; font-size: 13px; line-height: 18px; overflow-wrap: anywhere; }
.memory-footer { margin-top: 27px; font-size: 12px; line-height: 15px; text-align: center; }
.memory-notice { min-height: 120px; margin: 0; color: #836045; overflow-wrap: anywhere; }
.memory-notice .memory-button { margin-top: 24px; }
.memory-thanks { position: fixed; isolation: isolate; box-sizing: border-box; top: clamp(16px, 17svh, 145px); left: 50%; transform: translateX(-50%); width: 345px; max-width: calc(100vw - 16px); max-height: calc(100svh - clamp(16px, 17svh, 145px) - 16px); margin: 0; padding: 44px clamp(16px, calc((100vw - 345px) / 2), 24px) 26px; border: 0; background: transparent; overflow-y: auto; color: #623c28; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; }
.memory-thanks::before { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; border: 23px solid transparent; border-image: var(--thank-you-art) 23 fill / 23px stretch; }
.memory-thanks::backdrop { background: rgb(66 35 19 / 55%); }
.memory-close { position: absolute; top: 0; right: 6px; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: #623c28; font: 400 25px/30px 'Advent Inter', sans-serif; cursor: pointer; }
.memory-thanks h2 { margin: 0 0 22px; color: #623c28; font: 500 24px/28px 'Advent STIX', serif; letter-spacing: 0; }
.memory-thanks > p { margin: 0; color: #836045; }
.memory-calendar { width: 297px; min-width: 297px; max-width: 297px; margin-top: 23px; }
.memory-calendar span { color: transparent; background-clip: text; background-image: linear-gradient(77.3594deg, #e8b77e .55732%, #ffe6bc 19.578%, #fff0d2 72.836%, #efc087 99.465%); }
@media (min-width: 768px) { .memory-layout { padding-inline: 32px; } .memory-card { padding-inline: 32px; } }
</style>
