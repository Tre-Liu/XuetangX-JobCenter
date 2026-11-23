import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('../src/knowledge-domain/element.js', import.meta.url), 'utf8')
const atlasSource = readFileSync(new URL('../src/knowledge-domain/atlas.js', import.meta.url), 'utf8')
const makeGraph = major => ({ major, mode: 'local', courses: [{ id: 'a', name: '课程甲', topics: [{ name: '单元甲', points: ['知识点甲'] }] }] })

function fixture() {
  let Element
  const records = new Map()
  const env = vm.createContext({
    HTMLElement: class { dataset = {} }, AbortController,
    customElements: { get() {}, define(tag, ctor) { Element = ctor } },
    localStorage: {
      setItem(key, value) { records.set(key, value) },
      getItem(key) { return records.get(key) ?? null }
    }
  })
  vm.runInContext(atlasSource, env)
  vm.runInContext(source, env)
  const panel = new Element()
  panel.context = { major: '甲专业', scope: '甲校', courses: [{ id: 'a', name: '课程甲', isCore: true }] }
  panel.isConnected = true
  panel.renderWorkspace = () => {}
  panel.updateDraft = () => {}
  const nodes = {
    '[data-act="generate"]': { disabled: false },
    '.kdg-requirements': { value: '整理重点单元' },
    '.kdg-scene': {},
    '.kdg-scene-status': {}
  }
  panel.$ = key => nodes[key]
  panel.ready = true
  return { panel, env, records }
}

test('a late generator response after switching schools cannot overwrite either school', async () => {
  const { panel, env, records } = fixture()
  let finish, signal
  env.KnowledgeDomainModel = { generate(input, options) {
    signal = options.signal
    return new Promise(resolve => { finish = resolve })
  } }
  panel.graph = makeGraph('甲专业')
  panel.save()
  const previousKey = panel.storageKey
  const previous = records.get(previousKey)
  panel.draft = { files: [] }
  const pending = panel.generate()
  panel.context = { ...panel.context, scope: '乙校' }
  assert.equal(signal.aborted, true)
  assert.notEqual(previousKey, panel.storageKey)
  finish(makeGraph('甲专业'))
  await pending
  assert.equal(panel.graph, null)
  assert.equal(records.has(panel.storageKey), false)
  assert.equal(records.get(previousKey), previous)
  panel.context = { ...panel.context, scope: '甲校' }
  assert.equal(panel.graph.courses[0].name, '课程甲')
})

test('generation retains file names and requirements while source text stays out of the storage record', async () => {
  const { panel, env, records } = fixture()
  const raw = '仅供附件解析的原始正文'
  let received
  env.KnowledgeDomainModel = { async generate(input) { received = input; return makeGraph(input.major) } }
  panel.draft = { files: [{ name: '课程资料.txt', text: raw, state: 'ready' }] }
  await panel.generate()
  assert.equal(received.attachments[0].text, raw)
  const record = records.get(panel.storageKey)
  assert.deepEqual(JSON.parse(record).fileNames, ['课程资料.txt'])
  assert.equal(JSON.parse(record).graph.requirements, '整理重点单元')
  assert.equal(record.includes(raw), false)
})

test('课程群建成后自动显示课程底图，AI 创建沿用课程群', async () => {
  const { panel, env, records } = fixture()
  vm.runInContext(readFileSync(new URL('../src/knowledge-domain/model.js', import.meta.url), 'utf8'), env)
  panel.context = {
    ...panel.context,
    curriculumRevision: 'archive-v1',
    courses: [{ id: 'a', name: '档案课程', topics: [{ name: '档案单元', sections: [{ name: '档案主题', points: ['档案知识点'] }] }] }]
  }
  assert.equal(panel.graph.mode, 'course-group')
  assert.equal(records.has(panel.storageKey), false)
  panel.draft = { files: [] }
  await panel.generate()
  assert.deepEqual(Array.from(panel.graph.courses, course => course.name), ['档案课程'])
  assert.equal(panel.graph.courses[0].topics[0].sections[0].points[0], '档案知识点')
  assert.equal(JSON.parse(records.get(panel.storageKey)).graph.useCourseGroupGraph, true)
})

test('初始化后旧版图谱不会重新载入，生成新图谱后可再次保存', async () => {
  const { panel, env, records } = fixture()
  const original = { ...panel.context, curriculumRevision: 'construction-ten-v3' }
  env.KnowledgeDomainModel = {
    previousRevision: revision => revision === 'construction-ten-v3' ? 'construction-ten-v2' : '',
    generate: async ({ major }) => makeGraph(major)
  }
  panel.context = original
  const saved = JSON.stringify({ graph: makeGraph('甲专业'), fileNames: ['课程资料.txt'] })
  records.set(panel.storageKey, saved)
  records.set(panel.revisionKey('construction-ten-v2'), saved)
  records.set(panel.legacyKey, saved)
  panel.loadContext()
  assert.ok(panel.graph)
  panel.contains = () => true

  panel.onClick({ target: { closest: () => ({ dataset: { act: 'confirm-initialize' } }) } })
  assert.equal(panel.graph, null)
  assert.equal(panel.fileNames.length, 0)
  panel.loadContext()
  assert.equal(panel.graph, null)
  assert.equal(records.get(panel.revisionKey('construction-ten-v2')), saved)
  assert.equal(records.get(panel.legacyKey), saved)

  panel.draft = { files: [] }
  await panel.generate()
  panel.loadContext()
  assert.equal(panel.graph.courses[0].name, '课程甲')
  assert.equal(panel.fileNames.length, 0)
})

