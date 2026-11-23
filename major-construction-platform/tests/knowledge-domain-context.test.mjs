import test from 'node:test'
import assert from 'node:assert/strict'
import '../src/talent-plan/data.js'
import '../src/knowledge-domain/outlines.js'
import '../src/knowledge-domain/curriculum.js'
import '../src/knowledge-domain/context.js'

const context = (search = '', settings) => globalThis.KnowledgeDomainContext.build(
  new URL('https://school.example/platform/index.html' + search), {selection:'knowledge-domain', ...settings},
)

test('智能建造图谱补入 55 项未归属实训建议，保留教师已有记录且只补一次', async () => {
  await import('../src/knowledge-domain/model.js')
  await import('../src/knowledge-domain/atlas.js')
  const input = context()
  const graph = globalThis.KnowledgeDomainModel.fromCurriculum(input)
  const robot = graph.courses.find(course => course.id === 'B261322')
  const owner = robot.topics.flatMap(topic => topic.sections).find(section => section.name === '运行记录')
  const position = owner.points.push('实训设备借用登记') - 1
  owner.manualPointDomains = { [position]: [] }
  const curriculum = globalThis.KnowledgeDomainCurriculum
  const updated = curriculum.withPracticePoints(graph)
  const atlas = globalThis.KnowledgeDomainAtlas.build(updated.major, updated.courses, input.plan)
  assert.equal(atlas.unassigned.size, 55)
  assert.deepEqual(updated.relations, graph.relations)
  const updatedOwner = updated.courses.find(course => course.id === 'B261322').topics
    .flatMap(topic => topic.sections).find(section => section.name === '运行记录')
  assert.equal(updatedOwner.points[position], '实训设备借用登记')
  assert.equal(updatedOwner.points.filter(name => name === '实训设备借用登记').length, 1)
  assert.equal(curriculum.withPracticePoints(updated), updated)
  const fresh = curriculum.withPracticePoints(globalThis.KnowledgeDomainModel.fromCurriculum(input))
  assert.equal(globalThis.KnowledgeDomainAtlas.build(fresh.major, fresh.courses, input.plan).unassigned.size, 55)
})

test('其他共用专业资料的模块仍可取得完整课程档案', () => {
  const catalogue = globalThis.KnowledgeDomainContext.build(new URL('https://school.example/platform/index.html'))
  assert.deepEqual(catalogue.courses.map(course => course.id), globalThis.TalentPlanData.courses.map(course => course.id))
  assert.equal(catalogue.curriculumRevision, undefined)
})

test('智能建造选取十门在册课程，每门有四层结构且包含至少一百个不同的末级知识点', () => {
  const {courses, curriculumRevision, relationSeeds} = context()
  assert.ok(curriculumRevision)
  assert.equal(new Set(courses.map(c => c.id)).size, 10)
  const byId = new Map()
  for (const course of courses) {
    assert.ok(globalThis.TalentPlanData.courses.some(c => c.id === course.id && c.name === course.name))
    assert.match(course.source, /待审核/)
    assert.ok(course.topics.length > 1)
    const points = course.topics.flatMap(unit => {
      assert.ok(unit.name && unit.sections.length > 1)
      return unit.sections.flatMap(section => {
        assert.ok(section.name && section.points.length > 1)
        return section.points
      })
    })
    assert.ok(new Set(points).size >= 100, course.name)
    assert.equal(new Set(points).size, points.length, course.name)
    byId.set(course.id, new Set(points))
  }
  const connected = new Set()
  const pairs = new Set()
  for (const {from,to,reason,label} of relationSeeds) {
    assert.notEqual(from[0], to[0])
    assert.ok(byId.get(from[0])?.has(from[1]), from.join(' / '))
    assert.ok(byId.get(to[0])?.has(to[1]), to.join(' / '))
    assert.ok(reason && label)
    connected.add(from[0]).add(to[0])
    pairs.add([from.join('@'),to.join('@')].sort().join('~'))
  }
  assert.equal(connected.size, 10)
  assert.equal(pairs.size, relationSeeds.length)
})

test('学校、专业、工作区互相隔离，空课程管理不会自动加载内置课程', () => {
  const primary = context()
  for (const search of ['?majorName=计算机技术','?schoolId=other','?workspaceId=other']) {
    const foreign = context(search)
    assert.notEqual(foreign.scope, primary.scope)
    assert.equal(foreign.courses.length, 0)
    assert.equal(foreign.materials.length, 0)
  }
  assert.equal(context('', {catalogAvailable:false}).courses.length, 0)
})

test('扩展课程的节点按层级计数，跨课程关系覆盖不同课程组合', () => {
  const {courses,relationSeeds}=context()
  const bim=courses.find(c=>c.id==='B261306')
  const sections=bim.topics.flatMap(u=>u.sections)
  assert.equal(1+bim.topics.length+sections.length+sections.flatMap(s=>s.points).length,400)
  assert.ok(relationSeeds.length>=80)
  assert.ok(new Set(relationSeeds.map(r=>[r.from[0],r.to[0]].sort().join('/'))).size>=35)
})

