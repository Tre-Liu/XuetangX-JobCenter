import {normalizeConfig} from './config.mjs';

export function JobMatching({draft,setDraft}){
 const update=patch=>setDraft(value=>normalizeConfig({...value,...patch}));
 return <section className="cms-job-matching">
  <label className="cms-job-toggle"><span><strong>按岗位名称匹配</strong><p>暂无产业链数据，可根据关联专业名称匹配相关岗位。</p></span><input type="checkbox" role="switch" aria-label="按岗位名称匹配" checked={draft.matchingMode==='job-name'} onChange={event=>update({matchingMode:event.target.checked?'job-name':'chain'})}/></label>
  {draft.matchingMode==='job-name'&&<>
   <p>已匹配 {draft.matchedJobs.length} 个相关岗位 · 模拟数据 · 已生效 {draft.matchedJobs.filter(job=>!draft.disabledJobIds.includes(job.id)).length} 个</p>
   <div className="cms-job-table-wrap"><table className="cms-job-table" aria-label="专业相关岗位匹配结果"><thead><tr><th>岗位名称</th><th>岗位典型工作任务数</th><th>岗位能力项数</th><th>是否生效</th></tr></thead><tbody>{draft.matchedJobs.map(job=><tr key={job.id}><td>{job.name}</td><td>{job.taskCount}</td><td>{job.abilityCount}</td><td><label><input type="checkbox" role="switch" aria-label={job.name+'是否生效'} checked={!draft.disabledJobIds.includes(job.id)} onChange={()=>update({disabledJobIds:draft.disabledJobIds.includes(job.id)?draft.disabledJobIds.filter(id=>id!==job.id):[...draft.disabledJobIds,job.id]})}/>{draft.disabledJobIds.includes(job.id)?'不生效':'生效'}</label></td></tr>)}</tbody></table></div>
   <p>使用此方式后，不展示产业布局；生效岗位可用于课程岗位任务设计。</p>
  </>}
 </section>;
}
