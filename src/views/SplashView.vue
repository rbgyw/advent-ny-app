<script setup lang="ts">
import { RouterLink } from "vue-router";
import background from "../assets/splash/imgBackground.svg";
import frame from "../assets/splash/imgArchitecturalFrame.svg";
import snow from "../assets/splash/imgSnow.svg";
import garlands from "../assets/splash/imgHolidayLightGarlands.svg";
import brand from "../assets/splash/imgBrand.svg";
import ornamentLeft from "../assets/splash/imgGroup2.svg";
import ornamentRight from "../assets/splash/imgGroup3.svg";
import buttonBase from "../assets/splash/imgVector.svg";
import buttonBorder from "../assets/splash/imgRosetteBorder.svg";
import buttonStars from "../assets/splash/imgSideStars.svg";
import buttonDots from "../assets/splash/imgAccentDots.svg";
import firework1 from "../assets/splash/imgFirework1.svg";
import firework2 from "../assets/splash/imgFirework2.svg";
import firework3 from "../assets/splash/imgFirework3.svg";
import city from "../assets/splash/city.svg";
import foreground from "../assets/splash/imgSnowForeground.svg";
import glow from "../assets/splash/lamp-glow.svg";
import lamp from "../assets/splash/lamp.svg";
import leftSnow from "../assets/splash/lamp-snow-left.svg";
import rightSnow from "../assets/splash/lamp-snow-right.svg";
import thread from "../assets/splash/star-thread.svg";
import star from "../assets/splash/star.svg";
import bow from "../assets/splash/imgRedHolidayRibbonBow2.png";

// Coordinates refer to the 393 × 852 illustration, excluding Figma's version label.
const decorations = [
  { src: background, x: 0, y: 0 },
  { src: frame, x: 18.25, y: 8.5 },
  { src: snow, x: 9.2, y: 12.4 },
  { src: garlands, x: 43, y: 94.65 },
  { src: brand, x: 141, y: 69 },
  { src: ornamentLeft, x: 109.537, y: 112 },
  { src: ornamentRight, x: 267.537, y: 113 },
  { src: firework3, x: 238, y: 647 },
  { src: firework2, x: 237, y: 561 },
  { src: firework1, x: 118, y: 596 },
  { src: city, x: 35, y: 568 },
  { src: foreground, x: 0, y: 772 },
  { src: glow, x: 18, y: 616 },
  { src: glow, x: 325, y: 616 },
  { src: lamp, x: 30.5, y: 611 },
  { src: lamp, x: 337.5, y: 611 },
  { src: leftSnow, x: 31.52, y: 617.56 },
  { src: rightSnow, x: 337.21, y: 617.26 },
  { src: thread, x: 70, y: 121 },
  { src: star, x: 47, y: 165 },
  { src: thread, x: 318, y: 123 },
  { src: star, x: 295, y: 163 },
];
</script>

<template>
  <main class="splash-page">
    <section class="splash-scene" aria-labelledby="splash-title">
      <div class="splash-art" aria-hidden="true">
        <img
          v-for="(item, index) in decorations"
          :key="index"
          :src="item.src"
          alt=""
          :style="{ left: `${item.x}px`, top: `${item.y}px` }"
        />
        <img class="splash-bow splash-bow-left" :src="bow" alt="" />
        <img class="splash-bow splash-bow-right" :src="bow" alt="" />
      </div>
      <span class="splash-brand-label">ГЕРОФАРМ</span>
      <div class="splash-copy">
        <p class="splash-eyebrow">ВРЕМЯ МАЛЕНЬКИХ ЧУДЕС</p>
        <h1 id="splash-title">Новогодний<br />адвент-<br />календарь</h1>
        <p class="splash-description">
          Открывайте новые окошки каждый день,<br />выполняйте задания и
          встречайте<br />Новый год вместе с ГЕРОФАРМ!
        </p>
        <RouterLink class="splash-start" to="/rules">
          <img :src="buttonBase" alt="" aria-hidden="true" />
          <img
            class="splash-button-border"
            :src="buttonBorder"
            alt=""
            aria-hidden="true"
          />
          <img
            class="splash-button-stars"
            :src="buttonStars"
            alt=""
            aria-hidden="true"
          />
          <img
            class="splash-button-dots"
            :src="buttonDots"
            alt=""
            aria-hidden="true"
          />
          <span>Начать</span>
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
@font-face {
  font-family: "Advent Inter";
  src: url("../assets/splash/Inter.ttf") format("truetype");
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: "Advent STIX";
  src: url("../assets/splash/STIXTwoText.ttf") format("truetype");
  font-weight: 400 700;
  font-display: swap;
}
.splash-page {
  container-type: inline-size;
  width: 100%;
  min-height: 100svh;
  background: #e76a16;
  color: #78341d;
  color-scheme: light;
  text-align: center;
  font-family: "Advent Inter", sans-serif;
  letter-spacing: 0;
  overflow: clip;
}
:global(#app:has(.splash-page)) {
  width: 100%;
  border: 0;
}
.splash-scene {
  position: relative;
  width: 393px;
  height: 852px;
  margin-inline: auto;
  overflow: hidden;
  isolation: isolate;
}
.splash-art {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
.splash-art img {
  position: absolute;
  display: block;
  max-width: none;
}
.splash-art .splash-bow {
  width: 18px;
  height: 18px;
  top: 646px;
  object-fit: cover;
}
.splash-bow-left {
  left: 34px;
}
.splash-bow-right {
  left: 341px;
}
.splash-brand-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.splash-copy {
  position: relative;
  padding-top: 208px;
}
.splash-eyebrow {
  margin: 0;
  font-size: 9px;
  font-weight: 600;
  line-height: 11px;
}
.splash-copy h1 {
  margin: 9px 0 0;
  font:
    600 45px/46px "Advent STIX",
    serif;
  letter-spacing: 0;
  background: linear-gradient(152.6676deg, #fffdf5, #f7e8cb);
  background-clip: text;
  color: transparent;
  transform: translateX(1px);
}
.splash-description {
  margin: 32.5px 0 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}
.splash-start {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 305px;
  height: 56px;
  margin: 27.5px auto 0;
  color: #a7280b;
  font-size: 18px;
  font-weight: 700;
  line-height: 22px;
  text-decoration: none;
  border-radius: 18px;
}
.splash-start img {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  max-width: none;
}
.splash-start .splash-button-border {
  left: 4.85px;
  top: 4.85px;
}
.splash-start .splash-button-stars {
  left: 24.98px;
  top: 23.425px;
}
.splash-start .splash-button-dots {
  left: 39.2px;
  top: 27.2px;
}
.splash-start span {
  position: relative;
}
.splash-start:focus-visible {
  outline: 3px solid #78341d;
  outline-offset: 5px;
}
.splash-start:hover {
  filter: brightness(1.04);
}
.splash-start:active {
  filter: brightness(0.96);
}
@container (max-width: 392px) {
  .splash-scene {
    margin-inline: 0;
    zoom: calc(100cqw / 393px);
  }
}
@container (min-width: 394px) {
  .splash-scene {
    zoom: min(calc(100cqw / 393px), 1.3);
  }
}
</style>
