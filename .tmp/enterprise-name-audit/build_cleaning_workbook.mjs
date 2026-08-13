import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workDir = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/.tmp/enterprise-name-audit";
const outputDir = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/enterprise-name-cleaning";
const outputPath = path.join(outputDir, "产业链企业名称清洗处理结果.xlsx");
const data = JSON.parse(await fs.readFile(path.join(workDir, "enterprise-cleaning-results.json"), "utf8"));

const workbook = Workbook.create();
const summary = workbook.worksheets.add("处理汇总");
const details = workbook.worksheets.add("异常企业明细");
const conflicts = workbook.worksheets.add("名称冲突");
const rules = workbook.worksheets.add("规则说明");

const palette = {
  navy: "#163A5F",
  blue: "#2D6A9F",
  paleBlue: "#EAF3F8",
  red: "#C62828",
  paleRed: "#FDECEC",
  orange: "#B45309",
  paleOrange: "#FFF2DD",
  yellow: "#9A6700",
  paleYellow: "#FFF8D6",
  green: "#237A45",
  paleGreen: "#E7F5EC",
  gray: "#52606D",
  paleGray: "#F4F6F8",
  border: "#D7DEE5",
  white: "#FFFFFF",
};

function preserveLongNumericText(value) {
  const text = value == null ? "" : String(value);
  return /^\d{16,}$/.test(text) ? `\u200B${text}` : text;
}

