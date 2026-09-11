import { Icon } from '../components/Icon';
import { knowledgeJobRelations } from './job-relations.mjs';

export function KnowledgeJobRelations({graph,projects,nodeId,onRemove}){
 const rows=knowledgeJobRelations(graph,projects,nodeId);
 return <section className="kg-job-relations" aria-label="岗位关系列表">
  <div className="kg-job-heading"><h3>关联岗位关系 <span>{rows.length}</span></h3><p>根据项目式教学中关联的知识点与能力项匹配。</p></div>
  {rows.length?<ul>{rows.map(row=><li key={row.id} className="kg-job-row">
   <header><strong><Icon name="users" size={16}/>{row.role.name}{row.demo&&<span className="kg-job-demo-badge">模拟</span>}</strong><button type="button" className="kg-job-delete" aria-label={`删除岗位关系：${row.role.name} / ${row.ability?.title||row.workTask?.title||'未关联能力项'}`} onClick={()=>onRemove(row.id)}><Icon name="trash" size={14}/>删除</button></header>
   <dl><dt>典型工作任务</dt><dd>{row.workTask?.title||'未关联典型工作任务'}</dd><dt>岗位能力项</dt><dd>{row.ability?<>{row.ability.category&&<span className="kg-job-category">{row.ability.category}</span>}{row.ability.title}</>:'未关联岗位能力项'}</dd></dl>
   <div className="kg-job-sources"><span>来源项目任务</span>{row.sources.map(source=><p key={JSON.stringify([source.projectId,source.stageId,source.taskId])}>{[source.projectTitle,source.stageTitle,source.taskTitle].filter(Boolean).join(' / ')}</p>)}</div>
  </li>)}</ul>:<div className="kg-detail-empty"><Icon name="users" size={36}/><h3>暂无岗位关系</h3><p>在项目任务中关联当前知识点与岗位能力项后，将在此显示对应关系。</p></div>}
 </section>;
}
