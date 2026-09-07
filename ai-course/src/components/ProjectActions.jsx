import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export function ProjectActions({ project, onEdit, onDelete }) {
 const [expanded, setExpanded] = useState(false);
 const [position, setPosition] = useState({ left: 0, top: 0 });
 const trigger = useRef(null), menu = useRef(null), menuId = useId();
 const dismiss = (restore = false) => { setExpanded(false); if (restore) trigger.current?.focus({ preventScroll: true }); };
 useLayoutEffect(() => {
  if (!expanded) return;
  const place = () => {
   const anchor = trigger.current.getBoundingClientRect();
   const width = 132, height = menu.current.offsetHeight;
   const top = anchor.bottom + 8;
   setPosition({ left: Math.max(12, Math.min(anchor.left + 16, window.innerWidth - width - 12)), top: top + height <= window.innerHeight - 12 ? top : Math.max(12, anchor.top - height - 8) });
  };
  place(); menu.current.querySelector('button')?.focus({ preventScroll: true });
  const outside = event => { if (!menu.current?.contains(event.target) && !trigger.current?.contains(event.target)) dismiss(); };
  window.addEventListener('resize', place); window.addEventListener('scroll', place, true); document.addEventListener('pointerdown', outside);
  return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); document.removeEventListener('pointerdown', outside); };
 }, [expanded]);
 const keyDown = event => {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(true); return; }
  const items = [...menu.current.querySelectorAll('button')];
  const index = items.indexOf(document.activeElement);
  const next = event.key === 'ArrowDown' ? (index + 1) % items.length : event.key === 'ArrowUp' ? (index - 1 + items.length) % items.length : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : null;
  if (next !== null) { event.preventDefault(); items[next].focus(); }
 };
 return <>
  <button ref={trigger} type="button" className={`project-more icon-button ${expanded?'expanded':''}`} aria-label={`${project.title}的更多操作`} aria-haspopup="menu" aria-expanded={expanded} aria-controls={expanded?menuId:undefined} onClick={()=>setExpanded(value=>!value)}><Icon name="more" size={19}/></button>
  {expanded&&createPortal(<div ref={menu} id={menuId} role="menu" aria-label={`${project.title}的操作`} className="project-actions-menu" style={position} onKeyDown={keyDown} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)&&event.relatedTarget!==trigger.current)dismiss();}}>
   <button role="menuitem" onClick={()=>{dismiss(true);onEdit(project);}}><Icon name="edit" size={17}/>编辑</button>
   <button role="menuitem" className="delete-project-action" onClick={()=>{dismiss(true);onDelete(project);}}><Icon name="trash" size={17}/>删除</button>
  </div>,document.body)}
 </>;
}
