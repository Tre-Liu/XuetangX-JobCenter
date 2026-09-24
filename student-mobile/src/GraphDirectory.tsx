import { useState } from 'react';
import { ChevronRightIcon, ListBulletIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { BottomSheet, KeyboardInput, useKeyboard } from './mobile';

export type DirectoryNode = { id: string; name: string; description: string; keywords?: string };
export function DirectoryButton({ onClick }: { onClick: () => void }) {
 return <button className="graph-directory-trigger" onClick={onClick}><ListBulletIcon/>目录</button>;
}
export default function GraphDirectory({open,onOpenChange,title,course,noun,items,onLocate}:{
 open:boolean;onOpenChange:(open:boolean)=>void;title:string;course:string;noun:string;
 items:DirectoryNode[];onLocate:(id:string)=>void;
}) {
 const [query,setQuery]=useState('');
 const keyboard=useKeyboard();
 const close=()=>{keyboard.hide();onOpenChange(false)};
 const matches=items.filter(item=>`${item.name} ${item.keywords||''}`.toLowerCase().includes(query.trim().toLowerCase()));
 return <BottomSheet open={open} onOpenChange={value=>{keyboard.hide();onOpenChange(value)}} title={title} description={`${course} · 按名称搜索和定位${noun}`} snap={.78}>
  <button className="sheet-close" onClick={close}>关闭目录</button>
  <div className="search-field"><MagnifyingGlassIcon/><KeyboardInput aria-label={`搜索${noun}名称`} placeholder={`搜索${noun}名称`} value={query} onChange={event=>setQuery(event.target.value)}/></div>
  <p className="graph-directory-count" role="status">{query.trim()?`找到 ${matches.length} 个节点`:`共 ${items.length} 个节点`}</p>
  <div className="node-list graph-directory-list">{matches.map(item=><button key={item.id} onClick={()=>{close();onLocate(item.id)}}><span><b>{item.name}</b><small>{item.description}</small></span><ChevronRightIcon/></button>)}{!matches.length&&<p className="empty">没有找到相关{noun}，请换个关键词</p>}</div>
 </BottomSheet>;
}
