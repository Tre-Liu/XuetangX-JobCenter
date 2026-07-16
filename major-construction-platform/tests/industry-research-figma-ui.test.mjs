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

const desktopStackStart = styles.indexOf('@media (max-width: 1180px) {\n  .industry-chain-head')
const mobileStackStart = styles.indexOf('@media (max-width: 720px)', desktopStackStart)
const desktopStackStyles = styles.slice(desktopStackStart, mobileStackStart)

test('industry research chain and region share the Figma board contract', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /industry-research-figma-board/)
    assert.match(source, /industry-figma-kpi-card/)
    assert.match(source, /industry-region-figma-dashboard/)
    assert.match(source, /产业链结构图谱/)
    assert.match(source, /全国企业区域分布/)
  }
  assert.match(appVue, /return '省份排名 TOP15'/)
  assert.match(staticHtml, /省份排名 TOP15/)
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

test('AI deduplicated company KPI opens the shared Figma detail dialog in both entries', () => {
  assert.match(appVue, /class="industry-figma-kpi-card ai-company-metric-trigger"/)
  assert.match(appVue, /@click="openAiCompanyMetricDialog\(\$event\)"/)
  assert.match(appVue, /selectedIndustryMetricDialog/)
  assert.match(appVue, /sourceReportedCount/)
  assert.match(appVue, /sourceMembershipCount/)
  assert.match(appVue, /pendingCompanyCount/)

  assert.match(staticHtml, /data-static-ai-company-metric="deduplicated-companies"/)
  assert.match(staticHtml, /showStaticAiCompanyMetricDialog/)
  assert.match(staticHtml, /sourceReportedCount/)
  assert.match(staticHtml, /sourceMembershipCount/)
  assert.match(staticHtml, /pendingCompanyCount/)

  for (const source of [appVue, staticHtml]) {
    assert.match(source, /跨来源企业去重口径/)
    assert.match(source, /数据来源/)
    assert.match(source, /人工智能/)
    assert.match(source, /智能视觉/)
    assert.match(source, /智能语音识别/)
  }
  assert.match(styleBlock('.ai-company-metric-trigger'), /cursor:\s*pointer/)
})

