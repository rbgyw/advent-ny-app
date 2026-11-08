<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import brand from '../assets/verification/0-imgBrandWordmark.svg'
import back from '../assets/verification/0-imgIconBack.svg'
import card from '../assets/verification/0-imgVector.svg'
import errorCard from '../assets/verification/2-imgVector.svg'
import cell1 from '../assets/verification/0-imgVector1.svg'
import cell2 from '../assets/verification/0-imgVector2.svg'
import cell3 from '../assets/verification/0-imgVector3.svg'
import cell4 from '../assets/verification/0-imgVector4.svg'
import errorCell1 from '../assets/verification/2-imgVector1.svg'
import errorCell2 from '../assets/verification/2-imgVector2.svg'
import errorCell3 from '../assets/verification/2-imgVector3.svg'
import errorCell4 from '../assets/verification/2-imgVector4.svg'
import focusRing from '../assets/verification/1-imgVector5.svg'
import underline from '../assets/verification/0-imgVector5.svg'

const props = defineProps<{
  loading: boolean
  resending: boolean
  error: string | null
  invalidCode: boolean
  resendSucceeded: number
}>()
const emit = defineEmits<{ submit: [code: string]; resend: []; back: []; edit: [] }>()
const digits = ref<string[]>(Array(6).fill(''))
const inputs = ref<HTMLInputElement[]>([])
const localError = ref('')
const remaining = ref(0)
const message = computed(() => localError.value || props.error)
const invalid = computed(() => Boolean(localError.value) || props.invalidCode)
const busy = computed(() => props.loading || props.resending)
const cells = computed(() => invalid.value
  ? [errorCell1, errorCell1, errorCell2, errorCell3, errorCell3, errorCell4]
  : [cell1, cell1, cell2, cell3, cell3, cell4])
let timer: ReturnType<typeof setInterval> | undefined

function cssUrl(value: string | undefined) { return `url("${value}")` }

