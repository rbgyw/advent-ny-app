<template>
  <section class="attachments" :class="{ 'attachments-styled': styled }">
    <h3 v-if="!styled">Фотографии</h3>

    <p v-if="variant !== 'sport'" :class="{ 'visually-hidden': styled }" :id="hintId">До 3 фотографий. JPG, PNG или WebP, до 5 МБ каждая.</p>
    <p v-else :id="hintId" class="visually-hidden">Одна фотография JPG, PNG или WebP до 5 МБ.</p>

    <AppButton
      v-if="styled && !readonly && (variant !== 'sport' || !photos.length)"
      class="attach-button"
      type="button"
      :disabled="busy || disabled || !listLoaded"
      :aria-describedby="hintId"
      @click="fileInput?.click()"
    >{{ uploadLabel ?? (variant === 'sport' ? 'Загрузить фотографию' : '＋ Прикрепить фотографии') }}</AppButton>

    <input
      v-if="!readonly"
      ref="fileInput"
      :class="{ 'visually-hidden': styled }"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      :multiple="variant !== 'sport'"
      :tabindex="styled ? -1 : undefined"
      :aria-hidden="styled || undefined"
      :disabled="busy || disabled || !listLoaded"
      aria-label="Выбрать фотографии"
      @change="uploadSelected"
    />

    <LoadingState v-if="busy" compact label="Обрабатываем фотографии…" />
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="errorMessage" class="error" role="alert">
      {{ errorMessage }}
    </p>

    <AppButton v-if="!busy && errorMessage" type="button" @click="reload">
      Обновить фотографии
    </AppButton>

    <div v-if="!styled || photos.length" class="photos">
      <figure v-for="photo in photos" :key="photo.id">
        <img loading="lazy" decoding="async" v-if="photo.url" :src="photo.url" :alt="photo.file_name" />
        <p v-else>Не удалось загрузить предпросмотр.</p>

        <figcaption>{{ photo.file_name }}</figcaption>

        <label v-if="!readonly" class="replacement">
          Заменить фотографию

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            :disabled="busy || disabled || !listLoaded"
            @change="replacePhoto(photo.id, $event)"
          />
        </label>

        <AppButton
          v-if="!readonly"
          type="button"
          :disabled="busy || disabled"
          @click="deletePhoto(photo.id)"
        >
          Удалить фотографию
        </AppButton>
      </figure>
    </div>

    <p v-if="!styled && listLoaded && !busy && photos.length === 0">
      Фотографии пока не добавлены.
    </p>
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
  variant?: 'default' | 'memory' | 'sport';
  uploadLabel?: string;
}>(), { variant: 'default' });

const emit = defineEmits<{
  busy: [value: boolean];
  change: [photos: readonly TaskAttachment[]];
}>();

type Photo = TaskAttachment & { url: string | null };

const styled = computed(() => props.variant !== 'default');
const hintId = useId();
const photos = ref<Photo[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const busy = ref(false);
const listLoaded = ref(false);
const errorMessage = ref("");
const message = ref("");

watch([listLoaded, photos], () => emit('change', listLoaded.value ? photos.value : []));

let disposed = false;

function setBusy(value: boolean) {
  if (disposed) return;
  busy.value = value;
  emit("busy", value);
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
    return "Задание пока недоступно или уже завершено.";
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

async function replacePhoto(attachmentId: string, event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";

  if (
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

  setBusy(true);

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
      try {
        await loadPhotos();
      } catch (error) {
        if (!disposed) {
          errorMessage.value = describeError(error);
        }
      }

      setBusy(false);
    }
  }
}

async function deletePhoto(attachmentId: string) {
  if (busy.value || props.readonly || props.disabled) return;

  errorMessage.value = "";
  message.value = "";
  setBusy(true);

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
      try {
        await loadPhotos();
      } catch (error) {
        if (!disposed) {
          errorMessage.value = describeError(error);
        }
      }

      setBusy(false);
    }
  }
}

async function reload() {
  if (busy.value) return;

  errorMessage.value = "";
  message.value = "";
  setBusy(true);

  try {
    await loadPhotos();
  } catch (error) {
    if (!disposed) errorMessage.value = describeError(error);
  } finally {
    setBusy(false);
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

    const limit = props.variant === 'sport' ? 1 : MAX_ATTACHMENTS;
    if (photos.value.length + files.length > limit) {
      if (limit === 1) throw new Error("К заданию можно добавить одну фотографию.");
      throw new Error("К заданию можно добавить максимум 3 фотографии.");
    }
  } catch (error) {
    errorMessage.value = describeError(error);
    return;
  }

  setBusy(true);
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
        message.value = `Фотографий сохранено: ${uploaded}.`;
      }

      // Показываем и успешно загруженные файлы,
      // если следующая фотография завершилась ошибкой.
      try {
        await loadPhotos();
      } catch (error) {
        if (!disposed) {
          errorMessage.value = describeError(error);
        }
      }

      setBusy(false);
    }
  }
}

onMounted(() => { void track(reload()); });

onBeforeUnmount(() => {
  disposed = true;
  releasePhotos();
});
</script>

<style scoped>
.attachments {
  margin: 24px 0;
}

.photos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

figure {
  margin: 0;
  min-width: 0;
}

img {
  display: block;
  width: 100%;
  height: 180px;
  object-fit: contain;
  border-radius: 8px;
  background: #f3f4f6;
}

figcaption {
  margin-top: 8px;
  overflow-wrap: anywhere;
}

.error {
  color: #dc2626;
}

.replacement {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}

.attachments-styled { margin: 0; font: inherit; color: #836045; }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.attach-button { display: block; box-sizing: border-box; width: 100%; min-height: 52px; margin: 0; padding: 8px 16px; border: 1px solid var(--attachment-border, #dcc8a8); border-radius: 13px; background: var(--attachment-background, #fffaf0); color: #a7280b; font: 700 14px/17px 'Advent Inter', sans-serif; cursor: pointer; }
.attach-button:disabled { opacity: .65; cursor: default; }
.attach-button:focus-visible { outline: 2px solid #623c28; outline-offset: 2px; }
.attachments-styled .photos { grid-template-columns: repeat(auto-fit, minmax(min(100%, 120px), 1fr)); gap: 12px; }
.attachments-styled .photos img { height: 140px; background: #f8e8c8; }
.attachments-styled .photos figcaption { font-size: 12px; line-height: 18px; }
.attachments-styled .photos button, .attachments-styled > button:not(.attach-button) { padding: 8px 10px; border: 1px solid #dcc8a8; border-radius: 8px; background: #fffaf0; color: #a7280b; font: inherit; cursor: pointer; }
.attachments-styled .photos button:disabled { opacity: .6; cursor: default; }
.attachments-styled .replacement { font-size: 12px; }
.attachments-styled .replacement input { max-width: 100%; }
</style>
