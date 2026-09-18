import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeftIcon, DotsHorizontalIcon, MinusIcon, DiscIcon, ReaderIcon, PersonIcon, MagicWandIcon, ChatBubbleIcon, Component2Icon, Share2Icon, MixIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon, Crosshair2Icon } from '@radix-ui/react-icons';
import { MobileScroll, BottomSheet, Carousel, useScreenPortal, useKeyboard, useKeyboardInsets } from './mobile';
import GraphView from './GraphView';
import AbilityGraph from './AbilityGraph';
import { nodes } from './course-data';
const features=[{name:'成绩单',Icon:ReaderIcon},{name:'成员',Icon:PersonIcon},{name:'习题集',Icon:MagicWandIcon},{name:'讨论区',Icon:ChatBubbleIcon},{name:'更多',Icon:Component2Icon}];
export default function Prototype(){
 const [page,setPage]=useState<'course'|'graph'>('course'),[more,setMore]=useState(false),[tab,setTab]=useState('学习日志'),[filter,setFilter]=useState('全部'),[expanded,setExpanded]=useState(false),[notice,setNotice]=useState('');
 const [graphType,setGraphType]=useState('知识图谱');
 const [abilityDetail,setAbilityDetail]=useState<string|null>(null);
 const [qualityDetail,setQualityDetail]=useState<QualitySelection|null>(null);
 const [questionDetail,setQuestionDetail]=useState<string|null>(null);
 const showingQuestionDetail=page==='graph'&&graphType==='问题图谱'&&!!questionDetail;
 const showingAbilityDetail=page==='graph'&&graphType==='能力图谱'&&!!abilityDetail;
 const showingQualityDetail=page==='graph'&&graphType==='素质图谱'&&!!qualityDetail;
 const showingDetail=showingAbilityDetail||showingQualityDetail||showingQuestionDetail;
 const goGraph=()=>{setMore(false);setGraphType('知识图谱');setPage('graph')};
 return <div className="student-app">
  <header className="mini-header"><button className="icon-button" aria-label={showingAbilityDetail?'返回能力图谱':showingQualityDetail?'返回素质图谱':showingQuestionDetail?'返回问题图谱':'返回教学班'} onClick={()=>{if(showingAbilityDetail)setAbilityDetail(null);else if(showingQualityDetail)setQualityDetail(null);else if(showingQuestionDetail)setQuestionDetail(null);else if(page==='graph')setPage('course');else setNotice('课程列表')}}><ArrowLeftIcon/></button>{showingDetail?<b>{showingQualityDetail?'素质详情':showingQuestionDetail?'问题详情':'能力详情'}</b>:page==='graph'?<b>课程图谱</b>:<b>免疫学</b>}<div className="mini-capsule"><button aria-label="小程序菜单" onClick={()=>setNotice('小程序菜单')}><DotsHorizontalIcon/></button><MinusIcon/><button aria-label="关闭图谱返回课程" onClick={()=>{setPage('course');setMore(false);setQualityDetail(null);setQuestionDetail(null)}}><DiscIcon/></button></div></header>
  {page==='graph'&&!showingDetail&&<GraphTypeSwitcher value={graphType} onChange={setGraphType}/>}
  {page==='graph'?<><div className="graph-host" hidden={graphType!=='知识图谱'}><GraphView/></div>{graphType==='能力图谱'&&<AbilityGraph selectedId={abilityDetail} onSelect={setAbilityDetail}/>}
{graphType==='素质图谱'&&<QualityGraph selected={qualityDetail} onSelect={setQualityDetail}/>}
{graphType==='问题图谱'&&<QuestionGraph selected={questionDetail} onSelect={setQuestionDetail}/>}
{!['知识图谱','能力图谱','问题图谱','素质图谱'].includes(graphType)&&<section className="graph-placeholder"><Share2Icon/><h2>{graphType}</h2><p>暂无图谱内容</p><button onClick={()=>setGraphType('知识图谱')}>返回知识图谱</button></section>}</>:<><MobileScroll className="course-scroll"><section className="course-info"><h1>教学班001</h1><p>开课时间： 2026.08.20 00:00 至 2027.01.31 23:59</p><div className="feature-grid">{features.map(({name,Icon},i)=><button key={name} className={`feature feature-${i}`} aria-expanded={name==='更多'?more:undefined} onClick={()=>name==='更多'?setMore(!more):setNotice(name)}><Icon/><span>{name}</span></button>)}</div></section>
  <section className="course-content"><div className="course-tabs">{['学习日志','学习目录','未完成 (7)'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>{setTab(t);setMore(false)}}>{t}</button>)}<button className="progress" onClick={()=>setNotice('学习进度')}>进度 13%</button></div>
  {tab==='学习日志'?<><Carousel className="filters">{['全部','课堂','课件','试卷','公告'].map(f=><button key={f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f}</button>)}</Carousel><h3 className="date-heading">9月14日　星期一</h3><div className="timeline">{filter==='全部'&&<article><div className="time">18 : 39</div><div className="log-card"><div className="truncate">第0讲 数学基础知识（Math basics for circuits）</div><p>7个学习单元</p>{expanded&&<div className="units">{['课程导学','数学基础知识','单位阶跃函数','单位冲激函数','卷积积分','练习与回顾','学习小结'].map(t=><button key={t} onClick={()=>setNotice(t)}><ReaderIcon/>{t}<ChevronRightIcon/></button>)}</div>}<button className="expand" onClick={()=>setExpanded(!expanded)}>{expanded?'收起':'展开'}<ChevronDownIcon style={{transform:expanded?'rotate(180deg)':undefined}}/></button></div></article>}{['全部','课堂','课件'].includes(filter)&&<article><div className="time">18 : 36 <span>课堂</span></div><button className="log-card file-card" onClick={()=>setNotice('继电保护.pptx')}>继电保护.pptx</button></article>}{['试卷','公告'].includes(filter)&&<p className="empty">暂无{filter}</p>}</div></>:tab==='学习目录'?<div className="course-directory"><button className="map-entry" onClick={goGraph}><Share2Icon/><span><b>知识图谱</b><small>探索电路原理知识点之间的关联</small></span><ChevronRightIcon/></button>{nodes.filter(n=>n.parentId==='root').map((n,i)=><button className="chapter-row" key={n.id} onClick={goGraph}><span className="chapter-number">{String(i+1).padStart(2,'0')}</span><span>{n.name}</span><ChevronRightIcon/></button>)}</div>:<div className="course-directory"><p className="muted">以下为框架演示中的待学习单元</p>{['数学基础知识','单位阶跃函数','单位冲激函数','卷积积分','节点电压法','回路电流法','继电保护.pptx'].map(t=><button className="chapter-row" key={t} onClick={()=>setNotice(t)}><ReaderIcon/><span>{t}</span><ChevronRightIcon/></button>)}</div>}
  </section></MobileScroll><button className="ai-companion" onClick={()=>setNotice('AI陪练')}><MagicWandIcon/>AI陪练</button>{more&&<><button className="menu-dismiss" aria-label="关闭更多菜单" onClick={()=>setMore(false)}/><div className="more-menu"><button onClick={goGraph}><Share2Icon/><span>图谱</span></button><button onClick={()=>{setMore(false);setNotice('分组')}}><MixIcon/><span>分组</span></button></div></>}</>}
  <BottomSheet open={!!notice} onOpenChange={o=>{if(!o)setNotice('')}} title={notice||'提示'} description="学生端功能入口" snap={.38}><div className="notice-content"><p>{notice==='继电保护.pptx'?'课件入口已保留，尚未接入课件文件。':notice==='学习进度'?'参考页面显示进度为 13%。真实学习进度接口尚未接入。':`${notice}入口已保留，具体功能后续接入。`}</p><button className="primary" onClick={()=>setNotice('')}>我知道了</button></div></BottomSheet>
 </div>;
}

