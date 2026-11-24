<script setup lang="ts">
import { computed, ref } from 'vue';
import DecemberTaskLayout from './DecemberTaskLayout.vue';
import { holidayRecipes } from '../content/holiday-recipes';
import type { DecemberTaskProps, DecemberTaskEvents } from '../types/december';
import olivier from '../assets/dec-18/1.png';
import orangeSalad from '../assets/dec-18/2.png';
import trout from '../assets/dec-18/3.png';
import shrimp from '../assets/dec-18/4.png';
import eggs from '../assets/dec-18/5.png';
import fruit from '../assets/dec-18/6.png';

const props = defineProps<DecemberTaskProps>();
const emit = defineEmits<DecemberTaskEvents>();
const photos = [olivier, orangeSalad, trout, shrimp, eggs, fruit];
const index = ref(0);
const expanded = ref(false);
const recipe = computed(() => holidayRecipes[index.value]!);

function navigate(offset: number) {
  index.value = Math.max(0, Math.min(holidayRecipes.length - 1, index.value + offset));
  expanded.value = false;
}

function toggleRecipe() {
  expanded.value = !expanded.value;
  if (expanded.value && props.assignment?.status !== 'completed' && !props.saving) {
    emit('save', { response: { opened: true }, complete: true });
  }
}
</script>

<template>
  <DecemberTaskLayout v-bind="props" title="Праздник со вкусом" @back="emit('back')" @retry="emit('retry')">
    <div class="december-copy">
            <p>Новогодний ужин может быть и вкусным, и легким. Не обязательно отказываться от любимых блюд — иногда достаточно немного изменить ингредиенты или способ приготовления.</p>
            <p>Специально для сотрудников ГЕРОФАРМ праздничные рецепты подготовила Мария Петровна Казакова, врач-эндокринолог клиники Medswiss, кандидат медицинских наук.</p>
            <p>В подборке — оливье, закуски и другие блюда для новогоднего стола. Листайте, выбирайте по вкусу и пробуйте готовить!</p>
    </div>
    <section class="holiday-recipes december-stack">
      <h2>Рецепты к новогоднему столу</h2>
      <nav class="recipe-navigation" aria-label="Рецепты">
        <button type="button" :disabled="index === 0" aria-label="Предыдущий рецепт" @click="navigate(-1)">←</button>
        <output aria-live="polite">{{ index + 1 }} из {{ holidayRecipes.length }}</output>
        <button type="button" :disabled="index === holidayRecipes.length - 1" aria-label="Следующий рецепт" @click="navigate(1)">→</button>
      </nav>
      <article class="recipe-card">
        <img :src="photos[index]" :alt="recipe.title" />
        <div class="recipe-body december-stack">
          <h3>{{ recipe.title }}</h3>
          <button class="december-link recipe-toggle" type="button" :aria-expanded="expanded" aria-controls="holiday-recipe" @click="toggleRecipe">
            {{ expanded ? '▾ Свернуть рецепт' : '▸ Открыть рецепт' }}
          </button>
          <div v-if="expanded" id="holiday-recipe" class="december-stack">
            <div class="december-copy"><p v-for="paragraph in recipe.description" :key="paragraph">{{ paragraph }}</p></div>
            <p><strong>{{ recipe.servings }}</strong><br v-if="recipe.nutrition" />{{ recipe.nutrition }}</p>
            <section v-if="recipe.ingredients.length">
              <h4>{{ recipe.variations ? 'Общая основа' : 'Ингредиенты' }}</h4>
              <div v-for="section in recipe.ingredients" :key="section.heading">
                <h5 v-if="section.heading">{{ section.heading }}</h5>
                <ul><li v-for="ingredient in section.items" :key="ingredient">{{ ingredient }}</li></ul>
              </div>
            </section>
            <section v-if="recipe.steps.length">
              <h4>{{ recipe.variations ? 'Подготовка яиц' : 'Приготовление' }}</h4>
              <ol><li v-for="step in recipe.steps" :key="step">{{ step }}</li></ol>
            </section>
            <section v-if="recipe.variations">
              <h4>{{ recipe.steps.length ? 'Начинки' : 'Варианты' }}</h4>
              <details v-for="variation in recipe.variations" :key="variation.title" open>
                <summary>{{ variation.title }}</summary>
                <h5>Ингредиенты</h5>
                <ul><li v-for="ingredient in variation.ingredients" :key="ingredient">{{ ingredient }}</li></ul>
                <h5>Приготовление</h5>
                <ol><li v-for="step in variation.steps" :key="step">{{ step }}</li></ol>
              </details>
            </section>
            <section v-if="recipe.serving"><h4>Праздничная подача</h4><p>{{ recipe.serving }}</p></section>
            <button class="december-link recipe-toggle" type="button" @click="expanded = false">Свернуть рецепт ↑</button>
          </div>
        </div>
      </article>
      <div v-if="saveError" class="december-stack">
        <p class="december-error" role="alert">{{ saveError }}</p>
        <button class="december-link" type="button" :disabled="saving" @click="emit('save', { response: { opened: true }, complete: true })">Повторить сохранение прогресса</button>
      </div>
      <button class="december-button secondary" type="button" @click="emit('back')">К календарю</button>
    </section>
  </DecemberTaskLayout>
</template>

<style scoped>
.holiday-recipes { margin-top: 24px; }
.recipe-navigation { display: flex; align-items: center; justify-content: space-between; color: var(--dec-ink); }
.recipe-navigation button { width: 44px; height: 44px; padding: 0; border: 1px solid var(--dec-border); border-radius: 12px; background: var(--dec-paper); color: var(--dec-red); font: 700 18px/1 'Advent Inter', sans-serif; cursor: pointer; }
.recipe-navigation button:disabled { opacity: .48; cursor: default; }
.recipe-card { overflow: hidden; border: 1px solid var(--dec-border); border-radius: 15px; background: var(--dec-paper); }
.recipe-card > img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.recipe-body { padding: 18px; }
.recipe-body h3 { margin: 0; color: var(--dec-ink); font-size: 20px; line-height: 24px; }
.recipe-body h4 { margin: 0 0 8px; color: var(--dec-ink); font-size: 16px; }
.recipe-body h5 { margin: 12px 0 8px; color: var(--dec-ink); font-size: 14px; }
.recipe-body :is(ol, ul) { display: grid; gap: 6px; margin: 0; padding-left: 20px; }
.recipe-body summary, .recipe-toggle { color: var(--dec-red); font-weight: 700; cursor: pointer; }
</style>