test('industry research Figma surfaces use the approved background opacity and radii', () => {
  assert.match(styleBlock('.job-research-page:has(.industry-research-figma-board)'), /background:\s*#d7e4ff/i)
  assert.match(styleBlock('.industry-research-figma-board'), /--figma-board-surface:\s*rgba\(255,\s*255,\s*255,\s*0\.7\)/i)
  assert.match(styleBlock('.industry-research-figma-board'), /--figma-board-radius:\s*16px/)
  assert.match(styleBlock('.industry-research-figma-board'), /--figma-item-radius:\s*8px/)
  assert.match(styleBlock('.research-card.industry-chain-figma-board'), /background:\s*var\(--figma-board-surface\)/)
  assert.match(styleBlock('.research-card.industry-chain-figma-board'), /border-radius:\s*var\(--figma-board-radius\)/)
})

test('chain KPI cards and stage headers match the Figma geometry and gradients', () => {
  assert.match(styleBlock('.industry-national-kpis'), /gap:\s*16px/)
  assert.match(styleBlock('.industry-figma-kpi-card'), /min-height:\s*127px/)
  assert.match(styleBlock('.industry-figma-kpi-card'), /padding:\s*12px\s+14px/)
  assert.match(styleBlock('.industry-treemap-stage header'), /min-height:\s*60px/)
  assert.match(styleBlock('.industry-treemap-stage header'), /height:\s*60px/)
  assert.match(styleBlock('.industry-treemap-stage header'), /box-sizing:\s*border-box/)
  assert.match(styleBlock('.industry-treemap-stage header'), /linear-gradient\(90deg,\s*#edf4ff\s+0%,\s*#b5ccff\s+100%\)/i)
  assert.match(styleBlock('.industry-treemap-stage.stage-midstream header'), /linear-gradient\(90deg,\s*#e9f8fe\s+0%,\s*#a8dfe7\s+100%\)/i)
  assert.match(styleBlock('.industry-treemap-stage.stage-downstream header'), /linear-gradient\(90deg,\s*#f5f2ff\s+0%,\s*#d4bfff\s+100%\)/i)
  assert.match(styleBlock('.industry-treemap-stage.stage-upstream header'), /clip-path:/)
})

test('treemap stages form one continuous desktop lane with interlocking arrows', () => {
  assert.match(styleBlock('.industry-treemap-board'), /align-items:\s*stretch/)
  assert.match(styleBlock('.industry-treemap-board'), /gap:\s*0/)
  assert.match(styleBlock('.industry-treemap-board'), /padding:\s*0/)
  assert.match(styleBlock('.industry-treemap-board'), /overflow:\s*hidden/)
  assert.match(styleBlock('.industry-treemap-stage'), /border:\s*0/)
  assert.match(styleBlock('.industry-treemap-stage'), /border-radius:\s*0/)
  assert.match(styleBlock('.industry-treemap-stage header'), /border-radius:\s*0/)
  assert.match(
    styleBlock('.industry-treemap-stage.stage-upstream header'),
    /margin-right:\s*calc\(\(var\(--treemap-pad\) \+ 18px\) \* -1\)/,
  )
  assert.match(
    styles,
    /\.industry-treemap-stage\.stage-midstream header\s*\{[^}]*margin-right:\s*calc\(\(var\(--treemap-pad\) \+ 18px\) \* -1\)/s,
  )
  assert.match(desktopStackStyles, /\.industry-treemap-board\s*\{[^}]*gap:\s*var\(--treemap-gap\)[^}]*padding:\s*var\(--treemap-pad\)/s)
  assert.match(desktopStackStyles, /\.industry-treemap-stage\s*\{[^}]*border:\s*1px solid #e2eaf8[^}]*border-radius:\s*8px/s)
})

test('regional heatmap uses the eight Figma scale colors plus low-data fallback', () => {
  for (const color of [
    '#0A2EC9', '#173FFB', '#113FFF', '#346BFF',
    '#5992FF', '#8BB0FF', '#B5D6FF', '#D6EAFF'
  ]) assert.match(styles.toUpperCase(), new RegExp(color.toUpperCase()))
  assert.match(styles.toUpperCase(), /#E7F0FF/)
  assert.doesNotMatch(styles.toUpperCase(), /#8BBAFF/)
  assert.match(styleBlock('.industry-region-figma-dashboard'), /grid-template-columns:\s*minmax\(0,\s*2\.04fr\)\s+minmax\(320px,\s*1fr\)/)
  assert.match(styleBlock('.industry-region-figma-dashboard'), /gap:\s*16px/)
  assert.match(
    styles,
    /\.industry-region-figma-dashboard \.professional-geo-map-card,\s*\.industry-region-figma-dashboard \.industry-rank-card\s*\{[^}]*min-height:\s*629px/s,
  )
  assert.match(styleBlock('.industry-region-figma-dashboard .province-rank-list'), /gap:\s*4px/)
  assert.match(styleBlock('.industry-region-grid'), /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/)
})

test('regional KPI cards override the shared demand-card cascade with Figma dimensions', () => {
  assert.match(styleBlock('.demand-kpi-grid.industry-region-kpi-grid'), /gap:\s*16px/)
  assert.match(styleBlock('.demand-kpi-grid.industry-region-kpi-grid .industry-figma-kpi-card'), /min-height:\s*127px/)
  assert.match(styleBlock('.demand-kpi-grid.industry-region-kpi-grid .industry-figma-kpi-card'), /padding:\s*12px\s+14px/)
  assert.match(styleBlock('.demand-kpi-grid.industry-region-kpi-grid .industry-figma-kpi-card'), /background:\s*rgba\(255,\s*255,\s*255,\s*0\.7\)/)
})

test('Figma chain and regional layouts stack cleanly at the desktop breakpoint', () => {
  assert.notEqual(desktopStackStart, -1)
  assert.notEqual(mobileStackStart, -1)
  assert.match(
    styleBlock('.industry-treemap-board'),
    /grid-template-columns:\s*minmax\(0,\s*1\.08fr\)\s+minmax\(0,\s*1fr\)\s+minmax\(0,\s*0\.96fr\)/,
  )
  assert.match(desktopStackStyles, /\.industry-treemap-board\s*\{[^}]*grid-template-columns:\s*1fr/s)
  assert.match(desktopStackStyles, /\.industry-region-figma-dashboard\s*\{[^}]*grid-template-columns:\s*1fr/s)
  assert.match(desktopStackStyles, /\.industry-treemap-stage\.stage-upstream header,[\s\S]*clip-path:\s*none/)
})

test('Figma KPI cards expose focus and compact desktop layout', () => {
  assert.match(styleBlock('.industry-national-kpis'), /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(styles, /\.industry-figma-kpi-card:hover[\s\S]*\.industry-figma-kpi-card:focus-visible/)
  assert.match(styleBlock('.industry-national-detail-dialog'), /width:\s*min\(720px,\s*calc\(100vw\s*-\s*48px\)\)/)
})
