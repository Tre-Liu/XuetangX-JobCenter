import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')

test('policy and job keyword widgets use the heat panel component in both entries', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /keyword-heat-panel/)
    assert.match(source, /policy-keyword-panel/)
    assert.match(source, /job-skill-heat-panel/)
  }
})

test('rotated word cloud containers are removed from both entries', () => {
  for (const source of [appVue, staticHtml]) {
    assert.doesNotMatch(source, /policy-word-cloud/)
    assert.doesNotMatch(source, /word-cloud-stage/)
    assert.doesNotMatch(source, /word-cloud-node/)
    assert.doesNotMatch(source, /word-cloud-orbit/)
  }
})
