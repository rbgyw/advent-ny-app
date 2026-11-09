<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CalendarTask } from '../types/models'
import { formatDate } from '../utils/date'
import { shortCalendarDate } from '../utils/calendar'
import { CIPHER_LETTERS, cipherLettersFromText, isCipherSolution } from '../utils/cipher'
import { cipherAlphabet, cipherFigures } from '../content/cipher-art'
import { cipherMusicUrl } from '../content/cipher'
import wordmark from '../assets/first-task/wordmark.svg'
import card from '../assets/cipher/imgVector.svg'
import musicButton from '../assets/cipher/imgVector1.svg'
import alphabetFrame from '../assets/cipher/imgFrame.svg'
import cell from '../assets/cipher/imgVector2.svg'
import cellVariant from '../assets/cipher/imgVector3.svg'
import successCard from '../assets/cipher/success-card.svg'
import gift from '../assets/cipher/gift-placeholder.svg'

const props = defineProps<{
  assignment: CalendarTask | undefined
  day: number
  total: number
  loading: boolean
  saving: boolean
  error: string | null
  saveError: string | null
}>()
const emit = defineEmits<{ back: []; retry: []; submit: [letters: string[]]; edit: [] }>()
const letters = ref<string[]>(Array(15).fill(''))
const inputs = ref<HTMLInputElement[]>([])
const incorrect = ref(false)
const popupOpen = ref(false)
const dialog = ref<HTMLDialogElement | null>(null)
const gradient = ref<HTMLElement | null>(null)
const board = ref<HTMLElement | null>(null)
const message = ref<HTMLElement | null>(null)
const audio = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const musicError = ref('')
const ratio = ref(1452 / 393)
const boardScale = ref(1)
const messageScale = ref(1)
const completed = computed(() => props.assignment?.status === 'completed')
const date = computed(() => props.assignment ? shortCalendarDate(props.assignment.available_date).toLocaleUpperCase('ru-RU') : '2 ДЕКАБРЯ')
const words = [Array.from({ length: 10 }, (_, i) => i), Array.from({ length: 5 }, (_, i) => i + 10)]
const gradientTransform = computed(() => `translate(-50%, -50%) matrix(1.8204429496, ${.4559142329 * ratio.value}, 3.0590994236, ${-1.8204429496 * ratio.value}, 0, 0)`)
let observer: ResizeObserver | undefined
let previousOverflow: string | undefined

