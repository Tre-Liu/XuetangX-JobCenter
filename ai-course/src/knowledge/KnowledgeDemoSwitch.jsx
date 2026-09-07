import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { setKnowledgeEnabled, useKnowledgeEnabled } from './availability.mjs';
import './demo-switch.css';

export function KnowledgeDemoSwitch() {
 const enabled = useKnowledgeEnabled();
 const [open, setOpen] = useState(false), [notice, setNotice] = useState('');
 const container = useRef(null), trigger = useRef(null), panel = useRef(null);
 useEffect(() => {
  if (!open) return;
  panel.current?.querySelector('[aria-pressed="true"]')?.focus();
  const outside = e => {if (!container.current?.contains(e.target)) setOpen(false);};
  const escape = e => {if (e.key === 'Escape') {setOpen(false); trigger.current?.focus();}};
  document.addEventListener('pointerdown', outside);
  document.addEventListener('keydown', escape);
  return () => {document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape);};
 }, [open]);
 useEffect(() => {if (notice) {const timer=setTimeout(()=>setNotice(''),3200);return()=>clearTimeout(timer);}}, [notice]);
 const select = value => {
  const persisted = setKnowledgeEnabled(value);
  setOpen(false); trigger.current?.focus();
  setNotice(`${value?'已切换为有知识点':'已切换为无知识点'}${persisted?'':'，当前浏览器无法记住此设置'}`);
 };
 return <>
  <div ref={container} className={`knowledge-demo-switch ${open?'is-open':''}`}>
   {open&&<div ref={panel} role="dialog" aria-label="知识点演示设置" className="knowledge-demo-panel">
    <strong>知识点</strong>
    <div>{[[true,'有知识点'],[false,'无知识点']].map(([value,label])=><button key={String(value)} type="button" data-knowledge-enabled={value} aria-pressed={enabled===value} onClick={()=>select(value)}>{label}{enabled===value&&<Icon name="check" size={14}/>}</button>)}</div>
   </div>}
   <button ref={trigger} className="knowledge-demo-trigger" type="button" aria-label="知识点演示设置" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(!open)}><span aria-hidden="true">···</span></button>
  </div>
  {notice&&<div className="toast" role="status"><Icon name="check"/>{notice}</div>}
 </>;
}

export function EmptyKnowledgeGraph({onResources, onProject}) {
 return <section className="knowledge-board" aria-label="课程知识图谱">
  <aside className="kg-stat-card"><h2>知识点总量（条）</h2><strong className="kg-total">0</strong></aside>
  <div className="kg-empty-state"><Icon name="graph" size={48}/><h2>暂无知识点</h2><p>课程尚未建设知识图谱，项目任务中暂无可关联的知识点。</p><div><button className="outlined" onClick={onResources}>管理资源</button><button className="primary" onClick={onProject}>进入项目式学习</button></div></div>
 </section>;
}