test('共享知识点在所有归属领域内使用同一身份、同一球面坐标', async () => {
  await import('../src/knowledge-domain/atlas.js')
  const {major,courses,plan}=context()
  const A=globalThis.KnowledgeDomainAtlas, atlas=A.build(major,courses,plan)
  const regions=A.geometry(atlas,1)
  const shared=[...atlas.memberships]
  assert.ok(shared.filter(([,ids])=>ids.length===4).length>=5)
  for(const [key,ids] of shared) {
    const primary=regions[ids[0]], location=primary.world.get(key)
    const member=primary.domain.members.find(m=>m.key===key)
    assert.equal(atlas.paths.get(key),ids[0])
    for(const di of ids) {
      assert.ok(regions[di].domain.members.includes(member))
      assert.equal(regions[di].world.get(key),location)
    }
    if(member.name==='构件唯一标识') assert.deepEqual(ids.map(di=>atlas.domains[di].name),
      ['数字建模与深化设计','工程测量与监测','建筑结构与施工','工程经济与项目管理'])
  }
  const extra=A.build('其他专业',[{name:'课程',domain:'甲',topics:[{name:'单元',
    points:['共享概念'],pointDomains:{0:['甲','乙','丙','丁']}}]}])
  const sharedRegions=A.geometry(extra,1), key='0/0//0'
  for(const r of sharedRegions) {
    assert.equal(r.world.get(key),sharedRegions[0].world.get(key))
    assert.equal(r.domain.pointCounts.get(0),1)
    const {x,y,z}=r.world.get(key),length=Math.hypot(x,y,z)
    assert.ok(A.inside(r,{x:x/length,y:y/length,z:z/length}))
  }
})

test('领域涵盖所选课程，目标关联逐项指向同一专业培养方案的原文', async () => {
  await import('../src/knowledge-domain/atlas.js')
  const {major,courses,plan}=context()
  const a=globalThis.KnowledgeDomainAtlas.build(major,courses,plan)
  assert.equal(a.goals.length,11)
  assert.equal(a.domains.length,5)
  const foundations=a.goals[4]
  assert.equal(foundations.title,'智能建造基础知识与技能')
  assert.equal(foundations.label,'目标5')
  assert.deepEqual(foundations.domains.map(({index})=>a.domains[index].name),[
    '数字建模与深化设计','工程测量与监测','建筑结构与施工','智能装备与物联',
  ])
  assert.deepEqual(a.goals[0].domains,[])
  assert.deepEqual([...new Set(a.domains.flatMap(d=>d.courses))].sort((x,y)=>x-y),courses.map((_,i)=>i))
  for(const [ci,di] of a.courseDomain.entries()) assert.ok(a.domains[di].courses.includes(ci))
  for(const d of a.domains) {
    assert.ok(d.goals.length>0)
    for(const {index,evidence} of d.goals) {
      assert.ok(plan.text.includes(a.goals[index].text))
      assert.ok(evidence.every(term=>a.goals[index].text.toLowerCase().includes(term.toLowerCase())))
    }
  }
  const foreign=context('?schoolId=other')
  assert.equal(foreign.plan,null)
  const blank=globalThis.KnowledgeDomainAtlas.build('另一专业',[{name:'课程甲',domain:'基础理论'}],foreign.plan)
  assert.equal(blank.domains[0].name,'基础理论')
  assert.equal(blank.goals.length,0)
  const custom=globalThis.KnowledgeDomainAtlas.build(major,[{name:'结构安全'}],{
    text:'目标5：具备结构安全评估能力，能够编制检测方案',
  })
  assert.equal(custom.goals[0].title,'具备结构安全评估能力…')
})

test('领域内最外圈的知识点位于海岸线内，球面展开坐标可逆', async () => {
  await import('../src/knowledge-domain/atlas.js')
  const A=globalThis.KnowledgeDomainAtlas
  const {major,courses,plan}=context()
  const regions=A.geometry(A.build(major,courses,plan),120)
  for(const r of regions) {
    for(const {key,path} of r.domain.members) {
      if(path[3]===null) continue
      const {x,y,z}=r.world.get(key), length=Math.hypot(x,y,z)
      const v={x:x/length,y:y/length,z:z/length}
      assert.ok(A.inside(r,v),key)
      const {u,v:lat}=A.mapPoint(v)
      const longitude=(u-.5)*Math.PI*2,latitude=(.5-lat)*Math.PI
      assert.ok(Math.abs(Math.cos(latitude)*Math.sin(longitude)-v.x)<1e-8)
      assert.ok(Math.abs(Math.sin(latitude)-v.y)<1e-8)
      assert.ok(Math.abs(Math.cos(latitude)*Math.cos(longitude)-v.z)<1e-8)
    }
  }
})

