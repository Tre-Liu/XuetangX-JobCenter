import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outDir = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/job-position-duplicates-20260714";
const outputPath = `${outDir}/job_position_重复岗位分析.xlsx`;
const analysis = JSON.parse(await fs.readFile(`${outDir}/analysis.json`, "utf8"));

const workbook = Workbook.create();
const summary = workbook.worksheets.add("分析摘要");
const exact = workbook.worksheets.add("同名重复组");
const details = workbook.worksheets.add("同名重复明细");
const near = workbook.worksheets.add("相似名称复核");

const colors = {
  navy: "#17365D",
  blue: "#1F4E78",
  teal: "#0F6B78",
  lightBlue: "#D9EAF7",
  green: "#D9EAD3",
  amber: "#FFF2CC",
  red: "#F4CCCC",
  gray: "#F2F2F2",
  border: "#D0D7DE",
  text: "#1F2937",
  white: "#FFFFFF",
};

function clip(value, limit = 180) {
  const s = String(value ?? "").replace(/\s+/g, " ").trim();
  return s.length > limit ? `${s.slice(0, limit)}…` : s;
}

function join(values) {
  return (values ?? []).join("；");
}

function styleTitle(sheet, rangeAddress, title) {
  const range = sheet.getRange(rangeAddress);
  range.merge();
  range.values = [[title]];
  range.format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white, size: 18 },
    verticalAlignment: "center",
  };
  range.format.rowHeight = 34;
}

function styleHeader(range) {
  range.format = {
    fill: colors.blue,
    font: { bold: true, color: colors.white },
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "inside", style: "thin", color: "#8EA9C1" },
  };
  range.format.rowHeight = 28;
}

function styleBody(range) {
  range.format = {
    font: { color: colors.text, size: 10 },
    verticalAlignment: "top",
    wrapText: true,
    borders: { insideHorizontal: { style: "thin", color: colors.border } },
  };
}

function addDecisionFormatting(range) {
  range.conditionalFormats.add("containsText", { text: "可直接合并", format: { fill: colors.green, font: { color: "#1B5E20", bold: true } } });
  range.conditionalFormats.add("containsText", { text: "条件合并", format: { fill: colors.amber, font: { color: "#7F6000", bold: true } } });
  range.conditionalFormats.add("containsText", { text: "需拆分", format: { fill: colors.red, font: { color: "#9C0006", bold: true } } });
  range.conditionalFormats.add("containsText", { text: "不建议直接合并", format: { fill: colors.gray, font: { color: "#595959", bold: true } } });
}

// 分析摘要
summary.showGridLines = false;
styleTitle(summary, "A1:F1", "job_position 重复岗位分析");
summary.getRange("A2:F2").merge();
summary.getRange("A2").values = [["统计口径：岗位名称完全一致视为同名重复；职业分类冲突、专业方向和岗位层级用于判断是否可合并。源文件：job_position.xlsx"]];
summary.getRange("A2:F2").format = { fill: colors.lightBlue, font: { color: colors.text }, wrapText: true, verticalAlignment: "center" };
summary.getRange("A2:F2").format.rowHeight = 34;

summary.getRange("A4:B12").values = [
  ["关键指标", "结果"],
  ["源岗位记录数", analysis.stats.total_rows],
  ["完全不同岗位名", null],
  ["同名重复组", null],
  ["涉及重复的记录", null],
  ["理论最多可减少记录", null],
  ["保守可先减少记录", null],
  ["保守合并后岗位记录", null],
  ["同名记录占比", null],
];
summary.getRange("B6:B12").formulas = [
  ["=B5-B9"],
  ["=COUNTA('同名重复组'!B2:B296)"],
  ["=SUM('同名重复组'!C2:C296)"],
  ["=SUM('同名重复组'!D2:D296)"],
  ["=SUM('同名重复组'!E2:E296)"],
  ["=B5-B10"],
  ["=B8/B5"],
];
styleHeader(summary.getRange("A4:B4"));
summary.getRange("A5:A12").format = { fill: colors.gray, font: { bold: true, color: colors.text } };
summary.getRange("B5:B12").format = { font: { bold: true, color: colors.navy, size: 12 }, horizontalAlignment: "right" };
summary.getRange("B5:B11").format.numberFormat = "#,##0";
summary.getRange("B12").format.numberFormat = "0.0%";
summary.getRange("A4:B12").format.borders = { preset: "outside", style: "thin", color: colors.border };

