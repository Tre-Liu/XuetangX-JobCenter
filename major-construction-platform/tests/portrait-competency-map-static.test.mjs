import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

await import('../src/utils/portrait-competency-map-state.js')
const state = globalThis.PortraitCompetencyMapState
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const source = html.slice(html.indexOf('let staticPortraitCompetencyTheme ='), html.indexOf('const handleStaticBusinessAction ='))
const tasks = [
  { name: '模型校核', description: '校核模型', abilities: ['检查', '协同'] },
  { name: '成果交付', description: '交付成果', abilities: ['交付', '协同'] }
]
const nodes = ['检查', '协同', '交付'].map(name => ({ name, category: '技能', tone: 'skill', marker: '技' }))

// Minimal DOM boundary for the standalone renderer, without a browser or external library.
const element = dataset => {
  const classes = new Set()
  return { dataset, attributes: {}, style: {}, innerHTML: '', querySelectorAll: () => [], classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name) }, contains(name) { return classes.has(name) } }, setAttribute(name, value) { this.attributes[name] = value } }
}
const createPage = (pageTasks = tasks, pageNodes = nodes) => {
  const taskElements = pageTasks.map((_, index) => element({ competencyTaskIndex: String(index) }))
  const abilityElements = pageNodes.map(node => element({ competencyAbility: node.name }))
  const svg = element({}), board = element({}), zoom = element({}), shell = element({}), compactControl = element({}), graphRoot = element({})
  const app = {
    querySelector(selector) { return { '.competency-map-page-shell': shell, '[data-competency-compact-toggle]': compactControl, '.competency-layer-graph': graphRoot, '.competency-layer-lines': svg, '.competency-map-board': board, '[data-competency-zoom-value]': zoom }[selector] ?? null },
    querySelectorAll(selector) { return { '[data-competency-task-index]': taskElements, '[data-competency-ability]': abilityElements }[selector] ?? [] }
  }
  const job = { name: '工程岗位', salary: '10K', education: '本科', experience: '3年', level: '初级', summary: '岗位职责', tags: [], abilities: { 技能: nodes.map(node => node.name) } }
  const context = vm.createContext({ window: { PortraitCompetencyMapState: state }, app, getStaticPortraitDetail: () => job, getStaticPortraitCompetencyTasks: () => pageTasks, getStaticPortraitCompetencyNodes: () => pageNodes, staticPortraitCompetencyMapDetails: {}, staticEscapeText: value => String(value ?? '').replace(/[<>&"]/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[character]) })
  vm.runInContext(`${source}\n globalThis.pageHtml = staticPortraitCompetencyPageHtml('job'); globalThis.select = index => selectStaticPortraitCompetencyTask('job', index); globalThis.selectAbility = name => selectStaticPortraitCompetencyAbility('job', name); globalThis.toggleCompact = () => toggleStaticPortraitCompetencyCompactMode('job');`, context)
  return { context, taskElements, abilityElements, svg, board, zoom, shell, compactControl, graphRoot }
}

test('standalone compact switch preserves selection, search targets and reverses the same node layout', () => {
  const page = createPage(tasks, [...nodes, ...Array.from({ length: 80 }, (_, index) => ({ name: `能力${index}`, category: '知识' }))])
  const originalNodes = [...page.abilityElements]
  page.context.select(0)
  page.context.toggleCompact()
  assert.equal(page.compactControl.attributes['aria-checked'], 'true')
  assert.ok(page.shell.classList.contains('is-compact'))
  assert.ok(page.taskElements[0].classList.contains('active'))
  assert.ok(Math.max(...page.abilityElements.map(node => parseFloat(node.style.left))) < 1100)
  page.context.selectAbility('协同')
  assert.equal(page.abilityElements.find(node => node.dataset.competencyAbility === '协同').attributes['aria-pressed'], 'true')
  assert.ok(page.shell.classList.contains('is-compact'))
  page.context.toggleCompact()
  assert.equal(page.compactControl.attributes['aria-checked'], 'false')
  assert.ok(Math.max(...page.abilityElements.map(node => parseFloat(node.style.left))) > 1500)
  assert.deepEqual(page.abilityElements, originalNodes)
})

test('standalone page renders one shared ability point with both incoming relations', () => {
  const { context } = createPage()
  assert.equal((context.pageHtml.match(/data-competency-ability="协同"/g) ?? []).length, 1)
  assert.equal((context.pageHtml.match(/class="competency-layer-link kind-ability/g) ?? []).length, 4)
  assert.match(context.pageHtml, /关联 2 项任务/)
  assert.doesNotMatch(context.pageHtml, /演示|Demo|模拟数据|示例数据|测试数据/i)
})

test('standalone graph includes task-referenced abilities missing from the category directory', () => {
  const { context } = createPage([{ ...tasks[0], abilities: [...tasks[0].abilities, '新增引用'] }, tasks[1]])
  context.select(-1)
  assert.equal((context.pageHtml.match(/data-competency-ability=/g) ?? []).length, 4)
  assert.match(context.pageHtml, /新增引用\n能力类型：待分类\n关联任务：1 项/)
})

test('standalone task switching and reset update points, links and pressed state', () => {
  const page = createPage()
  const originalNodes = [...page.abilityElements]
  page.context.select(0)
  assert.deepEqual(page.abilityElements.filter(node => node.classList.contains('active')).map(node => node.dataset.competencyAbility), ['检查', '协同'])
  assert.equal(page.taskElements[0].attributes['aria-pressed'], 'true')
  assert.equal((page.svg.innerHTML.match(/kind-ability active/g) ?? []).length, 2)
  page.context.select(1)
  assert.deepEqual(page.abilityElements.filter(node => node.classList.contains('active')).map(node => node.dataset.competencyAbility), ['协同', '交付'])
  assert.equal(page.taskElements[0].attributes['aria-pressed'], 'false')
  page.context.select(1)
  assert.ok(page.abilityElements.every(node => !node.classList.contains('dimmed')))
  assert.deepEqual(page.abilityElements, originalNodes)
})

test('standalone ability selection highlights shared relations, toggles off, and yields to task selection', () => {
  const page = createPage()
  page.context.select(0)
  page.context.selectAbility('协同')
  assert.deepEqual(page.taskElements.filter(task => task.classList.contains('active')).map(task => task.dataset.competencyTaskIndex), ['0', '1'])
  assert.deepEqual(page.abilityElements.filter(node => node.classList.contains('active')).map(node => node.dataset.competencyAbility), ['协同'])
  assert.equal((page.svg.innerHTML.match(/kind-ability active/g) ?? []).length, 2)
  assert.ok(page.taskElements.every(task => task.attributes['aria-pressed'] === 'false'))
  assert.equal(page.abilityElements[1].attributes['aria-pressed'], 'true')
  page.context.selectAbility('协同')
  assert.ok(page.abilityElements.every(node => !node.classList.contains('dimmed')))
  page.context.selectAbility('协同')
  page.context.select(1)
  assert.deepEqual(page.abilityElements.filter(node => node.classList.contains('active')).map(node => node.dataset.competencyAbility), ['协同', '交付'])
  assert.ok(page.abilityElements.every(node => node.attributes['aria-pressed'] === 'false'))
  page.context.selectAbility('协同')
  page.context.select(-1)
  assert.ok(page.taskElements.every(task => !task.classList.contains('active')))
})


test('standalone graph provides ability search instead of canvas zoom controls', () => {
  const { context } = createPage()
  assert.match(context.pageHtml, /aria-label="搜索能力项名称"/)
  assert.doesNotMatch(context.pageHtml, /缩小图谱|放大图谱|恢复默认比例|data-competency-show-all/)
})
