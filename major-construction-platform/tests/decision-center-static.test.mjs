import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const appConfig = await readFile(new URL('../src/app/app-config.ts', import.meta.url), 'utf8')
const jobResearchMock = await readFile(new URL('../src/mock/job-research.ts', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))
const styleBlock = (selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = stylesCss.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`))
  assert.ok(match, `${selector} style block should exist`)
  return match[1]
}
const lastStyleBlock = (selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = [...stylesCss.matchAll(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`, 'g'))]
  assert.ok(matches.length, `${selector} style block should exist`)
  return matches[matches.length - 1][1]
}

test('static file entry exposes decision-center module rendering and persistence hooks', () => {
  for (const pattern of [
    /data-module="decision"/,
    /renderDecisionCenter/,
    /renderDecisionOverview/,
    /renderDecisionPlanAnalysis/,
    /renderDecisionCourseDiagnosis/,
    /decision-center-state/,
    /improvementState/,
    /planModeTab/,
    /restoredPlanStatus === 'loading' \? 'pending' : restoredPlanStatus/,
    /restoredCourseStatus === 'loading' \? 'pending' : restoredCourseStatus/,
    /localStorage/
  ]) {
    assert.match(staticHtml, pattern)
  }
})

test('decision-center styles include the main shell, stage, report tabs, and warning cards', () => {
  for (const pattern of [
    /\.decision-content-area/,
    /\.decision-sidebar/,
    /\.decision-side-group/,
    /\.decision-stage-shell/,
    /\.decision-stage-orbit/,
    /\.decision-report-tabs/,
    /\.decision-alert-card/,
    /\.decision-placeholder-page/
  ]) {
    assert.match(stylesCss, pattern)
  }
})

