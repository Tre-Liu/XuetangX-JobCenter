import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const decisionMock = await readFile(new URL('../src/mock/decision-center.ts', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

test('AI dock suggestion opens hot-job analysis advice in both Vue and file fallback', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /热门岗位分析建议/)
    assert.match(source, /优化专业结构，从这里开始/)
    assert.match(source, /data-ai-suggestion-key="hot-jobs"/)
    assert.match(source, /ai-suggestion-panel/)
  }
})

test('right-side support avatar uses the same AI suggestion trigger', () => {
  assert.match(
    appVue,
    /class="support-avatar"[\s\S]*data-ai-dock-toggle[\s\S]*@click\.stop="toggleAiSuggestionPanel"/
  )
  assert.match(
    staticHtml,
    /class="support-avatar"[\s\S]*data-ai-dock-toggle/
  )
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
    /\.ai-analysis-header div\s*\{[\s\S]*grid-column:\s*3;[\s\S]*justify-self:\s*end;/
  )
})