function focus(index: number) {
  inputs.value[Math.max(0, Math.min(5, index))]?.focus()
  inputs.value[Math.max(0, Math.min(5, index))]?.select()
}
function clearError() {
  localError.value = ''
  emit('edit')
}
function distribute(value: string, start: number) {
  const clean = value.replace(/\D/g, '').slice(0, 6)
  if (!clean) return
  clearError()
  const offset = clean.length === 6 ? 0 : start
  for (let i = 0; i < clean.length && offset + i < 6; i++) digits.value[offset + i] = clean[i]!
  void nextTick(() => focus(Math.min(offset + clean.length, 5)))
}
function onInput(event: Event, index: number) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')
  if (value.length > 1) distribute(value, index)
  else {
    clearError()
    digits.value[index] = value
    if (value && index < 5) focus(index + 1)
  }
  input.value = digits.value[index] ?? ''
}
function onKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace') {
    event.preventDefault()
    clearError()
    if (digits.value[index]) digits.value[index] = ''
    else if (index > 0) { digits.value[index - 1] = ''; focus(index - 1) }
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    focus(index + (event.key === 'ArrowLeft' ? -1 : 1))
  } else if (event.key === 'Delete') {
    event.preventDefault(); clearError(); digits.value[index] = ''
  }
}
function onPaste(event: ClipboardEvent, index: number) {
  event.preventDefault()
  distribute(event.clipboardData?.getData('text') ?? '', index)
}
function submit() {
  if (busy.value) return
  const missing = digits.value.findIndex(digit => !digit)
  if (missing !== -1) {
    localError.value = 'Введите все 6 цифр кода.'
    focus(missing)
    return
  }
  localError.value = ''
  emit('submit', digits.value.join(''))
}
watch(() => props.resendSucceeded, () => {
  digits.value = Array(6).fill('')
  localError.value = ''
  remaining.value = 60
  clearInterval(timer)
  timer = setInterval(() => {
    remaining.value = Math.max(0, remaining.value - 1)
    if (!remaining.value) clearInterval(timer)
  }, 1000)
  void nextTick(() => focus(0))
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <main class="auth-page verification-page">
    <div class="auth-layout">
      <header class="auth-header verification-header">
        <button class="auth-back verification-back" type="button" aria-label="Вернуться ко входу" :disabled="busy" @click="emit('back')">
          <img :src="back" alt="" data-figma-node="39:39" />
        </button>
        <img class="verification-brand" :src="brand" alt="ГЕРОФАРМ" data-figma-node="39:14" />
      </header>
      <section class="auth-card verification-card" :class="{ 'has-message': message }" :style="{ backgroundImage: cssUrl(message ? errorCard : card) }" aria-labelledby="verification-title">
        <h1 id="verification-title">Подтвердите вход</h1>
        <p id="verification-description" class="auth-intro verification-intro">Код подтверждения отправлен<br class="verification-line-break" /> на вашу корпоративную почту.</p>
        <form :aria-busy="busy" novalidate @submit.prevent="submit">
          <fieldset :disabled="busy">
            <legend class="verification-label">Код подтверждения</legend>
            <div class="verification-digits" :class="{ 'is-invalid': invalid }">
              <div v-for="(_, index) in digits" :key="index" class="verification-cell" :style="{ '--cell-art': cssUrl(cells[index]), '--focus-ring': cssUrl(focusRing) }">
                <input
                  :id="`verification-digit-${index}`"
                  :ref="el => { if (el) inputs[index] = el as HTMLInputElement }"
                  :value="digits[index]"
                  type="text" inputmode="numeric" pattern="[0-9]*"
                  :autocomplete="index === 0 ? 'one-time-code' : 'off'"
                  :aria-label="`Цифра ${index + 1} из 6`"
                  :aria-invalid="invalid"
                  :aria-describedby="message ? 'verification-description verification-error' : 'verification-description'"
                  autocapitalize="off" :spellcheck="false"
                  @input="onInput($event, index)" @keydown="onKeydown($event, index)"
                  @paste="onPaste($event, index)" @focus="inputs[index]?.select()"
                />
              </div>
            </div>
            <p v-if="message" id="verification-error" class="verification-error" role="alert">{{ message }}</p>
            <button class="auth-submit verification-submit" type="submit">{{ loading ? 'Проверяем…' : 'Подтвердить' }}</button>
          </fieldset>
        </form>
        <button class="verification-resend" :style="{ '--underline': cssUrl(underline) }" type="button" :disabled="busy || remaining > 0" @click="emit('resend')">
          {{ resending ? 'Отправляем…' : remaining ? `Отправить повторно через ${remaining} с` : 'Отправить код повторно' }}
        </button>
        <p class="verification-status" role="status">{{ remaining ? 'Новый код отправлен на вашу почту.' : '' }}</p>
      </section>
    </div>
  </main>
</template>

<style scoped src="../assets/auth-form.css"></style>
<style scoped>
.auth-page.verification-page { background: linear-gradient(114.36deg, #090807 0%, #291209 22%, #743012 48%, #cf5515 73%, #ff941f 100%); background-size: 100% calc(100% + 16px); }
.verification-header { padding: 34px 0 0; }
.verification-brand { display: block; margin: 0 auto; }
.verification-back { border: 0; padding: 0; background: transparent; top: 16px; left: -9px; cursor: pointer; }
.verification-back img { display: block; }
.verification-card { position: relative; padding: 17px 24px 32px; border-radius: 24px; background-color: transparent; background-size: 100% 100%; background-repeat: no-repeat; color: #623c28; }
.verification-card h1 { font-weight: 500; margin: 0; line-height: 35px; }
.verification-intro { margin: 12px 0 29px; color: #836045; }
.verification-label { display: block; width: 100%; padding: 0; margin: 0 0 11px; font-weight: 700; line-height: 17px; }
.verification-digits { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 7px; }
.verification-cell { position: relative; height: 56px; }
.verification-cell::before { content: ''; pointer-events: none; position: absolute; inset: -.5px; background: var(--cell-art) center / 100% 100% no-repeat; }
.verification-cell:focus-within::after { content: ''; pointer-events: none; position: absolute; inset: -1.6px; background: var(--focus-ring) center / 100% 100% no-repeat; }
.verification-cell input { position: relative; z-index: 1; display: block; box-sizing: border-box; width: 100%; height: 56px; border: 0; border-radius: 10px; padding: 0; outline: none; background: transparent; color: #623c28; caret-color: #623c28; font: 400 24px/29px 'Advent Inter', sans-serif; text-align: center; box-shadow: none; }
.verification-cell input:focus-visible { outline: none; }
.verification-submit { margin-top: 33px; min-height: 54px; border-radius: 14px; background: #a7280b; color: #fff7df; font-size: 15px; }
.verification-submit:hover { background: #962107; }
.verification-error { margin: 12px 0 0; color: #a7280b; font-size: 12px; line-height: 18px; max-width: 232px; overflow-wrap: anywhere; }
.verification-error + .verification-submit { margin-top: 17px; }
.verification-resend { display: block; position: relative; max-width: 100%; margin: 5px auto 0; min-height: 44px; padding: 10px 2px; border: 0; background: transparent; color: #a7401d; font: inherit; line-height: 17px; cursor: pointer; }
.verification-resend::after { content: ''; position: absolute; left: 0; right: 0; bottom: 13px; height: .6px; background: var(--underline) center / 100% 100% no-repeat; }
.verification-resend:disabled { cursor: default; opacity: .7; }
.verification-status:empty { display: none; }
.verification-status { margin-top: 6px; color: #836045; font-size: 12px; line-height: 18px; text-align: center; }
@media (max-width: 359px) {
  .verification-card { padding-inline: 20px; }
  .verification-line-break { display: none; }
  .verification-card h1 { font-size: 26px; }
  .verification-digits { gap: 5px; }
}
</style>
