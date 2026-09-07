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
