import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const taskDir = path.resolve(".tmp/typical-task-extraction");
const dataDir = path.join(taskDir, "data");
const outputDir = path.resolve("outputs/01a056b0-f9d8-7391-9ead-f2406424a741");
const previewDir = path.join(taskDir, "previews");

const loadJson = async (name) => JSON.parse(await fs.readFile(path.join(dataDir, name), "utf8"));
const [definitions, coverage, detail, gaps, sources, summary] = await Promise.all([
  loadJson("definitions.json"),
  loadJson("coverage.json"),
  loadJson("detail.json"),
  loadJson("gaps.json"),
  loadJson("sources.json"),
  loadJson("dataset_summary.json"),
]);

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const workbook = Workbook.create();
const COLORS = {
  navy: "#17324D",
  teal: "#0F766E",
  tealLight: "#DFF3EF",
  blueLight: "#E8F0FE",
  amber: "#D97706",
  amberLight: "#FEF3C7",
  red: "#B91C1C",
  redLight: "#FEE2E2",
  gray: "#64748B",
  grayLight: "#F1F5F9",
  border: "#CBD5E1",
  white: "#FFFFFF",
};

function colName(index) {
  let value = index + 1;
  let out = "";
  while (value > 0) {
    value -= 1;
    out = String.fromCharCode(65 + (value % 26)) + out;
    value = Math.floor(value / 26);
  }
  return out;
}

function writeObjects(sheet, startRow, objects, columns, tableName) {
  const headers = columns.map((column) => column.header);
  const rows = objects.map((object) => columns.map((column) => object[column.key] ?? ""));
  const matrix = [headers, ...rows];
  const endRow = startRow + matrix.length - 1;
  const endCol = columns.length - 1;
  const range = sheet.getRangeByIndexes(startRow - 1, 0, matrix.length, columns.length);
  range.values = matrix;
  const headerRange = sheet.getRangeByIndexes(startRow - 1, 0, 1, columns.length);
  headerRange.format = {
    fill: COLORS.teal,
    font: { bold: true, color: COLORS.white, name: "Microsoft YaHei" },
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "outside", style: "thin", color: COLORS.teal },
  };
  headerRange.format.rowHeight = 30;
  if (rows.length) {
    const table = sheet.tables.add(`A${startRow}:${colName(endCol)}${endRow}`, true, tableName);
    table.style = "TableStyleMedium2";
    table.showBandedRows = true;
    table.showFilterButton = true;
  }
  return { endRow, endCol, range };
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRange(`${colName(index)}:${colName(index)}`).format.columnWidth = width;
  });
}

function baseSheet(sheet) {
  sheet.showGridLines = false;
  sheet.getRange("A:V").format.font = { name: "Microsoft YaHei", size: 10, color: "#1E293B" };
}

// 1. 说明与规范
const guide = workbook.worksheets.add("说明与规范");
baseSheet(guide);
guide.getRange("A1:F1").merge();
guide.getRange("A1").values = [["岗位典型工作任务与原子能力项提取结果"]];
guide.getRange("A1:F1").format = {
  fill: COLORS.navy,
  font: { bold: true, color: COLORS.white, size: 18, name: "Microsoft YaHei" },
  horizontalAlignment: "left",
  verticalAlignment: "center",
};
guide.getRange("A1:F1").format.rowHeight = 42;
guide.getRange("A2:F2").merge();
guide.getRange("A2").values = [["口径：只对高置信岗位生成明细；需复核与未匹配岗位不自动套用任务，防止跨行业误配。"]];
guide.getRange("A2:F2").format = { fill: COLORS.tealLight, font: { color: COLORS.teal, italic: true }, wrapText: true };
guide.getRange("A2:F2").format.rowHeight = 32;

