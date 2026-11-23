import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [vue()],
  build: { manifest: true },
  server: {
    host: '127.0.0.1',
  },
})
