import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const staticIndex = await readFile(new URL('../student-career-plan/index.html', import.meta.url), 'utf8')

test('student career planning compatibility entry redirects to the Vue page', () => {
  for (const pattern of [
    /<title>学涯规划助手<\/title>/,
    /rel="canonical"/,
    /\.\.\/index\.html\?view=student-career-plan/,
    /location\.replace\(targetUrl\)/,
    /进入学涯规划助手/
  ]) {
    assert.match(staticIndex, pattern)
  }
})

test('student career planning compatibility entry does not duplicate the old static app', () => {
  assert.doesNotMatch(staticIndex, /class="student-plan-shell"/)
  assert.doesNotMatch(staticIndex, /const planData = /)
  assert.doesNotMatch(staticIndex, /function renderGoals/)
  assert.doesNotMatch(staticIndex, /function renderRequirements/)
  assert.doesNotMatch(staticIndex, /function renderCourses/)
  assert.doesNotMatch(staticIndex, /addEventListener\('click'/)
})

test('student career planning compatibility entry leaves UI behavior to Vue', () => {
  assert.doesNotMatch(staticIndex, /data-tab="培养目标"/)
  assert.doesNotMatch(staticIndex, /career-agent-panel/)
  assert.doesNotMatch(staticIndex, /id="promptList"/)
  assert.doesNotMatch(staticIndex, /id="agentInput"/)
})
