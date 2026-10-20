export const CUTOFF='2026-10-12 00:00:00';
export const APPLICATIONS=[['24H智能学伴','#397aff','robot'],['讲伴','#73a7ff','chats'],['智能推题','#9a7ef8','target'],['智能备课助手','#35c2cd','book'],['智能体协作','#78d4f4','users']];
export const QUESTION_TYPES=['自由问答','指令问题','推荐问题','资料查询'];
const topics=[
 ['PLC扫描周期','PLC扫描周期为什么会影响输入信号的检测？','输入采样、程序执行和输出刷新按扫描周期运行。先用监控表对照输入映像与输出状态，再检查短脉冲是否需要高速计数或中断。','程序设计','自由问答'],
 ['电机启停互锁','输送线PLC程序中，如何避免停止后自动重启？','先画出停止、预警、运行与故障状态转换表；上电、复位与急停释放后回到停止状态，只有新的启动沿才允许运行。请在仿真中验证复位和上电用例。','逻辑调试','自由问答'],
 ['定时器应用','TON与TOF定时器在延时停机中有什么区别？','TON在条件保持时延时置位，TOF在条件撤销后延时复位。对照输送线无料延时5秒的状态表，记录IN、ET、Q，检查切换状态时的复位逻辑。','程序设计','自由问答'],
 ['工业传感器选型','金属工件分拣应该如何选择接近传感器？','比较工件材质、检测距离、安装空间和输出形式。金属检测可比较电感式方案，非金属检测需要结合光电方案；用样件测量误触发情况后确认。','传感检测','推荐问题'],
 ['I/O地址分配','帮我检查PLC的I/O地址分配表是否有重复。','请提供地址分配表。逐项核对DI、DO与实际端子，检查重复地址、未用点位及失电状态，形成带版本号的核查记录。','硬件组态','指令问题'],
 ['气动顺序控制','双工位气缸握手信号应如何设置？','按夹紧、加工完成、回位和工位就绪建立握手条件。每个动作检查到位与超时信号，保存卡在某状态时的输入输出记录后复测。','顺序控制','自由问答'],
 ['PLC故障诊断','PLC输出有信号，但电机不运行，怎么排查？','按电源、驱动就绪、使能、输出端子和接线逐层核查，先在仿真验证程序条件。现场上电和强电排查须由教师指导，普通PLC程序不替代独立安全回路。','故障诊断','自由问答'],
 ['功能安全基础','查找实训设备上电前的安全检查资料。','可参考课程知识库的《实训设备上电前检查表》与《电气装调实训指导》。先完成断电检查，核对保护措施与独立安全回路，再由教师批准上电。','安全规范','资料查询'],
 ['机器人坐标系','机器人示教时，工具坐标系与工件坐标系如何区分？','工具坐标系描述工具末端，工件坐标系描述任务对象的位置。先在虚拟环境比较相同点位的坐标表示，再记录标定步骤与偏差。','设备联调','自由问答'],
 ['验收记录','帮我生成输送线20项功能验收的记录模板。','模板建议包括用例编号、输入条件、预期输出、实际输出、操作者、版本与复核结果。将启动、停止、上电、报警和复位分别列为独立用例。','质量控制','指令问题'],
 ['工程责任与质量意识','如何把工匠精神落实到PLC调试记录中？','保留问题复现条件、原始轨迹、修改依据与复测结果，避免只写“已修复”。通过可追溯的交接记录体现质量意识与团队责任。','思政建设','自由问答'],
 ['变量监控与追踪','推荐一些PLC程序在线监控的练习。','建议从I/O核查、定时器监控和状态转换追踪三项练习开始，每项提交截图、观察记录与异常分析，再尝试故障注入和恢复验证。','逻辑调试','推荐问题']
];
export function createDecisionData(){
 const classes=[
 {id:'dc-fall-01',name:'2026秋 · 机电2401班',term:'2026年秋季学期',students:46,teachers:2,past:false},
 {id:'dc-fall-02',name:'2026秋 · 机电2402班',term:'2026年秋季学期',students:44,teachers:2,past:false},
 {id:'dc-fall-03',name:'2026秋 · 自动化2401班',term:'2026年秋季学期',students:42,teachers:1,past:false},
 {id:'dc-spring-01',name:'2026春 · 机电2301班',term:'2026年春季学期',students:45,teachers:2,past:true}
 ];
 const surnames=['陈','李','王','张','刘','赵','周','吴','徐','孙','马','朱','胡','郭','何','林'];const given=['子涵','宇航','思远','雨桐','浩然','佳宁','嘉琪','文博','欣怡','梓轩','明哲','若楠'];
 let seed=461;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const sessions=[];
 classes.forEach((c,ci)=>{for(let day=0;day<29;day++){
 const date=new Date(Date.UTC(2026,c.past?4:8,(c.past?4:13)+day));const ds=date.toISOString().slice(0,10);const weekend=[0,6].includes(date.getUTCDay());const total=weekend?4+Math.floor(rand()*5):15+Math.floor(rand()*16);
 for(let j=0;j<total;j++){
 const teacher=rand()<.085;const person=Math.floor(rand()*(teacher?c.teachers:c.students-4));const pick=rand();const app=teacher?'智能备课助手':pick<.51?'24H智能学伴':pick<.72?'讲伴':pick<.88?'智能推题':'智能体协作';
 const turns=Array.from({length:1+Math.floor(rand()*4)},(_,ti)=>{const index=Math.floor(rand()*topics.length);const t=topics[index];const question=teacher?`请围绕${t[0]}设计一份包含学情诊断和评价证据的教学活动。`:app==='智能推题'?`请推荐${t[0]}的分层练习，并说明错题复盘方法。`:app==='智能体协作'?`请协同分析${t[0]}方案，整理检查清单和验证步骤。`:t[1];const answer=teacher?`教学建议：先用一个${t[0]}的情境问题诊断先备知识，再安排小组实践、观察记录和同伴复核。过程评价关注操作依据和证据完整性，结束时提交反思与改进方案。`:app==='智能推题'?`练习分为概念识别、情境应用和综合调试三层。每层先独立作答，再对照${t[0]}的课程指南记录错因；将误区转化为一条新的验证用例。`:t[2];const type=teacher||app==='智能体协作'?'指令问题':app==='智能推题'?'推荐问题':t[4];return {id:`turn-${ci}-${day}-${j}-${ti}`,topic:t[0],question,answer,category:t[3],type,command:teacher?'生成教学设计':app==='智能体协作'?'协同方案评审':app==='智能推题'?'薄弱点练习':type==='指令问题'?(index===4?'I/O核查':'生成验收模板'):'课程问答',minutes:2+Math.floor(rand()*10),feedback:rand()<.78?'有帮助':'未评价'};});
 const hour=weekend?18+Math.floor(rand()*4):rand()<.7?8+Math.floor(rand()*9):19+Math.floor(rand()*3);
 sessions.push({id:`DC-${ci+1}-${day+1}-${j+1}`,classId:c.id,className:c.name,term:c.term,date:ds,time:`${ds} ${String(hour).padStart(2,'0')}:${String(Math.floor(rand()*60)).padStart(2,'0')}`,userId:`${c.id}-${teacher?'t':'s'}-${person}`,name:teacher?['李明','王芳','张伟','刘洋'][(ci+person)%4]:surnames[person%surnames.length]+given[(person+ci*3)%given.length],studentNo:teacher?'—':`26${ci+1}${String(person+1).padStart(3,'0')}`,role:teacher?'教师':'学生',app,entry:rand()<.7?'课程工作台':'学生移动端',turns,source:'课程决策中心模拟运行数据'});
 }
 }});
 return {classes,commandCount:topics.length,agentCount:APPLICATIONS.length,sessions:sessions.sort((a,b)=>b.time.localeCompare(a.time)),source:'教学情境模拟，不代表真实学生记录'};
}
export function filterSessions(sessions,filters={}){
 const {classId,term,app,role,type,topic,entry,query='',start,end}=filters;const needle=query.trim().toLowerCase();
 return sessions.filter(r=>(!classId||classId==='all'||r.classId===classId)&&(!term||term==='all'||r.term===term)&&(!app||app==='all'||r.app===app)&&(!role||role==='all'||r.role===role)&&(!entry||entry==='all'||r.entry===entry)&&(!start||r.date>=start)&&(!end||r.date<=end)).map(r=>({...r,turns:r.turns.filter(t=>(!type||type==='all'||t.type===type)&&(!topic||t.topic===topic)&&(!needle||`${r.name} ${r.studentNo} ${t.question} ${t.answer}`.toLowerCase().includes(needle)))})).filter(r=>r.turns.length);
}
export function summarizeSessions(sessions,classes=[]){
 const turns=sessions.flatMap(r=>r.turns);const students=sessions.filter(r=>r.role==='学生');const enrolled=classes.reduce((n,c)=>n+c.students,0);const studentCount=new Set(students.map(r=>r.userId)).size;
 const trend=new Map();for(const r of sessions){if(!trend.has(r.date))trend.set(r.date,{date:r.date,uses:0,users:new Set()});const d=trend.get(r.date);d.uses+=r.turns.length;d.users.add(r.userId);}
 return {sessions:sessions.length,uses:turns.length,minutes:turns.reduce((n,t)=>n+t.minutes,0),users:new Set(sessions.map(r=>r.userId)).size,students:studentCount,teachers:new Set(sessions.filter(r=>r.role==='教师').map(r=>r.userId)).size,enrolled,classes:new Set(sessions.map(r=>r.classId)).size,terms:new Set(sessions.map(r=>r.term)).size,studentUses:students.reduce((n,r)=>n+r.turns.length,0),studentMinutes:students.reduce((n,r)=>n+r.turns.reduce((n,t)=>n+t.minutes,0),0),studentRate:enrolled?studentCount/enrolled*100:0,applications:APPLICATIONS.map(([name,color])=>({name,color,value:sessions.filter(r=>r.app===name).reduce((n,r)=>n+r.turns.length,0)})),trend:[...trend.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(d=>({...d,users:d.users.size}))};
}
export function buildInsight(sessions){
 const turns=sessions.flatMap(r=>r.turns);const ranking=key=>{const map=new Map();for(const t of turns){const name=t[key];if(!map.has(name))map.set(name,{name,value:0,topic:t.topic,question:t.question,type:t.type});map.get(name).value++;}return [...map.values()].sort((a,b)=>b.value-a.value);};
 return {questions:ranking('question'),knowledge:ranking('topic'),commands:ranking('command'),types:QUESTION_TYPES.map((name,i)=>({name,value:turns.filter(t=>t.type===name).length,color:['#8ed9fc','#39cbd9','#b591fc','#5da6ff'][i]})),quality:turns.filter(t=>t.category==='思政建设')};
}
export function toCSV(headers,rows){const cell=value=>{let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};return '\uFEFF'+[headers,...rows].map(row=>row.map(cell).join(',')).join('\r\n');}
export function detailCSV(rows){return toCSV(['记录来源','会话ID','提问时间','教学班','姓名','学号','角色','AI应用','提问入口','问题类型','知识点','问题','回答','使用时长(分钟)'],rows.flatMap(r=>r.turns.map(t=>[r.source,r.id,r.time,r.className,r.name,r.studentNo,r.role,r.app,r.entry,t.type,t.topic,t.question,t.answer,t.minutes])));}
