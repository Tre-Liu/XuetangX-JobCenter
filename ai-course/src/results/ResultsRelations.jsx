import {useMemo} from 'react';
import {Icon} from '../components/Icon';
import {CoursePanorama} from '../course-map/CoursePanorama';
import {useKnowledgeEnabled} from '../knowledge/availability.mjs';
import {buildCourseJobMetrics} from './model.mjs';

export function ResultsRelations({projects,knowledge,cmsConfig,courseName,theme='dark'}){
 const course=useMemo(()=>({id:'current-course',title:courseName}),[courseName]);
 const knowledgeEnabled=useKnowledgeEnabled();
 const metrics=useMemo(()=>buildCourseJobMetrics({courseId:course.id,projects,knowledge,knowledgeEnabled}),[course.id,projects,knowledge,knowledgeEnabled]);
 const percent=value=>value===null?'—':`${value}%`;
 return <section className="result-relations-module" data-theme={theme} aria-labelledby="result-relations-title">
  <header className="result-relations-heading">
   <div><h1 id="result-relations-title"><Icon name="graph" size={23}/>课岗关联图谱</h1></div>
   <div className="result-relations-legend" aria-label="能力类别">
    <span><i className="knowledge"/>知识</span><span><i className="skill"/>技能</span><span><i className="quality"/>素养</span>
   </div>
  </header>
  <div className="result-relations-summary" role="group" aria-label="课岗结合统计">
   <span className="result-relations-summary-label">课岗结合</span>
   <span title="同一项目任务中已关联岗位能力的知识点数 ÷ 当前课程可用知识点总数；按知识点 ID 去重。此值为关联覆盖率，不代表语义相似度或能力达成度。">知识点与岗位能力匹配率 <strong>{percent(metrics.knowledgeRate)}</strong><small>（{metrics.knowledgeMatched}/{metrics.knowledgeTotal} 个知识点）</small></span>
   <span title="已由课程知识点支撑的岗位能力项数 ÷ 已保存的岗位能力项总数；按岗位与能力 ID 去重。">岗位典型工作任务能力支撑率 <strong>{percent(metrics.abilityRate)}</strong><small>（{metrics.abilityMatched}/{metrics.abilityTotal} 项）</small></span>
   <span title="当前课程项目中已关联的岗位，按岗位 ID 去重。">关联岗位 <strong>{metrics.roles}</strong> 个</span>
  </div>
  <CoursePanorama projects={projects} knowledge={knowledge} cmsConfig={cmsConfig} course={course} theme={theme}/>
 </section>;
}
