import vue from '@vitejs/plugin-vue'
import { defaultExclude, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    exclude: [...defaultExclude, 'tests/**/*.test.mjs'],
  },
})
