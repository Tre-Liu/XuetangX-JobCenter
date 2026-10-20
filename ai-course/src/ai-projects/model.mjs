import {createProject,createStage,createTask} from '../project.mjs';
import {defaultExplanation} from '../media/defaults.mjs';
export const AI_DEMO_KEY='ai-course-ai-projects-2026-10-12';
export const fileAccept='.mp4,.webm,.mov,.m4v,.avi,.doc,.docx,.rtf,.xls,.xlsx,.csv,.ppt,.pptx,.pdf,.zip,.rar,.txt,.md,.json,.png,.jpg,.jpeg,.webp';
export const emptyInfo=()=>({html:'',resources:[],visibility:{teacher:true,student:true}});
export function projectInfo(project){return {...emptyInfo(),...project.info,resources:project.info?.resources||[],visibility:{teacher:true,student:true,...project.info?.visibility}};}
export function safeExternalUrl(value){try{const u=new URL(value.trim());return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function validateFile(file){if(!fileAccept.split(',').some(ext=>file.name.toLowerCase().endsWith(ext)))return '不支持此文件格式，请选择视频、办公文档、PDF、压缩包或图片。';if(file.size>200*1024*1024)return '单个文件不能超过 200 MB';if(!file.size)return '不能上传空文件';return '';}
export function sanitizeRichHtml(html,doc=globalThis.document){
 const template=doc.createElement('template');template.innerHTML=html||'';
 const allowed=new Set(['P','BR','H1','H2','H3','H4','H5','H6','STRONG','B','EM','I','U','S','STRIKE','UL','OL','LI','BLOCKQUOTE','A','IMG','DIV','SPAN']);
 for(let element of [...template.content.querySelectorAll('*')]){
  if(['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH','FORM','INPUT'].includes(element.tagName)){element.remove();continue;}
  if(element.tagName==='FONT'){const span=doc.createElement('span');span.style.color=element.getAttribute('color')||'';span.append(...element.childNodes);element.replaceWith(span);element=span;}
  if(!allowed.has(element.tagName)){element.replaceWith(...element.childNodes);continue;}
  const styles=[];
  for(const [key,values] of Object.entries({'font-weight':['normal','bold','400','600','700'],'font-style':['normal','italic'],'text-decoration-line':['none','underline','line-through','underline line-through'],'text-align':['left','center','right','justify'],'list-style-type':['decimal','lower-alpha','upper-alpha','lower-roman','upper-roman','disc','circle','square']})){
   let value=element.style.getPropertyValue(key);
   if(key==='text-decoration-line'&&!value)value=element.style.getPropertyValue('text-decoration');
   if(key==='text-align'&&!value)value=element.getAttribute('align');
   if(values.includes(value))styles.push(`${key}:${value}`);
  }
  for(const key of ['color','background-color']){const value=element.style.getPropertyValue(key);if(value&&/^(#[a-f0-9]{3,8}|[a-z]+|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i.test(value)&&!['inherit','initial','unset','revert','currentcolor'].includes(value.toLowerCase()))styles.push(`${key}:${value}`);}
  const styleRules=styles.join(';');
  const href=element.tagName==='A'?safeExternalUrl(element.getAttribute('href')||''):'';
  const src=element.tagName==='IMG'?element.getAttribute('src')||'':'';
  const imageAllowed=/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(src);
  for(const attribute of [...element.attributes])element.removeAttribute(attribute.name);
  if(styleRules)element.setAttribute('style',styleRules);
  if(href){element.setAttribute('href',href);element.setAttribute('target','_blank');element.setAttribute('rel','noopener noreferrer');}
  if(element.tagName==='IMG'){if(!imageAllowed){element.remove();continue;}element.setAttribute('src',src);element.setAttribute('alt','项目简介图片');}
 }
 return template.innerHTML;
}
export const RICH_TEXT_LIMIT=5000;
export function richTextLength(html,doc=globalThis.document){const template=doc.createElement('template');template.innerHTML=html||'';return Array.from(template.content.textContent||'').length;}
export function richSelectionCoversContents(range,editor){
 if(!range||!editor.contains(range.commonAncestorContainer))return false;
 const boundary=editor.ownerDocument.createRange();boundary.selectNodeContents(editor);
 const Range=editor.ownerDocument.defaultView.Range;
 return range.compareBoundaryPoints(Range.START_TO_START,boundary)<=0&&range.compareBoundaryPoints(Range.END_TO_END,boundary)>=0;
}
export function homeResources(project,audience){const info=projectInfo(project);return info.visibility[audience]?info.resources.filter(r=>r.visibility?.[audience]===true):[];}
const inline=(mime,text)=>`data:${mime};charset=utf-8,${encodeURIComponent(text)}`;
const phases=['明确任务与获取信息','制定工作计划','方案决策','实施与过程记录','检查与质量控制','评价反馈与迁移'];
const scenarios=[
 {id:'diagnosis',title:'PLC故障诊断AI助手',description:'让AI基于I/O记录和设备手册提出排查建议，用仿真和人工复核验证每条结论。',sample:'36条训练案例、12条独立验证案例，覆盖传感器异常、互锁未满足、通信中断和气缸超时。',deliverable:'故障案例库、诊断提示词、建议与证据对照表、12条独立验证报告',groups:[['界定诊断边界与操作权限','整理36条历史故障教学案例'],['设计I/O及报警数据模板','划分训练集与12条验证集','编制分工与版本计划'],['比较规则检索与AI诊断方案','评审证据引用与拒答策略'],['整理带来源的故障知识库','编写诊断提示词与检索流程','建立建议与证据对照表'],['运行12条独立案例测试','复测错判与缺少证据的拒答','检查提示词注入与敏感信息'],['演示诊断与人工确认流程','迁移到双工位装配故障场景']]},
 {id:'maintenance',title:'设备维护知识问答助手',description:'整理PLC维护资料，构建带出处的问答助手，帮助新成员查找维护流程和安全要求。',sample:'18份教学维护资料、40条问答样例、20条独立验收题；未检索到依据时要求说明未知。',deliverable:'资料索引、问答样例集、带出处的回答、20题验收表、维护交接说明',groups:[['识别设备维护常见问题','收集18份资料并登记来源'],['制定文档命名和版本规范','准备40条问答样例','设计20条独立验收题'],['比较关键词与语义检索','评审引用格式与安全回答边界'],['整理分段资料和出处索引','配置问答提示词与知识检索','记录40条样例回答及修订'],['核验20题答案与引用位置','测试未知问题和过期资料','复核隐私与越权操作建议'],['交付维护问答使用说明','制定资料更新与失效流程']]},
];
export function aiDemoProjects(){return scenarios.map(spec=>{
 const p=createProject(spec.title,spec.description);p.id=`ai-demo-${spec.id}`;p.projectType='ai';p.provenance={origin:'teaching-simulation',note:'教学模拟项目，数据、验收结果与附件均为示例，不代表企业实测或已接入AI服务。'};
 p.drivingQuestion={role:'PLC实训项目小组',scenario:'在校内实训台构建AI辅助工具，教师负责安全操作审批。',status:spec.sample,outline:spec.description};
 p.stages=spec.groups.map((titles,i)=>{const s=createStage(phases[i]);s.id=`${p.id}-stage-${i}`;s.tasks=titles.map((title,j)=>{const t=createTask(title);t.id=`${s.id}-task-${j}`;t.description=`任务情境：围绕${spec.title}开展${title}。\n\n实施步骤：明确输入与责任人；整理带版本和来源的记录；完成本任务操作；由同伴交叉复核。\n\n成果与评价：提交${title}记录，保留输入、输出、异常与修订；引用须可追溯，AI建议须人工核验，不能直接驱动设备。\n\n学习支持：项目任务书、案例数据和教师反馈。`;return t;});
 const goalId=`${s.id}-goal`;s.evaluation={goals:{knowledge:[{id:goalId,title:'理解本阶段数据与证据要求'}],skill:[{id:`${goalId}-skill`,title:`完成${titles.at(-1)}并提供记录`}],quality:[{id:`${goalId}-quality`,title:'如实记录AI错误并完成同伴复核'}]},activities:[{id:`${s.id}-evaluation`,title:`${phases[i]}成果评审`,taskId:s.tasks.at(-1).id,goalIds:[goalId,`${goalId}-skill`,`${goalId}-quality`],evidence:`${titles.at(-1)}记录与版本清单`,criteria:'数据范围清晰，引用可复核；保留异常并由教师确认。',weight:[10,15,15,30,20,10][i],scored:true,subjects:['teacher','self','peer']}]};return s;});
 const rtfText=(`AI项目任务书：${spec.title}\n项目背景：${spec.description}\n教学数据：${spec.sample}\n交付成果：${spec.deliverable}\n资料与验收为教学模拟，AI输出须引用证据并由教师核验。`).split('').map(c=>c==='\n'?'\\par ':c.charCodeAt(0)>127?'\\u'+(c.charCodeAt(0)>32767?c.charCodeAt(0)-65536:c.charCodeAt(0))+'?':c).join('');
 const report=inline('application/rtf',`{\\rtf1\\ansi\\deff0\\uc1 ${rtfText}}`);
 const faultTypes=[['传感器异常','I0.3=0;传感器LED常亮','断电核对接线与供电;核查输入监控'],['互锁未满足','I0.2=0;Q0.0=0','确认安全反馈和启动前提;禁止屏蔽互锁'],['气缸超时','I0.4=0;报警T01','核对气压和到位反馈;停止动作后检查'],['通信中断','PLC离线;报警NET01','核对设备地址与链路;保留诊断记录']];
 const csvRows=spec.id==='diagnosis'?Array.from({length:48},(_,i)=>{const [type,state,expected]=faultTypes[i%4];return [`D${String(i+1).padStart(2,'0')}`,i<36?'训练':'验证',type,state,`2026-09-${String(1+i%28).padStart(2,'0')} 09:${String(i%60).padStart(2,'0')}`,`设备手册示例第${12+i%8}页`,expected,i<36?'已核对样例':i===43||i===47?'需修订引用':'待独立复核','教学模拟'].join(',');}):Array.from({length:60},(_,i)=>[`Q${String(i+1).padStart(2,'0')}`,i<40?'样例':'验收',['如何备份PLC程序？','传感器输入不变化如何排查？','故障复位后能否自动重启？','更换模块前需确认哪些信息？'][i%4],`维护资料${String(1+i%18).padStart(2,'0')};版本V1.0`,['先核对项目版本再备份;保留校验记录','核查供电接线与输入监控;教师确认后操作','需人工确认并重新启动;不得绕过安全回路','记录模块型号与地址;断电核查后由教师确认'][i%4],'待人工核验','教学模拟'].join(','));
 const csv=inline('text/csv','\uFEFF'+(spec.id==='diagnosis'?'案例编号,数据集,故障类型,输入状态,发生时间,依据,预期建议,复核状态,来源':'问题编号,数据集,问题,资料出处,参考回答,复核状态,来源')+'\n'+csvRows.join('\n')+'\n');
 p.info={html:`<h2>${spec.title}</h2><p>本项目以<strong>电气控制与PLC实训</strong>为情境，训练学生将AI输出与设备资料、测试记录逐项核对的能力。</p><h3>项目目标</h3><ul><li>完成带出处的数据整理与知识检索。</li><li>设计可迭代的提示词，明确拒答和人工确认条件。</li><li>用独立测试集检验输出，保留失败案例。</li></ul><h3>任务背景与数据</h3><p>${spec.sample}</p><h3>交付成果</h3><p>${spec.deliverable}。</p><blockquote>AI只提供排查或资料查询建议。涉及上电、机械动作和安全回路的操作须由教师确认。</blockquote><p>数据与附件为教学模拟材料，实施前需根据实训设备复核。</p>`,visibility:{teacher:true,student:spec.id==='diagnosis'},resources:[
 {id:`${p.id}-brief`,kind:'file',name:'AI项目任务书.rtf',url:report,size:new Blob([decodeURIComponent(report.split(',')[1])]).size,mime:'application/rtf',visibility:{teacher:true,student:true},origin:'teaching-simulation'},
 {id:`${p.id}-cases`,kind:'file',name:'故障案例与复核记录.csv',url:csv,size:new Blob([decodeURIComponent(csv.split(',')[1])]).size,mime:'text/csv',visibility:{teacher:true,student:true},origin:'teaching-simulation'},
 {id:`${p.id}-video`,kind:'file',name:'PLC实训操作讲解.mp4',url:defaultExplanation.assets.video.url,size:defaultExplanation.assets.video.size,mime:'video/mp4',visibility:{teacher:true,student:true},origin:'generated-teaching-media'},
 {id:`${p.id}-prompts`,kind:'file',name:'诊断提示词与验收清单.zip',url:'data:application/zip;base64,UEsDBBQAAAAIABpQTF3YjxugTwAAAEoAAAAKAAAAUkVBRE1FLnR4dAFKALX/5pWZ5a2m5qih5ouf5p2Q5paZ44CCQUnlu7rorq7pnIDkurrlt6XlpI3moLjvvIzkuI3lvpfnm7TmjqXmjqfliLborr7lpIfjgIJQSwMEFAAACAgAGlBMXRS1ef2AAAAAggAAABIAAADor4rmlq3mj5DnpLror40ubWQNy0sKwjAUBdB5VyG40VaMSjDx21alUAdGRGjjoJYSi5vRd/M6cgtmfDjjEVIxnAq2ElmF1dpfHFsVkVjg3KE0/N6RMF62iJNvpyENV1fk7ZA3v35JM0V96vc3fk6RHcOnuYPehkgvx3X9iSe+d/TYsE2g6hDZNjhoFHdfmqDRH1BLAwQUAAAICAAaUExd7c9JC3sAAACNAAAAEAAAAOmqjOaUtua4heWNlS5jc3ZNzM0OwUAUhuF9r+VscIWCDeqv1VQyJU0Q6WLGgorOcDXOd07vwoJF1++TV0LGywe11Rxp3ZZPEp9gb6IesW/UWuSOV2cOW0kveh8j2xG/J1JatceoT7+M2UZ8ofUUxQhJ/HmZDhqQhIava3VDxP+fuhvyBUwlh1OHfgFQSwECFAMUAAAACAAaUExd2I8boE8AAABKAAAACgAAAAAAAAAAAAAAgAEAAAAAUkVBRE1FLnR4dFBLAQIUAxQAAAgIABpQTF0UtXn9gAAAAIIAAAASAAAAAAAAAAAAAACAAXcAAADor4rmlq3mj5DnpLror40ubWRQSwECFAMUAAAICAAaUExd7c9JC3sAAACNAAAAEAAAAAAAAAAAAAAAgAEnAQAA6aqM5pS25riF5Y2VLmNzdlBLBQYAAAAAAwADALYAAADQAQAAAAA=',size:668,mime:'application/zip',visibility:{teacher:true,student:false},origin:'teaching-simulation'},
 {id:`${p.id}-siemens`,kind:'link',name:'西门子工业支持 · 查找设备手册',url:'https://support.industry.siemens.com/',description:'根据实训设备的订货号和版本查找原厂资料。',visibility:{teacher:true,student:true}},
 {id:`${p.id}-python`,kind:'link',name:'Python官方文档 · 数据处理参考',url:'https://docs.python.org/zh-cn/3/',description:'用于案例数据读取和校验；第三方资源在新窗口打开。',visibility:{teacher:false,student:true}},
 ]};return p;
});}
export function addAiDemos(storage,projects){
 try{if(storage.getItem(AI_DEMO_KEY)==='done')return projects;}catch{return projects;}
 const shouldSeed=projects.some(p=>p.id?.startsWith('plc-demo-'));
 const result=shouldSeed?[...projects,...aiDemoProjects().filter(d=>!projects.some(p=>p.id===d.id))]:projects;
 try{storage.setItem('ai-course-projects-v1',JSON.stringify(result));storage.setItem(AI_DEMO_KEY,'done');return result;}catch{return projects;}
}
