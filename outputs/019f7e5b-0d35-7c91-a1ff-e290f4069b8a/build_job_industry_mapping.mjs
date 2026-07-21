import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const sourcePath = "/Users/liuhongzhe/Desktop/学堂/专业建设/需求/V1.0/数据搬移/job_position.xlsx";
const industryPath = "/Users/liuhongzhe/Desktop/产业链整理结果/industry_chain_stage_node_report.md";
const workDir = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/019f7e5b-0d35-7c91-a1ff-e290f4069b8a";

if (process.argv[2] === "verify") {
  const finalPath = `${workDir}/岗位与产业节点关联表.xlsx`;
  const finalBlob = await FileBlob.load(finalPath);
  const finalWorkbook = await SpreadsheetFile.importXlsx(finalBlob);
  const sheets = await finalWorkbook.inspect({ kind: "sheet", include: "id,name", maxChars: 4000 });
  const summary = await finalWorkbook.inspect({ kind: "table", range: "说明与统计!A1:H8", include: "values,formulas", tableMaxRows: 8, tableMaxCols: 8, maxChars: 6000 });
  const errors = await finalWorkbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "imported workbook formula error scan", maxChars: 4000 });
  console.log(sheets.ndjson);
  console.log(summary.ndjson);
  console.log(errors.ndjson);
  process.exit(0);
}

const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 12000,
  tableMaxRows: 12,
  tableMaxCols: 16,
  tableMaxCellChars: 160,
});
console.log(summary.ndjson);

const sheets = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 5000 });
console.log(sheets.ndjson);

const firstSheet = workbook.worksheets.getItemAt(0);
const used = firstSheet.getUsedRange(true);
console.log(JSON.stringify({
  firstSheet: firstSheet.name,
  usedAddress: used?.address ?? null,
  rowCount: used?.rowCount ?? null,
  columnCount: used?.columnCount ?? null,
}));
await fs.writeFile(`${workDir}/source_rows.json`, JSON.stringify(used.values));

const preview = await workbook.render({
  sheetName: firstSheet.name,
  range: "A1:L25",
  scale: 1.3,
  format: "png",
});
await fs.writeFile(`${workDir}/source_preview.png`, new Uint8Array(await preview.arrayBuffer()));

