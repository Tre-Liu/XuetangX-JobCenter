import {ProjectInfo} from '../ai-projects/ProjectInfo';
import { GenerationMenu } from './GenerationMenu';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { ProjectEvaluation } from './ProjectEvaluation';
import { TaskDescription } from './TaskDescription';
import { TaskContentMenu, contentSources } from './TaskContentMenu';
import { LearningBrief } from '../generation/GenerationWizard';
import {ProjectDescription,ProjectQuestionSummary} from './ProjectDescription';
import { Icon } from './Icon';
import { createStage, createTask, projectStats } from '../project.mjs';
const ord=['一','二','三','四','五','六','七','八','九','十'];
export function ProjectEditor({project,mutate,open,onSaveInfo,cmsConfig,industryEnabled=false}){
 const stats=projectStats(project);
 const [view,setView]=useState(project.projectType==='ai'?'details':'tasks');
 const views=[...(project.projectType==='ai'?[['details','项目详情','file']]:[]),['tasks','项目任务','list'],['evaluation','评价总览','chart']];
 const uid=useId();
 const [newTaskId,setNewTaskId]=useState(null);
 const newTaskCard=useRef(null);
 useLayoutEffect(()=>{
  if(!newTaskId||!newTaskCard.current)return;
  newTaskCard.current.scrollIntoView?.({block:'nearest',behavior:'auto'});
  newTaskCard.current.querySelector('.task-title')?.focus({preventScroll:true});
 },[newTaskId]);
 const addTask=stageId=>{
  const task=createTask();
  mutate(p=>{p.stages.find(stage=>stage.id===stageId).tasks.push(task);});
  setNewTaskId(task.id);
 };
 return <div className="project-page">
  <section className="project-hero"><div className="hero-info"><button className="project-title" onClick={()=>open({type:'project-edit'})}>{project.title}<Icon name="edit" size={16}/></button><p>{project.description||'添加项目简介，明确项目学习方向'}</p><div className="stats">{[['阶段',stats.stages],['任务',stats.tasks],['学习单元',stats.units],['拓展学习',stats.extensions]].map(([label,n])=><div className="stat" key={label}><span>{label}{['学习单元','拓展学习'].includes(label)&&<Icon name="info" size={12}/>}</span><strong>{n}</strong></div>)}</div></div><div className="hero-actions"><div><GenerationMenu industryEnabled={industryEnabled} key={`${project.id}-${industryEnabled}`} onSelect={type=>open({type})}/><button onClick={()=>open({type:'preview'})}><Icon name="eye"/>预览</button></div><button className="publish" onClick={()=>open({type:'publish'})}><Icon name="send"/>发布项目</button></div></section>
  <div className="project-workspace-tabs" role="tablist" aria-label="项目配置视角">{views.map(([key,label,icon],index)=><button key={key} role="tab" id={`${uid}-${key}-tab`} aria-controls={`${uid}-${key}-panel`} aria-selected={view===key} tabIndex={view===key?0:-1} onClick={()=>setView(key)} onKeyDown={event=>{const next=event.key==='ArrowRight'?(index+1)%views.length:event.key==='ArrowLeft'?(index+views.length-1)%views.length:event.key==='Home'?0:event.key==='End'?views.length-1:null;if(next===null)return;event.preventDefault();setView(views[next][0]);event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();}}><Icon name={icon} size={17}/>{label}</button>)}</div>
  {view==='details'?<div id={`${uid}-details-panel`} role="tabpanel" aria-labelledby={`${uid}-details-tab`}><ProjectInfo project={project} onSave={onSaveInfo}/></div>:view==='evaluation'?<div id={`${uid}-evaluation-panel`} role="tabpanel" aria-labelledby={`${uid}-evaluation-tab`}><ProjectEvaluation project={project} mutate={mutate}/></div>:<div id={`${uid}-tasks-panel`} role="tabpanel" aria-labelledby={`${uid}-tasks-tab`}>
  <ProjectDescription project={project} onChange={explanation=>mutate(p=>{p.explanation=explanation;})}/>
  <ProjectQuestionSummary project={project}/>
  {project.learningDesign&&<LearningBrief cmsConfig={cmsConfig} design={project.learningDesign} title={project.title} onChange={explanation=>mutate(p=>{p.learningDesign.explanation=explanation;})}/>}
  <div className="unlock"><span>顺序解锁 <span title="开启后，学习者需按阶段顺序完成学习"><Icon name="info" size={14}/></span></span><button className={`switch ${project.sequential?'on':''}`} role="switch" aria-label="顺序解锁" aria-checked={project.sequential} onClick={()=>mutate(p=>{p.sequential=!p.sequential;})}><span/></button></div>
  <div className="stage-list">{project.stages.map((stage,i)=><section key={stage.id} className={`stage stage-${i%3}`}><header className="stage-header"><Icon name="drag" size={17}/><span className="stage-number">{String(i+1).padStart(2,'0')}</span><button className="stage-title" onClick={()=>open({type:'stage-edit',stageId:stage.id,title:stage.title})}>阶段{ord[i]||i+1}：{stage.title}</button><div className="stage-controls"><button className="icon-button" aria-label={`删除阶段${i+1}`} onClick={()=>open({type:'delete-stage',stageId:stage.id,title:stage.title})}><Icon name="trash"/></button><button className="icon-button" aria-label={`${stage.collapsed?'展开':'收起'}阶段${i+1}`} onClick={()=>mutate(p=>{p.stages[i].collapsed=!stage.collapsed;})}><Icon name={stage.collapsed?'down':'up'}/></button></div></header>
  {!stage.collapsed&&<div className="stage-body"><div className="tasks-card">{stage.tasks.map((task,j)=><article className="task" key={task.id} ref={task.id===newTaskId?newTaskCard:null} aria-label={`任务${j+1}：${task.title}`}><header><Icon name="drag" size={16}/><button className="task-title" onClick={()=>open({type:'task-edit',stageId:stage.id,taskId:task.id,title:task.title})}>任务{j+1} {task.title}</button><button className="icon-button" aria-label={`删除任务${i+1}-${j+1}`} onClick={()=>open({type:'delete-task',stageId:stage.id,taskId:task.id,title:task.title})}><Icon name="trash" size={17}/></button><button className="icon-button" aria-label={`${task.collapsed?'展开':'收起'}任务${i+1}-${j+1}`} onClick={()=>mutate(p=>{p.stages[i].tasks[j].collapsed=!task.collapsed;})}><Icon name={task.collapsed?'down':'up'} size={17}/></button></header>{!task.collapsed&&<div className="task-body"><TaskDescription task={task} design={project.learningDesign} stage={stage} onChange={description=>mutate(p=>{p.stages.find(s=>s.id===stage.id).tasks.find(t=>t.id===task.id).description=description;})}/> {task.contents.map(c=><button key={c.id} className="content-row" onClick={()=>open({type:'content',stageId:stage.id,taskId:task.id,content:c})}><Icon name={contentSources[c.source]?.icon||(c.type==='目标'?'target':'book')} size={18}/><span>{c.title}</span>{c.providerName&&<span className="content-provider" title={`资源提供企业：${c.providerName}`}>{c.providerName}</span>}<em className={c.scored?'scored':''}>{c.source==='agent'?'智能体任务':c.scored?'计分':contentSources[c.source]?.label||c.type}</em></button>)}<TaskContentMenu onSelect={source=>open({type:'content',stageId:stage.id,taskId:task.id,source})}/></div>}</article>)}<button className="new-task" onClick={()=>addTask(stage.id)}><Icon name="plus"/>创建新任务</button></div></div>}</section>)}<button className="add-stage" onClick={()=>mutate(p=>{const s=createStage();s.tasks=[createTask()];p.stages.push(s);})}><Icon name="plus" size={17}/>添加阶段</button></div>
 </div>}</div>;
}
