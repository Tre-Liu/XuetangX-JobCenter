import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const dir = new URL(".", import.meta.url);
const [relations, statuses, unmatched, nodes, metrics] = await Promise.all([
  fs.readFile(new URL("relations.json", dir), "utf8").then(JSON.parse),
  fs.readFile(new URL("job_status.json", dir), "utf8").then(JSON.parse),
  fs.readFile(new URL("unmatched.json", dir), "utf8").then(JSON.parse),
  fs.readFile(new URL("industry_nodes.json", dir), "utf8").then(JSON.parse),
  fs.readFile(new URL("metrics.json", dir), "utf8").then(JSON.parse),
]);
console.log("stage: sources loaded", { relations: relations.length, statuses: statuses.length, unmatched: unmatched.length, nodes: nodes.length });

const workbook = Workbook.create();
const summary = workbook.worksheets.add("说明与统计");
const jobStatus = workbook.worksheets.add("岗位匹配状态");
const detail = workbook.worksheets.add("关系明细");
const noMatch = workbook.worksheets.add("未匹配岗位");
const dictionary = workbook.worksheets.add("产业环节字典");
const rules = workbook.worksheets.add("规则说明");

const navy = "#17365D";
const blue = "#2F75B5";
const lightBlue = "#D9EAF7";
const paleBlue = "#EEF5FB";
const green = "#548235";
const lightGreen = "#E2F0D9";
const amber = "#BF8F00";
const lightAmber = "#FFF2CC";
const red = "#C00000";
const lightRed = "#FCE4D6";
const gray = "#666666";
const lightGray = "#F2F2F2";
const border = "#D9E2F3";

const styleTitle = range => {
  range.format = {
    fill: navy,
    font: { bold: true, color: "#FFFFFF", size: 18 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
};

const styleHeader = range => {
  range.format = {
    fill: blue,
    font: { bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "inside", style: "thin", color: border },
  };
  range.format.rowHeight = 30;
};

const setWidths = (sheet, widths) => {
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 1, 1).format.columnWidth = width;
  });
};

const addDataSheet = (sheet, headers, rows, tableName, widths) => {
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  sheet.getRangeByIndexes(0, 0, 1, headers.length).values = [headers];
  if (rows.length) sheet.getRangeByIndexes(1, 0, rows.length, headers.length).values = rows;
  styleHeader(sheet.getRangeByIndexes(0, 0, 1, headers.length));
  const used = sheet.getRangeByIndexes(0, 0, Math.max(rows.length + 1, 1), headers.length);
  used.format.verticalAlignment = "center";
  if (rows.length) {
    const table = sheet.tables.add(used.address, true, tableName);
    table.style = "TableStyleMedium2";
    table.showFilterButton = true;
  }
  setWidths(sheet, widths);
  return used;
};

// 说明与统计
summary.showGridLines = false;
summary.getRange("A1:H2").merge();
summary.getRange("A1").values = [["岗位—产业环节匹配结果"]];
styleTitle(summary.getRange("A1:H2"));
summary.getRange("A3:H3").merge();
summary.getRange("A3").values = [["基于岗位名称的可审计多对多匹配；允许一个岗位对应多个产业环节，也允许无匹配。"]];
summary.getRange("A3:H3").format = { fill: paleBlue, font: { color: navy, italic: true }, verticalAlignment: "center" };