test('跨课程的坐标知识位于同一领域且空间邻近，调整知识点会重绘边界', async () => {
  await import('../src/knowledge-domain/atlas.js')
  const A=globalThis.KnowledgeDomainAtlas
  const {major,courses,plan}=context()
  const atlas=A.build(major,courses,plan)
  const region=A.geometry(atlas,1).find(r=>r.domain.name==='工程测量与监测')
  const members=['共享坐标','施工坐标转换'].map(name=>region.domain.members.find(m=>m.name===name))
  const [left,right]=members.map(m=>region.world.get(m.key))
  assert.notEqual(members[0].path[0],members[1].path[0])
  assert.notEqual(atlas.courseDomain[members[0].path[0]],atlas.paths.get(members[0].key))
  assert.ok(Math.hypot(left.x-right.x,left.y-right.y,left.z-right.z)<region.maxAngle*.55)

  const sample=points=>A.geometry(A.build('建筑学',[{name:'制图',topics:[{name:'轴网',points}]}]),1)[0]
  const sparse=sample(['轴号']), expanded=sample(['轴号','轴距','标注','对齐','基点'])
  assert.notDeepEqual(sparse.outline,expanded.outline)
  for(const r of [sparse,expanded]) {
    for(const vertex of r.rim) {
      const leaves=r.domain.members.filter(m=>m.path[3]!==null).map(m=>r.world.get(m.key))
      const nearest=Math.min(...leaves.map(p=>Math.hypot(vertex.x-p.x,vertex.y-p.y,vertex.z-p.z)))
      assert.ok(nearest<.32)
    }
  }
})

test('每项有关联的培养目标都有一个固定在球体坐标中的卫星位置', async () => {
  await import('../src/knowledge-domain/atlas.js')
  const {build,satellites}=globalThis.KnowledgeDomainAtlas
  const {major,courses,plan,suggestedGoals}=context()
  const atlas=build(major,courses,plan,suggestedGoals)
  const nodes=satellites(atlas,120,1.5,.54)
  assert.deepEqual(nodes.map(node=>node.index),Array.from({length:22},(_,i)=>i+4))
  assert.equal(new Set(nodes.map(({position})=>JSON.stringify(position))).size,22)
  for(const {position:{x,y,z}} of nodes) assert.ok(Math.abs(Math.hypot(x,y,z)-151.2)<1e-8)
  assert.deepEqual(satellites(build(major,courses,null),120,1.5,.54),[])
})

test('十五项课程建议目标与方案原文分别标注，全部能由领域关键词追溯', async () => {
  await import('../src/knowledge-domain/atlas.js')
  const {build,readGoals}=globalThis.KnowledgeDomainAtlas
  const {major,courses,plan,suggestedGoals}=context()
  const atlas=build(major,courses,plan,suggestedGoals)
  assert.equal(readGoals(plan).length,11)
  assert.equal(atlas.goals.length,26)
  const added=atlas.goals.slice(11)
  assert.equal(new Set(added.map(g=>g.title)).size,15)
  assert.equal(new Set(added.flatMap(g=>g.domains.map(d=>d.index))).size,5)
  added.forEach((g,i)=>{
    assert.equal(g.label,'建议目标'+(i+12))
    assert.ok(g.suggested && g.domains.length>0)
    for(const d of g.domains) assert.ok(d.evidence.some(term=>g.text.includes(term)))
  })
  const custom=build(major,courses,{text:'目标30：'+added[0].text},suggestedGoals)
  assert.equal(custom.goals.length,15)
  assert.equal(custom.goals[1].label,'建议目标31')
  assert.ok(!context('?schoolId=other').suggestedGoals?.length)
  assert.ok(!context('',{selection:'all'}).suggestedGoals?.length)
})
test('重命名领域保留原有成员，删除领域后保留课程和共有知识点的其他归属', async () => {
  await import('../src/knowledge-domain/atlas.js')
  const A = globalThis.KnowledgeDomainAtlas
  const courses = [{name:'课程甲', domain:'领域甲', topics:[{name:'单元甲', points:['知识点甲','知识点乙'],
    pointDomains:{0:['领域甲','领域乙']}}]}]
  const plan = {text:'目标1：掌握课程甲。'}
  const renamed = A.build('专业', courses, plan, [], {domains:{领域甲:{name:'领域丙'}}})
  assert.equal(renamed.domains[0].name, '领域丙')
  assert.deepEqual(renamed.goals[0].domains.map(item=>item.index), [0])
  const deleted = A.build('专业', courses, plan, [], {domains:{领域甲:{deleted:true}}})
  assert.equal(deleted.domains[0].deleted, true)
  assert.equal(deleted.paths.get('0/0//0'), 1)
  assert.ok(deleted.unassigned.has('0/0//1'))
  assert.equal(deleted.paths.has('0/0//1'), false)
  assert.equal(deleted.memberships.has('0/0//0'), false)
  assert.equal(deleted.goals[0].domains.length, 0)
  const regions = A.geometry(deleted, 65)
  assert.ok(regions[1].world.has('0/0//0'))
  assert.equal(regions[0].world.has('0/0//1'), false)
})
