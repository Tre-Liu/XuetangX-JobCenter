import {dimensions} from './model.mjs';
// Layout and rounded orthogonal routes adapted from the supplied professional panorama.
export function layoutCourseMap(graph){
 const boxes=[],labels=[];const group=kind=>graph.nodes.filter(n=>n.kind===kind);
 let x=28,industryY=48;
 const industry=['chain','segment','role','workTask','ability'].filter(k=>group(k).length);
 if(industry.length){
  for(const kind of industry){const h=kind==='ability'?116:98,step=h+17;labels.push({kind,x,y:industryY-20});for(const [i,n] of group(kind).entries())boxes.push({...n,x,y:industryY+i*step,w:240,h});industryY+=group(kind).length*step+33;}
  x+=274;
 }
 for(const kind of ['major','course','project','activity','knowledge']){
  const items=group(kind);if(!items.length)continue;
  const width=kind==='course'?174:['activity','ability','knowledge'].includes(kind)?195:165;
  labels.push({kind,x,y:28});for(const [i,n] of items.entries())boxes.push({...n,x,y:48+i*133,w:width,h:116});x+=width+30;
 }
 const height=Math.max(480,...boxes.map(b=>b.y+b.h+35));
 const byId=new Map(boxes.map(b=>[b.id,b]));
 const paths=graph.edges.map((e,i)=>{const a=byId.get(e.from),b=byId.get(e.to);const vertical=a.x===b.x;
  if(vertical){const down=b.y>a.y,sx=a.x+a.w/2,sy=down?a.y+a.h:a.y,ey=down?b.y:b.y+b.h;
   const obstructed=boxes.some(n=>n.id!==a.id&&n.id!==b.id&&n.x===a.x&&n.y<Math.max(sy,ey)&&n.y+n.h>Math.min(sy,ey));
   if(obstructed){const rail=a.x-12-(i%3)*4;return {...e,d:`M ${a.x} ${a.y+a.h/2} H ${rail} V ${b.y+b.h/2} H ${b.x}`};}
   return {...e,d:`M ${sx} ${sy} V ${ey}`};}
  const right=b.x>a.x,sx=right?a.x+a.w:a.x,ex=right?b.x:b.x+b.w,sy=a.y+a.h/2,ey=b.y+b.h/2;
  const dir=right?1:-1,dy=ey>sy?1:-1,radius=Math.min(12,Math.abs(ex-sx)/4,Math.abs(ey-sy)/4);
  // Bypass intervening node columns along their bottom edge for long cross-links.
  if(Math.abs(ex-sx)>240){const track=height-16-(i%4)*5;return {...e,d:`M ${sx} ${sy} H ${sx+dir*14} V ${track} H ${ex-dir*14} V ${ey} H ${ex}`};}
  if(Math.abs(sy-ey)<8)return {...e,d:`M ${sx} ${sy} H ${ex}`};
  const mid=(sx+ex)/2;return {...e,d:`M ${sx} ${sy} H ${mid-dir*radius} Q ${mid} ${sy} ${mid} ${sy+dy*radius} V ${ey-dy*radius} Q ${mid} ${ey} ${mid+dir*radius} ${ey} H ${ex}`};
 });
 return {boxes,labels:labels.map(l=>({...l,title:dimensions[l.kind]})),paths,width:x-2,height};
}

