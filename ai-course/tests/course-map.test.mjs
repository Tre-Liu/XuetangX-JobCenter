import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCourseMap,courseConnectedGraph} from '../src/course-map/model.mjs';
import {layoutCourseMap} from '../src/course-map/layout.mjs';
import {catalog,sampleContext,generateProject,defaultDesign} from '../src/generation/model.mjs';
const course={id:'current-course',title:'智能制造岗位项目课程'};
const project=()=>generateProject({context:sampleContext,role:catalog[0],task:catalog[0].tasks[0],abilities:catalog[0].tasks[0].abilities,design:defaultDesign(catalog[0],catalog[0].tasks[0]),confirmed:true});
const associationFixture=()=>({id:'p',title:'关联项目',learningDesign:{sourceTask:{id:'work',title:'岗位任务'},abilities:[{id:'a',title:'操作能力',category:'技能'},{id:'b',title:'检查能力',category:'技能'}]},stages:[{title:'实施',tasks:[
 {id:'t1',title:'操作任务',learningActivity:{abilityIds:['a']},contents:[{knowledgeNodeId:'k1'},{knowledgeNodeId:'deleted'}]},
 {id:'t2',title:'检查任务',contents:[{abilityId:'b'},{knowledgeNodeId:'k2'}]},
 {id:'t3',title:'独立知识任务',contents:[{knowledgeNodeId:'k3'}]}
]}]});
const associationKnowledge={nodes:[{id:'k1',name:'操作知识'},{id:'k2',name:'检查知识'},{id:'k3',name:'独立知识'},{id:'unused',name:'未关联知识'}]};
test('occupational abilities belong below the work task and connect only to knowledge saved on their learning activities',()=>{
 const p=associationFixture(),before=structuredClone(p),graph=buildCourseMap({course,projects:[p],knowledge:associationKnowledge});
 const node=title=>graph.nodes.find(n=>n.title===title),has=(a,b)=>graph.edges.some(e=>e.from===node(a)?.id&&e.to===node(b)?.id);
 assert.ok(has('岗位任务','操作能力'),'work task owns its abilities');
 assert.ok(has('岗位任务','检查能力'));
 assert.ok(has('操作任务','操作知识'));
 assert.ok(has('操作能力','操作知识'),'ability-to-knowledge relation is derived from the same activity');
 assert.ok(has('检查能力','检查知识'),'legacy content ability IDs also map knowledge');
 assert.ok(!has('操作能力','检查知识'));assert.ok(!has('检查能力','独立知识'));
 assert.equal(graph.nodes.filter(n=>n.kind==='knowledge').length,3);
 const layout=layoutCourseMap(graph),work=layout.boxes.find(n=>n.kind==='workTask');
 for(const ability of layout.boxes.filter(n=>n.kind==='ability')){assert.equal(ability.x,work.x);assert.ok(ability.y>work.y+work.h);}
 const activity=layout.boxes.find(n=>n.kind==='activity');
 assert.ok(layout.boxes.filter(n=>n.kind==='knowledge').every(n=>n.x>activity.x));
 assert.deepEqual(p,before);
 assert.equal(buildCourseMap({course,projects:[p],knowledge:associationKnowledge,knowledgeEnabled:false}).nodes.filter(n=>n.kind==='knowledge').length,0);
});
test('shared abilities do not illuminate knowledge from sibling tasks or projects',async()=>{
 const {traceCourseChain}=await import('../src/course-map/model.mjs');
 const p=associationFixture();p.stages[0].tasks[1].learningActivity={abilityIds:['a']};
 const other=structuredClone(p);other.id='other';other.title='其他项目';other.learningDesign.sourceTask={id:'other-work',title:'其他岗位任务'};other.stages[0].tasks=[{id:'t4',title:'其他项目任务',learningActivity:{abilityIds:['a']},contents:[{knowledgeNodeId:'k4'}]}];
 const graph=buildCourseMap({course,projects:[p,other],knowledge:{nodes:[...associationKnowledge.nodes,{id:'k4',name:'其他项目知识'}]}});
 const focused=title=>{const result=traceCourseChain(graph,graph.nodes.find(n=>n.title===title).id);return graph.nodes.filter(n=>result.nodeIds.has(n.id)).map(n=>n.title);};
 assert.ok(focused('操作任务').includes('操作知识'));
 for(const title of ['检查知识','其他项目知识','检查任务','其他项目'])assert.ok(!focused('操作任务').includes(title),title);
 assert.ok(focused('岗位任务').includes('检查知识'));assert.ok(!focused('岗位任务').includes('其他项目知识'));
 for(const title of ['操作知识','检查知识','其他项目知识','关联项目','其他项目'])assert.ok(focused('操作能力').includes(title),title);
 for(const title of ['岗位任务','操作能力','操作任务','关联项目',course.title])assert.ok(focused('操作知识').includes(title),title);
 assert.ok(!focused('操作知识').includes('其他项目'),'knowledge focus must respect the activity that establishes its ability relation');
});
test('course map includes only available dimensions and explicit knowledge associations',()=>{
 const p=project();p.stages[0].tasks[0].contents.push({id:'c',knowledgeNodeId:'linked'});
 const before=structuredClone(p);
 const graph=buildCourseMap({course,projects:[p],knowledge:{nodes:[{id:'linked',name:'已关联知识点'},{id:'unrelated',name:'无关知识点'}]}});
 for(const kind of ['course','project','major','chain','segment','role','workTask','activity','ability','knowledge'])assert.ok(graph.nodes.some(n=>n.kind===kind),kind);
 for(const kind of ['trainingGoal','graduationRequirement','courseGoal'])assert.ok(!graph.nodes.some(n=>n.kind===kind));
 assert.ok(!graph.nodes.some(n=>n.title==='无关知识点'));
 assert.ok(graph.nodes.some(n=>n.review?.includes('复核')));
 assert.equal(graph.nodes.filter(n=>n.kind==='ability').length,6);
 const ids=new Set(graph.nodes.map(n=>n.id));assert.equal(ids.size,graph.nodes.length);
 assert.ok(graph.edges.every(e=>ids.has(e.from)&&ids.has(e.to)));
 assert.deepEqual(p,before);
 assert.ok(!buildCourseMap({course,projects:[p],knowledge:{nodes:[{id:'linked',name:'已关联知识点'}]},knowledgeEnabled:false}).nodes.some(n=>n.kind==='knowledge'));
});
test('missing data hides whole dimensions without placeholders, goals or fabricated chain mappings',()=>{
 const p={id:'plain',title:'设备实训',stages:[]};
 assert.deepEqual(buildCourseMap({course,projects:[p]}).nodes.map(n=>n.kind),['course','project']);
 const generated=project();generated.learningDesign.role={id:'custom',name:'教师岗位',origin:'generated-draft'};
 assert.ok(!buildCourseMap({course,projects:[generated]}).nodes.some(n=>['chain','segment'].includes(n.kind)));
 generated.learningDesign.role.industryRelations=[{chain_id:'partial',chain_name:'仅有产业链'}];
 const partial=buildCourseMap({course,projects:[generated]});assert.ok(partial.nodes.some(n=>n.kind==='chain'));assert.ok(!partial.nodes.some(n=>n.kind==='segment'));
});
test('course boundary excludes foreign projects, and traversal removes disconnected nodes and dangling edges',()=>{
 const a=project(),b=project();b.courseId='another-course';
 const graph=buildCourseMap({course,projects:[a,b]});assert.equal(graph.nodes.filter(n=>n.kind==='project').length,1);
 const root=graph.rootId;
 const filtered=courseConnectedGraph({rootId:root,nodes:[...graph.nodes,{id:'unrelated-major',kind:'major'}],edges:[...graph.edges,{from:'unrelated-major',to:'missing'}]});
 assert.ok(!filtered.nodes.some(n=>n.id==='unrelated-major'));
 assert.ok(!filtered.edges.some(e=>e.to==='missing'));
 const second=structuredClone(a);second.id='second';
 const shared=buildCourseMap({course,projects:[a,second]});assert.equal(shared.nodes.filter(n=>n.kind==='role').length,1);assert.equal(shared.nodes.filter(n=>n.kind==='chain').length,1);
});

