import {useState} from 'react';
import {Modal} from '../components/Modal';
import {officialMajors,findMajor} from '../generation/major-context.mjs';
import {matchChains} from './config.mjs';
export function CourseMajorDialog({major,onClose,onConfirm}){
 const [level,setLevel]=useState(major&&findMajor(major.code)?.level!=='普通本科'?'职教':'本科'),[query,setQuery]=useState(''),[page,setPage]=useState(1),[selected,setSelected]=useState(major?.code||'');
 const rows=officialMajors.filter(m=>(level==='本科'?m.level==='普通本科':m.level!=='普通本科')&&(!query.trim()||m.name.includes(query.trim())||m.code.includes(query.trim())));
 const pages=Math.max(1,Math.ceil(rows.length/8));
 return <Modal title="选择教育部备案专业" wide className="cms-major-modal" onClose={onClose} footer={<><div className="cms-major-pagination"><button className="outlined" disabled={page===1} onClick={()=>setPage(page-1)}>上一页</button><span>{page} / {pages}</span><button className="outlined" disabled={page===pages} onClick={()=>setPage(page+1)}>下一页</button></div><button className="outlined" onClick={onClose}>取消</button><button className="primary" disabled={!selected} onClick={()=>onConfirm(findMajor(selected))}>确定</button></>}>
 <p className="cms-major-intro">先为“智能制造岗位项目课程”确认关联专业，系统再据此匹配产业链。</p><div className="cms-major-filters">{['本科','职教'].map(name=><button key={name} className={level===name?'primary':'outlined'} onClick={()=>{setLevel(name);setPage(1);}}>{name}</button>)}<input aria-label="搜索官方专业" placeholder="搜索专业名称或专业代码" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></div>
 <div className="cms-major-results" role="radiogroup" aria-label="教育部备案专业">{rows.slice((page-1)*8,page*8).map(m=>{const matches=matchChains(m.code);return <label key={m.code} className={selected===m.code?'selected':''}><input type="radio" name="cms-major" checked={selected===m.code} onChange={()=>setSelected(m.code)}/><div><strong>{m.code} {m.name}</strong><p>{m.level} · {m.category} / {m.group}</p><small>{matches.length?`可匹配 ${matches.length} 条产业链 · 确认专业后查看`:'暂无产业链匹配记录，可在确认专业后人工选择'}</small></div></label>;})}{!rows.length&&<p className="cms-empty">未找到专业，请更换搜索名称或教育类型。</p>}</div>
 </Modal>;
}
