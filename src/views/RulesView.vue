<script setup lang="ts">
import PageLayout from '../components/ui/PageLayout.vue';
import AppHeader from '../components/ui/AppHeader.vue';
import AppCard from '../components/ui/AppCard.vue';
import DesignCanvas from '../components/ui/DesignCanvas.vue';
import { RouterLink } from 'vue-router';

import windowExample from '../assets/rules/window-example.svg';
import wreath from '../assets/rules/wreath.svg';
import title from '../assets/rules/title.svg';
import stars from '../assets/rules/stars.svg';
import wordmark from '../assets/rules/wordmark.svg';
import back from '../assets/rules/back.svg';
</script>

<template>
  <PageLayout background-variant="night" class="rules-page">
    <div class="rules-layout">
      <AppHeader class="rules-header">
        <RouterLink class="rules-back" to="/" aria-label="Вернуться к заставке"><img :src="back" alt="" /></RouterLink>
        <DesignCanvas class="rules-brand" :width="108" :height="13"><img :src="wordmark" alt="ГЕРОФАРМ" /></DesignCanvas>
        <h1><DesignCanvas class="rules-title-art" :width="239" :height="65"><img :src="title" alt="Пусть начнётся волшебство" /></DesignCanvas></h1>
        <DesignCanvas class="rules-stars" :width="339" :height="18" aria-hidden="true"><img :src="stars" alt="" /></DesignCanvas>
      </AppHeader>

      <AppCard class="rules-card" aria-label="Правила участия">
        <h2>Дорогие коллеги, поздравляем вас с наступающим Новым годом!</h2>
        <p>Декабрь — горячая пора: это время, когда мы завершаем рабочие задачи, строим планы на следующий год, выбираем подарки и готовимся к семейным встречам. За всеми этими делами не всегда даже успеваешь почувствовать приближение праздника.</p>
        <p>Специально для вас создан новогодний адвент-календарь — чтобы можно было ненадолго переключиться. С 1 по 25 декабря каждый день будет открываться новое окошко.</p>
        <p>Этот адвент — о нашей компании, ее достижениях и людях, которые за ними стоят. Поэтому мы подготовили 25 заданий — по числу лет ГЕРОФАРМ. Разгадайте традиционный кроссворд о качестве, проверьте, насколько хорошо знаете упаковки наших препаратов, поделитесь памятными моментами работы в ГЕРОФАРМ. А еще — найдите свою путеводную звезду и познакомьтесь с новогодними традициями разных регионов.</p>
        <p>Обязательные задания прячутся за <strong>оранжевыми окнами с золотой окантовкой.</strong> Их выполнение будет отражаться в вашем прогрессе.</p>

        <aside class="rules-required">
          <p class="rules-required-label">Так выглядят обозначения обязательных заданий</p>
          <div class="rules-required-examples">
            <img :src="windowExample" alt="Пример обязательного окна" />
            <span>Оранжевые окна с золотой окантовкой в Календаре</span>
            <img :src="wreath" alt="" />
            <span>Новогодний венок на страницах с заданиями</span>
          </div>
        </aside>

        <div class="rules-gift">
          <p class="rules-gift-label">Подарок от ГЕРОФАРМ</p>
          <p><strong>Первые 500 участников, правильно</strong> выполнивших <strong>все обязательные задания, получат подарок от</strong> ГЕРОФАРМ.</p>
        </div>

        <p>Подсказки к некоторым заданиям мы будем публиковать в каналах ГЕРОФАРМ LIFE в <a class="rules-community-link" href="https://t.me/+7Zwg%7CYFwmIU30GRi" target="_blank" rel="noopener noreferrer">Telegram</a> и <a class="rules-community-link" href="https://max.ru/join/d-gd069xb3KizIdnYoydwqaBFBRk5kmEGGfmVGK5YMc" target="_blank" rel="noopener noreferrer">MAX</a>.</p>

        <RouterLink class="rules-register" :to="{ name: 'auth', query: { mode: 'register' } }"><span>Зарегистрироваться</span></RouterLink>
        <RouterLink class="rules-continue" :to="{ name: 'auth', query: { mode: 'login' } }">Уже начали открывать окошки?<br />Продолжить</RouterLink>
      </AppCard>
    </div>
  </PageLayout>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.woff2') format('woff2'); font-weight: 100 900; font-display: swap; }