// The current course keeps its own saved relations while sharing the panorama's
// horizontal industry columns and fixed point regions.
export function roleGroupName(role){
 if(role.groupName)return role.groupName;
 const name=role.title||'';
 if(/前端|后端|软件|开发|程序/.test(name))return '软件开发岗位群';
 if(/文化|研究|文献|调查/.test(name))return '文化研究与资源调查岗位群';
 if(/机器人/.test(name))return '工业机器人操作与运维岗位群';
 if(/设计|创意|美术/.test(name))return '设计与创意岗位群';
 if(/运营|营销|推广/.test(name))return '运营与营销岗位群';
 return '专业技术岗位群';
}
export function layoutCoursePanorama(graph,{expandedRole=null,expandedActivity=null,expandedIndustry=null,expandedCourse=false,selectedKnowledge=null}={}){
 const boxes=[],labels=[],groups=[],byKind=kind=>graph.nodes.filter(n=>n.kind===kind);
 const byId=new Map(graph.nodes.map(n=>[n.id,n]));
 let x=28;
 const column=(kind,width=205,height=98)=>{const items=byKind(kind);if(!items.length)return;labels.push({kind,title:dimensions[kind],x,y:28});items.forEach((n,i)=>boxes.push({...n,x,y:48+i*(height+16),w:width,h:height}));x+=width+30;};
 if(expandedIndustry){
  const ancestry=new Set([expandedIndustry]);
  for(let changed=true;changed;){changed=false;for(const e of graph.edges)if(ancestry.has(e.to)&&['chain','segment'].includes(byId.get(e.from)?.kind)&&!ancestry.has(e.from)){ancestry.add(e.from);changed=true;}}
  for(const kind of ['chain','segment']){const items=byKind(kind).filter(n=>ancestry.has(n.id));if(!items.length)continue;labels.push({kind,title:dimensions[kind],x,y:28});items.forEach((n,i)=>boxes.push({...n,x,y:48+i*114,w:215,h:98}));x+=245;}
 }
 if(byKind('role').length){
  labels.push({kind:'role',title:'岗位',x,y:28});
  const roleGroups=new Map();
  for(const role of byKind('role')){
   const parent=graph.edges.find(e=>e.to===role.id&&byId.get(e.from)?.kind==='segment');
   const key=roleGroupName(role);
   if(!roleGroups.has(key))roleGroups.set(key,{title:key,nodes:[]});
   roleGroups.get(key).nodes.push(role);
  }
  let y=48;
  for(const [id,group] of roleGroups){const h=44+group.nodes.length*56;groups.push({id:`roles-${id}`,kind:'role',title:group.title,x,y,w:250,h});group.nodes.forEach((role,i)=>boxes.push({...role,x:x+12,y:y+40+i*56,w:226,h:44}));y+=h+16;}
  x+=280;
 }
 const linkedAbilities=selectedKnowledge?new Set(graph.edges.filter(e=>e.to===selectedKnowledge&&byId.get(e.from)?.kind==='ability').map(e=>e.from)):null;
 const abilityRoles=byKind('role').map(role=>{
  const workTasks=graph.edges.filter(e=>e.from===role.id&&byId.get(e.to)?.kind==='workTask').map(e=>byId.get(e.to));
  const owners=workTasks.length?workTasks:graph.edges.filter(e=>e.from===role.id&&byId.get(e.to)?.kind==='project').map(e=>byId.get(e.to));
  const tasks=owners.map(task=>({title:task.title,id:task.id,points:graph.edges.filter(e=>e.from===task.id&&byId.get(e.to)?.kind==='ability'&&(!linkedAbilities||linkedAbilities.has(e.to))).map(e=>byId.get(e.to))})).filter(task=>task.points.length);
  return {role,tasks};
 }).filter(({role,tasks})=>tasks.length&&(linkedAbilities||role.id===expandedRole));
 if(abilityRoles.length){
  labels.push({kind:'ability',title:linkedAbilities?'关联岗位能力项':abilityRoles[0].role.title,x,y:28});let y=144;
  for(const {role,tasks} of abilityRoles){
   if(linkedAbilities){groups.push({id:`ability-role-${role.id}`,kind:'ability-role',title:role.title,x:x+12,y,w:236,h:30});y+=38;}
   for(const task of tasks){const header=task.title.length>19?48:30,h=header+24+Math.ceil(task.points.length/8)*26;groups.push({id:`abilities-${role.id}-${task.id}`,kind:'ability',title:task.title,x:x+12,y,w:236,h});task.points.forEach((point,i)=>{if(!boxes.some(n=>n.id===point.id))boxes.push({...point,x:x+27+(i%8)*26,y:y+header+12+Math.floor(i/8)*26,w:14,h:14});});y+=h+12;}
   if(linkedAbilities)y+=12;
  }
  groups.push({id:'ability-region',kind:'ability-region',title:'',x,y:48,w:260,h:Math.max(260,y-48+16)});x+=290;
 }
 column('course',200);if(expandedCourse){column('project',200,112);column('activity',210,108);}
 if(expandedCourse&&expandedActivity){
  const activity=byId.get(expandedActivity),points=graph.edges.filter(e=>e.from===expandedActivity&&byId.get(e.to)?.kind==='knowledge').map(e=>byId.get(e.to));
  labels.push({kind:'knowledge',title:'知识点',x,y:28});
  groups.push({id:'knowledge-region',kind:'knowledge-region',title:'',x,y:48,w:230,h:Math.max(220,50+Math.ceil(points.length/7)*28)});
  points.forEach((point,i)=>boxes.push({...point,x:x+26+(i%7)*26,y:74+Math.floor(i/7)*28,w:16,h:16}));x+=260;
 }
 const height=Math.max(500,...boxes.map(n=>n.y+n.h+35),...groups.map(n=>n.y+n.h+35));
 const visible=new Map(boxes.map(n=>[n.id,n]));
 const displayEdges=[...graph.edges];
 for(const role of byKind('role')){
  const works=graph.edges.filter(e=>e.from===role.id).map(e=>e.to);
  const projectIds=graph.edges.filter(e=>works.includes(e.from)&&byId.get(e.to)?.kind==='project').map(e=>e.to);
  const courseEdges=graph.edges.filter(e=>e.from===graph.rootId&&projectIds.includes(e.to));
  if(works.some(id=>byId.get(id)?.kind==='project')||courseEdges.length)displayEdges.push({id:`role-course-${role.id}`,from:role.id,to:graph.rootId,displayLink:true});
 }
 const paths=displayEdges.filter(e=>visible.has(e.from)&&visible.has(e.to)).map((e,i)=>{
  const a=visible.get(e.from),b=visible.get(e.to),sx=a.x+a.w,sy=a.y+a.h/2,ex=b.x,ey=b.y+b.h/2,mid=(sx+ex)/2;
  return {...e,d:`M ${sx} ${sy} H ${mid} V ${ey} H ${ex}`};
 });
 return {boxes,labels,groups,paths,width:x,height};
}