test('the scene uses core course flags from matching catalogue IDs; a late loader cannot mount a retired scene', async () => {
  const { panel, env } = fixture()
  let finishLoad
  env.loadKnowledgeDomainScene = () => new Promise(resolve => { finishLoad = resolve })
  const retired = panel.mountScene()
  panel.stopScene()
  let snapshot
  env.KnowledgeDomainScene = { mount(host, options) { snapshot = options.courses; return { destroy() {} } } }
  finishLoad()
  await retired
  assert.equal(snapshot, undefined)
  panel.graph = makeGraph('甲专业')
  panel.graph.courses.push({ id: 'b', name: '课程甲', topics: [] })
  await panel.mountScene()
  assert.equal(snapshot[0].isCore, true)
  assert.equal(snapshot[1].isCore, false)
})

test('unmatched attachments are explained without listing them among used source files', () => {
  const { panel } = fixture()
  panel.graph = {
    ...makeGraph('甲专业'), sources: [{name:'本次课程清单'}],
    notice:'其他资料.txt 未匹配本专业课程。',
    unusedMaterials:[{name:'其他资料.txt',reason:'未匹配本专业课程'}],
  }
  panel.fileNames = ['其他资料.txt']
  let body
  panel.addDialog = (_title, html) => { body = html }
  panel.showSources()
  assert.match(body, /其他资料.txt 未匹配本专业课程/)
  assert.doesNotMatch(body, /<li>其他资料.txt<\/li>/)
})

test('the complete default catalogue opens on the new curriculum while the original record can be revisited intact', () => {
  const { panel, env, records } = fixture()
  const catalogue = Array.from({length:74}, (_, n) => ({id:'course-'+n,name:'课程'+n}))
  env.TalentPlanData = { courses:catalogue }
  const major = '智能建造工程专业'
  panel.context = {major,scope:'默认专业',courses:catalogue}
  const old = {graph:{major,courses:catalogue.map(c=>({...c,topics:[{name:'人工修订',points:['历史知识点']}]})),requirements:'旧版要求'},fileNames:['旧版教学文件.pdf']}
  old.graph.courses.push({id:'upload-1',name:'附件补录课程',topics:[]})
  const original = JSON.stringify(old)
  records.set(panel.storageKey, original)
  const sourceKey = panel.storageKey
  let conversions = 0
  env.KnowledgeDomainModel = {fromCurriculum(input) {
    conversions++
    return {major:input.major,curriculumRevision:input.curriculumRevision,courses:input.courses}
  }}
  panel.context = {...panel.context,curriculumRevision:'10-course',courses:catalogue.slice(0,10).map(c=>({...c,topics:[{name:'单元',sections:[{name:'主题',points:['知识点']}]}]}))}
  assert.equal(panel.graph.courses.length,10)
  assert.equal(panel.graph.curriculumRevision,'10-course')
  assert.ok(records.has(panel.storageKey))
  assert.equal(records.get(sourceKey),original)
  panel.toggleHistory()
  assert.equal(panel.historyShown,true)
  assert.equal(panel.graph.courses[0].topics[0].name,'人工修订')
  assert.equal(panel.graph.courses[74].name,'附件补录课程')
  assert.equal(panel.fileNames[0],'旧版教学文件.pdf')
  assert.equal(panel.graph.requirements,'旧版要求')
  panel.toggleHistory()
  assert.equal(panel.graph.courses.length,10)
  panel.loadContext()
  assert.equal(conversions,1)
  assert.equal(panel.previousRecord.graph.courses.length,75)
  assert.equal(records.get(sourceKey),original)
})

test('an empty archive stays empty and a custom 74-course set is not migrated', () => {
  const {panel,env,records}=fixture()
  const catalogue=Array.from({length:74},(_,n)=>({id:'old-'+n,name:'档案课程'+n,topics:[]}))
  env.TalentPlanData={courses:catalogue}
  env.KnowledgeDomainModel={fromCurriculum(){assert.fail('custom or empty record must stay unchanged')}}
  const context={major:'智能建造工程专业',scope:'本校',curriculumRevision:'课程修订稿',courses:[]}
  panel.context=context
  assert.equal(panel.graph,null)
  records.set(panel.legacyKey,JSON.stringify({graph:{major:context.major,courses:catalogue.map((c,n)=>({...c,id:'custom-'+n}))},fileNames:[]}))
  panel.loadContext()
  assert.equal(panel.graph.courses[0].id,'custom-0')
  assert.equal(panel.previousRecord,null)
  assert.equal(records.has(panel.storageKey),false)
})

