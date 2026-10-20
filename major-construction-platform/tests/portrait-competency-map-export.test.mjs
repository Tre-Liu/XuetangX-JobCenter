import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

await import('../src/utils/portrait-competency-map-state.js')
const state = globalThis.PortraitCompetencyMapState
// Load the browser utility as it is loaded by the standalone page.
const source = await readFile(new URL('../src/utils/portrait-competency-map-export.js', import.meta.url), 'utf8').catch(() => '')
vm.runInThisContext(source)
const exporter = globalThis.PortraitCompetencyMapExport
const longName = '依据设计变更要求更新建筑模型并复核关联施工图纸与跨专业协调记录的完整准确性'
const graph = state.buildGraph({
  jobName: '工程 & <岗位>',
  tasks: [{ name: '模型校核', abilities: ['共享能力', longName] }, { name: '成果交付', abilities: ['共享能力'] }],
  nodes: Array.from({ length: 45 }, (_, index) => ({ name: index === 0 ? '共享能力' : index === 44 ? longName : `能力 ${index}`, category: index % 2 ? '知识' : '技能' })),
  activeTaskIndex: 0
})

test('full canvas export retains offscreen nodes, every relation, full labels and selection', () => {
  assert.ok(exporter, 'shared full-canvas exporter must exist')
  const result = exporter.buildSvg({ graph, theme: 'light' })
  assert.ok(result.width >= 1800, 'export must include columns beyond a typical viewport')
  assert.ok(result.height > 670, 'export includes the full graph plus title and legend')
  assert.equal((result.svg.match(/data-export-ability=/g) || []).length, 45)
  assert.equal((result.svg.match(/data-export-task=/g) || []).length, 2)
  assert.equal((result.svg.match(/data-export-link=/g) || []).length, 5)
  assert.match(result.svg, /工程 &amp; &lt;岗位&gt;-岗位能力图谱/)
  assert.match(result.svg, /<title>依据设计变更要求更新建筑模型并复核关联施工图纸与跨专业协调记录的完整准确性<\/title>/)
  const ability = result.svg.match(/<g data-export-ability="44"[\s\S]*?<\/g>/)[0]
  assert.equal([...ability.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g)].map(match => match[1]).join(''), longName)
  assert.doesNotMatch(result.svg, /foreignObject|演示|demo|模拟数据|示例数据|测试数据/i)
  assert.match(result.svg, /opacity="0\.25"/)
  assert.match(result.svg, /opacity="0\.58"/)
})

test('dark and empty canvas exports remain self-contained and readable', () => {
  assert.ok(exporter, 'shared full-canvas exporter must exist')
  const empty = state.buildGraph({ jobName: '空岗位' })
  const { svg } = exporter.buildSvg({ graph: empty, theme: 'dark' })
  assert.match(svg, /fill="#181d29"/)
  assert.match(svg, /暂无能力项/)
  assert.match(svg, /空岗位-岗位能力图谱/)
  assert.doesNotMatch(svg, /NaN|undefined|src="https?:\/\//)
})

test('long job names stay below column headings and inside the exported canvas', () => {
  const longJob = state.buildGraph({ jobName: '职业岗位名称与完整业务范围要求'.repeat(10), tasks: [{ name: '岗位任务', abilities: [] }] })
  const { svg, height } = exporter.buildSvg({ graph: longJob })
  const offset = Number(svg.match(/data-export-content[^>]*translate\(0 ([\d.]+)\)/)?.[1] ?? 0)
  const jobRect = svg.match(/<rect x="32" y="(-?[\d.]+)"[^>]*height="([\d.]+)"/)
  assert.ok(jobRect, 'job card must be exported')
  const top = Number(jobRect[1]) + offset
  assert.ok(top >= 64, 'job card must stay below the column headings')
  assert.ok(top + Number(jobRect[2]) < height - 64, 'job card must stay inside the canvas')
})

test('compact export contains every ability as a dot and retains its full name as metadata', () => {
  const compact = state.buildGraph({ jobName: '工程岗位', compactMode: true,
    tasks: [{ name: '模型校核', abilities: [longName] }],
    nodes: Array.from({ length: 80 }, (_, index) => ({ name: index ? `能力${index}` : longName, category: '技能' })) })
  const { svg, width } = exporter.buildSvg({ graph: compact })
  assert.ok(width < 1200)
  const points = [...svg.matchAll(/<g data-export-ability="\d+"[\s\S]*?<\/g>/g)].map(match => match[0])
  assert.equal(points.length, 80)
  assert.ok(points.every(point => point.includes('<circle') && !point.includes('<text')))
  assert.match(points[0], /<title>依据设计变更要求更新建筑模型并复核关联施工图纸与跨专业协调记录的完整准确性<\/title>/)
})
