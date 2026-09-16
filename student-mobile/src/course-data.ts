export type KnowledgeNode = { id: string; name: string; en?: string; parentId: string | null; x: number; y: number; status: '未学习' | '学习中' | '已完成'; resources: string[] };
const groups = [
 ['电阻、电源的等效变换','Equivalent transformation',['电源的等效变换','最大功率传输','电阻 resistor']],
 ['二阶电路和状态方程','Second-order Circuits',['并联RLC二阶电路','二阶电路直觉解法','系统化方程法介绍']],
 ['节点电压法和回路电流法','Node voltage and loop current method',['节点电压法','回路电流法','支路变量、元件']],
 ['动态电路','Dynamic Circuits',['零输入响应和零状态响应','初值 Initial Values','电容与电感']],
 ['一阶电路的应用','Applications of First-Order Circuits',['A1 单位阶跃函数','A2 单位冲激函数','A3 单位冲激响应','A4 卷积积分']],
 ['叠加、替代和戴维南定理','Superposition theorem',['叠加定理','替代定理','戴维南定理的应用']],
 ['二阶电路的应用','Applications of second-order circuits',['频率特性的应用','谐振 resonance','串联RLC谐振']],
 ['非线性电阻电路','Nonlinear circuits',['非线性电路的小信号','放大器 amplifier','小信号模型']],
] as const;
export const nodes: KnowledgeNode[] = [{id:'root',name:'电路原理',parentId:null,x:0,y:0,status:'未学习',resources:[]}];
groups.forEach(([name,en,children],i)=>{
 const angle=-Math.PI/2+-i*Math.PI/4;
 const x=Math.cos(angle)*205,y=Math.sin(angle)*205;
 const id=`chapter-${i}`;
 nodes.push({id,name,en,parentId:'root',x,y,status:i===3?'学习中':'未学习',resources:['课件']});
 children.forEach((name,j)=>{const a=angle+(j-(children.length-1)/2)*.25;nodes.push({id:`${id}-${j}`,name,parentId:id,x:Math.cos(a)*(325+j%2*45),y:Math.sin(a)*(325+j%2*45),status:i===3?'学习中':'未学习',resources:['课件']});});
});
export const findNodes = (query:string) => nodes.filter(n=>n.id!=='root' && `${n.name} ${n.en||''}`.toLowerCase().includes(query.trim().toLowerCase()));

// A fixed, staggered presentation preset; students cannot edit these positions.
const customChapterPositions = [
 {x:-90,y:-190}, {x:95,y:-250}, {x:-115,y:-65}, {x:105,y:70},
 {x:-85,y:150}, {x:85,y:240}, {x:-110,y:275}, {x:115,y:-110},
];
export const customViewNodes: KnowledgeNode[] = nodes.map(node => {
 if(node.id==='root')return {...node,x:0,y:15};
 const chapterIndex=Number(node.id.split('-')[1]);
 const anchor=customChapterPositions[chapterIndex];
 if(node.parentId==='root')return {...node,...anchor};
 const siblings=nodes.filter(n=>n.parentId===node.parentId);
 const index=siblings.findIndex(n=>n.id===node.id);
 const direction=anchor.x<0?-1:1;
 return {...node,x:anchor.x+direction*(125+(index%2)*55),y:anchor.y+(index-(siblings.length-1)/2)*88};
});
