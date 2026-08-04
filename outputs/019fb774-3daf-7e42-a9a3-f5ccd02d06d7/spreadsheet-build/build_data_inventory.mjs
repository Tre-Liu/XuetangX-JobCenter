import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workspaceRoot = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程";
const outputDir = path.join(
  workspaceRoot,
  "outputs/019fb774-3daf-7e42-a9a3-f5ccd02d06d7",
);
const outputPath = path.join(outputDir, "专业建设数据资产统计.xlsx");

const workbook = Workbook.create();
const summary = workbook.worksheets.add("数据统计");
const methodology = workbook.worksheets.add("来源与口径");

const colors = {
  navy: "#123B5D",
  teal: "#0F766E",
  tealLight: "#DDF4F0",
  blueLight: "#E8F1F8",
  ink: "#1F2937",
  muted: "#5B6472",
  line: "#D7DEE7",
  white: "#FFFFFF",
  green: "#DCFCE7",
  greenText: "#166534",
  amber: "#FEF3C7",
  amberText: "#92400E",
  orange: "#FFEDD5",
  orangeText: "#9A3412",
};

function styleTitle(sheet, title, subtitle, lastColumn) {
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${lastColumn}1`).format = {
    fill: colors.navy,
    font: {
      bold: true,
      color: colors.white,
      size: 18,
      name: "Microsoft YaHei",
    },
    verticalAlignment: "center",
    horizontalAlignment: "left",
  };
  sheet.getRange(`A1:${lastColumn}1`).format.rowHeight = 34;

  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange(`A2:${lastColumn}2`).format = {
    fill: colors.blueLight,
    font: {
      color: colors.muted,
      size: 10,
      name: "Microsoft YaHei",
    },
    verticalAlignment: "center",
    horizontalAlignment: "left",
  };
  sheet.getRange(`A2:${lastColumn}2`).format.rowHeight = 24;
}

styleTitle(
  summary,
  "专业建设数据资产统计",
  "按主键去重或有效唯一记录口径统计｜统计日期：2026-07-31",
  "H",
);
summary.showGridLines = false;
summary.freezePanes.freezeRows(7);

summary.getRange("A4:H4").values = [[
  "数据维度数",
  null,
  "招聘有效率",
  null,
  "岗位关联率",
  null,
  "专业关联率",
  null,
]];
summary.getRange("B4").formulas = [["=COUNTA(B8:B15)"]];
summary.getRange("D4").formulas = [["='来源与口径'!B5/'来源与口径'!B4"]];
summary.getRange("F4").formulas = [["='来源与口径'!B9/'来源与口径'!B8"]];
summary.getRange("H4").formulas = [["='来源与口径'!B11/'来源与口径'!B10"]];

for (const cell of ["A4", "C4", "E4", "G4"]) {
  summary.getRange(cell).format = {
    fill: colors.teal,
    font: { bold: true, color: colors.white, size: 10, name: "Microsoft YaHei" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.teal },
  };
}
for (const cell of ["B4", "D4", "F4", "H4"]) {
  summary.getRange(cell).format = {
    fill: colors.tealLight,
    font: { bold: true, color: colors.navy, size: 14, name: "Microsoft YaHei" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.line },
  };
}
summary.getRange("A4:H4").format.rowHeight = 32;
summary.getRange("D4:H4").setNumberFormat("0.0%");
summary.getRange("B4").setNumberFormat("#,##0");

const summaryRows = [
  [1, "产业链", 19, "条", "企查查产业链企业数据＋本项目公开资料标准化", "按标准产业链名称去重", "源产业链129条归并为19条", "已核验"],
  [2, "产业环节", 57, "个", "企查查产业链节点数据＋中商产业研究院图谱", "按标准阶段环节ID去重", "另有10链精细节点1,133条", "已核验"],
  [3, "岗位", 1356, "条", "内部岗位库job_position＋人社部职业分类体系", "按岗位编码去重", "唯一岗位名称992个；已关联产业节点645条", "已核验"],
  [4, "招聘信息", 239149, "条", "智联招聘、前程无忧；全量库另含BOSS直聘等", "有效且唯一的招聘记录", "当前2014—2016批次；其余来源多为匿名编号或推测映射", "进行中"],
  [5, "专业", 2142, "个", "教育部本科专业目录（2025）＋职业教育专业目录（2021）", "按专业编码去重", "本科840个、职教1,302个；已关联产业链682个", "已核验"],
  [6, "行业", 1955, "个", "国家统计局／GB/T 4754—2017《国民经济行业分类》", "按国民经济行业代码去重", "源表1,956行，含1条重复代码", "已核验"],
  [7, "企业", 120029, "家", "招聘平台企业名称样本＋A股清单＋东方财富公司资料接口", "有效招聘记录中的企业名称字符串去重", "尚未全部完成统一社会信用代码级实体归一；另有A股主数据5,190家", "待归一"],
  [8, "职业", 92, "个", "人社部《职业分类大典》＋技能人才评价工作网", "按岗位主职业编码去重", "为当前1,356条岗位覆盖范围，不代表国家职业目录全量", "已核验"],
];

summary.getRange("A7:H15").values = [
  ["序号", "数据维度", "数量", "单位", "具体来源", "统计口径", "补充说明", "状态"],
  ...summaryRows,
];
const summaryTable = summary.tables.add("A7:H15", true, "DataAssetSummary");
summaryTable.style = "TableStyleMedium2";
summaryTable.showBandedRows = true;
summaryTable.showFilterButton = true;

summary.getRange("A7:H7").format = {
  fill: colors.navy,
  font: { bold: true, color: colors.white, size: 10, name: "Microsoft YaHei" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
summary.getRange("A8:A15").format.horizontalAlignment = "center";
summary.getRange("B8:B15").format.font = {
  bold: true,
  color: colors.ink,
  name: "Microsoft YaHei",
};
summary.getRange("C8:C15").setNumberFormat("#,##0");
summary.getRange("C8:D15").format.horizontalAlignment = "center";
summary.getRange("E8:G15").format = {
  wrapText: true,
  verticalAlignment: "center",
  font: { color: colors.ink, size: 10, name: "Microsoft YaHei" },
};
summary.getRange("H8:H15").format.horizontalAlignment = "center";
summary.getRange("A8:H15").format.rowHeight = 42;

summary.getRange("H8:H15").conditionalFormats.add("containsText", {
  text: "已核验",
  format: { fill: colors.green, font: { bold: true, color: colors.greenText } },
});
summary.getRange("H8:H15").conditionalFormats.add("containsText", {
  text: "进行中",
  format: { fill: colors.amber, font: { bold: true, color: colors.amberText } },
});
summary.getRange("H8:H15").conditionalFormats.add("containsText", {
  text: "待归一",
  format: { fill: colors.orange, font: { bold: true, color: colors.orangeText } },
});

summary.mergeCells("A17:H17");
summary.getRange("A17").values = [["重要说明"]];
summary.getRange("A17:H17").format = {
  fill: colors.navy,
  font: { bold: true, color: colors.white, size: 11, name: "Microsoft YaHei" },
  verticalAlignment: "center",
};
summary.mergeCells("A18:H18");
summary.getRange("A18").values = [[
  "1. 招聘信息当前只统计已完成清洗的2014—2016年批次，2017—2025年尚未计入当前成果。",
]];
summary.mergeCells("A19:H20");
summary.getRange("A19").values = [[
  "2. 企业120,029家为企业名称字符串去重结果，适合作为“招聘企业样本”口径；对外表述为企业主数据时，建议使用已整理的5,190家A股上市公司清单，或完成统一社会信用代码级实体归一后再更新。",
]];
summary.mergeCells("A21:H22");
summary.getRange("A21").values = [[
  "3. 招聘来源映射中，平台4=智联招聘、平台2=前程无忧、平台75=BOSS直聘为直接确认。当前239,149条仅覆盖2014—2016年，含智联招聘和前程无忧；BOSS直聘记录从2018年开始，未计入当前数量。58同城、智通直聘、赶集网、大街网等只能标注为推测来源。",
]];
summary.getRange("A18:H22").format = {
  fill: "#F8FAFC",
  font: { color: colors.muted, size: 10, name: "Microsoft YaHei" },
  wrapText: true,
  verticalAlignment: "center",
  borders: { preset: "outside", style: "thin", color: colors.line },
};
summary.getRange("A18:H18").format.rowHeight = 28;
summary.getRange("A19:H20").format.rowHeight = 40;
summary.getRange("A21:H22").format.rowHeight = 44;

summary.getRange("A1:A22").format.columnWidth = 10;
summary.getRange("B1:B22").format.columnWidth = 14;
summary.getRange("C1:C22").format.columnWidth = 13;
summary.getRange("D1:D22").format.columnWidth = 8;
summary.getRange("E1:E22").format.columnWidth = 36;
summary.getRange("F1:F22").format.columnWidth = 29;
summary.getRange("G1:G22").format.columnWidth = 44;
summary.getRange("H1:H22").format.columnWidth = 12;

styleTitle(
  methodology,
  "来源与统计口径",
  "关键参数、源文件位置及统计边界，可用于后续复核和更新",
  "F",
);
methodology.showGridLines = false;
methodology.freezePanes.freezeRows(3);

methodology.getRange("A3:C11").values = [
  ["关键参数", "数值", "说明"],
  ["招聘输入记录", 240034, "当前已处理批次输入总量"],
  ["招聘有效唯一记录", 239149, "排除重复及无效记录后的数量"],
  ["招聘重复记录", 53, "重复记录数量"],
  ["招聘无效记录", 832, "字段缺失或不满足有效性规则的记录"],
  ["岗位总数", 1356, "按position_id统计"],
  ["岗位已关联产业节点", 645, "存在确定产业节点关联的岗位"],
  ["专业总数", 2142, "本科840个＋职业教育1,302个"],
  ["专业已关联产业链", 682, "本科190个＋职业教育492个"],
];
const parameterTable = methodology.tables.add("A3:C11", true, "KeyParameters");
parameterTable.style = "TableStyleMedium2";
methodology.getRange("A3:C3").format = {
  fill: colors.navy,
  font: { bold: true, color: colors.white, name: "Microsoft YaHei" },
  horizontalAlignment: "center",
};
methodology.getRange("B4:B11").setNumberFormat("#,##0");
methodology.getRange("A4:C11").format.rowHeight = 26;

const sources = [
  ["产业链", "企查查产业链企业数据", "第三方企业信息平台／原始文件名可识别", "https://www.qcc.com/", "output/industry-chain-standardization/industry_chain_standardization_summary.csv", "原始文件夹大量保留“产业链企查查”标识；19条为本项目二次标准化结果"],
  ["产业环节", "企查查产业链节点数据", "第三方企业信息平台／原始文件名可识别", "https://www.qcc.com/", "output/industry-chain-stage-nodes/industry_chain_stage_nodes.csv", "提供节点和企业样本基础"],
  [null, "中商产业研究院产业链图谱", "第三方行业研究参考", "https://www.askci.com/", "V1.0需求（2026.6.11）/官方数据/10个产业链节点汇总.xlsx", "用于新能源汽车、低空经济、人工智能等链条的上中下游结构校准"],
  ["岗位", "内部岗位库job_position（source_module=industry_catalog）", "内部主数据", "无公开URL", "outputs/019f7e5b-0d35-7c91-a1ff-e290f4069b8a/source_rows.json", "1,356条岗位主数据；招聘记录再归一到该岗位库"],
  [null, "人社部职业分类体系", "官方职业标准／辅助映射", "https://www.mohrss.gov.cn/SYrlzyhshbzb/ztzl/zyflzd/zyfldg/", "V1.0需求（2026.6.11）/官方数据/DW_专业建设数据模型设计.xlsx", "为岗位补充国家职业编码和职业名称"],
  ["招聘信息", "智联招聘（平台4）", "直接确认", "https://www.zhaopin.com/", "V1.0需求（2026.6.11）/官方数据/平台来源映射深挖版_2014-2025.xlsx", "当前2014—2016有效记录中9,572条"],
  [null, "前程无忧51job（平台2）", "直接确认", "https://www.51job.com/", "V1.0需求（2026.6.11）/官方数据/平台来源映射深挖版_2014-2025.xlsx", "当前2014—2016有效记录中6,519条"],
  [null, "BOSS直聘（平台75）", "直接确认／全量原始库", "https://www.zhipin.com/", "V1.0需求（2026.6.11）/官方数据/平台来源映射深挖版_2014-2025.xlsx", "全量库覆盖2018—2025年；不在当前2014—2016统计数量内"],
  [null, "58同城、智通直聘、赶集网、大街网、应届生求职网等", "较高可信推断，非官方编号字典", "https://www.58.com/job.shtml；https://www.job5156.com/；https://www.ganji.com/zhaopin/；https://www.dajie.com/", "V1.0需求（2026.6.11）/官方数据/平台来源映射深挖版_2014-2025.xlsx", "必须保留“推测”标记；其余来源继续使用平台X匿名编号"],
  ["专业", "教育部《普通高等学校本科专业目录（2025年）》", "教育部官方文件", "http://www.moe.gov.cn/srcsite/A08/moe_1034/s4930/202504/t20250422_1188239.html", "V1.0需求（2026.6.11）/官方数据/教育部官方专业目录-高等教育与职业教育-20260612.xlsx", "普通本科840个"],
  [null, "教育部《职业教育专业目录（2021年）》", "教育部官方文件", "https://www.moe.gov.cn/srcsite/A07/moe_953/202103/t20210319_521135.html", "V1.0需求（2026.6.11）/官方数据/教育部官方专业目录-高等教育与职业教育-20260612.xlsx", "中职、高职专科、职业本科合计1,302个"],
  ["行业", "《国民经济行业分类》（GB/T 4754—2017）", "国家标准／国家统计局引用", "https://www.stats.gov.cn/sj/tjbz/gjtjbz/", "V1.0需求（2026.6.11）/官方数据/国民经济行业分类_GBT4754-2017.xlsx", "按行业代码去重后1,955个"],
  ["企业", "智联招聘、前程无忧等招聘来源中的企业名称", "招聘企业样本", "https://www.zhaopin.com/；https://www.51job.com/", ".worktrees/recruitment-position-matching/outputs/recruitment_position_matching/v1/normalized_jobs", "120,029家为企业名称字符串去重，尚未完成工商主体级归一"],
  [null, "A股上市公司公开清单＋东方财富公开公司资料接口", "公开证券市场数据／公司资料接口", "https://www.eastmoney.com/", "V1.0需求（2026.6.11）/官方数据/中国A股上市公司清单xlsx.xlsx", "5,190家A股企业；统一社会信用代码来自东方财富REG_NUM字段"],
  ["职业", "人社部《中华人民共和国职业分类大典》专题", "人社部官方专题", "https://www.mohrss.gov.cn/SYrlzyhshbzb/ztzl/zyflzd/zyfldg/", "outputs/019f7e5b-0d35-7c91-a1ff-e290f4069b8a/source_rows.json", "当前岗位覆盖92个国家职业编码"],
  [null, "技能人才评价工作网职业分类系统", "官方职业分类查询平台", "https://www.osta.org.cn/career", "V1.0需求（2026.6.11）/官方数据/DW_专业建设数据模型设计.xlsx", "用于职业名称、分类层级和职业编码校核"],
];

methodology.getRange("A13:F29").values = [
  ["数据维度", "具体来源（机构／平台）", "来源级别", "来源链接／证据", "内部整理文件", "备注"],
  ...sources,
];
methodology.getRange("A13:F13").format = {
  fill: colors.navy,
  font: { bold: true, color: colors.white, name: "Microsoft YaHei" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
methodology.getRange("A14:F29").format = {
  wrapText: true,
  verticalAlignment: "center",
  font: { color: colors.ink, size: 10, name: "Microsoft YaHei" },
  borders: { preset: "all", style: "thin", color: colors.line },
};
for (const range of ["A14:F14", "A17:F18", "A23:F24", "A26:F27"]) {
  methodology.getRange(range).format.fill = colors.blueLight;
}
for (const range of ["A15:F16", "A19:F22", "A25:F25", "A28:F29"]) {
  methodology.getRange(range).format.fill = colors.white;
}
for (const range of ["A15:A16", "A17:A18", "A19:A22", "A23:A24", "A26:A27", "A28:A29"]) {
  methodology.mergeCells(range);
  methodology.getRange(range).format = {
    horizontalAlignment: "center",
    verticalAlignment: "center",
    font: { bold: true, color: colors.navy, size: 10, name: "Microsoft YaHei" },
  };
}
for (const cell of ["A14", "A25"]) {
  methodology.getRange(cell).format = {
    horizontalAlignment: "center",
    verticalAlignment: "center",
    font: { bold: true, color: colors.navy, size: 10, name: "Microsoft YaHei" },
  };
}
methodology.getRange("A14:F29").format.rowHeight = 54;
methodology.getRange("A1:A29").format.columnWidth = 13;
methodology.getRange("B1:B29").format.columnWidth = 42;
methodology.getRange("C1:C29").format.columnWidth = 28;
methodology.getRange("D1:D29").format.columnWidth = 52;
methodology.getRange("E1:E29").format.columnWidth = 62;
methodology.getRange("F1:F29").format.columnWidth = 48;

const summaryInspect = await workbook.inspect({
  kind: "table",
  range: "数据统计!A1:H22",
  include: "values,formulas",
  tableMaxRows: 22,
  tableMaxCols: 8,
  maxChars: 12000,
});
console.log("SUMMARY_INSPECT");
console.log(summaryInspect.ndjson);

const methodologyInspect = await workbook.inspect({
  kind: "table",
  range: "来源与口径!A1:F29",
  include: "values,formulas",
  tableMaxRows: 29,
  tableMaxCols: 6,
  maxChars: 12000,
});
console.log("METHODOLOGY_INSPECT");
console.log(methodologyInspect.ndjson);

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log("FORMULA_ERRORS");
console.log(formulaErrors.ndjson);

await fs.mkdir(outputDir, { recursive: true });
const summaryPreview = await workbook.render({
  sheetName: "数据统计",
  range: "A1:H22",
  scale: 1.5,
  format: "png",
});
await fs.writeFile(
  path.join(outputDir, "preview-data-inventory.png"),
  new Uint8Array(await summaryPreview.arrayBuffer()),
);

const methodologyPreview = await workbook.render({
  sheetName: "来源与口径",
  range: "A1:F29",
  scale: 1.0,
  format: "png",
});
await fs.writeFile(
  path.join(outputDir, "preview-data-methodology.png"),
  new Uint8Array(await methodologyPreview.arrayBuffer()),
);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`OUTPUT=${outputPath}`);