function cssUrl(url: string) { return `url("${url}")` }
function focus(index: number) {
  const input = inputs.value[Math.min(14, Math.max(0, index))]
  input?.focus(); input?.select()
}
function edited() { incorrect.value = false; emit('edit') }
function distribute(value: string, index: number) {
  const clean = cipherLettersFromText(value)
  if (!clean.length) return
  edited()
  const start = clean.length >= 15 ? 0 : index
  clean.slice(0, 15 - start).forEach((letter, offset) => { letters.value[start + offset] = letter })
  void nextTick(() => focus(Math.min(14, start + clean.length)))
}
function onInput(event: Event, index: number) {
  const input = event.target as HTMLInputElement
  if (props.saving || completed.value) { input.value = letters.value[index] ?? ''; return }
  const clean = cipherLettersFromText(input.value)
  if (clean.length > 1) distribute(input.value, index)
  else {
    edited(); letters.value[index] = clean[0] ?? ''
    if (clean.length && index < 14) focus(index + 1)
  }
  input.value = letters.value[index] ?? ''
}
function onPaste(event: ClipboardEvent, index: number) {
  event.preventDefault()
  if (!props.saving && !completed.value) distribute(event.clipboardData?.getData('text') ?? '', index)
}
function onKeydown(event: KeyboardEvent, index: number) {
  if (props.saving || completed.value) return
  if (event.key === 'Backspace') {
    event.preventDefault(); edited()
    if (letters.value[index]) letters.value[index] = ''
    else if (index) { letters.value[index - 1] = ''; focus(index - 1) }
  } else if (event.key === 'Delete') {
    event.preventDefault(); edited(); letters.value[index] = ''
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); focus(index + (event.key === 'ArrowLeft' ? -1 : 1))
  }
}
function submit() {
  if (props.loading || props.saving || !props.assignment?.task) return
  if (completed.value) { popupOpen.value = true; return }
  if (!isCipherSolution(letters.value)) { incorrect.value = true; return }
  incorrect.value = false
  emit('submit', [...letters.value])
}
function clueStyle(index: number) {
  const figure = cipherFigures[index]!
  const position = index < 10 ? index : index - 10
  return { left: `${figure.x - (40 + position * 31.3)}px`, top: `${figure.y - (index < 10 ? 1103 : 1192)}px` }
}
async function toggleMusic() {
  if (!audio.value || !cipherMusicUrl) return
  musicError.value = ''
  if (playing.value) { audio.value.pause(); return }
  try { await audio.value.play() } catch { musicError.value = 'Не удалось включить музыку. Попробуйте ещё раз.' }
}
function unlockScroll() {
  if (previousOverflow !== undefined) { document.documentElement.style.overflow = previousOverflow; previousOverflow = undefined }
}
watch(() => props.assignment?.id, () => {
  letters.value = completed.value ? [...CIPHER_LETTERS] : Array(15).fill('')
  incorrect.value = false; popupOpen.value = false
}, { immediate: true })
watch(completed, (value, before) => {
  if (value) {
    letters.value = [...CIPHER_LETTERS]
    incorrect.value = false
    if (before === false) popupOpen.value = true
  }
}, { immediate: true })
watch(popupOpen, async open => {
  await nextTick()
  if (open) {
    if (previousOverflow === undefined) previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    if (!dialog.value?.open) dialog.value?.showModal()
  } else {
    dialog.value?.close(); unlockScroll()
  }
})
onMounted(() => {
  observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (!entry.contentRect.width) continue
      if (entry.target === gradient.value) ratio.value = entry.contentRect.height / entry.contentRect.width
      if (entry.target === board.value) boardScale.value = entry.contentRect.width / 313
      if (entry.target === message.value) messageScale.value = entry.contentRect.width / 313
    }
  })
  for (const element of [gradient.value, board.value, message.value]) if (element) observer.observe(element)
})
// Board and answer appear after an asynchronous calendar load as well.
watch([board, message], elements => { for (const element of elements) if (element) observer?.observe(element) })
onBeforeUnmount(() => { observer?.disconnect(); audio.value?.pause(); dialog.value?.close(); unlockScroll() })
</script>