const focusFixture=()=>{
 const kinds={major:'major',course:'course',chainA:'chain',segmentA:'segment',roleA:'role',workA:'workTask',projectA:'project',taskA:'activity',siblingA:'activity',shared:'ability',pointA:'knowledge',chainB:'chain',roleB:'role',workB:'workTask',projectB:'project',taskB:'activity'};
 const pairs=[['major','course'],['course','projectA'],['course','projectB'],['chainA','segmentA'],['segmentA','roleA'],['roleA','workA'],['workA','projectA'],['projectA','taskA'],['projectA','siblingA'],['taskA','shared'],['taskA','pointA'],['projectA','shared'],['chainB','roleB'],['roleB','workB'],['workB','projectB'],['projectB','taskB'],['taskB','shared']];
 return {rootId:'course',nodes:Object.entries(kinds).map(([id,kind])=>({id,kind})),edges:pairs.map(([from,to])=>({id:`${from}->${to}`,from,to}))};
};
test('work-task focus lights the full industry-to-project chain plus course ancestry without lighting sibling projects',async()=>{
 const {traceCourseChain}=await import('../src/course-map/model.mjs');const graph=focusFixture(),before=structuredClone(graph);
 const focus=traceCourseChain(graph,'workA');
 for(const id of ['chainA','segmentA','roleA','workA','projectA','taskA','siblingA','shared','pointA','course','major'])assert.ok(focus.nodeIds.has(id),id);
 for(const id of ['projectB','taskB','chainB','roleB','workB'])assert.ok(!focus.nodeIds.has(id),id);
 for(const id of ['chainA->segmentA','workA->projectA','course->projectA','major->course','taskA->pointA'])assert.ok(focus.edgeIds.has(id),id);
 assert.ok(!focus.edgeIds.has('course->projectB'));assert.deepEqual(graph,before);
});
test('activity focus does not fan out through ancestors or shared downstream abilities; course restores all',async()=>{
 const {traceCourseChain}=await import('../src/course-map/model.mjs');const graph=focusFixture();
 const focus=traceCourseChain(graph,'taskA');
 for(const id of ['taskA','projectA','workA','roleA','segmentA','chainA','course','major','shared','pointA'])assert.ok(focus.nodeIds.has(id),id);
 for(const id of ['siblingA','taskB','projectB'])assert.ok(!focus.nodeIds.has(id),id);
 assert.ok(!focus.edgeIds.has('projectA->shared'),'do not light a shortcut bypassing the selected activity');
 const all=traceCourseChain(graph,'course');assert.equal(all.nodeIds.size,graph.nodes.length);assert.equal(all.edgeIds.size,graph.edges.length);
 assert.deepEqual(traceCourseChain(graph,'removed-node'),all);
 const shared=traceCourseChain(graph,'shared');assert.ok(shared.nodeIds.has('taskB'));assert.ok(shared.nodeIds.has('taskA'));assert.ok(!shared.nodeIds.has('siblingA'));
});

