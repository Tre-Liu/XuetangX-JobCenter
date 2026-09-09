import {useState} from 'react';
export function KnowledgeMatching({project,graph,enabled,choice,onChoice,selections,onSelections}){
 const [query,setQuery]=useState('');
 const nodes=enabled?graph.nodes.filter(node=>node.level>1):[];
 const rows=nodes.filter(node=>node.name.toLowerCase().includes(query.trim().toLowerCase()));
 const toggle=(taskId,nodeId)=>onSelections({...selections,[taskId]:(selections[taskId]||[]).includes(nodeId)?selections[taskId].filter(id=>id!==nodeId):[...(selections[taskId]||[]),nodeId]});
 return <><div className="gen-section-title"><div><h3>是否匹配相关知识点？</h3><p>将各任务的学习内容关联到当前课程知识图谱，匹配结果可逐项调整。</p></div></div>
 <div className="gen-match-choice" role="group" aria-label="是否匹配相关知识点">{[['yes','匹配相关知识点'],['no','暂不匹配']].map(([value,label])=><button key={value} className={choice===value?'primary':'outlined'} disabled={value==='yes'&&!nodes.length} onClick={()=>onChoice(value)}>{label}</button>)}</div>
 {!nodes.length&&<p className="gen-notice">当前暂无可用知识点，已默认选择“暂不匹配”，后续可在知识图谱中补充。</p>}
 {choice==='no'&&<p className="gen-notice">本次只生成项目阶段与任务说明。创建后可通过“添加任务内容”关联知识点。</p>}
 {choice==='yes'&&nodes.length>0&&<><p className="gen-notice">已为每个任务默认勾选最多 3 个知识点，优先选择名称与任务内容匹配的项，不足时补充课程知识点。请逐任务确认，可增选或取消。只关联所选知识点及其直接学习单元。</p><input aria-label="搜索匹配知识点" placeholder="搜索知识点名称" value={query} onChange={e=>setQuery(e.target.value)}/><div className="gen-match-tasks">{project.stages.map(stage=>stage.tasks.map(task=><details key={task.id} open><summary>{task.title}<small>已选 {(selections[task.id]||[]).filter(id=>nodes.some(n=>n.id===id)).length} 个知识点</small></summary><div className="gen-match-nodes">{rows.map(node=><label className="gen-ability" key={node.id}><input type="checkbox" checked={(selections[task.id]||[]).includes(node.id)} onChange={()=>toggle(task.id,node.id)}/><span>{node.name}<small>{node.level}级知识点</small></span></label>)}{!rows.length&&<p>暂无匹配的知识点</p>}</div></details>))}</div></>}
 </>;
}
