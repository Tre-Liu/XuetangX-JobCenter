import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "/Users/liuhongzhe/Documents/专业建设/岗位详情字段爬取模板.xlsx";
const outputDir = "/Users/liuhongzhe/Documents/专业建设/outputs/update-job-template";
const outputPath = `${outputDir}/岗位详情字段爬取模板_更新版.xlsx`;

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const sheetMeta = {
  基本信息: {
    rows: 36,
    title: "基本信息字段说明",
    desc: "岗位建设中心岗位详情页字段，兼容岗位画像弹窗进入后的岗位主数据；不包含岗位图片。",
    source:
      "岗位详情页/招聘平台公开岗位；企业招聘官网；国家职业分类/职业标准；demo: JobCard、JobDetail、PortraitJobDetail",
  },
  典型工作任务: {
    rows: 18,
    title: "典型工作任务字段说明",
    desc: "岗位下属典型工作任务字段，一岗多任务；需保留与能力项的多对多关系。",
    source:
      "招聘 JD 工作职责；企业岗位说明书；职业标准/人才需求报告；demo: JobTask",
  },
  岗位能力项: {
    rows: 19,
    title: "岗位能力项字段说明",
    desc: "岗位能力项字段；能力类别统一为知识、技能、素养，并通过关联任务编码建立任务-能力关系。",
    source:
      "招聘 JD 任职要求；国家职业标准/1+X 标准；人才培养方案；demo: JobAbility、PortraitAbilityGroup",
  },
  岗位画像详情: {
    rows: 39,
    title: "岗位画像详情字段说明",
    desc: "岗位数据调研-岗位画像分析中，点击岗位卡片弹窗展示的画像详情字段。",
    source:
      "岗位画像分析模块；招聘平台公开岗位；企业招聘官网；行业岗位研究报告；demo: PortraitJobDetail",
  },
  证书详情: {
    rows: 21,
    title: "证书详情字段说明",
    desc: "岗位画像详情弹窗中点击推荐职业资格证书后展示的证书详情字段。",
    source:
      "证书颁发机构官网；职业技能等级证书/1+X 官方平台；培训评价组织公开信息；demo: CertificateDetail",
  },
  企业详情: {
    rows: 35,
    title: "企业详情字段说明",
    desc: "岗位画像详情弹窗中点击相关企业后展示的企业详情字段。",
    source:
      "企业官网；国家企业信用信息公示系统；中商情报网；灵犀数据；企业招聘官网；demo: CompanyDetail、IndustryCompanyItem",
  },
  产业: {
    rows: 61,
    title: "产业字段说明",
    desc: "根据当前 demo 的产业调研、岗位建设中心和 CMS 产业初始化数据整理；覆盖产业链、产业节点、区域、政策、企业、推荐结果及岗位/课程映射字段。",
    source:
      "中商情报网；灵犀数据；国家/省市政策库；住建部/发改委/工信部等官方来源；企业官网/信用公示；demo: IndustrySankeyNode、IndustryPolicyItem、IndustryCompanyItem",
  },
};

