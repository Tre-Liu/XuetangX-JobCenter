import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon';

export function GenerationMenu({ onSelect, industryEnabled=false }) {
 const [expanded, setExpanded] = useState(false);
 const root = useRef(null), trigger = useRef(null), menu = useRef(null);
 const menuId = useId();
 useEffect(() => {
  if (!expanded) return;
  menu.current?.querySelector('button')?.focus();
  const outside = event => { if (!root.current?.contains(event.target)) setExpanded(false); };
  document.addEventListener('pointerdown', outside);
  return () => document.removeEventListener('pointerdown', outside);
 }, [expanded]);
 const close = () => { setExpanded(false); trigger.current?.focus(); };
 const keyDown = event => {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
  const items = [...menu.current.querySelectorAll('button')];
  const current = items.indexOf(document.activeElement);
  const index = event.key === 'ArrowDown' ? (current + 1) % items.length : event.key === 'ArrowUp' ? (current - 1 + items.length) % items.length : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : -1;
  if (index >= 0) { event.preventDefault(); items[index].focus(); }
 };
 if(!industryEnabled)return <button type="button" onClick={()=>onSelect('generate')}><Icon name="sparkle"/>AI 生成框架</button>;
 return <div ref={root} className="generation-menu-wrap" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false); }}>
  <button type="button" ref={trigger} aria-haspopup="menu" aria-expanded={expanded} aria-controls={expanded ? menuId : undefined} onClick={() => setExpanded(value => !value)} onKeyDown={event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setExpanded(true); } }}><Icon name="sparkle"/>AI 生成框架<Icon name="down" size={13}/></button>
  {expanded && <div ref={menu} id={menuId} role="menu" aria-label="框架生成方式" className="generation-menu" onKeyDown={keyDown}>
   {[['generate-job', '岗位任务驱动', '基于岗位典型工作任务与能力项', 'users'], ['generate', '项目主题驱动', '基于当前项目主题生成阶段与任务', 'book']].map(([type, label, description, icon]) => <button type="button" role="menuitem" aria-label={label} key={type} onClick={() => { close(); onSelect(type); }}><Icon name={icon} size={20}/><span><strong>{label}</strong><small>{description}</small></span></button>)}
  </div>}
 </div>;
}
