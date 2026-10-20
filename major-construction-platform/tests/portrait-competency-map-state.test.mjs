import assert from 'node:assert/strict'
import test from 'node:test'

await import('../src/utils/portrait-competency-map-state.js')

const state = globalThis.PortraitCompetencyMapState

const graphInput = {
  jobName: 'BIM建模工程师',
  nodes: [
    { name: '模型检查', category: '技能' },
    { name: '协同交付', category: '技能' },
    { name: '质量意识', category: '素养' }
  ],
  tasks: [
    { name: '模型校核', abilities: ['模型检查', '质量意识', '模型检查'] },
    { name: '模型交付', abilities: ['协同交付', '质量意识'] }
  ]
}

test('task cards stay compact in tall canvases without moving ability columns', () => {
  const graph = state.buildGraph({
    jobName: '工程岗位', viewportHeight: 920,
    tasks: Array.from({ length: 5 }, (_, index) => ({ name: `工作任务${index + 1}`, abilities: ['校核能力'] })),
    nodes: [{ name: '校核能力', category: '技能' }, { name: '规范意识', category: '素养' }]
  })
  assert.ok(graph.tasks.every((task, index) => index === 0 || task.y - graph.tasks[index - 1].y <= 110))
  assert.ok(graph.tasks.every((task, index) => index === 0 || task.y - graph.tasks[index - 1].y >= 90))
  assert.deepEqual(graph.abilities.map(node => [node.name, node.x, node.y]), [['校核能力', 600, 143], ['规范意识', 600, 104]])
  assert.equal(graph.height, 920)
  assert.equal(graph.width, 880)
})

test('compact mode contracts only horizontal ability spacing while retaining selection and all relations', () => {
  const input = { jobName: '工程岗位', viewportHeight: 920,
    tasks: [{ name: '工作任务', abilities: ['能力0', '能力40'] }],
    nodes: Array.from({ length: 120 }, (_, index) => ({ name: `能力${index}`, category: '技能' })), activeAbilityName: '能力40' }
  const expanded = state.buildGraph(input)
  const compact = state.buildGraph({ ...input, compactMode: true })
  assert.ok(compact.width < expanded.width / 2)
  assert.deepEqual(compact.tasks, expanded.tasks)
  assert.deepEqual(compact.job, expanded.job)
  assert.equal(compact.height, expanded.height)
  assert.deepEqual(compact.abilities.map(({ x, ...node }) => node), expanded.abilities.map(({ x, ...node }) => node))
  assert.deepEqual(compact.links.map(({ d, ...link }) => link), expanded.links.map(({ d, ...link }) => link))
  assert.ok(compact.links.some((link, index) => link.d !== expanded.links[index].d))
  assert.equal(compact.expandedWidth, expanded.width)
  assert.equal(compact.compactMode, true)
  assert.deepEqual(state.buildGraph({ ...input, compactMode: false }), expanded)
})

test('single-column compact canvases reserve room for the full ability heading', () => {
  const graph = state.buildGraph({ jobName: '岗位', compactMode: true, nodes: [{ name: '能力', category: '知识' }] })
  assert.ok(graph.width >= 700)
})

test('link highlighting updates existing paths so an ongoing layout transition is retained', () => {
  const initial = state.buildGraph(graphInput)
  const paths = initial.links.map(link => ({
    dataset: { competencyLinkKey: link.key }, style: {}, attributes: {}, classes: new Set(),
    classList: { toggle(name, enabled) { enabled ? this.owner.classes.add(name) : this.owner.classes.delete(name) } },
    setAttribute(name, value) { this.attributes[name] = value }
  }))
  paths.forEach(path => { path.classList.owner = path })
  const svg = { querySelectorAll: () => paths, appendChild: () => {}, set innerHTML(value) { throw new Error('existing SVG paths must not be replaced') } }
  assert.equal(typeof state.updateGraphLinks, 'function')
  state.updateGraphLinks(svg, state.buildGraph({ ...graphInput, activeTaskIndex: 1 }))
  assert.ok(paths.find(path => path.dataset.competencyLinkKey === 'task-1-ability-1').classes.has('active'))
  assert.ok(paths.find(path => path.dataset.competencyLinkKey === 'task-0-ability-0').classes.has('dimmed'))
  assert.ok(paths.every(path => path.style.d.startsWith('path(')))
})

