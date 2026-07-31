import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_MAJOR_ENGINE_SECTION,
  MAJOR_ENGINE_KNOWLEDGE_ROWS,
  MAJOR_ENGINE_SECTIONS,
  createMajorEngineUploadFeedback,
  getMajorEngineContentMode,
  resolveMajorEngineSection,
  selectMajorEngineSection,
} from '../src/app/major-engine.js'

test('专业引擎默认进入知识库，并对非法栏目回退到知识库', () => {
  assert.equal(DEFAULT_MAJOR_ENGINE_SECTION, 'knowledge')
  assert.equal(resolveMajorEngineSection('major-graph'), 'major-graph')
  assert.equal(resolveMajorEngineSection('missing'), 'knowledge')
})

test('专业引擎只为知识库返回完整内容模式', () => {
  assert.equal(getMajorEngineContentMode('knowledge'), 'knowledge')
  assert.equal(getMajorEngineContentMode('course-group-graph'), 'placeholder')
})

test('专业引擎栏目和知识库分类使用确定的业务顺序', () => {
  assert.deepEqual(
    MAJOR_ENGINE_SECTIONS.map((item) => item.label),
    ['知识库', '专业图谱', '知识领域图谱', '课程群图谱', '能力维度图谱', '素质目标图谱', '自定义图谱'],
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
