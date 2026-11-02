// View-only prototype additions. Never written into saved project abilities.
const profiles={
 software:{知识:['组件职责与边界','页面状态与数据流','HTML语义与可访问性','CSS布局与响应式设计','JavaScript事件机制','接口契约与错误处理','前端测试方法','版本控制与代码评审'],技能:['拆分与实现页面组件','编写组件交互逻辑','处理异步数据与加载状态','实现响应式页面','排查浏览器兼容问题','编写组件测试','优化页面加载性能','提交与评审代码'],素养:['用户体验意识','代码质量意识','协作沟通','需求澄清意识','安全与隐私意识','问题闭环意识','持续学习','如实记录与交付']},
 culture:{知识:['文化资源分类','文献检索方法','史料来源与可信度','调查提纲设计','访谈与观察方法','资料编目规则','引用与版权规范','专题研究方法'],技能:['检索与筛选专题资料','建立来源台账','整理访谈记录','资料去重与分类','交叉核验资料','提炼文化主题','编写研究摘要','制作成果汇报'],素养:['尊重文化多样性','史料真实性意识','严谨求证','版权与引用意识','访谈伦理意识','团队协作','数据保密意识','持续学习']},
 general:{知识:['任务要求与验收标准','设备与工具原理','作业流程与参数','风险识别方法','质量检查方法','异常处理流程','数据记录规范','协同交接规范'],技能:['制定作业计划','检查实施条件','配置工具与参数','执行规范操作','采集过程数据','定位与处理异常','完成质量检验','整理交付证据'],素养:['安全责任意识','质量意识','规范执行','诚实记录','沟通协作','问题闭环意识','资源节约意识','持续改进']}
};

