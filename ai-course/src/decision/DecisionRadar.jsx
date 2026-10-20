import {useMemo} from 'react';
import {Icon} from '../components/Icon';
import {ResultChart} from '../results/ResultChart';
import {decisionRadarOption} from './radar.mjs';
import {finite,developmentPercent} from './development.mjs';
export function DecisionRadar({title,rows,threshold,studentView,compact=false,currentLabel,comparisonLabel='班级均值',showValues=false}){
 const evaluated=rows.filter(r=>finite(r.value));const option=useMemo(()=>decisionRadarOption(rows,{threshold,studentView,compact,currentLabel,comparisonLabel}),[rows,threshold,studentView,compact,currentLabel,comparisonLabel]);
 return <div className={`va-radar-content dcd-radar ${compact?'compact':''}`}>
 {evaluated.length>=3?<div className="va-chart-shell" aria-label={`${title}，${evaluated.length}项已有评价`}><ResultChart option={option} className="va-radar"/></div>:<div className="va-chart-empty"><Icon name="graph" size={38}/><strong>{evaluated.length?'已评价维度不足3项':'暂无评价证据'}</strong><p>成绩不足时保留未评价，提交考核成绩后展示能力分布。</p></div>}
 <ul className={`dcd-axis-accessible ${showValues?'visible':''}`} aria-label={`${title}数值`}>{rows.map((r,i)=><li key={r.id}><span>能力{i+1} · {r.title}</span><strong>{developmentPercent(r.value)}</strong>{studentView&&<small>{comparisonLabel} {developmentPercent(r.classMean)}</small>}</li>)}</ul>
 {rows.some(r=>!finite(r.value))&&<p className="va-chart-note">未评价维度未按零分绘制。</p>}
 </div>;
}