:global(#app:has(.rules-page)) { width: 100%; border: 0; }
.rules-page { min-height: 100svh; color: var(--color-ink); color-scheme: light; font: 400 clamp(14.7px, 1.8vw, 16px)/clamp(22px, 2.9vw, 26px) var(--font-ui); letter-spacing: 0; text-align: left; }
.rules-layout { width: min(100%, clamp(393px, calc(42vw + 228px), 820px)); margin: 0 auto; padding: 0 clamp(16px, 3vw, 32px) clamp(33px, 5vw, 64px); box-sizing: border-box; }
.rules-header { position: relative; height: clamp(181px, calc(12vw + 134px), 224px); text-align: center; }
.rules-brand { position: absolute; left: 50%; top: 31px; width: clamp(108px, 12vw, 156px); transform: translateX(-50%); }
.rules-back { position: absolute; left: -10px; top: 13px; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; }
.rules-header h1 { position: absolute; left: 50%; top: 89px; transform: translateX(-50%); margin: 0; line-height: 0; }
.rules-title-art { width: clamp(239px, 24vw, 320px); }
.rules-stars { width: min(100%, clamp(339px, 34vw, 440px)); position: absolute; left: 50%; top: 97px; transform: translateX(-50%); }
.rules-card { border-radius: 24px; background: #fff5e3; padding: clamp(24px, calc(2vw + 21px), 40px) clamp(16px, calc(5vw + 4px), 48px) clamp(32px, 4vw, 48px); overflow-wrap: anywhere; box-shadow: 0 16px 60px #160a0626; }
.rules-card p { margin: 0 0 22px; }
.rules-card > p { max-width: 66ch; }
.rules-card strong { font-weight: 700; }
.rules-community-link { color: var(--color-action); font-weight: 700; text-underline-offset: 3px; }
.rules-card h2 { margin: 0 0 19px; color: inherit; font: 700 clamp(17px, 2vw, 25px)/1.35 var(--font-ui); letter-spacing: 0; }
.rules-required { margin: 25px 0 40px; font-size: 12px; line-height: 15px; }
.rules-required .rules-required-label { margin: 0 0 15px; color: #a7280b; font-weight: 700; text-wrap: balance; }
.rules-required-examples { display: grid; grid-template-columns: 61px minmax(0, 1fr) 53px minmax(0, 1fr); align-items: center; gap: clamp(8px, 1.2vw, 16px); min-height: 62px; color: #836045; }
.rules-required-examples img { display: block; }
.rules-gift { box-sizing: border-box; min-height: 146px; background: #faf0de; border: 1px solid #ead7b6; border-radius: 15px; padding: 15px; margin-bottom: 19px; }
.rules-gift .rules-gift-label { margin: 0 0 12px; font-size: 13px; line-height: 16px; color: #836045; }
.rules-gift p:last-child { margin: 0; font-size: 15px; line-height: 21px; }
.rules-card > .rules-gift + p { line-height: 21px; margin-bottom: 18px; }
.rules-register, .rules-continue { display: flex; align-items: center; justify-content: center; box-sizing: border-box; border-radius: 13px; text-align: center; text-decoration: none; font-weight: 700; }
.rules-register span { color: transparent; background: linear-gradient(75deg, #e8b77e, #ffe6bc 20%, #fff0d2 73%, #efc087); background-clip: text; }
.rules-register { min-height: 54px; margin-top: 25px; padding: 0 12px; background: #a7280b; color: #fff0d2; font-size: 15px; line-height: 18px; }
.rules-continue { min-height: 52px; margin-top: 16px; padding: 8px; border: 1px solid #a7280b; color: #a7280b; font-size: 14px; line-height: 17px; }
.rules-register:hover { background: #962107; }
.rules-continue:hover { background: #f8e8c8; }
.rules-community-link:focus-visible, .rules-back:focus-visible, .rules-register:focus-visible, .rules-continue:focus-visible { outline: 3px solid #623c28; outline-offset: 4px; }
@media (max-width: 379px) { .rules-required-examples { grid-template-columns: 61px minmax(0, 1fr); row-gap: 16px; } }
@media (min-width: 700px) {
  .rules-card p { margin-bottom: 24px; }
  .rules-card h2 { max-width: 32ch; margin-bottom: 24px; }
  .rules-required { margin-block: 30px; font-size: clamp(12px, 1.2vw, 14px); line-height: clamp(15px, 1.6vw, 20px); }
  .rules-gift { min-height: 0; padding: 24px; }
  .rules-gift p:last-child { font-size: 16px; line-height: 25px; }
  .rules-card > .rules-gift + p { line-height: 26px; }
  .rules-register, .rules-continue { max-width: 420px; margin-inline: auto; min-height: 56px; }
}
</style>
