<template>
  <section class="attachments" aria-label="Фотографии">
    <template v-if="!readonly && photos.length < limit">
      <AppButton class="photo-action" variant="outline" type="button" :aria-describedby="hintId"
        :disabled="controlsDisabled" @click="fileInput?.click()">
        {{ photos.length ? 'Добавить ещё фото' : attachLabel }}
      </AppButton>
      <p :id="hintId" class="photo-hint">
        {{ limit === 1 ? 'Одна фотография.' : `До ${limit} фотографий.` }} JPG, PNG или WebP, до 5 МБ на фото.
      </p>
    </template>
    <input v-if="!readonly" ref="fileInput" hidden type="file" :accept="photoTypes"
      :multiple="limit > 1" :disabled="controlsDisabled || photos.length >= limit" @change="uploadSelected" />
    <input v-if="!readonly" ref="replacementInput" hidden type="file" :accept="photoTypes"
      :disabled="controlsDisabled" @change="replacePhoto" />

    <LoadingState v-if="busy" compact :label="busyLabel" />
    <p v-if="message" class="photo-message" role="status">{{ message }}</p>
    <p v-if="errorMessage" class="photo-error" role="alert">{{ errorMessage }}</p>
    <AppButton v-if="reloadNeeded && !busy" class="photo-action" variant="outline" type="button" @click="reload">
      Обновить фотографии
    </AppButton>

    <div v-if="photos.length" class="photos">
      <figure v-for="photo in photos" :key="photo.id">
        <img v-if="photo.url" decoding="async" :src="photo.url" :alt="photo.file_name" />
        <p v-else-if="!busy">Предпросмотр фотографии недоступен.</p>
        <figcaption>{{ photo.file_name }}</figcaption>
        <div v-if="!readonly" class="photo-actions">
          <AppButton variant="outline" type="button" class="photo-action" :disabled="controlsDisabled"
            @click="chooseReplacement(photo.id)">Заменить фото</AppButton>
          <AppButton variant="outline" type="button" class="photo-action" :disabled="controlsDisabled"
            @click="deletePhoto(photo.id)">Удалить фото</AppButton>
        </div>
      </figure>
    </div>
    <p v-else-if="readonly && listLoaded && !busy" class="photo-hint">Фотографии не добавлены.</p>
  </section>
</template>

<script setup lang="ts">
import AppButton from './ui/AppButton.vue';
import LoadingState from './ui/LoadingState.vue';
import { useScreenReadiness } from '../composables/useScreenReadiness';
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import {
  attachmentsService,
  MAX_ATTACHMENTS,
  validatePhoto,
  type TaskAttachment,
} from "../services/attachments.service";

const { track } = useScreenReadiness();

const props = withDefaults(defineProps<{
  taskId: number;
  readonly: boolean;
  disabled: boolean;
  limit?: 1 | typeof MAX_ATTACHMENTS;
  optional?: boolean;
  attachLabel?: string;
}>(), { attachLabel: 'Прикрепить фото', limit: MAX_ATTACHMENTS });

const emit = defineEmits<{
  busy: [value: boolean];
  change: [photos: readonly TaskAttachment[]];
}>();

type Photo = TaskAttachment & { url: string | null };

const photoTypes = 'image/jpeg,image/png,image/webp';
const hintId = useId();
const photos = ref<Photo[]>([]);
const fileInput = ref<HTMLInputElement>();
const replacementInput = ref<HTMLInputElement>();
let replacementId: string | undefined;
const busy = ref(false);
const listLoaded = ref(false);
const busyLabel = ref('');
const reloadNeeded = computed(() => !listLoaded.value || photos.value.some(photo => !photo.url));
const controlsDisabled = computed(() => busy.value || props.disabled || !listLoaded.value);
const errorMessage = ref("");
const message = ref("");

watch(message, (value, _, onCleanup) => {
  if (!value) return;
  const timer = window.setTimeout(() => { message.value = ''; }, 5000);
  onCleanup(() => window.clearTimeout(timer));
});
watch([listLoaded, photos], () => emit('change', listLoaded.value ? photos.value : []));

let disposed = false;

function setBusy(value: boolean, label = '', blockForm = true) {
  if (disposed) return;
  busyLabel.value = label;
  busy.value = value;
  if (blockForm) emit("busy", value);
}

function describeError(error: unknown): string {
  const text =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";

  if (text.includes("Attachment limit reached")) {
    return "Достигнут лимит фотографий. Незавершённая загрузка тоже может временно занимать место.";
  }

  if (text.includes("Task is not available for upload")) {
    return props.optional
      ? "Не удалось прикрепить фото. Историю можно отправить без фотографии."
      : "Задание пока недоступно или уже завершено.";
  }

  if (text.includes("Upload reservation expired")) {
    return "Срок загрузки истёк. Выберите фотографию ещё раз.";
  }

  if (text.includes("Task is not available for modification")) {
    return "Нельзя изменить фотографии: задание закрыто, завершено или неактивно.";
  }

  if (text.includes("Attachment is not ready")) {
    return "Фотография ещё не готова к удалению. Обновите список.";
  }

  if (text.includes("Attachment replacement already pending")) {
    return "Для этого задания уже есть незавершённая замена. Дождитесь истечения её резервации — до 15 минут — и попробуйте снова.";
  }

  if (text.includes("Replacement target is not available")) {
    return "Исходная фотография уже удалена или заменена. Обновите список.";
  }

  if (text.includes("Attachment not found")) {
    return "Фотография не найдена или недоступна. Обновите список.";
  }

  return text || "Не удалось выполнить операцию с фотографиями.";
}

function releasePhotos() {
  for (const photo of photos.value) {
    if (photo.url) URL.revokeObjectURL(photo.url);
  }
  photos.value = [];
}

