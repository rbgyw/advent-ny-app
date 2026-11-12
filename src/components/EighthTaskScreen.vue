<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import PopupDialog from './PopupDialog.vue';
import type { CalendarTask } from '../types/models';
import { formatDate } from '../utils/date';
import { shortCalendarDate } from '../utils/calendar';
import { gratitudeError, normalizeGratitude, type GratitudeLetter } from '../utils/gratitude';
import wordmark from '../assets/gratitude/wordmark.svg';
import panel from '../assets/gratitude/panel.svg';
import checkbox from '../assets/gratitude/checkbox.svg';
import check from '../assets/gratitude/check.svg';
import inputArt from '../assets/gratitude/input.svg';
import textareaArt from '../assets/gratitude/textarea.svg';
import buttonArt from '../assets/gratitude/button.svg';
import envelopeBack from '../assets/gratitude/envelope-back.svg';
import letterArt from '../assets/gratitude/letter.svg';
import envelopeFront from '../assets/gratitude/envelope-front.svg';
import confetti1 from '../assets/gratitude/confetti-1.svg';
import confetti2 from '../assets/gratitude/confetti-2.svg';
import confetti3 from '../assets/gratitude/confetti-3.svg';
import confetti4 from '../assets/gratitude/confetti-4.svg';
import confetti5 from '../assets/gratitude/confetti-5.svg';
import confetti6 from '../assets/gratitude/confetti-6.svg';
import confetti7 from '../assets/gratitude/confetti-7.svg';
import confetti9 from '../assets/gratitude/confetti-9.svg';

const props = defineProps<{
  assignment?: CalendarTask; day: number; total?: number; loading: boolean; error?: string | null;
  send: (letter: GratitudeLetter, requestId: string) => Promise<void>;
}>();
const emit = defineEmits<{ back: []; retry: [] }>();
const form = reactive<GratitudeLetter>({ anonymous: false, senderName: '', recipient: '', message: '' });
const sending = ref(false), sent = ref(false), sendError = ref('');
const invalidField = ref('');
const formElement = ref<HTMLFormElement>(), dialog = ref<InstanceType<typeof PopupDialog>>();
const background = ref<HTMLElement>(), ratio = ref(1529 / 393);
const date = computed(() => props.assignment ? shortCalendarDate(props.assignment.available_date).toLocaleUpperCase('ru-RU') : `${props.day} ДЕКАБРЯ`);
const gradientTransform = computed(() => `translate(-50%, -50%) matrix(1.8204429496, ${.4559142329 * ratio.value}, 3.0590994236, ${-1.8204429496 * ratio.value}, 0, 0)`);
const cssUrl = (url: string) => `url("${url}")`;
// Final positions reproduce the nine individual Figma layers. All start behind the envelope front.
const confetti = [
  { src: confetti1, x: 80, y: 321, size: 30 }, { src: confetti2, x: 125, y: 288, size: 30 },
  { src: confetti3, x: 227, y: 272, size: 30 }, { src: confetti4, x: 266, y: 313, size: 30 },
  { src: confetti5, x: 188, y: 348, size: 30 }, { src: confetti6, x: 153, y: 324, size: 30 },
  { src: confetti7, x: 220, y: 315, size: 30 }, { src: confetti4, x: 173, y: 306, size: 30 },
  { src: confetti9, x: 112, y: 346, size: 35 },
];
let observer: ResizeObserver | undefined;
let lastPayload = '', requestId = '', identityVersion = 0;
function edit() { sendError.value = ''; invalidField.value = ''; sent.value = false; }
function closePopup() { dialog.value?.close(); }
async function showPopup() {
  await nextTick();
  await dialog.value?.showModal();
}
async function submit() {
  if (sending.value || props.loading || !props.assignment?.task || props.error) return;
  if (sent.value) { await showPopup(); return; }
  const payload = normalizeGratitude(form), validation = gratitudeError(payload);
  if (validation) {
    sendError.value = validation.message; invalidField.value = validation.field;
    await nextTick(); formElement.value?.querySelector<HTMLElement>(`[name="${validation.field}"]`)?.focus(); return;
  }
  const serialized = JSON.stringify(payload);
  if (serialized !== lastPayload) { lastPayload = serialized; requestId = crypto.randomUUID(); }
  sending.value = true; sendError.value = ''; invalidField.value = '';
  const version = identityVersion;
  try {
    await props.send(payload, requestId);
    if (version !== identityVersion) return;
    sent.value = true; await showPopup();
  } catch (error) {
    if (version === identityVersion) sendError.value = error instanceof Error ? error.message : 'Не удалось отправить письмо. Попробуйте ещё раз.';
  } finally { if (version === identityVersion) sending.value = false; }
}
watch(() => props.assignment?.id, () => {
  identityVersion++; closePopup(); sending.value = false; sent.value = false; sendError.value = ''; invalidField.value = '';
  Object.assign(form, { anonymous: false, senderName: '', recipient: '', message: '' }); lastPayload = ''; requestId = '';
});
onMounted(() => {
  observer = new ResizeObserver(entries => { const size = entries[0]?.contentRect; if (size?.width) ratio.value = size.height / size.width; });
  if (background.value) observer.observe(background.value);
});
onBeforeUnmount(() => { identityVersion++; observer?.disconnect(); closePopup(); });
</script>

