// Explicitly simulated teaching examples. Keep separate from teacher projects.
const examples=[
 ['plm','m1-t3','产品生命周期管理','PLM实施工程师','产品数据与工程变更管理','产品生命周期协同管理实训','审核产品变更并追踪版本',[
  ['知识','能说明产品从设计、制造到运维各阶段的数据流转要求'],
  ['技能','能配置工程变更审批流程并追踪产品版本与发布状态']]],
 ['bom','m1-t3-p0','产品结构与BOM','产品数据管理员','产品结构维护与BOM校验','产品BOM构建与校验实训','建立产品结构并核对物料清单',[
  ['技能','能依据装配图建立多层产品结构与物料清单'],
  ['技能','能核对物料编码、用量与版本，识别BOM差异']]],
 ['robot','m2-t3-p1','机器人轨迹编程','工业机器人调试工程师','机器人轨迹编程与调试','机器人搬运工作站调试实训','编写搬运轨迹并完成仿真验证',[
  ['技能','能设置工具坐标系与工件坐标系，编写点位及运动指令'],
  ['技能','能通过仿真检查轨迹干涉并优化运动速度与作业节拍']]],
 ['plc','m2-t1','PLC与工业控制','自动化控制工程师','PLC程序开发与设备联调','自动分拣生产线控制实训','设计分拣顺序控制并联调设备',[
  ['知识','能分析设备工艺流程并设计I/O点表与控制逻辑'],
  ['技能','能编写顺序控制及安全联锁程序并完成输入输出联调']]],
 ['quality','m5-t2-p1','质量预测','制造质量工程师','生产质量分析与预测','产品质量预测与改进实训','分析过程数据并评估质量风险',[
  ['技能','能清洗生产过程数据，选择与质量缺陷相关的特征'],
  ['技能','能评估质量预测结果并提出可验证的工艺改进建议']]],
];

export function withJobRelationDemos(graph){
 if(Array.isArray(graph.demoJobProjects))return graph;
 const demoJobProjects=examples.filter(([,nodeId])=>graph.nodes.some(n=>n.id===nodeId)).map(([key,nodeId,name,roleName,workTitle,projectTitle,taskTitle,targets])=>{
  const prefix=`demo-job-${key}`,abilities=targets.map(([category,title],i)=>({id:`${prefix}-a${i}`,category,title,origin:'simulated'}));
  return {id:prefix,title:projectTitle,origin:'simulated',learningDesign:{role:{id:`${prefix}-role`,name:roleName,origin:'simulated'},sourceTask:{id:`${prefix}-work`,title:workTitle},abilities},stages:[{id:`${prefix}-stage`,title:'实践实施',tasks:[{id:`${prefix}-task`,title:taskTitle,learningActivity:{abilityIds:abilities.map(a=>a.id)},contents:[{id:`${prefix}-knowledge`,knowledgeNodeId:nodeId,title:name,source:'knowledge'}]}]}]};
 });
 return {...graph,demoJobProjects};
}
