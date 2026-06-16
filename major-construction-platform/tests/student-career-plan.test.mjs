import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const studentCareerPlanData = await readFile(new URL('../src/app/student-career-plan-data.ts', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

test('student career planning view exposes the student plan tabs and agent shell', () => {
  for (const pattern of [
    /studentCareerPlanData/,
    /from '\.\/app\/student-career-plan-data'/,
    /currentViewParam === 'student-career-plan'/,
    /学涯规划助手/,
    /activeStudentPlanTab/,
    /studentCareerPlanData\.title/,
    /studentCareerPlanData\.subtitle/,
    /studentCareerAgentPrompts/,
    /selectStudentAgentPrompt/
  ]) {
    assert.match(appVue, pattern)
  }
  for (const pattern of [
    /'培养目标'/,
    /'毕业要求'/,
    /'课程体系'/,
    /'查课程目标'/,
    /'查毕业要求'/,
    /'查教学大纲'/,
    /'查先后续关系'/
  ]) {
    assert.match(studentCareerPlanData, pattern)
  }
  assert.doesNotMatch(appVue, /当前课程：/)
  assert.doesNotMatch(appVue, /我可以继续展开课程目标、毕业要求支撑关系、教学大纲要点和先后修建议。/)
})

test('student career planning view groups courses by semester for the course system tab', () => {
  assert.match(appVue, /studentCareerPlanData\.semesters/)
  assert.match(appVue, /studentSemesterCourseGroups/)
  assert.match(studentCareerPlanData, /第1学期/)
  assert.match(studentCareerPlanData, /课程目标/)
  assert.match(appVue, /先后修/)
})

test('student career planning view has dedicated layout styles', () => {
  for (const pattern of [
    /\.student-plan-shell/,
    /\.student-plan-tab/,
    /\.student-course-card/,
    /\.career-agent-panel/,
    /\.career-agent-input/,
    /\.career-agent-input \.career-agent-prompts/,
    /\.career-agent-send/,
    /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/,
    /min-width: 0/,
    /font-size: 11px/,
    /line-height: 1/
  ]) {
    assert.match(stylesCss, pattern)
  }
  assert.doesNotMatch(stylesCss, /\.career-agent-input button\s*\{/)
})
