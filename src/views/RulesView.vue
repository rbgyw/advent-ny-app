<script setup lang="ts">
import { RouterLink } from 'vue-router';

import windowExample from '../assets/rules/window-example.svg';
import wreath from '../assets/rules/wreath.svg';
import title from '../assets/rules/title.svg';
import stars from '../assets/rules/stars.svg';
import wordmark from '../assets/rules/wordmark.svg';
import back from '../assets/rules/back.svg';
</script>

<template>
  <main class="rules-page">
    <div class="rules-layout">
      <header class="rules-header">
        <RouterLink class="rules-back" to="/" aria-label="Вернуться к заставке"><img :src="back" alt="" /></RouterLink>
        <img class="rules-brand" :src="wordmark" alt="ГЕРОФАРМ" />
        <h1><img :src="title" alt="Пусть начнётся волшебство" /></h1>
        <img class="rules-stars" :src="stars" alt="" />
      </header>

      <article class="rules-card" aria-label="Правила участия">
        <h2>Дорогие коллеги, поздравляем вас с наступающим Новым годом!</h2>
        <p>Декабрь — время приятных хлопот, теплых воспоминаний и предвкушения праздника. Предлагаем провести его вместе: вспомнить яркие моменты уходящего года, пообщаться с коллегами и зарядиться новогодним настроением. Для этого мы и подготовили адвент-календарь.</p>
        <p>С 1 по 25 декабря каждый день будет открываться новое окошко с заданием или сюрпризом. Вас ждут головоломки, игры, творческие задания и маленькие поводы улыбнуться.</p>
        <p>Участвуйте в своем темпе и выбирайте активности по настроению. А если хотите получить памятный подарок, правильно выполните <strong>все обязательные задания</strong> — для них предусмотрены <strong>оранжевые окна с золотой окантовкой. Их выполнение будет</strong> отражаться в вашем прогрессе.</p>

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

        <p>Подсказки к некоторым заданиям мы будем публиковать в каналах ГЕРОФАРМ LIFE в <strong>Telegram и MAX.</strong></p>
        <p>Пусть этот декабрь станет немного теплее, веселее и волшебнее. Начнем?</p>

        <RouterLink class="rules-register" :to="{ name: 'auth', query: { mode: 'register' } }"><span>Зарегистрироваться</span></RouterLink>
        <RouterLink class="rules-continue" :to="{ name: 'auth', query: { mode: 'login' } }">Уже начали открывать окошки?<br />Продолжить</RouterLink>
      </article>
    </div>
  </main>
</template>

<style scoped>
@font-face { font-family: 'Advent Inter'; src: url('../assets/splash/Inter.ttf') format('truetype'); font-weight: 100 900; font-display: swap; }
:global(#app:has(.rules-page)) { width: 100%; border: 0; }
.rules-page { min-height: 100svh; color: #623c28; background: #321507; color-scheme: light; font: 400 14.7px/22px 'Advent Inter', sans-serif; letter-spacing: 0; text-align: left; }
.rules-layout { max-width: 393px; margin: 0 auto; padding: 0 16px 33px; box-sizing: border-box; background: url('../assets/rules/background.svg') center top / 100% 100% no-repeat; }
.rules-header { position: relative; height: 181px; text-align: center; }
.rules-brand { position: absolute; left: calc(50% - 54.5px); top: 31px; }
.rules-back { position: absolute; left: -4px; top: 13px; display: grid; place-items: center; width: 32px; height: 44px; }
.rules-header h1 { position: absolute; left: 50%; top: 89px; transform: translateX(-50%); margin: 0; line-height: 0; }
.rules-stars { position: absolute; left: 50%; top: 97px; transform: translateX(-50%); max-width: 100%; }
.rules-card { border-radius: 24px; background: #fff5e3; padding: 29px 24px 39px; }
.rules-card p { margin: 0 0 22px; }
.rules-card > p { width: calc(100% + 6px); }
.rules-card strong { font-weight: 700; }
.rules-card h2 { margin: 0 0 19px; color: inherit; font: 700 17px/23px 'Advent Inter', sans-serif; letter-spacing: 0; }
.rules-required { margin: 25px 0 40px; font-size: 12px; line-height: 15px; }
.rules-required .rules-required-label { margin: 0 0 15px; color: #a7280b; font-weight: 700; white-space: nowrap; }
.rules-required-examples { display: grid; grid-template-columns: 59.38px 95px 52.88px minmax(0, 1fr); align-items: center; gap: 10px; min-height: 62px; color: #836045; }
.rules-required-examples img { display: block; }
.rules-gift { box-sizing: border-box; min-height: 146px; background: #faf0de; border: 1px solid #ead7b6; border-radius: 15px; padding: 15px; margin-bottom: 19px; }
.rules-gift .rules-gift-label { margin: 0 0 12px; font-size: 13px; line-height: 16px; color: #836045; }
.rules-gift p:last-child { margin: 0; font-size: 15px; line-height: 21px; }
.rules-card > .rules-gift + p { line-height: 21px; margin-bottom: 18px; }
.rules-card > .rules-gift + p + p { line-height: 21px; min-height: 46px; }
.rules-register, .rules-continue { display: flex; align-items: center; justify-content: center; box-sizing: border-box; border-radius: 13px; text-align: center; text-decoration: none; font-weight: 700; }
.rules-register span { color: transparent; background: linear-gradient(75deg, #e8b77e, #ffe6bc 20%, #fff0d2 73%, #efc087); background-clip: text; }
.rules-register { min-height: 54px; margin-top: 25px; padding: 0 12px; background: #a7280b; color: #fff0d2; font-size: 15px; line-height: 18px; }
.rules-continue { min-height: 52px; margin-top: 16px; padding: 8px; border: 1px solid #a7280b; color: #a7280b; font-size: 14px; line-height: 17px; }
.rules-register:hover { background: #962107; }
.rules-continue:hover { background: #f8e8c8; }
.rules-back:focus-visible, .rules-register:focus-visible, .rules-continue:focus-visible { outline: 3px solid #623c28; outline-offset: 4px; }
@media (max-width: 374px) { .rules-card { padding-inline: 16px; } .rules-required .rules-required-label { white-space: normal; } .rules-required-examples { grid-template-columns: 59.38px 1fr; row-gap: 16px; } }
</style>
