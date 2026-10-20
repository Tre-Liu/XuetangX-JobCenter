import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFlowSVG,resolveExplanation} from '../src/media/project-flow.mjs';
test('flow explains the current stages and tasks and escapes authored text',()=>{
 const svg=projectFlowSVG({title:'组件开发 <项目>',stages:[{title:'设计方案',tasks:[{title:'设计页面组件'}]},{title:'实施开发',tasks:[{title:'实现组件交互'}]}]});
 assert.match(svg,/设计页面组件/);assert.match(svg,/实现组件交互/);assert.match(svg,/&lt;项目&gt;/);assert.match(svg,/marker-end/);assert.match(svg,/返修/);
});
test('prepared materials refresh while teacher uploads and intentional deletion stay intact',()=>{
 const image={name:'智能制造项目流程.png',url:'old'};
 const project={title:'新项目',stages:[]};
 assert.match(resolveExplanation({type:'image',assets:{image}},project).assets.image.url,/data:image\/svg\+xml/);
 const refreshed=resolveExplanation(resolveExplanation({type:'image',assets:{image}},project),{...project,title:'更新项目'});
 assert.match(decodeURIComponent(refreshed.assets.image.url),/更新项目/);
 const uploaded={name:image.name,storageKey:'teacher-file'};
 assert.equal(resolveExplanation({type:'image',assets:{image:uploaded}},project).assets.image,uploaded);
 assert.equal(resolveExplanation({type:'image',assets:{image:null}},project).assets.image,null);
});
