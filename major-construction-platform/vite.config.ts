import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const staticDataAssets = [
  'static-region-city-geo.js',
  'gb-t-4754-2017.js',
]

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-static-data-assets',
      apply: 'build',
      async closeBundle() {
        const sourceDirectory = fileURLToPath(new URL('./src/data/', import.meta.url))
        const outputDirectory = fileURLToPath(new URL('./dist/client/src/data/', import.meta.url))
        await mkdir(outputDirectory, { recursive: true })
        await Promise.all(staticDataAssets.map((filename) =>
          copyFile(`${sourceDirectory}${filename}`, `${outputDirectory}${filename}`)
        ))
      },
    },
  ],
  build: {
    outDir: 'dist/client'
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