function GraphTypeSwitcher({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const [open,setOpen]=useState(false);
 const trigger=useRef<HTMLButtonElement>(null);
 const {screenRef}=useScreenPortal();
 useLayoutEffect(()=>{if(screenRef.current)screenRef.current.scrollTop=0},[open,screenRef]);
 const keyboard=useKeyboard();
 const {bottomInset}=useKeyboardInsets();
 const close=()=>{setOpen(false);trigger.current?.focus({preventScroll:true})};
 useEffect(()=>{if(!open)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();close()}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[open]);
 return <>
  {open&&<button className="graph-switch-dismiss" aria-label="收起图谱切换" onClick={close}/>}
  <div className="graph-switch" style={{bottom:bottomInset+94}}>
   {open&&<nav id="graph-type-options" className="graph-switch-options" aria-label="图谱类型">{['知识图谱','能力图谱','问题图谱','素质图谱'].map(type=><button key={type} aria-pressed={type===value} onClick={()=>{onChange(type);close()}}>{type}<span aria-hidden="true">{type===value?'✓':''}</span></button>)}</nav>}
   <button ref={trigger} className="graph-switch-trigger" aria-label={`切换图谱类型，当前${value}`} aria-expanded={open} aria-controls={open?'graph-type-options':undefined} onClick={()=>{keyboard.hide();setOpen(!open)}}><Share2Icon/><span>{value}</span><ChevronDownIcon style={{transform:open?undefined:'rotate(180deg)'}}/></button>
  </div>
 </>;
}

// Reference-backed sample: five quality dimensions and their sixteen child nodes.
const qualityGroups = [
 {name:'文化理解与传承素养',short:'文化理解\n与传承素养',color:'#fa5159',light:'#ff9998',children:['文化理解','文化认同','文化践行']},
 {name:'审辨思维素养',short:'审辨思维\n素养',color:'#d99500',light:'#f6cd72',children:['质疑批判','分析论证','综合生成','反思评估']},
 {name:'创新素养',short:'创新素养',color:'#ff6148',light:'#ffad8b',children:['创新人格','创新思维','创新实践']},
 {name:'沟通素养',short:'沟通素养',color:'#ff9824',light:'#ffc774',children:['同理心','倾听理解','有效表达']},
 {name:'合作素养',short:'合作素养',color:'#dc8230',light:'#f7bd88',children:['愿景认同','责任分担','协商共赢']},
];
type QualityGroup=typeof qualityGroups[number];
type QualitySelection={name:string;group:QualityGroup};
function QualityGraph({selected,onSelect}:{selected:QualitySelection|null;onSelect:(value:QualitySelection|null)=>void}){
 const {screenRef}=useScreenPortal();
 useEffect(()=>{const screen=screenRef.current;if(!screen)return;const reset=()=>{if(screen.scrollTop)screen.scrollTop=0};reset();screen.addEventListener('scroll',reset);return()=>screen.removeEventListener('scroll',reset)},[screenRef]);
 const [mode,setMode]=useState('素质圆环');
 const keyboard=useKeyboard();
 const setSelected=(value:QualitySelection|null)=>{keyboard.hide();onSelect(value)};
 useLayoutEffect(()=>{if(screenRef.current)screenRef.current.scrollTop=0},[selected,screenRef]);
 return <section className="quality-view">
  <div className="quality-overview" inert={!!selected} style={{visibility:selected?'hidden':undefined}}>
  <div className="quality-heading"><span>王丹的测试课程</span><small>5 个素质维度 · 16 个素质点</small></div>
  <div className="quality-tabs" role="tablist" aria-label="素质图谱视图">{['素质圆环','素质框架','素质树'].map((m,i)=><button key={m} role="tab" aria-selected={mode===m} className={mode===m?'active':''} onClick={()=>setMode(m)}>{i===0?<Share2Icon/>:i===1?<Component2Icon/>:<MixIcon/>}{m}</button>)}</div>
  {mode==='素质框架'?<MobileScroll className="quality-framework-scroll"><div className="quality-framework" role="tabpanel" aria-label="素质框架"><div className="quality-course-label">王丹的测试课程</div>{qualityGroups.map((g,i)=><article key={g.name} style={{'--quality-color':g.color,'--quality-light':g.light} as CSSProperties}><button className="quality-framework-title" onClick={()=>setSelected({name:g.name,group:g})}><span>0{i+1}</span><b>{g.name}</b><ChevronRightIcon/></button><div className="quality-framework-children">{g.children.map(n=><button key={n} onClick={()=>setSelected({name:n,group:g})}>{n}<ChevronRightIcon/></button>)}</div></article>)}</div></MobileScroll>:<QualityCanvas key={mode} tree={mode==='素质树'} onSelect={setSelected}/>}
  </div>
  {selected&&<QualityDetail key={selected.name} selected={selected} onSelect={setSelected}/>}

 </section>
}
function QualityDetail({selected,onSelect}:{selected:QualitySelection;onSelect:(value:QualitySelection|null)=>void}){
 const [tab,setTab]=useState<'learning'|'extra'>('learning');
 const isDimension=selected.name===selected.group.name;
 return <div className="ability-detail-page quality-detail-page">
  <MobileScroll className="ability-detail-scroll"><main className="ability-detail-content">
   <button className="back-to-map" onClick={()=>onSelect(null)}><ArrowLeftIcon/>返回素质图谱</button>
   <div className="ability-path">{isDimension?<span className="quality-detail-course">王丹的测试课程<ChevronRightIcon/></span>:<button onClick={()=>onSelect({name:selected.group.name,group:selected.group})}>{selected.group.name}<ChevronRightIcon/></button>}</div>
   <section className="ability-summary"><h1>{selected.name}</h1><div className="ability-summary-counts"><span><b>0</b> 个知识点</span><span><b>0</b> 个学习单元</span></div></section>
   <div className="ability-detail-tabs" role="tablist" aria-label="素质内容"><button role="tab" aria-selected={tab==='learning'} onClick={()=>setTab('learning')}>知识点与学习内容</button><button role="tab" aria-selected={tab==='extra'} onClick={()=>setTab('extra')}>拓展资源</button></div>
   {tab==='learning'?<section className="ability-learning" role="tabpanel" aria-label="知识点与学习内容">
    <div className="ability-content-empty"><ReaderIcon/><b>{isDimension?'查看下级素质中的学习内容':'暂无关联学习内容'}</b><p>{isDimension?'选择下方素质，继续查看知识点与学习单元。':'该素质点暂未关联知识点和学习单元。'}</p></div>
    {isDimension&&<section className="ability-subnodes"><h2>下级素质 <span>{selected.group.children.length}</span></h2>{selected.group.children.map(name=><button key={name} onClick={()=>onSelect({name,group:selected.group})}><span>{name}<small>0 个知识点 · 0 个学习单元</small></span><ChevronRightIcon/></button>)}</section>}
   </section>:<section className="ability-extra" role="tabpanel" aria-label="拓展资源"><p className="extra-note">拓展资源不记录学习行为及成绩</p><div className="ability-content-empty"><ReaderIcon/><b>暂无拓展资源</b><p>该素质暂未添加拓展资源。</p></div></section>}
  </main></MobileScroll>
 </div>
}
function QualityCanvas({tree,onSelect}:{tree:boolean;onSelect:(value:QualitySelection)=>void}){
 const host=useRef<HTMLDivElement>(null),points=useRef(new Map<number,{x:number;y:number}>()),gesture=useRef({x:0,y:0,moved:false});
 const [size,setSize]=useState({w:393,h:600}),[view,setView]=useState({x:0,y:0,z:.56});
 const world={w:tree?570:660,h:tree?920:730};
 const fit=(w:number,h:number)=>{const z=Math.min((w-24)/world.w,(h-112)/world.h,1);return {z,x:(w-world.w*z)/2,y:Math.max(20,(h-100-world.h*z)/2)}};
 useEffect(()=>{const el=host.current;if(!el)return;const observer=new ResizeObserver(([entry])=>{const {width:w,height:h}=entry.contentRect;if(w&&h){setSize({w,h});setView(fit(w,h))}});observer.observe(el);return()=>observer.disconnect()},[]);
 const local=(x:number,y:number)=>{const b=host.current!.getBoundingClientRect();return {x:(x-b.left)*size.w/b.width,y:(y-b.top)*size.h/b.height}};
 const zoom=(delta:number)=>setView(v=>{const z=Math.max(.3,Math.min(1.8,v.z+delta));return {z,x:size.w/2-(size.w/2-v.x)*z/v.z,y:(size.h-90)/2-((size.h-90)/2-v.y)*z/v.z}});
 const positions=tree?[[185,185],[185,350],[185,515],[185,680],[185,845]]:[[142,306],[216,564],[448,564],[522,306],[332,130]];
 return <div className="quality-canvas-shell"><div className="quality-pan" ref={host} role="tabpanel" aria-label={tree?'素质树画布':'素质圆环画布'}
  onPointerDown={e=>{points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.current.size===1)gesture.current={x:e.clientX,y:e.clientY,moved:false};else gesture.current.moved=true}}
  onPointerMove={e=>{const prev=points.current.get(e.pointerId);if(!prev)return;const next={x:e.clientX,y:e.clientY};if(Math.hypot(next.x-gesture.current.x,next.y-gesture.current.y)>6){gesture.current.moved=true;e.currentTarget.setPointerCapture(e.pointerId)}const a=local(prev.x,prev.y),b=local(next.x,next.y);
   if(points.current.size===2){const other=[...points.current.entries()].find(([id])=>id!==e.pointerId)![1],o=local(other.x,other.y),before=Math.hypot(a.x-o.x,a.y-o.y);if(before>0)setView(v=>{const z=Math.max(.3,Math.min(1.8,v.z*Math.hypot(b.x-o.x,b.y-o.y)/before));return {z,x:(b.x+o.x)/2-((a.x+o.x)/2-v.x)*z/v.z,y:(b.y+o.y)/2-((a.y+o.y)/2-v.y)*z/v.z}})}else if(gesture.current.moved)setView(v=>({...v,x:v.x+b.x-a.x,y:v.y+b.y-a.y}));points.current.set(e.pointerId,next)}}
  onPointerUp={e=>points.current.delete(e.pointerId)} onPointerCancel={e=>{points.current.delete(e.pointerId);gesture.current.moved=true}} onLostPointerCapture={e=>points.current.delete(e.pointerId)}
  onClickCapture={e=>{if(gesture.current.moved){e.preventDefault();e.stopPropagation()}}}>
   <div className={`quality-world ${tree?'is-tree':'is-ring'}`} style={{width:world.w,height:world.h,transform:`translate(${view.x}px,${view.y}px) scale(${view.z})`}}>
    <svg className="quality-lines" viewBox={`0 0 ${world.w} ${world.h}`} aria-hidden="true">{!tree&&<circle cx="332" cy="370" r="241" fill="none" stroke="#e5dfed" strokeWidth="1.5"/>}{qualityGroups.map((g,i)=>{const [x,y]=positions[i];return <g key={g.name} fill="none" stroke={g.color}>{tree?<path strokeWidth="4" d={`M100 75 C45 ${y},65 ${y},${x} ${y}`}/>:<><path stroke="#e9dfe5" d={`M332 393 L${x} ${y}`}/><circle cx={x} cy={y} r="96" stroke="#d0c9df" strokeDasharray="2 3"/><circle cx={x} cy={y} r="62" strokeWidth="2" strokeDasharray="90 105" opacity=".6"/></>}{g.children.map((n,j)=>{const lx=tree?442:x+96*Math.cos((-100+j*360/g.children.length)*Math.PI/180),ly=tree?y+(j-(g.children.length-1)/2)*42:y+96*Math.sin((-100+j*360/g.children.length)*Math.PI/180);return <path key={n} strokeWidth={tree?1.6:1} strokeOpacity={tree?1:.2} d={tree?`M${x+70} ${y} C340 ${y},340 ${ly},${lx-62} ${ly}`:`M${x} ${y} L${lx} ${ly}`}/>})}</g>})}</svg>
    <div className="quality-root" style={{left:tree?100:332,top:tree?57:393}}>王丹的测试课程</div>
    {qualityGroups.map((g,i)=>{const [x,y]=positions[i];return <div key={g.name} style={{'--quality-color':g.color,'--quality-light':g.light} as CSSProperties}><button className="quality-dimension" style={{left:x,top:y}} aria-label={`查看${g.name}`} onClick={()=>onSelect({name:g.name,group:g})}>{tree?g.name:g.short}</button>{g.children.map((n,j)=>{const lx=tree?442:x+96*Math.cos((-100+j*360/g.children.length)*Math.PI/180),ly=tree?y+(j-(g.children.length-1)/2)*42:y+96*Math.sin((-100+j*360/g.children.length)*Math.PI/180);return <button className="quality-leaf" key={n} style={{left:lx,top:ly}} aria-label={`查看${n}`} onClick={()=>onSelect({name:n,group:g})}>{!tree&&<span/>}<b>{n}</b></button>})}</div>})}
   </div>
  </div><div className="quality-controls"><button aria-label="缩小素质图谱" onClick={()=>zoom(-.12)} disabled={view.z<=.3}><MinusIcon/></button><span>{Math.round(view.z*100)}%</span><button aria-label="放大素质图谱" onClick={()=>zoom(.12)} disabled={view.z>=1.8}><PlusIcon/></button><i/><button aria-label="适应屏幕" onClick={()=>setView(fit(size.w,size.h))}><Crosshair2Icon/></button></div><p className="quality-hint">拖动探索 · 双指缩放 · 点击查看素质</p></div>
}


