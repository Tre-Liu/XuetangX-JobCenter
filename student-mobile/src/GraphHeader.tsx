import { ListBulletIcon } from '@radix-ui/react-icons';

export default function GraphHeader({title='电路原理',type,noun,onDirectory}:{title?:string;type:string;noun:string;onDirectory:()=>void}) {
 return <header className={`graph-banner ${type==='素质图谱'?'graph-banner-warm':''}`}>
  <div><h1>{title}</h1><p>{type} · 自定义视图</p></div>
  <button className="graph-header-directory" aria-label={`打开${noun}目录`} onClick={onDirectory}><ListBulletIcon/></button>
 </header>;
}
