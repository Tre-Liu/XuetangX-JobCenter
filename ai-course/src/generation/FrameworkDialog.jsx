import {useState} from 'react';
import {DrivingQuestionFields} from '../components/ProjectDescription';
import {Modal} from '../components/Modal';
import {Icon} from '../components/Icon';
export function FrameworkDialog({project,onClose,onGenerate}){
 const [question,setQuestion]=useState(project.drivingQuestion||{outline:project.description||''});
 return <Modal title="AI 生成项目框架" className="framework-description-modal" onClose={onClose} footer={<><button className="outlined" onClick={onClose}>取消</button><button className="primary" onClick={()=>onGenerate(question)}><Icon name="sparkle" size={16}/>开始生成</button></>}>
  <p>将基于当前项目：</p><div className="current-project">{project.title}</div>
  <DrivingQuestionFields value={question} onChange={setQuestion}/>
  <p>自动生成：</p><div className="generation-types"><span><Icon name="tree" size={18}/>项目阶段</span><span><Icon name="book" size={18}/>项目任务</span></div>
  <ul className="generation-notes">{['不会生成学习内容','生成后覆盖当前项目的阶段、任务及其内容','可在生成后继续编辑调整'].map(note=><li key={note}><Icon name="info" size={16}/>{note}</li>)}</ul>
 </Modal>;
}
