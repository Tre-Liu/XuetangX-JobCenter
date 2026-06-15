import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const staticIndex = await readFile(new URL('../student-career-plan.html', import.meta.url), 'utf8')

test('student career planning static index preserves the standalone page shell', () => {
  for (const pattern of [
    /<title>学涯规划助手<\/title>/,
    /class="student-plan-shell"/,
    /智能建造工程（学生端培养方案）/,
    /data-tab="培养目标"/,
    /data-tab="毕业要求"/,
    /data-tab="课程体系"/,
    /class="career-agent-panel"/
  ]) {
    assert.match(staticIndex, pattern)
  }
})

test('student career planning static index includes data and tab switching behavior', () => {
  for (const pattern of [
    /const planData = /,
    /function renderGoals/,
    /function renderRequirements/,
    /function renderCourses/,
    /function activateTab/,
    /addEventListener\('click'/,
    /查课程目标/,
    /查毕业要求/,
    /查教学大纲/,
    /查先后续关系/
  ]) {
    assert.match(staticIndex, pattern)
  }
})

test('student career planning static index keeps quick prompts fixed above the input', () => {
  assert.doesNotMatch(staticIndex, /当前课程：建筑信息模型基础/)
  assert.doesNotMatch(staticIndex, /我可以继续展开课程目标、毕业要求支撑关系、教学大纲要点和先后修建议。/)
  assert.doesNotMatch(staticIndex, /class="career-agent-dialogue"/)
  assert.match(staticIndex, /<footer class="career-agent-input"[\s\S]*<section class="career-agent-prompts" id="promptList">[\s\S]*<textarea/)
})

test('student career planning static index keeps quick prompt buttons readable', () => {
  assert.match(staticIndex, /\.career-agent-send/)
  assert.match(staticIndex, /class="career-agent-send"/)
  assert.match(staticIndex, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(staticIndex, /min-width: 0/)
  assert.match(staticIndex, /font-size: 11px/)
  assert.match(staticIndex, /line-height: 1/)
  assert.doesNotMatch(staticIndex, /\.career-agent-input button\s*\{/)
})
