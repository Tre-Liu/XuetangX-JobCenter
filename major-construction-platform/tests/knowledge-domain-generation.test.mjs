import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import { createResearchSummaryWorker } from '../src/server/research-summary-worker.js'

const input = {
  major: '食品检验检测技术',
  courses: [{ id: 'C1', name: '食品化学' }, { id: 'C2', name: '食品微生物检验' }, { id: 'C3', name: '未知课程' }],
  attachments: [{ name: '课程建设建议稿.txt', text: '课程：食品化学\n蛋白质：等电点、蛋白质变性\n水分测定：恒重法、水分活度\n《食品微生物检验》\n无菌操作：培养基灭菌、接种环使用\n课程：外专业课程\n不适用单元：不适用的知识点' }],
  requirements: '优先展示水分测定',
}

async function model(protocol = 'file:', fetch = () => { throw new Error('unexpected network') }, globals={}) {
  const context = vm.createContext({ location: { protocol }, fetch, URL, AbortController, DOMException, setTimeout, clearTimeout, ...globals })
  const script = await fs.readFile(new URL('../src/knowledge-domain/model.js', import.meta.url), 'utf8')
  vm.runInContext(script, context)
  return context.KnowledgeDomainModel
}
const request = (body, signal) => new Request('https://example.test/api/knowledge-domain', {method:'POST',body:JSON.stringify(body),signal})
const asJson = value => JSON.parse(JSON.stringify(value))

test('课程知识底稿保留明确为空的知识领域归属', async () => {
  const client = await model()
  const graph = client.fromCurriculum({
    major: '工程管理',
    curriculumRevision: 'test-curriculum',
    courses: [{
      id: 'C1', name: '课程甲', topics: [{
        name: '单元甲', sections: [{
          name: '主题甲', points: ['未归属知识点', '未标注知识点'], pointDomains: { 0: [] },
        }],
      }],
    }],
  })
  assert.deepEqual(asJson(graph.courses[0].topics[0].sections[0].pointDomains ?? null), { 0: [] })
})

test('offline maps document knowledge to its own course, respects focus and keeps every supplied course', async () => {
  const graph = await (await model()).generate(input)
  assert.equal(graph.mode, 'local')
  assert.deepEqual(asJson(graph.courses.map(c => c.id)), ['C1','C2','C3'])
  assert.equal(graph.courses[0].topics[0].name, '水分测定')
  assert.deepEqual(asJson(graph.courses[0].topics[0].points), ['恒重法','水分活度'])
  assert.match(graph.courses[0].topics[0].source, /课程建设建议稿/)
  assert.deepEqual(asJson(graph.courses[1].topics[0].points), ['培养基灭菌','接种环使用'])
  assert.equal(graph.courses[2].topics.length, 0)
  assert.match(graph.courses[2].source, /待补充/)
  assert.doesNotMatch(JSON.stringify(graph.courses), /不适用/)
})

test('offline identifies course headings from attachments when no course list was supplied', async () => {
  const graph = await (await model()).generate({...input, courses:[]})
  assert.deepEqual(asJson(graph.courses.map(x => x.name)), ['食品化学','食品微生物检验','外专业课程'])
  assert.equal(graph.courses[1].topics[0].name, '无菌操作')
})
test('a name-only major returns professional course suggestions for a known discipline and actionable guidance for an unknown one offline', async () => {
  const client = await model()
  const graph = await client.generate({major:'软件技术',courses:[],attachments:[],requirements:''})
  assert.ok(graph.courses.some(c => /数据库/.test(c.name) && c.topics.some(t => t.points.includes('事务隔离级别'))))
  assert.match(graph.courses[0].source,/建议/)
  await assert.rejects(client.generate({major:'未知专业名称',courses:[],attachments:[],requirements:''}), /课程.*材料|模型服务/)
})
test('cancellation rejects even when local material is available', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects((await model()).generate(input,{signal:controller.signal}), { name:'AbortError' })
})

