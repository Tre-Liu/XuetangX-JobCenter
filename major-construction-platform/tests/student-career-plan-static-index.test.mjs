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
    /查看当前课程的目标/,
    /查看先后修关系/
  ]) {
    assert.match(staticIndex, pattern)
  }
})
