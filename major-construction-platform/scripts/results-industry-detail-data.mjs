// Curated subdivisions of the existing construction archive, pending verification.
// Each row reuses a parent industry and its archived company/job associations.
// Retained national-industry section mappings from the existing industry editor.
export const industryNodeNationalIndustries = {
  design: ['E 建筑业', 'M 科学研究和技术服务业'],
  survey: ['M 科学研究和技术服务业', 'I 信息传输、软件和信息技术服务业'],
  software: ['I 信息传输、软件和信息技术服务业', 'M 科学研究和技术服务业'],
  materials: ['C 制造业', 'E 建筑业'],
  equipment: ['C 制造业', 'I 信息传输、软件和信息技术服务业'],
  testing: ['M 科学研究和技术服务业', 'E 建筑业'],
  'bim-service': ['I 信息传输、软件和信息技术服务业', 'M 科学研究和技术服务业', 'E 建筑业'],
  'smart-site': ['I 信息传输、软件和信息技术服务业', 'E 建筑业'],
  prefab: ['C 制造业', 'E 建筑业'],
  robotics: ['C 制造业', 'E 建筑业'],
  epc: ['E 建筑业', 'M 科学研究和技术服务业'],
  construction: ['E 建筑业'],
  regulation: ['E 建筑业', 'N 水利、环境和公共设施管理业'],
  'green-ops': ['E 建筑业', 'N 水利、环境和公共设施管理业', 'M 科学研究和技术服务业'],
  renewal: ['E 建筑业', 'N 水利、环境和公共设施管理业']
}
export const industryDetails = [
  { industryId:'node-bim-data', parent:'software', id:'data-processing', stage:'midstream', name:'工程数据治理与加工服务', techFields:['数据清洗','标准映射','质量校核'] },
  { industryId:'node-bim-data', parent:'software', id:'data-delivery', stage:'downstream', name:'工程数据交付与应用服务', techFields:['成果归档','数据接口','交付验收'] },
  { industryId:'node-smart-survey', parent:'survey', id:'spatial-modeling', stage:'midstream', name:'实景三维与空间建模服务', techFields:['点云处理','实景建模','坐标转换'] },
  { industryId:'node-smart-survey', parent:'survey', id:'survey-delivery', stage:'downstream', name:'测绘成果交付与更新服务', techFields:['成果质检','竣工测量','空间数据更新'] },
  { industryId:'node-iot-sensing', parent:'equipment', id:'sensing-integration', stage:'midstream', name:'建筑感知设备集成服务', techFields:['终端组网','网关配置','设备联调'] },
  { industryId:'node-iot-sensing', parent:'equipment', id:'equipment-maintenance', stage:'downstream', name:'建筑物联设备运维服务', techFields:['设备巡检','远程诊断','维护校准'] },
  { industryId:'node-prefab', parent:'prefab', id:'component-manufacturing', stage:'midstream', name:'预制构件数字化制造', techFields:['生产排程','模具管理','构件追溯'] },
  { industryId:'node-prefab', parent:'prefab', id:'component-delivery', stage:'downstream', name:'装配式构件供应与交付', techFields:['构件配送','进场验收','安装协同'] },
  { industryId:'node-bim-platform', parent:'bim-service', id:'bim-standards', stage:'upstream', name:'BIM模型标准与构件资源服务', techFields:['建模标准','族库建设','协同规范'] },
  { industryId:'node-bim-platform', parent:'bim-service', id:'bim-handover', stage:'downstream', name:'BIM竣工模型与数字交付', techFields:['模型核验','竣工移交','运维衔接'] },
  { industryId:'node-smart-site', parent:'smart-site', id:'site-connectivity', stage:'upstream', name:'工地网络与数据接入服务', techFields:['现场网络','接口适配','数据汇聚'] },
  { industryId:'node-smart-site', parent:'smart-site', id:'site-operation', stage:'downstream', name:'智慧工地平台实施与运营', techFields:['平台部署','业务配置','运行保障'] },
  { industryId:'node-robotics', parent:'robotics', id:'robot-components', stage:'upstream', name:'建筑机器人部件与控制系统', techFields:['运动控制','视觉感知','末端执行器'] },
  { industryId:'node-robotics', parent:'robotics', id:'robot-support', stage:'downstream', name:'建筑机器人部署与运维服务', techFields:['现场调试','作业标定','维护保养'] },
  { industryId:'node-monitoring', parent:'testing', id:'monitoring-integration', stage:'midstream', name:'工程监测系统集成服务', techFields:['监测布点','采集系统','预警配置'] },
  { industryId:'node-monitoring', parent:'testing', id:'monitoring-analysis', stage:'downstream', name:'结构监测分析与评估服务', techFields:['数据诊断','风险评估','健康报告'] },
  { industryId:'node-green-ops', parent:'green-ops', id:'energy-platform', stage:'midstream', name:'建筑能源管理平台服务', techFields:['能耗接入','碳排核算','能效分析'] },
  { industryId:'node-green-ops', parent:'green-ops', id:'energy-retrofit', stage:'downstream', name:'建筑节能改造与运营服务', techFields:['节能诊断','改造实施','效果评估'] }
]
