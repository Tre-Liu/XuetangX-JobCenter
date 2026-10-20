import {useEffect,useRef,useState} from 'react';
import {Article,BookOpen,FileText,FilePpt,Exam,ImageSquare,Tag,Archive,FolderOpen,UploadSimple,MonitorArrowUp,VideoCamera,Textbox,CaretDown,Graph,Flask,Briefcase} from '@phosphor-icons/react';
import './knowledge-base.css';

const categories=[
 {id:'textbooks',title:'电子教材',icon:BookOpen,color:'#bd67f4'},
 {id:'slides',title:'讲义课件',icon:FilePpt,color:'#9b79ff'},
 {id:'papers',title:'相关论文',icon:FileText,color:'#9381ff'},
 {id:'exams',title:'习题试卷',icon:Exam,color:'#7088ff'},
 {id:'assignments',title:'往年作业',note:'（包括评分标准）',icon:ImageSquare,color:'#489eff'},
 {id:'cases',title:'相关案例',icon:Tag,color:'#14b8e0'},
 {id:'other',title:'其他资料',icon:Article,color:'#12bdc3',children:[
  {id:'ksa',title:'KSA图谱',icon:Graph,color:'#12bdc3'},
  {id:'practice',title:'实验/实践材料',icon:Flask,color:'#12bdc3'},
  {id:'jobs',title:'岗位信息',icon:Briefcase,color:'#12bdc3'},
 ]},
];

function ActionMenu({kind,onNotice}){
 const [expanded,setExpanded]=useState(false);
 const root=useRef(null),trigger=useRef(null);
 const isUpload=kind==='upload';
 const label=isUpload?'上传文件':'关联资源';
 useEffect(()=>{
  if(!expanded)return;
  const outside=event=>{if(!root.current?.contains(event.target))setExpanded(false);};
  const escape=event=>{if(event.key==='Escape'){setExpanded(false);trigger.current?.focus();}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[expanded]);
 const options=isUpload?categories.flatMap(category=>[category,...(category.children||[]).map(child=>({...child,parentId:category.id}))]):[{id:'course',title:'课程资源',icon:BookOpen},{id:'library',title:'资源库',icon:Archive}];
 return <div className="kb-action" ref={root}>
  <button ref={trigger} className="kb-primary" aria-haspopup="menu" aria-expanded={expanded} aria-controls={`kb-${kind}-menu`} onClick={()=>setExpanded(!expanded)} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();setExpanded(true);requestAnimationFrame(()=>root.current?.querySelector('[role="menuitem"]')?.focus());}}}>
   {isUpload?<UploadSimple size={17}/>:<MonitorArrowUp size={17}/>}<span>{label}</span><CaretDown size={13}/>
  </button>
  {expanded&&<div className={`kb-action-menu${isUpload?' kb-menu-above':''}`} id={`kb-${kind}-menu`} role="menu" aria-label={label} onKeyDown={event=>{
   const items=[...root.current.querySelectorAll('[role="menuitem"]')],index=items.indexOf(document.activeElement);
   if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();}
  }}>
   {options.map(({id,title,icon:Symbol,parentId})=><button key={id} className={parentId?'kb-menu-child':undefined} role="menuitem" onClick={()=>{setExpanded(false);trigger.current?.focus();onNotice(`${title}${isUpload?'上传':'关联'}功能暂未开放`);}}><Symbol size={18}/>{title}</button>)}
  </div>}
 </div>;
}

function ResourceName({title,note,icon:Symbol,color,children,parentId,expanded,onToggle}){
 const label=<strong>{title}{note&&<small>{note}</small>}</strong>;
 return <div className={`kb-resource-name${parentId?' kb-child-name':''}`}>
  {parentId?<Symbol size={21} color={color}/>:<><FolderOpen size={36} weight="fill" color={color}/><Symbol className="kb-category-symbol" size={15} weight="fill"/></>}
  {children?<button className="kb-resource-toggle" aria-label={`${expanded?'收起':'展开'}其他资料子类`} aria-expanded={expanded} aria-controls={children.map(child=>`kb-category-${child.id}`).join(' ')} onClick={onToggle}>{label}<CaretDown size={15} className={expanded?'':'kb-caret-collapsed'}/></button>:label}
 </div>;
}

export function KnowledgeBase({onNotice}){
 const [otherExpanded,setOtherExpanded]=useState(true);
 const rows=categories.flatMap(category=>[category,...(otherExpanded?category.children||[]:[]).map(child=>({...child,parentId:category.id}))]);
 return <section className="kb-page" aria-label="课程知识库">
  <div className="kb-summary" aria-label="知识库统计">
   <div><FileText size={17} weight="fill"/><span>文件数 <b>0</b> 个</span></div>
   <div><VideoCamera size={18} weight="fill"/><span>音视频时长 <b>0</b> 小时</span></div>
   <div><Textbox size={17} weight="fill"/><span>解析字符 <b>0</b> 字符</span></div>
   <div><Textbox size={17} weight="fill"/><span>知识切片 <b>0</b> 个（含公式 0 个、图片 0 个、表格 0 个）</span></div>
  </div>
  <div className="kb-table-panel"><div className="kb-table-scroll">
   <table className="kb-table" aria-label="知识库资料分类">
    <colgroup><col className="kb-source-col"/><col className="kb-name-col"/><col className="kb-count-col"/><col className="kb-time-col"/><col className="kb-action-col"/></colgroup>
    <thead><tr><th scope="col">来源</th><th scope="col">知识库</th><th scope="col">处理成功/上传资源数量</th><th scope="col">更新时间</th><th scope="col"><span className="kb-sr-only">操作</span></th></tr></thead>
    <tbody className="kb-linked"><tr><th scope="rowgroup" className="kb-source">关联</th><td><ResourceName title="关联资源" icon={Archive} color="#ffb52e"/></td><td className="kb-count"><span>0</span> /0</td><td/><td className="kb-operation"><ActionMenu kind="link" onNotice={onNotice}/></td></tr></tbody>
    <tbody className="kb-uploads">{rows.map((category,index)=><tr key={category.id} id={`kb-category-${category.id}`} className={category.parentId?'kb-child-row':undefined}>
     {index===0&&<th scope="rowgroup" className="kb-source" rowSpan={rows.length}>上传</th>}
     <td><ResourceName {...category} expanded={otherExpanded} onToggle={()=>setOtherExpanded(value=>!value)}/></td><td className="kb-count"><span>0</span> /0</td><td/>
     {index===0&&<td rowSpan={rows.length} className="kb-operation"><ActionMenu kind="upload" onNotice={onNotice}/></td>}
    </tr>)}</tbody>
   </table>
  </div></div>
 </section>;
}
