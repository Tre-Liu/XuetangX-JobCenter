import { useKnowledgeEnabled } from '../knowledge/availability.mjs';
import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { isLinked, nodeResources } from '../resources/model.mjs';
import { courseAssessmentAgents } from '../resources/assessment-agents.mjs';
import { courseVirtualSimulations } from '../resources/virtual-simulations.mjs';
import { SimulationCards } from './SimulationCards';
import './content-association.css';

export function ContentAssociation({ source, graph, resources, task, onClose, onConfirm, courseName }) {
 const knowledge = source === 'knowledge', agent = source === 'agent', simulation = source === 'simulation';
 const nameLabel = knowledge ? '搜索知识点' : agent ? '智能体名称' : simulation ? '虚仿实验名称' : '学习单元名称';
 const categoryLabel = knowledge ? '知识点层级' : agent ? '评测类型' : simulation ? '实验类型' : '学习单元类型';
 const knowledgeEnabled = useKnowledgeEnabled();
 const [name, setName] = useState(''), [category, setCategory] = useState('');
 const [filter, setFilter] = useState({name:'',category:''});
 const [selected, setSelected] = useState([]);
 const scroller = useRef(null);
 useEffect(()=>{if(knowledge&&!knowledgeEnabled)setSelected([]);},[knowledge,knowledgeEnabled]);
 const items = knowledge ? (knowledgeEnabled?graph.nodes.filter(node=>node.level>1):[]) : agent ? courseAssessmentAgents.filter(item=>item.courseName===courseName) : simulation ? courseVirtualSimulations.filter(item=>item.courseName===courseName) : resources;
 const rows = items.filter(item=>(!filter.name||item.name.toLowerCase().includes(filter.name.toLowerCase()))&&(!filter.category||String(knowledge?item.level:item.kind)===filter.category));
 const available = rows.filter(item=>!isLinked(task,source,item));
 const all = available.length>0 && available.every(item=>selected.includes(item.id));
 const some = available.some(item=>selected.includes(item.id));
 const toggle = item => setSelected(previous=>previous.includes(item.id)?previous.filter(id=>id!==item.id):[...previous,item.id]);
 const toggleAll = () => setSelected(previous=>all ? previous.filter(id=>!available.some(item=>item.id===id)) : [...new Set([...previous,...available.map(item=>item.id)])]);
 const query = event => {event.preventDefault();setFilter({name:name.trim(),category});if(scroller.current)scroller.current.scrollTop=0;};
 const counts = node => {
  const attached = nodeResources(node.id,resources);
  return `图文${attached.filter(item=>item.kind==='图文').length}个、视频${attached.filter(item=>item.kind==='视频').length}个`;
 };
 return <Modal title={knowledge?'关联知识点':agent?'关联评测智能体':simulation?'关联虚拟仿真实验':'关联课程资源'} className={`content-association-modal ${simulation?'simulation-association-modal':''}`} onClose={onClose} footer={<>
  {selected.length>0&&<span className="association-selection" role="status">已选择 {selected.length} 项</span>}
  <button className="outlined" onClick={onClose}>取消</button><button className="primary" disabled={!selected.length||(knowledge&&!knowledgeEnabled)} onClick={()=>onConfirm(selected)}>确定</button>
 </>}>
  {agent&&<p className="agent-course-context">{courseName} · 选择要添加到当前任务的评测智能体</p>}
  {simulation&&<div className="simulation-list-context"><strong>{courseName} · 选择要添加到当前任务的虚仿实验</strong><span>企业实验资源</span></div>}
  <form className="association-filters" onSubmit={query}>
   <input aria-label={nameLabel} placeholder={nameLabel} value={name} onChange={event=>setName(event.target.value)}/>
   <select aria-label={categoryLabel} className={!category?'placeholder':''} value={category} onChange={event=>setCategory(event.target.value)}>
    <option value="">{categoryLabel}</option>
    {knowledge?[2,3,4].map(level=><option key={level} value={level}>{level}级知识点</option>):(agent||simulation?[...new Set(items.map(item=>item.kind))]:['图文','视频']).map(kind=><option key={kind}>{kind}</option>)}
   </select>
   <button className="outlined" type="submit">查询</button>
  </form>
  <div className="association-table-scroll" ref={scroller}>
   {simulation?<SimulationCards rows={rows} task={task} selected={selected} toggle={toggle}/>:<table className={`association-table ${knowledge?'knowledge-associations':agent?'agent-associations':'unit-associations'}`}>
    <colgroup><col className="association-check-col"/>{knowledge&&<col className="association-level-col"/>}<col/><col className="association-info-col"/></colgroup>
    <thead><tr><th><input type="checkbox" aria-label="全选查询结果" checked={all} disabled={!available.length} ref={element=>{if(element)element.indeterminate=some&&!all;}} onChange={toggleAll}/></th>{knowledge&&<th scope="col">知识点层级</th>}<th scope="col">{knowledge?'知识点名称':agent?'智能体名称':'学习单元名称'}</th><th scope="col">{knowledge?'学习内容':agent?'评测内容':'学习单元类型'}</th></tr></thead>
    <tbody>{rows.map(item=>{
     const linked=isLinked(task,source,item),checked=linked||selected.includes(item.id);
     return <tr key={item.id} className={`${checked?'selected':''} ${linked?'already-linked':''}`} onClick={()=>{if(!linked)toggle(item);}}>
      <td><input type="checkbox" aria-label={`选择${item.name}`} checked={checked} disabled={linked} onClick={event=>event.stopPropagation()} onChange={()=>toggle(item)}/></td>
      {knowledge&&<td>{item.level}级知识点</td>}<td>{item.name}{linked&&<small className="association-linked-label">已关联</small>}</td><td>{knowledge?counts(item):agent?<><strong className="agent-assessment-kind">{item.kind}</strong><span className="agent-assessment-description">{item.description}</span></>:item.kind}</td>
     </tr>;
    })}</tbody>
   </table>}
   {!rows.length&&<div className="association-empty" role="status">{knowledge?(knowledgeEnabled?'暂无匹配的知识点':'暂无知识点'):agent?'暂无匹配的评测智能体':simulation?'暂无匹配的虚仿实验':'暂无匹配的学习单元'}</div>}
  </div>
 </Modal>;
}
