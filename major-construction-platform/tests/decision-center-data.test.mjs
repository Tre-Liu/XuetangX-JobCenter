import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const decisionMock = await readFile(new URL('../src/mock/decision-center.ts', import.meta.url), 'utf8')

test('decision center mock exports overview, governance flows, and placeholder pages', () => {
  for (const token of [
    'export const decisionCenterOverview',
    'export const decisionCenterMenuGroups',
    'export const planAnalysisStates',
    'export const courseDiagnosisStates',
    'export const governancePlaceholderPages'
  ]) {
    assert.match(decisionMock, new RegExp(token))
  }
})

test('decision center mock includes the approved navigation labels', () => {
  for (const label of [
    '专业决策中枢',
    '专业建设治理',
    '专业质量监控',
    '专业运行数据',
    '专业全局概览',
    '培养方案分析',
    '课程体系诊断',
    '课程交叉分析',
    '专业改进建议',
    'AI课程运行'
  ]) {
    assert.match(decisionMock, new RegExp(label))
  }
})

test('plan and course diagnosis states include pending, loading, result, and warning views', () => {
  for (const token of [
    "status: 'pending'",
    "status: 'loading'",
    "status: 'result'",
    "status: 'warning'",
    '开始分析',
    '重新方案分析',
    '课程体系信息校验结果'
  ]) {
    assert.match(decisionMock, new RegExp(token))
  }
})