test('刷新十课旧档案时保留原有路径、修订、附件及关联，只补入新版内容一次', () => {
  const {panel,env,records}=fixture()
  for (const file of ['talent-plan/data','knowledge-domain/curriculum','knowledge-domain/context','knowledge-domain/model']) {
    vm.runInContext(readFileSync(new URL('../src/'+file+'.js',import.meta.url),'utf8'),env)
  }
  const newContext=env.KnowledgeDomainContext.build(new URL('https://school.example/platform/index.html'),{selection:'knowledge-domain'})
  const courses=newContext.courses.map(course=>({...course,topics:course.topics.slice(0,4)}))
  const oldContext={...newContext,courses,curriculumRevision:'construction-ten-v2',relationSeeds:newContext.relationSeeds.slice(0,25)}
  panel.context=oldContext
  const oldKey=panel.storageKey
  const catalogue=JSON.stringify({graph:{major:newContext.major,courses:env.TalentPlanData.courses.map(c=>({...c,topics:[]}))},fileNames:['最早的课程清单.txt']})
  records.set(panel.legacyKey,catalogue)
  const old=env.KnowledgeDomainModel.fromCurriculum(oldContext)
  old.courses.reverse()
  const reordered=([ci,...rest])=>[9-ci,...rest]
  old.relations=old.relations.map(edge=>({...edge,from:reordered(edge.from),to:reordered(edge.to)}))
  const bim=old.courses[9], originalUnit=bim.topics[0], section=originalUnit.sections[0]
  originalUnit.name='教研修订单元'
  originalUnit.nameEdited=true
  section.name='教研修订主题'
  section.nameEdited=true
  section.points[2]='教研修订坐标'
  section.editedPoints=[2]
  // Older local saves can carry a renamed leaf without an editedPoints marker.
  const [peerCourse,peerUnit,peerSection,peerPoint]=old.relations[0].from
  old.courses[peerCourse].topics[peerUnit].sections[peerSection].points[peerPoint]='测量组修订坐标'
  const fileName='现场测量记录.txt'
  const extra={name:'资料补录',source:fileName,sections:[{name:'现场标记',source:fileName,
    points:Array.from({length:50},(_,i)=>'现场标记'+i),
    pointSources:Array.from({length:50},()=>({source:fileName,evidence:'来自测量记录',fileName})),
  }]}
  bim.topics.push(extra)
  old.relations.push({from:[9,4,0,49],to:[8,0,0,0],label:'复测',reason:'按资料复测'})
  Object.assign(old,{requirements:'保留手工记录',goalPlan:{name:'培养方案.txt',text:'培养目标原文'},
    sources:[{kind:'material',name:fileName}],unusedMaterials:[{name:'工单.txt',reason:'未匹配课程'}]})
  const original=JSON.stringify({graph:old,fileNames:[fileName,'工单.txt']})
  records.set(oldKey,original)
  const addition={name:'曲面构件专项',sections:[{name:'核算依据',points:['现场标记49','曲面边长核验']}]}
  const newCourses=courses.map(c=>c.id==='B261306'?{...c,topics:[...c.topics,addition]}:c)
  const modelled=oldContext.relationSeeds[0].from
  const newSeeds=[...oldContext.relationSeeds,
    {from:['B261306','共享坐标'],to:modelled,label:'逆向核查',reason:'复核控制坐标'},
    {from:['B261306','曲面边长核验'],to:modelled,label:'尺寸校核',reason:'使用现场测量值'},
    {from:['B261306','现场标记49'],to:modelled,label:'标记核对',reason:'核对标记位置'}]
  panel.context={...newContext,curriculumRevision:'construction-ten-v3',courses:newCourses,relationSeeds:newSeeds}
  assert.ok(panel.graph,'应恢复已保存的十门课程')
  assert.equal(panel.graph.curriculumRevision,'construction-ten-v3')
  const saved=JSON.parse(records.get(panel.storageKey)), prior=JSON.parse(original)
  assert.deepEqual(saved.fileNames,prior.fileNames)
  for (const key of ['requirements','goalPlan','sources','unusedMaterials','mode','modeLabel','notice']) {
    assert.deepEqual(saved.graph[key],prior.graph[key])
  }
  const supplemented = env.KnowledgeDomainCurriculum.withPracticePoints({
    ...prior.graph,curriculumRevision:'construction-ten-v3',
  })
  assert.deepEqual(saved.graph.courses.slice(0,9),JSON.parse(JSON.stringify(supplemented.courses.slice(0,9))))
  assert.deepEqual(saved.graph.courses[9].topics.slice(0,5),prior.graph.courses[9].topics)
  assert.deepEqual(saved.graph.courses[9].topics[5].sections[0].points,['曲面边长核验'])
  assert.deepEqual(saved.graph.relations.slice(0,26),prior.graph.relations)
  assert.deepEqual(saved.graph.relations.slice(26).map(e=>[e.from,e.to,e.label]),[
    [[9,0,0,2],prior.graph.relations[0].from,'逆向核查'],
    [[9,5,0,0],prior.graph.relations[0].from,'尺寸校核'],
    [[9,4,0,49],prior.graph.relations[0].from,'标记核对'],
  ])
  const serialized=records.get(panel.storageKey)
  panel.graph.courses[9].topics[0].name='本次编辑'
  panel.toggleHistory()
  assert.equal(panel.graph.courses[9].topics[0].name,'教研修订单元')
  assert.equal(panel.graph.curriculumRevision,'construction-ten-v2')
  panel.toggleHistory(panel.catalogueRecord)
  assert.equal(panel.graph.courses.length,74)
  assert.equal(panel.fileNames[0],'最早的课程清单.txt')
  panel.toggleHistory()
  assert.equal(panel.graph.courses[9].topics[0].name,'本次编辑')
  panel.loadContext()
  assert.equal(records.get(panel.storageKey),serialized)
  assert.equal(records.get(oldKey),original)
  assert.equal(records.get(panel.legacyKey),catalogue)
  assert.equal(panel.graph.courses[9].topics.length,6)
})

test('课程详情只统计末级知识点，并提供各知识领域的入口', () => {
  const {panel}=fixture()
  panel.graph={major:'专业',courses:[
    {id:'a',name:'课程甲',topics:[
      {name:'单元甲',points:['直接知识点']},
      {name:'单元乙',sections:[{name:'主题',points:['知识点一','知识点二']},{name:'待完善主题',points:[]}]},
    ]},
    {id:'b',name:'课程乙',topics:[]},
  ]}
  panel.atlas = {
    paths: new Map([['0///', 0], ['1///', 2]]),
    domains: [
      { name: '数字建模', pointCounts: new Map([[0, 2]]) },
      { name: '工程测量', pointCounts: new Map([[0, 1]]) },
      { name: '项目管理', pointCounts: new Map() },
    ],
  }
  const detail={}, stage={classList:{toggle(){}}}
  panel.$=selector=>({'.kdg-detail':detail,'.kdg-stage':stage})[selector]
  panel.selectNode(0)
  assert.match(detail.innerHTML, /<h3>课程甲<\/h3>/)
  assert.doesNotMatch(detail.innerHTML,/个节点|个知识单元|个主题|单元甲|单元乙|kdg-pager/)
  assert.match(detail.innerHTML,/3 个知识点/)
  assert.match(detail.innerHTML, /<dt>所在知识领域<\/dt>/)
  assert.match(detail.innerHTML, /data-act="atlas-domain" data-index="0"><span>数字建模<\/span>/)
  assert.match(detail.innerHTML, /data-act="atlas-domain" data-index="1"><span>工程测量<\/span>/)
  assert.doesNotMatch(detail.innerHTML, /主要领域|涉及领域|项目管理/)
  panel.selectNode(1)
  assert.match(detail.innerHTML,/0 个知识点/)
  assert.match(detail.innerHTML, /data-act="atlas-domain" data-index="2"><span>项目管理<\/span>/)
})