summary.getRange("D4:F8").values = [
  ["合并等级", "组数", "处理原则"],
  ["可直接合并", null, "同名且职业分类一致，保留一个标准岗位，其他记录改为来源/产业关联。"],
  ["条件合并（先修分类）", null, "同名但职业分类冲突；先校正分类，再合并主记录。"],
  ["需拆分后合并", null, "名称过宽；先补行业或职能限定词，再按专业方向归并。"],
  ["相似名称候选", null, "仅用于人工复核，不能按字符串相似度直接批量合并。"],
];
summary.getRange("E5:E8").formulas = [
  ["=COUNTIF('同名重复组'!F2:F296,D5)"],
  ["=COUNTIF('同名重复组'!F2:F296,D6)"],
  ["=COUNTIF('同名重复组'!F2:F296,D7)"],
  ["=COUNTA('相似名称复核'!B2:B51)"],
];
styleHeader(summary.getRange("D4:F4"));
styleBody(summary.getRange("D5:F8"));
summary.getRange("E5:E8").format.numberFormat = "#,##0";
addDecisionFormatting(summary.getRange("D5:D8"));

summary.getRange("A15:F20").values = [
  ["重点风险提示", null, null, null, null, null],
  ["1", "系统工程师", "5 条记录分别落在互联网后端、运维、汽车信息系统、机械系统、硬件系统，不能直接压成一个岗位。", null, null, null],
  ["2", "出纳", "4 条职责一致，但有 1 条被映射为“机要员”，应先修正职业分类后合并。", null, null, null],
  ["3", "营养师", "4 条职业分类分别映射为医师、护士、营养师、餐厅服务员，属于明显分类质量问题。", null, null, null],
  ["4", "射频工程师", "4 条职责均围绕射频系统/电路，但职业分类分散，应统一岗位并重做职业分类。", null, null, null],
  ["5", "相似名称", "“高级硬件工程师/硬件工程师”“宠物医生/宠物医生助理”等属于层级或角色不同，不应因名称相近直接合并。", null, null, null],
];
summary.getRange("A15:F15").merge();
summary.getRange("A15:F15").format = { fill: colors.teal, font: { bold: true, color: colors.white } };
for (let row = 16; row <= 20; row += 1) summary.getRange(`C${row}:F${row}`).merge();
summary.getRange("A16:F20").format = { wrapText: true, verticalAlignment: "top", borders: { insideHorizontal: { style: "thin", color: colors.border } } };
summary.getRange("A16:A20").format = { font: { bold: true, color: colors.blue }, horizontalAlignment: "center" };
summary.getRange("B16:B20").format = { font: { bold: true, color: colors.text } };
summary.getRange("A16:F20").format.rowHeight = 38;
summary.getRange("A1:A20").format.columnWidth = 18;
summary.getRange("B1:B20").format.columnWidth = 16;
summary.getRange("C1:C20").format.columnWidth = 20;
summary.getRange("D1:D20").format.columnWidth = 22;
summary.getRange("E1:E20").format.columnWidth = 10;
summary.getRange("F1:F20").format.columnWidth = 48;
summary.freezePanes.freezeRows(2);