test('decision-center long-form pages keep a vertical scroll container', () => {
  assert.match(
    stylesCss,
    /\.decision-content-area\s*\{[\s\S]*overflow:\s*hidden;/
  )
  assert.match(
    stylesCss,
    /\.decision-center-card\s*\{[\s\S]*overflow-x:\s*hidden;[\s\S]*overflow-y:\s*auto;/
  )
  assert.match(
    stylesCss,
    /\.decision-center-card\s*\{[\s\S]*overscroll-behavior:\s*contain;[\s\S]*scrollbar-gutter:\s*stable;/
  )
})

test('improvement state switcher uses compact tab styling instead of large action-card buttons', () => {
  assert.match(
    stylesCss,
    /\.decision-improvement-state-switcher button\s*\{[\s\S]*min-height:\s*56px;[\s\S]*padding:\s*10px 16px;[\s\S]*border-radius:\s*10px;/
  )
})

test('decision center uses tighter radii for a more formal report-like visual tone', () => {
  for (const pattern of [
    /\.decision-center-card\s*\{[\s\S]*border-radius:\s*18px;/,
    /\.decision-improvement-signal,[\s\S]*\.decision-improvement-state-card\s*\{[\s\S]*border-radius:\s*16px;/,
    /\.decision-improvement-matrix,[\s\S]*\.decision-improvement-timeline\s*\{[\s\S]*border-radius:\s*18px;/,
    /\.decision-improvement-matrix-row\s*\{[\s\S]*border-radius:\s*12px;/
  ]) {
    assert.match(stylesCss, pattern)
  }
})

test('decision center sidebar follows flat web navigation component rules', () => {
  assert.match(
    stylesCss,
    /\.decision-sidebar\s*\{[\s\S]*gap:\s*16px;[\s\S]*padding:\s*20px 14px 16px;[\s\S]*background:\s*var\(--web-panel\);/
  )
  assert.match(
    stylesCss,
    /\.decision-side-group\s*\{[\s\S]*gap:\s*6px;[\s\S]*padding:\s*0;[\s\S]*border:\s*0;[\s\S]*border-radius:\s*8px;[\s\S]*background:\s*transparent;/
  )
  assert.match(
    stylesCss,
    /\.decision-side-group-title span\s*\{[\s\S]*width:\s*24px;[\s\S]*height:\s*24px;[\s\S]*border-radius:\s*6px;/
  )
  assert.match(
    stylesCss,
    /\.decision-side-item\s*\{[\s\S]*min-height:\s*40px;[\s\S]*padding:\s*0 12px 0 32px;[\s\S]*border-radius:\s*8px;/
  )
  assert.match(
    stylesCss,
    /\.decision-side-item\.active\s*\{[\s\S]*color:\s*#ffffff;[\s\S]*background:\s*var\(--web-primary\);/
  )
  const sideGroupBlock = styleBlock('.decision-side-group')
  assert.doesNotMatch(sideGroupBlock, /box-shadow:/)
  assert.doesNotMatch(sideGroupBlock, /backdrop-filter:/)
})

test('job center sidebar matches the Figma secondary navigation position', () => {
  for (const label of [
    '产业调研',
    '产业布局',
    '产业链图谱',
    '岗位分析',
    '岗位画像分析',
    '招聘需求趋势',
    '新岗位新技术',
    '报告生成',
    '调研报告生成',
    '岗位建设中心',
    '岗位建设'
  ]) {
    assert.match(`${appVue}\n${jobResearchMock}`, new RegExp(label))
    assert.match(staticHtml, new RegExp(label))
  }

  assert.match(appVue, /const currentModule = ref\(isCourseModelView \? '课程模型' : '岗位中心'\)/)
  assert.match(appVue, /const currentJobSection = ref\('产业调研'\)/)
  assert.match(appVue, /const isJobResearchView = currentViewParam === 'job-research'/)
  assert.match(appVue, /const currentJobResearchMode = ref<'industry' \| 'job'>\(isJobResearchView \? 'job' : 'industry'\)/)
  assert.match(appVue, /产业调研:\s*true/)
  assert.doesNotMatch(appVue, /产业调研报告:\s*false/)
  assert.match(staticHtml, /const shellStart = \(activeModule = 'job', activeSection = 'research', activeResearchTab = '', activeIndustryTab = 'chain'\)/)
  assert.match(staticHtml, /data-job-primary="research"[\s\S]*<strong>产业调研<\/strong>/)
  assert.match(staticHtml, /data-job-primary="report"[\s\S]*<strong>报告生成<\/strong>/)
  assert.match(staticHtml, /data-job-primary="build"[\s\S]*<strong>岗位建设中心<\/strong>/)
  assert.doesNotMatch(staticHtml, /activeResearchSubtitle/)
  assert.doesNotMatch(staticHtml, /<em>· \$\{activeResearchSubtitle\} ·<\/em>/)
  assert.doesNotMatch(appVue, /<em>· \{\{ currentJobResearchMode === 'industry' \? '产业布局' : '岗位分析' \}\} ·<\/em>/)
  assert.match(staticHtml, /<div class="job-sub-title">· 产业布局 ·<\/div>[\s\S]*<div class="job-sub-title job-sub-title-spaced">· 岗位分析 ·<\/div>/)
  assert.match(appVue, /<div class="job-sub-title">· 产业布局 ·<\/div>[\s\S]*<div class="job-sub-title job-sub-title-spaced">· 岗位分析 ·<\/div>/)
  assert.doesNotMatch(staticHtml, /<div class="job-sub-title">产业布局<\/div>/)
  assert.doesNotMatch(staticHtml, /<div class="job-sub-title job-sub-title-spaced">岗位分析<\/div>/)
  assert.doesNotMatch(appVue, /<div class="job-sub-title">产业布局<\/div>/)
  assert.doesNotMatch(appVue, /<div class="job-sub-title job-sub-title-spaced">岗位分析<\/div>/)
  assert.match(staticHtml, /data-job-section="report"[\s\S]*调研报告生成/)
  assert.match(staticHtml, /data-job-section="build"[\s\S]*岗位建设/)
  assert.doesNotMatch(staticHtml, /data-job-menu="report"[\s\S]*产业调研报告/)

  assert.match(
    stylesCss,
    /\.job-module-menu\s*\{[\s\S]*width:\s*176px;[\s\S]*flex:\s*0 0 176px;[\s\S]*padding:\s*31px 24px 16px;[\s\S]*background:\s*var\(--web-panel\);/
  )
  assert.match(
    stylesCss,
    /\.job-figma-menu\s*\{[\s\S]*background:[\s\S]*linear-gradient\(90deg,[\s\S]*var\(--web-panel\);/
  )
  assert.match(
    stylesCss,
    /\.job-research-heading\s*\{[\s\S]*width:\s*128px;[\s\S]*min-height:\s*74px;[\s\S]*gap:\s*6px;[\s\S]*text-align:\s*center;/
  )
  assert.match(
    stylesCss,
    /\.job-research-icon\s*\{[\s\S]*width:\s*34px;[\s\S]*height:\s*34px;[\s\S]*linear-gradient\(135deg,[\s\S]*#8b5cf6 100%\);/
  )
  assert.match(
    stylesCss,
    /\.job-research-heading strong\s*\{[\s\S]*font-size:\s*15px;[\s\S]*font-weight:\s*800;[\s\S]*line-height:\s*20px;/
  )
  assert.match(
    stylesCss,
    /\.job-research-heading em\s*\{[\s\S]*font-size:\s*12px;[\s\S]*font-weight:\s*400;[\s\S]*line-height:\s*20px;[\s\S]*letter-spacing:\s*0;/
  )
  assert.match(
    stylesCss,
    /\.job-menu-button\s*\{[\s\S]*width:\s*128px;[\s\S]*height:\s*30px;[\s\S]*margin:\s*8px auto 0;[\s\S]*border-radius:\s*8px;/
  )
  assert.match(
    stylesCss,
    /\.job-menu-button\.selected\s*\{[\s\S]*color:\s*#ffffff;[\s\S]*background:\s*linear-gradient\(90deg, #1d6fff 0%, #8b5cf6 100%\);/
  )
  assert.match(
    stylesCss,
    /\.job-research-menu-card\.open\s*\{[\s\S]*max-height:\s*none;[\s\S]*margin-top:\s*0;[\s\S]*overflow:\s*visible;/
  )
  assert.match(
    stylesCss,
    /\.job-sub-title\s*\{[\s\S]*font-family:\s*"PingFang SC", "Microsoft YaHei", sans-serif;[\s\S]*font-size:\s*12px;[\s\S]*font-weight:\s*400;[\s\S]*line-height:\s*20px;[\s\S]*letter-spacing:\s*0;/
  )
  assert.match(
    stylesCss,
    /\.job-sub-button\s*\{[\s\S]*width:\s*128px;[\s\S]*height:\s*30px;[\s\S]*margin:\s*8px 0 0;[\s\S]*padding:\s*5px 14px;[\s\S]*font-family:\s*"PingFang SC", "Microsoft YaHei", sans-serif;[\s\S]*font-size:\s*13px;[\s\S]*line-height:\s*20px;[\s\S]*letter-spacing:\s*0;[\s\S]*background:\s*rgba\(255, 255, 255, 0\.7\);/
  )
  assert.match(
    stylesCss,
    /\.job-sub-button\.selected\s*\{[\s\S]*color:\s*#ffffff;[\s\S]*background:\s*linear-gradient\(90deg, #1d6fff 0%, #8b5cf6 100%\);/
  )
  assert.doesNotMatch(styleBlock('.job-sub-button.selected'), /box-shadow:\s*inset/)
})

test('job center sidebars follow the same flat web navigation rules', () => {
  assert.match(
    stylesCss,
    /\.job-module-menu\s*\{[\s\S]*width:\s*176px;[\s\S]*padding:\s*31px 24px 16px;[\s\S]*text-align:\s*center;[\s\S]*background:\s*var\(--web-panel\);/
  )
  assert.match(
    stylesCss,
    /\.job-module-title-icon\s*\{[\s\S]*width:\s*28px;[\s\S]*height:\s*28px;[\s\S]*box-shadow:\s*none;/
  )
  assert.match(
    stylesCss,
    /\.job-menu-button\s*\{[\s\S]*width:\s*128px;[\s\S]*height:\s*30px;[\s\S]*margin:\s*8px auto 0;[\s\S]*border-radius:\s*8px;/
  )
  assert.match(
    stylesCss,
    /\.job-sub-title\s*\{[\s\S]*font-size:\s*12px;[\s\S]*line-height:\s*20px;[\s\S]*text-align:\s*center;/
  )
  assert.match(
    stylesCss,
    /\.job-sub-button\s*\{[\s\S]*width:\s*128px;[\s\S]*height:\s*30px;[\s\S]*margin:\s*8px 0 0;[\s\S]*font-size:\s*13px;[\s\S]*line-height:\s*20px;[\s\S]*background:\s*rgba\(255, 255, 255, 0\.7\);/
  )
  assert.match(
    stylesCss,
    /\.detail-tabs\s*\{[\s\S]*width:\s*188px;[\s\S]*flex:\s*0 0 188px;[\s\S]*background:\s*var\(--web-surface\);/
  )
  assert.match(
    stylesCss,
    /\.detail-tabs h3\s*\{[\s\S]*font-size:\s*15px;[\s\S]*font-weight:\s*800;/
  )
  assert.match(
    stylesCss,
    /\.detail-tabs button\s*\{[\s\S]*height:\s*40px;[\s\S]*border:\s*1px solid transparent;[\s\S]*border-radius:\s*8px;[\s\S]*font-size:\s*14px;/
  )
  assert.match(
    stylesCss,
    /\.detail-tabs button\.active\s*\{[\s\S]*border-color:\s*#a8c0ff;[\s\S]*color:\s*var\(--web-primary\);[\s\S]*background:\s*var\(--web-primary-soft\);/
  )
})

test('main demo shell follows the Figma web component light theme tokens', () => {
  for (const pattern of [
    /--web-bg:\s*#eef3ff;/,
    /--web-panel:\s*#e7edff;/,
    /--web-surface:\s*#ffffff;/,
    /--web-border:\s*#c7d6ff;/,
    /--web-primary:\s*#155ce8;/,
    /--web-primary-soft:\s*#dfe8ff;/,
    /--web-danger:\s*#ef3946;/,
    /--web-success:\s*#12a35b;/
  ]) {
    assert.match(stylesCss, pattern)
  }

  for (const pattern of [
    /\.app-shell\s*\{[\s\S]*background:\s*var\(--web-bg\);/,
    /\.content-area\s*\{[\s\S]*background:\s*var\(--web-bg\);/,
    /\.topbar\s*\{[\s\S]*background:\s*var\(--web-surface\);/,
    /\.module-tab\.active\s*\{[\s\S]*background:\s*var\(--web-primary-soft\);/,
    /\.section-menu\s*\{[\s\S]*background:\s*var\(--web-panel\);/,
    /\.job-module-menu\s*\{[\s\S]*background:\s*var\(--web-panel\);/,
    /\.canvas-card\s*\{[\s\S]*background:\s*var\(--web-surface\);/,
    /\.job-center-card\s*\{[\s\S]*background:\s*var\(--web-surface\);/
  ]) {
    assert.match(stylesCss, pattern)
  }
})

test('top navigation follows compact web component header rules', () => {
  assert.match(stylesCss, /--topbar-height:\s*56px;/)

  const topbarBlock = styleBlock('.topbar')
  assert.match(topbarBlock, /gap:\s*18px;/)
  assert.match(topbarBlock, /padding:\s*0 18px 0 20px;/)
  assert.doesNotMatch(topbarBlock, /box-shadow:\s*0 10px/)

  const brandBlock = styleBlock('.brand')
  assert.match(brandBlock, /width:\s*224px;/)
  assert.match(brandBlock, /flex:\s*0 0 224px;/)

  const moduleTabBlock = lastStyleBlock('.module-tab')
  assert.match(moduleTabBlock, /height:\s*32px;/)
  assert.match(moduleTabBlock, /padding:\s*0 10px;/)
  assert.match(moduleTabBlock, /font-size:\s*14px;/)
  assert.match(moduleTabBlock, /border-radius:\s*8px;/)

  const activeTabBlock = styleBlock('.module-tab.active')
  assert.match(activeTabBlock, /border-color:\s*#82a5ff;/)
  assert.match(activeTabBlock, /background:\s*var\(--web-primary-soft\);/)
  assert.doesNotMatch(activeTabBlock, /box-shadow:/)

  assert.match(
    stylesCss,
    /\.module-tab\.utility\s*\{[\s\S]*min-width:\s*64px;[\s\S]*padding:\s*0 8px;[\s\S]*color:\s*var\(--web-text-muted\);/
  )
  assert.match(appVue, /utility:\s*item\.label === '成员'/)
  assert.match(staticHtml, /class="module-tab utility" data-open-member-dialog/)
})

test('global dock follows the Figma dark plugin sidebar while the main shell stays light', () => {
  for (const pattern of [
    /--plugin-dock-bg:\s*#303241;/,
    /--plugin-dock-border:\s*#3c4054;/,
    /--plugin-dock-icon:\s*#aeb7d4;/
  ]) {
    assert.match(stylesCss, pattern)
  }

  assert.match(
    stylesCss,
    /\.dock\s*\{[\s\S]*background:\s*var\(--plugin-dock-bg\);/
  )
  assert.match(
    stylesCss,
    /\.dock-icon\s*\{[\s\S]*color:\s*var\(--plugin-dock-icon\);/
  )
  assert.match(
    stylesCss,
    /\.old-link\s*\{[\s\S]*color:\s*var\(--plugin-dock-icon\);/
  )
})

test('results portal remains a dark showcase theme separate from the main web component shell', () => {
  assert.match(
    stylesCss,
    /body:has\(\.results-portal-shell\)\s*\{[\s\S]*background:\s*var\(--results-portal-bg\);/
  )
  assert.match(
    stylesCss,
    /\.results-portal-shell\s*\{[\s\S]*background:\s*var\(--results-portal-bg\);/
  )
})

test('improvement page top-right meta uses low-emphasis two-line auxiliary text', () => {
  assert.match(
    stylesCss,
    /\.decision-improvement-meta\s*\{[\s\S]*justify-items:\s*end;[\s\S]*align-content:\s*start;[\s\S]*gap:\s*8px;/
  )
  assert.match(
    stylesCss,
    /\.decision-improvement-meta > div\s*\{[\s\S]*display:\s*grid;[\s\S]*justify-items:\s*end;[\s\S]*padding:\s*0;/
  )
  assert.match(
    stylesCss,
    /\.decision-improvement-meta > div strong\s*\{[\s\S]*margin-top:\s*0;[\s\S]*font-size:\s*15px;[\s\S]*font-weight:\s*700;/
  )
})

test('static top navigation keeps interactive hooks for major modules and shortcuts', () => {
  const topNavBlock = staticHtml.match(/const topNavHtml[\s\S]*?const courseTopNavHtml/)
  const courseTopNavBlock = staticHtml.match(/const courseTopNavHtml[\s\S]*?const decisionStorageKey/)
  const resultsMenuBlock = staticHtml.match(/const resultsMenuHtml[\s\S]*?const topNavHtml/)
  assert.ok(topNavBlock)
  assert.ok(courseTopNavBlock)
  assert.ok(resultsMenuBlock)

  for (const pattern of [
    /data-module="talent"/,
    /data-module="engine"/,
    /data-module="job"/,
    /data-open-course-model/,
    /\$\{resultsMenuHtml\}/,
    /data-open-member-dialog/
  ]) {
    assert.match(topNavBlock[0], pattern)
  }

  assert.match(resultsMenuBlock[0], /data-results-open/)

  for (const pattern of [
    /data-open-course-model/,
    /data-results-open/
  ]) {
    assert.match(courseTopNavBlock[0], pattern)
  }
})

test('decision-center bootstrap does not short-circuit global click wiring', () => {
  assert.doesNotMatch(
    staticHtml,
    /if \(staticPageView === 'decision-center' \|\| \(!staticPageView && restoreDecisionState\(\)\)\) {\s*renderDecisionCenter\(\)\s*return\s*}/
  )
  assert.match(staticHtml, /const shouldRenderDecisionCenter = staticPageView === 'decision-center'/)
  assert.doesNotMatch(appVue, /if \(!isCourseModelView && restoreDecisionState\(\)\) \{\s*currentModule\.value = '决策中心'\s*\}/)
})

test('static fallback defines a dedicated improvement page renderer and report tokens', () => {
  for (const pattern of [
    /decisionImprovementPage/,
    /renderDecisionImprovement/,
    /decision-improvement-page/,
    /decision-improvement-matrix/,
    /正在同步招聘数据与行业动态，请稍候/,
    /开始生成专业改进建议/,
    /岗位样本不足/
  ]) {
    assert.match(staticHtml, pattern)
  }
})
