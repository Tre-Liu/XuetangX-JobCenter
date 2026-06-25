import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "/Users/liuhongzhe/Documents/专业建设/岗位详情字段爬取模板.xlsx";
const outputDir = "/Users/liuhongzhe/Documents/专业建设/outputs/update-job-template";
const outputPath = `${outputDir}/岗位详情字段爬取模板_更新版.xlsx`;
const rootOutputPath = "/Users/liuhongzhe/Documents/专业建设/岗位详情字段爬取模板.xlsx";

const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);

const header = ["字段编码", "字段名称", "数据类型", "是否必填", "关联/枚举", "爬取说明", "示例值"];

const extraSheetRows = {
  基本信息: {
    start: "A28:G36",
    rows: [
      ["group_id", "岗位群ID", "string", "否", "关联岗位群", "对应 demo 中 JobCard.groupId，用于稳定关联岗位群。", "group-smart-site"],
      ["industry_chain_id", "产业链ID", "string", "否", "关联产业.chain_id", "对应 demo 中 INDUSTRY_CHAINS.id 或推荐产业链 id。", "chain-platform"],
      ["industry_node_id", "产业节点ID", "string", "否", "关联产业.industry_node_id", "对应 demo 中 IndustryNode.id，用于岗位-产业节点映射。", "node-smart-site"],
      ["task_count", "典型任务数", "number", "否", "-", "岗位卡片或详情中的任务数量。", "7"],
      ["ability_count", "能力项数", "number", "否", "-", "岗位卡片或详情中的能力项数量。", "80"],
      ["related_course_ids", "关联课程ID", "string[]", "否", "关联课程库", "demo 中 COURSE_NODES.jobIds 反查得到的课程编码，多个用中文分号分隔。", "course-smart-project；course-iot-site"],
      ["related_course_names", "关联课程名称", "string[]", "否", "关联课程库", "岗位对应课程名称，服务岗位-课程图谱。", "工程项目智慧管理；5G与物联网在智慧工地应用"],
      ["keywords", "岗位关键词", "string[]", "否", "-", "岗位画像、招聘趋势或搜索标签中的关键词。", "智慧工地；平台配置；数据看板"],
      ["source_data_object", "Demo 数据对象", "string", "否", "-", "标记该字段在 demo 中对应的数据对象，便于研发对照。", "JobCard / PortraitJobDetail"],
    ],
  },
  典型工作任务: {
    start: "A15:G18",
    rows: [
      ["task_stage", "任务阶段", "string", "否", "-", "按任务语义归类，如准备、处理、实施、评价、交付。", "现场协同实施"],
      ["task_output", "任务成果物", "string[]", "否", "-", "任务形成的可验收成果，多个用中文分号分隔。", "平台配置记录；联调日志；问题闭环清单"],
      ["task_ability_count", "关联能力项数量", "number", "否", "-", "该任务关联能力项数量，可由 ability_names 统计。", "12"],
      ["source_data_object", "Demo 数据对象", "string", "否", "-", "标记该字段在 demo 中对应的数据对象。", "JobTask"],
    ],
  },
  岗位能力项: {
    start: "A16:G19",
    rows: [
      ["ability_graph_node_id", "能力图谱节点ID", "string", "否", "能力图谱节点", "用于前端能力图谱或任务-能力关系图的节点唯一标识。", "ability-smart-site-platform-config"],
      ["ability_level", "能力层级", "enum", "否", "基础；核心；拓展", "按岗位能力模型对能力项进行层级标注。", "核心"],
      ["evidence_text", "能力证据描述", "text", "否", "-", "支撑能力项的岗位任务、招聘描述或课程成果证据。", "能够配置智慧工地平台并输出进度质量安全数据看板。"],
      ["source_data_object", "Demo 数据对象", "string", "否", "-", "标记该字段在 demo 中对应的数据对象。", "JobAbility / PortraitAbilityGroup"],
    ],
  },
  岗位画像详情: {
    start: "A34:G39",
    rows: [
      ["radar_series_labels", "雷达系列名称", "string[]", "否", "-", "demo 中 radarSeries.label，通常为知识、技能、素养。", "知识；技能；素养"],
      ["radar_series_colors", "雷达系列颜色", "string[]", "否", "-", "demo 中 radarSeries.color，保留前端可视化颜色。", "#326fff；#20bfb8；#8b52e8"],
      ["certificate_levels", "推荐证书等级", "string[]", "否", "关联证书详情.cert_level", "画像弹窗推荐证书的等级，多个用中文分号分隔。", "中级；专项；高级"],
      ["company_tags", "相关企业标签", "string[]", "否", "关联企业详情.company_tags", "画像弹窗企业卡片中的标签。", "BIM；智慧工地；工程总承包"],
      ["display_order", "画像展示排序", "number", "否", "-", "岗位画像列表或热门岗位中的展示顺序。", "1"],
      ["source_data_object", "Demo 数据对象", "string", "否", "-", "标记该字段在 demo 中对应的数据对象。", "PortraitJobDetail"],
    ],
  },
  企业详情: {
    start: "A30:G35",
    rows: [
      ["unified_social_credit_code", "统一社会信用代码", "string", "否", "-", "产业企业库中的企业信用代码。", "91110000700024288D"],
      ["company_address", "企业地址", "string", "否", "-", "产业企业库中的企业注册地址或办公地址。", "北京市海淀区西北旺东路10号院东区13号楼"],
      ["industry_name", "产业归属", "string", "否", "关联产业.industry_node_name", "企业对应的产业或产业节点。", "BIM咨询与工程数字化服务产业"],
      ["product_services", "产品/服务", "string[]", "否", "-", "产业企业库中的产品或服务，多个用中文分号分隔。", "BIM协同平台；数字造价；智慧工地平台"],
      ["source_module", "来源模块", "enum", "否", "岗位画像详情；产业企业库", "标记企业字段来自岗位画像弹窗还是产业企业库。", "产业企业库"],
      ["source_data_object", "Demo 数据对象", "string", "否", "-", "标记该字段在 demo 中对应的数据对象。", "CompanyDetail / IndustryCompanyItem"],
    ],
  },
};

