import { useEffect, useId, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon, MagicWandIcon, Share2Icon, Component1Icon, CircleIcon } from '@radix-ui/react-icons';
import { useKeyboard } from './mobile';
import { knowledgeViewModes, type KnowledgeViewMode } from './knowledge-layout';

const icons={custom:MagicWandIcon,tree:Share2Icon,network:Component1Icon,ring:CircleIcon};
export default function KnowledgeViewPicker({value,onChange}:{value:KnowledgeViewMode;onChange:(value:KnowledgeViewMode)=>void}){
 const [open,setOpen]=useState(false);
 const host=useRef<HTMLSpanElement>(null),trigger=useRef<HTMLButtonElement>(null),menu=useRef<HTMLSpanElement>(null);
 const id=useId(),keyboard=useKeyboard();
 const close=()=>{setOpen(false);trigger.current?.focus({preventScroll:true})};
 useEffect(()=>{
  if(!open)return;
  menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus({preventScroll:true});
  const outside=(event:PointerEvent)=>{if(!host.current?.contains(event.target as Node))setOpen(false)};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close()}};
  document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape)};
 },[open]);
 const current=knowledgeViewModes.find(mode=>mode.id===value)!;
 return <span className="knowledge-view-picker" ref={host} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setOpen(false)}}>
  <button ref={trigger} className="knowledge-view-trigger" aria-label={`切换知识图谱视图，当前${current.name}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>{keyboard.hide();setOpen(!open)}}>{current.name}<ChevronDownIcon/></button>
  {open&&<span ref={menu} id={id} role="menu" aria-label="知识图谱视图" className="knowledge-view-menu" onKeyDown={event=>{
   if(event.key==='Tab'){setOpen(false);return;}
   if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
   event.preventDefault();const items=Array.from(menu.current!.querySelectorAll<HTMLButtonElement>('button')),index=items.indexOf(document.activeElement as HTMLButtonElement);
   const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next].focus({preventScroll:true});
  }}>
   {knowledgeViewModes.map(mode=>{const Icon=icons[mode.id];return <button key={mode.id} role="menuitemradio" aria-checked={value===mode.id} onClick={()=>{onChange(mode.id);close()}}><Icon/><span>{mode.name}</span>{value===mode.id&&<CheckIcon className="knowledge-view-check"/>}</button>})}
  </span>}
 </span>;
}
