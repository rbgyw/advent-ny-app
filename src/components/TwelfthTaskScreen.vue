<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import type { CalendarTask } from '../types/models';
import { formatDate } from '../utils/date';
import { shortCalendarDate } from '../utils/calendar';
import { filmError, filmSubmissionOpen, normalizeFilm, type FilmRecommendation } from '../utils/film';
import wordmark from '../assets/film/wordmark.svg';
import panelArt from '../assets/film/panel.svg';
import movieTv from '../assets/film/movie-tv.png';
import inputArt from '../assets/film/input.svg';
import textareaArt from '../assets/film/textarea.svg';
import buttonArt from '../assets/film/button.svg';
import popupArt from '../assets/film/popup.svg';
import popupButton from '../assets/film/popup-button.svg';
import closeArt from '../assets/film/close.svg';

const props = defineProps<{ assignment?: CalendarTask; day: number; total?: number; loading: boolean; saving: boolean; error?: string | null; saveError?: string | null }>();
const emit = defineEmits<{ back: []; retry: []; submit: [recommendation: FilmRecommendation]; edit: [] }>();
const form = reactive<FilmRecommendation>({ title: '', reason: '' });
const formElement = ref<HTMLFormElement>(), dialog = ref<HTMLDialogElement>(), background = ref<HTMLElement>();
const validation = ref(''), invalidField = ref(''), now = ref(Date.now()), ratio = ref(1529 / 393);
const completed = computed(() => props.assignment?.status === 'completed');
const closed = computed(() => !filmSubmissionOpen(props.assignment?.available_date, new Date(now.value)));
const date = computed(() => props.assignment ? shortCalendarDate(props.assignment.available_date).toLocaleUpperCase('ru-RU') : `${props.day} ДЕКАБРЯ`);
const gradientTransform = computed(() => `translate(-50%, -50%) matrix(1.8204429496, ${.4559142329 * ratio.value}, 3.0590994236, ${-1.8204429496 * ratio.value}, 0, 0)`);
const cssUrl = (url: string) => `url("${url}")`;
let observer: ResizeObserver | undefined, timer: ReturnType<typeof setInterval> | undefined;
let previousOverflow: string | undefined;
let previousScroll = 0;
function refreshClock() { now.value = Date.now(); }
function edit() { validation.value = ''; invalidField.value = ''; emit('edit'); }
function unlockScroll() {
  if (previousOverflow !== undefined) { document.documentElement.style.overflow = previousOverflow; previousOverflow = undefined; window.scrollTo({ top: previousScroll, behavior: 'instant' }); }
}
function closePopup() { dialog.value?.close(); unlockScroll(); }
async function showPopup() {
  await nextTick();
  if (!dialog.value?.isConnected || dialog.value.open) return;
  previousOverflow = document.documentElement.style.overflow; previousScroll = window.scrollY;
  window.scrollTo({ top: 0, behavior: 'instant' }); document.documentElement.style.overflow = 'hidden'; dialog.value.showModal();
}
async function submit() {
  if (props.saving || props.loading || !props.assignment?.task || props.error) return;
  if (completed.value) { await showPopup(); return; }
  refreshClock();
  if (closed.value) { validation.value = 'Приём рекомендаций завершён 17 декабря.'; return; }
  const payload = normalizeFilm(form), error = filmError(payload);
  if (error) {
    validation.value = error.message; invalidField.value = error.field;
    await nextTick(); formElement.value?.querySelector<HTMLElement>(`[name="${error.field}"]`)?.focus(); return;
  }
  validation.value = ''; invalidField.value = ''; emit('submit', payload);
}
watch(() => [props.assignment?.id, props.assignment?.response?.response?.title, props.assignment?.response?.response?.reason], () => {
  const saved = props.assignment?.response?.response;
  form.title = typeof saved?.title === 'string' ? saved.title : '';
  form.reason = typeof saved?.reason === 'string' ? saved.reason : '';
}, { immediate: true });
watch(() => props.assignment?.id, () => { validation.value = ''; invalidField.value = ''; closePopup(); });
watch(completed, (value, previous) => { if (value && previous === false) void showPopup(); });
onMounted(() => {
  observer = new ResizeObserver(entries => { const size = entries[0]?.contentRect; if (size?.width) ratio.value = size.height / size.width; });
  if (background.value) observer.observe(background.value);
  timer = setInterval(refreshClock, 30_000); document.addEventListener('visibilitychange', refreshClock);
});
onBeforeUnmount(() => { observer?.disconnect(); clearInterval(timer); document.removeEventListener('visibilitychange', refreshClock); closePopup(); });
</script>