// Only screenshot-visible questions are included; counts derive from this subset.
const questionLevels = [
 {name:'高级层级',title:'评价与创造',description:'对信息、论点或过程进行评估和批判',color:'#9685f3',pale:'#eeebfc',end:'#b6aaff',names:['线性电阻电路分析','非线性电阻电路分析','动态电路的时域分析','正弦激励下动态电路的稳态分析']},
 {name:'中级层级',title:'应用和分析',description:'将学到的知识应用于新的情境或问题',color:'#4e80f3',pale:'#e8effd',end:'#83aeef',names:['电路基本概念与定律','电路等效变换','电路基本分析方法','电路基本定理','非线性元件特性','非线性电路分析方法','非线性电路工作点分析']},
 {name:'初级层级',title:'记忆和理解',description:'涉及对事实、术语、基本概念的记忆和理解',color:'#2fc3cc',pale:'#e4f5f8',end:'#7fdde7',names:['电路模型与基本物理量','欧姆定律','基尔霍夫定律 KCL 与 KVL','受控源','电阻串并联化简','电源模型等效互换','星－三角（Y–Δ）等效变换']},
 {name:'四级',title:'',description:'',color:'#54ce97',pale:'#e3f4ed',end:'#94e7b2',names:['节点电压法求解含受控源电路','戴维南定理求含源二端网络等效电路','含受控源电路的戴维南等效电阻求法','叠加定理求多源电路响应','一阶 RC 电路三要素法求解','RLC 串联二阶电路欠阻尼响应分析']},
 {name:'五级',title:'',description:'',color:'#5cc1e7',pale:'#e3f3fb',end:'#91def3',names:['综合设计：测量未知电阻 Rx 的电路方案','综合设计：50Hz 工频陷波滤波器','综合设计：家用电网过压保护电路','综合分析：日光灯电路工作原理与能量转换','综合评价：电路原理的统一方法论']},
];
const questionNodes=questionLevels.flatMap((level,column)=>level.names.map((name,row)=>({id:`q${column}-${row}`,name,column,row})));
const questionLinks=[['q0-0','q1-0'],['q0-0','q1-1'],['q0-0','q1-2'],['q0-0','q1-3'],['q1-0','q2-0'],['q1-0','q2-1'],['q1-0','q2-2'],['q1-0','q2-3'],['q1-1','q2-4'],['q1-1','q2-5'],['q1-1','q2-6']];
type QuestionPoint={x:number;y:number};
function QuestionGraph({selected,onSelect}:{selected:string|null;onSelect:(id:string|null)=>void}){
 const [active,setActive]=useState(0);
 const keyboard=useKeyboard();
 const {screenRef}=useScreenPortal();
 const setSelected=(id:string|null)=>{keyboard.hide();onSelect(id)};
 useLayoutEffect(()=>{if(screenRef.current)screenRef.current.scrollTop=0},[selected,screenRef]);
 const [view,setView]=useState({x:18,y:20,z:.88});
 const host=useRef<HTMLDivElement>(null),size=useRef({w:393,h:600});
 const pointers=useRef(new Map<number,QuestionPoint>()),gesture=useRef({x:0,y:0,moved:false});
 const detail=questionNodes.find(n=>n.id===selected);
 useEffect(()=>{const el=host.current;if(!el)return;const observer=new ResizeObserver(([entry])=>{size.current={w:entry.contentRect.width,h:entry.contentRect.height}});observer.observe(el);return()=>observer.disconnect()},[]);
 const point=(x:number,y:number)=>{const box=host.current!.getBoundingClientRect();return {x:(x-box.left)*size.current.w/box.width,y:(y-box.top)*size.current.h/box.height}};
 const zoom=(delta:number)=>setView(v=>{const z=Math.min(1.4,Math.max(.45,v.z+delta)),x=size.current.w/2,y=size.current.h/2;return {z,x:x-(x-v.x)*z/v.z,y:y-(y-v.y)*z/v.z}});
 const locate=(column:number)=>{setActive(column);setView({x:18-column*328*.88,y:20,z:.88})};
 const nodePosition=(id:string)=>{const n=questionNodes.find(n=>n.id===id)!;return {x:n.column*328+16,y:112+n.row*124}};
 return <section className="question-view">
  <div className="question-overview" inert={!!detail} style={{visibility:detail?'hidden':undefined}}>
  <div className="question-heading"><div><h1>电路原理</h1><p>关联知识点 <b>0</b><span/>当前展示问题 <b>{questionNodes.length}</b></p></div><span className="question-mark"><Share2Icon/></span></div>
  <Carousel className="question-level-nav">{questionLevels.map((level,i)=><button key={level.name} aria-label={`定位${level.name}`} aria-pressed={active===i} onClick={()=>locate(i)} style={{'--q-color':level.color,'--q-pale':level.pale} as CSSProperties}><i/>{level.name}<small>{level.names.length}</small></button>)}</Carousel>
  <div className="question-stage">
   <div className="question-pan" ref={host} aria-label="问题图谱画布，可拖动和缩放"
    onPointerDown={e=>{pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.current.size===1)gesture.current={x:e.clientX,y:e.clientY,moved:false};else gesture.current.moved=true}}
    onPointerMove={e=>{const prev=pointers.current.get(e.pointerId);if(!prev)return;const next={x:e.clientX,y:e.clientY};if(Math.hypot(next.x-gesture.current.x,next.y-gesture.current.y)>6){gesture.current.moved=true;e.currentTarget.setPointerCapture(e.pointerId)}
     if(pointers.current.size===2){const other=[...pointers.current.entries()].find(([id])=>id!==e.pointerId)![1],a=point(prev.x,prev.y),b=point(next.x,next.y),o=point(other.x,other.y),before=Math.hypot(a.x-o.x,a.y-o.y),after=Math.hypot(b.x-o.x,b.y-o.y);if(before>0)setView(v=>{const z=Math.max(.45,Math.min(1.4,v.z*after/before));return {z,x:(b.x+o.x)/2-((a.x+o.x)/2-v.x)*z/v.z,y:(b.y+o.y)/2-((a.y+o.y)/2-v.y)*z/v.z}})}
     else if(gesture.current.moved){const a=point(prev.x,prev.y),b=point(next.x,next.y);setView(v=>({...v,x:v.x+b.x-a.x,y:v.y+b.y-a.y}))}pointers.current.set(e.pointerId,next)}}
    onPointerUp={e=>pointers.current.delete(e.pointerId)} onPointerCancel={e=>{pointers.current.delete(e.pointerId);gesture.current.moved=true}} onLostPointerCapture={e=>pointers.current.delete(e.pointerId)}
    onClickCapture={e=>{if(gesture.current.moved&&e.detail!==0){e.preventDefault();e.stopPropagation()}}} onWheel={e=>{zoom(e.deltaY>0?-.06:.06)}}>
    <div className="question-world" style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.z})`}}>
     {questionLevels.map((level,i)=><div key={level.name} className="question-column" style={{left:i*328,height:132+level.names.length*124,background:level.pale}}><h2>{level.name}{level.title&&<><br/><span>{level.title}</span></>} <small>({level.names.length})</small></h2><p>{level.description}</p></div>)}
     <svg className="question-links" width="1650" height="1060" aria-hidden="true"><defs>{questionLinks.map(([a,b])=><linearGradient key={a+b} id={`link-${a}-${b}`}><stop stopColor={questionLevels[questionNodes.find(n=>n.id===a)!.column].color}/><stop offset="1" stopColor={questionLevels[questionNodes.find(n=>n.id===b)!.column].color}/></linearGradient>)}</defs>{questionLinks.map(([a,b])=>{const start=nodePosition(a),end=nodePosition(b),x=start.x+220,y=start.y+50;return <path key={a+b} d={`M${x},${y} C${x+50},${y} ${end.x-50},${end.y+50} ${end.x},${end.y+50}`} stroke={`url(#link-${a}-${b})`}/>})}</svg>
     {questionNodes.map(n=>{const level=questionLevels[n.column],p=nodePosition(n.id);return <button key={n.id} className={`question-node${selected===n.id?' selected':''}`} aria-label={`查看问题：${n.name}`} onClick={()=>setSelected(n.id)} style={{left:p.x,top:p.y,background:`linear-gradient(120deg,${level.color},${level.end})`}}><strong>{n.name}</strong><span>0个知识点</span></button>})}
    </div>
   </div>
   <div className="question-tools"><button aria-label="缩小问题图谱" onClick={()=>zoom(-.12)}><MinusIcon/></button><output>{Math.round(view.z*100)}%</output><button aria-label="放大问题图谱" onClick={()=>zoom(.12)}><PlusIcon/></button><i/><button aria-label="回到问题图谱起点" onClick={()=>locate(0)}><Crosshair2Icon/></button></div>
   <p className="question-hint">拖动探索层级 · 双指缩放 · 点击查看详情</p>
  </div>
  </div>
  {detail&&<QuestionDetail key={detail.id} detail={detail} onSelect={setSelected}/>}

 </section>
}