test('Figma panorama exposes saved projects, tasks and knowledge immediately without inferred job groups',async()=>{
 const {panoramaGraph}=await import('../src/course-map/model.mjs');
 const {layoutCoursePanorama}=await import('../src/course-map/layout.mjs');
 const p=associationFixture();p.learningDesign.role={id:'role',name:'测试岗位',industryRelations:[{chain_id:'c',chain_name:'产业链',industry_node_id:'s',chain_node_name:'产业环节'}]};
 const graph=panoramaGraph(buildCourseMap({course,projects:[p],knowledge:associationKnowledge})),before=structuredClone(graph),layout=layoutCoursePanorama(graph);
 for(const kind of ['chain','segment','role','project','activity','knowledge'])assert.ok(layout.boxes.some(n=>n.kind===kind),kind);
 assert.equal(layout.boxes.filter(n=>n.kind==='knowledge').length,3);
 assert.ok(layout.boxes.filter(n=>n.kind==='knowledge').every(n=>n.point));
 assert.equal(layout.boxes.filter(n=>n.kind==='ability').length,0);
 assert.equal(layout.groups.filter(n=>n.kind==='role').length,0);
 const role=graph.nodes.find(n=>n.kind==='role'),open=layoutCoursePanorama(graph,{expandedRoles:new Set([role.id])});
 assert.equal(open.boxes.filter(n=>n.kind==='ability').length,2);
 const card=open.boxes.find(n=>n.kind==='role');
 for(const point of open.boxes.filter(n=>n.kind==='ability'))assert.ok(point.x>card.x&&point.y>card.y&&point.y+point.h<card.y+card.h);
 const visible=new Set(open.boxes.map(n=>n.id));assert.ok(open.paths.every(e=>visible.has(e.from)&&visible.has(e.to)));
 assert.ok(open.paths.some(e=>e.from===role.id&&e.to===graph.nodes.find(n=>n.kind==='project').id));
 assert.deepEqual(graph,before);
});
test('knowledge always uses a dot matrix, including fewer than 30 points, and missing dimensions remain absent',async()=>{
 const {layoutCoursePanorama}=await import('../src/course-map/layout.mjs');
 const nodes=[{id:'course',kind:'course',title:'课程'},...Array.from({length:30},(_,i)=>({id:'k'+i,kind:'knowledge',title:'知识'+i}))];
 const graph={rootId:'course',nodes,edges:[]};
 assert.ok(layoutCoursePanorama(graph).boxes.filter(n=>n.kind==='knowledge').every(n=>n.point));
 assert.ok(layoutCoursePanorama({...graph,nodes:nodes.slice(0,30)}).boxes.every(n=>n.point));
 const empty=layoutCoursePanorama({...graph,nodes:[nodes[0]]});assert.equal(empty.boxes.length,0);assert.equal(empty.labels.length,0);
});
test('saved course-level industry associations remain connected through the hidden course',async()=>{
 const {layoutCoursePanorama}=await import('../src/course-map/layout.mjs');
 const graph={rootId:'course',nodes:[{id:'course',kind:'course',title:'课程'},{id:'chain',kind:'chain',title:'产业链'},{id:'project',kind:'project',title:'教学项目'}],edges:[{id:'industry-course',from:'chain',to:'course'},{id:'course-project',from:'course',to:'project'}]};
 const paths=layoutCoursePanorama(graph).paths;
 assert.equal(paths.length,1);assert.equal(paths[0].from,'chain');assert.equal(paths[0].to,'project');
 assert.deepEqual(paths[0].sourceEdgeIds,['industry-course','course-project']);
});

