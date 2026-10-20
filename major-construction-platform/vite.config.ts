import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFile, mkdir, cp } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const staticDataAssets = [
  'static-region-city-geo.js',
  'gb-t-4754-2017.js',
  'portrait-major-matches.js',
  'portrait-distribution-map.js',
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
        const matchingUtilsOutput = fileURLToPath(new URL('./dist/client/src/utils/', import.meta.url))
        await mkdir(matchingUtilsOutput, { recursive: true })
        await copyFile(fileURLToPath(new URL('./src/utils/portrait-major-matching.js', import.meta.url)), `${matchingUtilsOutput}portrait-major-matching.js`)
        await copyFile(fileURLToPath(new URL('./src/utils/portrait-job-distribution.js', import.meta.url)), `${matchingUtilsOutput}portrait-job-distribution.js`)
        await copyFile(fileURLToPath(new URL('./src/utils/portrait-competency-map-export.js', import.meta.url)), `${matchingUtilsOutput}portrait-competency-map-export.js`)
        await copyFile(fileURLToPath(new URL('./industry-major-chain-data.js', import.meta.url)), fileURLToPath(new URL('./dist/client/industry-major-chain-data.js', import.meta.url)))
        const talentSource = fileURLToPath(new URL('./src/talent-plan/', import.meta.url))
        const talentOutput = fileURLToPath(new URL('./dist/client/src/talent-plan/', import.meta.url))
        const talentVendorOutput = fileURLToPath(new URL('./dist/client/vendor/talent-plan/', import.meta.url))
        await mkdir(talentOutput, { recursive: true })
        await mkdir(talentVendorOutput, { recursive: true })
        await Promise.all(['data.js', 'standards.js', 'model.js', 'files.js', 'views.js', 'element.js'].map(filename => copyFile(`${talentSource}${filename}`, `${talentOutput}${filename}`)))
        await Promise.all(['pdf-reader.js', 'jszip.min.js'].map(filename => copyFile(fileURLToPath(new URL(`./vendor/talent-plan/${filename}`, import.meta.url)), `${talentVendorOutput}${filename}`)))
        await cp(fileURLToPath(new URL('./src/talent-compare/', import.meta.url)), fileURLToPath(new URL('./dist/client/src/talent-compare/', import.meta.url)), { recursive: true })
        const domainSource = fileURLToPath(new URL('./src/industry-domain/', import.meta.url))
        const domainOutput = fileURLToPath(new URL('./dist/client/src/industry-domain/', import.meta.url))
        await mkdir(domainOutput, { recursive: true })
        await Promise.all(['model.js', 'business-panels.js', 'node-detail.js', 'availability.js'].map(filename => copyFile(`${domainSource}${filename}`, `${domainOutput}${filename}`)))
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
