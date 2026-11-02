import { useEffect, useState, type CSSProperties } from 'react';
import { ChevronDownIcon, ChevronRightIcon, Cross2Icon, ListBulletIcon, MagnifyingGlassIcon, MixerHorizontalIcon } from '@radix-ui/react-icons';
import { BottomSheet, Carousel, KeyboardInput, MobileScroll, useKeyboard } from './mobile';

export type DirectoryNode = { id:string; name:string; description:string; keywords?:string; parentId?:string|null; kinds?:string[] };
export function DirectoryButton({ onClick }: { onClick: () => void }) {
 return <button className="graph-directory-trigger" onClick={onClick}><ListBulletIcon/>目录</button>;
}
export default function GraphDirectory({open,onOpenChange,title,course,noun,items,onLocate}:{
 open:boolean;onOpenChange:(open:boolean)=>void;title:string;course:string;noun:string;
 items:DirectoryNode[];onLocate:(id:string)=>void;
}) {
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('全部'),[filterOpen,setFilterOpen]=useState(false);
 const [expanded,setExpanded]=useState<Set<string>>(()=>new Set()),[recent,setRecent]=useState<string[]>([]);
 const keyboard=useKeyboard();
 useEffect(()=>{if(open){setQuery('');setFilter('全部');setFilterOpen(false)}},[open]);
 const close=()=>{keyboard.hide();onOpenChange(false)};
 const byId=new Map(items.map(item=>[item.id,item]));
 const children=(id:string)=>items.filter(item=>item.parentId===id);
 const depth=(item:DirectoryNode)=>{let level=0,parent=item.parentId;const seen=new Set([item.id]);while(parent&&byId.has(parent)&&!seen.has(parent)){seen.add(parent);level++;parent=byId.get(parent)?.parentId}return level};
 const searching=!!query.trim()||filter!=='全部';
 const matches=items.filter(item=>{
  if(!`${item.name} ${item.keywords||''}`.toLowerCase().includes(query.trim().toLowerCase()))return false;
  if(filter!=='全部'&&!item.kinds?.includes(filter))return false;
  if(searching)return true;
  let parent=item.parentId;const seen=new Set([item.id]);
  while(parent&&byId.has(parent)&&!seen.has(parent)){if(!expanded.has(parent))return false;seen.add(parent);parent=byId.get(parent)?.parentId}
  return true;
 });
 const visit=(id:string)=>{setRecent(prev=>[id,...prev.filter(value=>value!==id)].slice(0,5));close();onLocate(id)};
 return <BottomSheet open={open} onOpenChange={value=>{keyboard.hide();onOpenChange(value)}} title={title} description={`${course} · ${items.length} 个${noun}`} snap={.84}>
  <div className="graph-directory-content">
   <button className="directory-close" aria-label="关闭目录" onClick={close}><Cross2Icon/></button>
   {!!recent.length&&<div className="directory-recent"><span>最近访问：</span><Carousel>{recent.map(id=>byId.get(id)).filter((item):item is DirectoryNode=>!!item).map(item=><button key={item.id} aria-label={`最近访问${item.name}`} onClick={()=>visit(item.id)}>{item.name}</button>)}</Carousel></div>}
   <div className="directory-search-row"><div className="search-field"><MagnifyingGlassIcon/><KeyboardInput aria-label={`搜索${noun}名称`} placeholder={`搜索${noun}`} value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button aria-label="清空搜索" onClick={()=>setQuery('')}><Cross2Icon/></button>}</div><button className="directory-filter-trigger" aria-label="筛选学习内容类型" aria-expanded={filterOpen} onClick={()=>{keyboard.hide();setFilterOpen(!filterOpen)}}><MixerHorizontalIcon/>{filter==='全部'?'筛选':filter}</button>
    {filterOpen&&<><button className="directory-filter-dismiss" aria-label="收起内容筛选" onClick={()=>setFilterOpen(false)}/><nav className="directory-filter-options" aria-label="学习内容类型">{['全部','视频','图文','课件','讨论','作业','自测','考试'].map(kind=><button key={kind} aria-pressed={filter===kind} onClick={()=>{keyboard.hide();setFilter(kind);setFilterOpen(false)}}>{kind}<span>{filter===kind?'✓':''}</span></button>)}</nav></>}
   </div>
   <p className="graph-directory-count" role="status">{searching?`找到 ${matches.length} 个${noun}`:`共 ${items.length} 个${noun}`}</p>
   <MobileScroll className="directory-scroll"><div className="directory-tree" aria-label={title}>{matches.map(item=>{const count=children(item.id).length,isOpen=expanded.has(item.id);return <div className="directory-tree-row" key={item.id} style={{'--node-depth':searching?0:depth(item)} as CSSProperties}>
    {count>0&&!searching?<button className="directory-expand" aria-label={`${isOpen?'收起':'展开'}${item.name}`} aria-expanded={isOpen} onClick={()=>setExpanded(prev=>{const next=new Set(prev);next.has(item.id)?next.delete(item.id):next.add(item.id);return next})}>{isOpen?<ChevronDownIcon/>:<ChevronRightIcon/>}</button>:<span className="directory-leaf-mark"/>}
    <button className="directory-select" aria-label={`查看${item.name}`} onClick={()=>visit(item.id)}><b>{item.name}</b><small>{searching?item.description:count?`${count} 个下级节点`:item.description}</small></button>
    <ChevronRightIcon className="directory-row-arrow"/>
   </div>})}{!matches.length&&<p className="empty">没有找到相关{noun}，请换个关键词或内容类型</p>}</div></MobileScroll>
  </div>
 </BottomSheet>;
}
