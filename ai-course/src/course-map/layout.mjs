import {dimensions} from './model.mjs';
// Layout and rounded orthogonal routes adapted from the supplied professional panorama.
export function layoutCourseMap(graph){
 const boxes=[],labels=[];const group=kind=>graph.nodes.filter(n=>n.kind===kind);
 let x=28,industryY=48;
 const industry=['chain','segment','role','workTask'].filter(k=>group(k).length);
 if(industry.length){
  for(const kind of industry){labels.push({kind,x,y:industryY-20});for(const [i,n] of group(kind).entries())boxes.push({...n,x,y:industryY+i*115,w:240,h:98});industryY+=group(kind).length*115+33;}
  x+=274;
 }
 for(const kind of ['major','course','project','activity','ability','knowledge']){
  const items=group(kind);if(!items.length)continue;
  const width=kind==='course'?174:['activity','ability','knowledge'].includes(kind)?195:165;
  labels.push({kind,x,y:28});for(const [i,n] of items.entries())boxes.push({...n,x,y:48+i*133,w:width,h:116});x+=width+30;
 }
 const height=Math.max(480,...boxes.map(b=>b.y+b.h+35));
 const byId=new Map(boxes.map(b=>[b.id,b]));
 const paths=graph.edges.map((e,i)=>{const a=byId.get(e.from),b=byId.get(e.to);const vertical=a.x===b.x;
  if(vertical){const down=b.y>a.y,sx=a.x+a.w/2,sy=down?a.y+a.h:a.y,ey=down?b.y:b.y+b.h;return {...e,d:`M ${sx} ${sy} V ${ey}`};}
  const right=b.x>a.x,sx=right?a.x+a.w:a.x,ex=right?b.x:b.x+b.w,sy=a.y+a.h/2,ey=b.y+b.h/2;
  if(Math.abs(sy-ey)<8)return {...e,d:`M ${sx} ${sy} H ${ex}`};
  const dir=right?1:-1,dy=ey>sy?1:-1,radius=Math.min(12,Math.abs(ex-sx)/4,Math.abs(ey-sy)/4);
  // Bypass intervening node columns along their bottom edge for long cross-links.
  if(Math.abs(ex-sx)>240){const track=height-16-(i%4)*5;return {...e,d:`M ${sx} ${sy} H ${sx+dir*14} V ${track} H ${ex-dir*14} V ${ey} H ${ex}`};}
  const mid=(sx+ex)/2;return {...e,d:`M ${sx} ${sy} H ${mid-dir*radius} Q ${mid} ${sy} ${mid} ${sy+dy*radius} V ${ey-dy*radius} Q ${mid} ${ey} ${mid+dir*radius} ${ey} H ${ex}`};
 });
 return {boxes,labels:labels.map(l=>({...l,title:dimensions[l.kind]})),paths,width:x-2,height};
}
