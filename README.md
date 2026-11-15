# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Публикация историй на 23 декабря

`public/collections/memories.json` содержит массив историй. Укажите `name` и `text`. Поля `photoUrl` и `photoAlt` для фотографии и её описания необязательны.

```json
[
  {
    "name": "Имя сотрудника",
    "text": "Текст воспоминания",
    "photoUrl": "images/memory.jpg",
    "photoAlt": "Коллеги на корпоративном мероприятии"
  }
]
```

После первой публикации приложения можно заменить `collections/memories.json` в каталоге готового сайта без пересборки. Имена, тексты и фотографии из подборки доступны по публичным URL. Если фотография уже размещена, укажите её HTTPS-адрес. Относительные пути к фотографиям считаются от каталога `collections/`.