const metrics = [
  ["指标", "数量", "说明"],
  ["岗位总数", null, "岗位.csv 全量唯一岗位"],
  ["已匹配岗位", null, "进入能力项明细"],
  ["需复核岗位", null, "保留候选，不自动生成能力"],
  ["未匹配岗位", null, "现有结构化人培证据不足"],
  ["能力项明细", null, "原子能力项行数"],
  ["知识项", null, "直接证据或标明需复核的间接推导"],
  ["技能项", null, "可观察的动词+对象/结果"],
  ["素养项", null, "职业行为倾向与价值要求"],
  ["典型任务", null, "岗位ID+任务ID去重"],
  ["能力类别缺口", null, "未强行补造，列入缺口表"],
  ["独立人培文件", null, "排除 macOS 资源叉文件"],
  ["识别到结构化任务表", null, "不等同于其余文档没有任务"],
];
guide.getRange(`A4:C${3 + metrics.length}`).values = metrics;
guide.getRange("A4:C4").format = { fill: COLORS.teal, font: { bold: true, color: COLORS.white }, wrapText: true };
guide.getRange("A5:A16").format.font = { bold: true, color: COLORS.navy };
guide.getRange("A4:C16").format.borders = { preset: "inside", style: "thin", color: COLORS.border };
guide.getRange("B5:B16").values = [
  [summary["岗位总数"]],
  [summary["已匹配岗位"]],
  [summary["需复核岗位"]],
  [summary["未匹配岗位"]],
  [summary["能力明细行"]],
  [summary["知识项"]],
  [summary["技能项"]],
  [summary["素养项"]],
  [summary["典型任务数"]],
  [summary["能力类别缺口"]],
  [summary["人培文件数（排除macOS资源叉）"]],
  [summary["识别到结构化任务表的独立文件"]],
];
guide.getRange("B5:B16").format = { font: { bold: true, size: 12, color: COLORS.teal }, numberFormat: "#,##0" };

const defStart = 19;
guide.getRange(`A${defStart - 1}:C${defStart - 1}`).merge();
guide.getRange(`A${defStart - 1}`).values = [["定义与规范"]];
guide.getRange(`A${defStart - 1}:C${defStart - 1}`).format = { fill: COLORS.navy, font: { bold: true, color: COLORS.white, size: 13 } };
const defResult = writeObjects(
  guide,
  defStart,
  definitions,
  [
    { key: "主题", header: "主题" },
    { key: "规范", header: "定义/规范" },
    { key: "来源", header: "依据" },
  ],
  "DefinitionsTable",
);
guide.getRange(`A${defStart + 1}:C${defResult.endRow}`).format.wrapText = true;
guide.getRange(`A${defStart + 1}:C${defResult.endRow}`).format.verticalAlignment = "top";
guide.getRange(`A${defStart + 1}:C${defResult.endRow}`).format.rowHeight = 72;
setWidths(guide, [22, 78, 45, 3, 3, 3]);
guide.freezePanes.freezeRows(2);

// 2. 能力项明细
const detailSheet = workbook.worksheets.add("能力项明细");
baseSheet(detailSheet);
const detailColumns = [
  ["岗位ID", "岗位ID"], ["岗位", "岗位"], ["来源岗位", "来源岗位"], ["任务ID", "任务ID"],
  ["典型工作任务", "典型工作任务"], ["能力项ID", "能力项ID"], ["能力类别", "能力类别"], ["原子能力项", "原子能力项"],
  ["学校", "学校"], ["专业群", "专业群"], ["专业代码", "专业代码"], ["专业", "专业"],
  ["参考人培文件", "参考人培文件"], ["来源定位", "来源定位"], ["来源路径", "来源路径"], ["SHA-256", "SHA-256"],
  ["岗位匹配分", "岗位匹配分"], ["抽取方式", "抽取方式"], ["证据等级", "证据等级"], ["原始能力表述", "原始能力表述"],
  ["支撑课程", "支撑课程"],
].map(([key, header]) => ({ key, header }));
const detailResult = writeObjects(detailSheet, 1, detail, detailColumns, "CompetencyDetailTable");
detailSheet.freezePanes.freezeRows(1);
detailSheet.freezePanes.freezeColumns(2);
detailSheet.getRange(`A2:U${detailResult.endRow}`).format.verticalAlignment = "top";
detailSheet.getRange(`B2:U${detailResult.endRow}`).format.wrapText = true;
detailSheet.getRange(`Q2:Q${detailResult.endRow}`).format.numberFormat = "0.0000";
detailSheet.getRange(`G2:G${detailResult.endRow}`).conditionalFormats.add("containsText", { text: "知识", format: { fill: COLORS.blueLight, font: { bold: true, color: "#1D4ED8" } } });
detailSheet.getRange(`G2:G${detailResult.endRow}`).conditionalFormats.add("containsText", { text: "技能", format: { fill: COLORS.tealLight, font: { bold: true, color: COLORS.teal } } });
detailSheet.getRange(`G2:G${detailResult.endRow}`).conditionalFormats.add("containsText", { text: "素养", format: { fill: COLORS.amberLight, font: { bold: true, color: COLORS.amber } } });
detailSheet.getRange(`S2:S${detailResult.endRow}`).conditionalFormats.add("containsText", { text: "需复核", format: { fill: COLORS.amberLight, font: { color: COLORS.amber } } });
setWidths(detailSheet, [12, 26, 26, 21, 45, 21, 10, 45, 24, 24, 12, 22, 34, 18, 55, 28, 12, 22, 22, 55, 40]);