function remoteResult(batch) {
  return {courses: batch.courses.map(c => ({
    ...c, topics: [{name:'水分测定',points:['恒重法','水分活度'],sourceFile:c.id==='C1'?'课程建设建议稿.txt':'',evidence:c.id==='C1'?'水分测定：恒重法、水分活度':''}],
  }))}
}
function upstream(makeResult, requests = []) {
  return async (url, init) => {
    const body = JSON.parse(init.body)
    requests.push({url,init,body})
    const data = JSON.parse(body.input)
    const result = makeResult(data)
    return Response.json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]})
  }
}
const env = { OPENAI_API_KEY:'unit-key', AI_SUMMARY_MODEL:'unit-model', AI_SUMMARY_API_URL:'https://provider.example/v1/responses' }
test('AI route verifies evidence, transmits requirements, uses server credentials and preserves actual identifiers', async () => {
  const requests = []
  const worker = createResearchSummaryWorker({fetchImpl:upstream(remoteResult, requests)})
  const single = {...input,courses:[input.courses[0]]}
  const res = await worker.fetch(request(single), env)
  assert.equal(res.status, 200)
  const graph = await res.json()
  assert.equal(graph.mode, 'ai')
  assert.match(graph.courses[0].topics[0].source,/课程建设建议稿/)
  assert.equal(graph.courses[0].topics[0].evidence,'水分测定：恒重法、水分活度')
  assert.deepEqual(requests[0].body.input && JSON.parse(requests[0].body.input),single)
  assert.equal(requests[0].body.text.format.strict,true)
  assert.equal(requests[0].body.store,false)
  assert.equal(requests[0].init.headers.authorization,'Bearer unit-key')
  assert.equal(requests[0].url,env.AI_SUMMARY_API_URL)
  assert.equal(requests[0].body.model,env.AI_SUMMARY_MODEL)
})
test('rejects incomplete membership, duplicate identifiers, invented evidence and mismatched course names', async () => {
  for(const change of [
    g=>g.courses.pop(), g=>{g.courses[1].id=g.courses[0].id},
    g=>{g.courses[0].topics[0].evidence='原文没有这句话'},
    g=>{g.courses[0].name='替换课程名'},
    g=>{g.courses[1].topics[0]=g.courses[0].topics[0]},
  ]){
    const worker = createResearchSummaryWorker({fetchImpl:upstream(batch=>{const g=remoteResult(batch);change(g);return g})})
    assert.equal((await worker.fetch(request(input), env)).status,502)
  }
})
test('unknown credentials and invalid inputs never reach the provider', async () => {
  const worker = createResearchSummaryWorker({fetchImpl:()=>{throw new Error('unexpected')}})
  assert.equal((await worker.fetch(request(input),{})).status,503)
  assert.equal((await worker.fetch(request({...input,courses:[input.courses[0],input.courses[0]]}),env)).status,400)
})
test('client batches large course catalogs and rejoins them in supplied order through actual worker routing', async () => {
  const calls=[]
  const courses=Array.from({length:21},(_,i)=>({id:'code'+i,name:'专业课'+i}))
  const worker=createResearchSummaryWorker({fetchImpl:upstream(remoteResult,calls)})
  const client=await model('https:',(_,init)=>worker.fetch(request(JSON.parse(init.body),init.signal),env))
  const progress=[]
  const graph=await client.generate({...input,courses},{onProgress:p=>progress.push(p)})
  assert.equal(graph.mode,'ai')
  assert.deepEqual(asJson(graph.courses.map(c=>c.id)),courses.map(c=>c.id))
  assert.ok(calls.length>1)
  assert.equal(progress.at(-1).completed,21)
})
test('a disabled service falls back with an explicit explanation and carries source records', async () => {
  const client=await model('https:',()=>Promise.resolve(Response.json({error:'model-disabled'},{status:503})))
  const graph=await client.generate(input)
  assert.equal(graph.mode,'local')
  assert.match(graph.notice,/模型/)
  assert.ok(graph.sources.some(s=>s.name==='课程建设建议稿.txt'))
})

