import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const stylesCss = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')

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
