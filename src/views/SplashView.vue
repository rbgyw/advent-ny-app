<script setup lang="ts">
import { RouterLink } from 'vue-router';
import PageLayout from '../components/ui/PageLayout.vue';
import DesignCanvas from '../components/ui/DesignCanvas.vue';
import frame from '../assets/splash/imgArchitecturalFrame.svg';
import snow from '../assets/splash/imgSnow.svg';
import snowfallWide from '../assets/splash/snowfall-wide.svg';
import garlands from '../assets/splash/imgHolidayLightGarlands.svg';
import wideGarlands from '../assets/splash/garlands-wide.svg';
import brand from '../assets/calendar/66d4a818-5417-4c1c-ac45-147152fb77f1.svg';
import title from '../assets/splash/title.svg';
import headingFirst from '../assets/splash/heading-first.svg';
import headingAdvent from '../assets/splash/heading-advent.svg';
import headingHyphen from '../assets/splash/heading-hyphen.svg';
import headingCalendar from '../assets/splash/heading-calendar.svg';
import fireworkWide0 from '../assets/splash/firework-left-bloom.svg';
import fireworkWide1 from '../assets/splash/firework-right-cascade.svg';
import fireworkWide2 from '../assets/splash/firework-small-left.svg';
import fireworkWide3 from '../assets/splash/firework-small-right.svg';
import fireworkWide4 from '../assets/splash/firework-large-left.svg';
import fireworkWide5 from '../assets/splash/firework-large-right.svg';
import lampWide from '../assets/splash/lamp-wide.svg';
import ornamentLeft from '../assets/splash/imgGroup2.svg';
import ornamentRight from '../assets/splash/imgGroup3.svg';
import buttonBase from '../assets/splash/imgVector.svg';
import buttonBorder from '../assets/splash/imgRosetteBorder.svg';
import buttonStars from '../assets/splash/imgSideStars.svg';
import buttonDots from '../assets/splash/imgAccentDots.svg';
import firework1 from '../assets/splash/imgFirework1.svg';
import firework2 from '../assets/splash/imgFirework2.svg';
import firework3 from '../assets/splash/imgFirework3.svg';
import city from '../assets/splash/city.svg';
import wideCity from '../assets/splash/city-wide.svg';
import wideSnow from '../assets/splash/snow-wide.svg';
import glow from '../assets/splash/lamp-glow.svg';
import lamp from '../assets/splash/lamp.svg';
import leftSnow from '../assets/splash/lamp-snow-left.svg';
import rightSnow from '../assets/splash/lamp-snow-right.svg';
import thread from '../assets/splash/star-thread.svg';
import star from '../assets/splash/star.svg';
import bow from '../assets/splash/imgRedHolidayRibbonBow2.webp';

// Each layer retains the original Figma proportions inside DesignCanvas.
const header = [
  { src: snow, x: 9.2, y: 12.4 },
  { src: garlands, x: 43, y: 94.65 },
  { src: brand, x: 141, y: 69 },
  { src: ornamentLeft, x: 109.537, y: 112 },
  { src: ornamentRight, x: 267.537, y: 113 },
  { src: thread, x: 70, y: 121 },
  { src: star, x: 47, y: 165 },
  { src: thread, x: 318, y: 123 },
  { src: star, x: 295, y: 163 },
];
// Original 393px artwork; only its wrapper scales. Text stays in normal flow.
const scenery = [
  { src: firework3, x: 238, y: 79 },
  { src: firework2, x: 237, y: -7 },
  { src: firework1, x: 118, y: 28 },
  { src: city, x: 35, y: 0 },
  { src: glow, x: 18, y: 48 },
  { src: glow, x: 325, y: 48 },
  { src: lamp, x: 30.5, y: 43 },
  { src: lamp, x: 337.5, y: 43 },
  { src: leftSnow, x: 31.52, y: 49.56 },
  { src: rightSnow, x: 337.21, y: 49.26 },
];
</script>

