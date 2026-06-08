import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')

test('portrait job detail dialog is only visible after a portrait job is selected', () => {
  assert.match(appVue, /const selectedPortraitJobDetail = computed\(\(\) => \{\s*if \(!selectedPortraitJobId\.value\) return null/)
  assert.match(appVue, /v-if="selectedPortraitJobId && selectedPortraitJobDetail"/)
})
