import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/mudldapps/',
  plugins: [
    vue(),
  ],
  server: {
    port: 5174 // jaunais ports
  }
})
