// Authored teaching content for the PLC panorama only; never persisted in the course knowledge store.
const topics=[
 {key:'electrical',name:'电气基础与识图',terms:['电气','接线','图纸','控制回路'],points:['直流电路基本参数','交流电有效值与频率','三相电源相序','电气图形符号','主电路与控制电路','端子排编号规则','导线线号与标识','控制电源容量核算','接地与等电位连接','电气图纸交叉索引']},
 {key:'devices',name:'低压电器与电机',terms:['电机','元件','接触器','器件'],points:['接触器结构与工作原理','继电器触点类型','热过载保护原理','断路器保护特性','熔断器选型依据','按钮与指示灯功能','三相异步电动机结构','电动机铭牌参数','正反转电气互锁','电机过载与缺相现象']},
 {key:'plc',name:'PLC硬件与I/O',terms:['I/O','地址','硬件','点位','逐点'],points:['PLC模块组成','PLC扫描周期','数字量输入接线','数字量输出类型','模拟量信号量程','输入输出地址分配','PNP与NPN信号接口','PLC供电与隔离','I/O点表编制规则','在线监控与强制状态']},
 {key:'program',name:'PLC编程指令',terms:['程序','编写','逻辑','指令'],points:['梯形图触点与线圈','常开常闭逻辑表达','启停自保持逻辑','置位与复位指令','上升沿与下降沿检测','接通延时定时器','断开延时定时器','加减计数器','数据比较指令','功能块调用与参数']},
 {key:'sequence',name:'顺序控制与状态机',terms:['状态','顺序','时序','方案'],points:['状态机状态划分','状态转移条件','初始状态与复位状态','顺序功能图基本结构','单周期与连续运行','手动自动模式切换','动作优先级设计','停止请求处理','异常状态保持','状态转移完整性检查']},
 {key:'sensors',name:'传感器与工件识别',terms:['传感器','检测','识别','错分'],points:['电感式接近开关原理','电容式接近开关原理','对射式光电检测','漫反射式光电检测','传感器检测距离','传感器安装偏差','输入信号滤波','机械触点抖动','金属与非金属判别','检测盲区与误触发']},
 {key:'pneumatic',name:'气动执行与互锁',terms:['气动','气缸','推料','夹紧','气压'],points:['气源处理组件','气缸结构与动作方式','电磁换向阀原理','节流阀与速度调节','气缸磁性开关','气缸到位信号','动作超时判定','低气压检测','推料与输送互锁','气动残余能量识别']},
 {key:'drive',name:'输送与变频调速',terms:['输送','驱动','变频','速度'],points:['变频器输入输出端子','频率给定方式','变频器加减速时间','电机额定参数设置','驱动使能与运行反馈','输送速度与节拍关系','低速运行与转矩','变频器故障代码','制动与惯性停止','驱动参数备份']},
 {key:'tracking',name:'工件追踪与工位协同',terms:['计数','追踪','握手','工位','批次'],points:['单件追踪标识','入口与出口计数','重复计数防护','工件在途状态','料箱容量判定','工位就绪信号','工位请求与应答','握手信号超时','计数平衡核验','批次切换与清零条件']},
 {key:'safety',name:'安全边界与故障恢复',terms:['安全','互锁','复位','故障','报警'],points:['危险源辨识','断电与验电程序','独立急停回路边界','安全反馈信号监视','防止意外再启动','报警触发与锁存','报警确认与复位区分','故障恢复前提条件','维护授权与操作边界','异常停止后的状态确认']},
 {key:'validation',name:'调试与质量验收',terms:['调试','验收','验证','复测','试运行','检查'],points:['单点I/O校验','空载联调步骤','带载试运行条件','功能测试用例设计','边界条件测试','故障注入与响应记录','分拣正确率计算','平均节拍与波动','缺陷复现与回归验证','验收记录可追溯性']},
 {key:'delivery',name:'工程记录与交付',terms:['记录','交付','交接','版本','汇报','资料'],points:['程序版本命名','程序备份与恢复','参数变更记录','电气图纸竣工修订','设备点检表编制','异常日志字段','测试证据归档','操作说明编写','项目交接清单','维护资料更新规则']}
];

export function withPanoramaDemoKnowledge(graph,{enabled=true}={}){
 const course=graph.nodes.find(n=>n.id===graph.rootId);
 const activities=graph.nodes.filter(n=>n.kind==='activity');
 if(!enabled||!activities.length||!/PLC|电气控制/i.test(course?.title||''))return graph;
 const nodes=[...graph.nodes],edges=[...graph.edges];
 const titles=new Set(nodes.filter(n=>n.kind==='knowledge').map(n=>n.title));
 const ids=new Set(nodes.map(n=>n.id));
 const projects=new Set(nodes.filter(n=>n.kind==='project').map(n=>n.id));
 for(const topic of topics){
  // Only use a task whose visible subject matches this topic. No cross-project fan-out.
  const ranked=activities.map(node=>({node,score:topic.terms.filter(term=>node.title.includes(term)).length})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score);
  topic.points.forEach((title,index)=>{
   const id=JSON.stringify(['knowledge',`panorama-plc:${topic.key}:${index}`]);
   if(titles.has(title)||ids.has(id))return;
   nodes.push({id,kind:'knowledge',title,description:topic.name,origin:'simulation',review:'待业务复核',source:'按电气控制与PLC教学主题编制的知识拓展，非教师已保存知识库；关联为教学情境建议，待业务复核'});
   titles.add(title);ids.add(id);
   const target=ranked[index%Math.min(ranked.length,3)]?.node;
   if(target){
    const projectIds=graph.edges.filter(edge=>edge.to===target.id&&projects.has(edge.from)).map(edge=>edge.from);
    edges.push({id:JSON.stringify(['edge',target.id,id]),from:target.id,to:id,label:'教学情境知识关联',origin:'simulation',source:`依据任务主题与“${topic.name}”编制，待业务复核`,activityIds:[target.id],projectIds});
   }
  });
 }
 return {...graph,nodes,edges};
}
