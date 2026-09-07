import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export const contentSources = {
 knowledge: { label: '知识点', icon: 'target', type: '目标', scored: true, description: '添加知识点及其学习单元，不含子节点' },
 unit: { label: '学习单元', icon: 'book', type: '学习单元', scored: true, description: '可从课程资源包选择学习单元添加' },
 library: { label: '知识库', icon: 'stack', type: '拓展学习', scored: false },
 cloud: { label: '云盘', icon: 'cloud', type: '拓展学习', scored: false },
 file: { label: '本地文件', icon: 'attachment', type: '拓展学习', scored: false },
};

export function TaskContentMenu({ onSelect }) {
 const [expanded, setExpanded] = useState(false);
 const [position, setPosition] = useState({ left: 0, top: 0 });
 const trigger = useRef(null), menu = useRef(null);
 const menuId = useId();
 const dismiss = (restoreFocus = false) => { setExpanded(false); if (restoreFocus) trigger.current?.focus(); };
 useLayoutEffect(() => {
  if (!expanded) return;
  const place = () => {
   const anchor = trigger.current.getBoundingClientRect();
   const width = Math.min(440, window.innerWidth - 24);
   const height = Math.min(menu.current.scrollHeight, window.innerHeight - 24);
   const below = anchor.bottom + 12;
   const top = below + height <= window.innerHeight - 12 ? below : Math.max(12, anchor.top - height - 12);
   setPosition({ width, left: Math.max(12, Math.min(anchor.left + (anchor.width - width) / 2, window.innerWidth - width - 12)), top, maxHeight: window.innerHeight - top - 12 });
  };
  place();
  menu.current.querySelector('button')?.focus({ preventScroll: true });
  const outside = e => { if (!menu.current?.contains(e.target) && !trigger.current?.contains(e.target)) dismiss(); };
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
  observer?.observe(trigger.current);
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);
  document.addEventListener('pointerdown', outside);
  return () => { observer?.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); document.removeEventListener('pointerdown', outside); };
 }, [expanded]);
 const keyDown = e => {
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dismiss(true); }
  const items = [...menu.current.querySelectorAll('[role="menuitem"]')];
  let index = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') index = (index + 1) % items.length;
  else if (e.key === 'ArrowUp') index = (index - 1 + items.length) % items.length;
  else if (e.key === 'Home') index = 0;
  else if (e.key === 'End') index = items.length - 1;
  else return;
  e.preventDefault(); items[index]?.focus();
 };
 const option = source => {
  const item = contentSources[source];
  return <button type="button" key={source} role="menuitem" aria-label={item.label} className={`task-content-option source-${source}`} onClick={() => { dismiss(true); onSelect(source); }}>
   <span className="task-content-icon"><Icon name={item.icon} size={item.scored ? 21 : 17}/></span>
   <span><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</span>
  </button>;
 };
 return <><button type="button" ref={trigger} className="add-content" aria-haspopup="menu" aria-expanded={expanded} aria-controls={expanded ? menuId : undefined} onClick={() => setExpanded(value => !value)}>添加任务内容</button>
 {expanded && createPortal(<div ref={menu} id={menuId} role="menu" aria-label="添加任务内容" className="task-content-menu" style={position} onKeyDown={keyDown} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget) && e.relatedTarget !== trigger.current) dismiss(); }}>
  <div role="group" aria-label="计分"><p className="task-content-heading"><strong>计分</strong><span>（学习记录可同步至班级）</span></p><div className="task-content-scored">{option('knowledge')}{option('unit')}</div></div>
  <div role="group" aria-label="不计分"><p className="task-content-heading"><strong>不计分</strong><span>（仅可查看学习，不记录学习进度）</span></p><div className="task-content-resources">{['library', 'cloud', 'file'].map(option)}</div></div>
 </div>, document.body)}</>;
}