for (const [sheetName, config] of Object.entries(extraSheetRows)) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const range = sheet.getRange(config.start);
  range.values = config.rows;
  range.format.wrapText = true;
  range.format.borders = { preset: "all", style: "thin", color: "#D9E2F3" };
}

const industryRows = [
  ["产业字段说明", null, null, null, null, null, null],
  ["根据当前 demo 的产业调研、岗位建设中心和 CMS 产业初始化数据整理；覆盖产业链、产业节点、区域、政策、企业、推荐结果及岗位/课程映射字段。", null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  header,
  ["record_id", "记录ID", "string", "是", "主键", "产业字段记录唯一标识，可按对象类型+业务ID生成。", "industry-node-smart-site"],
  ["record_type", "记录类型", "enum", "是", "产业链；产业节点；产业关系；区域；政策；企业；推荐结果；岗位课程映射", "区分该行数据属于哪类产业对象。", "产业节点"],
  ["source_module", "来源模块", "enum", "是", "产业调研；岗位建设中心；CMS初始化；产业企业库；产业政策库", "标记字段来自 demo 的哪个功能模块。", "产业调研"],
  ["source_tab", "来源Tab", "enum", "否", "产业链图谱；区域产业分析；产业政策库；产业企业库", "对应 demo 中 INDUSTRY_RESEARCH_TABS。", "产业链图谱"],
  ["chain_id", "产业链ID", "string", "否", "主键/外键", "产业链唯一标识，对应 INDUSTRY_CHAINS.id 或推荐产业链 id。", "chain-platform"],
  ["chain_name", "产业链名称", "string", "否", "-", "产业链展示名称。", "建筑数字化平台与工程服务链"],
  ["chain_total", "产业链节点数", "number", "否", "-", "产业链下节点或岗位数量统计。", "9"],
  ["chain_stage_summary", "产业链阶段概述", "text", "否", "-", "推荐产业链或产业图谱中的阶段摘要。", "BIM协同设计、装配式建造、智慧工地、智能检测、数字化运维"],
  ["stage_key", "产业阶段编码", "enum", "否", "upstream；midstream；downstream", "产业链图谱阶段编码。", "midstream"],
  ["stage_label", "产业阶段名称", "enum", "否", "上游；中游；下游", "产业链图谱阶段中文名称。", "中游"],
  ["stage_summary", "产业阶段说明", "text", "否", "-", "阶段功能说明。", "工程数字化服务与建造实施"],
  ["stage_stats", "阶段统计", "string", "否", "-", "阶段统计展示文本。", "5类中游产业 / 463家代表企业"],
  ["industry_node_id", "产业节点ID", "string", "否", "主键/外键", "产业节点唯一标识，对应 INDUSTRY_NODES.id 或 industrySankeyNodes.id。", "node-smart-site"],
  ["industry_node_name", "产业节点名称", "string", "否", "-", "产业节点或产业环节名称。", "智慧工地管理平台"],
  ["parent_chain_id", "所属产业链ID", "string", "否", "关联产业.chain_id", "产业节点所属产业链。", "chain-platform"],
  ["parent_chain_name", "所属产业链名称", "string", "否", "关联产业.chain_name", "产业节点所属产业链名称。", "建筑数字化平台与工程服务链"],
  ["enterprise_count", "代表企业数量", "number", "否", "-", "产业节点中的代表企业数量。", "43"],
  ["tech_fields", "技术领域", "string[]", "否", "-", "产业节点覆盖的关键技术领域，多个用中文分号分隔。", "进度质量安全；劳务物资；IoT接入"],
  ["source_node_id", "来源节点ID", "string", "否", "关联产业.industry_node_id", "产业链关系图中连线起点。", "software"],
  ["target_node_id", "目标节点ID", "string", "否", "关联产业.industry_node_id", "产业链关系图中连线终点。", "smart-site"],
  ["relation_value", "关系强度", "number", "否", "-", "产业链桑基图或关系图中的连线权重。", "19"],
  ["relation_desc", "关系说明", "text", "否", "-", "产业节点之间的上下游或协同关系说明。", "工程软件与数据服务支撑智慧工地平台实施。"],
  ["region_name", "区域名称", "string", "否", "-", "区域产业分析中的区域或产业带名称。", "辽宁沈阳-大连建筑产业带"],
  ["region_field", "区域重点方向", "string", "否", "-", "区域产业分析中的重点领域。", "智慧工地 / 装配式建造 / 工程软件"],
  ["region_desc", "区域说明", "text", "否", "-", "区域产业分析说明。", "对接区域施工总包、构件厂、工程数字化服务商。"],
  ["policy_id", "政策ID", "string", "否", "主键", "政策记录唯一标识，可由发布日期+标题 hash 生成。", "policy-mohurd-smart-city-20240913"],
  ["policy_title", "政策标题", "string", "否", "-", "产业政策库政策标题。", "智能建造试点城市建设可复制经验做法清单"],
  ["policy_publish_date", "政策发布日期", "date", "否", "yyyy-mm-dd", "政策发布日期，优先使用原文发布时间。", "2024-09-13"],
  ["policy_level", "政策层级", "enum", "否", "国家级；省级；市级；行业组织", "政策层级。", "国家级"],
  ["policy_agency", "发布机构", "string", "否", "-", "政策发布机构。", "住房和城乡建设部"],
  ["policy_source", "政策来源", "string", "否", "-", "政策来源站点或栏目。", "住房和城乡建设部公开文件"],
  ["policy_url", "政策URL", "string", "否", "-", "政策原文或来源链接。", "https://www.mohurd.gov.cn/gongkai/zhengce/zhengcefilelib/"],
  ["policy_desc", "政策描述", "text", "否", "-", "政策库中的简要描述。", "梳理试点城市在数字设计、智能生产、智能施工等方面经验。"],
  ["policy_summary", "政策摘要", "text", "否", "-", "政策信号或核心内容摘要。", "推动智能建造从单点应用转向城市级、项目级、企业级协同推进。"],
  ["policy_impact", "专业建设影响", "text", "否", "-", "政策对专业建设、课程或实训的影响。", "推动专业建设从单一软件训练转向真实工程场景联调。"],
  ["policy_tasks", "政策转化任务", "string[]", "否", "-", "可转化为专业建设任务的条目。", "试点案例库建设；智慧工地项目实训；BIM协同任务升级"],
  ["policy_keywords", "政策关键词", "string[]", "否", "-", "政策词云或标签关键词。", "智能建造；智慧工地；BIM协同"],
  ["company_id", "企业ID", "string", "否", "主键", "产业企业库企业唯一标识。", "company-glodon"],
  ["company_name", "企业名称", "string", "否", "-", "企业全称或展示名称。", "广联达科技股份有限公司"],
  ["credit_code", "统一社会信用代码", "string", "否", "-", "企业统一社会信用代码。", "91110000700024288D"],
  ["company_address", "企业地址", "string", "否", "-", "企业注册地址或办公地址。", "北京市海淀区西北旺东路10号院东区13号楼"],
  ["company_scale", "企业规模", "string", "否", "-", "企业规模或性质。", "大型上市公司"],
  ["company_products", "产品/服务", "string[]", "否", "-", "企业产品或服务，多个用中文分号分隔。", "BIM协同平台；数字造价；智慧工地平台"],
  ["company_industry", "企业所属产业", "string", "否", "关联产业.industry_node_name", "企业归属的产业节点或产业方向。", "BIM咨询与工程数字化服务产业"],
  ["recommendation_id", "推荐结果ID", "string", "否", "主键", "CMS 初始化产业链推荐记录ID。", "smart-construction"],
  ["match_score", "匹配度", "number", "否", "0-100", "专业与产业链的匹配度。", "96"],
  ["recommend_reason", "推荐理由", "text", "否", "-", "产业链推荐理由。", "与岗位能力、课程体系和区域建设项目数字化转型需求匹配度最高。"],
  ["evidence_tags", "推荐证据标签", "string[]", "否", "-", "推荐依据标签。", "BIM；智慧工地；数字化运维"],
  ["related_job_ids", "关联岗位ID", "string[]", "否", "关联基本信息.job_id", "产业节点关联岗位ID，多个用中文分号分隔。", "job-smart-site-manager；job-project-digital-manager"],
  ["related_job_names", "关联岗位名称", "string[]", "否", "关联基本信息.job_name", "产业节点关联岗位名称。", "智慧工地管理工程师；工程项目数字化管理员"],
  ["related_course_ids", "关联课程ID", "string[]", "否", "关联课程库", "产业节点或岗位映射的课程ID。", "course-smart-project；course-iot-site"],
  ["related_course_names", "关联课程名称", "string[]", "否", "关联课程库", "产业节点或岗位映射的课程名称。", "工程项目智慧管理；5G与物联网在智慧工地应用"],
  ["matched_major", "匹配专业", "string", "否", "-", "新岗位/新技术预判中匹配的主专业。", "智能建造工程"],
  ["related_majors", "相关专业", "string[]", "否", "-", "岗位或产业节点可关联的其他专业。", "智能建造工程；建筑工程技术；建筑信息模型技术"],
  ["source_url", "来源URL", "string", "否", "-", "产业数据、政策或企业来源URL。", "https://www.gov.cn/zhengce/zhengceku/2022-01/27/content_5670687.htm"],
  ["crawl_time", "爬取时间", "datetime", "否", "yyyy-mm-dd hh:mm:ss", "数据爬取时间。", "2026-06-16 12:00:00"],
  ["source_data_object", "Demo 数据对象", "string", "否", "-", "标记该字段在 demo 中对应的数据对象。", "IndustrySankeyNode / IndustryPolicyItem / IndustryCompanyItem"],
];

const industrySheet = workbook.worksheets.getOrAdd("产业");
industrySheet.reset();
industrySheet.getRange(`A1:G${industryRows.length}`).values = industryRows;

for (const sheetName of ["基本信息", "典型工作任务", "岗位能力项", "岗位画像详情", "证书详情", "企业详情", "产业"]) {
  const sheet = workbook.worksheets.getItem(sheetName);
  try {
    sheet.showGridLines = false;
  } catch {}
}

function styleFieldSheet(sheetName, rowCount) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const full = sheet.getRange(`A1:G${rowCount}`);
  full.format.wrapText = true;
  full.format.font = { name: "Microsoft YaHei", size: 10, color: "#1F2937" };
  full.format.borders = { preset: "all", style: "thin", color: "#D9E2F3" };

  sheet.getRange("A1:G1").merge();
  sheet.getRange("A2:G2").merge();
  sheet.getRange("A1:G1").format.fill = "#17365D";
  sheet.getRange("A1:G1").format.font = { name: "Microsoft YaHei", size: 14, bold: true, color: "#FFFFFF" };
  sheet.getRange("A2:G2").format.fill = "#EAF2F8";
  sheet.getRange("A2:G2").format.font = { name: "Microsoft YaHei", size: 10, color: "#17365D" };
  sheet.getRange("A4:G4").format.fill = "#4472C4";
  sheet.getRange("A4:G4").format.font = { name: "Microsoft YaHei", size: 10, bold: true, color: "#FFFFFF" };
  sheet.getRange("A4:G4").format.horizontalAlignment = "center";
  sheet.getRange(`A5:G${rowCount}`).format.fill = "#FFFFFF";
  sheet.getRange(`A5:G${rowCount}`).format.rowHeightPx = 36;
  sheet.getRange("A:A").format.columnWidthPx = 190;
  sheet.getRange("B:B").format.columnWidthPx = 150;
  sheet.getRange("C:C").format.columnWidthPx = 100;
  sheet.getRange("D:D").format.columnWidthPx = 80;
  sheet.getRange("E:E").format.columnWidthPx = 190;
  sheet.getRange("F:F").format.columnWidthPx = 360;
  sheet.getRange("G:G").format.columnWidthPx = 260;
  sheet.freezePanes.freezeRows(4);
}

