import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')

test('app imports the decision center mock and tracks module + page state', () => {
  for (const pattern of [
    /from '\.\/mock\/decision-center'/,
    /const activeDecision\w+\s*=\s*ref\(/,
    /const decisionPlanStatus\s*=\s*ref\(/,
    /const decisionCourseStatus\s*=\s*ref\(/
  ]) {
    assert.match(appVue, pattern)
  }
})

test('app renders the approved decision-center navigation and flow actions', () => {
  for (const label of [
    '专业决策中枢',
    '专业建设治理',
    '专业质量监控',
    '专业运行数据',
    '专业全局概览',
    '培养方案分析',
    '课程体系诊断',
    '开始分析',
    '重新方案分析',
    '课程交叉分析'
  ]) {
    assert.match(appVue, new RegExp(label))
  }
})

test('app includes persistence-related decision-center wiring tokens', () => {
  for (const pattern of [
    /localStorage/,
    /decision-center-state/,
    /setItem|getItem/,
    /JSON\.stringify|JSON\.parse/
  ]) {
    assert.match(appVue, pattern)
  }
})
