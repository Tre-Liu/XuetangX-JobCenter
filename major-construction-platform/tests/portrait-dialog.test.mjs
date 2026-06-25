import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticIndex = await readFile(new URL('../index.html', import.meta.url), 'utf8')

test('portrait job detail dialog is only visible after a portrait job is selected', () => {
  assert.match(appVue, /const selectedPortraitJobDetail = computed\(\(\) => \{\s*if \(!selectedPortraitJobId\.value\) return null/)
  assert.match(appVue, /v-if="selectedPortraitJobId && selectedPortraitJobDetail"/)
})

test('portrait ability summary previews five items and points users to the full map', () => {
  assert.match(appVue, /请在能力图谱中查看全部/)
  assert.match(appVue, /v-for="item in group\.items\.slice\(0, 5\)"/)
  assert.match(staticIndex, /请在能力图谱中查看全部/)
  assert.match(staticIndex, /items\.slice\(0, 5\)\.map/)
})

test('static portrait career path is a chained职业发展路径 instead of one job label', () => {
  assert.match(staticIndex, /const buildStaticCareerPath = \(job\) =>/)
  assert.match(staticIndex, /career:\s*buildStaticCareerPath\(job\)/)
  assert.doesNotMatch(staticIndex, /career:\s*'工程项目交付岗'/)
})