// Supplemental content is authored for the course graph and is never persisted as teacher data.
const additions={
 software:{知识:['浏览器渲染机制','构建与依赖管理','接口鉴权与数据保护','性能指标与诊断'],技能:['实现无障碍交互','设计表单校验','定位渲染性能瓶颈','编写交付说明'],素养:['工程规范意识','主动复盘','证据驱动分析','产品责任意识']},
 culture:{知识:['数字档案管理','田野调查方法','文化传播渠道','研究成果评价'],技能:['设计调研问卷','制作数字资源索引','核对资料授权','组织研究成果展示'],素养:['公共服务意识','客观表达','跨文化沟通','研究责任意识']},
 general:{知识:['设备状态监测','过程追溯方法','工艺文件识读','验收文档规范'],技能:['复核关键参数','组织协同调试','分析质量偏差','执行交接确认'],素养:['主动复盘','风险报告意识','标准化意识','服务责任意识']}
};
for(const [profile,categories] of Object.entries(additions))for(const [category,names] of Object.entries(categories))profiles[profile][category].push(...names);
profiles.electrical={
 知识:['电气原理图与接线图识读','低压电器与保护器件选型','三相异步电动机控制原理','PLC扫描周期与I/O映射','启停自保持与电气互锁','梯形图基本指令与功能块','变频器运行参数与接线','传感器信号与有效电平','接地保护与绝缘检测方法','定时计数与边沿检测','故障诊断与状态转换','设备验收与交付规范'],
 技能:['编制电气元件与工具清单','安装低压控制元件','完成控制回路接线','核对端子与线号','编制PLC输入输出分配表','编写启停与互锁程序','设置变频器运行参数','逐点校验传感器信号','开展空载与带载联调','定位控制回路异常','记录测试结果与整改过程','整理图纸与程序交付包'],
 素养:['断电核验与授权操作意识','电气作业风险防范','接线工艺与质量意识','如实记录测试结果','问题闭环与复测意识','团队分工与交叉复核','工具定置与现场整理','图纸版本管理意识','设备与资料保护意识','异常及时报告','节能与材料节约','持续改进与经验复盘']
};
profiles.automation={
 知识:['光电与电感式传感器原理','气动执行元件与回路','PLC顺序控制与状态机','工件识别与分类逻辑','信号滤波与防抖方法','单件追踪与边沿计数','气缸限位与动作超时','设备握手与工位互锁','气压监测与故障保护','分拣正确率与计数平衡','设备节拍测量方法','报警复位与恢复条件'],
 技能:['核验传感器安装位置','校验金属检测信号','调整气动回路工作参数','建立设备I/O核查表','编写分拣顺序程序','实现单件追踪与分类计数','配置气缸到位与超时互锁','调试输送与推料时序','执行小批次设备试运行','注入故障并验证保护动作','分析错分与节拍记录','编制设备调试与验收报告'],
 素养:['先仿真后实操意识','设备动作安全意识','质量与节拍平衡意识','逐件数据追溯意识','禁止篡改异常记录','跨工位协同沟通','调试参数变更留痕','故障复现与复测意识','风险升级与停止作业意识','现场设备保护','规范交接与复位确认','持续学习与工艺改进']
};
export function withPanoramaDemoAbilities(graph){
 const nodes=[...graph.nodes],edges=[...graph.edges],byId=new Map(nodes.map(n=>[n.id,n]));
 const edgeIds=new Set(edges.map(e=>e.id));
 for(const role of graph.nodes.filter(n=>n.kind==='role')){
  const profile=/前端|后端|软件|开发/.test(role.title)?profiles.software:/自动化|分拣|机器人/.test(role.title)?profiles.automation:/电气|电工|产线|装调/.test(role.title)?profiles.electrical:/文化|研究|文献|调查/.test(role.title)?profiles.culture:profiles.general;
  const works=graph.edges.filter(e=>e.from===role.id&&byId.get(e.to)?.kind==='workTask').map(e=>e.to);
  const projectIds=graph.edges.filter(e=>(works.includes(e.from)||e.from===role.id)&&byId.get(e.to)?.kind==='project').map(e=>e.to);
  const owners=works.length?works:projectIds;if(!owners.length)continue;
  const savedTitles=new Set(graph.edges.filter(e=>owners.includes(e.from)&&byId.get(e.to)?.kind==='ability').map(e=>byId.get(e.to).title));
  Object.entries(profile).forEach(([category,names],categoryIndex)=>names.forEach((title,index)=>{
   const id=JSON.stringify(['ability',`panorama-demo:${role.id}:${categoryIndex}:${index}`]);
   if(byId.has(id)||savedTitles.has(title))return;
   const owner=owners[(index+categoryIndex)%owners.length];
   const scopeProjects=byId.get(owner)?.kind==='project'?[owner]:graph.edges.filter(e=>e.from===owner&&byId.get(e.to)?.kind==='project').map(e=>e.to);
   const activities=graph.edges.filter(e=>scopeProjects.includes(e.from)&&byId.get(e.to)?.kind==='activity').map(e=>e.to);
   const knowledgeEdges=graph.edges.filter(e=>activities.includes(e.from)&&byId.get(e.to)?.kind==='knowledge');
   const node={id,kind:'ability',title,description:category,source:'按岗位职责编制的教学情境能力拓展；关联用于图谱交互展示，待业务复核',review:'模拟数据',origin:'simulation'};
   nodes.push(node);byId.set(id,node);
   const link=(from,to,extra={})=>{const edgeId=JSON.stringify(['edge',from,to]);if(edgeIds.has(edgeId))return;edgeIds.add(edgeId);edges.push({id:edgeId,from,to,source:'教学情境能力关联，非已核验岗位标准',origin:'simulation',...extra});};
   link(owner,id,{projectIds:scopeProjects});
   // Keep links sparse and scoped to one activity under this saved work task.
   if(index<8&&knowledgeEdges.length){
    const target=knowledgeEdges[(index+categoryIndex*3)%knowledgeEdges.length];
    const targetProjects=graph.edges.filter(e=>e.to===target.from&&byId.get(e.from)?.kind==='project').map(e=>e.from);
    const context={activityIds:[target.from],projectIds:targetProjects};
    link(target.from,id,context);link(id,target.to,context);
   }
  }));
 }
 return {...graph,nodes,edges};
}