test('an archived unit with unnamed subpoints remains a unit and does not become a fabricated child', async () => {
  const client = await model()
  const graph = await client.generate({
    ...input, courses:[{id:'p',name:'概率论'}],
    attachments:[{name:'课程图谱',text:'课程：概率论\n主题：随机变量的数字特征\n概率论基础：随机事件、样本空间'}],
  })
  const openUnit = graph.courses[0].topics.find(t=>t.name==='随机变量的数字特征')
  assert.deepEqual(asJson(openUnit?.points),[])
})
test('course syllabus filenames identify unlabelled standalone teaching outlines; administrative metadata stays out', async () => {
  const client = await model()
  const graph = await client.generate({
    ...input, courses:[],
    attachments:[{name:'食品化学课程标准.docx',text:'学时：32\n## 水分测定\n恒重法、蒸馏法'}],
  })
  assert.deepEqual(asJson(graph.courses.map(c=>c.name)),['食品化学'])
  assert.deepEqual(asJson(graph.courses[0].topics.map(t=>t.name)),['水分测定'])
  assert.deepEqual(asJson(graph.courses[0].topics[0].points),['恒重法','蒸馏法'])
})
test('local processing yields to a cancellation command while compiling large course lists', async () => {
  const controller = new AbortController()
  const client = await model()
  const courses=Array.from({length:30},(_,i)=>({id:'c'+i,name:'课'+i}))
  let scheduled=false
  const generation = client.generate({...input,courses},{signal:controller.signal,onProgress(){
    if(!scheduled) {scheduled=true;setTimeout(()=>controller.abort(),0)}
  }})
  await assert.rejects(generation,{name:'AbortError'})
})
test('server aborts an in-flight model request when the incoming request disconnects', async () => {
  const controller = new AbortController()
  let started
  const ready = new Promise(resolve=>{started=resolve})
  let outbound
  const worker=createResearchSummaryWorker({fetchImpl:(_,init)=>{
    outbound = init.signal
    started()
    return new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}))
  }})
  const result=worker.fetch(request(input,controller.signal),env)
  await ready
  controller.abort()
  assert.equal((await result).status,499)
  assert.equal(outbound.aborted,true)
})
test('AI may propose courses from a previously unseen major and includes model provenance', async () => {
  const worker=createResearchSummaryWorker({fetchImpl:upstream(()=>({courses:[{id:'a1',name:'陶瓷成型',topics:[{name:'泥料制备',points:['泥料含水率','陈腐处理'],sourceFile:'',evidence:''}]}]}))})
  const client=await model('https:',(_,init)=>worker.fetch(request(JSON.parse(init.body),init.signal),env))
  const graph=await client.generate({major:'陶瓷艺术设计'})
  assert.equal(graph.mode,'ai')
  assert.match(graph.courses[0].source,/拟定课程/)
  assert.ok(graph.sources.some(s=>s.kind==='model'&&s.name.includes('unit-model')))
})
test('course names explicitly listed across a large attachment are batched even without a separate catalog', async () => {
  const calls=[]
  const worker=createResearchSummaryWorker({fetchImpl:upstream(remoteResult,calls)})
  const client=await model('https:',(_,init)=>worker.fetch(request(JSON.parse(init.body),init.signal),env))
  const names=Array.from({length:22},(_,i)=>'材料课程'+i)
  const text=names.map(name=>'课程：'+name+'\n知识单元：课程知识点').join('\n')
  const graph=await client.generate({...input,courses:[],attachments:[{name:'培养方案.txt',text}]})
  assert.equal(graph.mode,'ai')
  assert.ok(calls.length>1)
  assert.deepEqual(asJson(graph.courses.map(c=>c.name)),names)
  assert.match(graph.courses[0].source,/材料所列课程/)
})
test('a shared local unit collects points and source names from each matching document once', async () => {
  const client=await model()
  const attachments=[
    {name:'归档标准',text:'课程：食品化学\n水分测定：恒重法、蒸馏法'},
    {name:'备课说明',text:'课程：食品化学\n水分测定：蒸馏法、真空干燥法'},
  ]
  const graph=await client.generate({...input,courses:[input.courses[0]],attachments})
  assert.equal(graph.courses[0].topics.length,1)
  assert.deepEqual(asJson(graph.courses[0].topics[0].points),['恒重法','蒸馏法','真空干燥法'])
  assert.match(graph.courses[0].topics[0].source,/归档标准/)
  assert.match(graph.courses[0].topics[0].source,/备课说明/)
})
test('计算机技术 can build a subject-specific offline graph with only its name', async () => {
  const client=await model()
  const graph=await client.generate({major:'计算机技术'})
  assert.equal(graph.mode,'local')
  assert.ok(graph.courses.some(c=>c.name==='操作系统' && c.topics.some(t=>t.points.includes('页表映射'))))
  assert.ok(graph.courses.some(c=>c.name==='计算机网络' && c.topics.some(t=>t.points.includes('子网划分'))))
  assert.ok(graph.courses.every(c=>/建议/.test(c.source)))
})
test('batch requests include only matching built-in course sections and keep unpartitioned user files complete', async () => {
  const calls=[]
  const names=Array.from({length:14},(_,i)=>'课程名称'+String(i).padStart(2,'0'))
  const courses=names.map((name,i)=>({id:'C'+(i+10),name}))
  const outline={name:'教学知识纲要（待审核）',text:names.map((name,i)=>'课程：'+name+'\n主题：对应课程要点'+i).join('\n')}
  const userMaterial={name:'全专业建设要求.txt',text:'全专业通用资料\n数据资源应记录来源与版本。\n注重项目协作。'}
  const worker=createResearchSummaryWorker({fetchImpl:upstream(remoteResult,calls)})
  const client=await model('https:',(_,init)=>worker.fetch(request(JSON.parse(init.body),init.signal),env),{KnowledgeDomainOutlines:[outline]})
  const graph=await client.generate({...input,courses,attachments:[outline,userMaterial]})
  assert.equal(graph.courses.length,14)
  for(const call of calls) {
    const batch=JSON.parse(call.body.input)
    const material=batch.attachments.find(f=>f.name===outline.name)
    assert.deepEqual(batch.attachments.find(f=>f.name===userMaterial.name),userMaterial)
    assert.deepEqual(material.text.split('\n').filter(line=>line.startsWith('课程：')).map(line=>line.slice(3)),batch.courses.map(c=>c.name))
  }
})
test('local provenance reports unused files by reason and keeps unrelated courses outside the established catalog',async()=>{
  const client=await model()
  const attachments=[
    {name:'食品化学教学计划.txt',text:'课程：食品化学\n糖的结构：糖苷键、变旋现象'},
    {name:'跨专业课程清单.txt',text:'课程：书法鉴赏\n字体：篆书、隶书'},
    {name:'教务简表.txt',text:'课程：食品化学\n学分：3'},
    {name:'采购说明.txt',text:'车辆数量：十辆'},
  ]
  const graph=await client.generate({...input,courses:[input.courses[0]],attachments})
  assert.deepEqual(asJson(graph.courses.map(c=>c.name)),['食品化学'])
  assert.deepEqual(asJson(graph.courses[0].topics.map(t=>t.name)),['糖的结构'])
  assert.deepEqual(asJson(graph.sources.filter(s=>s.kind==='material').map(s=>s.name)),['食品化学教学计划.txt'])
  assert.deepEqual(asJson(graph.unusedMaterials.map(s=>s.name)),['跨专业课程清单.txt','教务简表.txt','采购说明.txt'])
  assert.match(graph.unusedMaterials[0].reason,/未匹配/)
  assert.match(graph.unusedMaterials[1].reason,/未提取/)
  assert.match(graph.unusedMaterials[2].reason,/未匹配/)
  assert.match(graph.notice,/跨专业课程清单.txt/)
  assert.match(graph.notice,/教务简表.txt/)
})

