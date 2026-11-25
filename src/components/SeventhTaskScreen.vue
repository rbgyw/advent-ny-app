<script setup lang="ts">
import TaskContainer from './ui/TaskContainer.vue';
import CalendarReturnButton from './ui/CalendarReturnButton.vue';
import TaskDateLabel from './ui/TaskDateLabel.vue';
import { computed, nextTick, ref, watch } from 'vue';
import PopupDialog from './PopupDialog.vue';
import TaskAttachments from './TaskAttachments.vue';
import wordmark from '../assets/first-task/wordmark.svg';
import wreath from '../assets/sports/wreath.svg';
import pose01 from '../assets/sports/team-pose-01.png';
import pose02 from '../assets/sports/team-pose-02.png';
import pose03 from '../assets/sports/team-pose-03.png';
import pose04 from '../assets/sports/team-pose-04.png';
import { isSportLevel, isTeamPose, sportLevels, teamPoses, type SportLevel, type SportSubmission } from '../content/sport-task';
import type { TaskAttachment } from '../services/attachments.service';
import type { CalendarTask } from '../types/models';
import { formatDate } from '../utils/date';

const props = defineProps<{
  assignment?: CalendarTask;
  day: number;
  total: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
}>();
const answer = defineModel<string>({ required: true });
const emit = defineEmits<{
  back: [];
  retry: [];
  choose: [level: SportLevel];
  submit: [submission: SportSubmission];
  edit: [];
}>();

const poseImages = { '01': pose01, '02': pose02, '03': pose03, '04': pose04 };
const choice = ref<SportLevel>('basic');
const confirmOpen = ref(false);
const attachmentId = ref<string>();
const uploadBusy = ref(false);
const validation = ref('');
const heading = ref<HTMLHeadingElement>();
const response = computed(() => props.assignment?.response?.response);
const level = computed(() => isSportLevel(response.value?.level) ? response.value.level : undefined);
const selected = computed(() => level.value && sportLevels[level.value]);
const completed = computed(() => props.assignment?.status === 'completed');
const pending = computed(() => response.value?.submitted_for_review === true);
const busy = computed(() => props.saving || uploadBusy.value);
const posesVisible = ref(false);
const poseIndex = ref(isTeamPose(response.value?.team_pose) ? teamPoses.indexOf(response.value.team_pose) : 0);
const pose = computed(() => teamPoses[poseIndex.value]!);
const title = computed(() => {
  if (completed.value) return 'Задание выполнено';
  if (pending.value) return 'Фото получено';
  return selected.value?.title ?? 'Движение в вашем ритме';
});

watch(title, async () => {
  await nextTick();
  heading.value?.focus();
});

function openConfirmation(level: SportLevel) {
  emit('edit');
  choice.value = level;
  confirmOpen.value = true;
}

function confirmLevel() {
  confirmOpen.value = false;
  emit('choose', choice.value);
}

function changePose(offset: number) {
  poseIndex.value = (poseIndex.value + offset + teamPoses.length) % teamPoses.length;
  emit('edit');
}

function updatePhotos(photos: readonly TaskAttachment[]) {
  attachmentId.value = photos[0]?.id;
  if (attachmentId.value) validation.value = '';
}

function submit() {
  if (busy.value || !level.value) return;
  if (!attachmentId.value) {
    validation.value = 'Загрузите фотографию перед отправкой на проверку.';
    return;
  }
  emit('submit', {
    attachmentId: attachmentId.value,
    ...(level.value === 'team' && { teamPose: pose.value }),
  });
}
</script>

