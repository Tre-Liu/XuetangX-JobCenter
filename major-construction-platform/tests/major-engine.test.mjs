import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_MAJOR_ENGINE_SECTION,
  MAJOR_ENGINE_KNOWLEDGE_ROWS,
  MAJOR_ENGINE_SECTIONS,
  buildMajorEngineGraphFrameSrc,
  createMajorEngineUploadFeedback,
  getMajorEngineContentMode,
  getMajorEngineResourceDisplayMode,
  resolveMajorEngineSection,
  selectMajorEngineSection,
} from '../src/app/major-engine.js'

test('专业引擎默认进入专业全景图谱，并对非法栏目回退到默认栏目', () => {
  assert.equal(DEFAULT_MAJOR_ENGINE_SECTION, 'major-graph')
  assert.equal(resolveMajorEngineSection('major-graph'), 'major-graph')
  assert.equal(resolveMajorEngineSection('missing'), 'major-graph')
})

test('专业引擎为专业全景图谱和知识库返回各自内容模式', () => {
  assert.equal(getMajorEngineContentMode('major-graph'), 'graph')
  assert.equal(getMajorEngineContentMode('knowledge'), 'knowledge')
  assert.equal(getMajorEngineContentMode('course-group-graph'), 'placeholder')
})

test('专业全景图谱地址强制锁定浅色主题', () => {
  assert.equal(
    buildMajorEngineGraphFrameSrc('/opendesign/industry-education-graph-prototype.html'),
    '/opendesign/industry-education-graph-prototype.html?odVersion=20260820-major-engine-light-v1&theme=light&themeLock=light',
  )
})

test('专业引擎使用线上六栏目信息架构和分组顺序', () => {
  assert.deepEqual(
    MAJOR_ENGINE_SECTIONS.map((item) => item.label),
    ['专业全景图谱', '知识领域图谱', '能力维度图谱', '素质目标图谱', '共建课程群图谱', '专业建设智库'],
  )
  assert.deepEqual(
    MAJOR_ENGINE_SECTIONS.filter((item) => item.dividerBefore).map((item) => item.key),
    ['knowledge-domain-graph', 'knowledge'],
  )
  assert.deepEqual(
    MAJOR_ENGINE_KNOWLEDGE_ROWS.map((item) => item.name),
    ['培养方案', '专业认证', '政策文件', '行业报告'],
  )
})

test('上传演示反馈包含所选资源分类', () => {
  assert.equal(
    createMajorEngineUploadFeedback('政策文件'),
    '已打开政策文件上传演示，本次不会读取或保存真实文件',
  )
})

test('非法栏目不会破坏当前有效的专业引擎选择', () => {
  assert.equal(selectMajorEngineSection('major-graph', 'not-a-section'), 'major-graph')
  assert.equal(selectMajorEngineSection('major-graph', 'knowledge-domain-graph'), 'knowledge-domain-graph')
})

test('知识库资源为空时返回统一空状态模式', () => {
  assert.equal(getMajorEngineResourceDisplayMode(MAJOR_ENGINE_KNOWLEDGE_ROWS), 'rows')
  assert.equal(getMajorEngineResourceDisplayMode([]), 'empty')
  assert.equal(getMajorEngineResourceDisplayMode(null), 'empty')
})