function QuestionDetail({detail,onSelect}:{detail:typeof questionNodes[number];onSelect:(id:string|null)=>void}){
 const [tab,setTab]=useState<'learning'|'extra'>('learning');
 const related=questionLinks.filter(pair=>pair.includes(detail.id)).map(pair=>questionNodes.find(n=>n.id===pair.find(id=>id!==detail.id))!);
 return <div className="ability-detail-page question-detail-page">
  <MobileScroll className="ability-detail-scroll"><main className="ability-detail-content">
   <button className="back-to-map" onClick={()=>onSelect(null)}><ArrowLeftIcon/>返回问题图谱</button>
   <div className="ability-path"><span className="question-detail-level">电路原理<ChevronRightIcon/>{questionLevels[detail.column].name}</span></div>
   <section className="ability-summary"><h1>{detail.name}</h1>{detail.id==='q1-1'?<p>化繁为简的核心思想<br/>电阻串并联化简；实际电源模型互换（电压源↔电流源）；星三角（Y-Δ）等效变换；含受控源电路的等效化简。</p>:<p>暂无问题说明</p>}<div className="ability-summary-counts"><span><b>0</b> 个知识点</span><span><b>0</b> 个学习单元</span></div></section>
   <div className="ability-detail-tabs" role="tablist" aria-label="问题内容"><button role="tab" aria-selected={tab==='learning'} onClick={()=>setTab('learning')}>知识点与学习内容</button><button role="tab" aria-selected={tab==='extra'} onClick={()=>setTab('extra')}>拓展资源</button></div>
   {tab==='learning'?<section role="tabpanel" aria-label="知识点与学习内容"><div className="ability-content-empty"><ReaderIcon/><b>暂无关联学习内容</b><p>该问题暂未关联知识点和学习单元。</p></div></section>:<section role="tabpanel" aria-label="拓展资源"><p className="extra-note">拓展资源不记录学习行为及成绩</p><div className="ability-content-empty"><ReaderIcon/><b>暂无拓展资源</b><p>该问题暂未添加拓展资源。</p></div></section>}
   <section className="ability-subnodes"><h2>关联问题 <span>{related.length}</span></h2>{related.map(n=><button key={n.id} onClick={()=>onSelect(n.id)}><span>{n.name}<small>{questionLevels[n.column].name} · 0 个知识点 · 0 个学习单元</small></span><ChevronRightIcon/></button>)}{!related.length&&<p className="extra-note">暂无关联问题</p>}</section>
  </main></MobileScroll>
 </div>
}
