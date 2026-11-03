import type { ReactNode } from 'react';
import { ListBulletIcon } from '@radix-ui/react-icons';

export default function GraphHeader({title='电路原理',type,noun,onDirectory,view='自定义视图',viewControl}:{title?:string;type:string;noun:string;onDirectory:()=>void;view?:string;viewControl?:ReactNode}) {
 return <header className={`graph-banner ${type==='素质图谱'?'graph-banner-warm':''}`}>
  <div><h1>{title}</h1><p>{viewControl??view}</p></div>
  <button className="graph-header-directory" aria-label={`打开${noun}目录`} onClick={onDirectory}><ListBulletIcon/></button>
 </header>;
}