<template>
  <PageLayout background-variant="night" class="splash-page">
    <section class="splash-scene" aria-labelledby="splash-title">
      <DesignCanvas class="splash-arch" :width="356.5" :height="818.25" aria-hidden="true"><img :src="frame" alt="" /></DesignCanvas>
      <DesignCanvas class="splash-mobile-header" :width="393" :height="208" aria-hidden="true">
        <img v-for="(item, index) in header" :key="index" :src="item.src" alt="" :style="{ left: `${item.x}px`, top: `${item.y}px` }" />
      </DesignCanvas>
      <div class="splash-wide-header" aria-hidden="true">
        <DesignCanvas class="splash-wide-brand" :width="112" :height="15"><img :src="brand" alt="" /></DesignCanvas>
        <DesignCanvas class="splash-wide-garlands" :width="1440" :height="97"><img :src="wideGarlands" alt="" /></DesignCanvas>
      </div>
      <div class="splash-copy">
        <h1 id="splash-title" aria-label="Новогодний адвент-календарь">
          <DesignCanvas class="splash-title-art" :width="270" :height="151" aria-hidden="true"><img :src="title" alt="" /></DesignCanvas>
          <DesignCanvas class="splash-title-wide" :width="570" :height="175" aria-hidden="true">
            <img :src="headingFirst" alt="" style="left:90px;top:0" />
            <img :src="headingAdvent" alt="" style="left:0;top:87.96px" />
            <img :src="headingHyphen" alt="" style="left:226.94px;top:123.02px" />
            <img :src="headingCalendar" alt="" style="left:252px;top:107.95px" />
          </DesignCanvas>
        </h1>
        <p class="splash-description">Открывайте новые окошки каждый день,<br class="splash-copy-break" /> выполняйте задания и встречайте<br class="splash-copy-break" /> Новый год вместе с ГЕРОФАРМ!</p>
        <RouterLink class="splash-start" to="/rules">
          <DesignCanvas class="splash-button-art" :width="305" :height="56" aria-hidden="true">
            <img :src="buttonBase" alt="" />
            <img :src="buttonBorder" class="splash-button-border" alt="" />
            <img :src="buttonStars" class="splash-button-stars" alt="" />
            <img :src="buttonDots" class="splash-button-dots" alt="" />
          </DesignCanvas>
          <span>Начать</span>
        </RouterLink>
      </div>
      <div class="splash-scenery" aria-hidden="true">
        <DesignCanvas class="splash-mobile-scenery" :width="393" :height="284">
          <img v-for="(item, index) in scenery" :key="index" :src="item.src" alt="" :style="{ left: `${item.x}px`, top: `${item.y}px` }" />
          <img class="splash-bow splash-bow-left" :src="bow" alt="" />
          <img class="splash-bow splash-bow-right" :src="bow" alt="" />
        </DesignCanvas>
        <div class="splash-wide-scenery">
          <DesignCanvas class="splash-wide-city" :width="1341" :height="488"><img :src="wideCity" alt="" /></DesignCanvas>

          <DesignCanvas v-for="side in ['left', 'right']" :key="side" class="splash-wide-lamp" :class="`splash-wide-lamp-${side}`" :width="56" :height="233"><img :src="lampWide" alt="" /></DesignCanvas>
        </div>
      </div>
      <div class="splash-atmosphere" aria-hidden="true"><img class="splash-snowfall" :src="snowfallWide" alt="" /><div class="splash-fireworks-wide"><img class="firework-left-bloom" :src="fireworkWide0" alt="" /><img class="firework-right-cascade" :src="fireworkWide1" alt="" /><img class="firework-small-left" :src="fireworkWide2" alt="" /><img class="firework-small-right" :src="fireworkWide3" alt="" /><img class="firework-large-left" :src="fireworkWide4" alt="" /><img class="firework-large-right" :src="fireworkWide5" alt="" /></div><img class="splash-city-distant" :src="wideCity" alt="" /></div>
      <img class="splash-ground" :src="wideSnow" alt="" aria-hidden="true" />
    </section>
  </PageLayout>
</template>