test('知识领域详情显示知识点数量和关联课程、培养目标，省略知识点列表', () => {
  const { panel } = fixture()
  const points = Array.from({ length: 26 }, (_, index) => '知识点' + (index + 1))
  panel.graph = { major: '专业', courses: [{ name: '工程课程', topics: [{ name: '单元', sections: [{ name: '主题', points }] }] }] }
  panel.atlas = {
    paths: new Map(),
    domains: [{
      name: '工程管理', courses: [0], pointCounts: new Map([[0, points.length]]),
      goals: [{ index: 0 }],
      members: [{ path: [0, 0, 0, null], name: '主题' },
        ...points.map((name, index) => ({ path: [0, 0, 0, index], name }))],
    }],
    goals: [{ title: '岗位协同' }],
  }
  const detail = {}, stage = { classList: { toggle() {} } }
  panel.$ = selector => ({ '.kdg-detail': detail, '.kdg-stage': stage })[selector]
  panel.showAtlasDetail({ kind: 'domain', index: 0 })
  assert.match(detail.innerHTML, /1 门课程 · 26 个知识点/)
  assert.match(detail.innerHTML, /data-act="atlas-course" data-index="0"><strong>工程课程/)
  assert.match(detail.innerHTML, /data-act="atlas-goal" data-index="0"><strong>岗位协同/)
  assert.doesNotMatch(detail.innerHTML, /个知识单元|个主题|待教研确认|关联知识点|atlas-point|知识点26|kdg-pager/)
})

test('图谱搜索区分同名知识点并直接定位知识点、领域和培养目标', () => {
  const {panel} = fixture()
  panel.graph = makeGraph('专业')
  panel.graph.courses.push({name:'课程乙',topics:[{name:'单元乙',sections:[{name:'主题',points:['知识点甲']}]}]})
  panel.atlas = {
    domains:[{name:'工程管理', courses:[0], pointCounts:new Map([[0, 1]]), members:[
      {path:[0,null,null,null]}, {path:[0,0,null,null]}, {path:[0,0,null,0]},
    ], goals:[{index:0,evidence:['跨专业沟通']}]}], paths:new Map(),
    goals:[{label:'目标1',title:'岗位协同',text:'培养具备跨专业沟通能力的人才',domains:[{index:0,evidence:['跨专业沟通']}]}],
    source:'专业培养方案',
  }
  const input = {value:'',setAttribute(){},removeAttribute(){}}
  const results = {innerHTML:'',hidden:true,scrollTop:0}
  const detail = {}, stage = {classList:{toggle(){}}}
  panel.$ = selector => ({
    '.kdg-graph-search-input':input,'.kdg-search-options':results,'.kdg-search-popup':{},
    '.kdg-search-empty':{},'.kdg-detail':detail,'.kdg-stage':stage,
  })[selector]
  const targets = []
  panel.domainsVisible = false
  panel.scene = {
    focus(...path){targets.push(path)},
    locateDomain(index){targets.push(['领域',index])},
    locateGoal(index){targets.push(['目标',index])},
    setDomainsVisible(value){targets.push(['图层',value])},
    reset(){},
  }
  const search = query => {
    input.value = query
    panel.renderSearch()
  }
  search('知识点甲')
  assert.match(results.innerHTML,/课程甲/)
  assert.match(results.innerHTML,/课程乙.*主题/)
  panel.selectSearchResult(1)
  assert.match(detail.innerHTML, /<h3>知识点甲<\/h3>/)
  assert.doesNotMatch(detail.innerHTML, /<h4>知识点甲<\/h4>/)
  search('工程管理')
  panel.selectSearchResult(0)
  assert.equal(detail.hidden, false)
  assert.match(detail.innerHTML, /工程管理/)
  assert.match(detail.innerHTML, /1 个知识点/)
  assert.match(detail.innerHTML, /课程甲/)
  assert.match(detail.innerHTML, /岗位协同/)
  assert.doesNotMatch(detail.innerHTML, /课程乙/)
  search('跨专业沟通')
  panel.selectSearchResult(0)
  assert.match(detail.innerHTML, /培养具备跨专业沟通能力的人才/)
  assert.doesNotMatch(detail.innerHTML, /目标1|专业培养方案|待教研确认|匹配词/)
  assert.match(detail.innerHTML, /data-act="atlas-domain" data-index="0"><strong>工程管理/)
  panel.contains = () => true
  panel.onClick({ target: { closest: () => ({ dataset: { act: 'atlas-domain', index: '0' } }) } })
  assert.match(detail.innerHTML, /<h3[^>]*>工程管理<\/h3>/)
  assert.deepEqual(targets,[[1,0,0,0],['图层',true],['领域',0],['目标',0],['领域',0]])
  panel.onKeyDown({key:'Escape', preventDefault(){}})
  assert.equal(detail.hidden, true)
})

