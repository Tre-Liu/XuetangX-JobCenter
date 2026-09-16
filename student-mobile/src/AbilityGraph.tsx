import { useLayoutEffect, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon, ReaderIcon, VideoIcon, LayersIcon, Cross2Icon, ArrowLeftIcon } from '@radix-ui/react-icons';
import { BottomSheet, KeyboardInput, MobileScroll, useKeyboard, useScreenPortal } from './mobile';
import { abilities, abilityCounts, abilityPath, flattenAbilities, type Ability, type LearningGroup } from './ability-data';
import './ability.css';
import AbilityCanvas from './AbilityCanvas';

type Props={selectedId:string|null;onSelect:(id:string|null)=>void};
export default function AbilityGraph({selectedId,onSelect}:Props){
 const [expanded,setExpanded]=useState(()=>new Set<string>());
 const [search,setSearch]=useState(false),[query,setQuery]=useState('');
 const keyboard=useKeyboard();
 const {screenRef}=useScreenPortal();
 useLayoutEffect(()=>{if(screenRef.current)screenRef.current.scrollTop=0},[selectedId,screenRef]);
 const all=flattenAbilities(),selected=all.find(a=>a.id===selectedId);
 const matches=all.filter(a=>`${a.name} ${a.tag||''}`.toLowerCase().includes(query.trim().toLowerCase()));
 const open=(id:string)=>{keyboard.hide();setSearch(false);onSelect(id)};
 return <div className="ability-view">
  <div className="ability-overview" hidden={!!selected}>
   <div className="ability-toolbar"><div><b>电路原理</b><span>能力层级</span></div><button aria-label="搜索能力" onClick={()=>{keyboard.hide();setSearch(true)}}><MagnifyingGlassIcon/></button><button className="collapse-all" onClick={()=>setExpanded(new Set())}>收起全部</button></div>
   <AbilityCanvas expanded={expanded} onExpanded={setExpanded} onSelect={open}/>
  </div>
  {selected&&<AbilityDetail key={selected.id} node={selected} onSelect={open} onBack={()=>onSelect(null)}/>}
  <BottomSheet open={search} onOpenChange={v=>{keyboard.hide();setSearch(v)}} title="搜索能力" description="按能力名称或标签查找" snap={.8}><div className="ability-search-top"><div className="search-field"><MagnifyingGlassIcon/><KeyboardInput aria-label="能力名称或标签" placeholder="输入能力名称或标签" value={query} onChange={e=>setQuery(e.target.value)}/></div><button aria-label="关闭能力搜索" onClick={()=>{keyboard.hide();setSearch(false)}}><Cross2Icon/></button></div><div className="ability-search-results">{matches.map(a=><button key={a.id} onClick={()=>open(a.id)}><strong>{a.name}</strong><small>{abilityPath(a.id).slice(0,-1).map(p=>p.name).join(' / ')||'课程能力'}</small><ChevronRightIcon/></button>)}{!matches.length&&<p className="empty">没有找到相关能力，请换个关键词</p>}</div></BottomSheet>
 </div>
}
function AbilityDetail({node,onSelect,onBack}:{node:Ability;onSelect:(id:string)=>void;onBack:()=>void}){
 const [tab,setTab]=useState<'learning'|'extra'>('learning');
 const [groups,setGroups]=useState(()=>new Set(node.groups?.slice(0,1).map(g=>g.id)||[]));
 const [resource,setResource]=useState<LearningGroup['units'][number]|null>(null);
 const counts=abilityCounts(node),path=abilityPath(node.id);
 return <div className="ability-detail-page">
  <MobileScroll className="ability-detail-scroll"><main className="ability-detail-content"><button className="back-to-map" onClick={onBack}><ArrowLeftIcon/>返回能力图谱</button>
   <div className="ability-path">{path.slice(0,-1).map(p=><button key={p.id} onClick={()=>onSelect(p.id)}>{p.name}<ChevronRightIcon/></button>)}</div>
   <section className="ability-summary"><h1>{node.name}</h1>{node.tag&&<span className="ability-tag">{node.tag}</span>}{node.description&&<p>{node.description}</p>}<div className="ability-summary-counts"><span><b>{counts.knowledge}</b> 个知识点</span><span><b>{counts.units}</b> 个学习单元</span></div></section>
   <div className="ability-detail-tabs" role="tablist" aria-label="能力内容"><button role="tab" aria-selected={tab==='learning'} onClick={()=>setTab('learning')}>知识点与学习内容</button><button role="tab" aria-selected={tab==='extra'} onClick={()=>setTab('extra')}>拓展资源</button></div>
   {tab==='learning'?<section className="ability-learning" role="tabpanel" aria-label="知识点与学习内容">
    {node.groups?.map((g,i)=><article className="learning-group" key={g.id}><button className="learning-group-toggle" aria-expanded={groups.has(g.id)} onClick={()=>setGroups(prev=>{const next=new Set(prev);next.has(g.id)?next.delete(g.id):next.add(g.id);return next})}><span className="learning-group-index">{String(i+1).padStart(2,'0')}</span><span><b>{g.name}</b><small>{g.units.length} 个学习单元</small></span><ChevronDownIcon className={groups.has(g.id)?'expanded':''}/></button>{groups.has(g.id)&&<div className="learning-units">{g.units.map((u,index)=><button key={u.id} onClick={()=>setResource(u)} aria-label={`查看${u.name}`}><span className="video-type"><VideoIcon/>视频</span><span className="unit-name">{u.name}<small>学习单元 {index+1}</small></span><ChevronRightIcon/></button>)}</div>}</article>)}
    {!node.groups?.length&&<div className="ability-content-empty"><ReaderIcon/><b>{node.children?.length?'查看下级能力中的学习内容':node.referenceCounts?'关联内容待同步':'暂无关联学习内容'}</b><p>{node.children?.length?'选择下方能力，继续查看知识点与学习单元。':node.referenceCounts?'参考页面已关联 2 个知识点、2 个学习单元，具体内容尚未提供。':'该能力暂未关联知识点和学习单元。'}</p></div>}
    {!!node.children?.length&&<section className="ability-subnodes"><h2>下级能力 <span>{node.children.length}</span></h2>{node.children.map(a=><button key={a.id} onClick={()=>onSelect(a.id)}><span>{a.name}<small>{abilityCounts(a).knowledge} 个知识点 · {abilityCounts(a).units} 个学习单元</small></span><ChevronRightIcon/></button>)}</section>}
   </section>:<section className="ability-extra" role="tabpanel" aria-label="拓展资源"><p className="extra-note">拓展资源不记录学习行为及成绩</p><div className="ability-content-empty"><ReaderIcon/><b>暂无拓展资源</b><p>该能力暂未添加拓展资源。</p></div></section>}
  </main></MobileScroll>
  <BottomSheet open={!!resource} onOpenChange={o=>{if(!o)setResource(null)}} title="学习单元" description={resource?.name} snap={.43}><div className="resource-unavailable"><VideoIcon/><h3>视频资源尚未接入</h3><p>目前已还原参考页面中的内容名称，尚未提供可播放的视频文件。</p><button className="primary" onClick={()=>setResource(null)}>返回学习内容</button></div></BottomSheet>
 </div>
}