<template>
  <main class="sport-page">
    <TaskContainer class="sport-layout">
      <header class="sport-header">
        <img :src="wordmark" alt="ГЕРОФАРМ" />
        <CalendarReturnButton class="sport-back" @click="emit('back')" placement="header" />
      </header>
      <article class="sport-card" aria-labelledby="sport-title">
        <header class="sport-card-header">
          <div>
            <TaskDateLabel class="sport-date" :available-date="assignment?.available_date" :day="day" />
            <h1 id="sport-title" ref="heading" tabindex="-1">{{ title }}</h1>
            <p v-if="!pending && !completed" class="sport-badge">Обязательное задание</p>
          </div>
          <img :src="wreath" alt="" class="sport-wreath" />
        </header>

        <p v-if="loading" class="sport-notice" role="status">Загружаем задание…</p>
        <div v-else-if="error" class="sport-notice">
          <p role="alert">{{ error }}</p>
          <button class="sport-button" type="button" @click="emit('retry')">Попробовать ещё раз</button>
        </div>
        <p v-else-if="!assignment" class="sport-notice" role="status">Задание не найдено.</p>
        <p v-else-if="!assignment.task" class="sport-notice" role="status">Задание пока закрыто. Откроется {{ formatDate(assignment.available_date) }}.</p>

        <div v-else-if="completed || pending" class="sport-result" role="status">
          <template v-if="!completed">
            <p>Мы проверим его и после одобрения отметим задание как выполненное.</p>
            <p class="sport-status">На проверке</p>
          </template>

        </div>

        <template v-else-if="selected">
          <p class="sport-status">{{ selected.name }} · Уровень выбран</p>
          <div class="sport-copy">
            <p v-for="paragraph in selected.instructions" :key="paragraph">{{ paragraph }}</p>
          </div>

          <button v-if="level === 'team' && !posesVisible" class="sport-button sport-get-task" type="button" @click="posesVisible = true">Получить задание</button>
          <section v-if="level === 'team' && posesVisible" class="sport-poses" aria-label="Выбор командной позы">
            <div class="sport-pose">
              <img :src="poseImages[pose]" :alt="`Командная поза ${poseIndex + 1}`" />
            </div>
            <nav class="sport-pose-nav" aria-label="Позы">
              <button type="button" :disabled="busy" @click="changePose(-1)">← Предыдущий</button>
              <output aria-live="polite">{{ poseIndex + 1 }} / {{ teamPoses.length }}</output>
              <button type="button" :disabled="busy" @click="changePose(1)">Следующий →</button>
            </nav>
          </section>

          <form v-if="level !== 'team' || posesVisible" class="sport-form" :aria-busy="busy" @submit.prevent="submit">
            <TaskAttachments
              :task-id="assignment.task_id"
              :readonly="false"
              :disabled="saving"
              :limit="1"
              @busy="uploadBusy = $event"
              @change="updatePhotos"
            />
            <label v-if="level !== 'team'" class="sport-description" :class="{ 'sport-description-basic': level === 'basic' }">
              Если хотите, добавьте описание к фото
              <textarea v-model="answer" :disabled="saving" placeholder="Добавьте описание" @input="emit('edit')" />
            </label>
            <p v-if="level !== 'basic'" class="sport-publication">
              {{ level === 'advanced' ? 'Загружая фотографию, вы соглашаетесь на её публикацию в подборке ГЕРОФАРМ LIFE в Telegram и MAX' : 'Фотография попадет в подборку ГЕРОФАРМ LIFE в Telegram и Max. Убедитесь, что все участники снимка согласны на публикацию.' }}
            </p>
            <p v-if="validation || saveError" class="sport-error" role="alert">{{ validation || saveError }}</p>
            <button class="sport-button" type="submit" :disabled="busy">{{ saving ? 'Отправляем…' : level === 'basic' ? 'Отправить фотографию' : 'Отправить на проверку' }}</button>
          </form>
        </template>

        <template v-else>
          <div class="sport-copy sport-intro">
            <p>«Мышление долголетия» начинается с привычек, которые помогают оставаться активными. Сегодня нас ждет спортивное задание.</p>
            <p>На выбор есть 3 уровня: базовый, продвинутый и командный челлендж. Для выполнения обязательного задания достаточно пройти один из них.</p>
          </div>
          <p class="sport-warning">Внимательно прочитайте подсказки: <span>после выбора поменять уровень уже не получится!</span></p>
          <p v-if="saveError" class="sport-error" role="alert">{{ saveError }}</p>
          <div class="sport-levels">
            <section v-for="(item, key) in sportLevels" :key="key" class="sport-level">
              <h2>{{ item.name }}</h2>
              <p>{{ item.summary }}</p>
              <button class="sport-button" type="button" :disabled="saving" @click="openConfirmation(key)">{{ item.button }}</button>
            </section>
          </div>
        </template>
        <CalendarReturnButton v-if="!loading && !error && assignment?.task" class="sport-calendar" :completed="completed || pending" @click="emit('back')" />
      </article>
      <footer class="sport-footer">{{ day }} / {{ total || 25 }} · Новогодний адвент</footer>
    </TaskContainer>

    <PopupDialog
      v-model:open="confirmOpen"
      class="sport-dialog"
      aria-labelledby="sport-confirm-title"
      aria-describedby="sport-confirm-copy"
    >
      <button class="sport-close" type="button" aria-label="Закрыть" @click="confirmOpen = false">×</button>
      <h2 id="sport-confirm-title">Подтвердите уровень</h2>
      <p id="sport-confirm-copy">Вы выбираете {{ sportLevels[choice].name }}. После подтверждения изменить выбор не получится.</p>
      <button class="sport-button" type="button" autofocus @click="confirmLevel">Подтвердить выбор</button>
      <button class="sport-button sport-secondary" type="button" @click="confirmOpen = false">Я передумал(а)</button>
    </PopupDialog>
  </main>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.woff2') format('woff2'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Advent STIX'; src: url('../assets/splash/STIXTwoText.woff2') format('woff2'); font-weight: 400 700; font-display: swap; }

