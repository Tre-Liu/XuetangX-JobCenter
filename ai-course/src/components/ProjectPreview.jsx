import { CoursePanorama } from '../course-map/CoursePanorama';
import { useEffect, useRef, useState, useId } from 'react';
import { FileText, ArrowCircleRight } from '@phosphor-icons/react';
import { Icon } from './Icon';
import { contentSources } from './TaskContentMenu';
import { LearningBrief, ActivityBrief } from '../generation/GenerationWizard';
import './ProjectPreview.css';

export function ProjectPreview({ project, projects=[project], knowledge, onExit }) {
 const exitRef = useRef(null);
 const [view,setView]=useState('steps');
 const uid=useId();
 const views=[['steps','项目步骤','list'],['relations','岗位关联图谱','graph']];
 function switchWithKeyboard(event,index){
  const next=event.key==='ArrowRight'?(index+1)%2:event.key==='ArrowLeft'?(index+1)%2:event.key==='Home'?0:event.key==='End'?1:null;
  if(next===null)return;
  event.preventDefault();setView(views[next][0]);
  event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
 }
 useEffect(() => {
  exitRef.current?.focus({ preventScroll: true });
 }, []);
 return <section className="preview project-preview" aria-label="项目预览">
  <header className="project-preview-header">
   <div><h1>{project.title}</h1>{project.description && <p>{project.description}</p>}</div>
   <button ref={exitRef} className="outlined" onClick={onExit}>退出预览</button>
  </header>
  <div className="preview-view-tabs" role="tablist" aria-label="项目预览视角">
   {views.map(([key,label,icon],index)=><button key={key} id={`${uid}-${key}-tab`} type="button" role="tab" aria-selected={view===key} aria-controls={`${uid}-${key}-panel`} tabIndex={view===key?0:-1} onClick={()=>setView(key)} onKeyDown={event=>switchWithKeyboard(event,index)}><Icon name={icon} size={17}/>{label}</button>)}
  </div>
  <div className="preview-steps-panel" id={`${uid}-steps-panel`} role="tabpanel" aria-labelledby={`${uid}-steps-tab`} hidden={view!=='steps'}>
  {project.learningDesign && <details className="preview-learning-design"><summary>项目学习说明</summary><LearningBrief design={project.learningDesign} title={project.title} showGraph={false}/></details>}
  <div className="project-preview-board" role="region" aria-label="项目阶段看板，可横向滚动" tabIndex={0}>
   {project.stages.length ? project.stages.map((stage, index) => <section className={`preview-stage preview-stage-${index % 5}`} key={stage.id} aria-label={`阶段${index + 1} ${stage.title}`}>
    <header className="preview-stage-header">
     <span className="preview-stage-number">{String(index + 1).padStart(2, '0')}</span>
     <div><h2 title={stage.title}>{stage.title}</h2><p>{stage.tasks.length} 个任务</p></div>
    </header>
    {index < project.stages.length - 1 && <span className="preview-stage-connector" aria-hidden="true"><ArrowCircleRight weight="fill" size={19}/></span>}
    <div className="preview-stage-tasks">
     {stage.tasks.length ? stage.tasks.map((task, taskIndex) => <article className="preview-task-card" key={task.id}>
      <h3><FileText size={17}/><span title={`任务${taskIndex + 1}：${task.title}`}>任务{taskIndex + 1}：{task.title}</span></h3>
      {task.learningActivity && <ActivityBrief activity={task.learningActivity}/>}
      {task.contents.length ? <div className="preview-task-contents">{task.contents.map(content => <div className="preview-content" key={content.id}>
       <Icon name={contentSources[content.source]?.icon || (content.type === '目标' ? 'target' : 'book')} size={18}/>
       <span className="preview-content-title">{content.title}</span>
       {content.resourceKind && <span className="preview-kind">{content.resourceKind}</span>}
       <span className={content.scored ? 'preview-score' : 'preview-unscored'}>{content.scored ? '计分' : '不计分'}</span>
      </div>)}</div> : <p className="preview-empty-content">暂无任务内容</p>}
     </article>) : <p className="preview-empty-content">暂无任务</p>}
    </div>
   </section>) : <p className="preview-empty-project">尚未添加阶段，请退出预览创建项目框架。</p>}
  </div>
  </div>
  <div className="preview-relations-panel" id={`${uid}-relations-panel`} role="tabpanel" aria-labelledby={`${uid}-relations-tab`} hidden={view!=='relations'}>
   <CoursePanorama projects={projects} knowledge={knowledge}/>
  </div>
 </section>;
}
