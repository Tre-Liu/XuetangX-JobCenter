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
