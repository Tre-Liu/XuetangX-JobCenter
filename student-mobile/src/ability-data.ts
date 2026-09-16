export type LearningGroup={id:string;name:string;units:{id:string;name:string;type:'视频'}[]};
export type Ability={id:string;name:string;tag?:string;description?:string;children?:Ability[];groups?:LearningGroup[];referenceCounts?:{knowledge:number;units:number}};
const leaf=(id:string,name:string,tag?:string):Ability=>({id,name,tag});
const branch=(id:string,name:string,children:Ability[]):Ability=>({id,name,children});
const videos=(id:string,name:string,count:number):LearningGroup=>({id,name,units:Array.from({length:count},(_,i)=>({id:`${id}-${i+1}`,name:`${name}（${i+1}）`,type:'视频'}))});
export const abilities:Ability[]=[
 branch('linear','线性电阻电路分析',[
  branch('basics','电路基本概念与定律',[
   {id:'model',name:'电路模型与基本物理量',tag:'电路模型',description:'理解电路作为抽象物理系统的建模方法，掌握电压、电流、电荷、磁通、功率、能量等基本物理量的定义、参考方向及相互关系',groups:[videos('math','数学基础知识（Math basics for circuits）',7),videos('why','为什么要学习电路（why learn circuits?）',2)]},
   {id:'ohm',name:'欧姆定律与电阻元件',tag:'线性电阻',referenceCounts:{knowledge:2,units:2}},
   leaf('source','独立电源（电压源与电流源）','独立源'),leaf('kcl','基尔霍夫电流定律 KCL','基尔霍夫定律'),leaf('kvl','基尔霍夫电压定律 KVL','基尔霍夫定律'),leaf('controlled','受控源（VCCS/VCVS/CCVS/CCCS）','受控源')]),
  {id:'equivalent',name:'电路等效变换'},
  branch('methods','电路基本分析方法',[leaf('branch-current','支路电流法','支路法'),leaf('node-voltage','节点电压法','节点法'),leaf('mesh','网孔电流法与回路电流法','网孔法'),leaf('matrix','改进节点法与稀疏矩阵','数值方法')]),
  branch('theorems','电路基本定理',[leaf('superposition','叠加定理','叠加定理'),leaf('thevenin','戴维南定理与诺顿定理','等效电源定理'),leaf('power-transfer','最大功率传输定理','功率传输'),leaf('reciprocity','替代、互易、特勒根定理','网络定理')])]),
 branch('nonlinear','非线性电阻电路分析',[
  branch('nonlinear-properties','非线性元件特性',[leaf('nonlinear-static','静态电阻与动态电阻','非线性元件')]),
  branch('nonlinear-methods','非线性电路分析方法',[leaf('graphical','图解法（负载线法）','图解法'),leaf('piecewise','分段线性化法','分段线性化'),leaf('small-signal','小信号分析法','小信号分析'),leaf('newton','牛顿–拉夫森数值迭代','数值方法')]),
  branch('operating-point','非线性电路工作点分析',[leaf('q-point','直流工作点（Q点）求解','工作点分析'),leaf('stability','工作点稳定性分析','稳定性'),leaf('hysteresis','多解、跳变与滞后现象','非线性现象')]),
  branch('nonlinear-application','非线性电路工程应用',[leaf('rectifier','整流与限幅电路','电子电路'),leaf('regulator','稳压与限流保护电路','电源电路'),leaf('chaos','非线性振荡与混沌电路','非线性系统')])]),
 branch('dynamic','动态电路的时域分析',[
  branch('switching','动态元件与换路定则',[leaf('capacitor','电容元件及其伏安关系','动态元件'),leaf('inductor','电感元件及其伏安关系','动态元件'),leaf('initial','换路定则与初始条件','初始条件'),leaf('mutual','耦合电感与互感元件','耦合电感')]),
  branch('first-order','一阶电路时域分析',[leaf('rc-zero','RC 电路的零输入响应','一阶电路'),leaf('rc-full','RC 电路的零状态响应与全响应','一阶电路'),leaf('rl','RL 电路的三要素分析法','一阶电路'),leaf('step','一阶电路的阶跃与冲激响应','一阶电路')]),
  branch('second-order','二阶电路时域分析',[leaf('rlc-zero','RLC 串联电路的零输入响应','二阶电路'),leaf('rlc-full','RLC 电路的零状态响应与全响应','二阶电路'),leaf('state','二阶电路的状态变量分析','状态方程')]),
  leaf('higher-order','高阶电路的时域分析')]),
 branch('sinusoidal','正弦激励下动态电路的稳态分析',[
  branch('phasors','正弦量与相量法',[leaf('sine','正弦量的三要素与有效值','正弦量'),leaf('phasor-basics','相量法基础','相量法'),leaf('phasor-laws','电路定律的相量形式','相量法'),leaf('impedance','阻抗与导纳','阻抗')]),
  branch('steady','正弦稳态电路分析',[leaf('phasor-model','相量模型与相量图','相量模型'),leaf('phasor-theorem','电路定理的相量域推广','电路定理'),leaf('steady-power','正弦稳态功率分析','功率分析')]),
  branch('resonance','谐振电路分析',[leaf('series-resonance','RLC 串联谐振','谐振'),leaf('parallel-resonance','RLC 并联谐振','谐振'),leaf('actual-resonance','实际谐振与复杂谐振','谐振'),leaf('resonance-application','谐振电路的工程应用','谐振电路')]),
  branch('transformer','耦合电感与变压器电路',[leaf('mutual-terminal','耦合电感与同名端','耦合电感'),leaf('coupled-phasor','含耦合电感电路的相量分析','耦合电感'),leaf('ideal-transformer','理想变压器模型','变压器'),leaf('real-transformer','实际变压器模型与应用','变压器')]),
  branch('three-phase','三相电路分析',[leaf('three-source','三相电源与连接方式','三相电路'),leaf('balanced','对称三相电路分析','三相电路'),leaf('unbalanced','不对称三相电路分析','三相电路')]),
  branch('frequency','频率响应与滤波器',[leaf('frequency-response','网络函数与频率响应','频率响应'),leaf('filter','滤波器设计基础','滤波器')])])
];
export function flattenAbilities(items:Ability[]=abilities):Ability[]{return items.flatMap(a=>[a,...flattenAbilities(a.children||[])])}
export function abilityCounts(node:Ability):{knowledge:number;units:number}{
 if(node.referenceCounts)return node.referenceCounts;
 const groups=new Map<string,LearningGroup>();
 for(const a of flattenAbilities([node]))for(const g of a.groups||[])groups.set(g.id,g);
 let knowledge=groups.size,units=[...groups.values()].reduce((s,g)=>s+g.units.length,0);
 for(const a of flattenAbilities(node.children||[]))if(a.referenceCounts){knowledge+=a.referenceCounts.knowledge;units+=a.referenceCounts.units}
 return {knowledge,units};
}
export function abilityPath(id:string,items:Ability[]=abilities,path:Ability[]=[]):Ability[]{for(const a of items){if(a.id===id)return [...path,a];const found=abilityPath(id,a.children||[],[...path,a]);if(found.length)return found}return []}