async function loadPhotos() {
  listLoaded.value = false;

  const attachments = await attachmentsService.list(props.taskId);
  if (disposed) return;

  const previous = new Map(photos.value.map(photo => [photo.id, photo]));
  photos.value = attachments.map(item => {
    const existing = previous.get(item.id);
    previous.delete(item.id);
    if (existing?.storage_path === item.storage_path) return existing;
    if (existing?.url) URL.revokeObjectURL(existing.url);
    return { ...item, url: null };
  });
  for (const photo of previous.values()) if (photo.url) URL.revokeObjectURL(photo.url);
  let previewFailed = false;
  await Promise.all(photos.value.filter(photo => !photo.url).map(async photo => {
    try {
      const blob = await attachmentsService.download(photo.storage_path);
      if (!disposed) photo.url = URL.createObjectURL(blob);
    } catch { previewFailed = true; }
  }));

  if (disposed) return;

  listLoaded.value = true;

  if (previewFailed) {
    errorMessage.value =
      "Часть фотографий не удалось показать. Нажмите «Обновить фотографии».";
  }
}

function chooseReplacement(attachmentId: string) {
  replacementId = attachmentId;
  replacementInput.value?.click();
}

async function replacePhoto(event: Event) {
  const attachmentId = replacementId;
  replacementId = undefined;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";

  if (
    !attachmentId ||
    !file ||
    busy.value ||
    props.readonly ||
    props.disabled ||
    !listLoaded.value
  ) {
    return;
  }

  errorMessage.value = "";
  message.value = "";

  try {
    validatePhoto(file);
  } catch (error) {
    errorMessage.value = describeError(error);
    return;
  }

  setBusy(true, "Заменяем фотографию…");

  try {
    await attachmentsService.replace(attachmentId, file);

    if (!disposed) {
      message.value = "Фотография заменена.";
    }
  } catch (error) {
    if (!disposed) {
      errorMessage.value = describeError(error);
    }
  } finally {
    if (!disposed) {
      await refreshAfterChange();
    }
  }
}

async function deletePhoto(attachmentId: string) {
  if (busy.value || props.readonly || props.disabled) return;

  errorMessage.value = "";
  message.value = "";
  setBusy(true, "Удаляем фотографию…");

  try {
    const removed = await attachmentsService.remove(attachmentId);

    if (!disposed) {
      message.value = removed
        ? "Фотография удалена."
        : "Фотография уже удалена или недоступна.";
    }
  } catch (error) {
    if (!disposed) {
      errorMessage.value = describeError(error);
    }
  } finally {
    if (!disposed) {
      await refreshAfterChange();
    }
  }
}

async function refreshAfterChange() {
  // At this point the mutation has finished. Optional previews can load while the form is submitted.
  if (props.optional) emit('busy', false);
  try {
    await loadPhotos();
  } catch (error) {
    if (!disposed && !errorMessage.value) errorMessage.value = describeError(error);
  } finally {
    setBusy(false, '', !props.optional);
  }
}

async function reload() {
  if (busy.value) return;

  errorMessage.value = "";
  message.value = "";
  setBusy(true, "Загружаем список фотографий…", !props.optional);

  try {
    await loadPhotos();
  } catch (error) {
    if (!disposed) errorMessage.value = describeError(error);
  } finally {
    setBusy(false, '', !props.optional);
  }
}

async function uploadSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";

  if (
    !files.length ||
    busy.value ||
    props.readonly ||
    props.disabled ||
    !listLoaded.value
  ) {
    return;
  }

  errorMessage.value = "";
  message.value = "";

  try {
    // Проверяем весь выбор до первой загрузки.
    for (const file of files) validatePhoto(file);

    const limit = props.limit;
    if (photos.value.length + files.length > limit) {
      if (limit === 1) throw new Error("К заданию можно добавить одну фотографию.");
      throw new Error("К заданию можно добавить максимум 3 фотографии.");
    }
  } catch (error) {
    errorMessage.value = describeError(error);
    return;
  }

  setBusy(true, "Загружаем фотографии…");
  let uploaded = 0;

  try {
    for (const file of files) {
      if (disposed) break;

      await attachmentsService.upload(props.taskId, file);
      uploaded++;
    }
  } catch (error) {
    if (!disposed) errorMessage.value = describeError(error);
  } finally {
    if (!disposed) {
      if (uploaded > 0) {
        message.value = uploaded === 1 ? 'Фотография прикреплена.' : `Прикреплено фотографий: ${uploaded}.`;
      }

      // Показываем и успешно загруженные файлы,
      // если следующая фотография завершилась ошибкой.
      await refreshAfterChange();
    }
  }
}

onMounted(() => {
  const load = reload();
  if (!props.optional) void track(load);
});

onBeforeUnmount(() => {
  disposed = true;
  releasePhotos();
});
</script>

<style scoped>
.attachments { display: grid; min-width: 0; gap: 8px; color: var(--color-ink); font: 400 14px/20px var(--font-ui); }
.photo-action { width: 100%; padding-block: 8px; }
.photo-hint, .photo-message, .photo-error, figcaption { margin: 0; overflow-wrap: anywhere; font-size: 12px; line-height: 17px; }
.photo-error { color: var(--color-action); }
.photos { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: 12px; }
figure { display: grid; min-width: 0; gap: 8px; margin: 0; padding: 10px; border: 1px solid #dcc8a8; border-radius: var(--radius-control); background: var(--color-paper); }
figure img { display: block; width: 100%; height: clamp(128px, 32vw, 210px); object-fit: contain; border-radius: 8px; }
.photo-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.photo-actions .photo-action { flex: 1 1 120px; min-height: 44px; padding-inline: 8px; font-size: 12px; }
</style>