<template>
  <main class="gratitude-page">
    <div ref="background" class="gratitude-background" aria-hidden="true"><div class="gratitude-gradient" :style="{ transform: gradientTransform }"></div></div>
    <div class="gratitude-layout">
      <header class="gratitude-header"><img :src="wordmark" alt="ГЕРОФАРМ" /><button type="button" @click="emit('back')">← К календарю</button></header>
      <article class="gratitude-panel" :style="{ '--panel-art': cssUrl(panel) }" aria-labelledby="gratitude-title">
        <p class="gratitude-date">{{ date }}</p>
        <h1 id="gratitude-title">Время сказать<br />«спасибо»</h1>
        <p v-if="loading" class="gratitude-notice" role="status">Загружаем задание…</p>
        <div v-else-if="error" class="gratitude-notice" role="alert"><p>{{ error }}</p><button class="gratitude-send" @click="emit('retry')">Попробовать снова</button></div>
        <p v-else-if="!assignment" class="gratitude-notice">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="gratitude-notice">Задание откроется {{ formatDate(assignment.available_date) }}.</p>
        <template v-else>
          <div class="gratitude-copy">
            <p>Иногда простое «спасибо» значит больше, чем кажется. Особенно за помощь в сложной задаче, терпеливое объяснение, поддержку или хорошее настроение в рабочий день.</p>
            <p>Сегодня предлагаем отправить коллегам письмо благодарности. Вспомните, кому и за что вам хочется сказать спасибо, и напишите несколько теплых слов.</p>
            <p>Укажите корпоративную почту получателя и выберите, представиться или остаться тайным Дедом Морозом. Письмо будет отправлено автоматически с отдельного адреса.</p>
            <p>Используйте только корпоративную почту ГЕРОФАРМ: на другие адреса письмо отправить не получится.</p>
            <p>Дед Мороз внимательно следит за праздничной почтой! Отправляйте коллегам только добрые слова, а обидные шутки оставьте за пределами его волшебного мешка, иначе рискуете оказаться без новогоднего подарка!</p>
          </div>
          <form ref="formElement" class="gratitude-form" novalidate :aria-busy="sending" @submit.prevent="submit" @input="edit">
            <label class="gratitude-anonymous">
              <input v-model="form.anonymous" type="checkbox" :disabled="sending" />
              <span class="gratitude-check" :class="{ checked: form.anonymous }" :style="{ '--checkbox-art': cssUrl(checkbox) }" aria-hidden="true"><img v-if="form.anonymous" :src="check" alt="" /></span>
              <span>Отправить анонимно</span>
            </label>
            <div v-if="!form.anonymous" class="gratitude-field gratitude-sender">
              <label for="gratitude-sender">От кого</label>
              <div class="gratitude-input" :style="{ '--input-art': cssUrl(inputArt) }"><input id="gratitude-sender" v-model="form.senderName" name="senderName" type="text" autocomplete="name" placeholder="Имя и фамилия" maxlength="120" :disabled="sending || form.anonymous" :required="!form.anonymous" :aria-invalid="invalidField === 'senderName'" :aria-describedby="invalidField === 'senderName' ? 'gratitude-error' : undefined" /></div>
            </div>
            <div class="gratitude-field gratitude-recipient">
              <label for="gratitude-recipient">Кому</label>
              <div class="gratitude-input" :style="{ '--input-art': cssUrl(inputArt) }"><input id="gratitude-recipient" v-model="form.recipient" name="recipient" type="email" autocomplete="off" inputmode="email" autocapitalize="none" spellcheck="false" placeholder="ivan.ivanov@geropharm.com" maxlength="254" :disabled="sending" required :aria-invalid="invalidField === 'recipient'" aria-describedby="gratitude-email-hint gratitude-error" /></div>
              <p id="gratitude-email-hint" class="gratitude-hint">Только корпоративная почта @geropharm.com</p>
            </div>
            <div class="gratitude-field gratitude-message">
              <label for="gratitude-message">Ваша благодарность</label>
              <div class="gratitude-input gratitude-textarea" :style="{ '--input-art': cssUrl(textareaArt) }"><textarea id="gratitude-message" v-model="form.message" name="message" placeholder="За что вы хотите сказать спасибо?" maxlength="5000" :disabled="sending" required :aria-invalid="invalidField === 'message'" :aria-describedby="invalidField === 'message' ? 'gratitude-error' : undefined"></textarea></div>
            </div>
            <div class="gratitude-signature"><p>С наилучшими пожеланиями,</p><p>{{ !form.anonymous && form.senderName.trim() ? form.senderName.trim() : 'Твой тайный Дед Мороз' }}</p></div>
            <p v-if="sendError" id="gratitude-error" class="gratitude-error" role="alert">{{ sendError }}</p>
            <button class="gratitude-send" :style="{ '--button-art': cssUrl(buttonArt) }" type="submit" :disabled="sending"><span>{{ sending ? 'Отправляем…' : sent ? 'Письмо отправлено' : 'Отправить благодарность' }}</span></button>
          </form>
        </template>
      </article>
      <footer class="gratitude-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
    <PopupDialog ref="dialog" class="gratitude-popup" aria-labelledby="gratitude-popup-title" aria-describedby="gratitude-popup-copy">
      <div v-if="sent" class="gratitude-scene"><div class="gratitude-envelope">
        <img class="envelope-back" :src="envelopeBack" alt="" />
        <img class="envelope-letter" :src="letterArt" alt="" />
        <button class="gratitude-close" type="button" aria-label="Закрыть окно «Письмо отправлено»" @click="closePopup">×</button>
        <span class="gratitude-star" aria-hidden="true">✦</span>
        <p class="gratitude-post">ПРАЗДНИЧНАЯ ПОЧТА</p>
        <h2 id="gratitude-popup-title">Письмо<br />отправлено!</h2>
        <p id="gratitude-popup-copy">Пусть у вашего коллеги сегодня появится еще один повод улыбнуться.</p>
        <p class="gratitude-warm">С теплом, ГЕРОФАРМ</p>
        <div class="gratitude-confetti" aria-hidden="true">
          <span v-for="(piece, index) in confetti" :key="index" class="confetti-piece" :style="{ left: `${piece.x}px`, top: `${piece.y}px`, '--from-x': `${158 - piece.x}px`, '--from-y': `${390 - piece.y}px`, '--delay': `${160 + index * 45}ms`, '--turn': `${index % 2 ? 65 : -75}deg` }"><img :src="piece.src" alt="" /></span>
        </div>
        <img class="envelope-front" :src="envelopeFront" alt="" />
        <button class="gratitude-calendar" type="button" @click="closePopup(); emit('back')">К календарю</button>
      </div></div>
    </PopupDialog>
  </main>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.ttf') format('truetype'); font-weight: 400 700; font-display: swap; }
