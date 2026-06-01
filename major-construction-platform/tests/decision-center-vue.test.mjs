import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')

test('app imports the decision center mock and tracks module + page state', () => {
  for (const pattern of [
    /from '\.\/mock\/decision-center'/,
    /const activeDecision\w+\s*=\s*ref\(/,
    /const decisionPlanStatus\s*=\s*ref(?:<[^>]+>)?\(/,
    /const decisionCourseStatus\s*=\s*ref(?:<[^>]+>)?\(/
  ]) {
    assert.match(appVue, pattern)
  }
})

test('app renders the approved decision-center navigation and flow actions', () => {
  for (const pattern of [
    /decisionCenterMenuGroups/,
    /activeDecisionPage === 'overview'/,
    /activeDecisionPage === 'plan-analysis'/,
    /activeDecisionPage === 'course-diagnosis'/,
    /startDecisionPlanAnalysis|startDecisionCourseAnalysis/,
    /重新方案分析/,
    /课程交叉分析|courseDiagnosisStates\.(?:pending\.modeTabs|result\.topTabs)/,
    /v-for="tab in courseDiagnosisStates\.(?:pending\.modeTabs|result\.topTabs)"[\s\S]{0,220}@click="activeDecisionCourseTab = tab"/
  ]) {
    assert.match(appVue, pattern)
  }
})

test('app includes persistence-related decision-center wiring tokens', () => {
  for (const pattern of [
    /localStorage/,
    /decision-center-state/,
    /active:\s*currentModule\.value === '决策中心'/,
    /restoredPlanStatus === 'loading' \? 'pending' : restoredPlanStatus/,
    /restoredCourseStatus === 'loading' \? 'pending' : restoredCourseStatus/,
    /planModeTab/,
    /setItem|getItem/,
    /JSON\.stringify|JSON\.parse/
  ]) {
    assert.match(appVue, pattern)
  }
})

test('app renders a dedicated improvement report layout instead of the generic placeholder page', () => {
  for (const pattern of [
    /decisionImprovementPage/,
    /activeDecisionPage === 'improvement'/,
    /decision-improvement-page/,
    /decision-improvement-hero/,
    /decision-improvement-matrix/,
    /decision-improvement-actions/,
    /decision-improvement-timeline/,
    /decisionImprovementState/
  ]) {
    assert.match(appVue, pattern)
  }
})