test('CMS-selected chains expose their recorded stages without inventing stage-to-role relations',async()=>{
 const {panoramaGraph}=await import('../src/course-map/model.mjs');
 const cmsConfig={major:{code:'460305'},chainIds:['chain-59d9997d54']};
 const p={id:'manual',title:'数据采集项目',learningDesign:{role:{id:'manual-role',name:'自定义岗位',industryRelations:[]}},stages:[]};
 const before=structuredClone({cmsConfig,p});
 const graph=panoramaGraph(buildCourseMap({course,projects:[p],cmsConfig}));
 const chain=graph.nodes.find(n=>n.kind==='chain'),segments=graph.nodes.filter(n=>n.kind==='segment');
 assert.deepEqual(segments.map(n=>[n.description,n.title]),[['上游','数据资源采集与基础设施'],['中游','数据治理、流通与服务'],['下游','数字经济场景应用与内容创意']]);
 assert.equal(new Set(segments.map(n=>n.id)).size,3);
 for(const segment of segments){
  assert.ok(graph.edges.some(e=>e.from===chain.id&&e.to===segment.id));
  assert.ok(!graph.edges.some(e=>e.from===segment.id),'the catalog does not establish a stage-to-role or stage-to-course association');
  assert.match(segment.source,/课程 CMS/);assert.match(segment.formationBasis,/推导/);assert.match(segment.review,/待复核/);
 }
 assert.deepEqual({cmsConfig,p},before);
 const cleared=buildCourseMap({course,projects:[p],cmsConfig:{...cmsConfig,chainIds:[]}});
 assert.ok(!cleared.nodes.some(n=>['chain','segment'].includes(n.kind)));
});

test('industry frames own only explicitly linked segments and keep their nodes inside the frame',async()=>{
 const {layoutCoursePanorama}=await import('../src/course-map/layout.mjs');
 const graph={rootId:'course',nodes:[{id:'course',kind:'course',title:'课程'},{id:'chain-a',kind:'chain',title:'甲产业链'},{id:'chain-b',kind:'chain',title:'乙产业链'},{id:'segment-a',kind:'segment',title:'同名环节'},{id:'segment-b',kind:'segment',title:'同名环节'},{id:'unassigned',kind:'segment',title:'未归属环节'}],edges:[{id:'a',from:'chain-a',to:'segment-a'},{id:'b',from:'chain-b',to:'segment-b'}]};
 const layout=layoutCoursePanorama(graph);
 for(const [chainId,segmentId] of [['chain-a','segment-a'],['chain-b','segment-b']]){
  const frame=layout.groups.find(group=>group.chainId===chainId);assert.ok(frame);
  const members=layout.boxes.filter(box=>box.groupId===frame.id);
  assert.deepEqual(members.map(box=>box.id),[chainId,segmentId]);
  for(const box of members){assert.ok(box.x>=frame.x&&box.y>=frame.y);assert.ok(box.x+box.w<=frame.x+frame.w&&box.y+box.h<=frame.y+frame.h);}
 }
 assert.equal(layout.boxes.find(box=>box.id==='unassigned').groupId,undefined);
});

