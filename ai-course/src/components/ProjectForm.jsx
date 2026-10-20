import {DrivingQuestionFields,ExplanationMedia} from './ProjectDescription';
import { Icon } from './Icon';

const icons=[['project-stack','叠层'],['project-circles','圆环'],['project-triangle','三角']];

export function ProjectForm({form,setForm,onSave}){
 const patch=(key,value)=>setForm(previous=>({...previous,[key]:value}));
 return <form className="project-metadata-form" onSubmit={event=>{event.preventDefault();onSave();}}>
  <div className="project-type-selector" role="group" aria-label="项目类型"><span>项目类型</span>{[['standard','普通项目'],['ai','AI项目']].map(([key,label])=><button type="button" key={key} aria-pressed={(form.projectType||'standard')===key} onClick={()=>patch('projectType',key)}>{label}</button>)}</div>
  <div className="project-icon-row"><span id="project-icon-label">ICON</span><div className="project-icon-options" role="group" aria-labelledby="project-icon-label">{icons.map(([name,label])=><button key={name} type="button" aria-label={`${label}图标`} aria-pressed={form.icon===name} className={form.icon===name?'selected':''} onClick={()=>patch('icon',name)}><Icon name={name} size={21}/></button>)}</div></div>
  <div className="project-field-group">
   <label htmlFor="project-title"><span><b aria-hidden="true">*</b>标题</span><input id="project-title" required maxLength={80} placeholder="请输入项目名称" value={form.title} onChange={event=>patch('title',event.target.value)}/></label>
   <label htmlFor="project-title-en"><span>标题（英文）</span><input id="project-title-en" maxLength={160} placeholder="请输入项目英文名称" value={form.titleEn} onChange={event=>patch('titleEn',event.target.value)}/></label>
  </div>
  <div className="project-field-group project-description-group">
   <label htmlFor="project-description"><span><b aria-hidden="true">*</b>描述</span><textarea id="project-description" required maxLength={1000} placeholder="请输入" value={form.description} onChange={event=>patch('description',event.target.value.slice(0,1000))}/><small className="field-count" aria-live="polite">{form.description.length}/1000</small></label>
   <label htmlFor="project-description-en"><span>描述（英文）</span><textarea id="project-description-en" maxLength={2000} placeholder="请输入" value={form.descriptionEn} onChange={event=>patch('descriptionEn',event.target.value.slice(0,2000))}/><small className="field-count" aria-live="polite">{form.descriptionEn.length}/2000</small></label>
  </div>
  <DrivingQuestionFields value={form.drivingQuestion} onChange={value=>patch('drivingQuestion',value)}/>
  <ExplanationMedia project={form} value={form.explanation} onChange={value=>patch('explanation',value)}/>
 </form>;
}