// 同名重复组
exact.showGridLines = false;
const exactHeaders = ["序号", "重复岗位名", "出现次数", "理论可减少", "保守可减少", "合并建议", "建议标准名/处理", "职业分类代码", "职业分类名称", "所属产业目录路径", "position_id", "源表行号", "职责相似度", "要求相似度", "判断理由"];
exact.getRangeByIndexes(0, 0, 1, exactHeaders.length).values = [exactHeaders];
const exactRows = analysis.exactGroups.map((g, i) => [
  i + 1,
  g.name,
  g.count,
  null,
  null,
  g.decision,
  g.decision === "需拆分后合并" ? `按专业方向补充限定词后归并：${g.name}` : g.suggested_name,
  join(g.occupation_codes),
  join(g.occupation_names),
  join(g.industry_paths),
  join(g.position_ids),
  join(g.source_rows),
  g.summary_similarity,
  g.requirements_similarity,
  g.reason,
]);
exact.getRangeByIndexes(1, 0, exactRows.length, exactHeaders.length).values = exactRows;
exact.getRange("D2").formulasR1C1 = [["=RC[-1]-1"]];
exact.getRange(`D2:D${exactRows.length + 1}`).fillDown();
exact.getRange("E2").formulasR1C1 = [["=IF(RC[1]=\"需拆分后合并\",0,RC[-2]-1)"]];
exact.getRange(`E2:E${exactRows.length + 1}`).fillDown();
styleHeader(exact.getRange(`A1:O1`));
styleBody(exact.getRange(`A2:O${exactRows.length + 1}`));
exact.getRange(`A2:A${exactRows.length + 1}`).format.horizontalAlignment = "center";
exact.getRange(`C2:E${exactRows.length + 1}`).format.numberFormat = "#,##0";
exact.getRange(`M2:N${exactRows.length + 1}`).format.numberFormat = "0.0%";
addDecisionFormatting(exact.getRange(`F2:F${exactRows.length + 1}`));
exact.getRange(`A2:O${exactRows.length + 1}`).format.rowHeight = 44;
const exactWidths = [7, 23, 9, 11, 11, 20, 31, 26, 28, 52, 30, 20, 11, 11, 52];
exactWidths.forEach((width, index) => { exact.getRangeByIndexes(0, index, exactRows.length + 1, 1).format.columnWidth = width; });
exact.freezePanes.freezeRows(1);
exact.freezePanes.freezeColumns(2);
exact.tables.add(`A1:O${exactRows.length + 1}`, true, "ExactDuplicateGroups");

// 同名重复明细
details.showGridLines = false;
const detailHeaders = ["重复组序号", "重复岗位名", "组级建议", "建议标准名", "源表行号", "position_id", "产业目录ID", "产业目录路径", "职业分类代码", "职业分类名称", "岗位概述摘录", "任职要求摘录"];
details.getRangeByIndexes(0, 0, 1, detailHeaders.length).values = [detailHeaders];
const detailRows = analysis.exactDetails.map((row) => [
  row.group_no,
  row.duplicate_name,
  row.group_decision,
  row.group_decision === "需拆分后合并" ? "待补专业方向限定词" : row.suggested_name,
  row.source_row,
  row.position_id,
  row.catalog_id,
  row.industry_path,
  row.occupation_code,
  row.occupation_name,
  clip(row.work_summary),
  clip(row.requirements_text),
]);
details.getRangeByIndexes(1, 0, detailRows.length, detailHeaders.length).values = detailRows;
styleHeader(details.getRange("A1:L1"));
styleBody(details.getRange(`A2:L${detailRows.length + 1}`));
addDecisionFormatting(details.getRange(`C2:C${detailRows.length + 1}`));
details.getRange(`A2:A${detailRows.length + 1}`).format.numberFormat = "#,##0";
details.getRange(`E2:E${detailRows.length + 1}`).format.numberFormat = "#,##0";
details.getRange(`G2:G${detailRows.length + 1}`).format.numberFormat = "#,##0";
details.getRange(`A2:L${detailRows.length + 1}`).format.rowHeight = 52;
const detailWidths = [10, 22, 20, 23, 10, 18, 11, 52, 18, 28, 52, 52];
detailWidths.forEach((width, index) => { details.getRangeByIndexes(0, index, detailRows.length + 1, 1).format.columnWidth = width; });
details.freezePanes.freezeRows(1);
details.freezePanes.freezeColumns(2);
details.tables.add(`A1:L${detailRows.length + 1}`, true, "ExactDuplicateDetails");

