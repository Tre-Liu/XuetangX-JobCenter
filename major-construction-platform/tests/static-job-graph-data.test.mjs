import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')

const staticGraphDataStart = staticHtml.indexOf('const staticChains = [')
const staticGraphDataEnd = staticHtml.indexOf('const researchTabs = [', staticGraphDataStart)
assert.ok(staticGraphDataStart > -1)
assert.ok(staticGraphDataEnd > staticGraphDataStart)
const staticGraphData = staticHtml.slice(staticGraphDataStart, staticGraphDataEnd)

test('static job graph data uses the intelligent construction industry taxonomy', () => {
  for (const label of [
    '智能建造基础资源与装备链',
    '建筑数字化平台与工程服务链',
    '智能建造场景应用链',
    'node-smart-site',
    'node-robotics',
    'node-monitoring',
    '智慧工地管理平台',
    '建筑机器人与智能装备应用',
    '智能检测监测与结构健康'
  ]) {
    assert.match(staticGraphData, new RegExp(label))
  }

  for (const oldLabel of [
    '人工智能产业链',
    '数据服务产业链',
    '智能物联产业链',
    'node-algorithm',
    'node-modelops',
    'AI算法开发与部署',
    '模型运维与智能系统集成'
  ]) {
    assert.doesNotMatch(staticGraphData, new RegExp(oldLabel))
  }
})

test('static graph courses are linked to intelligent construction jobs', () => {
  for (const relation of [
    /course-smart-project[\s\S]*job-smart-site-manager/,
    /course-robot[\s\S]*job-construction-robot-operator/,
    /course-bim-basic[\s\S]*job-bim-deepening/,
    /course-monitoring[\s\S]*job-structure-monitoring/
  ]) {
    assert.match(staticGraphData, relation)
  }
})