const sourceByField = {
  source_url: "原始页面 URL，由爬虫落库时写入。",
  crawl_time: "爬虫采集时间，由采集任务自动写入。",
  source_data_object: "demo 代码映射字段，由 src/mock 和 src/app 数据对象整理。",
  policy_url: "政策原文 URL，优先使用中国政府网、部委/省市官网。",
  policy_title: "中国政府网、住建部、发改委、工信部、省市政策库。",
  policy_publish_date: "政策原文发布日期，优先官方来源。",
  policy_level: "政策原文发布层级；中国政府网、部委/省市官网。",
  policy_agency: "政策原文发布机构；中国政府网、部委/省市官网。",
  policy_source: "政策来源站点或栏目。",
  policy_desc: "政策原文、政策解读、产业研究摘要。",
  policy_summary: "政策原文、权威媒体解读、产业研究摘要。",
  policy_impact: "政策原文、行业研究报告、专业建设分析。",
  policy_tasks: "政策原文、专业建设任务拆解。",
  policy_keywords: "政策原文关键词、产业研究关键词。",
  company_id: "企业库主键；企业官网、信用公示、中商情报网、灵犀数据。",
  company_name: "企业官网、国家企业信用信息公示系统、中商情报网、灵犀数据。",
  company_short_name: "企业官网、招聘官网、产业企业库。",
  company_full_name: "国家企业信用信息公示系统、企业官网。",
  credit_code: "国家企业信用信息公示系统、企查查/天眼查等工商信息源。",
  unified_social_credit_code: "国家企业信用信息公示系统、企查查/天眼查等工商信息源。",
  company_address: "国家企业信用信息公示系统、企业官网、灵犀数据。",
  company_scale: "企业官网、年报、中商情报网、灵犀数据、招聘平台。",
  company_products: "企业官网、产品页、年报、中商情报网、灵犀数据。",
  product_services: "企业官网、产品页、年报、中商情报网、灵犀数据。",
  company_industry: "中商情报网、灵犀数据、产业企业库、企业官网。",
  industry_name: "中商情报网、灵犀数据、产业链分类资料。",
  industry_chain: "中商情报网、灵犀数据、官方产业政策/行业研究、demo 产业链数据。",
  industry_chain_id: "demo 产业链配置或爬虫归一化后的产业链主键。",
  industry_node: "中商情报网、灵犀数据、产业链图谱、demo 产业节点数据。",
  industry_node_id: "demo 产业节点配置或爬虫归一化后的产业节点主键。",
  industry_node_name: "中商情报网、灵犀数据、产业链图谱。",
  chain_id: "中商情报网、灵犀数据、demo 产业链配置。",
  chain_name: "中商情报网、灵犀数据、产业链图谱、官方产业研究。",
  chain_total: "产业链图谱统计；中商情报网、灵犀数据或 demo 统计。",
  chain_stage_summary: "中商情报网、灵犀数据、产业链研究报告、demo 推荐结果。",
  stage_key: "demo 产业链图谱配置。",
  stage_label: "产业链图谱阶段划分；中商情报网、灵犀数据、demo 配置。",
  stage_summary: "产业链图谱、行业研究报告、demo 配置。",
  stage_stats: "中商情报网、灵犀数据、产业链企业统计、demo 统计。",
  parent_chain_id: "产业节点归属关系；中商情报网、灵犀数据、demo 配置。",
  parent_chain_name: "产业节点归属关系；中商情报网、灵犀数据、demo 配置。",
  enterprise_count: "中商情报网、灵犀数据、产业企业库统计。",
  tech_fields: "中商情报网、灵犀数据、行业报告、企业产品页。",
  source_node_id: "demo 桑基图/产业关系图配置。",
  target_node_id: "demo 桑基图/产业关系图配置。",
  relation_value: "demo 桑基图权重或产业链研究量化关系。",
  relation_desc: "产业链研究报告、中商情报网、灵犀数据、人工归纳。",
  region_name: "区域产业报告、地方政府/园区官网、中商情报网、灵犀数据。",
  region_field: "区域产业报告、地方政府/园区官网、中商情报网、灵犀数据。",
  region_desc: "区域产业报告、地方政府/园区官网、中商情报网、灵犀数据。",
  recommendation_id: "CMS 初始化推荐结果，demo: IndustryResearchChainRecommendation。",
  match_score: "CMS 推荐算法结果或人工评估结果。",
  recommend_reason: "CMS 推荐结果、产业研究报告、专业建设分析。",
  evidence_tags: "CMS 推荐结果、产业链关键词、行业研究报告。",
  related_course_ids: "demo COURSE_NODES 或课程库映射。",
  related_course_names: "人才培养方案、课程库、demo COURSE_NODES。",
  matched_major: "专业目录、人才培养方案、demo 新岗位预判数据。",
  related_majors: "专业目录、人才培养方案、招聘 JD 专业要求。",
};

