<script setup lang="ts">
import CalendarReturnButton from './ui/CalendarReturnButton.vue';
import { corporateEmailRequired } from '../utils/email-policy';
import { computed, ref, watch } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import PopupDialog from './PopupDialog.vue';
import envelope from '../assets/dec-16/envelope.svg';
import stamp from '../assets/dec-16/stamp.svg';
import type { DecemberTaskProps } from '../types/december';

const corporateOnly = corporateEmailRequired();

const props = defineProps<DecemberTaskProps & { recipientEmail: string }>();
const emit = defineEmits<{ back: []; retry: []; edit: []; submit: [body: string] }>();
const letter = ref('');
const letterInput = ref<HTMLTextAreaElement>();
const letterError = ref(false);
const success = ref(false);
const completed = computed(() => props.assignment?.status === 'completed');
watch(completed, (done, before) => {
  if (done && before === false) {
    letter.value = '';
    success.value = true;
  }
});

function send() {
  if (props.saving || completed.value) return;
  if (!props.recipientEmail) return;
  letterError.value = !letter.value.trim();
  if (letterError.value) {
    letterInput.value?.focus();
    return;
  }
  emit('submit', letter.value.trim());
}
const scheduledDelivery = computed(() => {
  const due = props.assignment?.response?.response.deliver_on;
  return typeof due === 'string' && Number.isFinite(Date.parse(due))
    ? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Moscow' }).format(new Date(due)) + ' (МСК)'
    : '';
});
</script>

<template>
  <DecemberTaskLayout v-bind="props" title="Письмо себе в будущее" @back="emit('back')" @retry="emit('retry')">
    <img class="future-envelope" :src="envelope" alt="" />
    <div class="december-copy">
      <p>Со временем многое может измениться: одни планы осуществятся, другие уступят место новым. Тем интереснее будет вспомнить, о чем вы думаете и мечтаете сейчас.</p>
      <p>Напишите себе письмо — оно придет на подтверждённую {{ corporateOnly ? 'корпоративную почту' : 'почту' }} вашего аккаунта.</p>
      <p>Расскажите, чем живете сейчас, за что себя благодарите и к чему хотите прийти. Может быть, это будет что-то амбициозное — то, на что вы давно не решались, или напоминание о любимом деле, для которого хочется сохранить побольше времени?</p>
      <p>В тестовом режиме отправка запланирована через 15 минут после сохранения.</p>
    </div>
    <div v-if="completed" class="december-stack future-form">
      <p role="status">Письмо сохранено.</p>
      <p v-if="scheduledDelivery">Запланированная отправка: {{ scheduledDelivery }}.</p>
    </div>
    <form v-else class="december-stack future-form" novalidate @submit.prevent="send">
      <label class="december-field">
        {{ corporateOnly ? 'Моя корпоративная почта' : 'Мой email' }}
        <input :value="recipientEmail" type="email" autocomplete="email" readonly aria-describedby="future-email-help" />
      </label>
      <p id="future-email-help">Подтверждённая почта вашего аккаунта. Получатель выбирается автоматически.</p>
      <p v-if="!recipientEmail" class="december-error" role="alert">Подтвердите почту аккаунта перед сохранением письма.</p>
      <label class="december-field">
        Письмо себе в будущее
        <span class="future-paper">
          <span aria-hidden="true">СЕБЕ · В БУДУЩЕЕ</span>
          <img :src="stamp" alt="" />
          <textarea ref="letterInput" v-model="letter" :aria-invalid="letterError" :disabled="saving"
            placeholder="О чем хотите напомнить будущему себе?" maxlength="6000" required
            @input="letterError = false; emit('edit')" />
        </span>
      </label>
      <p v-if="letterError" class="december-error" role="alert">Напишите письмо перед отправкой.</p>
      <p v-if="saveError" class="december-error" role="alert">{{ saveError }}</p>
      <button class="december-button task-action" :disabled="saving || !recipientEmail">{{ saving ? 'Сохраняем…' : 'Отправить в будущее' }}</button>
    </form>
    <PopupDialog v-model:open="success" class="december-dialog" aria-labelledby="future-success-title">
      <div class="december-stack">
        <button class="december-dialog-close" type="button" aria-label="Закрыть" @click="success = false">×</button>
        <h2 id="future-success-title">Письмо отправилось в будущее!</h2>
        <p>Письмо сохранено для отправки на подтверждённую почту аккаунта.</p>
        <p v-if="scheduledDelivery">Запланированная отправка: {{ scheduledDelivery }}.</p>
        <CalendarReturnButton class="december-button" @click="emit('back')" completed />
      </div>
    </PopupDialog>
  </DecemberTaskLayout>
</template>

<style scoped>
.future-envelope { display: block; max-width: 100%; height: auto; margin: 34px auto; }
.future-form { margin-top: 24px; }
#future-email-help { margin-top: -7px; font-size: 12px; line-height: 17px; }
.future-paper { display: block; position: relative; }
.future-paper > span { position: absolute; top: 15px; left: 15px; color: #9b6746; font-size: 10px; font-weight: 400; pointer-events: none; }
.future-paper > img { position: absolute; top: 15px; right: 16px; pointer-events: none; }
.future-paper textarea { display: block; min-height: 320px; padding-top: 74px; resize: vertical; }
</style>
