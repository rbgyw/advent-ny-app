<template>
  <section class="attachments">
    <h3>Фотографии</h3>

    <p>До 3 фотографий. JPG, PNG или WebP, до 5 МБ каждая.</p>

    <input
      v-if="!readonly"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      :disabled="busy || disabled || !listLoaded"
      aria-label="Выбрать фотографии"
      @change="uploadSelected"
    />

    <p v-if="busy">Обрабатываем фотографии...</p>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="errorMessage" class="error" role="alert">
      {{ errorMessage }}
    </p>

    <button v-if="!busy && errorMessage" type="button" @click="reload">
      Обновить фотографии
    </button>

    <div class="photos">
      <figure v-for="photo in photos" :key="photo.id">
        <img v-if="photo.url" :src="photo.url" :alt="photo.file_name" />
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

        <button
          v-if="!readonly"
          type="button"
          :disabled="busy || disabled"
          @click="deletePhoto(photo.id)"
        >
          Удалить фотографию
        </button>
      </figure>
    </div>

    <p v-if="listLoaded && !busy && photos.length === 0">
      Фотографии пока не добавлены.
    </p>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  attachmentsService,
  MAX_ATTACHMENTS,
  validatePhoto,
  type TaskAttachment,
} from "../services/attachments.service";

const props = defineProps<{
  taskId: number;
  readonly: boolean;
  disabled: boolean;
}>();

const emit = defineEmits<{
  busy: [value: boolean];
}>();

type Photo = TaskAttachment & { url: string | null };

const photos = ref<Photo[]>([]);
const busy = ref(false);
const listLoaded = ref(false);
const errorMessage = ref("");
const message = ref("");

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

  releasePhotos();
  photos.value = attachments.map((item) => ({
    ...item,
    url: null,
  }));

  let previewFailed = false;

  for (const photo of photos.value) {
    try {
      const blob = await attachmentsService.download(photo.storage_path);

      if (disposed) return;
      photo.url = URL.createObjectURL(blob);
    } catch {
      previewFailed = true;
    }
  }

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

    if (photos.value.length + files.length > MAX_ATTACHMENTS) {
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

onMounted(reload);

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
</style>
