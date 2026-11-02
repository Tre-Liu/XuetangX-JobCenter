import {useMemo} from 'react';
import {Icon} from '../components/Icon';
import {CoursePanorama} from '../course-map/CoursePanorama';

export function ResultsRelations({projects,knowledge,cmsConfig,courseName}){
 const course=useMemo(()=>({id:'current-course',title:courseName}),[courseName]);
 return <section className="result-relations-module" aria-labelledby="result-relations-title">
  <header className="result-relations-heading">
   <div><h1 id="result-relations-title"><Icon name="graph" size={23}/>课岗关联图谱</h1><p>{courseName} · 产业、岗位与教学实践关联</p></div>
   <div className="result-relations-legend" aria-label="能力类别">
    <span><i className="knowledge"/>知识</span><span><i className="skill"/>技能</span><span><i className="quality"/>素养</span>
   </div>
  </header>
  <CoursePanorama projects={projects} knowledge={knowledge} cmsConfig={cmsConfig} course={course} theme="dark"/>
 </section>;
}
