
<script setup lang="ts">
import { computed, ref } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import TaskAttachments from './TaskAttachments.vue';
import type { TaskAttachment } from '../services/attachments.service';
import type { DecemberTaskProps, DecemberTaskEvents } from '../types/december';

const props = defineProps<DecemberTaskProps>();
const emit = defineEmits<DecemberTaskEvents>();

const photos = import.meta.glob<string>(
  '../assets/dec-17/*.{jpg,JPG,jpeg,JPEG,png,PNG,webp,WEBP}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
);

const references = Object.entries(photos)
  .filter(([path]) => /\/\d+\.(jpg|jpeg|png|webp)$/i.test(path))
  .map(([path, url]) => {
    const filename = path.split('/').at(-1)!;
    const number = Number(filename.split('.')[0]);

    return {
      id: `photo-${number}`,
      number,
      url,
      alt: `Кадр из фотоподборки № ${number}`,
    };
  })
  .sort((a, b) => a.number - b.number);

const index = ref(-1);
const files = ref<readonly TaskAttachment[]>([]);
const attachmentBusy = ref(false);
const invalid = ref(false);

const response = computed(() => props.assignment?.response?.response);
const completed = computed(() => props.assignment?.status === 'completed');
const pending = computed(() => response.value?.submitted_for_review === true);
const reference = computed(() => references[index.value]);
const busy = computed(() => props.saving || attachmentBusy.value);

function chooseFrame() {
  if (!references.length) return;

  index.value = (index.value + 1) % references.length;
  emit('edit');
}

function updatePhotos(photos: readonly TaskAttachment[]) {
  files.value = photos;
  if (photos.length) invalid.value = false;
}

function submit() {
  if (busy.value || !reference.value || pending.value) return;

  const photo = files.value[0];

  if (!photo) {
    invalid.value = true;
    return;
  }

  emit('save', {
    response: {
      attachment_id: photo.id,
      reference_id: reference.value.id,
      submitted_for_review: true,
    },
    complete: false,
  });
}
</script>

<template>
  <DecemberTaskLayout v-bind="props" title="Повтори, если сможешь!" :result="completed || pending" :finished="completed || pending" mandatory @back="emit('back')" @retry="emit('retry')">
    <div v-if="!completed && !pending" class="december-copy">
            <p>В середине декабря список рабочих задач и домашних дел обычно растет быстрее, чем сокращается. За отчетами, встречами и подготовкой к праздникам не всегда найдется время на фотографии с коллегами. Сегодня это можно исправить!</p>
            <p>Нажмите «Сделать фото», соберите желающих и повторите предложенный кадр: позу, выражение лица или композицию. Не подходит референс? Нажмите «Другой кадр», появится новое фото.</p>
            <p>Если фотографировались вместе с коллегами, каждый участник снимка может загрузить его в свою форму — общее фото зачтется каждому, кто его отправит.</p>
      <p class="photo-required">* Загрузите готовую фотографию в форму. Это обязательное задание.</p>
    </div>
    <div v-if="completed || pending" class="december-stack photo-form">
      <h2>{{ completed ? 'Задание выполнено' : 'Фото отправлено!' }}</h2>
      <p v-if="!completed" class="photo-status" role="status">На проверке</p>
      <p v-if="!completed">После проверки результат появится в вашем прогрессе.</p>

    </div>
    <div v-else-if="!reference" class="photo-form">
      <button class="december-button task-action" type="button" @click="chooseFrame">Сделать фото</button>
    </div>
    <form v-else-if="assignment" class="december-stack photo-form" :aria-busy="busy" @submit.prevent="submit">
      <img class="photo-reference" :src="reference.url" :alt="reference.alt" />
      <button class="december-button secondary task-action" type="button" :disabled="busy" @click="chooseFrame">Другой кадр</button>
      <div>
        <TaskAttachments :task-id="assignment.task_id" :readonly="false" :disabled="saving" :limit="1"
          @busy="attachmentBusy = $event" @change="updatePhotos" />
      </div>
      <p v-if="invalid || saveError" class="december-error" role="alert">{{ invalid ? 'Прикрепите готовую фотографию.' : saveError }}</p>
      <button class="december-button task-action" :disabled="busy">{{ saving ? 'Отправляем…' : 'Отправить' }}</button>
    </form>

  </DecemberTaskLayout>
</template>

<style scoped>
.photo-form { margin-top: 28px; }
:deep(.december-card--result) .photo-form { margin-top: 0; }
:deep(h1) { max-width: 230px; }
.photo-reference { display: block; width: auto; height: auto; max-width: 100%; max-height: min(480px, 65svh); margin-inline: auto; object-fit: contain; border-radius: 13px; background: transparent; }
.photo-required { color: var(--dec-red); }
</style>
