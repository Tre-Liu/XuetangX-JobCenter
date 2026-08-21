import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { runInNewContext } from 'node:vm'

const projectRoot = resolve(import.meta.dirname, '..')
const builder = resolve(projectRoot, 'scripts/build_job_occupation_task_er.mjs')

async function buildHtml() {
  const tempDir = await mkdtemp(join(tmpdir(), 'job-occupation-task-er-'))
  const output = join(tempDir, 'index.html')
  const result = spawnSync(process.execPath, [builder, '--output', output], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(output, 'utf8')
  await rm(tempDir, { recursive: true, force: true })
  return html
}

function extractRobotTaskData(html) {
  const startMarker = 'const robotTaskData = '
  const endMarker = '\n\n    const robotTaskSourceData = '
  const start = html.indexOf(startMarker)
  const end = html.indexOf(endMarker, start)
  assert.notEqual(start, -1, 'robotTaskData should be present in the generated page')
  assert.notEqual(end, -1, 'robotTaskData should end before robotTaskSourceData')
  const objectLiteral = html.slice(start + startMarker.length, end).trim().replace(/;$/, '')
  return runInNewContext(`(${objectLiteral})`)
}

test('builds one directly-openable HTML file with the interactive ER contract', async () => {
  const html = await buildHtml()

  assert.match(html, /<!doctype html>/i)
  assert.match(html, /岗位—职业—典型工作任务—知识能力素养关系图/)
  assert.match(html, /id="graph-search"/)
  assert.match(html, /id="detail-panel"/)
  assert.match(html, /data-node-id="job"/)
  assert.match(html, /data-edge-id="job-job-occupation"/)
  assert.match(html, /addEventListener\(['"]click['"]/)
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i)
  assert.doesNotMatch(html, /<link\b[^>]*\brel=["'](?:stylesheet|modulepreload|preload)["']/i)
  assert.doesNotMatch(html, /\b(?:src|href)=["']https?:\/\//i)
})

test('keeps the mechanical and advertising evidence chains explicit and separate', async () => {
  const html = await buildHtml()

  assert.match(html, /机械设计/)
  assert.match(html, /机械设计工程技术人员/)
  assert.match(html, /2-02-07-01/)
  assert.match(html, /460301_机电一体化技术\.pdf/)
  assert.match(html, /职业标准缺口\/待补/)

  assert.match(html, /广告设计师/)
  assert.match(html, /4-08-08-08/)
  assert.match(html, /广告设计师国家职业标准（2024年版）\.pdf/)
  assert.match(html, /未与19条产业链岗位表建立岗位映射/)
  assert.doesNotMatch(html, /data-source="teaching-460301"\s+data-target="occupation-advertising"/)
})

test('shows field-level source mapping and a normalized task-requirement relation', async () => {
  const html = await buildHtml()

  for (const expected of [
    '19条产业链岗位与职业匹配表.xlsx',
    '中华人民共和国职业分类大典（2022年版）.pdf',
    '岗位详情字段爬取模板_更新版.xlsx',
    '岗位编号',
    '对应职业',
    '职业编码',
    '典型工作任务描述',
    '职业功能',
    '工作内容',
    '技能要求',
    '相关知识要求',
    'task_requirement_relation',
    '唯一事实来源',
    '直接证据',
    '规则匹配',
    '推断/待核',
  ]) {
    assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('search result state and edge details are keyed by the whole page contract', async () => {
  const html = await buildHtml()

  assert.match(html, /let totalMatches = 0/)
  assert.match(html, /totalMatches === 0/)
  assert.doesNotMatch(html, /tableMatches === 0/)
  assert.match(html, /details\[element\.dataset\.edgeId\]/)
})

test('puts the robot debugging job full-chain briefing module before the technical appendix', async () => {
  const html = await buildHtml()

  const briefingIndex = html.indexOf('id="job-full-chain"')
  const erIndex = html.indexOf('id="er"')
  assert.notEqual(briefingIndex, -1)
  assert.ok(briefingIndex < erIndex, 'briefing module should appear before the ER appendix')

  for (const expected of [
    '机器人调试工程师',
    'M0428',
    'IC-L3-1309',
    'IC-L3-815',
    '机器人工程技术人员',
    '2-02-38-10',
    '工业机器人系统运维员',
    '6-31-07-01',
    '机器人系统安装与现场调试',
    '机器人编程与离线仿真',
    '机器人应用系统集成与联调',
    '机器人生产线虚拟调试',
    '机器人系统运行维护与故障诊断',
  ]) {
    assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('removes the redundant four-step summary row from the briefing module', async () => {
  const html = await buildHtml()

  assert.doesNotMatch(html, /<div class="full-chain"/)
  assert.doesNotMatch(html, /01 · 岗位起点/)
  assert.doesNotMatch(html, /04 · 对应哪个职业/)
})

test('provides more than two traceable knowledge ability and quality items for every task', async () => {
  const taskData = extractRobotTaskData(await buildHtml())

  for (const [taskId, task] of Object.entries(taskData)) {
    for (const type of ['knowledge', 'ability', 'quality']) {
      assert.ok(task[type].length >= 4, `${taskId}.${type} should expose at least four evidence-backed items`)
      assert.ok(task[type].every((item) => item[2]?.captureKeys?.length), `${taskId}.${type} items should retain source captures`)
    }
  }
})

test('uses occupation catalog occupational standard and multiple teaching standards as distinct evidence layers', async () => {
  const html = await buildHtml()

  for (const expected of [
    '中华人民共和国职业分类大典（2022年版）.pdf',
    '职业大典第 96 页',
    '职业大典第 562 页',
    '机器人工程技术人员国家职业标准.pdf',
    '职业标准第 10–18 页',
    '260304_机器人技术.pdf',
    '460304_智能机器人技术.pdf',
    '460305_工业机器人技术.pdf',
    '职业大典定职业边界',
    '职业标准拆工作内容与能力要求',
    '多份教学标准补充培养侧候选',
  ]) {
    assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  assert.match(html, /data-source-capture="catalog-robot-engineer-096"/)
  assert.match(html, /data-source-capture="occupation-standard-014"/)
  assert.match(html, /data-source-capture="teaching-460305-core"/)
})

test('links each robot task to knowledge ability quality items and exposes auditable evidence', async () => {
  const html = await buildHtml()

  assert.match(html, /data-task-id="robot-install"[^>]*aria-selected="true"/)
  assert.match(html, /data-requirement-type="knowledge"/)
  assert.match(html, /data-requirement-type="ability"/)
  assert.match(html, /data-requirement-type="quality"/)
  assert.match(html, /selectRobotTask/)

  assert.match(html, /id="robot-evidence-drawer"/)
  assert.match(html, /data-open-robot-evidence/)
  assert.match(html, /data-close-robot-evidence/)
  assert.match(html, /19条产业链岗位与职业匹配表\.xlsx/)
  assert.match(html, /匹配明细（不合并）[^<]*第 693–696 行/)
  assert.match(html, /规则校正：robot-debug/)
  assert.match(html, /职业字典（本表使用）[^<]*第 48 行/)
  assert.match(html, /260304_机器人技术\.pdf/)
  assert.match(html, /职业标准第 10–18 页/)
  assert.match(html, /多源归并候选/)
  assert.match(html, /企业原文尚未采集/)
})

test('gives every briefing field an independent detail action without replacing task selection', async () => {
  const html = await buildHtml()

  assert.match(html, /id="robot-field-drawer"/)
  assert.match(html, /data-field-detail="task:robot-install"/)
  assert.match(html, /data-field-detail="current-task"/)
  assert.match(html, /data-field-detail="current-task-source"/)
  assert.match(html, /data-field-detail="category:knowledge"/)
  assert.match(html, /data-field-detail="category:ability"/)
  assert.match(html, /data-field-detail="category:quality"/)
  assert.match(html, /data-field-detail="requirement:robot-install:knowledge:0"/)
  assert.match(html, /data-field-detail="requirement:robot-install:ability:0"/)
  assert.match(html, /data-field-detail="requirement:robot-install:quality:0"/)
  assert.match(html, /data-field-detail="occupation:2-02-38-10"/)
  assert.match(html, /data-field-detail="occupation:6-31-07-01"/)
  assert.match(html, /data-field-detail="candidate-boundary"/)
  assert.match(html, /function openRobotFieldDetail\(fieldKey/)
  assert.match(html, /function selectRobotTask\(taskId/)
})

test('keeps occupation cards neutral without report-specific role labels', async () => {
  const html = await buildHtml()

  assert.doesNotMatch(html, /本次汇报主职业/)
  assert.doesNotMatch(html, /同岗位第二职业/)
  assert.equal((html.match(/<em>查看详情<\/em>/g) || []).length, 2)
})

test('explains each field with source previews, processing flow and explicit calculation boundaries', async () => {
  const html = await buildHtml()

  assert.match(html, /class="source-preview pdf-preview"/)
  assert.match(html, /class="source-preview excel-preview"/)
  assert.match(html, /class="field-process-flow"/)
  for (const expected of [
    '原始数据',
    '字段标准化',
    '规则处理',
    '展示结果',
    '岗位-职业匹配表第 532–533 行',
    '匹配明细（不合并）第 693–696 行',
    '职业字典（本表使用）第 48 行',
    '职业字典（本表使用）第 166 行',
    '260304_机器人技术.pdf',
    '规则校正：robot-debug',
    'COUNT DISTINCT occupation_code = 2',
    '不计算匹配度百分比',
  ]) {
    assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('embeds real reference-file screenshots instead of simulated PDF and Excel previews', async () => {
  const html = await buildHtml()
  const embeddedCaptures = html.match(/data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+/g) || []

  assert.ok(embeddedCaptures.length >= 6, 'should embed multiple PDF and Excel source captures')
  assert.ok(embeddedCaptures.every((capture) => capture.length > 1000), 'embedded captures should contain real image payloads')
  assert.match(html, /data-source-capture="pdf-page-04"/)
  assert.match(html, /data-source-capture="excel-job-occupation-532-533"/)
  assert.match(html, /点击查看原始截图/)
  assert.doesNotMatch(html, /class="pdf-lines"/)
  assert.doesNotMatch(html, /class="excel-grid-mini"/)
})

test('keeps anchor targets visible below the sticky toolbar', async () => {
  const html = await buildHtml()

  assert.match(html, /\.section\s*\{[^}]*scroll-margin-top:\s*90px;/s)
})