<template>
  <main class="film-page">
    <div ref="background" class="film-background" aria-hidden="true"><div class="film-gradient" :style="{ transform: gradientTransform }"></div></div>
    <div class="film-layout">
      <header class="film-header"><img :src="wordmark" alt="ГЕРОФАРМ" /><button type="button" @click="emit('back')">← К календарю</button></header>
      <article class="film-panel" :style="{ '--panel-art': cssUrl(panelArt) }" aria-labelledby="film-title">
        <p class="film-date">{{ date }}</p>
        <h1 id="film-title">Новый год начинается<br />с любимого кино</h1>
        <p v-if="loading" class="film-notice" role="status">Загружаем задание…</p>
        <div v-else-if="error" class="film-notice" role="alert"><p>{{ error }}</p><button class="film-button" @click="emit('retry')">Попробовать снова</button></div>
        <p v-else-if="!assignment" class="film-notice">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="film-notice">Задание откроется {{ formatDate(assignment.available_date) }}.</p>
        <template v-else>
          <img class="film-tv" :src="movieTv" alt="Винтажный телевизор с надписью Christmas Movies" />
          <div class="film-copy">
            <p>У каждого есть фильм, без которого трудно представить декабрь. Один помогает почувствовать праздник, другой хочется пересматривать всей семьей, а третий вы советуете каждому при первой возможности.</p>
            <p>Какой новогодний фильм, по вашему мнению, обязательно стоит посмотреть хотя бы раз?</p>
            <p>Напишите название и, если хотите, добавьте пару слов: за что вы его любите и какое настроение он создает.</p>
            <p>В конце адвента поделимся подборкой фильмов от сотрудников ГЕРОФАРМ. Можно будет открыть для себя что-то новое, пересмотреть любимое или выбрать кино для дороги к родным и близким.</p>
          </div>
          <p id="film-deadline" class="film-deadline">*Принимаем названия фильмов до 17 декабря. Это задание необязательное и не влияет на получение подарка.</p>
          <form ref="formElement" class="film-form" novalidate :aria-busy="saving" @submit.prevent="submit" @input="edit">
            <div class="film-field">
              <label for="film-name">Название фильма</label>
              <div class="film-surface" :style="{ '--surface-art': cssUrl(inputArt) }"><input id="film-name" v-model="form.title" name="title" type="text" autocomplete="off" placeholder="Введите название" maxlength="200" :readonly="completed || closed" :disabled="saving" :aria-invalid="invalidField === 'title'" aria-describedby="film-deadline film-feedback" required /></div>
            </div>
            <div class="film-field film-reason">
              <label for="film-reason">Почему советую — необязательно</label>
              <div class="film-surface" :style="{ '--surface-art': cssUrl(textareaArt) }"><textarea id="film-reason" v-model="form.reason" name="reason" maxlength="2000" :readonly="completed || closed" :disabled="saving" :aria-invalid="invalidField === 'reason'" aria-describedby="film-feedback"></textarea></div>
            </div>
            <p v-if="validation || saveError" id="film-feedback" class="film-error" role="alert">{{ validation || saveError }}</p>
            <p v-else-if="closed && !completed" id="film-feedback" class="film-error" role="status">Приём рекомендаций завершён 17 декабря.</p>
            <button class="film-button film-submit" :style="{ backgroundImage: cssUrl(buttonArt) }" type="submit" :disabled="saving || (closed && !completed)"><span>{{ saving ? 'Сохраняем…' : 'Посоветовать фильм' }}</span></button>
          </form>
        </template>
      </article>
      <footer class="film-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </div>
    <dialog ref="dialog" class="film-popup" :style="{ '--popup-art': cssUrl(popupArt) }" aria-labelledby="film-popup-title" aria-describedby="film-popup-copy" @close="unlockScroll" @cancel="unlockScroll">
      <button class="film-close" type="button" aria-label="Закрыть окно «Готово»" @click="closePopup"><img :src="closeArt" alt="" /></button>
      <h2 id="film-popup-title">Готово!</h2>
      <p id="film-popup-copy">Спасибо! Ваш совет поможет собрать нашу новогоднюю киноподборку</p>
      <button class="film-button film-calendar" :style="{ backgroundImage: cssUrl(popupButton) }" type="button" @click="closePopup(); emit('back')">К календарю</button>
    </dialog>
  </main>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.ttf') format('truetype'); font-weight: 400 700; font-display: swap; }
