import {useEffect,useRef,useState} from 'react';
import {directory,officialMajors,findMajor} from './major-context.mjs';

export function OfficialMajorPicker({value,onChange}){
 const selected=findMajor(value);
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');
 const [level,setLevel]=useState(selected?.level||''),[category,setCategory]=useState(selected?.category||''),[group,setGroup]=useState(selected?.group||'');
 const root=useRef(null);
 useEffect(()=>{
  const close=e=>{if(!root.current?.contains(e.target))setOpen(false);};
  document.addEventListener('pointerdown',close);
  return()=>document.removeEventListener('pointerdown',close);
 },[]);
 const levels=['普通本科','职业本科','高职专科','中职'];
 const unique=(rows,key)=>[...new Set(rows.map(m=>m[key]))];
 const categories=unique(officialMajors.filter(m=>m.level===level),'category');
 const groups=unique(officialMajors.filter(m=>m.level===level&&m.category===category),'group');
 const results=officialMajors.filter(m=>query.trim()?m.name.includes(query.trim())||m.code.includes(query.trim()):m.level===level&&m.category===category&&m.group===group);
 const choose=m=>{onChange(m);setLevel(m.level);setCategory(m.category);setGroup(m.group);setQuery('');setOpen(false);};
 return <div className="official-major-picker" ref={root} onKeyDown={e=>{if(e.key==='Escape'&&open){e.stopPropagation();setOpen(false);root.current.querySelector('.major-trigger').focus();}}}>
  <span className="major-label">关联专业 <em>*</em></span>
  <button type="button" className="major-trigger" aria-label="选择官方专业" aria-expanded={open} aria-controls="official-major-panel" onClick={()=>setOpen(v=>!v)}><span className={selected?'':'placeholder'}>{selected?`${selected.code} · ${selected.name}`:'请选择官方专业'}</span><span aria-hidden="true">⌄</span></button>
  {selected&&<small className="major-path">{selected.level} / {selected.category} / {selected.group}</small>}
  {open&&<div className="major-panel" id="official-major-panel">
   <input autoFocus aria-label="搜索官方专业" placeholder="搜索专业名称或专业代码" value={query} onChange={e=>setQuery(e.target.value)}/>
   {query.trim()?<div className="major-search-results" role="listbox" aria-label="专业搜索结果">{results.map(m=><button type="button" role="option" aria-selected={value===m.code} key={m.code} onClick={()=>choose(m)}><strong>{m.code} · {m.name}</strong><small>{m.level} / {m.category} / {m.group}</small></button>)}{!results.length&&<p>未找到匹配的官方专业，请更换名称或代码。</p>}</div>:<div className="major-cascade">
    {[['教育层次',levels,level,v=>{setLevel(v);setCategory('');setGroup('');}],['学科门类 / 专业大类',categories,category,v=>{setCategory(v);setGroup('');}],['专业类',groups,group,setGroup]].map(([title,items,active,pick])=><div className="major-column" key={title}><b>{title}</b><div role="listbox" aria-label={title}>{items.map(item=><button type="button" key={item} role="option" aria-selected={item===active} onClick={()=>pick(item)}>{item}<span>›</span></button>)}{!items.length&&<p>请先选择上一级</p>}</div></div>)}
    <div className="major-column"><b>专业</b><div role="listbox" aria-label="专业">{results.map(m=><button type="button" role="option" aria-selected={value===m.code} key={m.code} onClick={()=>choose(m)}>{m.name}<small>{m.code}</small></button>)}{!results.length&&<p>请先选择专业类</p>}</div></div>
   </div>}
   <div className="major-directory-source">目录快照：普通本科 2025 年 / 职业教育 2021 年 · {Object.entries(directory.sources).map(([id,s])=><a key={id} href={s.url} target="_blank" rel="noreferrer">{id.includes('BK')?'本科目录':'职教目录'}</a>)}</div>
  </div>}
 </div>;
}
