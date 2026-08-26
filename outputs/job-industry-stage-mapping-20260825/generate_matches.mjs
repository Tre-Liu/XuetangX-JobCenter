import fs from "node:fs/promises";

const dir = new URL(".", import.meta.url);
const jobs = JSON.parse(await fs.readFile(new URL("jobs.json", dir), "utf8"));
const nodes = JSON.parse(await fs.readFile(new URL("industry_nodes.json", dir), "utf8"));

const normalize = value => String(value ?? "")
  .normalize("NFKC")
  .toUpperCase()
  .replace(/[\s·•,，。；;：:、/\\\-_—–（）()\[\]【】{}<>《》“”‘’'".+]/g, "");

const roleRules = [
  { stage: "上游", re: /研发|研究|算法|架构|设计|开发|科研|配方|勘探|勘查|采矿|采煤|选矿|原料|育种|种植/ },
  { stage: "中游", re: /生产|制造|工艺|操作|装配|组装|加工|质检|质量|检验|测试|调试|维修|检修|安装|焊接|打磨|抛光|车间|(?<!实)施工|监理|机修|设备维护|运维|绣花|纺纱|织造|印染|染整|缝纫|裁剪/ },
  { stage: "下游", re: /销售|市场|营销|渠道|运营|客服|售后|实施|服务|商务|采购|招商|顾问|编辑|医生|护士|治疗|门店|物流|仓储|配送|项目管理|产品经理|经纪|美容|导游|航班|航线|厨师|后厨|烧烤|餐饮|食堂|教练|讲师|教师|老师|培训|主播|买手/ },
  { stage: "中游", re: /工程师|技术员|技师|技工|操作工|普工/ },
  { stage: "下游", re: /经理|主管|专员|助理|负责人|管培|代表|文员/ },
];

const domainRules = [
  { chain: "人工智能产业链", re: /人工智能|机器学习|深度学习|神经网络|大模型|计算机视觉|机器视觉|语音识别|自然语言|NLP|智能算法|算法工程|(^|[^A-Z0-9])AI([^A-Z0-9]|$)/i, label: "人工智能/算法" },
  { chain: "数据要素与数字经济产业链", re: /大数据|数据治理|数据仓库|数据湖|数据开发|数据工程|数据分析|数据科学|数据资产|数据要素|区块链|数字化|数字经济|数据录入|数据标注|地图审核|游戏开发|游戏运营|数字内容|地理信息|测绘GIS|GIS开发|GIS工程|GIS数据|GIS平台|GIS软件|GIS应用/i, label: "数据/数字经济" },
  { chain: "软件与数字安全产业链", re: /软件|程序员|前端|后端|全栈|JAVA|PYTHON|C\+\+|\.NET|鸿蒙|操作系统|固件|嵌入式|网络安全|信息安全|数据安全|渗透测试|安全攻防|DDoS|密码技术|漏洞|ERP|MES|MOM|CRM|SAP|OA系统|数据库/, label: "软件/数字安全" },
  { chain: "新一代信息基础设施产业链", re: /(?<!交)通信|通讯|5G|基站|光纤|光缆|光通信|传输网|交换机|路由器|IDC|数据中心|云计算|云平台|云服务|云运维|云原生|网络工程|射频|天线|运营商/, label: "通信/云网基础设施" },
  { chain: "智能物联与消费电子产业链", re: /物联网|IOT|RFID|LORA|ZIGBEE|NB.?IOT|WIFI|智能硬件|消费电子|家电|冰箱|电视机|手机|平板电脑|摄像机|照相机|音响|音箱|耳机|投影仪|可穿戴|智能家居|电路板|PCB|电子元器件/, label: "物联/消费电子" },
  { chain: "半导体与集成电路产业链", re: /半导体|集成电路|芯片|IC设计|封装|封测|光刻|刻蚀|晶圆|EDA|硅片|CMP|IGBT|FPGA|GPU|CPU|ASIC|MCU|SOC|DSP/, label: "半导体/芯片" },
  { chain: "新型显示与虚拟现实产业链", re: /显示屏|显示面板|LED|OLED|LCD|MICRO.?LED|虚拟现实|增强现实|VR|AR设备/, label: "显示/虚拟现实" },
  { chain: "机器人产业链", re: /机器人|AGV|SCARA|机械臂|伺服|人机界面|HMI/, label: "机器人/伺服" },
  { chain: "高端装备与智能制造产业链", re: /智能制造|机械|机电|自动化|数控|CNC|机床|工业母机|3D打印|仪器仪表|光学仪器|农机|农业机械|凿岩|内燃机|五金|激光加工|起重机|挖掘机|工程机械/, label: "装备/智能制造" },
  { chain: "汽车与智能网联汽车产业链", re: /汽车|车辆|新能源车|乘用车|商用车|客车|货车|车身|底盘|发动机|车载|车联网|自动驾驶|ADAS|毫米波雷达|激光雷达|二手车|洗车/, label: "汽车/智能网联" },
  { chain: "新能源与电力装备产业链", re: /新能源|光伏|太阳能|风电|风力发电|储能|锂电|电池|电力|电气|电网|变电|输电|配电|供电|电缆|逆变器|变压器|互感器|换流|电抗器|充电桩|氢能|制氢|能源电控|GIS(?:组合电器|设备|开关)|组合电器/i, label: "新能源/电力装备" },
  { chain: "新材料产业链", re: /新材料|材料研发|材料测试|金属材料|(?:铝|钛|镁|硬质)?合金(?!融)|钢铁|炼铁|稀土|碳纤维|玻璃纤维|石墨|高分子材料|复合材料|陶瓷材料|冶金/, label: "新材料" },
  { chain: "石油化工产业链", re: /石油|石化|化工(?!程)|炼化|油气|录井|PVC|PE塑料|PP塑料|ABS塑料|PS塑料|PET纤维|橡胶|塑料|丁烷|丁二烯/, label: "石油化工" },
  { chain: "基础设施与城市建设产业链", re: /建筑|土木|工程造价|工程监理|市政|城乡规划|园林|景观|绿化项目|房地产|房产|物业|公路|道路|轨道交通|水利|水电工程|装饰装修|暖通|水暖|给排水|测绘|勘测|(?<!实)施工|燃气|天然气|供暖|公交|公用事业/, label: "城建/基础设施" },
  { chain: "绿色环保与资源循环产业链", re: /环保|环境工程|污水|废水|废气|固废|垃圾处理|垃圾焚烧|废纸|废旧|回收|再生资源|资源循环|碳汇|碳管理|节能|脱硫|脱硝|除尘|土壤修复|水处理|环卫|空气净化|污染治理/, label: "环保/资源循环" },
  { chain: "医药生物与医疗健康产业链", re: /医药|制药|药品|药物|中药|中医|医疗|医院|医生|护士|临床|检验医学|医学检验|诊断|疫苗|生物技术|生物医药|康复|体外诊断|IVD|医疗器械|医用|心电|外科|内科|健康管理|药店|药剂|药学|体检/, label: "医药/医疗健康" },
  { chain: "空天装备与低空经济产业链", re: /航空|航天|无人机|低空|飞行器|飞机|火箭|卫星|机载|航电|空域|飞控|空运|航班|航线|机场|武器系统|气象雷达/, label: "空天/低空经济" },
  { chain: "纺织产业链", re: /纺织|纺纱|织造|印染|染整|面料|服装|家纺|化纤|丝绸|绣花|针织|梭织|纤维|制衣|鞋厂|无尘服/, label: "纺织/服装" },
  { chain: "食品饮料产业链", re: /食品|饮料|乳品|乳制品|啤酒|冷冻饮品|餐饮|烘焙|酒类|饮品|农业种植|农产品|水产|养殖|厨师|后厨|烧烤|奶茶|咖啡|食堂|冷链/, label: "食品/餐饮" },
];

const broadByChain = new Map();
for (const node of nodes.filter(n => n.category === "excel_dict")) {
  if (!broadByChain.has(node.chain_name)) broadByChain.set(node.chain_name, []);
  broadByChain.get(node.chain_name).push(node);
}

const exactAliasMap = new Map();
const genericParts = new Set(["设备", "系统", "服务", "平台", "软件", "材料", "耗材", "运营", "制造", "应用", "其他"]);
for (const node of nodes.filter(n => n.category !== "excel_dict")) {
  const name = String(node.chain_node_name ?? "");
  const aliases = new Set([normalize(name)]);
  const prefix = name.replace(/[（(].*?[）)]/g, "");
  if (prefix !== name) aliases.add(normalize(prefix));
  for (const content of name.matchAll(/[（(]([^）)]+)[）)]/g)) aliases.add(normalize(content[1]));
  for (const part of name.split(/[\/、]/)) aliases.add(normalize(part));
  for (const alias of aliases) {
    if (!alias || genericParts.has(alias) || alias === "GIS") continue;
    const chineseCount = (alias.match(/[\u3400-\u9FFF]/g) ?? []).length;
    const asciiCount = (alias.match(/[A-Z0-9]/g) ?? []).length;
    if (chineseCount < 2 && asciiCount < 2) continue;
    if (!exactAliasMap.has(alias)) exactAliasMap.set(alias, []);
    exactAliasMap.get(alias).push(node);
  }
}

const sortedAliases = [...exactAliasMap.keys()].sort((a, b) => b.length - a.length);

const inferStage = title => {
  for (const rule of roleRules) {
    const m = title.match(rule.re);
    if (m) return { stage: rule.stage, basis: m[0] };
  }
  return { stage: null, basis: null };
};

const asciiAliasFound = (title, alias) => {
  if (!/^[A-Z0-9]+$/.test(alias)) return normalize(title).includes(alias);
  return new RegExp(`(^|[^A-Z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Z0-9]|$)`, "i").test(title);
};

const chooseStageNodes = (candidates, inferredStage) => {
  const byConcept = new Map();
  for (const node of candidates) {
    const key = `${node.chain_name}\u0000${node.chain_node_name}`;
    if (!byConcept.has(key)) byConcept.set(key, []);
    byConcept.get(key).push(node);
  }
  const chosen = [];
  for (const group of byConcept.values()) {
    const atStage = inferredStage ? group.filter(n => n.chain_node_stage === inferredStage) : [];
    chosen.push(...(atStage.length ? atStage : group));
  }
  return chosen;
};

const relations = [];
const statusRows = [];
const unmatched = [];

for (const job of jobs) {
  const title = String(job.cleaned_position ?? "").trim();
  const normalizedTitle = normalize(title);
  const stageInfo = inferStage(title);
  const jobRelations = [];
  const seenNodeIds = new Set();
  const directlyMatchedChains = new Set();

  for (const alias of sortedAliases) {
    if (!normalizedTitle.includes(alias) || !asciiAliasFound(title, alias)) continue;
    const selected = chooseStageNodes(exactAliasMap.get(alias), stageInfo.stage);
    for (const node of selected) {
      if (seenNodeIds.has(String(node.id))) continue;
      seenNodeIds.add(String(node.id));
      directlyMatchedChains.add(node.chain_name);
      const sameConceptChains = new Set(exactAliasMap.get(alias).map(n => n.chain_name));
      const review = !stageInfo.stage
        ? "需复核（岗位功能不足，阶段未明）"
        : node.chain_node_stage !== stageInfo.stage
          ? "需复核（产业环节阶段与岗位功能不一致）"
        : sameConceptChains.size > 1
          ? "需复核（同名环节跨产业链）"
          : "自动匹配";
      jobRelations.push({
        job_id: String(job.id),
        cleaned_position: title,
        industry_node_id: String(node.id),
        industry_source_id: node.source_id == null ? "" : String(node.source_id),
        chain_id: String(node.chain_id),
        chain_name: node.chain_name,
        chain_node_name: node.chain_node_name,
        chain_node_stage: node.chain_node_stage,
        match_type: "产业环节名称/简称命中",
        matched_keyword: alias,
        match_basis: `岗位名称包含产业环节名称或明确简称“${alias}”`,
        review_status: review,
        inferred_stage: stageInfo.stage ?? "未判定",
        stage_basis: stageInfo.basis ?? "岗位名称未提供可判断上中下游的功能词",
      });
    }
  }

  for (const rule of domainRules) {
    const m = title.match(rule.re);
    if (!m || directlyMatchedChains.has(rule.chain)) continue;
    const broadNodes = broadByChain.get(rule.chain) ?? [];
    const selected = stageInfo.stage
      ? broadNodes.filter(n => n.chain_node_stage === stageInfo.stage)
      : broadNodes;
    for (const node of selected) {
      if (seenNodeIds.has(String(node.id))) continue;
      seenNodeIds.add(String(node.id));
      jobRelations.push({
        job_id: String(job.id),
        cleaned_position: title,
        industry_node_id: String(node.id),
        industry_source_id: node.source_id == null ? "" : String(node.source_id),
        chain_id: String(node.chain_id),
        chain_name: node.chain_name,
        chain_node_name: node.chain_node_name,
        chain_node_stage: node.chain_node_stage,
        match_type: "领域词+岗位功能",
        matched_keyword: m[0],
        match_basis: stageInfo.stage
          ? `岗位名称命中${rule.label}领域词“${m[0]}”，并由功能词“${stageInfo.basis}”推断为${stageInfo.stage}`
          : `岗位名称命中${rule.label}领域词“${m[0]}”，但缺少可判断上中下游的功能词`,
        review_status: "需复核（领域词推断）",
        inferred_stage: stageInfo.stage ?? "未判定",
        stage_basis: stageInfo.basis ?? "岗位名称未提供可判断上中下游的功能词",
      });
    }
  }

  jobRelations.sort((a, b) => Number(a.industry_node_id) - Number(b.industry_node_id));
  relations.push(...jobRelations);
  const chainNames = [...new Set(jobRelations.map(r => r.chain_name))];
  const nodeLabels = jobRelations.map(r => `${r.chain_name}｜${r.chain_node_name}（${r.chain_node_stage}）`);
  const needsReview = jobRelations.some(r => r.review_status !== "自动匹配");
  statusRows.push({
    job_id: String(job.id),
    cleaned_position: title,
    match_status: jobRelations.length ? "已匹配" : "未匹配",
    relation_count: jobRelations.length,
    matched_chain_count: chainNames.length,
    matched_chains: chainNames.join("；"),
    matched_industry_stages: nodeLabels.join("；"),
    review_status: jobRelations.length ? (needsReview ? "含需复核关系" : "自动匹配") : "无明确产业词",
  });
  if (!jobRelations.length) {
    unmatched.push({
      job_id: String(job.id),
      cleaned_position: title,
      unmatched_reason: "岗位名称未命中产业环节名称、明确简称或产业领域词；源数据无职责和所属行业字段，未强行匹配",
    });
  }
}

const metrics = {
  jobRows: jobs.length,
  matchedJobs: statusRows.filter(r => r.match_status === "已匹配").length,
  unmatchedJobs: unmatched.length,
  relationRows: relations.length,
  autoRelations: relations.filter(r => r.review_status === "自动匹配").length,
  reviewRelations: relations.filter(r => r.review_status !== "自动匹配").length,
  multiRelationJobs: statusRows.filter(r => r.relation_count > 1).length,
  multiChainJobs: statusRows.filter(r => r.matched_chain_count > 1).length,
  byChain: Object.entries(relations.reduce((acc, r) => {
    acc[r.chain_name] = (acc[r.chain_name] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]),
};

await Promise.all([
  fs.writeFile(new URL("relations.json", dir), JSON.stringify(relations)),
  fs.writeFile(new URL("job_status.json", dir), JSON.stringify(statusRows)),
  fs.writeFile(new URL("unmatched.json", dir), JSON.stringify(unmatched)),
  fs.writeFile(new URL("metrics.json", dir), JSON.stringify(metrics, null, 2)),
]);

console.log(JSON.stringify(metrics, null, 2));
