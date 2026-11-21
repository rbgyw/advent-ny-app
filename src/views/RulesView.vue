<script setup lang="ts">
import PageLayout from '../components/ui/PageLayout.vue';
import AppHeader from '../components/ui/AppHeader.vue';
import AppCard from '../components/ui/AppCard.vue';
import { RouterLink } from 'vue-router';

import windowExample from '../assets/rules/window-example.svg';
</script>

<template>
  <PageLayout background-variant="warm" class="rules-page">
    <div class="rules-layout">
      <AppHeader class="rules-header">
        <RouterLink class="rules-back" to="/" aria-label="Вернуться к заставке">‹</RouterLink>
        <p class="rules-brand">ГЕРОФАРМ</p>
        <p class="rules-eyebrow">КАК УЧАСТВОВАТЬ</p>
        <h1>Пусть начнётся<br />волшебство</h1>
      </AppHeader>

      <AppCard class="rules-card" aria-label="Правила участия">
        <div class="rules-dates">
          <strong>1–25 декабря</strong>
          <span>Новое задание каждый день</span>
        </div>

        <h2>Дорогие коллеги, поздравляем вас с наступающим Новым годом!</h2>
        <p>Декабрь — время приятных хлопот, теплых воспоминаний и предвкушения праздника. Предлагаем провести его вместе: вспомнить яркие моменты уходящего года, пообщаться с коллегами и зарядиться новогодним настроением. Для этого мы и подготовили адвент-календарь.</p>
        <p>С 1 по 25 декабря каждый день будет открываться новое окошко с заданием или сюрпризом. Вас ждут головоломки, игры, творческие задания и маленькие поводы улыбнуться.</p>
        <p>Участвуйте в своем темпе и выбирайте активности по настроению. А если хотите получить памятный подарок, правильно выполните <strong>все обязательные задания</strong> — для них предусмотрены <strong>золотые окна с красной окантовкой. Их выполнение будет отражаться</strong> в вашем прогрессе.</p>

        <aside class="rules-required">
          <img :src="windowExample" alt="Пример обязательного задания" />
          <div>
            <p>Так выглядят<br /><strong>обязательные задания</strong></p>
            <span>Золотые окна с красной окантовкой</span>
          </div>
        </aside>

        <div class="rules-gift">
          <p class="rules-gift-label">Подарок от ГЕРОФАРМ</p>
          <p><strong>Первые 500 участников, правильно</strong> выполнивших <strong>все обязательные задания, получат подарок от</strong> ГЕРОФАРМ.</p>
        </div>

        <p>Подсказки к некоторым заданиям мы будем публиковать в каналах ГЕРОФАРМ LIFE в <strong>Telegram и MAX.</strong></p>
        <p>Пусть этот декабрь станет немного теплее, веселее и волшебнее. Начнем?</p>

        <RouterLink class="rules-register" :to="{ name: 'auth', query: { mode: 'register' } }">Зарегистрироваться</RouterLink>
      </AppCard>
    </div>
  </PageLayout>
</template>

<style scoped>
:global(#app:has(.rules-page)) { width: 100%; border: 0; }
.rules-page {
  min-height: 100svh;
  color: var(--color-auth-ink);
  
  color-scheme: light;
  font: 400 14px/22px var(--font-ui);
  letter-spacing: 0;
  text-align: left;
}
.rules-layout { max-width: 393px; margin: 0 auto; padding: 0 16px 16px; box-sizing: border-box; }
.rules-header { position: relative; text-align: center; color: #f9e8ba; padding: 26px 0 20px; }
.rules-brand { margin: 0; font-size: 18px; line-height: 22px; letter-spacing: .6px; }
.rules-back { position: absolute; left: 0; top: 12px; display: grid; place-items: center; width: 32px; height: 44px; font: 300 34px/1 var(--font-ui); color: inherit; text-decoration: none; }
.rules-eyebrow { margin: 24px 0 4px; font-size: 10px; line-height: 14px; }
.rules-header h1 { margin: 0; color: inherit; font: 400 32px/35px var(--font-display); letter-spacing: 0; }
.rules-card { border-radius: 24px; background: var(--color-paper); padding: 26px 24px 32px; }
.rules-card p { margin: 0 0 22px; }
.rules-card strong { font-weight: 700; }
.rules-dates { display: flex; flex-direction: column; gap: 4px; background: #f6ead0; border-radius: 14px; padding: 12px 14px; margin-bottom: 26px; }
.rules-dates strong { font-size: 14px; line-height: 18px; }
.rules-dates span { font-size: 12px; line-height: 18px; color: var(--color-muted); }
.rules-card h2 { margin: 0 0 20px; color: inherit; font: 700 16px/22px var(--font-ui); letter-spacing: 0; }
.rules-required { min-height: 72px; display: flex; align-items: center; margin: 24px 0 22px; padding-bottom: 24px; border-bottom: 1px solid #e9dec5; font-size: 12px; line-height: 16px; gap: 20px; }
.rules-required p { margin: 0 0 4px; color: #aa2d0c; }
.rules-required strong { font-size: 14px; }
.rules-required span { color: var(--color-muted); }
.rules-gift { background: #f9efda; border: 1px solid #e6d8bb; border-radius: 15px; padding: 15px; margin-bottom: 20px; }
.rules-gift .rules-gift-label { margin: 0 0 10px; font-size: 12px; line-height: 18px; color: var(--color-muted); }
.rules-gift p:last-child { margin: 0; }
.rules-register { display: flex; align-items: center; justify-content: center; min-height: 54px; margin-top: 28px; padding: 0 12px; box-sizing: border-box; background: #ac2809; border-radius: 15px; color: #fff5df; text-align: center; text-decoration: none; font-weight: 700; }
.rules-register:hover { background: var(--color-action-hover); }
.rules-back:focus-visible, .rules-register:focus-visible { outline: 3px solid var(--color-auth-ink); outline-offset: 4px; }
@media (max-width: 359px) { .rules-layout { padding-inline: 12px; } .rules-card { padding-inline: 20px; } .rules-header h1 { font-size: 30px; } }
</style>