<template>
  <main class="cipher-page">
    <div ref="gradient" class="cipher-background" aria-hidden="true"><div class="cipher-gradient" :style="{ transform: gradientTransform }"></div></div>
    <div class="cipher-layout">
      <header class="cipher-header">
        <img :src="wordmark" alt="ГЕРОФАРМ" class="cipher-wordmark" data-figma-node="39:14" />
        <button class="cipher-back" type="button" @click="emit('back')">← К календарю</button>
      </header>
      <article class="cipher-card" :style="{ '--card-art': cssUrl(card) }" aria-labelledby="cipher-title" data-figma-node="28:39852">
        <p class="cipher-date">{{ date }}</p>
        <h1 id="cipher-title">Дело о спортивных человечках</h1>
        <p v-if="loading" class="cipher-notice" role="status">Загружаем задание…</p>
        <div v-else-if="error" class="cipher-notice"><p role="alert">{{ error }}</p><button type="button" class="cipher-button" @click="emit('retry')">Попробовать ещё раз</button></div>
        <p v-else-if="!assignment" class="cipher-notice" role="status">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="cipher-notice" role="status">Задание пока закрыто. Откроется {{ formatDate(assignment.available_date) }}.</p>
        <template v-else>
          <div class="cipher-intro">
            <p>Помните загадочных человечков, шифр которых разгадывал Шерлок Холмс? Сегодня похожая задача ждет и вас — только наши человечки выбрали спорт!</p>
            <p>Они спрятали название подарка для первых 500 участников, которые правильно выполнят все обязательные задания адвента. Подсказка: он пригодится и на тренировке, и в активные выходные. Все в духе «Мышления долголетия»!</p>
          </div>
          <h2 class="cipher-instruction-title">Задание</h2>
          <p id="cipher-instructions" class="cipher-instructions">Перед вами алфавит: каждой позе человечка соответствует определенная буква. Посмотрите на зашифрованное сообщение, найдите каждую позу в алфавите и введите соответствующую букву в ячейку. В итоге вы узнаете, какой подарок вас ждет.</p>
          <button class="cipher-button cipher-music" :style="{ backgroundImage: cssUrl(musicButton) }" type="button" :disabled="!cipherMusicUrl" :aria-pressed="playing" @click="toggleMusic">{{ playing ? '♫ Выключить музыку' : '♫ Включить музыку' }}</button>
          <audio v-if="cipherMusicUrl" ref="audio" :src="cipherMusicUrl" preload="none" loop @play="playing = true" @pause="playing = false" @error="musicError = 'Не удалось загрузить музыку.'"></audio>
          <p v-if="musicError" class="cipher-warning" role="status">{{ musicError }}</p>
          <div ref="board" class="cipher-alphabet" aria-label="Алфавит спортивных человечков" data-figma-node="28:39861">
            <div class="cipher-alphabet-inner" :style="{ transform: `scale(${boardScale})`, backgroundImage: cssUrl(alphabetFrame) }">
              <template v-for="(figure, index) in cipherAlphabet" :key="figure.node">
                <img :src="figure.art" :alt="`Поза для буквы ${figure.letter}`" :style="{ left: `${figure.x}px`, top: `${figure.y}px` }" :data-figma-node="figure.node" />
                <span :style="{ left: `${28 + index % 6 * 51}px`, top: `${60 + Math.floor(index / 6) * 69}px` }">{{ figure.letter }}</span>
              </template>
            </div>
          </div>
          <form class="cipher-form" novalidate :aria-busy="saving" @submit.prevent="submit">
            <fieldset :disabled="saving || completed" aria-describedby="cipher-instructions">
              <legend>Расшифруйте сообщение</legend>
              <div ref="message" class="cipher-message">
                <div class="cipher-message-inner" :style="{ transform: `scale(${messageScale})` }">
                  <div v-for="(word, wordIndex) in words" :key="wordIndex" class="cipher-word" :style="{ top: `${wordIndex * 89}px` }" :aria-label="`Слово ${wordIndex + 1}, ${word.length} букв`">
                    <div v-for="(index, position) in word" :key="index" class="cipher-cell" :style="{ left: `${position * 31.3}px`, '--cell-art': cssUrl(index === 2 || index === 12 ? cellVariant : cell) }">
                      <img class="cipher-clue" :src="cipherFigures[index]!.art" alt="" :style="clueStyle(index)" :data-figma-node="cipherFigures[index]!.node" />
                      <div class="cipher-input-wrap">
                        <input :id="`cipher-letter-${index}`" :ref="el => { if (el) inputs[index] = el as HTMLInputElement }" :value="letters[index]" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" :spellcheck="false" :aria-label="`Слово ${wordIndex + 1}, буква ${position + 1}`" @input="onInput($event, index)" @paste="onPaste($event, index)" @keydown="onKeydown($event, index)" @focus="inputs[index]?.select()" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
            <p v-if="incorrect" class="cipher-warning cipher-incorrect" role="alert">В шифре еще осталась загадка.<br />Сверьтесь с алфавитом и попробуйте снова!</p>
            <p v-else-if="saveError" class="cipher-warning cipher-incorrect" role="alert">{{ saveError }}</p>
            <button class="cipher-button cipher-check" type="submit" :disabled="saving">{{ saving ? 'Сохраняем…' : 'Проверить ответ' }}</button>
          </form>
        </template>
      </article>
      <footer class="cipher-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
    <dialog ref="dialog" class="cipher-success" :style="{ '--success-art': cssUrl(successCard) }" aria-labelledby="cipher-success-title" aria-describedby="cipher-success-copy" @close="popupOpen = false" @cancel="popupOpen = false">
      <button class="cipher-close" type="button" aria-label="Закрыть окно результата" @click="popupOpen = false">×</button>
      <h2 id="cipher-success-title">Вы разгадали шифр!</h2>
      <p id="cipher-success-copy">Подарок — спортивная сумка ГЕРОФАРМ. Ее получат первые 500 участников, правильно выполнивших все обязательные задания адвента. Продолжайте открывать окошки, ведь впереди у нас еще много интересного!</p>
      <div class="cipher-gift" :style="{ backgroundImage: cssUrl(gift) }" data-figma-node="28:40836">Фото спортивной сумки</div>
      <button class="cipher-button cipher-calendar" type="button" @click="popupOpen = false; emit('back')">К календарю</button>
    </dialog>
  </main>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.ttf') format('truetype'); font-weight: 400 700; font-display: swap; }
