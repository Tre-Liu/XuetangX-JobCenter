import {useMemo,useState} from 'react';
import {calculateAttainment} from './versions.mjs';
import {Icon} from '../components/Icon';

export function ClassGrades({classroom,catalog,notify}){
 const [query,setQuery]=useState('');
 const rows=useMemo(()=>(classroom.students||[]).map(student=>({...student,grade:calculateAttainment(classroom,catalog,student.id).overall})),[classroom,catalog]);
 const scores=rows.map(student=>student.grade).filter(grade=>grade!==null);
 const average=scores.length?scores.reduce((sum,score)=>sum+score,0)/scores.length:null;
 const counts=[0,0,0,0];scores.forEach(score=>counts[score<60?0:score<70?1:score<85?2:3]++);
 const maximum=Math.max(1,...counts),visible=rows.filter(student=>`${student.name} ${student.studentNo}`.includes(query.trim()));
 const display=value=>value===null?'未评价':value.toFixed(1);
 return <div className="cd-page cd-grades">
  <div className="cd-grade-overview">
   <section className="cd-panel cd-grade-plan"><h2>课程考核方案</h2><p className="cd-muted">共 {classroom.questionIds.length} 道考核题 | 满分：100分</p><p className="cd-grade-source">按本版本能力权重测算；未评价不纳入均值。{classroom.isDemo?'当前为教学模拟成绩。':''}</p><button className="cd-action primary" onClick={()=>notify('请在设置中配置能力权重及达成度规则')}>管理课程考核方案<Icon name="arrow" size={17}/></button></section>
   <section className="cd-panel cd-grade-chart"><h2>成绩概览</h2><div className="cd-grade-visual">
    <div className="cd-grade-average"><div className="cd-average-circle"><strong className={average===null?'cd-average-unscored':''}>{display(average)}</strong><span>班级平均分</span></div><div className="cd-grade-extremes">{[['100','满分'],[scores.length?Math.max(...scores).toFixed(1):'—','最高分'],[scores.length?Math.min(...scores).toFixed(1):'—','最低分']].map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></div>
    <div className="cd-grade-distribution"><p>已评价学生人数（人）</p><div className="cd-chart-grid">{[5,4,3,2,1,0].map(n=><span key={n}>{Number((n*maximum/5).toFixed(1))}</span>)}</div><div className="cd-chart-columns" aria-label="成绩分布">{counts.map((count,index)=><div key={index}><i style={{height:`${count/maximum*100}%`}}/><span>{count}人</span></div>)}</div><div className="cd-chart-axis">{['0–60','60–70','70–85','85–100'].map(label=><span key={label}>{label}</span>)}</div><small>分数</small></div>
   </div></section>
  </div>
  <section className="cd-panel cd-grade-table"><div className="cd-toolbar"><h2>成绩管理</h2><label className="cd-search"><Icon name="search" size={18}/><input aria-label="搜索学生成绩" placeholder="请输入学生姓名或学号" value={query} onChange={event=>setQuery(event.target.value)}/></label></div><div className="cd-grade-notice">按当前版本配置即时测算。考核记录与计算依据可在“数据统计 → 能力达成分析”导入、溯源与导出。</div><div className="cd-table-scroll"><table><thead><tr><th>序号</th><th>姓名</th><th>学号</th><th>总成绩</th></tr></thead><tbody>{visible.length?visible.map((student,index)=><tr key={student.id}><td>{index+1}</td><td>{student.name}{student.source==='teaching-simulation'&&<span className="cd-example-badge">示例</span>}</td><td>{student.studentNo}</td><td style={{textAlign:'right'}}>{display(student.grade)}</td></tr>):<tr><td colSpan="4" className="cd-table-empty">{query?'暂无匹配的学生成绩':'暂无学生成绩'}</td></tr>}</tbody></table></div></section>
 </div>;
}
