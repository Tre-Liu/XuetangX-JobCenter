import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const graphHtml = await readFile(
  new URL('../public/opendesign/industry-education-graph-prototype.html', import.meta.url),
  'utf8',
)
const bootScript = graphHtml.match(/<head>\s*<script>([\s\S]*?)<\/script>/)?.[1] ?? ''

const runGraphBoot = (search = '') => {
  const attributes = {}
  const documentElement = {
    dataset: { theme: 'dark' },
    setAttribute(name, value) {
      attributes[name] = value
    },
  }
  vm.runInNewContext(bootScript, {
    URLSearchParams,
    window: { location: { search } },
    document: { documentElement },
  })
  return { dataset: documentElement.dataset, attributes }
}

test('专业引擎图谱识别 CMS 产教模型开通状态', () => {
  const enabled = runGraphBoot('?embedScene=major-engine&industryEducationModel=enabled&themeLock=light')
  const disabled = runGraphBoot('?embedScene=major-engine&industryEducationModel=disabled&themeLock=light')

  assert.deepEqual(
    { ...enabled.dataset },
    { theme: 'light', embedScene: 'major-engine', industryEducationModel: 'enabled' },
  )
  assert.deepEqual(
    { ...disabled.dataset },
    { theme: 'light', embedScene: 'major-engine', industryEducationModel: 'disabled' },
  )
})

test('建设成果图谱未带专业引擎参数时不启用专属隐藏规则', () => {
  const resultsGraph = runGraphBoot('?odVersion=results-portal')

  assert.equal(resultsGraph.dataset.embedScene, undefined)
  assert.equal(resultsGraph.dataset.industryEducationModel, undefined)
})

test('专业引擎模式为满屏、去能力体系和去虚线文字提供独立样式边界', () => {
  assert.match(graphHtml, /html\[data-embed-scene="major-engine"\] \.main\s*\{[\s\S]*?grid-template-rows:\s*auto minmax\(0, 1fr\)/)
  assert.match(graphHtml, /html\[data-embed-scene="major-engine"\] \[data-program-layer="ability"\],[\s\S]*?\.macro-tag\s*\{\s*display:\s*none/)
  assert.match(graphHtml, /data-embed-only="major-engine" data-program-from="requirement" data-program-to="course"/)
})