// 3. 岗位覆盖
const coverageSheet = workbook.worksheets.add("岗位覆盖");
baseSheet(coverageSheet);
const coverageColumns = Object.keys(coverage[0]).map((key) => ({ key, header: key }));
const coverageResult = writeObjects(coverageSheet, 1, coverage, coverageColumns, "PositionCoverageTable");
coverageSheet.freezePanes.freezeRows(1);
coverageSheet.freezePanes.freezeColumns(2);
coverageSheet.getRange(`H2:J${coverageResult.endRow}`).format.numberFormat = "0.0000";
coverageSheet.getRange(`C2:C${coverageResult.endRow}`).conditionalFormats.add("containsText", { text: "已匹配", format: { fill: COLORS.tealLight, font: { bold: true, color: COLORS.teal } } });
coverageSheet.getRange(`C2:C${coverageResult.endRow}`).conditionalFormats.add("containsText", { text: "需复核", format: { fill: COLORS.amberLight, font: { bold: true, color: COLORS.amber } } });
coverageSheet.getRange(`C2:C${coverageResult.endRow}`).conditionalFormats.add("containsText", { text: "未匹配", format: { fill: COLORS.grayLight, font: { color: COLORS.gray } } });
coverageSheet.getRange(`B2:K${coverageResult.endRow}`).format.wrapText = true;
setWidths(coverageSheet, [12, 30, 12, 30, 14, 24, 34, 13, 13, 11, 48]);

// 4. 能力类别缺口
const gapSheet = workbook.worksheets.add("能力类别缺口");
baseSheet(gapSheet);
const gapColumns = Object.keys(gaps[0] || { 岗位ID: "", 岗位: "", 任务ID: "", 典型工作任务: "", 缺少类别: "", 处理建议: "" }).map((key) => ({ key, header: key }));
const gapResult = writeObjects(gapSheet, 1, gaps, gapColumns, "CompetencyGapTable");
gapSheet.freezePanes.freezeRows(1);
gapSheet.freezePanes.freezeColumns(2);
if (gaps.length) {
  gapSheet.getRange(`E2:E${gapResult.endRow}`).format = { fill: COLORS.redLight, font: { bold: true, color: COLORS.red } };
  gapSheet.getRange(`B2:F${gapResult.endRow}`).format.wrapText = true;
}
setWidths(gapSheet, [12, 28, 21, 48, 16, 58]);

// 5. 人培来源审计
const sourceSheet = workbook.worksheets.add("人培来源审计");
baseSheet(sourceSheet);
const sourceColumns = Object.keys(sources[0]).map((key) => ({ key, header: key }));
const sourceResult = writeObjects(sourceSheet, 1, sources, sourceColumns, "SourceAuditTable");
sourceSheet.freezePanes.freezeRows(1);
sourceSheet.getRange(`B2:G${sourceResult.endRow}`).format.wrapText = true;
sourceSheet.getRange(`F2:F${sourceResult.endRow}`).conditionalFormats.add("containsText", { text: "已抽取", format: { fill: COLORS.tealLight, font: { color: COLORS.teal } } });
sourceSheet.getRange(`F2:F${sourceResult.endRow}`).conditionalFormats.add("containsText", { text: "未识别", format: { fill: COLORS.grayLight, font: { color: COLORS.gray } } });
setWidths(sourceSheet, [10, 78, 28, 12, 13, 24, 45]);

// Compact verification before export.
const summaryInspect = await workbook.inspect({
  kind: "table",
  range: "说明与规范!A1:C28",
  include: "values,formulas",
  tableMaxRows: 30,
  tableMaxCols: 6,
  maxChars: 8000,
});
const detailInspect = await workbook.inspect({
  kind: "table",
  range: "能力项明细!A1:U12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 21,
  maxChars: 10000,
});
const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 200 },
  summary: "final formula error scan",
  maxChars: 5000,
});
console.log("SUMMARY_INSPECT\n" + summaryInspect.ndjson);
console.log("DETAIL_INSPECT\n" + detailInspect.ndjson);
console.log("FORMULA_ERRORS\n" + formulaErrors.ndjson);

const previews = [
  ["说明与规范", "A1:C28", "01-guide.png"],
  ["能力项明细", "A1:U18", "02-detail.png"],
  ["岗位覆盖", "A1:K28", "03-coverage.png"],
  ["能力类别缺口", "A1:F24", "04-gaps.png"],
  ["人培来源审计", "A1:G24", "05-sources.png"],
];
for (const [sheetName, range, fileName] of previews) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(previewDir, fileName), new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
const outputPath = path.join(outputDir, "岗位典型工作任务与原子能力项.xlsx");
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, rows: { coverage: coverage.length, detail: detail.length, gaps: gaps.length, sources: sources.length } }, null, 2));
