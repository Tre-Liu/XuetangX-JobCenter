import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const styles = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

test('research brief strip is configured for every industry and job research page', () => {
  assert.match(appVue, /const industryResearchBriefs: Record<IndustryResearchTabKey, ResearchBrief>/)
  assert.match(appVue, /const jobResearchBriefs: Record<JobResearchTabKey, ResearchBrief>/)

  for (const key of ['chain', 'region', 'policy', 'company']) {
    assert.match(appVue, new RegExp(`${key}: \\{[\\s\\S]*?items: \\[`))
  }

  for (const key of ['portrait', 'demand', 'forecast']) {
    assert.match(appVue, new RegExp(`${key}: \\{[\\s\\S]*?items: \\[`))
  }

  assert.match(appVue, /const activeResearchBrief = computed/)
})

test('research pages render one compact shared brief strip instead of page-specific ai strips', () => {
  assert.match(appVue, /class="research-compact-ai"/)
  assert.match(appVue, /v-for="item in activeResearchBrief\.items"/)

  for (const oldClass of [
    'industry-layout-summary',
    'research-analysis-list',
    'policy-ai-summary',
    'forecast-strip'
  ]) {
    assert.doesNotMatch(appVue, new RegExp(oldClass))
  }

  assert.match(styles, /\.research-compact-ai/)
  assert.match(styles, /\.research-compact-ai ul\s*\{[^}]*flex-direction:\s*column/)
  assert.doesNotMatch(styles, /\.research-compact-ai\s*\{[^}]*grid-template-columns:/)
  assert.doesNotMatch(styles, /\.research-compact-ai ul\s*\{[^}]*grid-template-columns:/)
  assert.doesNotMatch(styles, /\.research-analysis-list/)
  assert.doesNotMatch(styles, /\.forecast-strip/)
})
