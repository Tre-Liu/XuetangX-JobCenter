import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, sampleContext, defaultDesign, generateProject } from '../src/generation/model.mjs';
import { projectJobRelations } from '../src/generation/project-job-relations.mjs';
const role=catalog[0],task=role.tasks[0];
const makeProject=()=>generateProject({context:sampleContext,role,task,abilities:task.abilities,design:defaultDesign(role,task),confirmed:true});
test('existing generated projects resolve their exact role mapping and preserve its review status',()=>{
 const project=makeProject(),before=structuredClone(project);
 const result=projectJobRelations(project);
 assert.equal(result.task.title,'D2：工业机器人操作');
 assert.equal(result.role.name,'机器人操作工');
 assert.equal(result.paths.length,1);
 assert.equal(result.paths[0].chain_name,'机器人产业链');
 assert.equal(result.paths[0].chain_node_name,'机器人本体制造与系统集成');
 assert.match(result.paths[0].review_status,/需复核/);
 assert.match(result.paths[0].source,/relations.json/);
 assert.deepEqual(project,before);
});
test('unrelated and ordinary projects never inherit example industry relations',()=>{
 assert.deepEqual(projectJobRelations({title:'普通项目',stages:[]}).paths,[]);
 const project=makeProject();project.learningDesign.role.id='another-role';
 assert.deepEqual(projectJobRelations(project).paths,[]);
 project.learningDesign.role.id=role.id;project.learningDesign.role.name='教师新岗位';
 assert.deepEqual(projectJobRelations(project).paths,[]);
});
test('explicit saved mappings take precedence including an intentional empty set',()=>{
 const project=makeProject();project.learningDesign.role.industryRelations=[];
 assert.deepEqual(projectJobRelations(project).paths,[]);
 project.learningDesign.role.industryRelations=[{chain_id:'a',chain_name:'甲产业链',industry_node_id:'1',chain_node_name:'甲环节'},{chain_id:'b',chain_name:'乙产业链',industry_node_id:'2',chain_node_name:'乙环节'}];
 assert.deepEqual(projectJobRelations(project).paths.map(p=>p.chain_name),['甲产业链','乙产业链']);
});

 test('CMS selections are exposed separately from role ancestry for existing projects',async()=>{
 const {chains}=await import('../src/cms/config.mjs');
 const project=makeProject();project.learningDesign.role.industryRelations=[];
 const before=structuredClone(project);
 const config={major:{code:'460305',name:'工业机器人技术'},chainIds:[chains[0].id,chains[1].id]};
 const result=projectJobRelations(project,config);
 assert.deepEqual(result.courseChains.map(c=>c.id),config.chainIds);
 assert.deepEqual(result.paths,[]);
 assert.deepEqual(projectJobRelations(project,{...config,chainIds:[]}).courseChains,[]);
 assert.deepEqual(project,before);
 });

test('cultural demo ancestry fills old projects without mutating saved data',()=>{
 const project={learningDesign:{role:{id:'major-job:010101:1',name:'文化研究助理',origin:'simulation'}}};
 const before=structuredClone(project);
 const result=projectJobRelations(project);
 assert.equal(result.paths[0].chain_name,'文化内容与公共文化服务产业链');
 assert.equal(result.paths[0].chain_node_name,'文化资源调查与研究');
 assert.equal(result.paths[0].review_status,'模拟数据');
 assert.deepEqual(project,before);
 project.learningDesign.role.industryRelations=[];
 assert.deepEqual(projectJobRelations(project).paths,[]);
 delete project.learningDesign.role.industryRelations;
 project.learningDesign.role.origin='teacher';
 assert.deepEqual(projectJobRelations(project).paths,[]);
 project.learningDesign.role.origin='simulation';
 project.learningDesign.role.id='custom-role';
 assert.deepEqual(projectJobRelations(project).paths,[]);
});