const markdown = await fs.readFile(industryPath, "utf8");
const overview = markdown.split("## 原始数据映射详情")[0];
const lines = overview.split(/\r?\n/);
const nodes = [];
let currentChain = "";
for (const line of lines) {
  const heading = line.match(/^###\s+(.+产业链)\s*$/);
  if (heading) currentChain = heading[1].trim();
  const row = line.match(/^\|\s*(上游|中游|下游)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([\d,]+)\s*\|\s*([^|]+?)\s*\|$/);
  if (row && currentChain) {
    nodes.push({
      chainName: currentChain,
      stage: row[1],
      nodeName: row[2].trim(),
      sourceDirections: row[3].trim(),
      companyCount: Number(row[4].replaceAll(",", "")),
      mappingType: row[5].trim(),
    });
  }
}
const chainNames = [...new Set(nodes.map((node) => node.chainName))];
for (const node of nodes) {
  node.chainId = `IC${String(chainNames.indexOf(node.chainName) + 1).padStart(2, "0")}`;
  node.nodeId = `ICN${String(nodes.indexOf(node) + 1).padStart(3, "0")}`;
}

const rules = [
  {
    chainName: "数据要素与数字经济产业链",
    terms: ["大数据", "数据治理", "数据科学", "数据分析", "数据工程", "数据开发", "数据仓库", "数据中台", "数据采集", "数据标注", "数据交易", "数据资产", "商业智能", "bi工程", "数据产品", "数据运营", "广告", "品牌设计", "视觉设计", "平面设计", "ui设计", "交互设计", "网页设计", "多媒体", "视频剪辑", "摄影", "编辑", "记者", "出版", "文案", "撰稿", "作家", "编剧", "导演", "美术", "音效", "排版", "直播", "新媒体", "数字内容", "内容创意", "电子商务", "电商", "网络销售", "在线销售", "seo", "sem", "用户运营", "内容运营", "产品运营"],
    occupations: [],
    defaultStage: "中游",
    stages: {
      上游: ["数据采集", "数据标注", "数据源", "数据资源", "采集工程", "爬虫", "etl", "数据基础设施"],
      中游: ["数据治理", "数据分析", "数据工程", "数据开发", "数据仓库", "数据库", "数据中台", "数据交易", "数据资产", "商业智能", "bi", "流通", "清洗", "建模"],
      下游: ["数据产品", "数据运营", "内容运营", "数字内容", "数据应用", "场景应用", "用户画像", "增长", "推荐系统", "广告", "品牌", "视觉", "平面", "ui", "交互", "网页", "多媒体", "视频", "摄影", "编辑", "记者", "出版", "文案", "直播", "新媒体", "电商", "电子商务", "网络销售", "在线销售", "seo", "sem"],
    },
  },
  {
    chainName: "高端装备与智能制造产业链",
    terms: ["数控", "机床", "机械", "激光", "工业工程", "智能制造", "自动化设备", "工业自动化", "设备点检", "设备维修", "仪器仪表", "仪表工", "模具", "机电", "装配", "焊接", "钳工", "机械设备", "机修", "冲压", "注塑", "车工", "铣工", "钻工", "电梯工"],
    occupations: ["机械设计工程技术人员", "设备点检员", "智能制造工程技术人员", "铁路机车制修工", "机械制造工程技术人员"],
    defaultStage: "中游",
    stages: {
      上游: ["基础件", "零部件", "工业母机", "数控机床", "模具", "液压", "轴承", "刀具", "伺服", "机械设计", "结构设计", "研发"],
      中游: ["装备制造", "机械制造", "激光加工", "装配", "焊接", "生产", "工艺", "工业工程", "智能制造", "自动化", "集成"],
      下游: ["设备点检", "设备维修", "设备维护", "运维", "售后", "技术服务", "质量管理", "应用", "机车制修"],
    },
  },
  {
    chainName: "基础设施与城市建设产业链",
    terms: ["建筑", "土木", "市政", "房地产", "物业", "工程造价", "施工", "城乡规划", "城市规划", "建筑结构", "暖通", "给排水", "工程测量", "燃气", "供热", "园林", "景观", "楼宇", "建材", "道路桥梁", "轨道交通"],
    occupations: ["建筑和市政设计工程技术人员", "土木建筑工程技术人员", "城镇燃气与供热工程技术人员", "房地产开发专业人员", "智能楼宇管理员", "砌筑工"],
    defaultStage: "中游",
    stages: {
      上游: ["规划", "设计", "勘察", "测绘", "测量", "造价", "咨询", "建材", "建筑材料", "结构设计", "景观设计", "工程准备"],
      中游: ["施工", "建设", "工程项目", "土建", "房地产开发", "安装", "砌筑", "监理", "项目管理"],
      下游: ["物业", "楼宇", "城市运营", "市政运营", "公用事业", "燃气", "供热", "设施运维", "商业地产运营", "销售", "中介", "置业", "客服"],
    },
  },
  {
    chainName: "医药生物与医疗健康产业链",
    terms: ["医药", "医疗", "药物", "药品", "制药", "生物技术", "生物医药", "基因", "疫苗", "诊断", "临床", "医师", "医生", "护士", "护理", "康复", "健康管理", "医学影像", "影像技师", "医疗器械", "体外诊断", "营养师", "心理咨询", "按摩"],
    occupations: ["全科医师", "内科护士", "影像技师", "医药代表", "健康管理师", "营养师", "心理咨询师", "盲人医疗按摩人员", "社群健康助理员", "宠物医师"],
    defaultStage: "下游",
    stages: {
      上游: ["药物研发", "新药", "药理", "药学研究", "诊断试剂", "生物研发", "基因", "疫苗", "实验", "核心材料"],
      中游: ["制药", "药品生产", "医疗器械", "医疗设备", "医疗机器人", "数字医疗", "医疗信息化", "生产", "质量", "注册", "药械"],
      下游: ["临床", "医师", "医生", "护士", "护理", "诊疗", "影像技师", "康复", "健康管理", "医药代表", "营养", "心理咨询", "按摩", "医疗服务"],
    },
  },
  {
    chainName: "新能源与电力装备产业链",
    terms: ["新能源", "电力", "光伏", "风电", "储能", "电池", "电芯", "输电", "配电", "发电", "变电", "能源", "特高压", "充电桩", "电气工程", "电工电器"],
    occupations: ["电工电器工程技术人员"],
    defaultStage: "中游",
    stages: {
      上游: ["材料", "电芯", "电池研发", "电池材料", "光伏设备", "风电设备", "发电设备", "研发", "设计"],
      中游: ["发电", "储能", "输电", "配电", "变电", "电力装备", "特高压", "生产", "制造", "安装", "调试"],
      下游: ["用电", "电力运营", "能源服务", "运维", "检修", "充电", "售电", "能效", "场景应用"],
    },
  },
  {
    chainName: "智能物联与消费电子产业链",
    terms: ["物联网", "iot", "智能物联", "智能家居", "家用电器", "家电", "智能终端", "智能手机", "消费电子", "智能硬件", "嵌入式", "单片机", "传感器", "pcb", "smt", "硬件工程", "电子产品", "电子元器件", "电子行业", "电子制造", "电路设计", "电容器", "变压器", "仪器", "仪表", "电器", "自动控制"],
    occupations: ["电子元器件工程技术人员", "电容器制造工"],
    defaultStage: "上游",
    stages: {
      上游: ["传感器", "芯片模组", "模组", "元器件", "pcb", "电路", "硬件设计", "嵌入式", "单片机", "电容器", "基础器件"],
      中游: ["智能终端", "手机", "家电", "电子产品", "物联平台", "终端开发", "生产", "制造", "集成", "产品"],
      下游: ["智能家居", "智慧家庭", "物联网应用", "行业物联", "消费场景", "售后", "运营", "销售"],
    },
  },
  {
    chainName: "石油化工产业链",
    terms: ["石油", "油气", "炼化", "化工", "日化", "化妆品配方", "涂料", "橡胶", "塑料", "化学品", "高分子"],
    occupations: ["化工生产工程技术人员", "化工实验工程技术人员", "日用化工工程技术人员", "化妆品配方师"],
    defaultStage: "中游",
    stages: {
      上游: ["油气", "原油", "天然气", "基础化工", "化工原料", "化学研究", "实验", "配方研发", "原料"],
      中游: ["炼化", "化工生产", "化工工艺", "材料制造", "生产", "加工", "制造", "反应", "装置"],
      下游: ["化工制品", "日化", "化妆品", "涂料", "橡胶", "塑料制品", "销售", "应用", "终端"],
    },
  },
  {
    chainName: "汽车与智能网联汽车产业链",
    terms: ["汽车", "车辆工程", "整车", "汽车零部件", "汽车电子", "智能驾驶", "自动驾驶", "车联网", "新能源汽车", "二手车", "汽修", "汽车维修", "汽车销售", "驾驶员"],
    occupations: ["汽车工程技术人员", "客运车辆驾驶员", "道路货运汽车驾驶员"],
    defaultStage: "中游",
    stages: {
      上游: ["汽车材料", "零部件", "汽车电子", "轻量化", "底盘", "动力总成", "电气", "研发", "设计"],
      中游: ["整车", "车辆工程", "汽车制造", "装配", "生产", "智能网联", "系统集成", "测试", "工艺"],
      下游: ["自动驾驶应用", "智能驾驶", "出行", "驾驶员", "汽车销售", "二手车", "汽修", "汽车维修", "售后", "后市场", "运营"],
    },
  },
  {
    chainName: "食品饮料产业链",
    terms: ["食品", "饮料", "餐饮", "厨师", "烘焙", "咖啡", "茶艺", "农产品", "粮油", "食品安全", "餐厅服务", "营养师", "农业技术"],
    occupations: ["餐厅服务员", "农业技术员", "营养师"],
    defaultStage: "下游",
    stages: {
      上游: ["农产品", "农业", "种植", "养殖", "原料", "食品配料", "粮油", "采购", "农业技术"],
      中游: ["食品加工", "饮料生产", "食品生产", "烘焙生产", "质量", "工艺", "制造", "加工", "研发"],
      下游: ["餐饮", "餐厅", "厨师", "咖啡", "茶艺", "零售", "渠道", "品牌", "销售", "消费服务", "营养"],
    },
  },
  {
    chainName: "新一代信息基础设施产业链",
    terms: ["通信", "5g", "网络工程", "网络运维", "云计算", "数据中心", "idc", "服务器", "边缘计算", "光通信", "基站", "算力", "云平台", "云服务", "网络架构"],
    occupations: ["通信工程技术人员"],
    defaultStage: "中游",
    stages: {
      上游: ["通信设备", "服务器", "光通信", "网络设备", "硬件", "基站设备", "算力硬件", "研发", "设计"],
      中游: ["5g", "数据中心", "idc", "云平台", "边缘计算", "网络建设", "通信网络", "部署", "架构", "集成"],
      下游: ["云服务", "网络服务", "通信服务", "行业数字化", "运维", "网络运维", "云运维", "技术支持", "销售", "售前", "售后"],
    },
  },
  {
    chainName: "绿色环保与资源循环产业链",
    terms: ["环保", "环境工程", "环境监测", "污水", "废水", "废气", "固废", "碳中和", "低碳", "节能", "资源循环", "资源回收", "污染治理", "废物", "hse", "ehs"],
    occupations: ["健康安全环境工程技术人员", "安全生产管理工程技术人员"],
    defaultStage: "中游",
    stages: {
      上游: ["环保设备", "环境监测", "监测设备", "资源回收", "回收基础", "研发", "设计"],
      中游: ["污染治理", "污水处理", "废气治理", "固废处理", "节能", "降碳", "碳管理", "环保工程", "治理服务"],
      下游: ["绿色运营", "园区运营", "市政环保", "企业环境管理", "hse", "ehs", "安全生产", "运营", "合规"],
    },
  },
  {
    chainName: "新材料产业链",
    terms: ["新材料", "材料工程", "材料研发", "材料科学", "冶金", "金属材料", "无机非金属", "复合材料", "纳米材料", "陶瓷", "高分子材料", "纤维材料", "制浆造纸"],
    occupations: ["化学研究人员", "制浆造纸工程技术人员"],
    defaultStage: "中游",
    stages: {
      上游: ["矿物", "原料", "基础材料", "化学研究", "材料研发", "材料科学", "配方", "研发"],
      中游: ["材料制备", "材料加工", "冶金", "复合材料", "陶瓷", "高分子", "制浆造纸", "生产", "制造", "工艺"],
      下游: ["材料应用", "高端制造配套", "应用工程", "技术支持", "销售", "产品"],
    },
  },
  {
    chainName: "空天装备与低空经济产业链",
    terms: ["航空", "航天", "飞行器", "无人机", "低空", "空域", "民航", "机务", "飞行", "空乘", "乘务员", "机场", "航空运输"],
    occupations: ["民航乘务员", "航空运输地面服务员"],
    defaultStage: "下游",
    stages: {
      上游: ["航空材料", "航天材料", "零部件", "航空电子", "核心系统", "研发", "设计"],
      中游: ["装备制造", "飞行器制造", "无人机制造", "航空制造", "装配", "生产", "试飞", "维修工程"],
      下游: ["低空运营", "空域", "飞行服务", "民航", "空乘", "地面服务", "航空运输", "无人机应用", "运营"],
    },
  },
  {
    chainName: "机器人产业链",
    terms: ["机器人", "机械臂", "机器人工程", "人形机器人", "工业机器人", "服务机器人"],
    occupations: [],
    defaultStage: "中游",
    stages: {
      上游: ["核心零部件", "控制器", "传感", "伺服", "减速器", "算法", "研发", "设计"],
      中游: ["机器人本体", "机器人制造", "系统集成", "装配", "调试", "开发", "生产"],
      下游: ["机器人应用", "工业应用", "服务机器人", "特种机器人", "运维", "售后", "操作", "场景"],
    },
  },
  {
    chainName: "人工智能产业链",
    terms: ["人工智能", "机器学习", "深度学习", "机器视觉", "计算机视觉", "图像识别", "语音识别", "自然语言处理", "大模型", "算法工程", "ai工程", "智能驾驶", "推荐算法", "人工智能训练"],
    occupations: ["人工智能工程技术人员", "人工智能训练师"],
    defaultStage: "中游",
    stages: {
      上游: ["数据", "算力", "模型基础", "大模型", "训练", "算法研发", "机器学习", "深度学习", "基础模型"],
      中游: ["机器视觉", "计算机视觉", "图像", "语音识别", "自然语言", "智能感知", "平台", "工具", "算法工程"],
      下游: ["行业应用", "智能驾驶", "推荐", "智能客服", "ai服务", "产品", "解决方案", "场景应用"],
    },
  },
  {
    chainName: "半导体与集成电路产业链",
    terms: ["半导体", "芯片", "集成电路", "ic设计", "芯片设计", "封装", "封测", "光刻", "eda", "晶圆", "fpga", "模拟电路", "数字电路", "射频", "微电子"],
    occupations: [],
    defaultStage: "中游",
    stages: {
      上游: ["半导体材料", "半导体设备", "光刻", "eda", "晶圆材料", "设备", "材料", "研发"],
      中游: ["芯片设计", "ic设计", "集成电路", "晶圆制造", "封装", "封测", "版图", "验证", "测试"],
      下游: ["芯片应用", "电子终端", "汽车芯片", "工业芯片", "技术支持", "销售", "产品", "应用工程"],
    },
  },
  {
    chainName: "纺织产业链",
    terms: ["纺织", "服装", "面料", "印染", "纤维", "纺纱", "织造", "家纺", "服装设计", "版师"],
    occupations: [],
    defaultStage: "中游",
    stages: {
      上游: ["纤维", "纺织材料", "纱线", "原料", "材料", "研发"],
      中游: ["纺纱", "织造", "印染", "面料", "生产", "制造", "工艺", "质检"],
      下游: ["服装", "家纺", "品牌", "渠道", "零售", "终端", "服装设计", "销售"],
    },
  },
  {
    chainName: "新型显示与虚拟现实产业链",
    terms: ["新型显示", "显示屏", "led", "lcd", "oled", "显示面板", "虚拟现实", "增强现实", "vr", "ar开发", "unity", "u3d", "ue4", "unreal", "cocos", "flash", "游戏", "动画", "三维", "3d建模", "特效"],
    occupations: ["灯光师"],
    defaultStage: "下游",
    stages: {
      上游: ["显示材料", "光学器件", "核心部件", "led芯片", "驱动芯片", "研发", "设计"],
      中游: ["显示面板", "显示屏", "vr设备", "终端", "设备制造", "生产", "开发", "集成"],
      下游: ["虚拟现实", "增强现实", "vr", "ar", "游戏", "unity", "u3d", "ue4", "unreal", "cocos", "flash", "三维", "3d", "沉浸式", "内容", "特效", "灯光"],
    },
  },
  {
    chainName: "软件与数字安全产业链",
    terms: ["软件", "互联网技术", "前端", "后端", "程序开发", "程序设计", "软件测试", "测试开发", "区块链", "网络安全", "信息安全", "密码", "erp", "crm", "oa软件", "操作系统", "数据库", "java", "python", "golang", "node.js", ".net", "android", "ios开发", "web开发", "devops"],
    occupations: ["计算机软件工程技术人员", "计算机程序设计员", "计算机软件测试员"],
    defaultStage: "中游",
    stages: {
      上游: ["基础软件", "操作系统", "数据库", "中间件", "密码", "可信", "底层", "框架", "区块链底层", "安全技术"],
      中游: ["应用软件", "软件开发", "前端", "后端", "程序", "测试", "区块链平台", "安全产品", "erp", "crm", "oa", "产品开发"],
      下游: ["数字化", "安全运营", "网络安全运营", "实施", "运维", "技术支持", "政企", "解决方案", "客户成功", "应用服务"],
    },
  },
];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function hasTerm(text, term) {
  const haystack = String(text ?? "").toLowerCase().replaceAll("绿化工", "绿化岗位");
  const needle = term.toLowerCase();
  if (/^[a-z0-9]+$/.test(needle) && needle.length <= 5) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegex(needle)}([^a-z0-9]|$)`, "i").test(haystack);
  }
  return haystack.includes(needle);
}
const matchedTerms = (text, terms) => terms.filter((term) => hasTerm(text, term));

const header = used.values[0];
const jobs = used.values.slice(1).map((row) => Object.fromEntries(header.map((key, index) => [key, row[index]])));
const nodeByChainStage = new Map(nodes.map((node) => [`${node.chainName}|${node.stage}`, node]));
const mappingRows = [];
const coverageRows = [];

for (const job of jobs) {
  const name = String(job.position_name ?? "");
  const occupation = String(job.primary_occupation_name ?? "");
  const body = `${job.work_summary ?? ""} ${job.requirements_text ?? ""}`;
  const fullText = `${name} ${occupation} ${body}`;
  const candidates = [];

  for (const rule of rules) {
    const nameHits = matchedTerms(name, rule.terms);
    const occupationHits = matchedTerms(occupation, rule.terms);
    const bodyHits = matchedTerms(body, rule.terms);
    const occupationExact = rule.occupations.includes(occupation);
    const occupationSupported = occupationExact && bodyHits.length >= 1;
    const chainScore = Math.min(nameHits.length, 3) * 14
      + Math.min(bodyHits.length, 8) * 2
      + (occupationSupported ? 4 : 0);
    const strong = nameHits.length > 0 || occupationSupported;
    const descriptionOnly = !strong && bodyHits.length >= 3 && chainScore >= 6;
    if (!strong && !descriptionOnly) continue;
    candidates.push({ rule, chainScore, nameHits, occupationHits, bodyHits, strong });
  }

  candidates.sort((a, b) => b.chainScore - a.chainScore || a.rule.chainName.localeCompare(b.rule.chainName, "zh-CN"));
  const selectedChains = candidates.filter((candidate, index) => {
    if (candidate.strong) return index < 5 && candidate.chainScore >= 8;
    return index < 3 && candidate.chainScore >= 4 && candidate.chainScore >= candidates[0].chainScore - 4;
  });

  const jobMappings = [];
  for (const candidate of selectedChains) {
    const stageScores = Object.entries(candidate.rule.stages).map(([stage, terms]) => {
      const nameHits = matchedTerms(name, terms);
      const occupationHits = matchedTerms(occupation, terms);
      const bodyHits = matchedTerms(body, terms);
      const score = Math.min(nameHits.length, 3) * 6
        + Math.min(bodyHits.length, 6)
        + (stage === candidate.rule.defaultStage ? 2 : 0);
      return { stage, score, nameHits, occupationHits, bodyHits };
    }).sort((a, b) => b.score - a.score || ["上游", "中游", "下游"].indexOf(a.stage) - ["上游", "中游", "下游"].indexOf(b.stage));

    const maxStageScore = stageScores[0].score;
    const chosenStages = stageScores.filter((stage, index) => index === 0 || (stage.score >= 6 && stage.score >= maxStageScore - 2)).slice(0, 2);
    for (const stageMatch of chosenStages) {
      const node = nodeByChainStage.get(`${candidate.rule.chainName}|${stageMatch.stage}`);
      const chainEvidence = [...candidate.nameHits, ...candidate.occupationHits, ...candidate.bodyHits].filter((item, index, array) => array.indexOf(item) === index).slice(0, 5);
      const stageEvidence = [...stageMatch.nameHits, ...stageMatch.occupationHits, ...stageMatch.bodyHits].filter((item, index, array) => array.indexOf(item) === index).slice(0, 5);
      const relevanceScore = Math.min(98, 48 + Math.min(candidate.chainScore, 36) + Math.min(stageMatch.score, 14));
      const confidence = relevanceScore >= 82 ? "高" : relevanceScore >= 68 ? "中" : "低";
      jobMappings.push({
        job,
        node,
        relevanceScore,
        confidence,
        chainEvidence,
        stageEvidence,
        reason: `岗位名称/描述出现“${chainEvidence.join("、") || "相关职业类别"}”，工作环节更贴近“${stageEvidence.join("、") || candidate.rule.defaultStage}”，因此关联到该节点。`,
      });
    }
  }

  jobMappings.sort((a, b) => b.relevanceScore - a.relevanceScore || a.node.nodeId.localeCompare(b.node.nodeId));
  const deduped = jobMappings.filter((item, index, array) => array.findIndex((other) => other.node.nodeId === item.node.nodeId) === index).slice(0, 6);
  mappingRows.push(...deduped);
  coverageRows.push({
    job,
    mappings: deduped,
    status: deduped.length === 0 ? "未匹配（现有产业链范围未覆盖或证据不足）" : deduped.some((item) => item.confidence === "低") ? "已匹配，建议复核" : "已匹配",
  });
}

const stats = {
  jobCount: jobs.length,
  nodeCount: nodes.length,
  relationCount: mappingRows.length,
  matchedJobCount: coverageRows.filter((row) => row.mappings.length > 0).length,
  unmatchedJobCount: coverageRows.filter((row) => row.mappings.length === 0).length,
  confidenceCounts: Object.fromEntries(["高", "中", "低"].map((level) => [level, mappingRows.filter((row) => row.confidence === level).length])),
  byChain: Object.fromEntries(chainNames.map((chainName) => [chainName, mappingRows.filter((row) => row.node.chainName === chainName).length])),
  unmatchedOccupations: Object.entries(coverageRows.filter((row) => row.mappings.length === 0).reduce((acc, row) => {
    const key = row.job.primary_occupation_name || "（空）";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 30),
};
await fs.writeFile(`${workDir}/mapping_analysis.json`, JSON.stringify({ stats, nodes, coverageRows, mappingRows }, null, 2));
console.log(JSON.stringify(stats, null, 2));

const outputWorkbook = Workbook.create();
const summarySheet = outputWorkbook.worksheets.add("说明与统计");
const relationSheet = outputWorkbook.worksheets.add("岗位-产业节点关系");
const coverageSheet = outputWorkbook.worksheets.add("岗位映射覆盖检查");
const nodeSheet = outputWorkbook.worksheets.add("产业节点字典");

for (const sheet of [summarySheet, relationSheet, coverageSheet, nodeSheet]) sheet.showGridLines = false;

const colors = {
  navy: "#16324F",
  blue: "#245A84",
  teal: "#0F766E",
  paleBlue: "#EAF2F8",
  paleTeal: "#E8F5F2",
  paleAmber: "#FFF4D6",
  paleRed: "#FDECEC",
  gray: "#64748B",
  lightGray: "#E2E8F0",
  white: "#FFFFFF",
  dark: "#1E293B",
};

function titleBand(sheet, rangeAddress, title, noteRange, note) {
  sheet.getRange(rangeAddress).merge();
  sheet.getRange(rangeAddress).values = [[title]];
  sheet.getRange(rangeAddress).format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white, size: 16 },
    verticalAlignment: "center",
    horizontalAlignment: "left",
  };
  sheet.getRange(noteRange).merge();
  sheet.getRange(noteRange).values = [[note]];
  sheet.getRange(noteRange).format = {
    fill: colors.paleBlue,
    font: { color: colors.dark, size: 10 },
    verticalAlignment: "center",
    horizontalAlignment: "left",
    wrapText: true,
  };
}

function styleHeader(range) {
  range.format = {
    fill: colors.blue,
    font: { bold: true, color: colors.white, size: 10 },
    verticalAlignment: "center",
    horizontalAlignment: "center",
    wrapText: true,
    borders: { preset: "outside", style: "thin", color: colors.blue },
  };
}

const relationHeaders = [
  "关系ID", "岗位主键", "岗位编码", "岗位名称", "职业代码", "职业名称", "产业链ID", "标准产业链",
  "阶段", "产业节点ID", "产业节点", "相关度分数", "置信度", "命中证据", "匹配说明", "复核状态",
];
const relationData = mappingRows.map((item, index) => [
  `REL${String(index + 1).padStart(6, "0")}`,
  item.job.id,
  item.job.position_id,
  item.job.position_name,
  item.job.primary_occupation_code,
  item.job.primary_occupation_name,
  item.node.chainId,
  item.node.chainName,
  item.node.stage,
  item.node.nodeId,
  item.node.nodeName,
  item.relevanceScore,
  item.confidence,
  [...item.chainEvidence, ...item.stageEvidence].filter((term, idx, arr) => arr.indexOf(term) === idx).slice(0, 8).join("、"),
  item.reason,
  item.confidence === "低" ? "建议复核" : "自动通过",
]);
const relationLastRow = relationData.length + 3;
titleBand(
  relationSheet,
  "A1:P1",
  "岗位—产业节点多对多关系表",
  "A2:P2",
  "一行代表一条岗位与产业节点关系；同一岗位可出现多行。CMS 建议使用“岗位编码 + 产业节点ID”作为关联键，并优先导入复核状态为“自动通过/人工确认”的记录。",
);
relationSheet.getRange("A3:P3").values = [relationHeaders];
relationSheet.getRange(`A4:P${relationLastRow}`).values = relationData;
styleHeader(relationSheet.getRange("A3:P3"));
relationSheet.tables.add(`A3:P${relationLastRow}`, true, "JobIndustryRelations").style = "TableStyleMedium2";
relationSheet.freezePanes.freezeRows(3);
relationSheet.freezePanes.freezeColumns(4);
relationSheet.getRange(`A4:P${relationLastRow}`).format = { verticalAlignment: "top", font: { size: 9 } };
relationSheet.getRange(`N4:P${relationLastRow}`).format.wrapText = true;
relationSheet.getRange(`A4:A${relationLastRow}`).format.numberFormat = "@";
relationSheet.getRange(`C4:C${relationLastRow}`).format.numberFormat = "@";
relationSheet.getRange(`E4:E${relationLastRow}`).format.numberFormat = "@";
relationSheet.getRange(`G4:G${relationLastRow}`).format.numberFormat = "@";
relationSheet.getRange(`J4:J${relationLastRow}`).format.numberFormat = "@";
relationSheet.getRange(`L4:L${relationLastRow}`).format.numberFormat = "0";
relationSheet.getRange(`M4:M${relationLastRow}`).conditionalFormats.add("containsText", { text: "高", format: { fill: "#DCFCE7", font: { color: "#166534", bold: true } } });
relationSheet.getRange(`M4:M${relationLastRow}`).conditionalFormats.add("containsText", { text: "中", format: { fill: colors.paleAmber, font: { color: "#92400E", bold: true } } });
relationSheet.getRange(`M4:M${relationLastRow}`).conditionalFormats.add("containsText", { text: "低", format: { fill: colors.paleRed, font: { color: "#991B1B", bold: true } } });
relationSheet.getRange(`P4:P${relationLastRow}`).dataValidation = { rule: { type: "list", values: ["自动通过", "建议复核", "人工确认", "不采纳"] } };
relationSheet.getRange("1:1").format.rowHeight = 32;
relationSheet.getRange("2:2").format.rowHeight = 36;
relationSheet.getRange("3:3").format.rowHeight = 32;
relationSheet.getRange(`4:${relationLastRow}`).format.rowHeight = 44;
const relationWidths = [95, 72, 98, 150, 98, 145, 70, 190, 58, 82, 190, 76, 64, 190, 320, 86];
relationWidths.forEach((width, col) => relationSheet.getRangeByIndexes(2, col, relationLastRow - 2, 1).format.columnWidthPx = width);

const compactText = (value, max = 110) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
};
const coverageHeaders = ["岗位主键", "岗位编码", "岗位名称", "职业代码", "职业名称", "关系数", "映射状态", "最高置信度", "产业节点ID列表", "产业节点列表", "岗位简介摘要", "岗位职责摘要"];
const coverageData = coverageRows.map((row) => {
  const confidenceRank = { 高: 3, 中: 2, 低: 1 };
  const highest = row.mappings.map((item) => item.confidence).sort((a, b) => confidenceRank[b] - confidenceRank[a])[0] || "-";
  return [
    row.job.id,
    row.job.position_id,
    row.job.position_name,
    row.job.primary_occupation_code,
    row.job.primary_occupation_name,
    null,
    null,
    highest,
    row.mappings.map((item) => item.node.nodeId).join("、"),
    row.mappings.map((item) => `${item.node.chainName}/${item.node.stage}/${item.node.nodeName}`).join("；"),
    compactText(row.job.work_summary),
    compactText(row.job.requirements_text),
  ];
});
const coverageLastRow = coverageData.length + 3;
titleBand(
  coverageSheet,
  "A1:L1",
  "岗位映射覆盖检查",
  "A2:L2",
  "本表保留源文件中的全部岗位。关系数为 0 的岗位通常属于金融、教育、法务、通用管理等当前 19 条产业链未覆盖领域，或岗位名称/描述证据不足，未强行关联。",
);
coverageSheet.getRange("A3:L3").values = [coverageHeaders];
coverageSheet.getRange(`A4:L${coverageLastRow}`).values = coverageData;
const relationPositionRange = `'岗位-产业节点关系'!$C$4:$C$${relationLastRow}`;
const relationConfidenceRange = `'岗位-产业节点关系'!$M$4:$M$${relationLastRow}`;
coverageSheet.getRange(`F4:F${coverageLastRow}`).formulas = coverageRows.map((_, index) => [`=COUNTIF(${relationPositionRange},B${index + 4})`]);
coverageSheet.getRange(`G4:G${coverageLastRow}`).formulas = coverageRows.map((_, index) => [`=IF(F${index + 4}=0,"未匹配（现有产业链范围未覆盖或证据不足）",IF(COUNTIFS(${relationPositionRange},B${index + 4},${relationConfidenceRange},"低")>0,"已匹配，建议复核","已匹配"))`]);
styleHeader(coverageSheet.getRange("A3:L3"));
coverageSheet.tables.add(`A3:L${coverageLastRow}`, true, "JobMappingCoverage").style = "TableStyleMedium4";
coverageSheet.freezePanes.freezeRows(3);
coverageSheet.freezePanes.freezeColumns(3);
coverageSheet.getRange(`A4:L${coverageLastRow}`).format = { verticalAlignment: "top", font: { size: 9 } };
coverageSheet.getRange(`G4:L${coverageLastRow}`).format.wrapText = true;
coverageSheet.getRange(`F4:F${coverageLastRow}`).format.numberFormat = "0";
coverageSheet.getRange(`G4:G${coverageLastRow}`).conditionalFormats.add("containsText", { text: "未匹配", format: { fill: colors.paleRed, font: { color: "#991B1B" } } });
coverageSheet.getRange(`G4:G${coverageLastRow}`).conditionalFormats.add("containsText", { text: "建议复核", format: { fill: colors.paleAmber, font: { color: "#92400E" } } });
coverageSheet.getRange("1:1").format.rowHeight = 32;
coverageSheet.getRange("2:2").format.rowHeight = 36;
coverageSheet.getRange("3:3").format.rowHeight = 32;
coverageSheet.getRange(`4:${coverageLastRow}`).format.rowHeight = 72;
const coverageWidths = [72, 98, 155, 98, 145, 62, 210, 78, 180, 320, 300, 300];
coverageWidths.forEach((width, col) => coverageSheet.getRangeByIndexes(2, col, coverageLastRow - 2, 1).format.columnWidthPx = width);

const nodeHeaders = ["产业链ID", "标准产业链", "阶段", "产业节点ID", "产业节点", "映射原始方向", "企业数求和", "映射类型", "节点全路径"];
const nodeData = nodes.map((node) => [node.chainId, node.chainName, node.stage, node.nodeId, node.nodeName, node.sourceDirections, node.companyCount, node.mappingType, `${node.chainName}/${node.stage}/${node.nodeName}`]);
const nodeLastRow = nodeData.length + 3;
titleBand(
  nodeSheet,
  "A1:I1",
  "产业节点字典（19 条产业链 / 57 个节点）",
  "A2:I2",
  "节点顺序和口径来自 industry_chain_stage_node_report.md；产业链ID、产业节点ID为本工作簿生成的稳定导入标识。",
);
nodeSheet.getRange("A3:I3").values = [nodeHeaders];
nodeSheet.getRange(`A4:I${nodeLastRow}`).values = nodeData;
styleHeader(nodeSheet.getRange("A3:I3"));
nodeSheet.tables.add(`A3:I${nodeLastRow}`, true, "IndustryNodeDictionary").style = "TableStyleMedium9";
nodeSheet.freezePanes.freezeRows(3);
nodeSheet.freezePanes.freezeColumns(2);
nodeSheet.getRange(`A4:I${nodeLastRow}`).format = { verticalAlignment: "top", font: { size: 9 }, wrapText: true };
nodeSheet.getRange(`G4:G${nodeLastRow}`).format.numberFormat = "#,##0";
nodeSheet.getRange("1:1").format.rowHeight = 32;
nodeSheet.getRange("2:2").format.rowHeight = 36;
nodeSheet.getRange("3:3").format.rowHeight = 32;
nodeSheet.getRange(`4:${nodeLastRow}`).format.rowHeight = 34;
const nodeWidths = [72, 190, 58, 82, 210, 240, 92, 165, 360];
nodeWidths.forEach((width, col) => nodeSheet.getRangeByIndexes(2, col, nodeLastRow - 2, 1).format.columnWidthPx = width);

titleBand(
  summarySheet,
  "A1:H1",
  "岗位与产业节点关联成果",
  "A2:H2",
  "基于岗位名称、岗位简介和岗位职责进行一岗多节点语义匹配；结果面向 CMS 导入与专业—产业链—岗位的后续关联。生成日期：2026-07-20。",
);
summarySheet.getRange("A4:H4").values = [["岗位总数", null, "已匹配岗位", null, "未匹配岗位", null, "关系总数", null]];
summarySheet.getRange("A7:H7").values = [["产业节点数", null, "岗位匹配率", null, "高置信关系", null, "建议复核关系", null]];
summarySheet.getRange("B4").formulas = [[`=COUNTA('岗位映射覆盖检查'!$A$4:$A$${coverageLastRow})`]];
summarySheet.getRange("D4").formulas = [[`=COUNTIF('岗位映射覆盖检查'!$F$4:$F$${coverageLastRow},">0")`]];
summarySheet.getRange("F4").formulas = [[`=COUNTIF('岗位映射覆盖检查'!$F$4:$F$${coverageLastRow},"=0")`]];
summarySheet.getRange("H4").formulas = [[`=COUNTA('岗位-产业节点关系'!$A$4:$A$${relationLastRow})`]];
summarySheet.getRange("B7").formulas = [[`=COUNTA('产业节点字典'!$D$4:$D$${nodeLastRow})`]];
summarySheet.getRange("D7").formulas = [["=D4/B4"]];
summarySheet.getRange("F7").formulas = [[`=COUNTIF('岗位-产业节点关系'!$M$4:$M$${relationLastRow},"高")`]];
summarySheet.getRange("H7").formulas = [[`=COUNTIF('岗位-产业节点关系'!$P$4:$P$${relationLastRow},"建议复核")`]];
for (const labelRange of ["A4:A4", "C4:C4", "E4:E4", "G4:G4", "A7:A7", "C7:C7", "E7:E7", "G7:G7"]) {
  summarySheet.getRange(labelRange).format = { fill: colors.paleBlue, font: { bold: true, color: colors.navy }, horizontalAlignment: "center", verticalAlignment: "center" };
}
for (const valueRange of ["B4:B4", "D4:D4", "F4:F4", "H4:H4", "B7:B7", "D7:D7", "F7:F7", "H7:H7"]) {
  summarySheet.getRange(valueRange).format = { fill: colors.white, font: { bold: true, color: colors.teal, size: 15 }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: colors.lightGray } };
}
summarySheet.getRange("D7").format.numberFormat = "0.0%";
summarySheet.getRange("A10:H10").merge();
summarySheet.getRange("A10:H10").values = [["方法与使用说明"]];
summarySheet.getRange("A10:H10").format = { fill: colors.teal, font: { bold: true, color: colors.white, size: 11 }, verticalAlignment: "center" };
const methodRows = [
  ["匹配依据", "岗位名称为高权重证据，岗位简介与岗位职责为补充证据；源表职业分类仅在描述已出现对应行业词时作弱辅助。"],
  ["一岗多节点", "允许岗位跨产业链、跨阶段关联；每个岗位最多保留 6 个最相关节点，避免泛化匹配。"],
  ["置信度", "高：相关度 ≥82；中：68–81；低：<68。低置信关系默认标为“建议复核”。"],
  ["未匹配处理", "对当前 19 条产业链范围未覆盖的金融、教育、法务、通用管理岗位，或证据不足的岗位，不强行分配节点。"],
  ["CMS 建议", "产业节点字典作为主数据；关系表以“岗位编码 + 产业节点ID”导入；复核状态字段可由业务人员在导入前调整。"],
  ["岗位源文件", sourcePath],
  ["产业链源文件", industryPath],
];
summarySheet.getRange("A11:A17").values = methodRows.map((row) => [row[0]]);
summarySheet.getRange("B11:H17").merge(true);
summarySheet.getRange("B11:B17").values = methodRows.map((row) => [row[1]]);
summarySheet.getRange("A11:A17").format = { fill: colors.paleTeal, font: { bold: true, color: colors.navy }, verticalAlignment: "top" };
summarySheet.getRange("B11:H17").format = { wrapText: true, verticalAlignment: "top", font: { size: 9 }, borders: { preset: "inside", style: "thin", color: colors.lightGray } };
summarySheet.getRange("A19:D19").values = [["标准产业链", "节点数", "关系数", "低置信关系数"]];
styleHeader(summarySheet.getRange("A19:D19"));
summarySheet.getRange("A20:A38").values = chainNames.map((name) => [name]);
summarySheet.getRange("B20:B38").formulas = chainNames.map((_, index) => [`=COUNTIF('产业节点字典'!$B$4:$B$${nodeLastRow},A${index + 20})`]);
summarySheet.getRange("C20:C38").formulas = chainNames.map((_, index) => [`=COUNTIF('岗位-产业节点关系'!$H$4:$H$${relationLastRow},A${index + 20})`]);
summarySheet.getRange("D20:D38").formulas = chainNames.map((_, index) => [`=COUNTIFS('岗位-产业节点关系'!$H$4:$H$${relationLastRow},A${index + 20},'岗位-产业节点关系'!$M$4:$M$${relationLastRow},"低")`]);
summarySheet.tables.add("A19:D38", true, "ChainMappingSummary").style = "TableStyleMedium2";
summarySheet.getRange("A20:D38").format = { font: { size: 9 }, verticalAlignment: "center" };
summarySheet.getRange("B20:D38").format.numberFormat = "#,##0";
summarySheet.freezePanes.freezeRows(2);
summarySheet.getRange("1:1").format.rowHeight = 34;
summarySheet.getRange("2:2").format.rowHeight = 40;
summarySheet.getRange("4:4").format.rowHeight = 38;
summarySheet.getRange("7:7").format.rowHeight = 38;
summarySheet.getRange("10:10").format.rowHeight = 28;
summarySheet.getRange("11:17").format.rowHeight = 38;
summarySheet.getRange("19:19").format.rowHeight = 30;
summarySheet.getRange("A1:A38").format.columnWidthPx = 190;
for (const col of [1, 3, 5, 7]) summarySheet.getRangeByIndexes(0, col, 38, 1).format.columnWidthPx = 110;
for (const col of [2, 4, 6]) summarySheet.getRangeByIndexes(0, col, 38, 1).format.columnWidthPx = 125;

const relationCheck = await outputWorkbook.inspect({ kind: "table", range: `岗位-产业节点关系!A1:P12`, include: "values,formulas", tableMaxRows: 12, tableMaxCols: 16, maxChars: 10000 });
console.log(relationCheck.ndjson);
const coverageCheck = await outputWorkbook.inspect({ kind: "table", range: `岗位映射覆盖检查!A1:L10`, include: "values,formulas", tableMaxRows: 10, tableMaxCols: 12, maxChars: 8000 });
console.log(coverageCheck.ndjson);
const formulaErrors = await outputWorkbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan", maxChars: 5000 });
console.log(formulaErrors.ndjson);

const previewSpecs = [
  ["说明与统计", "A1:H38", "preview_summary.png", 1.25],
  ["岗位-产业节点关系", "A1:P18", "preview_relations.png", 0.85],
  ["岗位映射覆盖检查", "A1:L18", "preview_coverage.png", 0.85],
  ["产业节点字典", "A1:I20", "preview_nodes.png", 1.0],
];
for (const [sheetName, range, filename, scale] of previewSpecs) {
  const rendered = await outputWorkbook.render({ sheetName, range, scale, format: "png" });
  await fs.writeFile(`${workDir}/${filename}`, new Uint8Array(await rendered.arrayBuffer()));
}

const outputPath = `${workDir}/岗位与产业节点关联表.xlsx`;
const outputFile = await SpreadsheetFile.exportXlsx(outputWorkbook);
await outputFile.save(outputPath);
console.log(JSON.stringify({ outputPath }));
