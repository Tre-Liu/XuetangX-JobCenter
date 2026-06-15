import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')

test('job detail navigation hides suitability evaluation module entry', () => {
  assert.doesNotMatch(appVue, /\{\s*key:\s*'suitability',\s*label:\s*'适岗度评价要求'\s*\}/)
  assert.doesNotMatch(staticHtml, /data-tab="suitability">适岗度评价要求<\/button>/)
})
