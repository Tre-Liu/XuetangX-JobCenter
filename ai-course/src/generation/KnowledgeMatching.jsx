import {KnowledgePicker} from './KnowledgePicker';
import {useState} from 'react';
export function KnowledgeMatching({project,graph,enabled,choice,onChoice,selections,onSelections}){
 const [picking,setPicking]=useState(null);
 const nodes=enabled?graph.nodes.filter(node=>node.level>1):[];
 const currentTask=project.stages.flatMap(stage=>stage.tasks).find(task=>task.id===picking);
 const toggle=(taskId,nodeId)=>onSelections({...selections,[taskId]:(selections[taskId]||[]).includes(nodeId)?selections[taskId].filter(id=>id!==nodeId):[...(selections[taskId]||[]),nodeId]});
 return <><div className="gen-section-title"><div><h3>是否匹配相关知识点？</h3><p>将各任务的学习内容关联到当前课程知识图谱，匹配结果可逐项调整。</p></div></div>
 <div className="gen-match-choice" role="group" aria-label="是否匹配相关知识点">{[['yes','匹配相关知识点'],['no','暂不匹配']].map(([value,label])=><button key={value} className={choice===value?'primary':'outlined'} disabled={value==='yes'&&!nodes.length} onClick={()=>onChoice(value)}>{label}</button>)}</div>
 {!nodes.length&&<p className="gen-notice">当前暂无可用知识点，已默认选择“暂不匹配”，后续可在知识图谱中补充。</p>}
 {choice==='no'&&<p className="gen-notice">本次只生成项目阶段与任务说明。创建后可通过“添加任务内容”关联知识点。</p>}
 {choice==='yes'&&nodes.length>0&&<><p className="gen-notice">已为每个任务默认勾选全部可用知识点，可取消勾选，也可从知识图谱选择节点重新匹配。只关联所选知识点及其直接学习单元。</p><div className="gen-match-tasks">{project.stages.map(stage=>stage.tasks.map(task=><details key={task.id} open><summary>{task.title}<small>已选 {(selections[task.id]||[]).filter(id=>nodes.some(n=>n.id===id)).length} 个知识点</small></summary><button className="outlined gen-graph-picker" aria-expanded={picking===task.id} aria-haspopup="dialog" onClick={event=>{event.currentTarget.focus();setPicking(task.id);}}>选择知识点</button><div className="gen-match-nodes">{nodes.filter(node=>(selections[task.id]||[]).includes(node.id)).map(node=><label className="gen-ability" key={node.id}><input type="checkbox" aria-label={`匹配${node.name}`} checked={(selections[task.id]||[]).includes(node.id)} onChange={()=>toggle(task.id,node.id)}/><span>{node.name}<small>{node.level}级知识点</small></span></label>)}{!(selections[task.id]||[]).some(id=>nodes.some(node=>node.id===id))&&<p>暂无已匹配知识点，可点击“选择知识点”添加。</p>}</div></details>))}</div></>}
 {currentTask&&choice==='yes'&&enabled&&<KnowledgePicker task={currentTask} nodes={nodes} selected={selections[currentTask.id]||[]} onClose={()=>setPicking(null)} onConfirm={ids=>{onSelections({...selections,[currentTask.id]:ids});setPicking(null);}}/>}
 </>;
}
