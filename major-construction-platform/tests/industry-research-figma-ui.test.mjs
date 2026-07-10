import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const styles = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

const styleBlock = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return styles.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

test('industry research chain and region share the Figma board contract', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /industry-research-figma-board/)
    assert.match(source, /industry-figma-kpi-card/)
    assert.match(source, /industry-region-figma-dashboard/)
    assert.match(source, /产业链结构图谱/)
    assert.match(source, /全国企业区域分布/)
    assert.match(source, /省份排名 TOP15/)
  }
})

test('industry metric detail dialog keeps the Figma sections and accessible title', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /national-industry-metric-title/)
    assert.match(source, /aria-modal="true"/)
    assert.match(source, /统计口径/)
    assert.match(source, /关联行业/)
    assert.match(source, /专业建设提示/)
  }
  assert.match(appVue, /@keydown\.esc="closeNationalIndustryMetricDialog"/)
  assert.match(staticHtml, /id="national-industry-metric-title"/)
})

test('regional heatmap uses the nine Figma color stops', () => {
  for (const color of [
    '#0A2EC9', '#173FFB', '#113FFF', '#346BFF', '#5992FF',
    '#8BBAFF', '#B5D6FF', '#D6EAFF', '#E7F0FF'
  ]) assert.match(styles.toUpperCase(), new RegExp(color.toUpperCase()))
  assert.match(styleBlock('.industry-region-figma-dashboard'), /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+320px/)
  assert.match(styleBlock('.industry-region-grid'), /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/)
})

test('Figma KPI cards expose focus and compact desktop layout', () => {
  assert.match(styleBlock('.industry-national-kpis'), /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(styles, /\.industry-figma-kpi-card:hover[\s\S]*\.industry-figma-kpi-card:focus-visible/)
  assert.match(styleBlock('.industry-national-detail-dialog'), /width:\s*min\(720px,\s*calc\(100vw\s*-\s*48px\)\)/)
})
