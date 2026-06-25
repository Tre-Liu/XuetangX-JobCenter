import { access, readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const styles = await readCssWithImports(new URL('../src/styles.css', import.meta.url))
const figmaAiAsset = new URL('../public/figma-assets/job-portrait-ai-icon.png', import.meta.url)

const readPngSize = (buffer) => ({
  width: buffer.readUInt32BE(16),
  height: buffer.readUInt32BE(20)
})

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
  assert.match(appVue, /class="research-compact-ai research-figma-ai"/)
  assert.match(appVue, /class="research-figma-ai-mark"/)
  assert.match(appVue, /class="research-figma-ai-icon" src="\/figma-assets\/job-portrait-ai-icon\.png\?v=figma-export-2085665242"/)
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
  assert.match(styles, /\.research-figma-ai/)
  assert.match(styles, /\.research-figma-ai-icon/)
  assert.match(styles, /\.research-compact-ai ul\s*\{[^}]*flex-direction:\s*column/)
  assert.doesNotMatch(styles, /\.research-compact-ai\s*\{[^}]*grid-template-columns:/)
  assert.doesNotMatch(styles, /\.research-compact-ai ul\s*\{[^}]*grid-template-columns:/)
  assert.doesNotMatch(styles, /\.research-figma-ai-mark i/)
  assert.doesNotMatch(styles, /\.research-analysis-list/)
  assert.doesNotMatch(styles, /\.forecast-strip/)
})

test('research AI brief uses the exported Figma image asset instead of a CSS-drawn cube', async () => {
  await assert.doesNotReject(() => access(figmaAiAsset))
  const asset = await readFile(figmaAiAsset)
  assert.deepEqual(readPngSize(asset), { width: 58, height: 58 })
  assert.match(styles, /\.research-figma-ai-icon\s*\{[\s\S]*width:\s*44px;[\s\S]*height:\s*48px;/)
  assert.match(styles, /\.research-figma-ai-mark strong\s*\{[\s\S]*background:\s*linear-gradient\(90deg, #2f6cff 0%, #8a5cff 100%\);[\s\S]*-webkit-text-fill-color:\s*transparent;/)
})