:global(#app:has(.sport-page)) { width: 100%; border: 0; }
.sport-page {
  --sport-red: #a7280b;
  --sport-ink: #623c28;
  --sport-paper: #fcf6e8;
  --sport-gold: linear-gradient(90deg, #e8b77e, #ffe6bc 19.23%, #fff0d2 73.08%, #efc087);
  width: 100%;
  min-height: 100svh;
  background: linear-gradient(to bottom right, #090807, #291209 22%, #743012 48%, #cf5515 73%, #ff941f);
  color: #70492c;
  color-scheme: light;
  font: 400 14px/20px 'Advent Inter', sans-serif;
  letter-spacing: 0;
  text-align: left;
}
.sport-layout { max-width: 760px; margin-inline: auto; padding: 0 16px 24px; }
.sport-header { box-sizing: border-box; padding: 34px 8px 0; }
.sport-header img { display: block; margin-inline: auto; }
.sport-back { min-height: 47px; padding: 0; border: 0; background: transparent; color: #fff1cf; font: 400 12px/15px 'Advent Inter', sans-serif; cursor: pointer; }
.sport-card {
  position: relative;
  padding: 29px clamp(18px, 6.11vw, 24px) 28px;
  border-radius: 24px;
  background: var(--sport-gold);
  overflow-wrap: anywhere;
}
.sport-card::before {
  --dot: radial-gradient(circle, var(--sport-red) 1.25px, transparent 1.65px);
  position: absolute;
  inset: 4px;
  border-radius: 19px;
  background:
    var(--dot) center top / 11px 4px round no-repeat,
    var(--dot) center bottom / 11px 4px round no-repeat,
    var(--dot) left center / 4px 11px no-repeat round,
    var(--dot) right center / 4px 11px no-repeat round;
  content: '';
  pointer-events: none;
}
.sport-card-header { position: relative; }
.sport-card-header > div { min-width: 0; }
.sport-wreath { position: absolute; top: -4px; right: 0; }
.sport-date { margin-bottom: 12px; padding-right: 52px; color: var(--sport-red); font-size: 12px; font-weight: 700; line-height: 15px; }
h1, h2 { margin: 0; color: var(--sport-ink); font-family: 'Advent STIX', serif; font-weight: 500; letter-spacing: 0; }
h1 { max-width: min(100%, 420px); padding-right: 40px; font-size: 28px; line-height: 30px; }
h2 { font-size: 20px; line-height: 25px; }
.sport-badge { display: inline-block; margin-top: 12px; padding: 5px 8px; border-radius: 5px; background: var(--sport-red); color: #fff0d2; font-size: 11px; line-height: 15px; }
.sport-copy { display: grid; gap: 20px; }
.sport-intro { margin-top: 24px; }
.sport-warning { margin: 24px 4px 0; padding: 10px 14px; border-left: 3px solid var(--sport-red); border-radius: 2px 8px 8px 2px; background: rgb(255 250 240 / 65%); font-size: 12px; line-height: 16px; }
.sport-warning span, .sport-error, .sport-status { color: var(--sport-red); }
.sport-levels { display: grid; gap: 16px; margin: 26px 4px 8px; }
.sport-level { display: flex; flex-direction: column; padding: 14px 17px 16px; border: 1px solid var(--sport-red); border-radius: 17px; background: rgb(255 250 240 / 53%); }
.sport-level p { flex: 1; margin: 12px 0 20px; }
.sport-button {
  width: 100%;
  min-height: 52px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 13px;
  background: var(--sport-red);
  color: #fff0d2;
  font: 700 14px/17px 'Advent Inter', sans-serif;
  cursor: pointer;
}
.sport-button:not(:disabled):hover { background: #962107; }
button:disabled { opacity: .65; cursor: default; }
button:focus-visible, textarea:focus-visible { outline: 2px solid var(--sport-ink); outline-offset: 2px; }
.sport-status { margin: 18px 0 12px; font-size: 12px; line-height: 16px; }
.sport-get-task { margin-top: 24px; }
.sport-form { display: grid; gap: 16px; margin-top: 24px; }
.sport-description { display: grid; gap: 8px; font-weight: 700; }
.sport-description textarea { box-sizing: border-box; width: 100%; min-height: 132px; padding: 14px; border: 1px solid #dcc8a8; border-radius: 14px; background: var(--sport-paper); color: var(--sport-ink); font: 400 14px/20px 'Advent Inter', sans-serif; resize: vertical; }
.sport-description textarea::placeholder { color: #947a62; }
.sport-description-basic textarea { min-height: 173px; }
.sport-publication { font-size: 12px; line-height: 18px; }
.sport-poses { max-width: 460px; margin: 18px auto 0; }
.sport-pose { aspect-ratio: 312 / 260; overflow: hidden; border-radius: 17px; background: white; }
.sport-pose img { display: block; width: 100%; height: 100%; object-fit: cover; }
.sport-pose-nav { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; line-height: 15px; }
.sport-pose-nav button { min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--sport-red); font: inherit; font-weight: 700; cursor: pointer; }
.sport-poses + .sport-form { margin-top: 10px; }
.sport-result, .sport-notice { margin-top: 24px; }
.sport-result .sport-status { margin: 22px 0 24px; }
.sport-notice button { margin-top: 16px; }
.sport-error { margin-top: 8px; }
.sport-footer { margin-top: 27px; color: #fff1cf; font-size: 12px; line-height: 15px; text-align: center; }
.sport-dialog {
  position: fixed;
  inset: min(27vh, 271px) 0 auto;
  box-sizing: border-box;
  width: min(345px, calc(100% - 32px));
  max-height: calc(100% - min(27vh, 271px) - 16px);
  margin: 0 auto;
  padding: 28px 23px 30px;
  border: 1px solid var(--sport-red);
  border-radius: 23px;
  background: var(--sport-gold);
  color: #836045;
}
.sport-dialog::backdrop { background: rgb(66 35 19 / 55%); }
.sport-dialog h2 { padding-right: 20px; font-size: 28px; line-height: 30px; }
.sport-dialog p { margin: 16px 0 26px; }
.sport-secondary { margin-top: 9px; background: var(--sport-paper); color: var(--sport-red); }
.sport-secondary:not(:disabled):hover { background: #fff0d2; }
.sport-close { position: absolute; top: 4px; right: 8px; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--sport-ink); font: 400 24px/1 'Advent Inter', sans-serif; cursor: pointer; }
@media (min-width: 700px) {
  .sport-card { padding-inline: 32px; }
  .sport-levels { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.sport-calendar { margin-top: 24px; }
</style>