summary.getRange("A5:H5").values = [["岗位总数", "已匹配岗位", "未匹配岗位", "关系明细数", "多环节岗位", "跨产业链岗位", "自动匹配关系", "需复核关系"]];
styleHeader(summary.getRange("A5:H5"));
summary.getRange("A6:H6").formulas = [[
  `=COUNTA('岗位匹配状态'!$A$2:$A$${statuses.length + 1})`,
  `=COUNTIF('岗位匹配状态'!$C$2:$C$${statuses.length + 1},"已匹配")`,
  `=COUNTIF('岗位匹配状态'!$C$2:$C$${statuses.length + 1},"未匹配")`,
  `=COUNTA('关系明细'!$A$2:$A$${relations.length + 1})`,
  `=COUNTIF('岗位匹配状态'!$D$2:$D$${statuses.length + 1},">1")`,
  `=COUNTIF('岗位匹配状态'!$E$2:$E$${statuses.length + 1},">1")`,
  `=COUNTIF('关系明细'!$L$2:$L$${relations.length + 1},"自动匹配")`,
  `=COUNTIF('关系明细'!$L$2:$L$${relations.length + 1},"<>自动匹配")`,
]];
summary.getRange("A6:H6").format = {
  fill: "#FFFFFF",
  font: { bold: true, color: navy, size: 15 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  numberFormat: "#,##0",
  borders: { preset: "outside", style: "thin", color: border },
};
summary.getRange("A6:H6").format.rowHeight = 34;

summary.getRange("A8:H8").merge();
summary.getRange("A8").values = [["重要说明：岗位源表只有岗位名称，没有岗位职责、企业行业或产品字段。只有“产业环节名称/简称命中且岗位功能与环节阶段一致”的关系标为自动匹配；其余均保留为需复核，不强行补齐未匹配岗位。"]];
summary.getRange("A8:H8").format = { fill: lightAmber, font: { color: "#7F6000", bold: true }, wrapText: true, verticalAlignment: "center" };
summary.getRange("A8:H8").format.rowHeight = 52;

summary.getRange("A10:D10").values = [["产业链", "关系数", "自动匹配关系", "需复核关系"]];
styleHeader(summary.getRange("A10:D10"));
const chains = metrics.byChain.map(([name]) => name).sort((a, b) => a.localeCompare(b, "zh-CN"));
summary.getRangeByIndexes(10, 0, chains.length, 1).values = chains.map(x => [x]);
for (let i = 0; i < chains.length; i++) {
  const row = i + 11;
  summary.getRange(`B${row}:D${row}`).formulas = [[
    `=COUNTIF('关系明细'!$F$2:$F$${relations.length + 1},A${row})`,
    `=COUNTIFS('关系明细'!$F$2:$F$${relations.length + 1},A${row},'关系明细'!$L$2:$L$${relations.length + 1},"自动匹配")`,
    `=B${row}-C${row}`,
  ]];
}
summary.getRange(`B11:D${10 + chains.length}`).format.numberFormat = "#,##0";
summary.getRange(`A10:D${10 + chains.length}`).format.borders = { preset: "inside", style: "thin", color: border };

summary.getRange("F10:H10").values = [["项目", "内容", "备注"]];
styleHeader(summary.getRange("F10:H10"));
summary.getRange("F11:H16").values = [
  ["岗位源文件", "岗位.csv", "/Users/liuhongzhe/Desktop/岗位产业环节匹配/岗位.csv"],
  ["产业环节源文件", "产业环节.xlsx", "/Users/liuhongzhe/Desktop/岗位产业环节匹配/产业环节.xlsx"],
  ["匹配粒度", "岗位ID—产业环节ID", "关系明细一行代表一条关系"],
  ["多对多", "支持", "同一岗位可出现多行关系"],
  ["无匹配", "保留", "详见“未匹配岗位”工作表"],
  ["生成日期", "2026-08-25", "Asia/Shanghai"],
];
summary.getRange("F11:H16").format = { wrapText: true, verticalAlignment: "top", borders: { preset: "inside", style: "thin", color: border } };
summary.freezePanes.freezeRows(3);
setWidths(summary, [34, 15, 15, 15, 15, 20, 28, 58]);
console.log("stage: summary built");

// 岗位匹配状态
const statusHeaders = ["岗位ID", "岗位名称", "匹配状态", "关系数", "产业链数", "匹配产业链", "匹配产业环节", "复核状态"];
const statusValues = statuses.map(r => [r.job_id, r.cleaned_position, r.match_status, r.relation_count, r.matched_chain_count, r.matched_chains, r.matched_industry_stages, r.review_status]);
addDataSheet(jobStatus, statusHeaders, statusValues, "JobMatchStatusTable", [14, 34, 12, 10, 10, 42, 70, 24]);
jobStatus.getRange(`A2:A${statuses.length + 1}`).format.numberFormat = "@";
jobStatus.getRange(`D2:E${statuses.length + 1}`).format.numberFormat = "#,##0";
jobStatus.getRange(`C2:C${statuses.length + 1}`).conditionalFormats.add("containsText", { text: "未匹配", format: { fill: lightRed, font: { color: red } } });
jobStatus.getRange(`H2:H${statuses.length + 1}`).conditionalFormats.add("containsText", { text: "需复核", format: { fill: lightAmber, font: { color: "#7F6000" } } });
jobStatus.getRange(`H2:H${statuses.length + 1}`).conditionalFormats.add("containsText", { text: "自动匹配", format: { fill: lightGreen, font: { color: green } } });
console.log("stage: job status built");

// 关系明细
const relationHeaders = ["岗位ID", "岗位名称", "产业环节ID", "产业环节来源ID", "产业链ID", "产业链名称", "产业环节名称", "上中下游", "匹配方式", "命中词", "匹配依据", "复核状态", "推断阶段", "阶段依据"];
const relationValues = relations.map(r => [r.job_id, r.cleaned_position, r.industry_node_id, r.industry_source_id, r.chain_id, r.chain_name, r.chain_node_name, r.chain_node_stage, r.match_type, r.matched_keyword, r.match_basis, r.review_status, r.inferred_stage, r.stage_basis]);
addDataSheet(detail, relationHeaders, relationValues, "JobIndustryRelationTable", [14, 34, 14, 16, 12, 34, 32, 11, 24, 18, 62, 30, 12, 34]);
detail.freezePanes.freezeColumns(2);
detail.getRange(`A2:E${relations.length + 1}`).format.numberFormat = "@";
detail.getRange(`L2:L${relations.length + 1}`).conditionalFormats.add("containsText", { text: "自动匹配", format: { fill: lightGreen, font: { color: green } } });
detail.getRange(`L2:L${relations.length + 1}`).conditionalFormats.add("containsText", { text: "需复核", format: { fill: lightAmber, font: { color: "#7F6000" } } });
console.log("stage: relation detail built");

// 未匹配岗位
const unmatchedHeaders = ["岗位ID", "岗位名称", "未匹配原因"];
const unmatchedValues = unmatched.map(r => [r.job_id, r.cleaned_position, r.unmatched_reason]);
addDataSheet(noMatch, unmatchedHeaders, unmatchedValues, "UnmatchedJobsTable", [14, 40, 96]);
noMatch.getRange(`A2:A${unmatched.length + 1}`).format.numberFormat = "@";
noMatch.getRange(`C2:C${unmatched.length + 1}`).format.font = { color: gray };
console.log("stage: unmatched built");

// 产业环节字典
const dictHeaders = ["产业环节ID", "来源ID", "产业链ID", "产业链名称", "产业环节名称", "上中下游", "类别", "来源"];
const dictValues = nodes.map(n => [String(n.id), n.source_id == null ? "" : String(n.source_id), String(n.chain_id), n.chain_name, n.chain_node_name, n.chain_node_stage, n.category ?? "", n.source ?? ""]);
addDataSheet(dictionary, dictHeaders, dictValues, "IndustryNodeDictionaryTable", [14, 14, 12, 34, 34, 11, 16, 16]);
dictionary.getRange(`A2:C${nodes.length + 1}`).format.numberFormat = "@";
console.log("stage: dictionary built");

// 规则说明
rules.showGridLines = false;
rules.getRange("A1:F2").merge();
rules.getRange("A1").values = [["匹配规则与复核口径"]];
styleTitle(rules.getRange("A1:F2"));
rules.getRange("A4:F4").values = [["规则层级", "规则名称", "适用条件", "输出方式", "复核状态", "说明"]];
styleHeader(rules.getRange("A4:F4"));
const ruleRows = [
  ["1", "产业环节名称/简称命中", "岗位名称包含产业环节完整名称、斜杠拆分名称或明确缩写（如 GPU、MES、ERP）", "关联到对应产业环节ID；同名节点按岗位功能词选择上中下游", "阶段一致且不跨链时可自动匹配，否则需复核", "GIS 未作为电力设备缩写直接命中，需有组合电器/设备/开关语境"],
  ["2", "领域词+岗位功能", "岗位名称出现产业领域词，但没有命中具体产业环节名称", "关联到对应产业链的上游/中游/下游总括环节", "全部需复核", "例如“新材料测试工程师”映射到新材料产业链的中游总括环节"],
  ["3", "岗位功能判定", "研发、设计、开发等→上游；生产、测试、安装等→中游；销售、运营、服务等→下游", "用于选择同名环节阶段", "不作为独立匹配依据", "只在已经命中产业词后使用"],
  ["4", "阶段不足", "岗位名称有产业词，但没有岗位功能词", "保留同一概念下可选阶段或三个总括环节", "需复核（阶段未明）", "不擅自猜测上中下游"],
  ["5", "无匹配", "未命中产业环节名称、简称或产业领域词", "不生成关系明细", "无明确产业词", "源数据缺少职责和所属行业，不能可靠补齐"],
  ["6", "一岗多链", "岗位名称同时出现多个产业领域，或同名环节存在于多条产业链", "保留多条关系", "需复核（跨链）", "例如“通信软件研发工程师”可同时涉及通信基础设施与软件产业链"],
];
rules.getRange("A5:F10").values = ruleRows;
rules.getRange("A5:F10").format = { wrapText: true, verticalAlignment: "top", borders: { preset: "inside", style: "thin", color: border } };
rules.getRange("A12:C12").values = [["阶段", "岗位功能词示例", "用途"]];
styleHeader(rules.getRange("A12:C12"));
rules.getRange("A13:C15").values = [
  ["上游", "研发、研究、算法、架构、设计、开发、科研、原料、种植等", "选择上游环节"],
  ["中游", "生产、制造、工艺、操作、装配、测试、调试、维修、安装、施工等", "选择中游环节"],
  ["下游", "销售、市场、运营、客服、售后、实施、服务、采购、物流、教师等", "选择下游环节"],
];
rules.getRange("A13:C15").format = { wrapText: true, borders: { preset: "inside", style: "thin", color: border } };
rules.getRange("A17:C17").values = [["结果状态", "含义", "建议"]];
styleHeader(rules.getRange("A17:C17"));
rules.getRange("A18:C20").values = [
  ["自动匹配", "产业环节名称/明确简称命中，且岗位功能与上中下游一致、无跨链同名歧义", "可优先使用，仍建议抽样"],
  ["需复核", "领域词推断、阶段不足、跨链同名或阶段不一致", "结合岗位职责、企业行业和产品后确认"],
  ["未匹配", "岗位名称无明确产业信息", "补充职责/企业行业后再匹配，不建议按通用职能强行归类"],
];
rules.getRange("A18:C20").format = { wrapText: true, borders: { preset: "inside", style: "thin", color: border } };
rules.getRange("A5:F10").format.rowHeight = 56;
rules.getRange("A13:C15").format.rowHeight = 42;
rules.getRange("A18:C20").format.rowHeight = 46;
rules.freezePanes.freezeRows(4);
setWidths(rules, [12, 30, 58, 38, 34, 68]);
console.log("stage: rules built");

// 统一正文样式与行高
for (const sheet of [jobStatus, detail, noMatch, dictionary]) {
  const used = sheet.getUsedRange();
  used.format.font = { name: "Arial", size: 10 };
  used.format.rowHeight = 20;
  styleHeader(used.getRow(0));
}
summary.getUsedRange().format.font = { name: "Arial", size: 10 };
rules.getUsedRange().format.font = { name: "Arial", size: 10 };
styleTitle(summary.getRange("A1:H2"));
styleTitle(rules.getRange("A1:F2"));
styleHeader(summary.getRange("A5:H5"));
styleHeader(summary.getRange("A10:D10"));
styleHeader(summary.getRange("F10:H10"));
styleHeader(rules.getRange("A4:F4"));
styleHeader(rules.getRange("A12:C12"));
styleHeader(rules.getRange("A17:C17"));
console.log("stage: final formatting built");

const previewDir = new URL("previews/", dir);
await fs.mkdir(previewDir, { recursive: true });
console.log("stage: preview directory ready");
const renderSpecs = [
  ["说明与统计", "A1:H30"],
  ["岗位匹配状态", "A1:H28"],
  ["关系明细", "A1:N24"],
  ["未匹配岗位", "A1:C28"],
  ["产业环节字典", "A1:H26"],
  ["规则说明", "A1:F20"],
];
if (process.env.SKIP_VERIFIED_PREVIEWS !== "1") {
  for (const [sheetName, range] of renderSpecs) {
    console.log("stage: rendering", sheetName);
    const preview = await workbook.render({ sheetName, range, scale: 1.2, format: "png" });
    await fs.writeFile(new URL(`${sheetName}.png`, previewDir), new Uint8Array(await preview.arrayBuffer()));
  }
  console.log("stage: previews rendered");

  console.log("=== INSPECT SUMMARY ===");
  console.log((await workbook.inspect({ kind: "table", range: "说明与统计!A1:H30", include: "values,formulas", tableMaxRows: 30, tableMaxCols: 8, maxChars: 12000 })).ndjson);
  console.log("=== INSPECT DETAIL SAMPLE ===");
  console.log((await workbook.inspect({ kind: "table", range: "关系明细!A1:N18", include: "values,formulas", tableMaxRows: 18, tableMaxCols: 14, maxChars: 10000 })).ndjson);
  console.log("=== FORMULA ERRORS ===");
  console.log((await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan", maxChars: 6000 })).ndjson);
} else {
  console.log("stage: reused verified previews and formula inspection from prior identical build");
}

const output = await SpreadsheetFile.exportXlsx(workbook);
console.log("stage: xlsx exported in memory");
const outputPath = fileURLToPath(new URL("岗位产业环节匹配结果.xlsx", dir));
await output.save(outputPath);
console.log(JSON.stringify({ output: outputPath, sheets: renderSpecs.map(x => x[0]), metrics }, null, 2));
