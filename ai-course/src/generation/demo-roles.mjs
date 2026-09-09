import seeds from './demo-roles.json' with {type:'json'};
import {findMajor} from './major-context.mjs';

// These associations are demo assumptions, not verified major-to-job evidence.
const groups={
 manufacturing:/机械|机电|自动化|机器人|智能制造|数控|工业|电气|装备|材料成型|模具|增材制造|汽车|车辆/,
 computing:/计算机|软件|人工智能|数据|网络|物联网|信息|电子|智能科学/,
 construction:/建筑|建造|土木|工程造价|建设工程|道路|桥梁|测绘|工程测量|市政/
};
export function demoRolesForMajor(code){
 const major=findMajor(code);
 if(!major)return [];
 const matched=Object.entries(groups).filter(([,pattern])=>pattern.test(major.name)).map(([key])=>key);
 return seeds.filter(role=>matched.includes(role.group)).map(seed=>({
  ...structuredClone(seed),id:`${seed.id}-${code}`,major:code,planId:'',
  tasks:seed.tasks.map(task=>({...structuredClone(task),id:`${task.id}-${code}`,abilities:task.abilities.map(a=>({...a,id:`${a.id}-${code}`}))}))
 }));
}