@font-face { font-family: 'Advent STIX Italic'; src: url('../assets/gratitude/STIXTwoText-Italic.ttf') format('truetype'); font-weight: 400 700; font-style: italic; font-display: swap; }
:global(#app:has(.gratitude-page)) { width: 100%; border: 0; }
.gratitude-page { position: relative; isolation: isolate; overflow: clip; box-sizing: border-box; width: 100%; min-height: 100svh; color-scheme: light; color: #623c28; background: #c63d0f; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; }
.gratitude-background { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.gratitude-gradient { position: absolute; top: 56.53241251%; left: 46.0559869%; width: 100%; aspect-ratio: 1; transform-origin: center; background: radial-gradient(circle closest-side at center, #ffb451 0%, #f78028 51.442307%, #c63d0f 100%); }
.gratitude-layout { box-sizing: border-box; max-width: 760px; margin: 0 auto; padding: 0 16px 32px; }
.gratitude-header { position: relative; height: 94px; box-sizing: border-box; padding-top: 34px; }
.gratitude-header img { display: block; margin: 0 auto; }
button { font-family: inherit; cursor: pointer; }
.gratitude-header button { position: absolute; top: 48px; left: 0; min-height: 44px; padding: 0 8px; border: 0; background: transparent; color: #fff1cf; font: 400 12px/15px 'Advent Inter', sans-serif; }
.gratitude-panel { position: relative; isolation: isolate; box-sizing: border-box; padding: 29px 24px 32px; }
.gratitude-panel::before { position: absolute; z-index: -1; inset: 0; content: ''; border: 24px solid transparent; border-image: var(--panel-art) 24 fill / 24px stretch; pointer-events: none; }
.gratitude-date { margin: 0 0 14px; color: #a7280b; font-size: 12px; line-height: 15px; font-weight: 700; }
.gratitude-panel h1 { margin: 0 0 22px; color: #623c28; font: 500 28px/30px 'Advent STIX', serif; letter-spacing: 0; }
.gratitude-copy { color: #836045; }
.gratitude-copy p { margin: 0 0 20px; }
.gratitude-copy p:last-child { margin-bottom: 0; }
.gratitude-form { margin-top: 31px; }
.gratitude-anonymous { position: relative; display: flex; align-items: center; gap: 10px; min-height: 20px; cursor: pointer; }
.gratitude-anonymous input { position: absolute; width: 24px; height: 24px; margin: 0; opacity: 0; }
.gratitude-check { position: relative; width: 20px; height: 20px; flex: 0 0 20px; border-radius: 4px; background-image: var(--checkbox-art); background-position: center; pointer-events: none; }
.gratitude-check.checked { background: #a7280b; }
.gratitude-check img { position: absolute; top: 4.3px; left: 3.3px; }
.gratitude-anonymous input:focus-visible + .gratitude-check { outline: 2px solid #a7280b; outline-offset: 3px; }
.gratitude-field > label { display: block; margin-bottom: 14px; font-weight: 600; line-height: 17px; }
.gratitude-sender { margin-top: 21px; }
.gratitude-recipient { margin-top: 20px; }
.gratitude-message { margin-top: 31px; }
.gratitude-input { position: relative; isolation: isolate; }
.gratitude-input::before { content: ''; position: absolute; z-index: -1; inset: -.5px; border: 12px solid transparent; border-image: var(--input-art) 12 fill / 12px stretch; pointer-events: none; }
.gratitude-input input, .gratitude-input textarea { box-sizing: border-box; display: block; width: 100%; height: 52px; padding: 0 14px; border: 0; border-radius: 12px; background: transparent; color: #623c28; font: 400 13px/18px 'Advent Inter', sans-serif; box-shadow: none; }
.gratitude-input textarea { height: 161px; min-height: 161px; padding-top: 16px; padding-bottom: 16px; resize: none; }
.gratitude-input :is(input,textarea)::placeholder { color: #947a62; opacity: 1; }
.gratitude-input input:disabled { opacity: 1; -webkit-text-fill-color: #947a62; }
.gratitude-input :is(input,textarea):focus-visible { outline: 2px solid #a7280b; outline-offset: 2px; }
.gratitude-input [aria-invalid=true] { outline: 1px solid #a7280b; }
.gratitude-hint { margin: 10px 0 0; color: #836045; font-size: 12px; line-height: 15px; }
.gratitude-signature { min-height: 39px; margin-top: 26px; color: #836045; font-size: 13px; line-height: 16px; overflow-wrap: anywhere; }
.gratitude-signature p:first-child { font-weight: 600; margin-bottom: 7px; }
.gratitude-send { display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 100%; height: 52px; margin-top: 26px; padding: 0 12px; border: 0; border-radius: 13px; background: #a7280b var(--button-art) center / 100% 100%; font-size: 14px; line-height: 17px; font-weight: 700; text-align: center; }
.gratitude-send span { color: transparent; background-clip: text; background-image: linear-gradient(71.3606deg, #e8b77e .55732%, #ffe6bc 19.578%, #fff0d2 72.836%, #efc087 99.465%); }
.gratitude-send:disabled { opacity: .65; cursor: wait; }
.gratitude-send:hover:not(:disabled) { filter: brightness(1.08); }
.gratitude-error { margin-top: 16px; color: #a7280b; font-size: 13px; line-height: 18px; overflow-wrap: anywhere; }
.gratitude-footer { margin-top: 27px; font-size: 12px; line-height: 15px; text-align: center; }
.gratitude-notice { min-height: 120px; color: #836045; }
.gratitude-popup { position: fixed; top: clamp(16px, calc(50svh - 257px), 169px); left: 50%; transform: translateX(-50%); width: 345px; height: 462px; max-width: calc(100vw - 16px); max-height: calc(100svh - 32px); margin: 0; padding: 0; border: 0; border-radius: 28px; background: #a7280b; color: #623c28; font: 400 14px/20px 'Advent Inter', sans-serif; text-align: center; letter-spacing: 0; overflow: auto; }
.gratitude-popup::backdrop { background: rgb(82 42 22 / 60%); }
.gratitude-scene { width: 100%; height: 462px; overflow: hidden; }
.gratitude-envelope { position: relative; width: 345px; height: 462px; overflow: hidden; }
.envelope-back { position: absolute; left: 0; top: 0; }
.envelope-letter { position: absolute; left: 12px; top: 12px; }
.gratitude-close { position: absolute; z-index: 4; top: 13px; right: 21px; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: #a7280b; font: 400 24px/29px 'Advent Inter', sans-serif; }
.gratitude-star { position: absolute; top: 25px; left: 161px; color: transparent; background-clip: text; background-image: linear-gradient(126.57deg, #f9df9b, #f3cb75 46%, #de9e40); font-size: 26px; line-height: 31px; }
.gratitude-post { position: absolute; top: 73px; left: 0; width: 100%; color: #a7280b; font-size: 10px; line-height: 12px; }
.gratitude-popup h2 { position: absolute; top: 113px; left: 0; width: 100%; margin: 0; color: #623c28; font: 400 32px/33px 'Advent STIX', serif; letter-spacing: 0; }
#gratitude-popup-copy { position: absolute; top: 185px; left: 38px; width: 270px; margin: 0; color: #836045; font-size: 14px; line-height: 17px; }
.gratitude-warm { position: absolute; top: 236px; left: 0; width: 100%; color: #a7280b; font: italic 400 17px/21px 'Advent STIX Italic', serif; }
.gratitude-confetti { position: absolute; z-index: 1; inset: 0; pointer-events: none; }
.confetti-piece { position: absolute; animation: gratitude-confetti-out 1150ms cubic-bezier(.2,.72,.25,1) var(--delay) both; }
.confetti-piece img { display: block; }
.envelope-front { position: absolute; z-index: 2; left: 0; top: 265px; pointer-events: none; }
.gratitude-calendar { position: absolute; z-index: 3; top: 401px; left: 0; width: 100%; height: 60px; padding: 0 0 22px; border: 0; background: transparent; color: #fff0c4; font: 700 14px/17px 'Advent Inter', sans-serif; text-decoration: underline; }
button:focus-visible { outline: 2px solid #623c28; outline-offset: -3px; }
@keyframes gratitude-confetti-out { from { transform: translate(var(--from-x), var(--from-y)) scale(.35) rotate(var(--turn)); opacity: 0; } 12% { opacity: 1; } 78% { transform: translate(0, -8px) scale(1.04) rotate(-4deg); opacity: 1; } to { transform: translate(0, 0) scale(1) rotate(0); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .confetti-piece { animation: none; } }
@media (max-width: 360px) { .gratitude-layout { padding-inline: 12px; } .gratitude-panel { padding-inline: 18px; } .gratitude-popup { width: 304px; height: 407.1px; } .gratitude-scene { height: 407.1px; } .gratitude-envelope { transform: scale(.88115942); transform-origin: top left; } }
@media (min-width: 768px) { .gratitude-layout { padding-inline: 32px; } .gratitude-panel { padding-inline: 32px; } }
@media (max-height: 520px) { .gratitude-popup { top: 16px; } }
</style>