const sourceFor = (sheetName, fieldCode) => {
  if (sourceByField[fieldCode]) return sourceByField[fieldCode];
  if (fieldCode.includes("course")) return "人才培养方案、课程库、demo COURSE_NODES。";
  if (fieldCode.includes("policy")) return "官方政策库、部委/省市官网、权威媒体政策解读。";
  if (fieldCode.includes("company")) return "企业官网、国家企业信用信息公示系统、中商情报网、灵犀数据。";
  if (fieldCode.includes("industry") || fieldCode.includes("chain") || fieldCode.includes("stage")) {
    return "中商情报网、灵犀数据、产业链图谱、官方产业研究资料。";
  }
  if (fieldCode.includes("salary") || fieldCode.includes("demand")) {
    return "招聘平台公开岗位、企业招聘官网、行业人才需求报告。";
  }
  if (fieldCode.includes("cert")) return "证书颁发机构官网、职业技能等级证书/1+X 官方平台。";
  if (fieldCode.includes("ability")) return "招聘 JD 任职要求、职业标准、人才培养方案、demo 能力模型。";
  if (fieldCode.includes("task")) return "招聘 JD 工作职责、企业岗位说明书、职业标准、demo 任务模型。";
  if (fieldCode.includes("job") || fieldCode.includes("occupation")) {
    return "岗位详情页、招聘平台公开岗位、国家职业分类/职业标准、demo 岗位数据。";
  }
  return sheetMeta[sheetName].source;
};

for (const [sheetName, meta] of Object.entries(sheetMeta)) {
  const sheet = workbook.worksheets.getItem(sheetName);
  sheet.getRange("A1:H2").unmerge();
  sheet.getRange("A1:H1").values = [[meta.title, null, null, null, null, null, null, null]];
  sheet.getRange("A2:H2").values = [[meta.desc, null, null, null, null, null, null, null]];
  sheet.getRange("A1:H1").merge();
  sheet.getRange("A2:H2").merge();

  sheet.getRange("H4").values = [["数据来源"]];
  const fieldCodes = sheet.getRange(`A5:A${meta.rows}`).values.map((row) => row[0]);
  sheet.getRange(`H5:H${meta.rows}`).values = fieldCodes.map((fieldCode) => [fieldCode ? sourceFor(sheetName, String(fieldCode)) : null]);

  const full = sheet.getRange(`A1:H${meta.rows}`);
  full.format.wrapText = true;
  full.format.font = { name: "Microsoft YaHei", size: 10, color: "#1F2937" };
  full.format.borders = { preset: "all", style: "thin", color: "#D9E2F3" };
  sheet.getRange("A1:H1").format.fill = "#17365D";
  sheet.getRange("A1:H1").format.font = { name: "Microsoft YaHei", size: 14, bold: true, color: "#FFFFFF" };
  sheet.getRange("A2:H2").format.fill = "#EAF2F8";
  sheet.getRange("A2:H2").format.font = { name: "Microsoft YaHei", size: 10, color: "#17365D" };
  sheet.getRange("A4:H4").format.fill = "#4472C4";
  sheet.getRange("A4:H4").format.font = { name: "Microsoft YaHei", size: 10, bold: true, color: "#FFFFFF" };
  sheet.getRange("A4:H4").format.horizontalAlignment = "center";
  sheet.getRange(`A5:H${meta.rows}`).format.rowHeightPx = 38;
  sheet.getRange("H:H").format.columnWidthPx = 300;
}

await fs.mkdir(outputDir, { recursive: true });

for (const sheetName of Object.keys(sheetMeta)) {
  const renderRange = sheetName === "产业" ? "A1:H64" : "A1:H40";
  const image = await workbook.render({ sheetName, range: renderRange, scale: 1 });
  await fs.writeFile(`${outputDir}/${sheetName}-数据来源.png`, Buffer.from(await image.arrayBuffer()));
}

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const check = await workbook.inspect({
  kind: "table",
  range: "产业!A4:H12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 9,
});
console.log(check.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);
await output.save(outputPath);
console.log(`updated=${workbookPath}`);
console.log(`saved=${outputPath}`);