styleFieldSheet("产业", industryRows.length);

for (const [sheetName, config] of Object.entries(extraSheetRows)) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const rowCount = Number(config.start.match(/G(\d+)$/)?.[1] ?? 1);
  sheet.getRange(config.start).format.fill = "#F8FBFF";
  sheet.getRange(config.start).format.font = { name: "Microsoft YaHei", size: 10, color: "#1F2937" };
  sheet.getRange(config.start).format.rowHeightPx = 36;
  sheet.getRange("A:G").format.wrapText = true;
  sheet.getRange("F:F").format.columnWidthPx = 360;
  sheet.getRange("G:G").format.columnWidthPx = 260;
  sheet.getRange(`A${rowCount}:G${rowCount}`).format.borders = { preset: "bottom", style: "thin", color: "#B4C6E7" };
}

await fs.mkdir(outputDir, { recursive: true });

for (const sheetName of ["基本信息", "典型工作任务", "岗位能力项", "岗位画像详情", "证书详情", "企业详情", "产业"]) {
  const renderRange = sheetName === "产业" ? "A1:G64" : "A1:G40";
  const image = await workbook.render({ sheetName, range: renderRange, scale: 1 });
  await fs.writeFile(`${outputDir}/${sheetName}.png`, Buffer.from(await image.arrayBuffer()));
}

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const industryCheck = await workbook.inspect({
  kind: "table",
  range: "产业!A1:G64",
  include: "values,formulas",
  tableMaxRows: 70,
  tableMaxCols: 8,
});
console.log(industryCheck.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
await output.save(rootOutputPath);
console.log(`saved=${outputPath}`);
console.log(`updated=${rootOutputPath}`);
