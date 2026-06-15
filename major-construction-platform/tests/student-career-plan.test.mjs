import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

test('student career planning view exposes the student plan tabs and agent shell', () => {
  for (const pattern of [
    /currentViewParam === 'student-career-plan'/,
    /学涯规划助手/,
    /activeStudentPlanTab/,
    /学生端培养方案/,
    /毕业要求/,
    /课程体系/,
    /studentCareerAgentPrompts/
  ]) {
    assert.match(appVue, pattern)
  }
})

test('student career planning view groups courses by semester for the course system tab', () => {
  assert.match(appVue, /studentSemesterCourseGroups/)
  assert.match(appVue, /第1学期/)
  assert.match(appVue, /课程目标/)
  assert.match(appVue, /先后修/)
})

test('student career planning view has dedicated layout styles', () => {
  for (const pattern of [
    /\.student-plan-shell/,
    /\.student-plan-tab/,
    /\.student-course-card/,
    /\.career-agent-panel/,
    /\.career-agent-input/
  ]) {
    assert.match(stylesCss, pattern)
  }
})