function curriculumFixture() {
  const courses=Array.from({length:10},(_,ci)=>({
    id:'major-course-'+ci,name:'专业课程'+ci,isCore:ci<5,source:'专业课程建设底稿（待审核）',
    topics:Array.from({length:4},(_,ui)=>({name:'单元'+ui,sections:Array.from({length:5},(_,si)=>({
      name:'主题'+ui+'-'+si,points:Array.from({length:5},(_,pi)=>'知识点'+ci+'-'+ui+'-'+si+'-'+pi),
    }))})),
  }))
  return {major:'智能建造工程',courses,curriculumRevision:'ten-course-v2',requirements:'',
    attachments:[{name:'现场施工.docx',text:'课程：专业课程0\n主题0-0：附加施工检查点\n课程：广告设计\n广告海报：色彩'}],
    relationSeeds:[
      {from:['major-course-0','知识点0-0-0-0'],to:['major-course-9','知识点9-3-4-4'],label:'支撑',reason:'前置知识用于后续施工检查'},
      {from:['major-course-0','已缺失的点'],to:['major-course-9','知识点9-3-4-4'],label:'不应展示',reason:'缺失'},
    ]}
}
const leafCount=course=>course.topics.reduce((n,unit)=>n+unit.sections.reduce((k,section)=>k+section.points.length,0),0)