// 相似名称复核
near.showGridLines = false;
const nearHeaders = ["序号", "岗位名A", "岗位名B", "涉及记录数", "建议", "判断理由", "共享职业代码", "共享职业名称", "名称相似度", "职责相似度", "A源表行号", "B源表行号"];
near.getRangeByIndexes(0, 0, 1, nearHeaders.length).values = [nearHeaders];
const nearRows = analysis.nearPairs.map((pair, i) => [
  i + 1,
  pair.name_a,
  pair.name_b,
  pair.total_rows,
  pair.decision,
  pair.reason,
  join(pair.shared_occupation_codes),
  join(pair.shared_occupation_names),
  pair.title_similarity,
  pair.text_similarity,
  join(pair.source_rows_a),
  join(pair.source_rows_b),
]);
near.getRangeByIndexes(1, 0, nearRows.length, nearHeaders.length).values = nearRows;
styleHeader(near.getRange("A1:L1"));
styleBody(near.getRange(`A2:L${nearRows.length + 1}`));
addDecisionFormatting(near.getRange(`E2:E${nearRows.length + 1}`));
near.getRange(`D2:D${nearRows.length + 1}`).format.numberFormat = "#,##0";
near.getRange(`I2:J${nearRows.length + 1}`).format.numberFormat = "0.0%";
near.getRange(`A2:L${nearRows.length + 1}`).format.rowHeight = 44;
const nearWidths = [7, 23, 23, 11, 28, 52, 24, 28, 11, 11, 16, 16];
nearWidths.forEach((width, index) => { near.getRangeByIndexes(0, index, nearRows.length + 1, 1).format.columnWidth = width; });
near.freezePanes.freezeRows(1);
near.freezePanes.freezeColumns(3);
near.tables.add(`A1:L${nearRows.length + 1}`, true, "NearDuplicateReview");

// 关键范围校验与四张表的视觉预览
console.log((await workbook.inspect({ kind: "table", sheetId: "分析摘要", range: "A1:F20", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 8, maxChars: 12000 })).ndjson);
console.log((await workbook.inspect({ kind: "table", sheetId: "同名重复组", range: `A1:O${Math.min(18, exactRows.length + 1)}`, include: "values,formulas", tableMaxRows: 18, tableMaxCols: 15, maxChars: 16000 })).ndjson);
console.log((await workbook.inspect({ kind: "table", sheetId: "同名重复明细", range: `A1:L${Math.min(12, detailRows.length + 1)}`, include: "values,formulas", tableMaxRows: 12, tableMaxCols: 12, maxChars: 16000 })).ndjson);
console.log((await workbook.inspect({ kind: "table", sheetId: "相似名称复核", range: `A1:L${Math.min(15, nearRows.length + 1)}`, include: "values,formulas", tableMaxRows: 15, tableMaxCols: 12, maxChars: 16000 })).ndjson);
console.log((await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" })).ndjson);

for (const [sheetName, range] of [
  ["分析摘要", "A1:F20"],
  ["同名重复组", "A1:O18"],
  ["同名重复明细", "A1:L12"],
  ["相似名称复核", `A1:L${Math.min(15, nearRows.length + 1)}`],
]) {
  const preview = await workbook.render({ sheetName, range, scale: 1.2, format: "png" });
  await fs.writeFile(`${outDir}/preview_${sheetName}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, exactRows: exactRows.length, detailRows: detailRows.length, nearRows: nearRows.length }));
