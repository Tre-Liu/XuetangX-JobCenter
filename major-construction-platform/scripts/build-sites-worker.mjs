import { build } from 'vite'
import { fileURLToPath } from 'node:url'

await build({
  configFile: false,
  build: {
    ssr: fileURLToPath(new URL('../src/server/research-summary-worker.js', import.meta.url)),
    outDir: fileURLToPath(new URL('../dist/server/', import.meta.url)),
    emptyOutDir: false,
    target: 'es2022',
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        format: 'es',
      },
    },
  },
})
