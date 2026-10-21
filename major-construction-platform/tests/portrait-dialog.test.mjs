import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticIndex = await readFile(new URL('../index.html', import.meta.url), 'utf8')

test('portrait job detail dialog is only visible after a portrait job is selected', () => {
  assert.match(appVue, /const selectedPortraitJobDetail = computed\(\(\) => \{\s*if \(!selectedPortraitJobId\.value\) return null/)
  assert.match(appVue, /v-if="selectedPortraitJobId && selectedPortraitJobDetail"/)
})

test('portrait ability summary previews two items and opens the full map from its section', () => {
  const vueDialog = appVue.slice(appVue.indexOf('v-if="selectedPortraitJobId && selectedPortraitJobDetail"'), appVue.indexOf('v-if="selectedCertificateDetail"'))
  const staticDialog = staticIndex.slice(staticIndex.indexOf('const showStaticPortraitDialog ='), staticIndex.indexOf('const showStaticCertificateDialog ='))
  assert.match(vueDialog, /v-for="item in group\.items\.slice\(0, 2\)"/)
  assert.match(vueDialog, /岗位能力三维分析<\/h3>[\s\S]*?@click="openPortraitCompetencyMap\(selectedPortraitJobDetail.id\)">查看岗位能力图谱/)
  assert.match(staticDialog, /items\.slice\(0, 2\)\.map/)
  assert.match(staticDialog, /岗位能力三维分析<\/h3>[\s\S]*?data-open-static-portrait-graph=.*?查看岗位能力图谱/)
  for (const dialog of [vueDialog, staticDialog]) {
    assert.doesNotMatch(dialog, /portrait-radar-card|推荐职业资格证书|共2176条/)
    assert.match(dialog, /数据依据：岗位画像测算/)
  }
})

test('static portrait career path is a chained职业发展路径 instead of one job label', () => {
  assert.match(staticIndex, /const buildStaticCareerPath = \(job\) =>/)
  assert.match(staticIndex, /career:\s*buildStaticCareerPath\(job\)/)
  assert.doesNotMatch(staticIndex, /career:\s*'工程项目交付岗'/)
})
