import { useId, useState } from 'react';
import { Icon } from '../components/Icon';
import { projectJobRelations } from './project-job-relations.mjs';
import './job-competency-map.css';

function MapNode({ kind, label, title, icon, children }) {
 return <div className={`competency-node competency-${kind}`}>
  <div className="competency-node-label"><Icon name={icon} size={16}/><span>{label}</span></div>
  <strong>{title}</strong>{children}
 </div>;
}
function Link({ children }) {
 return <div className="competency-link" aria-hidden="true"><span>{children}</span><i/></div>;
}
export function JobCompetencyMap({ design, title, initialIndustryOpen=false, heading="岗位能力图谱" }) {
 const [abilitiesOpen,setAbilitiesOpen]=useState(false);
 const [industryOpen,setIndustryOpen]=useState(initialIndustryOpen);
 const uid=useId();
 const abilities=design.abilities||[];
 const {paths:relations}=projectJobRelations({learningDesign:design});
 return <section className="competency-map" aria-label={heading}>
  <header className="competency-heading"><h3><Icon name="graph" size={18}/>{heading}</h3><span>点击任务展开能力项，点击岗位展开产业归属</span></header>
  <div className="competency-canvas">
   {industryOpen&&<div id={`${uid}-industry`} className="competency-ancestry">
    {relations.length?relations.map((r,i)=><div className="competency-industry-path" key={`${r.chain_id}-${r.industry_node_id}-${i}`}>
     <MapNode kind="chain" label="产业链" title={r.chain_name} icon="tree"/>
     <Link>包含</Link>
     <MapNode kind="segment" label={`产业环节${r.chain_node_stage?` · ${r.chain_node_stage}`:''}`} title={r.chain_node_name} icon="stack">
      {r.review_status&&<span className="competency-review" title={r.match_basis}>{r.review_status.includes('复核')&&!r.review_status.includes('已复核')?'待复核 · 历史匹配':r.review_status}</span>}
     </MapNode>
    </div>):<div className="competency-missing"><Icon name="tree" size={20}/><span>暂未关联产业环节与产业链<small>补充岗位的产业归属后可在此展开</small></span></div>}
    <div className="competency-up-link"><span>产业归属</span><i/></div>
   </div>}
   <div className="competency-main-path">
    <MapNode kind="learning" label="学习型工作任务" title={title||design.title||'当前学习任务'} icon="book"><span className="competency-node-note">当前学习任务</span></MapNode>
    <Link>源自</Link>
    <MapNode kind="task" label="典型工作任务" title={design.sourceTask?.title||'暂未关联典型工作任务'} icon="target">
     <button type="button" aria-label={`${abilitiesOpen?'收起':'展开'}相关能力项`} aria-expanded={abilitiesOpen} aria-controls={`${uid}-abilities`} onClick={()=>setAbilitiesOpen(v=>!v)}><Icon name={abilitiesOpen?'minus-circle':'plus-circle'} size={16}/>{abilitiesOpen?'收起':'展开'}能力项<span>{abilities.length}</span></button>
    </MapNode>
    <Link>所属岗位</Link>
    <MapNode kind="role" label="岗位" title={design.role?.name||'暂未关联岗位'} icon="users">
     <button type="button" aria-label={`${industryOpen?'收起':'展开'}产业环节与产业链`} aria-expanded={industryOpen} aria-controls={`${uid}-industry`} onClick={()=>setIndustryOpen(v=>!v)}><Icon name={industryOpen?'minus-circle':'plus-circle'} size={16}/>{industryOpen?'收起产业归属':'向上展开产业归属'}<Icon name="up" size={12}/></button>
    </MapNode>
   </div>
   {abilitiesOpen&&<div className="competency-abilities" id={`${uid}-abilities`}>
    <div className="competency-ability-branch"><i/><span>关联本学习任务的能力项 · {abilities.length} 项</span></div>
    <div className="competency-ability-grid">{abilities.map(a=><article className="competency-ability" key={a.id}>
     <span className={`competency-category ${a.category==='技能'?'skill':a.category==='素养'?'quality':'knowledge'}`}>{a.category||'能力'}</span>
     <div><strong>{a.title}</strong><small>{a.id}{a.locator?` · ${a.locator}`:''}</small></div>
    </article>)}</div>
    {!abilities.length&&<div className="competency-empty">当前学习任务尚未关联能力项</div>}
   </div>}
  </div>
 </section>;
}
