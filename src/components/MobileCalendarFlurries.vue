<script setup lang="ts">
import flurries1 from '../assets/calendar/b315bb73-c4b6-4bb5-bc94-073c0708ba4a.svg'
import flurries2 from '../assets/calendar/b65bc5b2-2951-4e42-9f3a-2b430ce464f6.svg'
import flurries3 from '../assets/calendar/d9c56c04-01d1-44c7-82c9-274feafee261.svg'
import flurries4 from '../assets/calendar/44e1156e-5780-4df7-9b55-db4f4ec9ba5c.svg'
import flurries5 from '../assets/calendar/1ec58a95-45b7-46ff-9e9b-2af785c13dff.svg'
import flurries6 from '../assets/calendar/9a75a521-129c-4605-8aac-8008d6aea2de.svg'
import flurries7 from '../assets/calendar/e3134bcf-411d-4938-a207-bb8c8372d060.svg'
import flurries8 from '../assets/calendar/4b257f58-6656-4f15-a5fc-c6f5a4df293b.svg'

const tiles = [
  { node: '10:11', src: flurries1, inset: '16.6% 54.96% 63.46% -7.63%', width: '100cqh', height: '100cqw', transform: 'rotate(-90deg)' },
  { node: '10:86', src: flurries2, inset: '45.58% 59.85% 33.14% -13.99%', width: 'hypot(95.2841cqw,4.54356cqh)', height: 'hypot(-4.71585cqw,95.4564cqh)', transform: 'rotate(2.78deg)' },
  { node: '10:161', src: flurries3, inset: '36.44% 62.34% 43.61% -15.01%', width: '100cqh', height: '100cqw', transform: 'rotate(90deg)' },
  { node: '10:236', src: flurries4, inset: '0.39% 51.15% 79.27% -2.8%' },
  { node: '10:311', src: flurries5, inset: '1.08% 2.8% 78.98% 44.53%', width: '100cqh', height: '100cqw', transform: 'rotate(90deg)' },
  { node: '10:386', src: flurries6, inset: '17.29% 41.98% 62.38% 6.36%' },
  { node: '10:461', src: flurries7, inset: '18.17% -6.61% 61.89% 53.94%', width: '100cqh', height: '100cqw', transform: 'rotate(90deg)' },
  { node: '10:537', src: flurries8, inset: '59.23% 49.06% 14.23% -18.32%', width: 'hypot(30.6836cqw,-68.4802cqh)', height: 'hypot(69.3164cqw,31.5198cqh)', transform: 'rotate(-65.71deg)' },
]
</script>

<template>
  <div class="mobile-flurries" aria-hidden="true">
    <div v-for="tile in tiles" :key="tile.node" class="flurry-tile" :data-figma-node="tile.node" :style="{ inset: tile.inset }">
      <img
        :src="tile.src"
        :style="{ width: tile.width, height: tile.height, transform: tile.transform }"
        alt=""
        draggable="false"
      />
    </div>
  </div>
</template>

<style scoped>
.mobile-flurries {
  position: absolute;
  inset: 0 auto;
  left: 50%;
  width: var(--stage-width);
  transform: translateX(-50%);
  pointer-events: none;
}
.flurry-tile {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  container-type: size;
}
.flurry-tile img {
  display: block;
  flex: none;
  width: 100%;
  height: 100%;
  max-width: none;
}
</style>