test('three-layer graph retains a shared ability once and all its task relationships', () => {
  const graph = state.buildGraph(graphInput)
  assert.equal(graph.job.name, 'BIM建模工程师')
  assert.equal(graph.tasks.length, 2)
  assert.equal(graph.abilities.length, 3)
  assert.deepEqual(graph.abilities.find(node => node.name === '质量意识').taskIndexes, [0, 1])
  assert.deepEqual(graph.links.filter(link => link.kind === 'ability').map(link => [link.taskIndex, link.abilityName]), [
    [0, '模型检查'], [0, '质量意识'], [1, '协同交付'], [1, '质量意识']
  ])
  assert.equal(graph.links.filter(link => link.kind === 'job').length, 2)
})

test('selecting a task highlights its relationships without removing or moving any ability', () => {
  const overview = state.buildGraph(graphInput)
  const selected = state.buildGraph({ ...graphInput, activeTaskIndex: 1 })
  assert.deepEqual(selected.abilities.map(node => [node.name, node.x, node.y]), overview.abilities.map(node => [node.name, node.x, node.y]))
  assert.deepEqual(selected.abilities.filter(node => node.active).map(node => node.name), ['协同交付', '质量意识'])
  assert.equal(selected.abilities.find(node => node.name === '模型检查').dimmed, true)
  assert.deepEqual(selected.links.filter(link => link.active && link.kind === 'ability').map(link => link.abilityName), ['协同交付', '质量意识'])
  assert.ok(overview.abilities.every(node => !node.dimmed))
  assert.ok(state.buildGraph({ ...graphInput, activeTaskIndex: 99 }).abilities.every(node => !node.dimmed))
})

test('ability positions are independent of task order, task membership and task count', () => {
  const positions = graph => Object.fromEntries(graph.abilities.map(node => [node.name, [node.x, node.y]]))
  const original = positions(state.buildGraph(graphInput))
  assert.deepEqual(positions(state.buildGraph({ ...graphInput, tasks: [...graphInput.tasks].reverse() })), original)
  assert.deepEqual(positions(state.buildGraph({ ...graphInput, tasks: [{ name: '合并任务', abilities: graphInput.nodes.map(node => node.name) }] })), original)
  assert.deepEqual(positions(state.buildGraph({ ...graphInput, tasks: [] })), original)
})

test('selecting a shared ability highlights only its incoming relations and every related task', () => {
  const graph = state.buildGraph({ ...graphInput, activeTaskIndex: 0, activeAbilityName: '质量意识' })
  assert.deepEqual(graph.tasks.filter(task => task.active).map(task => task.name), ['模型校核', '模型交付'])
  assert.deepEqual(graph.abilities.filter(node => node.active).map(node => node.name), ['质量意识'])
  assert.deepEqual(graph.links.filter(link => link.active && link.kind === 'ability').map(link => [link.taskIndex, link.abilityName]), [[0, '质量意识'], [1, '质量意识']])
  assert.equal(graph.activeTaskIndex, -1)
  assert.equal(graph.activeAbilityName, '质量意识')
  assert.ok(graph.tasks.every(task => !task.selected))
  assert.equal(graph.abilities.find(node => node.name === '质量意识').selected, true)
})

test('selecting an unlinked ability highlights it without inventing related tasks or lines', () => {
  const input = { ...graphInput, nodes: [...graphInput.nodes, { name: '未关联能力', category: '知识' }] }
  const graph = state.buildGraph({ ...input, activeAbilityName: '未关联能力' })
  assert.equal(graph.tasks.filter(task => task.active).length, 0)
  assert.equal(graph.links.filter(link => link.active).length, 0)
  assert.deepEqual(graph.abilities.filter(node => node.active).map(node => node.name), ['未关联能力'])
  assert.ok(state.buildGraph({ ...input, activeAbilityName: '不存在' }).abilities.every(node => !node.dimmed))
  assert.deepEqual(graph.abilities.map(node => [node.name, node.x, node.y]), state.buildGraph(input).abilities.map(node => [node.name, node.x, node.y]))
})

