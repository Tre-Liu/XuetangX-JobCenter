import {useEffect,useRef,useState} from 'react';
import {Icon} from '../components/Icon';

export function TaskConfirmation({project,onRename,onAddStage,onRemoveStage,onAddTask,onRemoveTask,onMoveStage,onMoveTask}){
 const [activeId,setActiveId]=useState(project.stages[0]?.id);
 const stage=project.stages.find(item=>item.id===activeId)||project.stages[0];
 const stageIndex=project.stages.indexOf(stage);
 const navigation=useRef(null),pendingTask=useRef(null);
 useEffect(()=>{navigation.current?.querySelector('[aria-current="step"]')?.scrollIntoView?.({block:'nearest'});},[stage?.id,stageIndex]);
 return <div className="framework-task-confirmation" aria-label="确认生成任务">
  <div className="framework-confirm-stages">
  <nav className="knowledge-stage-nav" aria-label="项目阶段" ref={navigation}>
   <h3>项目阶段</h3>
   {project.stages.map((item,index)=><button type="button" key={item.id} aria-current={stage?.id===item.id?'step':undefined} onClick={()=>setActiveId(item.id)}>
    <span className="knowledge-stage-number">{String(index+1).padStart(2,'0')}</span><span className="knowledge-stage-copy"><strong>{item.title}</strong><small>{item.tasks.length} 个任务</small></span>
   </button>)}
  </nav>
  <div className="framework-confirm-actions">
   <button type="button" onClick={()=>setActiveId(onAddStage())}><Icon name="plus" size={15}/>新增阶段</button>
   <button type="button" className="framework-confirm-delete" disabled={project.stages.length<=1} title={project.stages.length<=1?'至少保留一个阶段':'删除当前阶段'} onClick={()=>onRemoveStage(stage.id)}><Icon name="trash" size={15}/>删除阶段</button>
   <span className="framework-order-buttons" role="group" aria-label="调整阶段顺序">
    <button type="button" aria-label="上移阶段" title="上移当前阶段" disabled={stageIndex===0} onClick={()=>onMoveStage(stage.id,-1)}><Icon name="up" size={16}/></button>
    <button type="button" aria-label="下移阶段" title="下移当前阶段" disabled={stageIndex===project.stages.length-1} onClick={()=>onMoveStage(stage.id,1)}><Icon name="down" size={16}/></button>
   </span>
  </div>
  </div>
  <section className="framework-task-review" aria-label="任务名称确认">
   <div className="framework-task-fields" key={stage?.id}>
    {stage?.tasks.map((task,index)=><div className="framework-task-name" key={task.id}>
     <div className="framework-task-name-heading"><label htmlFor={`framework-task-${task.id}`}>任务 {stageIndex+1}.{index+1}</label><div className="framework-task-order-actions" role="group" aria-label={`任务 ${stageIndex+1}.${index+1}操作`}>
      <button type="button" aria-label={`上移任务 ${stageIndex+1}.${index+1}`} title="上移任务" disabled={index===0} onClick={()=>onMoveTask(stage.id,task.id,-1)}><Icon name="up" size={16}/></button>
      <button type="button" aria-label={`下移任务 ${stageIndex+1}.${index+1}`} title="下移任务" disabled={index===stage.tasks.length-1} onClick={()=>onMoveTask(stage.id,task.id,1)}><Icon name="down" size={16}/></button>
      <button type="button" className="framework-confirm-delete" aria-label={`删除任务 ${stageIndex+1}.${index+1}`} title={stage.tasks.length<=1?'每个阶段至少保留一个任务':'删除当前任务'} disabled={stage.tasks.length<=1} onClick={()=>onRemoveTask(stage.id,task.id)}><Icon name="trash" size={14}/>删除任务</button>
     </div></div>
     <input id={`framework-task-${task.id}`} ref={element=>{if(element&&pendingTask.current===task.id){element.focus({preventScroll:true});element.scrollIntoView?.({block:'nearest'});pendingTask.current=null;}}} aria-label={`任务名称 ${stageIndex+1}.${index+1}`} required aria-invalid={!task.title.trim()} value={task.title} placeholder="请输入任务名称" onChange={event=>onRename(task.id,event.target.value)}/>
     {!task.title.trim()&&<small role="alert">任务名称不能为空</small>}
    </div>)}
   </div>
   <div className="framework-confirm-actions"><button type="button" onClick={()=>{pendingTask.current=onAddTask(stage.id);}}><Icon name="plus" size={15}/>新增任务</button></div>
  </section>
 </div>;
}
