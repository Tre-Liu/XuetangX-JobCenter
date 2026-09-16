export type Point = {x:number;y:number};
export type PositionedNode = Point & {id:string;parentId:string|null};
export type Positions = Record<string,Point>;
export const childCount = (nodes:PositionedNode[],id:string) => nodes.filter(n=>n.parentId===id).length;
export function visibleNodes<T extends PositionedNode>(nodes:T[],expanded:Set<string>):T[]{
 const byId=new Map(nodes.map(n=>[n.id,n]));
 return nodes.filter(n=>{let p=n.parentId;const visited=new Set<string>();while(p){if(visited.has(p)||!expanded.has(p))return false;visited.add(p);const parent=byId.get(p);if(!parent)return false;p=parent.parentId;}return true;});
}
export function readPositions(raw:string|null,nodes:PositionedNode[]):Positions{
 try {const value=JSON.parse(raw||'{}');if(!value||typeof value!=='object')return {};const result:Positions={};for(const n of nodes){const p=value[n.id];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))result[n.id]={x:p.x,y:p.y};}return result;}catch{return {};}
}
export function moveNode(positions:Positions,id:string,start:Point,dx:number,dy:number,zoom:number):Positions{
 return {...positions,[id]:{x:start.x+dx/zoom,y:start.y+dy/zoom}};
}