:global(#app:has(.film-page)) { width: 100%; border: 0; }
.film-page { position: relative; isolation: isolate; box-sizing: border-box; width: 100%; min-height: 100svh; overflow: clip; color-scheme: light; color: #623c28; background: #c63d0f; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; }
.film-background { position: absolute; top: 0; left: 0; z-index: -1; width: 100%; height: 103.8722826%; overflow: hidden; pointer-events: none; }
.film-gradient { position: absolute; top: 56.53241251%; left: 46.0559869%; width: 100%; aspect-ratio: 1; transform-origin: center; background: radial-gradient(circle closest-side at center, #ffb451 0%, #f78028 51.442307%, #c63d0f 100%); }
.film-layout { box-sizing: border-box; width: 100%; max-width: 760px; margin-inline: auto; padding: 0 16px 26px; }
.film-header { position: relative; box-sizing: border-box; height: 94px; padding-top: 34px; }
.film-header > img { display: block; margin-inline: auto; }
button { cursor: pointer; font-family: inherit; letter-spacing: 0; }
.film-header button { position: absolute; top: 48px; left: 0; min-height: 44px; padding: 0 8px; border: 0; background: transparent; color: #fff1cf; font: 400 12px/15px 'Advent Inter', sans-serif; }
.film-panel { position: relative; isolation: isolate; box-sizing: border-box; width: 100%; padding: 29px 24px 28px; }
.film-panel::before { content: ''; position: absolute; z-index: -1; inset: 0; border: 24px solid transparent; border-image: var(--panel-art) 24 fill / 24px stretch; pointer-events: none; }
.film-date { margin: 0 0 14px; color: #a7280b; font-size: 12px; line-height: 15px; font-weight: 700; }
.film-panel h1 { margin: 0; color: #623c28; font: 500 28px/30px 'Advent STIX', serif; letter-spacing: 0; }
.film-tv { display: block; width: 100%; height: auto; aspect-ratio: 313 / 262; object-fit: cover; margin-top: 18px; }
.film-copy { margin-top: 28px; color: #836045; }
.film-copy p { margin: 0 0 20px; }
.film-copy p:last-child { margin-bottom: 0; }
.film-deadline { margin-top: 20px; color: #a7280b; font-size: 12px; line-height: 15px; }
.film-form { margin-top: 25px; }
.film-field > label { display: block; margin-bottom: 14px; color: #623c28; font-size: 14px; line-height: 17px; font-weight: 600; }
.film-reason { margin-top: 22px; }
.film-surface { position: relative; isolation: isolate; }
.film-surface::before { content: ''; position: absolute; z-index: -1; inset: -.5px; border: 12px solid transparent; border-image: var(--surface-art) 12 fill / 12px stretch; pointer-events: none; }
.film-surface input, .film-surface textarea { display: block; box-sizing: border-box; width: 100%; min-width: 0; height: 52px; margin: 0; padding: 0 14px; border: 0; border-radius: 12px; background: transparent; color: #623c28; font: 400 13px/18px 'Advent Inter', sans-serif; box-shadow: none; }
.film-surface textarea { height: 153px; padding: 16px 14px; resize: none; }
.film-surface :is(input,textarea)::placeholder { color: #947a62; opacity: 1; }
.film-surface :is(input,textarea):focus-visible { outline: 2px solid #a7280b; outline-offset: 2px; }
.film-surface :is(input,textarea):disabled { opacity: .7; }
.film-button { display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 100%; min-height: 52px; padding: 0 12px; border: 0; border-radius: 13px; background: #a7280b center / 100% 100% no-repeat; color: #fff7df; font: 700 14px/17px 'Advent Inter', sans-serif; text-align: center; }
.film-submit { margin-top: 25px; }
.film-submit span { color: transparent; background-clip: text; background-image: linear-gradient(74.8414deg, #e8b77e .55732%, #ffe6bc 19.578%, #fff0d2 72.836%, #efc087 99.465%); }
.film-button:disabled { opacity: .65; cursor: default; }
.film-button:hover:not(:disabled) { filter: brightness(1.08); }
.film-error { margin-top: 16px; color: #a7280b; font-size: 13px; line-height: 18px; overflow-wrap: anywhere; }
.film-footer { margin-top: 27px; color: #623c28; font-size: 12px; line-height: 15px; text-align: center; }
.film-notice { min-height: 140px; margin-top: 24px; color: #836045; }
.film-notice .film-button { margin-top: 24px; }
.film-popup { position: fixed; isolation: isolate; top: 50%; left: 50%; transform: translate(-50%, -50%); box-sizing: border-box; width: 345px; max-width: calc(100vw - 24px); max-height: calc(100svh - 32px); margin: 0; padding: 28px 24px; border: 0; border-radius: 23px; background: transparent; color: #623c28; font: 400 14px/20px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; overflow-y: auto; }
.film-popup::before { content: ''; position: absolute; z-index: -1; inset: 0; border: 23px solid transparent; border-image: var(--popup-art) 23 fill / 23px stretch; pointer-events: none; }
.film-popup::backdrop { background: rgb(66 35 19 / 55%); }
.film-close { position: absolute; top: 8px; right: 8px; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; }
.film-close img { display: block; }
.film-popup h2 { margin: 0 32px 16px 0; color: #623c28; font: 600 26px/33px 'Advent STIX', serif; letter-spacing: 0; }
#film-popup-copy { margin: 0; color: #836045; font-size: 14px; line-height: 20px; }
.film-calendar { margin-top: 26px; }
button:focus-visible { outline: 2px solid #623c28; outline-offset: 2px; }
@media (max-width: 360px) { .film-layout { padding-inline: 12px; } .film-panel { padding-inline: 18px; } .film-panel h1 { font-size: 26px; } .film-popup { padding-inline: 20px; } }
@media (min-width: 768px) { .film-layout { padding-inline: 32px; } .film-panel { padding-inline: 32px; } .film-tv { width: min(100%, 470px); margin-inline: auto; } }
</style>
