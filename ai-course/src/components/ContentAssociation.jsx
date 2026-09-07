import { useKnowledgeEnabled } from '../knowledge/availability.mjs';
import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { isLinked, nodeResources } from '../resources/model.mjs';
import './content-association.css';

export function ContentAssociation({ source, graph, resources, task, onClose, onConfirm }) {
 const knowledge = source === 'knowledge';
 const knowledgeEnabled = useKnowledgeEnabled();
 const [name, setName] = useState(''), [category, setCategory] = useState('');
 const [filter, setFilter] = useState({name:'',category:''});
 const [selected, setSelected] = useState([]);
 const scroller = useRef(null);
 useEffect(()=>{if(knowledge&&!knowledgeEnabled)setSelected([]);},[knowledge,knowledgeEnabled]);
 const items = knowledge ? (knowledgeEnabled?graph.nodes.filter(node=>node.level>1):[]) : resources;
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
 return <Modal title={knowledge?'关联知识点':'关联课程资源'} className="content-association-modal" onClose={onClose} footer={<>
  {selected.length>0&&<span className="association-selection" role="status">已选择 {selected.length} 项</span>}
  <button className="outlined" onClick={onClose}>取消</button><button className="primary" disabled={!selected.length||(knowledge&&!knowledgeEnabled)} onClick={()=>onConfirm(selected)}>确定</button>
 </>}>
  <form className="association-filters" onSubmit={query}>
   <input aria-label={knowledge?'搜索知识点':'学习单元名称'} placeholder={knowledge?'搜索知识点':'学习单元名称'} value={name} onChange={event=>setName(event.target.value)}/>
   <select aria-label={knowledge?'知识点层级':'学习单元类型'} className={!category?'placeholder':''} value={category} onChange={event=>setCategory(event.target.value)}>
    <option value="">{knowledge?'知识点层级':'学习单元类型'}</option>
    {knowledge?[2,3,4].map(level=><option key={level} value={level}>{level}级知识点</option>):['图文','视频'].map(kind=><option key={kind}>{kind}</option>)}
   </select>
   <button className="outlined" type="submit">查询</button>
  </form>
  <div className="association-table-scroll" ref={scroller}>
   <table className={`association-table ${knowledge?'knowledge-associations':'unit-associations'}`}>
    <colgroup><col className="association-check-col"/>{knowledge&&<col className="association-level-col"/>}<col/><col className="association-info-col"/></colgroup>
    <thead><tr><th><input type="checkbox" aria-label="全选查询结果" checked={all} disabled={!available.length} ref={element=>{if(element)element.indeterminate=some&&!all;}} onChange={toggleAll}/></th>{knowledge&&<th scope="col">知识点层级</th>}<th scope="col">{knowledge?'知识点名称':'学习单元名称'}</th><th scope="col">{knowledge?'学习内容':'学习单元类型'}</th></tr></thead>
    <tbody>{rows.map(item=>{
     const linked=isLinked(task,source,item),checked=linked||selected.includes(item.id);
     return <tr key={item.id} className={`${checked?'selected':''} ${linked?'already-linked':''}`} onClick={()=>{if(!linked)toggle(item);}}>
      <td><input type="checkbox" aria-label={`选择${item.name}`} checked={checked} disabled={linked} onClick={event=>event.stopPropagation()} onChange={()=>toggle(item)}/></td>
      {knowledge&&<td>{item.level}级知识点</td>}<td>{item.name}{linked&&<small className="association-linked-label">已关联</small>}</td><td>{knowledge?counts(item):item.kind}</td>
     </tr>;
    })}</tbody>
   </table>
   {!rows.length&&<div className="association-empty" role="status">{knowledge?(knowledgeEnabled?'暂无匹配的知识点':'暂无知识点'):'暂无匹配的学习单元'}</div>}
  </div>
 </Modal>;
}
