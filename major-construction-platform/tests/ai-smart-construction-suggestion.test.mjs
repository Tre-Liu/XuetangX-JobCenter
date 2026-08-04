import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const decisionMock = await readFile(new URL('../src/mock/decision-center.ts', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

test('AI assistant exposes the same four suggestions in Vue and file fallback', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /热门岗位分析建议/)
    assert.match(source, /优化专业结构，从这里开始/)
    assert.match(source, /data-ai-suggestion-key="hot-jobs"/)
    assert.match(source, /ai-suggestion-panel/)
  }
})

test('AI assistant is globally available and reports its expanded state', () => {
  assert.match(appVue, /class="support-avatar global-ai-assistant"/)
  assert.match(appVue, /aria-label="AI助手"/)
  assert.match(appVue, /:aria-expanded="aiSuggestionPanelOpen"/)
  assert.match(staticHtml, /class="support-avatar global-ai-assistant"/)
  assert.match(staticHtml, /aria-label="AI助手"/)
})

test('hot-job suggestion opens the Vue analysis modal', () => {
  assert.doesNotMatch(appVue, /if \(key === 'hot-jobs'\) return/)
  assert.match(
    appVue,
    /if \(key === 'hot-jobs'\) \{[\s\S]*activeAiAnalysisKey\.value = 'hot-jobs'[\s\S]*return/
  )
  assert.match(appVue, /@keydown\.esc="closeAiAnalysisModal"/)
  assert.match(appVue, /ref="aiAnalysisCloseRef"/)
  assert.match(appVue, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(appVue, /aiAnalysisReturnFocus[\s\S]*focus\(\{ preventScroll: true \}\)/)
})

test('hot-job suggestion opens the static analysis modal', () => {
  assert.doesNotMatch(staticHtml, /if \(key === 'hot-jobs'\) return/)
  assert.match(
    staticHtml,
    /if \(key === 'hot-jobs'\) \{[\s\S]*openStaticAiAnalysis\([\s\S]*return/
  )
  assert.match(staticHtml, /app\.insertAdjacentHTML\('beforeend', staticAiAnalysisModalHtml\(\)\)/)
  assert.match(staticHtml, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(staticHtml, /const closeStaticAiAnalysis = \(\) =>/)
  assert.match(staticHtml, /staticAiAnalysisReturnFocus[\s\S]*focus\(\{ preventScroll: true \}\)/)
})

test('AI suggestion panel supports outside click without closing from panel clicks', () => {
  assert.match(appVue, /<main v-else class="app-shell" @click="closeAiSuggestionPanel">/)
  assert.match(appVue, /id="ai-suggestion-panel"[\s\S]*@click\.stop/)
  assert.match(
    staticHtml,
    /staticAiSuggestionPanelOpen && !target\.closest\('\.ai-suggestion-panel'\)/
  )
})

test('right-side support avatar uses the same AI suggestion trigger', () => {
  assert.match(
    appVue,
    /class="support-avatar global-ai-assistant"[\s\S]*data-ai-dock-toggle[\s\S]*@click\.stop="toggleAiSuggestionPanel"/
  )
  assert.match(
    staticHtml,
    /class="support-avatar global-ai-assistant"[\s\S]*data-ai-dock-toggle/
  )
})

test('AI assistant matches the reference dimensions and responsive bounds', () => {
  assert.match(
    stylesCss,
    /\.global-ai-assistant\s*\{[\s\S]*position:\s*fixed;[\s\S]*right:\s*28px;[\s\S]*bottom:\s*28px;/
  )
  assert.match(
    stylesCss,
    /\.global-ai-assistant\s*\{[\s\S]*width:\s*58px;[\s\S]*height:\s*58px;/
  )
  assert.match(
    stylesCss,
    /\.ai-suggestion-panel\s*\{[\s\S]*width:\s*336px;[\s\S]*border-radius:\s*18px;/
  )
  assert.match(stylesCss, /\.ai-suggestion-item\s*\{[\s\S]*min-height:\s*83px;/)
  assert.match(stylesCss, /max-width:\s*calc\(100vw - 32px\);/)
  assert.match(stylesCss, /max-height:\s*calc\(100vh - 118px\);/)
  assert.match(stylesCss, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(appVue, /ai-assistant-avatar\.png/)
  assert.match(staticHtml, /public\/figma-assets\/ai-assistant-avatar\.png/)
})

test('hot-job analysis advice content uses smart construction industry and major data', () => {
  for (const text of [
    '智能建造工程专业',
    '智能建造产业链',
    'BIM深化设计工程师',
    '智慧工地管理工程师',
    '建筑机器人应用工程师',
    '结构健康监测工程师',
    '装配式建筑深化设计师',
    '智能测量工程师',
    'BIM深化设计',
    '智慧工地平台',
    '建筑机器人应用实训'
  ]) {
    assert.match(decisionMock, new RegExp(text))
    assert.match(staticHtml, new RegExp(text))
  }
})

test('hot-job analysis modal has a high-definition long-page shell', () => {
  for (const pattern of [
    /\.ai-analysis-modal\s*\{/,
    /width:\s*min\(calc\(100vw - 96px\),\s*1720px\);/,
    /height:\s*calc\(100vh - 96px\);/,
    /overflow-y:\s*auto;/,
    /scrollbar-gutter:\s*stable;/,
    /\.ai-analysis-modal-page\s*\{/,
    /min-width:\s*1180px;/
  ]) {
    assert.match(stylesCss, pattern)
  }
})

test('hot-job analysis modal title is centered across the full header', () => {
  assert.match(
    stylesCss,
    /\.ai-analysis-header\s*\{[\s\S]*grid-template-columns:\s*1fr auto 1fr;/
  )
  assert.match(
    stylesCss,
    /\.ai-analysis-header h2\s*\{[\s\S]*grid-column:\s*2;[\s\S]*justify-self:\s*center;/
  )
  assert.match(
    stylesCss,
    /\.ai-analysis-header div\s*\{[\s\S]*grid-column:\s*3;[\s\S]*justify-self:\s*end;[\s\S]*margin-right:\s*56px;/
  )
})
