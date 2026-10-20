import { Icon } from './Icon';
import { isLinked } from '../resources/model.mjs';
import './simulation-cards.css';

export function SimulationCards({rows,task,selected,toggle}) {
 return <div className="simulation-grid">{rows.map(item=>{
  const linked=isLinked(task,'simulation',item),checked=linked||selected.includes(item.id);
  return <label key={item.id} className={`simulation-card ${checked?'selected':''} ${linked?'already-linked':''}`}>
   <div className="simulation-cover">
    <img src={item.cover} alt={`${item.name}封面`}/>
    <span className="simulation-provider" title={`资源提供企业：${item.providerName}`}><Icon name="external" size={12}/>{item.providerName}</span>
    <input type="checkbox" aria-label={`选择${item.name}`} checked={checked} disabled={linked} onChange={()=>toggle(item)}/>
   </div>
   <div className="simulation-card-body">
    <span className="simulation-kind">{item.kind}</span>
    <h3 title={item.name}>{item.name}</h3>
    <div className="simulation-card-meta"><span><Icon name="users" size={15}/>学习人数 <strong>{item.learners.toLocaleString('zh-CN')}</strong></span>{linked&&<small>已关联</small>}</div>
   </div>
  </label>;
 })}</div>;
}