<style scoped>
:global(#app:has(.splash-page)) { width: 100%; border: 0; }
.splash-page { width: 100%; min-height: 100svh; overflow: clip; color: var(--color-cream); color-scheme: light; text-align: center; font: 400 14px/22px var(--font-ui); letter-spacing: 0; }
.splash-scene { position: relative; isolation: isolate; display: flex; flex-direction: column; width: 100%; min-height: max(852px, 100svh); margin-inline: auto; }
.splash-arch, .splash-mobile-header, .splash-wide-header { position: absolute; pointer-events: none; z-index: -1; }
.splash-arch { top: 8.5px; left: 50%; width: 356.5px; transform: translateX(-50%); }
.splash-mobile-header { top: 0; left: 50%; width: min(100%, 393px); transform: translateX(-50%); }
.splash-page :deep(.design-canvas-art > img) { position: absolute; display: block; max-width: none; }
.splash-wide-header, .splash-wide-scenery { display: none; }
.splash-copy { position: relative; padding-top: clamp(192px, 59.03vw, 232px); }
.splash-copy h1 { margin: 0; line-height: 0; }
.splash-title-art { width: clamp(270px, 32vw, 378px); margin-inline: auto; }
.splash-description { max-width: 520px; margin: 15px auto 0; padding-inline: 16px; font-size: clamp(14px, 1.5vw, 18px); line-height: 1.571429; text-wrap: pretty; }
.splash-start { position: relative; display: grid; place-items: center; width: min(clamp(305px, 28vw, 350px), calc(100% - 32px)); min-height: 56px; aspect-ratio: 305 / 56; margin: 28px auto 0; border-radius: 18px; color: var(--color-action); font: 700 18px/22px var(--font-ui); text-decoration: none; transition: filter 160ms ease; }
.splash-button-art { position: absolute; width: 100%; top: 50%; transform: translateY(-50%); pointer-events: none; }
.splash-button-border { left: 4.85px; top: 4.85px; }
.splash-button-stars { left: 24.98px; top: 23.425px; }
.splash-button-dots { left: 39.2px; top: 27.2px; }
.splash-start span { position: relative; }
.splash-start:focus-visible { outline: 3px solid var(--color-cream); outline-offset: 5px; }
.splash-start:hover { filter: brightness(1.06); }
.splash-start:active { filter: brightness(.96); }
.splash-scenery { position: relative; flex: 1; min-height: 284px; margin-top: 20px; z-index: -1; pointer-events: none; }
.splash-mobile-scenery { position: absolute; width: min(100%, 393px); bottom: 0; left: 50%; transform: translateX(-50%); }
.splash-bow { width: 18px; height: 18px; top: 78px; object-fit: cover; }
.splash-bow-left { left: 34px; }
.splash-bow-right { left: 341px; }
@media (min-width: 768px) {
  .splash-scene { min-height: max(813px, 100svh); }
  .splash-arch, .splash-mobile-header, .splash-mobile-scenery { display: none; }
  .splash-wide-header { display: block; inset: 0 0 auto; }
  .splash-wide-brand { width: clamp(112px, 12vw, 174px); margin: 32px auto 0; }
  .splash-wide-garlands { position: absolute; top: 68px; left: 0; width: 100%; }
  .splash-copy { padding-top:clamp(170px, 12.78vw, 184px); }
  .splash-scenery { min-height:280px; margin-top:20px; }
  .splash-wide-scenery { display: block; position: absolute; inset: 0; }
  .splash-wide-city { position: absolute; width:min(93.125%, 1788px); bottom:-12px; left: 50%; transform: translateX(-50%); }
  .splash-wide-lamp { position: absolute; width:56px; bottom:22px; }
  .splash-wide-lamp-left { left:calc(50% - 238px); }
  .splash-wide-lamp-right { right:calc(50% - 247px); }
}
@media (prefers-reduced-motion: reduce) { .splash-start { transition: none; } }

.splash-copy h1 { position:relative; height:clamp(151px, calc(11.54vw + 86.38px), 175px); }
.splash-title-art { position:absolute; top:0; left:50%; transform:translateX(-50%); }
.splash-title-wide { display:none; position:absolute; top:0; left:50%; transform:translateX(-50%); width:clamp(320px, 52vw, 570px); opacity:0; }
.splash-atmosphere { position:absolute; inset:0; pointer-events:none; z-index:-2; overflow:hidden; }
.splash-snowfall { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.65; }
.splash-fireworks-wide,.splash-city-distant { display:none; }
.splash-ground { position:absolute; inset:auto 0 -1px; width:100%; height:clamp(45px, 5.69vw, 110px); max-width:none; pointer-events:none; z-index:1; }
@media (min-width:768px) {
  .splash-title-art { display:none; }
  .splash-title-wide { display:block; opacity:1; }
  .splash-description { max-width:529px; padding:0 24px; margin-top:7px; font-size:16px; line-height:21.5px; }
  .splash-copy-break { display:none; }
  .splash-start { margin-top:30px; width:350.75px; }
  .splash-fireworks-wide { display:block; position:absolute; inset:0; }
  .splash-fireworks-wide img { position:absolute; display:block; }
  .firework-left-bloom { right:calc(50% + clamp(300px, 27vw, 389px)); top:229px; width:clamp(70px, 8.54vw, 123px); }
  .firework-right-cascade { left:calc(50% + clamp(300px, 28.8vw, 415px)); top:230px; width:clamp(70px, 8.93vw, 129px); }
  .firework-small-left { left:4.51%; top:395px; width:clamp(30px, 3.5vw, 50px); }
  .firework-small-right { right:4.51%; top:388px; width:clamp(26px, 2.78vw, 40px); }
  .firework-large-left { right:calc(50% + 292px); top:363px; width:clamp(80px, 11.04vw, 159px); }
  .firework-large-right { left:calc(50% + 292px); top:376px; width:clamp(80px, 11.96vw, 172px); }
  .splash-city-distant { display:block; position:absolute; width:110%; left:-5%; bottom:12px; opacity:.13; }
}
</style>