test('structured curriculum uses all ten courses and 100 original leaves each, resolving only real endpoint paths',async()=>{
  const client=await model()
  const curriculum=curriculumFixture()
  const base=client.fromCurriculum(curriculum)
  assert.equal(base.curriculumRevision,curriculum.curriculumRevision)
  assert.deepEqual(asJson(base.courses.map(leafCount)),Array(10).fill(100))
  assert.deepEqual(asJson(base.relations),[{from:[0,0,0,0],to:[9,3,4,4],label:'支撑',reason:'前置知识用于后续施工检查'}])
  const graph=await client.generate(curriculum)
  assert.equal(graph.courses.length,10)
  assert.equal(leafCount(graph.courses[0]),101)
  assert.ok(graph.courses[0].topics[0].sections[0].points.includes('附加施工检查点'))
  assert.equal(graph.courses[9].topics[3].sections[4].points[4],'知识点9-3-4-4')
  assert.doesNotMatch(JSON.stringify(graph.courses),/广告设计/)
  assert.deepEqual(asJson(graph.relations),asJson(base.relations))
  assert.equal(curriculum.courses[0].topics[0].sections[0].points.length,5)
})
test('课程底稿、附件和模型增补保留末级知识点的明确领域，并隔离无效索引和外部修改',async()=>{
  const curriculum=curriculumFixture()
  const domains={2:[' 工程测量 ','数字建模','工程测量'],3:'资料错误',4:[' '],5:['越界领域'],'01':['非规范索引']}
  curriculum.courses[0].topics[0].sections[0].pointDomains=domains
  const jobs=[]
  const worker=createResearchSummaryWorker({fetchImpl:upstream(batch=>({courses:batch.courses.map(c=>({
    id:c.id,name:c.name,topics:c.id==='major-course-0'?[{name:'单元0',sections:[{name:'主题0-0',
      points:['知识点0-0-0-2','模型补充内容'],sourceFile:'',evidence:''}]}]:[],
  }))}),jobs)})
  const local=await model(), online=await model('https:',(_,init)=>worker.fetch(request(JSON.parse(init.body),init.signal),env))
  const base=local.fromCurriculum(curriculum), offline=await local.generate(curriculum), ai=await online.generate(curriculum)
  domains[2].push('用户后续改动')
  for(const graph of [base,offline,ai]){
    const section=graph.courses[0].topics[0].sections[0]
    assert.deepEqual(asJson(section.pointDomains ?? null),{2:['工程测量','数字建模']})
    assert.equal(section.points[2],'知识点0-0-0-2')
  }
  assert.equal(ai.mode,'ai')
  assert.deepEqual(asJson(ai.courses[0].topics[0].sections[0].points.slice(-2)),['附加施工检查点','模型补充内容'])
})
test('同名增补去重后仍将领域映射至对应的末级知识点，包括旧式直属知识点',async()=>{
  const client=await model()
  const simple={name:'识图',source:'原档',points:['基点','标高'],pointDomains:{0:['测量']}}
  const more={name:'识图',source:'资料',points:['标高','净高','层高','净高'],pointDomains:{3:['设计','测量']}}
  const direct=client.mergeArchivedCourse({topics:[simple]},[more])
  assert.deepEqual(asJson(direct.topics[0].pointDomains ?? null),{0:['测量'],2:['设计','测量']})
  const group={name:'建模',sections:[{name:'视图',points:['顶视图']}]}
  const nested=client.mergeArchivedCourse({topics:[simple,group]},[{name:'识图',sections:[{...more,name:'原有知识点'}]}])
  assert.deepEqual(asJson(nested.topics[0].sections[0].pointDomains ?? null),{0:['测量'],2:['设计','测量']})
})
test('迁移将领域赋给人工改名、已在附件出现及排除重名后前移的知识点',async()=>{
  const client=await model()
  const topics=['基准','构件','施工','交付'].map(name=>({name,sections:[{name:'要点',points:[name+'知识点',name+'校验']}]}))
  const oldInput={major:'智能建造工程',curriculumRevision:'construction-ten-v2',courses:[{id:'B261306',name:'BIM',topics}]}
  const old=client.fromCurriculum(oldInput)
  const original=old.courses[0].topics[0].sections[0]
  original.points[1]='同名新专题'
  original.editedPoints=[1]
  old.courses[0].topics.push({name:'现场文件',points:['图纸会审记录','现场批注'],pointDomains:{1:['资料整理']}})
  topics[0].sections[0].pointDomains={1:['建模','测量']}
  topics.push({name:'设计资料',sections:[{name:'会审核验',points:['图纸会审记录','节点复核','无领域补充项','同名新专题'],
    pointDomains:{0:['管理','施工'],1:['建模','施工'],3:['运维']}}]})
  const newInput={...oldInput,curriculumRevision:'construction-ten-v3'}
  const updated=client.upgradeCurriculum(old,newInput).courses[0].topics
  assert.deepEqual(asJson(updated[0].sections[0].pointDomains ?? null),{1:['建模','测量']})
  assert.deepEqual(asJson(updated[4].pointDomains),{0:['管理','施工'],1:['资料整理']})
  assert.deepEqual(asJson(updated[5].sections[0].pointDomains),{0:['建模','施工'],2:['运维']})
  assert.deepEqual(asJson(updated[5].sections[0].points),['节点复核','无领域补充项','同名新专题'])
  assert.equal(original.pointDomains,undefined)
  assert.deepEqual(asJson(client.upgradeCurriculum(old,newInput).courses[0].topics),asJson(updated))
})
test('sparse AI additions preserve every baseline leaf and recorded course relation, including document additions',async()=>{
  const jobs=[]
  const worker=createResearchSummaryWorker({fetchImpl:upstream(batch=>({courses:batch.courses.map(c=>({
    id:c.id,name:c.name,topics:c.id==='major-course-1'?[{name:'单元1',sections:[{name:'主题1-0',points:['模型补充点'],sourceFile:'',evidence:''}]}]:[],
  }))}),jobs)})
  const client=await model('https:',(_,init)=>worker.fetch(request(JSON.parse(init.body),init.signal),env))
  const graph=await client.generate(curriculumFixture())
  assert.equal(graph.mode,'ai')
  assert.equal(jobs.length,2)
  assert.equal(graph.courses.length,10)
  assert.deepEqual(asJson(graph.courses.map(leafCount)),[101,101,100,100,100,100,100,100,100,100])
  assert.ok(graph.courses[1].topics[1].sections[0].points.includes('模型补充点'))
  assert.equal(graph.relations.length,1)
  assert.match(graph.notice,/底稿/)
  assert.match(graph.notice,/1 个知识点/)
  assert.ok(jobs[0].body.text.format.schema.properties.courses.items.properties.topics.items.properties.sections)
})
test('empty AI additions do not label an existing curriculum as model-generated',async()=>{
  const worker=createResearchSummaryWorker({fetchImpl:upstream(batch=>({courses:batch.courses.map(c=>({id:c.id,name:c.name,topics:[]}))}))})
  const client=await model('https:',(_,init)=>worker.fetch(request(JSON.parse(init.body),init.signal),env))
  const graph=await client.generate(curriculumFixture())
  assert.equal(graph.mode,'local')
  assert.match(graph.notice,/模型未/)
  assert.equal(graph.courses[9].topics[3].sections[4].points.length,5)
})
test('a general attachment cited by a new AI leaf replaces its earlier local unmatched status',async()=>{
  const curriculum=curriculumFixture()
  curriculum.attachments=[{name:'项目复盘.txt',text:'现场测量应记录仪器校准时间。'}]
  const worker=createResearchSummaryWorker({fetchImpl:upstream(batch=>({courses:batch.courses.map(c=>({
    id:c.id,name:c.name,topics:c.id==='major-course-2'?[{name:'单元2',sections:[{
      name:'主题2-0',points:['测量仪器校准时间'],sourceFile:'项目复盘.txt',evidence:'现场测量应记录仪器校准时间。'
    }]}]:[],
  }))}))})
  const client=await model('https:',(_,init)=>worker.fetch(request(JSON.parse(init.body),init.signal),env))
  const graph=await client.generate(curriculum)
  assert.equal(graph.mode,'ai')
  assert.ok(graph.sources.some(s=>s.name==='项目复盘.txt'))
  assert.deepEqual(asJson(graph.unusedMaterials),[])
  assert.doesNotMatch(graph.notice,/项目复盘.txt.*未用于/)
  const section=graph.courses[2].topics[2].sections[0]
  assert.equal(section.pointSources[section.points.indexOf('测量仪器校准时间')].evidence,'现场测量应记录仪器校准时间。')
})
test('duplicate same-course leaf names make name-only relationship endpoints ambiguous',async()=>{
  const data=curriculumFixture()
  data.courses[0].topics[1].sections[0].points[0]='知识点0-0-0-0'
  assert.deepEqual(asJson((await model()).fromCurriculum(data).relations),[])
})
test('another major retains supplied legacy knowledge points when generating from an archived course',async()=>{
  const course={id:'legacy',name:'陶坯成型',source:'课程档案',topics:[{name:'坯料',points:['泥料颗粒级配'],source:'已有课程图谱'}]}
  const data={major:'陶瓷设计',courses:[course],attachments:[],requirements:''}
  const local=await (await model()).generate(data)
  assert.deepEqual(asJson(local.courses[0].topics),course.topics)
  const worker=createResearchSummaryWorker({fetchImpl:upstream(()=>({courses:[{
    id:'legacy',name:'陶坯成型',topics:[{name:'坯料',points:['泥料可塑性'],sourceFile:'',evidence:''}],
  }]}))})
  const client=await model('https:',(_,init)=>worker.fetch(request(JSON.parse(init.body),init.signal),env))
  const online=await client.generate(data)
  assert.deepEqual(asJson(online.courses[0].topics[0].points),['泥料颗粒级配','泥料可塑性'])
})

