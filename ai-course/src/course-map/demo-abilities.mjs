// View-only prototype additions. Never written into saved project abilities.
const profiles={
 software:{知识:['组件职责与边界','页面状态与数据流','HTML语义与可访问性','CSS布局与响应式设计','JavaScript事件机制','接口契约与错误处理','前端测试方法','版本控制与代码评审'],技能:['拆分与实现页面组件','编写组件交互逻辑','处理异步数据与加载状态','实现响应式页面','排查浏览器兼容问题','编写组件测试','优化页面加载性能','提交与评审代码'],素养:['用户体验意识','代码质量意识','协作沟通','需求澄清意识','安全与隐私意识','问题闭环意识','持续学习','如实记录与交付']},
 culture:{知识:['文化资源分类','文献检索方法','史料来源与可信度','调查提纲设计','访谈与观察方法','资料编目规则','引用与版权规范','专题研究方法'],技能:['检索与筛选专题资料','建立来源台账','整理访谈记录','资料去重与分类','交叉核验资料','提炼文化主题','编写研究摘要','制作成果汇报'],素养:['尊重文化多样性','史料真实性意识','严谨求证','版权与引用意识','访谈伦理意识','团队协作','数据保密意识','持续学习']},
 general:{知识:['任务要求与验收标准','设备与工具原理','作业流程与参数','风险识别方法','质量检查方法','异常处理流程','数据记录规范','协同交接规范'],技能:['制定作业计划','检查实施条件','配置工具与参数','执行规范操作','采集过程数据','定位与处理异常','完成质量检验','整理交付证据'],素养:['安全责任意识','质量意识','规范执行','诚实记录','沟通协作','问题闭环意识','资源节约意识','持续改进']}
};
export function withPanoramaDemoAbilities(graph){
 const nodes=[...graph.nodes],edges=[...graph.edges],byId=new Map(nodes.map(n=>[n.id,n]));
 for(const role of graph.nodes.filter(n=>n.kind==='role')){
  const profile=/前端|后端|软件|开发|程序/.test(role.title)?profiles.software:/文化|研究|文献|调查/.test(role.title)?profiles.culture:profiles.general;
  const works=graph.edges.filter(e=>e.from===role.id&&byId.get(e.to)?.kind==='workTask').map(e=>e.to);
  const projectIds=graph.edges.filter(e=>(works.includes(e.from)||e.from===role.id)&&byId.get(e.to)?.kind==='project').map(e=>e.to);
  const owners=works.length?works:projectIds;if(!owners.length)continue;
  const activities=graph.edges.filter(e=>projectIds.includes(e.from)&&byId.get(e.to)?.kind==='activity').map(e=>e.to);
  const knowledgeEdges=graph.edges.filter(e=>activities.includes(e.from)&&byId.get(e.to)?.kind==='knowledge');
  const points=[...new Set(knowledgeEdges.map(e=>e.to))];
  Object.entries(profile).forEach(([category,names],categoryIndex)=>names.forEach((title,index)=>{
   const id=JSON.stringify(['ability',`panorama-demo:${role.id}:${categoryIndex}:${index}`]);
   nodes.push({id,kind:'ability',title,description:category,source:'图谱演示能力补充',review:'模拟数据',origin:'simulation'});
   const link=(from,to,extra={})=>edges.push({id:JSON.stringify(['edge',from,to]),from,to,source:'图谱模拟关联',origin:'simulation',...extra});
   owners.forEach(owner=>link(owner,id,{projectIds}));
   // Deliberately sparse, differing prototype links. Existing saved links stay intact.
   if(index<5&&points.length){
    const target=points[(index+categoryIndex*2)%points.length];
    link(id,target,{activityIds:knowledgeEdges.filter(e=>e.to===target).map(e=>e.from),projectIds});
   }
  }));
 }
 return {...graph,nodes,edges};
}
