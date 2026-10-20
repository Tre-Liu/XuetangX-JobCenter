import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const graph = fs.readFileSync(new URL('../public/opendesign/industry-education-graph-prototype.html', import.meta.url), 'utf8')
const dataContext = {}
vm.runInNewContext(fs.readFileSync(new URL('../public/opendesign/industry-job-task-abilities.js', import.meta.url), 'utf8'), dataContext)
const data = dataContext.IndustryJobTaskAbilities
const staticContext = { URLSearchParams, window: { location: { search: '' } } }
const start = index.indexOf('        const staticChains =')
const end = index.indexOf('        const staticCertificateDetails =', start)
vm.runInNewContext(index.slice(start, end) + '\nglobalThis.jobs = staticPortraitDetails;', staticContext)

test('图谱任务能力数据完整复用24个现有Demo岗位及任务归属', () => {
  assert.equal(data.source, 'existing-static-portrait-demo')
  assert.equal(Object.keys(data.jobs).length, 24)
  for (const [id, job] of Object.entries(staticContext.jobs)) {
    const actual = data.jobs[id]
    assert.equal(actual.name, job.name)
    assert.equal(actual.tasks.length, job.tasks.length)
    const categoryLookup = new Map(Object.entries(job.abilities).flatMap(([category, names]) => names.map(name => [name, category])))
    assert(actual.tasks.flatMap(task => task.abilities).length >= 60)
    for (let i = 0; i < job.tasks.length; i++) {
      assert.equal(actual.tasks[i].name, job.tasks[i].name)
      assert.deepEqual(Array.from(actual.tasks[i].abilities, a => a.name), Array.from(job.tasks[i].abilities))
      for (const ability of actual.tasks[i].abilities) assert.equal(ability.category, categoryLookup.get(ability.name))
    }
  }
})

test('典型工作任务渲染全部能力点并提供名称和三类颜色标识', () => {
  const context = { IndustryJobTaskAbilities: data }
  const start = graph.indexOf('    function industryTaskGroupsForJob(')
  const end = graph.indexOf('    function jobIndustryLinks(', start)
  vm.runInNewContext(`
    const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const relatedNodesForIndustryJob = () => '';
    ${graph.slice(start, end)}
    globalThis.renderTasks = industryTaskAbilityHtml;
  `, context)
  for (const [id, job] of Object.entries(data.jobs)) {
    const html = context.renderTasks({ id })
    assert.equal((html.match(/class="industry-task-group/g) || []).length, job.tasks.length)
    assert.equal((html.match(/class="industry-ability-dot"/g) || []).length, job.tasks.flatMap(t => t.abilities).length)
    for (const tone of ['knowledge', 'skill', 'quality']) assert(html.includes(`data-tone="${tone}"`))
    assert(html.includes('role="tooltip"'))
    assert(!html.includes('<small>'))
  }
})


test('Demo能力与知识点支持一对多关联，保留未关联能力，全部指向现有知识点', () => {
  const context = {};
  const start = graph.indexOf('    function knowledgeIdsForAbility(');
  const end = graph.indexOf('    function industryTaskAbilityHtml(', start);
  vm.runInNewContext(graph.slice(start, end) + '\nglobalThis.link = knowledgeIdsForAbility;', context);
  assert(context.link({name: '接口联调与问题排查'}).includes('knowledge-register'));
  assert(context.link({name: '接口联调与问题排查'}).includes('knowledge-protocol'));
  assert.deepEqual(Array.from(context.link({name: '绿色建造意识'})), []);
  assert(context.link({name: '施工现场数据采集'}).includes('knowledge-signal'));
  const knowledgeIds = new Set(Array.from(graph.matchAll(/data-focus="knowledge-point" data-node-id="([^"]+)"/g), match => match[1]));
  for (const job of Object.values(data.jobs)) {
    const abilities = job.tasks.flatMap(task => task.abilities);
    assert(abilities.some(ability => context.link(ability).length > 0));
    assert(abilities.some(ability => context.link(ability).length === 0));
    for (const ability of abilities) for (const id of context.link(ability)) assert(knowledgeIds.has(id));
  }
});

test('三个课程目标共有100个可联动知识点，知识点ID唯一且归属课程有效', () => {
  const points = [...graph.matchAll(/data-focus="knowledge-point" data-node-id="([^"]+)" data-parent-node="([^"]+)" data-related-nodes="([^"]+)"/g)];
  assert.equal(points.length, 100);
  assert.equal(new Set(points.map(point => point[1])).size, 100);
  for (const goal of ['course-goal-control', 'course-goal-debug', 'course-goal-comm']) {
    assert.equal(points.filter(point => point[2] === goal).length, goal === 'course-goal-control' ? 34 : 33);
  }
  const courses = new Set([...graph.matchAll(/data-focus="course" data-node-id="([^"]+)"/g)].map(match => match[1]));
  for (const point of points) assert(point[3].split(' ').some(id => courses.has(id)));
});


test('知识点提示使用独立浮层，支持悬停和键盘焦点且限制在视窗内', () => {
  assert.match(graph, /document.body.append\(knowledgeTooltip\)/);
  assert.match(graph, /knowledge-point-tooltip[\s\S]*?position:\s*fixed/);
  assert.match(graph, /point.addEventListener\("pointerenter"/);
  assert.match(graph, /point.addEventListener\("focus"/);
  assert.match(graph, /Math.min\(rect.left, window.innerWidth - tooltipRect.width - margin\)/);
});
