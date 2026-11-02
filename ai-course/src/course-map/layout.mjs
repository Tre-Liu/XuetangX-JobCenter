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

// Figma reference: industry → role/ability → teaching project → practice → knowledge.
// Display shortcuts retain the original edge IDs; no association is inferred by name.
export function layoutCoursePanorama(graph,{expandedRoles=new Set(),selectedKnowledge=null}={}){
 const boxes=[],groups=[],labels=[],annotations=[];
 const nodes=new Map(graph.nodes.map(n=>[n.id,n])),byKind=kind=>graph.nodes.filter(n=>n.kind===kind);
 const outgoing=id=>graph.edges.filter(e=>e.from===id);
 const children=(id,kind)=>outgoing(id).map(e=>nodes.get(e.to)).filter(n=>n?.kind===kind);
 const width=224,gap=36,top=50;let x=12;
 const label=(kind,title)=>labels.push({kind,title,x,y:14});
 const add=(node,left,y,w,h,extra={})=>boxes.push({...node,x:left,y,w,h,...extra});
 if(byKind('chain').length||byKind('segment').length){
  label('industry','产业与环节');let y=top;const placed=new Set();
  for(const chain of byKind('chain')){
   const segments=children(chain.id,'segment'),groupId=`industry-${chain.id}`;
   const h=segments.length?86+segments.length*72:84;
   groups.push({id:groupId,kind:'industry',chainId:chain.id,chainTitle:chain.title,x,y,w:width,h});
   add(chain,x+12,y+12,width-24,60,{groupId,eyebrow:'产业链'});
   segments.forEach((segment,i)=>{placed.add(segment.id);add(segment,x+12,y+82+i*72,width-24,64,{groupId,eyebrow:[segment.description,'产业环节'].filter(Boolean).join(' · '),displayKey:`${chain.id}-${segment.id}`});});y+=h+16;
  }
  for(const segment of byKind('segment').filter(n=>!placed.has(n.id))){add(segment,x,y,width,48);y+=64;}
  x+=width+gap;
 }
 if(byKind('role').length){
  label('role','岗位与能力矩阵');let y=top;
  const roleGroups=new Map();for(const role of byKind('role')){const name=role.groupName||'';if(!roleGroups.has(name))roleGroups.set(name,[]);roleGroups.get(name).push(role);}
  for(const [name,roles] of roleGroups){const start=y;if(name)y+=42;
   for(const role of roles){
    const works=children(role.id,'workTask'),owners=works.length?works:children(role.id,'project');
    const abilities=[...new Map(owners.flatMap(n=>children(n.id,'ability')).map(n=>[n.id,n])).values()];
    const linked=selectedKnowledge?new Set(graph.edges.filter(e=>e.to===selectedKnowledge&&nodes.get(e.from)?.kind==='ability').map(e=>e.from)):null;
    const expanded=expandedRoles.has(role.id)||!!linked&&abilities.some(n=>linked.has(n.id));
    const categories=['知识','技能','素养'].map(category=>({category,items:abilities.filter(n=>(['技能','素养'].includes(n.description)?n.description:'知识')===category)})).filter(c=>c.items.length);
    const innerX=x+(name?12:0),w=width-(name?24:0);let h=118;
    if(expanded)h+=categories.reduce((sum,c)=>sum+28+Math.ceil(c.items.length/8)*21,0)+10;
    add(role,innerX,y,w,h,{expanded,abilityCount:abilities.length,subtitle:works.map(n=>n.title).join('、')||'岗位工作任务待关联'});
    if(expanded){let cy=y+120;for(const {category,items} of categories){annotations.push({id:`${role.id}-${category}`,title:`${category}（${items.length}）`,x:innerX+14,y:cy,ownerId:role.id});cy+=25;
     items.forEach((ability,i)=>add(ability,innerX+16+(i%8)*21,cy+Math.floor(i/8)*21,8,8,{point:true,ownerId:role.id,displayKey:`${role.id}-${ability.id}`}));cy+=Math.ceil(items.length/8)*21+3;
    }}y+=h+12;
   }
   if(name){groups.push({id:`roles-${name}`,title:name,kind:'role',x,y:start,w:width,h:y-start});y+=16;}
  }x+=width+gap;
 }
 for(const [kind,title] of [['project','教学项目'],['activity','实践任务']]){
  const items=byKind(kind);if(!items.length)continue;label(kind,title);
  items.forEach((node,i)=>{const count=children(node.id,kind==='project'?'activity':'knowledge').length;add(node,x,top+i*92,width,78,{subtitle:kind==='project'?`任务：${count}个`:`关联知识点：${count}个`});});x+=width+gap;
 }
 const knowledge=byKind('knowledge');
 if(knowledge.length){label('knowledge','知识点');
  const h=Math.ceil(knowledge.length/10)*22+28;
  groups.push({id:'knowledge-region',kind:'knowledge-region',x,y:top,w:width,h});
  knowledge.forEach((node,i)=>add(node,x+14+(i%10)*20,top+14+Math.floor(i/10)*22,7,7,{point:true}));x+=width+gap;
 }
 const visible=new Map();for(const box of boxes){if(!visible.has(box.id))visible.set(box.id,[]);visible.get(box.id).push(box);}
 const displayEdges=graph.edges.filter(e=>visible.has(e.from)&&visible.has(e.to)&&!['ability'].includes(nodes.get(e.from)?.kind)&&nodes.get(e.to)?.kind!=='ability').map(e=>({...e,sourceEdgeIds:[e.id]}));
 // A role card includes its work tasks, so contract that intermediate level.
 for(const role of byKind('role'))for(const a of outgoing(role.id)){
  if(nodes.get(a.to)?.kind!=='workTask')continue;
  for(const b of outgoing(a.to))if(nodes.get(b.to)?.kind==='project')displayEdges.push({id:`role-project:${a.id}:${b.id}`,from:role.id,to:b.to,sourceEdgeIds:[a.id,b.id]});
 }
 // Course-wide industry links still reach projects when the course node is implicit.
 for(const incoming of graph.edges.filter(e=>e.to===graph.rootId&&visible.has(e.from)))
  for(const outgoing of graph.edges.filter(e=>e.from===graph.rootId&&visible.has(e.to)))
   displayEdges.push({id:`via-course:${incoming.id}:${outgoing.id}`,from:incoming.from,to:outgoing.to,sourceEdgeIds:[incoming.id,outgoing.id]});
 for(const edge of graph.edges)if(visible.has(edge.from)&&visible.has(edge.to)&&(nodes.get(edge.from)?.kind==='ability'||nodes.get(edge.to)?.kind==='ability'))displayEdges.push({...edge,abilityLink:true,sourceEdgeIds:[edge.id]});
 const paths=[];
 for(const edge of displayEdges){for(const a of visible.get(edge.from)||[])for(const b of visible.get(edge.to)||[]){
  if(a.kind==='chain'&&b.kind==='segment')continue;
  const right=b.x>a.x,sx=right?a.x+a.w:a.x,ex=right?b.x:b.x+b.w;
  // Expanded role cards connect through their fixed heading, not the ability grid midpoint.
  const sy=a.y+(a.kind==='role'?48:a.h/2),ey=b.y+(b.kind==='role'?48:b.h/2);
  const bend=Math.max(16,Math.abs(ex-sx)*.5),dir=right?1:-1;
  paths.push({...edge,key:`${edge.id}:${a.displayKey||a.id}:${b.displayKey||b.id}`,tone:b.kind,d:`M ${sx} ${sy} C ${sx+dir*bend} ${sy}, ${ex-dir*bend} ${ey}, ${ex} ${ey}`});
 }}
 return {boxes,groups,labels,annotations,paths,width:Math.max(300,x-gap+12),height:Math.max(480,...boxes.map(b=>b.y+b.h+24),...groups.map(g=>g.y+g.h+24))};
}
