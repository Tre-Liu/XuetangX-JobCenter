import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const staticStyles = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

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

test('static job ability graph renders task names instead of task objects', () => {
  assert.doesNotMatch(staticHtml, /detail\.tasks\?\.length \? detail\.tasks/)
  assert.doesNotMatch(staticHtml, /<strong>\$\{task\}<\/strong>/)
  assert.match(staticHtml, /getStaticTasksForJob\(jobId\)\.map\(\(task\) => task\.name\)/)
})

test('static portrait task chips render task names instead of task objects', () => {
  assert.doesNotMatch(staticHtml, /job\.tasks\.map\(\(task\) => `<span>\$\{task\}<\/span>`\)/)
  assert.match(staticHtml, /job\.tasks\.map\(\(task\) => `<span>\$\{staticEscapeText\(task\.name \|\| task\)\}<\/span>`\)/)
})

test('static build job list is paged from all added jobs instead of four featured cards', () => {
  assert.doesNotMatch(staticHtml, /getStaticBuildJobs\(\)\.slice\(0,\s*4\)/)
  assert.match(staticHtml, /const staticBuildJobPageSize = 12/)
  assert.match(staticHtml, /const staticPagedBuildJobs = \(\) => getStaticBuildJobs\(\)\.slice/)
  assert.match(staticHtml, /const staticBuildJobPaginationHtml = \(\) =>/)
  assert.match(staticHtml, /data-static-build-page/)
})

test('static build job cards keep detail and hover delete interactions', () => {
  assert.match(staticHtml, /<article class="job-card" role="button" tabindex="0" data-open-detail="\$\{job\.id\}">/)
  assert.match(staticHtml, /class="job-delete-button"[\s\S]*data-remove-job="\$\{job\.id\}"/)
  assert.match(staticHtml, /const openDetail = target\.closest\('\[data-open-detail\]'\)[\s\S]*modernDetailHtml\(activeStaticDetailJobId\)/)
  assert.match(staticHtml, /const modernDetailHtml = \(jobId = 'job-bim-modeler'\)/)
  assert.match(staticStyles, /\.job-card:hover \.job-delete-button/)
})

test('static detail ability map keeps the previous nested graph layout', () => {
  assert.doesNotMatch(staticHtml, /<div class="ability-map ability-map-graph">/)
  assert.match(staticHtml, /<div class="ability-map"><div class="map-center">[\s\S]*<div class="ability-map-graph">/)
  assert.match(staticHtml, /<div class="ability-columns map-ability-columns">/)
  assert.match(staticHtml, /data-map-task-index="\$\{index\}"/)
  assert.match(staticHtml, /data-map-ability="\$\{staticEscapeText\(item\.name\)\}"/)
})
