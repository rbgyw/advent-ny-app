<script setup lang="ts">
import CalendarReturnButton from './ui/CalendarReturnButton.vue';
import { computed, ref, watch } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import PopupDialog from './PopupDialog.vue';
import envelope from '../assets/dec-16/envelope.svg';
import stamp from '../assets/dec-16/stamp.svg';
import type { DecemberTaskProps, DecemberTaskEvents } from '../types/december';
import { corporateEmailRequired, getEmailError } from '../utils/email-policy';

const corporateOnly = corporateEmailRequired();

const props = defineProps<DecemberTaskProps>();
const emit = defineEmits<DecemberTaskEvents>();
const email = ref('');
const letter = ref('');
const emailInput = ref<HTMLInputElement>();
const letterInput = ref<HTMLTextAreaElement>();
const addressError = ref(false);
const letterError = ref(false);
const success = ref(false);
const completed = computed(() => props.assignment?.status === 'completed');
watch(completed, (done, before) => {
  if (done && before === false) {
    letter.value = '';
    email.value = '';
    success.value = true;
  }
});

function send() {
  if (props.saving || completed.value) return;
  const address = email.value.trim().toLowerCase();
  addressError.value = Boolean(getEmailError(address));
  letterError.value = !letter.value.trim();
  if (addressError.value) {
    emailInput.value?.focus();
    return;
  }
  if (letterError.value) {
    letterInput.value?.focus();
    return;
  }
  emit('save', { response: { email: address, text: letter.value.trim(), deliver_on: '2027-12-31' }, complete: true });
}
</script>

<template>
  <DecemberTaskLayout v-bind="props" title="Письмо себе в будущее" @back="emit('back')" @retry="emit('retry')">
    <img class="future-envelope" :src="envelope" alt="" />
    <div class="december-copy">
            <p>За год многое может измениться: одни планы осуществятся, другие уступят место новым. Тем интереснее будет вспомнить, о чем вы думаете и мечтаете сейчас, в декабре 2026-го.</p>
            <p>Напишите себе письмо — оно придет на вашу {{ corporateOnly ? 'корпоративную почту' : 'почту' }} в декабре 2027 года.</p>
            <p>Расскажите, чем живете сейчас, за что себя благодарите и к чему хотите прийти. Может быть, это будет что-то амбициозное — то, на что вы давно не решались, или напоминание о любимом деле, для которого хочется сохранить побольше времени?</p>
            <p>Укажите {{ corporateOnly ? 'свою корпоративную почту' : 'свой email' }} и в канун 2028 года оно вернется к вам.</p>
    </div>
    <div v-if="completed" class="december-stack future-form">
      <p role="status">Письмо сохранено.</p>

    </div>
    <form v-else class="december-stack future-form" novalidate @submit.prevent="send">
      <label class="december-field">
        {{ corporateOnly ? 'Моя корпоративная почта' : 'Мой email' }}
        <input ref="emailInput" v-model="email" type="email" autocomplete="email" maxlength="254" placeholder="ivan.ivanov@geropharm.com"
          aria-describedby="future-email-help" :aria-invalid="addressError" :disabled="saving" required
          @input="addressError = false; emit('edit')" />
      </label>
      <p id="future-email-help">{{ corporateOnly ? 'Укажите свою корпоративную почту ГЕРОФАРМ. На другие адреса волшебное письмо отправить не получится.' : 'Укажите свой корректный email. Для тестирования разрешены любые домены.' }}</p>
      <p v-if="addressError" class="december-error" role="alert">{{ corporateOnly ? 'Проверьте адрес: нужна ваша корпоративная почта ГЕРОФАРМ.' : 'Укажите корректный email-адрес.' }}</p>
      <label class="december-field">
        Письмо себе в будущее
        <span class="future-paper">
          <span aria-hidden="true">СЕБЕ · В КАНУН 2028 ГОДА</span>
          <img :src="stamp" alt="" />
          <textarea ref="letterInput" v-model="letter" :aria-invalid="letterError" :disabled="saving"
            placeholder="О чем хотите напомнить себе через год?" maxlength="6000" required
            @input="letterError = false; emit('edit')" />
        </span>
      </label>
      <p v-if="letterError" class="december-error" role="alert">Напишите письмо перед отправкой.</p>
      <p v-if="saveError" class="december-error" role="alert">{{ saveError }}</p>
      <button class="december-button task-action" :disabled="saving">{{ saving ? 'Сохраняем…' : 'Отправить в будущее' }}</button>
    </form>
    <PopupDialog v-model:open="success" class="december-dialog" aria-labelledby="future-success-title">
      <div class="december-stack">
        <button class="december-dialog-close" type="button" aria-label="Закрыть" @click="success = false">×</button>
        <h2 id="future-success-title">Письмо отправилось в будущее!</h2>
        <p>Письмо сохранено для отправки на указанную {{ corporateOnly ? 'корпоративную почту' : 'почту' }} в канун 2028 года.</p>
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
