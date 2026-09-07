// Coordinates are relative to the course root and normalized to the outer orbit.
// Arranged to follow the supplied 智能制造 reference, not a random force layout.
const modules=[[-.32,-.46],[.22,-.63],[-.65,-.06],[.62,-.14],[.34,.09],[.59,.40],[-.09,.54],[-.48,.48]];
const topics=[
 [[-.70,-.58],[-.59,-.82],[-.33,-.85]],
 [[-.04,-.97],[.22,-1.07],[.43,-1.01],[.60,-.82]],
 [[-1,-.02],[-.84,.18],[-.98,-.23],[-.81,-.42]],
 [[.82,-.52],[1.02,-.33],[1.03,-.08]],
 [[.14,-.25],[.10,.33],[.38,.44],[.42,-.30]],
 [[.54,.78],[1.01,.30],[.82,.75],[1.01,.56]],
 [[-.32,.23],[-.19,.91],[.09,.90]],
 [[-.80,.50],[-.73,.76],[-.53,.89]],
];
export function graphPositions(graph,width,height,expanded=[],level=3){
 const center={x:width*.51,y:height*.515};const radius=Math.min(height*.425,width*.31);
 const pos={root:center};const visible=graph.nodes.filter(n=>n.level<=level||expanded.includes(n.parentId));
 for(const n of visible){if(n.level===1)continue;const match=n.id.match(/^m(\d+)(?:-t(\d+))?(?:-p(\d+))?$/);if(!match)continue;const mi=+match[1],ti=+match[2],pi=+match[3];let point=modules[mi];
  if(n.level===3)point=topics[mi][ti];
  if(n.level===4){const base=topics[mi][ti];const a=Math.atan2(base[1],base[0])+(pi-1)*.18;const r=Math.hypot(...base)+.16;point=[Math.cos(a)*r,Math.sin(a)*r];}
  pos[n.id]={x:center.x+point[0]*radius,y:center.y+point[1]*radius};
 }
 return {positions:pos,nodes:visible,center,radius};
}