test('CMS primary-stage relations participate in bidirectional focus without lighting sibling stages or projects',async()=>{
 const {panoramaGraph,traceCourseChain}=await import('../src/course-map/model.mjs');
 const {layoutCoursePanorama}=await import('../src/course-map/layout.mjs');
 const cmsConfig={major:{code:'080717T'},chainIds:['chain-75155ff272']};
 const make=(id)=>({id,title:`项目${id}`,learningDesign:{role:{id:`role-${id}`,name:`岗位${id}`,industryRelations:[]},sourceTask:{id:`work-${id}`,title:`岗位任务${id}`},abilities:[{id:`ability-${id}`,title:`能力${id}`,category:'技能'}]},stages:[{title:'实施',tasks:[{id:`task-${id}`,title:`实践${id}`,learningActivity:{abilityIds:[`ability-${id}`]},contents:[{knowledgeNodeId:`knowledge-${id}`}]}]}]});
 const projects=[make('A'),make('B')],knowledge={nodes:['A','B'].map(id=>({id:`knowledge-${id}`,name:`知识${id}`}))},before=structuredClone({projects,cmsConfig,knowledge});
 const graph=panoramaGraph(buildCourseMap({course,projects,cmsConfig,knowledge}));
 const mid=graph.nodes.find(n=>n.kind==='segment'&&n.description==='中游'),chain=graph.nodes.find(n=>n.kind==='chain'),node=title=>graph.nodes.find(n=>n.title===title);
 for(const title of ['项目A','岗位A','实践A','能力A','知识A']){
  const focus=traceCourseChain(graph,node(title).id);
  assert.ok(focus.nodeIds.has(mid.id),`${title} traces the recorded primary stage`);
  assert.ok(focus.nodeIds.has(chain.id));
  for(const segment of graph.nodes.filter(n=>n.kind==='segment'&&n.id!==mid.id))assert.ok(!focus.nodeIds.has(segment.id));
  for(const sibling of ['项目B','岗位B','实践B','能力B','知识B'])assert.ok(!focus.nodeIds.has(node(sibling).id),`${title} does not light ${sibling}`);
 }
 const relation=graph.edges.find(e=>e.from===mid.id&&e.to===graph.rootId);
 assert.ok(relation,'the hidden major retains its recorded stage-to-course relation');
 assert.ok(relation.evidence.some(e=>e.majorKey==='普通本科:080717T'&&e.chainId==='chain-75155ff272'));
 const paths=layoutCoursePanorama(graph).paths;
 assert.ok(paths.some(p=>p.from===mid.id&&p.to===node('项目A').id));
 assert.ok(!paths.some(p=>p.from===chain.id&&p.to===node('项目A').id),'the overview does not bypass the known stage');
 const stageFocus=traceCourseChain(graph,mid.id);
 for(const title of ['项目A','岗位A','知识A','项目B','岗位B','知识B'])assert.ok(stageFocus.nodeIds.has(node(title).id));
 assert.ok(!graph.edges.some(e=>e.from===mid.id&&graph.nodes.find(n=>n.id===e.to)?.kind==='role'),'course-level relations are not fabricated as individual role assignments');
 assert.deepEqual({projects,cmsConfig,knowledge},before);
});

test('a manually selected chain without a major-stage record stays at chain level',async()=>{
 const {panoramaGraph,traceCourseChain}=await import('../src/course-map/model.mjs');
 const graph=panoramaGraph(buildCourseMap({course,projects:[{id:'p',title:'项目',stages:[]}],cmsConfig:{major:{code:'080803T'},chainIds:['chain-75155ff272']}}));
 const focus=traceCourseChain(graph,graph.nodes.find(n=>n.kind==='project').id);
 assert.ok(focus.nodeIds.has(graph.nodes.find(n=>n.kind==='chain').id));
 for(const segment of graph.nodes.filter(n=>n.kind==='segment'))assert.ok(!focus.nodeIds.has(segment.id));
 assert.ok(!graph.edges.some(e=>graph.nodes.find(n=>n.id===e.from)?.kind==='segment'&&e.to===graph.rootId));
});

for(const [code,stage] of [['080910T','上游'],['080717T','中游'],['080214T','下游']])test(`AI chain follows the recorded ${stage} relation for major ${code}`,async()=>{
 const {panoramaGraph,traceCourseChain}=await import('../src/course-map/model.mjs');
 const graph=panoramaGraph(buildCourseMap({course,projects:[{id:'p',title:'项目',stages:[]}],cmsConfig:{major:{code},chainIds:['chain-75155ff272']}}));
 const focus=traceCourseChain(graph,graph.nodes.find(n=>n.kind==='project').id);
 assert.deepEqual(graph.nodes.filter(n=>n.kind==='segment'&&focus.nodeIds.has(n.id)).map(n=>n.description),[stage]);
});