@font-face { font-family: 'Advent Source Serif'; src: url('../assets/cipher/SourceSerif4.ttf') format('truetype'); font-weight: 200 900; font-display: swap; }
:global(#app:has(.cipher-page)) { width: 100%; border: 0; }
.cipher-page { position: relative; isolation: isolate; overflow: clip; width: 100%; min-height: 100svh; box-sizing: border-box; color-scheme: light; color: #623c28; background: #c63d0f; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; }
.cipher-background { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.cipher-gradient { position: absolute; top: 56.53241251%; left: 46.0559869%; width: 100%; aspect-ratio: 1; transform-origin: center; background: radial-gradient(circle closest-side at center, #ffb451 0%, #f78028 51.442307%, #c63d0f 100%); }
.cipher-layout { position: relative; box-sizing: border-box; width: 100%; max-width: 960px; margin-inline: auto; padding: 0 clamp(0px, calc((100vw - 313px) / 2), 16px) 31px; }
.cipher-header { position: relative; box-sizing: border-box; height: 94px; padding-top: 34px; }
.cipher-wordmark { display: block; margin-inline: auto; }
.cipher-back { display: flex; align-items: center; position: absolute; top: 48px; left: 0; min-height: 44px; padding: 0 8px; border: 0; margin: 0; background: transparent; color: #fff1cf; font: 400 12px/15px 'Advent Inter', sans-serif; cursor: pointer; }
.cipher-card { position: relative; isolation: isolate; box-sizing: border-box; width: 100%; padding: 29px clamp(16px, calc((100vw - 345px) / 2), 24px); }
.cipher-card::before { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; border: 24px solid transparent; border-image: var(--card-art) 24 fill / 24px stretch; }
.cipher-date { margin: 0 0 14px; color: #a7280b; font-size: 12px; line-height: 15px; font-weight: 700; }
.cipher-card h1 { margin: 0 0 21px; color: #623c28; font: 500 28px/30px 'Advent STIX', serif; letter-spacing: 0; }
.cipher-intro { color: #836045; }
.cipher-intro p { margin: 0 0 20px; }
.cipher-intro p:last-child { margin-bottom: 0; }
.cipher-instruction-title { margin: 17px 0 11px; color: #623c28; font: 500 20px/30px 'Advent Source Serif', serif; letter-spacing: 0; }
.cipher-instructions { margin: 0; color: #836045; }
.cipher-button { position: relative; left: 50%; transform: translateX(-50%); display: flex; justify-content: center; align-items: center; box-sizing: border-box; flex: 0 0 auto; width: 313px; min-width: 313px; max-width: 313px; height: 52px; min-height: 52px; padding: 0 16px; border: 0; border-radius: 13px; margin-inline: 0; color: #fff7df; background: #a7280b; font: 700 14px/17px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: center; cursor: pointer; }
.cipher-button:disabled { cursor: default; opacity: 1; -webkit-text-fill-color: currentColor; }
.cipher-music { margin-top: 27px; color: #a7280b; background-color: transparent; background-size: 100% 100%; background-repeat: no-repeat; }
.cipher-alphabet { width: 100%; max-width: 520px; aspect-ratio: 313 / 295; margin: 12px auto 0; position: relative; }
.cipher-alphabet-inner { position: absolute; top: 0; left: 0; width: 313px; height: 295px; transform-origin: top left; background-size: 100% 100%; background-repeat: no-repeat; }
.cipher-alphabet-inner img, .cipher-clue { position: absolute; display: block; }
.cipher-alphabet-inner span { position: absolute; transform: translateX(-50%); font: 400 11px/13px 'Advent Inter', sans-serif; color: #623c28; }
.cipher-form { margin-top: 21px; }
.cipher-form fieldset { min-width: 0; border: 0; padding: 0; margin: 0; }
.cipher-form legend { padding: 0; margin: 0 0 18px; color: #623c28; font: 500 20px/27px 'Advent Source Serif', serif; }
.cipher-message { position: relative; width: 100%; max-width: 520px; aspect-ratio: 313 / 155; margin-inline: auto; }
.cipher-message-inner { position: absolute; left: 0; top: 0; width: 313px; height: 155px; transform-origin: top left; }
.cipher-word { position: absolute; left: 0; width: 313px; height: 66px; }
.cipher-cell { position: absolute; width: 26px; height: 66px; }
.cipher-input-wrap { position: absolute; top: 32px; left: 0; width: 26px; height: 34px; }
.cipher-input-wrap::before { content: ''; position: absolute; inset: -.5px; background: var(--cell-art) center / 100% 100% no-repeat; pointer-events: none; }
.cipher-input-wrap input { position: relative; z-index: 1; display: block; box-sizing: border-box; width: 26px; height: 34px; padding: 0; border: 0; border-radius: 4px; margin: 0; background: transparent; color: #623c28; caret-color: #623c28; font: 400 18px/24px 'Advent Inter', sans-serif; text-align: center; text-transform: uppercase; box-shadow: none; }
.cipher-input-wrap input:disabled { opacity: 1; -webkit-text-fill-color: #623c28; }
.cipher-input-wrap input:focus-visible { outline: 1px solid #a7401d; outline-offset: 0; }
.cipher-warning { color: #a7280b; font: 400 13px/18px 'Advent Inter', sans-serif; overflow-wrap: anywhere; }
.cipher-incorrect { margin: 12px 0 0; }
.cipher-check { margin-top: 19px; }
.cipher-incorrect + .cipher-check { margin-top: 24px; }
.cipher-button:not(:disabled):not(.cipher-music):hover { background-color: #962107; }
.cipher-button:focus-visible, .cipher-back:focus-visible, .cipher-close:focus-visible { outline: 2px solid #623c28; outline-offset: 4px; }
.cipher-footer { margin-top: 24px; font-size: 12px; line-height: 15px; text-align: center; }
.cipher-notice { min-height: 120px; margin: 0; color: #836045; overflow-wrap: anywhere; }
.cipher-notice .cipher-button { margin-top: 24px; }
.cipher-success { position: fixed; isolation: isolate; box-sizing: border-box; top: clamp(16px, 17svh, 145px); left: 50%; transform: translateX(-50%); width: 345px; max-width: calc(100vw - 16px); max-height: calc(100svh - clamp(16px, 17svh, 145px) - 16px); margin: 0; padding: 44px clamp(16px, calc((100vw - 345px) / 2), 24px) 24px; border: 0; background: transparent; overflow-y: auto; color: #623c28; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; }
.cipher-success::before { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; border: 23px solid transparent; border-image: var(--success-art) 23 fill / 23px stretch; }
.cipher-success::backdrop { background: rgb(66 35 19 / 55%); }
.cipher-close { position: absolute; right: 6px; top: 0; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: #623c28; font: 400 25px/30px 'Advent Inter', sans-serif; cursor: pointer; }
.cipher-success h2 { margin: 0 0 14px; color: #623c28; font: 500 24px/30px 'Advent STIX', serif; letter-spacing: 0; }
.cipher-success > p { width: calc(100% + 14px); margin: 0; color: #836045; }
.cipher-gift { display: grid; place-items: center; width: 100%; aspect-ratio: 297 / 123; margin-top: 15px; background-repeat: no-repeat; background-size: 100% 100%; color: #836045; font-size: 13px; line-height: 16px; }
.cipher-calendar { width: 297px; min-width: 297px; max-width: 297px; margin-top: 22px; }
@media (min-width: 768px) { .cipher-layout { padding-inline: 32px; } .cipher-card { padding-inline: 32px; } }
</style>