function setTitle(sheet, range, text) {
  const titleRange = sheet.getRange(range);
  titleRange.merge();
  titleRange.values = [[text]];
  titleRange.format = {
    fill: palette.navy,
    font: { bold: true, color: palette.white, size: 18 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
  titleRange.format.rowHeight = 34;
}

function styleHeader(range) {
  range.format = {
    fill: palette.blue,
    font: { bold: true, color: palette.white },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: palette.border },
  };
  range.format.rowHeight = 30;
}

function setColumnWidths(sheet, widths) {
  for (const [column, width] of Object.entries(widths)) {
    sheet.getRange(`${column}:${column}`).format.columnWidth = width;
  }
}

function actionMeaning(action) {
  return {
    QUARANTINE: "名称强异常，停止展示并按信用代码回查",
    HIDE: "非正常经营主体，保留历史但默认隐藏",
    REVIEW: "需要人工核验后才能作为可信企业主数据",
    KEEP_CLEANED: "采用建议名称，保留原值及拆分信息",
  }[action] ?? "";
}

setTitle(summary, "A1:H1", "产业链企业名称清洗处理结果");
summary.getRange("A2:H2").merge();
summary.getRange("A2:H2").values = [[
  "依据《产业链企业名称数据清洗规则》执行｜主体粒度：统一社会信用代码优先｜源文件只读，未做任何覆盖",
]];
summary.getRange("A2:H2").format = { fill: palette.paleBlue, font: { color: palette.gray }, wrapText: true };
summary.getRange("A2:H2").format.rowHeight = 28;

const metadata = data.metadata;
summary.getRange("A4:H4").values = [[
  "扫描企业主表", metadata.primary_workbooks,
  "输入明细记录", metadata.input_records,
  "归一后企业主体", metadata.unique_entities,
  "问题企业主体", metadata.issue_entities,
]];
summary.getRange("A4:H4").format = {
  fill: palette.paleGray,
  font: { bold: true, color: palette.navy },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  borders: { preset: "all", style: "thin", color: palette.border },
};
summary.getRange("B4:D4").format.numberFormat = "#,##0";
summary.getRange("F4:H4").format.numberFormat = "#,##0";
summary.getRange("A4:H4").format.rowHeight = 30;

summary.getRange("A6:D6").values = [["处理动作", "问题主体数", "占问题主体", "处理含义"]];
styleHeader(summary.getRange("A6:D6"));
const actionOrder = ["QUARANTINE", "HIDE", "REVIEW", "KEEP_CLEANED"];
for (let i = 0; i < actionOrder.length; i += 1) {
  const row = 7 + i;
  const action = actionOrder[i];
  summary.getRange(`A${row}:D${row}`).values = [[action, null, null, actionMeaning(action)]];
  summary.getRange(`B${row}`).formulas = [[`=COUNTIF('异常企业明细'!$B$2:$B$${data.issues.length + 1},A${row})`]];
  summary.getRange(`C${row}`).formulas = [[`=B${row}/$H$4`]];
  summary.getRange(`B${row}`).format.numberFormat = "#,##0";
  summary.getRange(`C${row}`).format.numberFormat = "0.0%";
}

summary.getRange("F6:H6").values = [["严重级别", "问题主体数", "占问题主体"]];
styleHeader(summary.getRange("F6:H6"));
const severityOrder = ["Critical", "High", "Medium"];
for (let i = 0; i < severityOrder.length; i += 1) {
  const row = 7 + i;
  summary.getRange(`F${row}:H${row}`).values = [[severityOrder[i], null, null]];
  summary.getRange(`G${row}`).formulas = [[`=COUNTIF('异常企业明细'!$C$2:$C$${data.issues.length + 1},F${row})`]];
  summary.getRange(`H${row}`).formulas = [[`=G${row}/$H$4`]];
  summary.getRange(`G${row}`).format.numberFormat = "#,##0";
  summary.getRange(`H${row}`).format.numberFormat = "0.0%";
}

summary.getRange("A13:D13").values = [["异常原因代码", "问题主体数", "占问题主体", "说明"]];
styleHeader(summary.getRange("A13:D13"));
const reasonEntries = Object.entries(data.reason_counts).sort((a, b) => b[1] - a[1]);
for (let i = 0; i < reasonEntries.length; i += 1) {
  const row = 14 + i;
  const [code, reasonCount] = reasonEntries[i];
  const label = data.issues.find((item) => item.reason_codes.includes(code))?.reason_labels[
    data.issues.find((item) => item.reason_codes.includes(code))?.reason_codes.indexOf(code)
  ] ?? "";
  summary.getRange(`A${row}:D${row}`).values = [[code, reasonCount, null, label]];
  summary.getRange(`C${row}`).formulas = [[`=B${row}/$H$4`]];
  summary.getRange(`B${row}`).format.numberFormat = "#,##0";
  summary.getRange(`C${row}`).format.numberFormat = "0.0%";
}
const noteRow = 15 + reasonEntries.length;
summary.getRange(`A${noteRow}:H${noteRow + 2}`).merge();
summary.getRange(`A${noteRow}:H${noteRow + 2}`).values = [[
  "使用说明：异常类型可能重叠，因此原因数量不可直接相加。QUARANTINE 为名称强异常；HIDE 为非正常经营主体；REVIEW 为需要人工核验；KEEP_CLEANED 为可自动拆分或规范化后继续使用。",
]];
summary.getRange(`A${noteRow}:H${noteRow + 2}`).format = {
  fill: palette.paleYellow,
  font: { color: palette.gray },
  wrapText: true,
  verticalAlignment: "center",
};
summary.showGridLines = false;
summary.freezePanes.freezeRows(2);
setColumnWidths(summary, { A: 30, B: 14, C: 14, D: 48, E: 4, F: 18, G: 14, H: 14 });

const detailHeaders = [
  "序号", "处理动作", "严重级别", "名称质量", "原始企业名称", "建议标准名称", "统一社会信用代码",
  "原始登记状态", "状态分组", "曾用名", "名称状态备注", "异常原因代码", "异常原因说明", "建议处理结果",
  "人工复核", "来源数量", "首个来源文件", "来源工作表", "来源行号", "全部来源", "同主体全部名称", "企业归并键",
];
details.getRange(`A1:V1`).values = [detailHeaders];
styleHeader(details.getRange("A1:V1"));

const detailRows = data.issues.map((item, index) => {
  const firstSource = item.sources[0] ?? { file: "", sheet: "", row: "" };
  const allSources = item.sources.map((source) => `${source.file}#${source.sheet}#${source.row}`).join("；");
  return [
    index + 1,
    item.record_action,
    item.severity,
    item.name_quality_status,
    item.all_names[0] ?? "",
    item.company_name_clean ?? "",
    preserveLongNumericText(item.credit_code),
    item.registration_statuses.join("；"),
    item.registration_status_group,
    item.former_company_names.join("；"),
    item.name_status_note ?? "",
    item.reason_codes.join("；"),
    item.reason_labels.join("；"),
    item.processing_result,
    item.manual_review_required ? "是" : "否",
    item.source_count,
    firstSource.file,
    firstSource.sheet,
    firstSource.row,
    allSources,
    item.all_names.join("；"),
    item.entity_key,
  ];
});

const detailChunk = 4000;
for (let start = 0; start < detailRows.length; start += detailChunk) {
  const rows = detailRows.slice(start, start + detailChunk);
  details.getRangeByIndexes(start + 1, 0, rows.length, detailHeaders.length).values = rows;
}
const detailLastRow = detailRows.length + 1;
details.getRange(`A2:A${detailLastRow}`).format.numberFormat = "#,##0";
details.getRange(`G2:G${detailLastRow}`).format.numberFormat = "@";
details.getRange(`S2:S${detailLastRow}`).format.numberFormat = "0";
details.getRange(`P2:P${detailLastRow}`).format.numberFormat = "#,##0";
details.getRange(`A2:V${detailLastRow}`).format.verticalAlignment = "top";
details.getRange(`E2:F${detailLastRow}`).format.wrapText = true;
details.getRange(`L2:N${detailLastRow}`).format.wrapText = true;
details.getRange(`T2:V${detailLastRow}`).format.wrapText = true;
details.tables.add(`A1:V${detailLastRow}`, true, "EnterpriseIssuesTable");
details.freezePanes.freezeRows(1);
details.freezePanes.freezeColumns(4);
details.showGridLines = false;
setColumnWidths(details, {
  A: 9, B: 16, C: 12, D: 13, E: 38, F: 34, G: 22, H: 22, I: 13, J: 30, K: 18,
  L: 34, M: 42, N: 42, O: 11, P: 10, Q: 38, R: 18, S: 10, T: 55, U: 48, V: 28,
});

details.getRange(`B2:B${detailLastRow}`).conditionalFormats.add("containsText", { text: "QUARANTINE", format: { fill: palette.paleRed, font: { color: palette.red, bold: true } } });
details.getRange(`B2:B${detailLastRow}`).conditionalFormats.add("containsText", { text: "HIDE", format: { fill: palette.paleOrange, font: { color: palette.orange, bold: true } } });
details.getRange(`B2:B${detailLastRow}`).conditionalFormats.add("containsText", { text: "REVIEW", format: { fill: palette.paleYellow, font: { color: palette.yellow, bold: true } } });
details.getRange(`B2:B${detailLastRow}`).conditionalFormats.add("containsText", { text: "KEEP_CLEANED", format: { fill: palette.paleGreen, font: { color: palette.green, bold: true } } });
details.getRange(`C2:C${detailLastRow}`).conditionalFormats.add("containsText", { text: "Critical", format: { fill: palette.paleRed, font: { color: palette.red, bold: true } } });
details.getRange(`C2:C${detailLastRow}`).conditionalFormats.add("containsText", { text: "High", format: { fill: palette.paleOrange, font: { color: palette.orange, bold: true } } });

const conflictHeaders = [
  "序号", "统一社会信用代码", "建议标准名称", "同主体全部名称", "登记状态", "处理动作", "严重级别",
  "异常原因", "建议处理结果", "来源数量", "全部来源",
];
conflicts.getRange("A1:K1").values = [conflictHeaders];
styleHeader(conflicts.getRange("A1:K1"));
const conflictRows = data.conflicts.map((item, index) => [
  index + 1,
  preserveLongNumericText(item.credit_code),
  item.company_name_clean ?? "",
  item.all_names.join("；"),
  item.registration_statuses.join("；"),
  item.record_action,
  item.severity,
  item.reason_labels.join("；"),
  item.processing_result,
  item.source_count,
  item.sources.map((source) => `${source.file}#${source.sheet}#${source.row}`).join("；"),
]);
if (conflictRows.length > 0) {
  conflicts.getRangeByIndexes(1, 0, conflictRows.length, conflictHeaders.length).values = conflictRows;
}
const conflictLastRow = conflictRows.length + 1;
conflicts.getRange(`B2:B${conflictLastRow}`).format.numberFormat = "@";
conflicts.getRange(`C2:K${conflictLastRow}`).format.wrapText = true;
conflicts.tables.add(`A1:K${conflictLastRow}`, true, "EnterpriseNameConflictsTable");
conflicts.freezePanes.freezeRows(1);
conflicts.freezePanes.freezeColumns(2);
conflicts.showGridLines = false;
setColumnWidths(conflicts, { A: 9, B: 22, C: 34, D: 60, E: 24, F: 16, G: 12, H: 40, I: 42, J: 10, K: 60 });

setTitle(rules, "A1:E1", "企业名称清洗规则摘要");
rules.getRange("A3:E3").values = [["优先级", "规则类别", "识别条件", "处理动作", "说明"]];
styleHeader(rules.getRange("A3:E3"));
const ruleRows = [
  [1, "司法或登记无效名称", "名称含法院/登记机关认定不适宜或停止使用", "QUARANTINE", "名称置空，保留信用代码并回查现行名称"],
  [2, "代码或数字误填名称", "名称整体为18位信用代码、15位注册号或纯数字", "QUARANTINE", "代码可回填信用代码字段，不作为展示名称"],
  [3, "空值或占位符", "空值、-、未知、N/A等", "QUARANTINE", "保留原值和来源，等待补录"],
  [4, "电话/网址/邮箱/乱码", "名称整体为联系方式或包含明显乱码", "QUARANTINE", "停止展示，按其他字段回查"],
  [5, "非正常登记状态", "注销、吊销、撤销、迁出、责令关闭、歇业等", "HIDE", "保留历史主体，默认不进入有效企业库"],
  [6, "曾用名混入", "名称末尾含(曾用名:...)说明", "KEEP_CLEANED", "拆分当前名称与曾用名"],
  [7, "状态说明混入名称", "名称末尾含破产清算、已除名等", "REVIEW", "拆出状态说明；与登记状态冲突时人工复核"],
  [8, "登记状态缺失", "状态为空、-、其他或无法映射", "REVIEW", "不得直接视为正常经营"],
  [9, "同代码多名称", "同一信用代码对应多个标准名称", "REVIEW", "结合核准日期和最新来源确认现行名称"],
  [10, "弱名称异常", "纯外文、名称过短、缺少常见组织形式", "REVIEW", "仅标记复核，避免误删合法主体"],
  [11, "主体归并", "有效统一社会信用代码相同", "MERGE", "企业主表保留一个主体，产业链关系单独保留"],
];
rules.getRangeByIndexes(3, 0, ruleRows.length, 5).values = ruleRows;
rules.getRange(`A4:E${ruleRows.length + 3}`).format.wrapText = true;
rules.getRange(`A4:A${ruleRows.length + 3}`).format.numberFormat = "0";
rules.getRange(`A${ruleRows.length + 6}:E${ruleRows.length + 8}`).merge();
rules.getRange(`A${ruleRows.length + 6}:E${ruleRows.length + 8}`).values = [[
  `完整规则文档：${metadata.rule_document}\n原始数据目录：${metadata.source_root}\n说明：本工作簿为建议处理结果，不覆盖源文件；人工复核完成后应回写治理结论。`,
]];
rules.getRange(`A${ruleRows.length + 6}:E${ruleRows.length + 8}`).format = {
  fill: palette.paleBlue,
  font: { color: palette.gray },
  wrapText: true,
  verticalAlignment: "center",
};
rules.showGridLines = false;
rules.freezePanes.freezeRows(3);
setColumnWidths(rules, { A: 10, B: 26, C: 54, D: 20, E: 56 });

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

const summaryInspect = await workbook.inspect({
  kind: "table",
  sheetId: "处理汇总",
  range: `A1:H${noteRow + 2}`,
  include: "values,formulas",
  tableMaxRows: noteRow + 2,
  tableMaxCols: 8,
  maxChars: 16000,
});
await fs.writeFile(path.join(workDir, "summary-inspect.ndjson"), summaryInspect.ndjson ?? "", "utf8");

const detailInspect = await workbook.inspect({
  kind: "table",
  sheetId: "异常企业明细",
  range: "A1:V12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 22,
  maxChars: 12000,
});
await fs.writeFile(path.join(workDir, "detail-inspect.ndjson"), detailInspect.ndjson ?? "", "utf8");

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
await fs.writeFile(path.join(workDir, "formula-errors.ndjson"), errors.ndjson ?? "", "utf8");

for (const [sheetName, range, filename] of [
  ["处理汇总", `A1:H${noteRow + 2}`, "preview-summary.png"],
  ["异常企业明细", "A1:V28", "preview-details.png"],
  ["名称冲突", "A1:K24", "preview-conflicts.png"],
  ["规则说明", `A1:E${ruleRows.length + 8}`, "preview-rules.png"],
]) {
  const preview = await workbook.render({ sheetName, range, scale: 1.2, format: "png" });
  await fs.writeFile(path.join(workDir, filename), new Uint8Array(await preview.arrayBuffer()));
}

console.log(JSON.stringify({
  outputPath,
  detailRows: detailRows.length,
  conflictRows: conflictRows.length,
  summaryRows: noteRow + 2,
}, null, 2));
