import {useEffect,useRef,useState} from 'react';
import {MAX_KNOWLEDGE_POINTS} from './knowledge-matching.mjs';
import {createPortal} from 'react-dom';
import {Icon} from '../components/Icon';
import './knowledge-matching.css';

export function KnowledgePicker({task,nodes,selected,onConfirm,onClose}){
 const [draft,setDraft]=useState(()=>[...new Set(selected)].filter(id=>nodes.some(node=>node.id===id)).slice(0,MAX_KNOWLEDGE_POINTS));
 const [query,setQuery]=useState('');
 const panel=useRef(null);
 useEffect(()=>{
  const previous=document.activeElement,element=panel.current;
  const focusables=()=>[...element.querySelectorAll('button,input,summary')].filter(node=>!node.disabled&&!node.closest('details:not([open]) .knowledge-tree-children'));
  focusables()[0]?.focus();
  const key=event=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();}
   if(event.key==='Tab'){
    const items=focusables(),first=items[0],last=items.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
   }
  };
  element.addEventListener('keydown',key);
  return ()=>{element.removeEventListener('keydown',key);previous?.focus();};
 },[]);
 const toggle=id=>setDraft(values=>values.includes(id)?values.filter(value=>value!==id):values.length<MAX_KNOWLEDGE_POINTS?[...values,id]:values);
 const nodeMap=new Map(nodes.map(node=>[node.id,node]));
 const parentOf=node=>{const parent=nodeMap.get(node.parentId);return parent&&parent.level<node.level?parent.id:null;};
 const visibleIds=new Set();
 for(const node of nodes.filter(node=>node.name.toLowerCase().includes(query.trim().toLowerCase()))){let current=node;while(current&&!visibleIds.has(current.id)){visibleIds.add(current.id);current=nodeMap.get(parentOf(current));}}
 const renderNode=node=>{
  const children=nodes.filter(child=>parentOf(child)===node.id&&visibleIds.has(child.id));
  const row=<label className="knowledge-tree-label"><input type="checkbox" aria-label={`选择${node.name}`} checked={draft.includes(node.id)} disabled={!draft.includes(node.id)&&draft.length>=MAX_KNOWLEDGE_POINTS} onChange={()=>toggle(node.id)}/><span>{node.name}</span></label>;
  return <div className="knowledge-tree-node" key={node.id}>{children.length?<details open={!!query.trim()||node.level===2}><summary><span>{node.name}</span></summary>{row}<div className="knowledge-tree-children">{children.map(renderNode)}</div></details>:row}</div>;
 };
 const valid=draft.filter(id=>nodeMap.has(id));
 return createPortal(<div className="knowledge-picker-backdrop knowledge-picker-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section className="knowledge-picker-drawer knowledge-picker-dialog" ref={panel} role="dialog" aria-modal="true" aria-label="关联知识点">
   <header><h3>关联知识点</h3><button type="button" className="icon-button" aria-label="关闭知识点选择" onClick={onClose}><Icon name="close"/></button></header>
   <div className="knowledge-picker-task"><strong>{task.title}</strong></div>
   <div className="knowledge-picker-columns">
    <section className="knowledge-picker-tree-panel"><h4>课程知识图谱</h4><label className="knowledge-picker-search"><Icon name="search" size={16}/><input aria-label="搜索知识点" placeholder="搜索知识点名称" value={query} onChange={event=>setQuery(event.target.value)}/></label><div className="knowledge-picker-tree">{nodes.filter(node=>!parentOf(node)&&visibleIds.has(node.id)).map(renderNode)}{!nodes.length&&<p>暂无可用知识点</p>}{nodes.length>0&&!visibleIds.size&&<p>未找到相关知识点</p>}</div></section>
    <section className="knowledge-picker-selected"><h4>已选知识点 <small>{valid.length} / {MAX_KNOWLEDGE_POINTS}</small></h4><ul>{valid.map(nodeId=><li key={nodeId}><Icon name="book" size={15}/><span>{nodeMap.get(nodeId).name}</span><button type="button" aria-label={`移除已选知识点${nodeMap.get(nodeId).name}`} onClick={()=>toggle(nodeId)}><Icon name="close" size={15}/></button></li>)}</ul>{!valid.length&&<p>暂无已选知识点</p>}</section>
   </div>
   <footer><span>每个任务最多关联 {MAX_KNOWLEDGE_POINTS} 个知识点</span><button type="button" className="outlined" onClick={onClose}>取消</button><button type="button" className="primary" onClick={()=>onConfirm(valid)}>确定关联</button></footer>
  </section>
 </div>,document.body);
}
