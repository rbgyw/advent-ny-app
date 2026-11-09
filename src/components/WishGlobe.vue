<script setup lang="ts">
import arch from '../assets/wish/globe-arch.svg';
import inner from '../assets/wish/globe-inner.svg';
import stars from '../assets/wish/globe-stars.svg';
import ball from '../assets/wish/globe-ball.svg';
import mask from '../assets/wish/globe-mask.svg';
import scene from '../assets/wish/globe-scene.svg';
import shine from '../assets/wish/globe-shine.svg';
import base from '../assets/wish/globe-base.svg';
import lines from '../assets/wish/globe-lines.svg';
import ground from '../assets/wish/globe-ground.svg';
const cssUrl = (url: string) => `url("${url}")`;
</script>

<template>
  <div class="wish-globe" role="img" aria-label="Снежный шар со снеговиком в золотом окошке">
    <img class="globe-arch" :src="arch" alt="" />
    <img class="globe-inner" :src="inner" alt="" />
    <img class="globe-stars" :src="stars" alt="" />
    <img class="globe-ball" :src="ball" alt="" />
    <div class="globe-scene" :style="{ maskImage: cssUrl(mask) }"><img :src="scene" alt="" /></div>
    <img class="globe-shine" :src="shine" alt="" />
    <img class="globe-base" :src="base" alt="" />
    <img class="globe-lines" :src="lines" alt="" />
    <img class="globe-ground" :src="ground" alt="" />
  </div>
</template>

<style scoped>
.wish-globe { position: relative; width: 220px; height: 245px; flex: 0 0 auto; overflow: hidden; }
.wish-globe img { position: absolute; display: block; }
.globe-arch { left: 22.983px; top: 4.224px; }
.globe-inner { left: 30.291px; top: 11.532px; }
.globe-stars { left: 63.957px; top: 23.655px; }
.globe-ball { left: 44.441px; top: 62.010px; }
.globe-scene { position: absolute; left: 38.19px; top: 71.81px; width: 145.31px; height: 126.724px; mask-repeat: no-repeat; mask-size: 130.103px 130.103px; mask-position: 6.759px -9.293px; }
.globe-shine { left: 65.224px; top: 69.275px; }
.globe-base { left: 64.612px; top: 190.509px; }
.globe-lines { left: 77.897px; top: 198.239px; }
.globe-ground { left: 17.069px; top: 227.470px; }
</style>