test('other programmes link exact distinctive leaf concepts across nested and direct courses and explain the shared term',async()=>{
  const data={major:'测绘工程',courses:[{id:'A',name:'工程测量'},{id:'B',name:'仪器测量'}],attachments:[
    {name:'两门课.txt',text:'课程：工程测量\n测量误差：误差传播定律、质量管理、数据分析、测量平差\n课程：仪器测量\n观测误差：误差传播定律、质量管理、数据分析、测量平差方法'},
  ]}
  const client=await model()
  const graph=await client.generate(data)
  assert.equal(graph.relations.length,1)
  const edge=graph.relations[0]
  assert.deepEqual(asJson(edge.from),[0,0,null,0])
  assert.deepEqual(asJson(edge.to),[1,0,null,0])
  assert.equal(edge.label,'共同知识点')
  assert.match(edge.reason,/误差传播定律/)
  assert.match(edge.reason,/工程测量/)
  assert.match(edge.reason,/仪器测量/)
  const mixed=await client.generate({...data,attachments:[],courses:[
    {id:'A',name:'工程测量',topics:[{name:'测量理论',sections:[{name:'误差理论',points:['误差传播定律']}]}]},
    {id:'B',name:'仪器测量',topics:[{name:'误差控制',points:['误差传播定律']}]},
  ]})
  assert.deepEqual(asJson(mixed.relations[0].from),[0,0,0,0])
  assert.deepEqual(asJson(mixed.relations[0].to),[1,0,null,0])
})
test('same-term associations omit ambiguous repeated placements and prioritise a supplied cross-course relationship',async()=>{
  const data={major:'测绘',courses:['测量','测绘','测控'].map((name,i)=>({id:'c'+i,name,topics:[
    {name:'理论',points:['误差传播定律','最小二乘估计']},...(i===2?[{name:'方法',points:['误差传播定律','最小二乘估计']}]:[]),
  ]})),relationSeeds:[{from:['c0','误差传播定律'],to:['c1','误差传播定律'],label:'复用',reason:'课程建设记录明确关联'}]}
  const graph=await (await model()).generate(data)
  assert.equal(graph.relations.length,1)
  assert.equal(graph.relations[0].label,'复用')
})
test('AI-generated courses share only representative edges for a concept listed throughout a programme',async()=>{
  const courses=Array.from({length:8},(_,i)=>({id:'shared-'+i,name:'测绘技术'+i}))
  const worker=createResearchSummaryWorker({fetchImpl:upstream(batch=>({courses:batch.courses.map(c=>({
    ...c,topics:[{name:'测量',points:['误差传播定律','质量控制'],sourceFile:'',evidence:''}],
  }))}))})
  const client=await model('https:',(_,init)=>worker.fetch(request(JSON.parse(init.body),init.signal),env))
  const graph=await client.generate({major:'测绘',courses})
  assert.equal(graph.mode,'ai')
  assert.ok(graph.relations.length>0 && graph.relations.length<=2)
  assert.ok(graph.relations.every(r=>r.label==='共同知识点'))
})
test('curated baseline relations remain unchanged until a new shared concept is added by a course material',async()=>{
  const data=curriculumFixture()
  data.courses[0].topics[0].sections[0].points.push('数字影像相关法','相机内参矩阵')
  data.courses[1].topics[0].sections[0].points.push('相机内参矩阵')
  const client=await model()
  assert.equal(client.fromCurriculum(data).relations.length,1)
  const graph=await client.generate({...data,attachments:[{name:'相机实践.txt',text:'课程：专业课程1\n主题0-0：数字影像相关法'}]})
  assert.equal(graph.relations.length,2)
  assert.match(graph.relations[1].reason,/数字影像相关法/)
})
