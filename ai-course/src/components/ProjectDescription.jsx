import {useEffect,useId,useRef,useState} from 'react';
import {resolveExplanation} from '../media/project-flow.mjs';
import './ProjectDescription.css';
export const questionFields=[['role','角色',200,'学生将在项目中承担什么角色？'],['scenario','情景',500,'项目发生在什么场景，有哪些工作条件？'],['status','现状',500,'目前存在什么问题、限制或改进需求？'],['outline','问题总纲',1000,'本项目需要解决的核心问题是什么？']];
export function DrivingQuestionFields({value={},onChange}){
 const uid=useId();
 return <section className="driving-question"><h3>驱动性问题</h3><p>明确角色与情境，以真实问题组织项目学习。</p><div className="driving-question-grid">{questionFields.map(([key,label,limit,placeholder])=><label key={key} htmlFor={`${uid}-${key}`} className={key==='outline'?'question-outline':''}><span>{label}</span><textarea id={`${uid}-${key}`} aria-label={label} rows={key==='outline'?3:2} placeholder={placeholder} maxLength={limit} value={value[key]||''} onChange={e=>onChange({...value,[key]:e.target.value.slice(0,limit)})}/><small className="field-count" aria-live="polite">{(value[key]||'').length}/{limit}</small></label>)}</div></section>;
}
function openMediaDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open('ai-course-explanations-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('files');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function saveFile(file){const db=await openMediaDB();const key=crypto.randomUUID();try{await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(file,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});return key;}finally{db.close();}}
async function readFile(key){const db=await openMediaDB();try{return await new Promise((resolve,reject)=>{const request=db.transaction('files').objectStore('files').get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}}
function AssetView({asset,type}){
 const [url,setUrl]=useState(asset?.url||'');const [error,setError]=useState('');
 useEffect(()=>{let alive=true,objectUrl;setUrl(asset?.url||'');setError('');if(asset?.storageKey)readFile(asset.storageKey).then(file=>{if(!alive)return;if(!file)throw Error();objectUrl=URL.createObjectURL(file);setUrl(objectUrl);}).catch(()=>{if(alive)setError('素材无法读取，请重新上传');});return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};},[asset]);
 if(error)return <p role="alert">{error}</p>;
 if(!url)return <p>正在读取素材…</p>;
 return type==='video'?<video key={url} src={url} poster={asset.poster} controls preload="metadata" aria-label="项目视频讲解"/>:<img src={url} alt="项目图片讲解"/>;
}
export function ExplanationMedia({value,onChange,project}){
 const explanation=resolveExplanation(value,project);const type=explanation.type||'image';const asset=explanation.assets?.[type];
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[expanded,setExpanded]=useState(false);const version=useRef(0);const input=useRef(null);
 useEffect(()=>()=>{version.current++;},[]);
 const changeType=type=>{version.current++;setBusy(false);setError('');setExpanded(false);onChange({...explanation,type});};
 const upload=async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;setError('');if(!(type==='image'?['image/png','image/jpeg','image/webp'].includes(file.type):file.type==='video/mp4')){setError(type==='image'?'请选择 PNG、JPG 或 WebP 图片':'请选择 MP4 视频');return;}if(file.size>100*1024*1024){setError('文件大小不能超过 100 MB');return;}const token=++version.current;setBusy(true);try{const storageKey=await saveFile(file);if(token!==version.current)return;onChange({...explanation,assets:{...explanation.assets,[type]:{name:file.name,size:file.size,storageKey,origin:'local-file'}}});}catch{if(token===version.current)setError('上传失败，请重新选择文件');}finally{if(token===version.current)setBusy(false);}};
 return <section className="explanation-media"><div className="explanation-heading"><h3>项目讲解</h3>{onChange&&<div className="explanation-types" role="group" aria-label="讲解方式">{[['image','图片讲解'],['video','视频讲解']].map(([key,label])=><button key={key} type="button" aria-pressed={type===key} onClick={()=>changeType(key)}>{label}</button>)}</div>}</div>
 {asset?<><div className={`explanation-preview ${type}-preview ${expanded?'expanded':''}`}><AssetView asset={asset} type={type}/></div><div className="explanation-file"><div><strong>{asset.name}</strong><small>已上传{asset.size?` · ${(asset.size/1024/1024).toFixed(2)} MB`:''}</small></div>{onChange&&<div><button type="button" onClick={()=>setExpanded(v=>!v)}>{expanded?'收起预览':'预览'}</button><button type="button" disabled={busy} onClick={()=>input.current?.click()}>替换</button><button type="button" disabled={busy} onClick={()=>{version.current++;setExpanded(false);onChange({...explanation,assets:{...explanation.assets,[type]:null}});}}>删除</button></div>}</div></>:onChange?<button type="button" className="explanation-upload" disabled={busy} onClick={()=>input.current?.click()}><strong>＋ 上传{type==='image'?'图片':'视频'}讲解</strong><span>{type==='image'?'支持 PNG、JPG、WebP':'支持 MP4'}，最大 100 MB</span></button>:<p>暂无讲解素材</p>}
 {onChange&&<input ref={input} hidden type="file" aria-label={`上传${type==='image'?'图片':'视频'}讲解`} accept={type==='image'?'image/png,image/jpeg,image/webp':'video/mp4'} onChange={upload}/>} {busy&&<p role="status">正在上传…</p>}{error&&<p className="form-error" role="alert">{error}</p>}
 </section>;
}
export function ProjectDescription({project,onChange}){
 return <div className="project-description-panel"><ExplanationMedia project={project} value={project.explanation} onChange={onChange}/></div>;
}
export function ProjectQuestionSummary({project}){
 const question=project.drivingQuestion;
 if(!question||!questionFields.some(([key])=>question[key]))return null;
 return <section className="project-question-panel question-summary" aria-label="项目情境与任务要求"><dl>{questionFields.map(([key,label])=>question[key]&&<div key={key}><dt>{label}</dt><dd>{question[key]}</dd></div>)}</dl></section>;
}