test('nested and direct leaves are editable and cross-course links address the exact peer in both directions', () => {
  const {panel}=fixture()
  const sourcePath=[0,0,0,0], targetPath=[1,0,null,0]
  panel.graph={major:'专业',courses:[
    {id:'a',name:'课程甲',topics:[{name:'单元甲',sections:[{name:'主题甲',points:['知识甲']}]}]},
    {id:'b',name:'课程乙',topics:[{name:'单元乙',points:['知识乙']}]},
  ],relations:[{from:sourcePath,to:targetPath,label:'提供依据',reason:'前序观测用于校核'}]}
  panel.relations=panel.graph.relations
  panel.atlas={
    domains:[{name:'现场测量',color:'#559dba'},{name:'模型定位',color:'#839b71'},{name:'施工管理',color:'#9b82b4'}],
    paths:new Map([[sourcePath.join('/'),1],['0/0/0/',1],[targetPath.join('/'),2]]),
    memberships:new Map([[sourcePath.join('/'),[1,0]]]),
  }
  const detail={}, stage={classList:{toggle(){}}}, input={value:'修订后的知识甲'}
  panel.$=selector=>({'.kdg-detail':detail,'.kdg-stage':stage,'.kdg-name':input})[selector]
  let focused,reset=0
  panel.scene={focus(...p){focused=p},reset(){reset++;panel.clearSelection()}}
  panel.selectNode(0,0,0)
  assert.doesNotMatch(detail.innerHTML,/课程甲|单元甲|1 个知识点/)
  assert.match(detail.innerHTML,/data-act="point" data-index="0"><span>知识甲<\/span>/)
  assert.match(detail.innerHTML,/data-act="atlas-domain" data-index="1"><span>模型定位<\/span>/)
  panel.selectNode(...sourcePath)
  assert.deepEqual(focused,sourcePath)
  assert.doesNotMatch(detail.innerHTML,/课程甲|单元甲|主题甲/)
  assert.match(detail.innerHTML,/课程乙 › 单元乙/)
  assert.match(detail.innerHTML,/提供依据 · 关联至/)
  assert.match(detail.innerHTML,/前序观测用于校核/)
  assert.match(detail.innerHTML,/--land:#839b71.*data-act="atlas-domain" data-index="1"><span>模型定位<\/span>/)
  assert.match(detail.innerHTML,/--land:#559dba.*data-act="atlas-domain" data-index="0"><span>现场测量<\/span>/)
  assert.doesNotMatch(detail.innerHTML,/施工管理/)
  panel.saveName()
  assert.equal(panel.graph.courses[0].topics[0].sections[0].points[0],'修订后的知识甲')
  assert.match(detail.innerHTML, /<h3>修订后的知识甲<\/h3>/)
  delete panel.atlas.memberships
  panel.contains=()=>true
  panel.onClick({target:{closest:()=>({dataset:{act:'relation',index:'0'}})}})
  assert.deepEqual(focused,targetPath)
  assert.match(detail.innerHTML,/修订后的知识甲/)
  assert.match(detail.innerHTML,/提供依据 · 关联自/)
  assert.match(detail.innerHTML,/--land:#9b82b4.*data-act="atlas-domain" data-index="2"><span>施工管理<\/span>/)
  assert.doesNotMatch(detail.innerHTML,/现场测量|模型定位/)
  panel.onKeyDown({key:'Escape',preventDefault(){}})
  assert.equal(reset,1)
  assert.equal(panel.selected,null)
  assert.equal(detail.hidden,true)
})

test('确认删除知识节点时移除其分支，保留同级节点的关联和知识点资料', () => {
  const fromRemoved = { from: [0, 0, 0, 0], to: [1, 0, null, 0], label: '移除', reason: '删除节点的关联' }
  const toSibling = { from: [1, 0, null, 0], to: [0, 0, 0, 1], label: '同一主题', reason: '后续知识点' }
  const fromOtherSection = { from: [0, 0, 1, 0], to: [1, 0, null, 0], label: '其他主题', reason: '后续主题' }
  const toOtherUnit = { from: [1, 0, null, 0], to: [0, 1, null, 0], label: '其他单元', reason: '后续知识单元' }
  const cases = [
    { path: [0, 0, 0, 0], kind: '知识点', name: '删除点',
      relations: [{ ...toSibling, to: [0, 0, 0, 0] }, fromOtherSection, toOtherUnit] },
    { path: [0, 0, 0], kind: '主题', name: '主题甲',
      relations: [{ ...fromOtherSection, from: [0, 0, 0, 0] }, toOtherUnit] },
    { path: [0, 0], kind: '知识单元', name: '单元甲',
      relations: [{ ...toOtherUnit, to: [0, 0, null, 0] }] },
  ]

  for (const { path, kind, name, relations } of cases) {
    const { panel, records } = fixture()
    const peer = { name: '单元乙', points: ['保留点'] }
    const otherSection = { name: '主题乙', points: ['后续主题点'] }
    const source = { source: '课程资料', evidence: '对应第二个知识点' }
    panel.graph = { major: '甲专业', courses: [
      { name: '课程甲', topics: [{ name: '单元甲', sections: [
        { name: '主题甲', points: ['删除点', '同级点'], pointSources: [{ source: '旧资料' }, source],
          pointDomains: { 0: ['领域一'], 1: ['领域二'] }, editedPoints: [0, 1],
          manualPointDomains: { 0: ['领域一'], 1: [] },
          pointNotes: { 0: { description: '删除说明' }, 1: { description: '保留说明' } } }, otherSection,
      ] }, peer] },
      { name: '课程乙', topics: [{ name: '单元丙', points: ['关联点'] }] },
    ], relations: [fromRemoved, toSibling, fromOtherSection, toOtherUnit] }
    const detail = {}, stage = { classList: { toggle() {} } }
    panel.$ = selector => ({ '.kdg-detail': detail, '.kdg-stage': stage })[selector]
    panel.contains = () => true
    let confirmation
    panel.addDialog = (title, body, footer) => { confirmation = { title, body, footer } }
    const click = act => panel.onClick({ target: { closest: () => ({ dataset: { act } }) } })
    panel.save()
    panel.selectNode(...path)
    const heading = detail.innerHTML.split('<div class="kdg-detail-body">')[0]
    assert.match(heading, kind === '知识点' ? /data-act="edit-node"[^>]*aria-label="编辑知识点"/
      : /data-act="edit"[^>]*aria-label="修改名称"/)
    assert.match(heading, /data-act="delete-node"[^>]*aria-label="删除节点"/)
    click('delete-node')
    assert.equal(confirmation.title, '删除' + kind)
    assert.ok(confirmation.body.includes(name))
    if (kind === '知识单元') assert.match(confirmation.body, /2 个主题、3 个知识点/)
    assert.match(confirmation.body, /删除后不可恢复/)
    assert.match(confirmation.footer, /data-act="cancel" autofocus/)
    assert.equal(JSON.parse(records.get(panel.storageKey)).graph.relations.length, 4)
    click('cancel')
    click('confirm-delete-node')
    assert.equal(JSON.parse(records.get(panel.storageKey)).graph.relations.length, 4)
    click('delete-node')
    click('confirm-delete-node')
    panel.loadContext()
    const saved = JSON.parse(records.get(panel.storageKey)).graph
    assert.deepEqual(saved.relations, relations)
    assert.deepEqual(saved.courses, JSON.parse(JSON.stringify(panel.graph.courses)))
    const { topics } = saved.courses[0]
    if (kind === '知识点') {
      assert.deepEqual(topics[0].sections[0], {
        name: '主题甲', points: ['同级点'], pointSources: [source], pointDomains: { 0: ['领域二'] }, editedPoints: [0],
        manualPointDomains: { 0: [] }, pointNotes: { 0: { description: '保留说明' } },
      })
    } else if (kind === '主题') {
      assert.deepEqual(topics[0].sections, [otherSection])
    } else {
      assert.deepEqual(topics, [peer])
    }
  }
})

test('课程根节点和历史版本没有删除入口，无法保存时保留原有知识点', () => {
  const { panel, env, records } = fixture()
  panel.graph = makeGraph('甲专业')
  const detail = {}, stage = { classList: { toggle() {} } }, status = {}
  panel.$ = selector => ({ '.kdg-detail': detail, '.kdg-stage': stage, '.kdg-delete-status': status })[selector]
  panel.save()
  const previousRecord = records.get(panel.storageKey)
  panel.selectNode(0)
  assert.doesNotMatch(detail.innerHTML, /data-act="(?:edit|delete-node)"/)
  panel.historyShown = true
  panel.selectNode(0, 0, null, 0)
  assert.doesNotMatch(detail.innerHTML, /data-act="(?:edit|delete-node)"/)
  panel.historyShown = false
  panel.addDialog = () => {}
  panel.deleteNodeDialog()
  const originalSetItem = env.localStorage.setItem
  env.localStorage.setItem = () => { throw new Error('保存失败') }
  panel.confirmDeleteNode()
  assert.match(status.textContent, /无法保存/)
  assert.deepEqual(panel.graph.courses[0].topics[0].points, ['知识点甲'])
  assert.equal(records.get(panel.storageKey), previousRecord)
  env.localStorage.setItem = originalSetItem
  const changedRecord = JSON.stringify({ graph: { ...panel.graph, requirements: '另一个页面的修改' }, fileNames: [] })
  records.set(panel.storageKey, changedRecord)
  panel.confirmDeleteNode()
  assert.match(status.textContent, /图谱已更新/)
  assert.deepEqual(panel.graph.courses[0].topics[0].points, ['知识点甲'])
  assert.equal(records.get(panel.storageKey), changedRecord)
})

test('修订培养目标的确认删除在刷新后同步详情、搜索和领域匹配', () => {
  const { panel, env } = fixture()
  vm.runInContext(readFileSync(new URL('../src/knowledge-domain/atlas.js', import.meta.url), 'utf8'), env)
  panel.context = { ...panel.context, plan: { name: '培养方案', text: '目标1：掌握课程甲。' } }
  panel.graph = makeGraph('甲专业')
  const detail = {}, stage = { classList: { toggle() {} } }
  const status = {}
  const elements = { '.kdg-atlas-status':status, '.kdg-detail':detail, '.kdg-stage':stage }
  panel.$ = selector => elements[selector]
  panel.addDialog = () => ({querySelector: panel.$})
  panel.contains = () => true
  panel.renderWorkspace = () => {
    panel.atlasSelection = null
    panel.atlas = env.KnowledgeDomainAtlas.build(panel.graph.major, panel.graph.courses, panel.context.plan, [], panel.graph.atlasChanges)
  }
  const click = act => panel.onClick({ target: { closest: () => ({ dataset: { act } }) } })
  panel.save()
  panel.loadContext()
  panel.selectAtlasResult({kind:'goal', index:0})
  assert.match(detail.innerHTML, /编辑培养目标/)
  assert.match(detail.innerHTML, /删除培养目标/)
  const { key } = panel.atlas.goals[0]
  let editorTarget
  panel.openNodeEditor = (kind, entry) => { editorTarget = { kind, entry } }
  click('edit-atlas')
  assert.equal(editorTarget.kind, 'goal')
  assert.equal(editorTarget.entry.text, '掌握课程甲。')
  panel.graph.atlasChanges = { goals: { [key]: { name: '修订后的目标', text: '掌握安全规范。' } } }
  panel.save()
  panel.loadContext()
  assert.deepEqual([...panel.buildSearchIndex()].filter(item=>item.kind==='goal').map(item=>item.name), ['修订后的目标'])
  panel.selectAtlasResult({kind:'goal', index:0})
  assert.match(detail.innerHTML, /修订后的目标/)
  assert.match(detail.innerHTML, /暂无关联知识领域/)
  click('delete-atlas')
  click('cancel')
  click('commit-atlas')
  assert.equal(panel.atlas.goals.length, 1)
  click('delete-atlas')
  click('commit-atlas')
  panel.loadContext()
  assert.equal(panel.atlas.goals.length, 0)
  assert.equal(panel.context.plan.text, '目标1：掌握课程甲。')
  assert.equal(panel.graph.courses[0].topics[0].points[0], '知识点甲')
})

test('领域图层开关只切换显示，保留选点并按工作区记住选择', () => {
  const {panel,records}=fixture()
  panel.loadContext()
  assert.equal(panel.domainsVisible,true)
  const flags=[]
  panel.selected={course:0,topic:0,section:null,point:0}
  panel.scene={setDomainsVisible(value){flags.push(value)},destroy(){}}
  panel.contains=()=>true
  const target={dataset:{act:'toggle-domains'},setAttribute(key,v){this[key]=v}}
  panel.$=selector=>selector==='[data-act="toggle-domains"]' ? target : null
  panel.onClick({target:{closest:()=>target}})
  assert.deepEqual(flags,[false])
  assert.equal(target['aria-checked'],'false')
  assert.equal(panel.selected.point,0)
  assert.equal(records.get(panel.legacyKey+':show-domains'),'0')
  panel.loadContext()
  assert.equal(panel.domainsVisible,false)
  panel.context={...panel.context,scope:'另一学校'}
  assert.equal(panel.domainsVisible,true)
})

test('知识领域图谱在跨课程按钮旁提供跨领域筛选', async () => {
  const { panel, env } = fixture()
  panel.graph = makeGraph('甲专业')
  panel.graph.courses[0].topics[0].sections = [{ name: '主题甲', points: ['知识点乙'] }]
  env.KnowledgeDomainAtlas = { build: () => ({
    goals: [{ label: '建议目标1', title: '智能建造技术服务' }],
    domains: [{ name: '数字建模与深化设计' }]
  }) }
  let sceneOptions
  env.KnowledgeDomainScene = { mount(_, options) { sceneOptions = options; return { destroy() {} } } }
  Object.getPrototypeOf(panel).renderWorkspace.call(panel)

  const [header] = panel.innerHTML.match(/<header[\s\S]*?<\/header>/)
  assert.doesNotMatch(header, /<select|kdg-goal-summary|智能建造技术服务/)
  assert.match(header, /1 个知识领域<span>·<\/span>1 门课程<span>·<\/span>2 个知识点/)
  assert.doesNotMatch(header, /role="switch"/)
  assert.match(header, /重新生成/)
  const [controls] = panel.innerHTML.match(/<div class="kdg-viewport-controls"[\s\S]*?<\/div>/)
  const buttons = [...controls.matchAll(/<button([^>]+)>(.*?)<\/button>/g)]
  assert.deepEqual(buttons.map(([, attributes]) => attributes.match(/data-act="([^"]+)"/)[1]), [
    'toggle-domains', 'toggle-cross-course', 'toggle-cross-domain', 'toggle-theme', 'reset',
  ])
  const labels = ['知识领域', '跨课程知识点', '跨领域知识点', '深色模式', '返回全图']
  buttons.forEach(([, attributes, content], index) => {
    assert.match(attributes, /class="kdg-view-button"/)
    assert.match(content, /^<svg\b[^>]*>.*<\/svg><span>[^<]+<\/span>$/)
    assert.ok(content.endsWith(`<span>${labels[index]}</span>`))
  })
  assert.equal(buttons.filter(([, attributes]) => attributes.includes('role="switch"')).length, 4)
  assert.match(buttons[1][1], /aria-label="仅显示跨课程知识点"/)
  assert.match(buttons[2][1], /aria-label="仅显示跨领域知识点"/)
  assert.equal(sceneOptions.atlas.goals[0].title, '智能建造技术服务')
})

test('跨领域筛选统计不同层级中的跨领域知识点，并与跨课程筛选互斥', () => {
  const { panel } = fixture()
  panel.graph = makeGraph('甲专业')
  const unit = panel.graph.courses[0].topics[0]
  unit.points.push('共享甲')
  unit.pointDomains = [[], ['甲领域', '乙领域']]
  unit.sections = [{ name: '主题', points: ['共享乙', '单领域'], pointDomains: [['甲领域', '乙领域'], ['甲领域']] }]
  const buttons = Object.fromEntries(['toggle-cross-course', 'toggle-cross-domain'].map(action => [
    action, { dataset: { act: action }, setAttribute(key, value) { this[key] = value } },
  ]))
  const counts = {}
  const empty = {}
  const nodes = {
    '.kdg-graph-counts': counts, '.kdg-cross-empty': empty,
    '.kdg-detail': {}, '.kdg-stage': { classList: { toggle() {} } },
  }
  panel.contains = () => true
  panel.$ = selector => nodes[selector] || buttons[selector.match(/data-act="([^"]+)"/)?.[1]]
  Object.getPrototypeOf(panel).renderWorkspace.call(panel)
  const click = action => panel.onClick({ target: { closest: selector => selector === 'button[data-act]' ? buttons[action] : null } })

  click('toggle-cross-domain')
  assert.equal(counts.innerHTML, '2 个跨领域知识点')
  assert.equal(empty.hidden, true)
  for (const path of [[0, null, null, null], [0, 0, 0, null], [0, 0, null, 1], [0, 0, 0, 0]]) assert.equal(panel.matchesView(path), true)
  for (const path of [[0, 0, null, 0], [0, 0, 0, 1]]) assert.equal(panel.matchesView(path), false)

  click('toggle-cross-course')
  assert.equal(buttons['toggle-cross-domain']['aria-checked'], 'false')
  assert.equal(buttons['toggle-cross-course']['aria-checked'], 'true')
  assert.equal(empty.hidden, false)
  assert.equal(empty.textContent, '暂无跨课程知识点')
  click('toggle-cross-course')
  assert.equal(panel.matchesView([0, 0, 0, 1]), true)
})

test('图谱创建页始终显示为浅色，并且不提供主题开关', () => {
  const { panel } = fixture()
  const render = Object.getPrototypeOf(panel).renderWorkspace.bind(panel)
  panel.systemTheme = { matches: true }
  panel.applyTheme()
  render()
  assert.equal(panel.dataset.theme, 'light')
  assert.doesNotMatch(panel.innerHTML, /data-act="toggle-theme"/)

  panel.preferredTheme = 'dark'
  panel.graph = makeGraph('甲专业')
  render()
  assert.equal(panel.dataset.theme, 'dark')
  assert.match(panel.innerHTML, /data-act="toggle-theme"/)

  panel.graph = null
  render()
  assert.equal(panel.dataset.theme, 'light')
  assert.doesNotMatch(panel.innerHTML, /data-act="toggle-theme"/)
  assert.equal(panel.preferredTheme, 'dark')
})

test('已生成图谱跟随系统主题，手动切换保持选点并在重新打开时恢复', () => {
  const {panel,env,records}=fixture()
  let notify
  const system={matches:false,addEventListener(type,fn){notify=fn},removeEventListener(){notify=null}}
  env.matchMedia=()=>system
  env.addEventListener=env.removeEventListener=()=>{}
  panel.addEventListener=panel.removeEventListener=()=>{}
  panel.renderWorkspace=Object.getPrototypeOf(panel).renderWorkspace.bind(panel)
  panel.contains=()=>true
  const button={dataset:{act:'toggle-theme'},setAttribute(k,v){this[k]=v}}
  panel.$=s=>s==='[data-act="toggle-theme"]' ? button : null
  records.set(panel.storageKey, JSON.stringify({graph: makeGraph('甲专业')}))
  panel.connectedCallback()
  assert.equal(panel.dataset.theme,'light')
  system.matches=true
  notify()
  assert.equal(panel.dataset.theme,'dark')
  panel.selected={course:0,topic:0,section:null,point:0}
  const seen=[]
  panel.scene={setDarkMode(value){seen.push(value)},destroy(){}}
  panel.onClick({target:{closest:()=>button}})
  assert.equal(button['aria-checked'],'false')
  assert.deepEqual(seen,[false])
  assert.equal(panel.selected.point,0)
  panel.disconnectedCallback()
  assert.equal(notify,null)
  panel.connectedCallback()
  assert.equal(panel.dataset.theme,'light')
  assert.equal(records.get('knowledge-domain:theme'),'light')
  env.localStorage.setItem=()=>{throw new Error('存储受限')}
  panel.onClick({target:{closest:()=>button}})
  assert.equal(panel.dataset.theme,'dark')
})

test('手工领域与培养目标按标识关联，解除知识点归属后仍保留其图谱坐标', () => {
  const { panel, env } = fixture()
  vm.runInContext(readFileSync(new URL('../src/knowledge-domain/atlas.js', import.meta.url), 'utf8'), env)
  const graph = makeGraph(panel.context.major)
  const unit = graph.courses[0].topics[0]
  unit.points.push('补充知识点')
  unit.manualPointDomains = { 0: [], 1: ['manual-domain:0'] }
  const changes = {
    domains: { 'manual-domain:0': { added: true, name: '专业实践', description: '实践技能及质量要求' } },
    goals: { 'manual-goal:0': { added: true, name: '完成实训', text: '独立完成技能训练。', domains: ['manual-domain:0'] } }
  }
  const atlas = env.KnowledgeDomainAtlas.build(graph.major, graph.courses, null, [], changes)
  const index = atlas.domains.findIndex(domain => domain.key === 'manual-domain:0')
  assert.ok(index >= 0)
  assert.equal(atlas.domains[index].name, '专业实践')
  assert.equal(atlas.domains[index].pointCounts.get(0), 1)
  assert.equal(atlas.domains[0].pointCounts.get(0), undefined)
  assert.ok(atlas.unassigned.has('0/0//0'))
  assert.equal(atlas.domains[0].members.some(member => member.key === '0/0//0'), false)
  assert.equal(atlas.goals[0].domains[0].index, index)
  assert.equal(atlas.domains[index].goals[0].manual, true)
  changes.domains['manual-domain:0'].name = '实践教学'
  assert.equal(env.KnowledgeDomainAtlas.build(graph.major, graph.courses, null, [], changes).goals[0].domains[0].index, index)
})

test('an explicitly linked course appears in its domain without assigning any of its knowledge points', () => {
  const { env } = fixture()
  vm.runInContext(readFileSync(new URL('../src/knowledge-domain/atlas.js', import.meta.url), 'utf8'), env)
  const graph = makeGraph('甲专业')
  const courses = [
    { id: 'b', name: '课程乙', topics: [{ name: '单元乙', points: ['知识点乙'], manualPointDomains: { 0: ['manual-domain:0'] } }] },
    ...graph.courses
  ]
  const changes = {
    domains: { 'manual-domain:0': { added: true, name: '专业实践', courseIds: ['a', 'b', 'removed-course'] } }
  }
  const atlas = env.KnowledgeDomainAtlas.build(graph.major, courses, null, [], changes)
  const domain = atlas.domains.find(domain => domain.name === '专业实践')

  assert.deepEqual([...domain.courses], [0, 1])
  assert.equal(domain.pointCounts.get(0), 1)
  assert.equal(domain.pointCounts.has(1), false)
  assert.equal(domain.members.some(member => member.path[0] === 1), false)
})
