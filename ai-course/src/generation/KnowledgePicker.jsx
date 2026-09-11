import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Icon} from '../components/Icon';

export function KnowledgePicker({task,nodes,selected,onConfirm,onClose}){
 const [draft,setDraft]=useState(()=>[...selected]);
 const panel=useRef(null);
 useEffect(()=>{
  const previous=document.activeElement;
  const element=panel.current;
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
 const toggle=id=>setDraft(values=>values.includes(id)?values.filter(value=>value!==id):[...values,id]);
 const nodeMap=new Map(nodes.map(node=>[node.id,node]));
 const parentOf=node=>{const parent=nodeMap.get(node.parentId);return parent&&parent.level<node.level?parent.id:null;};
 const renderNode=node=>{
  const children=nodes.filter(child=>parentOf(child)===node.id);
  const row=<label className="knowledge-tree-label"><input type="checkbox" aria-label={`选择${node.name}`} checked={draft.includes(node.id)} onChange={()=>toggle(node.id)}/><span>{node.name}</span><small>{node.level}级</small></label>;
  return <div className="knowledge-tree-node" key={node.id}>{children.length?<details open={node.level===2}><summary><span>{node.name}</span><small>{children.length} 个下级节点</small></summary>{row}<div className="knowledge-tree-children">{children.map(renderNode)}</div></details>:row}</div>;
 };
 const valid=draft.filter(id=>nodeMap.has(id));
 return createPortal(<div className="knowledge-picker-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section className="knowledge-picker-drawer" ref={panel} role="dialog" aria-modal="true" aria-label="选择知识点">
   <header><h3>选择知识点</h3><button className="icon-button" aria-label="关闭知识点选择" onClick={onClose}><Icon name="close"/></button></header>
   <div className="knowledge-picker-task"><small>当前任务</small><strong>{task.title}</strong><p>按图谱层级展开并勾选，选择上级不会自动选择下级。</p></div>
   <div className="knowledge-picker-tree">{nodes.filter(node=>!parentOf(node)).map(renderNode)}{!nodes.length&&<p>暂无可用知识点</p>}</div>
   <footer><span>已选 {valid.length} 个知识点</span><button className="outlined" onClick={onClose}>取消</button><button className="primary" onClick={()=>onConfirm(valid)}>确认选择</button></footer>
  </section>
 </div>,document.body);
}
