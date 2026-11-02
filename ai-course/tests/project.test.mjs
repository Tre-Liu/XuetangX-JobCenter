import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, createStage, createTask, projectStats, appendTemplate, validateProject } from '../src/project.mjs';
test('empty projects start with no stages or content', () => {
 const p = createProject('新项目'); assert.deepEqual(projectStats(p), {stages:0,tasks:0,units:0,extensions:0});
});
test('template appends independently without replacing authored work or creating content', () => {
 const p = createProject('项目'); const s = createStage('已有阶段'); s.tasks.push(createTask('已有任务')); p.stages.push(s);
 appendTemplate(p); appendTemplate(p);
 assert.equal(p.stages[0].tasks[0].title,'已有任务'); assert.equal(p.stages.length,7);
 assert.equal(new Set(p.stages.map(s=>s.id)).size,7); assert.equal(projectStats(p).units,0);
});
test('counts learning units and extensions separately from objectives and follows stage deletion', () => {
 const p=createProject('项目'); const s=createStage('阶段'); const t=createTask('任务');
 t.contents=[{type:'目标'},{type:'学习单元'},{type:'拓展学习'}]; s.tasks.push(t); p.stages.push(s);
 assert.deepEqual(projectStats(p),{stages:1,tasks:1,units:1,extensions:1});
 p.stages=[]; assert.equal(projectStats(p).tasks,0);
});
test('preview validation catches incomplete structure', () => {
 const p=createProject('项目'); assert.ok(validateProject(p)); appendTemplate(p); assert.equal(validateProject(p),'');
 p.stages[0].tasks[0].title=' '; assert.ok(validateProject(p));
});

import * as projectModel from '../src/project.mjs';
test('generated frameworks append by default without losing authored work or its source',()=>{
 const current={id:'p',title:'教师标题',learningDesign:{role:{id:'old'}},stages:[{id:'s',tasks:[{id:'t',contents:[{id:'c'}]}],evaluation:{weight:100}}]};
 const generated={id:'new',title:'生成标题',learningDesign:{role:{id:'new-role'}},stages:[{id:'new-stage',tasks:[{id:'new-task',contents:[]}]}]};
 const before=structuredClone(current);
 assert.equal(typeof projectModel.applyGeneratedFramework,'function');
 const appended=projectModel.applyGeneratedFramework(current,generated);
 assert.equal(appended.title,'教师标题');assert.equal(appended.id,'p');
 assert.deepEqual(appended.stages[0],before.stages[0]);assert.equal(appended.stages.length,2);
 assert.deepEqual(appended.learningDesign,before.learningDesign);
 assert.deepEqual(appended.stages[1].learningDesign,generated.learningDesign);
 assert.deepEqual(current,before);
 const replaced=projectModel.applyGeneratedFramework(current,generated,'replace');
 assert.equal(replaced.id,'p');assert.equal(replaced.stages.length,1);assert.equal(replaced.stages[0].id,'new-stage');
 assert.equal(replaced.title,'生成标题');
});