test('graph keeps unlinked abilities without inventing links and accepts empty inputs', () => {
  const graph = state.buildGraph({ jobName: '岗位', tasks: [], nodes: [{ name: '待关联能力', category: '知识' }] })
  assert.equal(graph.abilities.length, 1)
  assert.deepEqual(graph.abilities[0].taskIndexes, [])
  assert.deepEqual(graph.links, [])
  assert.equal(state.buildGraph({ jobName: '岗位', tasks: [], nodes: [] }).abilities.length, 0)
})

test('competency map zoom uses 10 percent steps and stays between 60 and 140 percent', () => {
  assert.equal(state.changeZoom(1, -0.1), 0.9)
  assert.equal(state.changeZoom(1.35, 0.1), 1.4)
  assert.equal(state.changeZoom(0.6, -0.1), 0.6)
  assert.equal(state.changeZoom(1.4, 0.1), 1.4)
})

test('competency map theme toggles between light and dark', () => {
  assert.equal(state.nextTheme('light'), 'dark')
  assert.equal(state.nextTheme('dark'), 'light')
})

test('task ability lanes contain only the selected task abilities with natural category counts', () => {
  const items = [
    { name: '知识 A', category: '知识' },
    { name: '知识 B', category: '知识' },
    { name: '技能 A', category: '技能' },
    { name: '技能 B', category: '技能' },
    { name: '素养 A', category: '素养' }
  ]

  assert.deepEqual(
    state.buildTaskAbilityLanes(items, new Set(['知识 B', '技能 A', '素养 A']), ['知识', '技能', '素养'])
      .map((lane) => ({ category: lane.category, names: lane.items.map((item) => item.name) })),
    [
      { category: '知识', names: ['知识 B'] },
      { category: '技能', names: ['技能 A'] },
      { category: '素养', names: ['素养 A'] }
    ]
  )
  assert.deepEqual(items.map((item) => item.name), ['知识 A', '知识 B', '技能 A', '技能 B', '素养 A'])
})

test('task scene direction follows the selected task order', () => {
  assert.equal(state.getTaskSlideDirection(0, 3), 'forward')
  assert.equal(state.getTaskSlideDirection(3, 1), 'backward')
})

test('ability detail includes only tasks that reference the selected ability', () => {
  const detail = state.buildAbilityDetail({
    abilityName: '工程数据清洗与治理',
    jobName: 'BIM建模工程师',
    nodes: [
      { name: '工程数据清洗与治理', category: '技能', tone: 'skill', marker: '技' },
      { name: '工程数据组织规范', category: '知识', tone: 'knowledge', marker: '知' }
    ],
    tasks: [
      { name: '施工图深化与碰撞检查', abilities: ['工程数据清洗与治理'] },
      { name: '模型交付与过程复核', abilities: ['工程数据组织规范'] },
      { name: '工程量提取与变更协同', abilities: ['工程数据清洗与治理', '工程数据组织规范'] }
    ]
  })

  assert.deepEqual(detail, {
    name: '工程数据清洗与治理',
    category: '技能',
    tone: 'skill',
    marker: '技',
    jobName: 'BIM建模工程师',
    relatedTasks: ['施工图深化与碰撞检查', '工程量提取与变更协同']
  })
})

test('large ability pools form aligned columns and extend the canvas horizontally', () => {
  const nodes = Array.from({ length: 150 }, (_, index) => ({ name: `建筑模型跨专业协同检查与标准化成果交付能力${index}`, category: ['知识', '技能', '素养'][index % 3] }))
  const graph = state.buildGraph({ jobName: '岗位', nodes })
  const columns = new Map()
  for (const node of graph.abilities) {
    if (!columns.has(node.x)) columns.set(node.x, [])
    columns.get(node.x).push(node.y)
  }
  assert.ok(columns.size >= 8)
  const ordered = [...columns].sort((a, b) => a[0] - b[0])
  for (let index = 1; index < ordered.length; index += 1) {
    assert.ok(ordered[index][0] - ordered[index - 1][0] >= 300)
    assert.deepEqual(ordered[index][1].sort((a,b) => a-b), ordered[0][1].sort((a,b) => a-b).slice(0, ordered[index][1].length))
  }
  assert.ok(graph.width >= Math.max(...graph.abilities.map(node => node.x)) + 260)
  assert.ok(graph.width > 3000)
  assert.ok(graph.height < 900)
})

