import detailReference from './class-detail-reference.png?inline';
import {useState} from 'react';
import {defaultClassroom,loadVersions,readClassroom,buildVersionCatalog,getVersionStorage} from './versions.mjs';
import {VersionCreateDialog} from './VersionCreateDialog';
export {readClassroom} from './versions.mjs';
import {Icon} from '../components/Icon';
import './classroom-shell.css';

export const classroom=defaultClassroom;
export function readShellRoute(){
 const hash=location.hash;
 if(hash==='#classes')return 'classes';
 if(hash.startsWith('#class/'))return loadVersions(getVersionStorage()).some(v=>`#class/${v.id}`===hash.split('?')[0])?'class':'classes';
 return 'workspace';
}
export function GlobalRail({view,onNavigate,onAssistant,onExport}){
 return <aside className="global-rail"><button className="brand" aria-label="课程首页" onClick={()=>onNavigate('classes')}><span className="shell-school-image" style={{backgroundImage:`url(${detailReference})`}}/></button>
  <nav className="shell-nav" aria-label="全局导航">
   <button className={view==='classes'||view==='class'?'active':''} aria-label="课程班级" aria-current={view==='classes'||view==='class'?'page':undefined} onClick={()=>onNavigate('classes')}><Icon name="classroom" size={27}/><span>课程班级</span></button>
   <button aria-label="资源库" disabled><Icon name="resource" size={27}/><span>资源库</span></button>
   <button className={view==='workspace'?'active':''} aria-label="AI工作台" aria-current={view==='workspace'?'page':undefined} onClick={()=>onNavigate('workspace')}><Icon name="ai" size={27}/><span>AI工作台</span></button>
   <button aria-label="AI空间" disabled><Icon name="sparkle" size={27}/><span>AI空间</span></button>
  </nav>
  <div className="rail-bottom"><button title="教学助手" aria-label="教学助手" onClick={onAssistant}><Icon name="robot" size={26}/></button><button title="导出项目草稿" aria-label="导出项目草稿" onClick={onExport}><Icon name="download" size={25}/></button><div className="rail-line"/><span>AI 课程</span></div>
 </aside>;
}
export function ClassroomList({courseName,versions=loadVersions(getVersionStorage()),onDetail,onTeach,onCreate}){
 const [query,setQuery]=useState('');const [mode,setMode]=useState('teach');const [creating,setCreating]=useState(false);const [catalog]=useState(()=>buildVersionCatalog(getVersionStorage()));
 const visible=mode==='teach'?versions.filter(version=>`${courseName} ${version.name} ${version.versionLabel} ${version.semester}`.toLowerCase().includes(query.trim().toLowerCase())):[];
 return <main className="classroom-list">
  <header className="classroom-top"><nav aria-label="课程列表"><button className={mode==='teach'?'active':''} onClick={()=>setMode('teach')}>我教的课</button><button className={mode==='listen'?'active':''} onClick={()=>setMode('listen')}>我听的课</button></nav></header>
  <div className="classroom-content"><label className="classroom-search"><Icon name="search" size={19}/><input aria-label="搜索课程" placeholder="搜索课程、版本或学期" value={query} onChange={event=>setQuery(event.target.value)}/></label>
  {mode==='teach'&&<div className="classroom-course-heading"><h2>{courseName}</h2><button className="class-version-create" aria-label="创建课程版本" title="创建" onClick={()=>setCreating(true)}><Icon name="plus" size={21}/></button><span>{versions.length} 个版本</span></div>}
  {visible.length?<section className="classroom-course classroom-version-grid" aria-label="课程版本">{visible.map(version=><article key={version.id} data-class-id={version.id} className="class-card" role="link" tabIndex={0} aria-label={`查看${version.name}班级详情`} onClick={()=>onDetail(version.id)} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onDetail(version.id);}}}>
   <span className="class-ai-mark">AI</span><span className="class-version-badge">{version.versionLabel}</span><h3>{version.name}</h3><span className="class-version-summary">{version.abilityIds.length} 个能力目标 · {version.knowledgeIds.length} 个知识点{version.isDemo&&' · 教学示例'}</span>
   <div className="class-card-meta"><span><Icon name="users" size={17}/>{version.members}</span><span><Icon name="calendar" size={17}/>{version.semester}</span></div>
   <button className="class-teach-button" onClick={event=>{event.stopPropagation();onTeach(version.id);}}>上课<Icon name="arrow" size={14}/></button>
  </article>)}</section>:<div className="classroom-no-results">{mode==='listen'?'暂无听课课程':'暂无匹配课程'}</div>}
  </div>
  {creating&&<VersionCreateDialog versions={versions} catalog={catalog} onClose={()=>setCreating(false)} onCreate={version=>{const saved=onCreate(version);setQuery('');setCreating(false);return saved;}}/>}
 </main>;
}
export {ClassDetail} from './ClassDetail';