test('BIM catalog extends long-form abilities with explicit tasks and preserves existing inputs', () => {
  assert.equal(typeof state.extendBimAbilities, 'function')
  const input = { jobName: 'BIM建模工程师', nodes: [{ name: '原有知识', category: '知识' }], tasks: [
    { name: '建筑模型创建与标准校核', abilities: ['原有知识'] },
    { name: '施工图深化与碰撞检查', abilities: [] },
    { name: '工程量提取与变更协同', abilities: [] },
    { name: '模型交付与过程复核', abilities: [] },
    { name: '设计协同问题闭环', abilities: [] }
  ] }
  const before = structuredClone(input)
  const extended = state.extendBimAbilities(input)
  assert.equal(extended.nodes.length, 91)
  for (const category of ['知识', '技能', '素养']) assert.equal(extended.nodes.filter(node => node.category === category).length, category === '知识' ? 31 : 30)
  assert.ok(extended.nodes.filter(node=>node.name.length>=20).length >= 45)
  assert.equal(new Set(extended.nodes.map(node=>node.name)).size, 91)
  const refs = new Set(extended.tasks.flatMap(task=>task.abilities))
  assert.ok(extended.nodes.every(node=>refs.has(node.name)))
  assert.deepEqual(input,before)
  assert.deepEqual(state.extendBimAbilities(extended),extended)
  assert.deepEqual(state.extendBimAbilities({...input,jobName:'其他岗位'}),{...input,jobName:'其他岗位'})
})

test('tall viewports use more aligned rows and fill to the canvas lower edge', () => {
  const input = { jobName: '岗位', nodes: Array.from({length:171}, (_,i)=>({name:`能力${i}`,category:'知识'})), tasks:[{name:'任务',abilities:['能力0']}] }
  const tall = state.buildGraph({...input,viewportHeight:950})
  const shorter = state.buildGraph({...input,viewportHeight:720})
  assert.equal(tall.height,950)
  assert.equal(shorter.height,720)
  assert.ok(Math.max(...tall.abilities.map(n=>n.y)) >= 900)
  assert.ok(Math.max(...tall.abilities.map(n=>n.y)) <= 930)
  assert.ok(new Set(tall.abilities.map(n=>n.y)).size > new Set(shorter.abilities.map(n=>n.y)).size)
  assert.ok(tall.width < shorter.width)
  assert.deepEqual(tall.abilities.map(n=>[n.name,n.x,n.y]),state.buildGraph({...input,viewportHeight:950,activeTaskIndex:0}).abilities.map(n=>[n.name,n.x,n.y]))
})

test('ability search matches only name fragments and supports whitespace and case insensitive tokens', () => {
  assert.equal(typeof state.searchAbilities,'function')
  const abilities = [
    {name:'BIM模型创建与校核',category:'技能'},
    {name:'施工图模型校核规范',category:'知识'},
    {name:'质量安全意识',category:'素养'}
  ]
  assert.deepEqual(state.searchAbilities(abilities,' 模型   校核 ').map(n=>n.name),['BIM模型创建与校核','施工图模型校核规范'])
  assert.deepEqual(state.searchAbilities(abilities,'bim').map(n=>n.name),['BIM模型创建与校核'])
  assert.deepEqual(state.searchAbilities(abilities,'素养'),[])
  assert.deepEqual(state.searchAbilities(abilities,'不存在'),[])
  assert.deepEqual(state.searchAbilities(abilities,'  '),[])
})

test('ability search prioritizes exact and prefix names while retaining every match', () => {
  assert.equal(typeof state.searchAbilities,'function')
  const abilities = [{name:'工程质量检查'},{name:'质量检查方法'},{name:'质量检查'}]
  assert.deepEqual(state.searchAbilities(abilities,'质量检查').map(n=>n.name),['质量检查','质量检查方法','工程质量检查'])
  assert.deepEqual(abilities.map(n=>n.name),['工程质量检查','质量检查方法','质量检查'])
})
