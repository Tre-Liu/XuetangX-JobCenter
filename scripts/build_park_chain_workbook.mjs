import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程";
const workDir = path.join(root, "work/park-industry-chain-match");
const outputDir = path.join(root, "outputs/019f4b30-b12f-7990-bba9-9a9d76171299");
const qaDir = path.join(workDir, "qa");
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(qaDir, { recursive: true });

const summary = JSON.parse(await fs.readFile(path.join(workDir, "mapping_summary.json"), "utf8"));
const workbook = Workbook.create();

const titleFill = "#163A5F";
const headerFill = "#245B85";
const accentFill = "#DCEAF5";
const lightFill = "#F4F7FA";
const greenFill = "#E2F0D9";
const yellowFill = "#FFF2CC";
const redFill = "#FCE4D6";
const grayFill = "#E7E6E6";

function styleTitle(sheet, range) {
  range.format = {
    fill: titleFill,
    font: { bold: true, color: "#FFFFFF", size: 18 },
    verticalAlignment: "center",
    horizontalAlignment: "left",
  };
  range.format.rowHeight = 34;
}

function styleHeader(range) {
  range.format = {
    fill: headerFill,
    font: { bold: true, color: "#FFFFFF" },
    verticalAlignment: "center",
    horizontalAlignment: "center",
    wrapText: true,
    borders: { preset: "outside", style: "thin", color: "#B4C6D7" },
  };
  range.format.rowHeight = 34;
}

function setColumnWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 1, 1).format.columnWidth = width;
  });
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  if (cells[0]?.charCodeAt(0) === 0xfeff) cells[0] = cells[0].slice(1);
  return cells;
}

function inferValue(value, isHeader) {
  if (isHeader) return value;
  if (value === "") return null;
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(value) && !/^0\d+/.test(value)) return Number(value);
  return value;
}

async function importCsvSheet(fileName, sheetName) {
  const sheet = workbook.worksheets.add(sheetName);
  const input = createReadStream(path.join(workDir, fileName), { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  let rowIndex = 0;
  let colCount = 0;
  let chunk = [];
  const chunkSize = 4000;
  for await (const line of lines) {
    const parsed = parseCsvLine(line);
    if (rowIndex === 0) colCount = parsed.length;
    if (parsed.length !== colCount) throw new Error(`${fileName} row ${rowIndex + 1} has ${parsed.length} columns; expected ${colCount}`);
    chunk.push(parsed.map((value) => inferValue(value, rowIndex === 0)));
    rowIndex += 1;
    if (chunk.length >= chunkSize) {
      sheet.getRangeByIndexes(rowIndex - chunk.length, 0, chunk.length, colCount).values = chunk;
      chunk = [];
    }
  }
  if (chunk.length) sheet.getRangeByIndexes(rowIndex - chunk.length, 0, chunk.length, colCount).values = chunk;
  return sheet;
}

// Summary sheet is intentionally first.
const overview = workbook.worksheets.add("匹配摘要");
// Create every formula-referenced worksheet before writing cross-sheet formulas.
const quality = workbook.worksheets.add("质量核验");
const guide = workbook.worksheets.add("使用说明");
overview.showGridLines = false;
overview.getRange("A1:H1").merge();
overview.getRange("A1").values = [["产业园区—产业链/产业节点全量关联匹配"]];
styleTitle(overview, overview.getRange("A1:H1"));
overview.getRange("A2:H2").merge();
overview.getRange("A2").values = [["口径：104,127 条园区源记录逐条保留；明确关系、宽口径候选、无明确关联均有状态，不以强行匹配代替覆盖。"]];
overview.getRange("A2:H2").format = { fill: accentFill, font: { color: "#163A5F" }, wrapText: true };
overview.getRange("A2:H2").format.rowHeight = 30;

overview.getRange("A4:B4").merge();
overview.getRange("C4:D4").merge();
overview.getRange("E4:F4").merge();
overview.getRange("G4:H4").merge();
overview.getRange("A4").values = [["源数据总行数"]];
overview.getRange("C4").values = [["有候选/明确关系园区"]];
overview.getRange("E4").values = [["无明确关联园区"]];
overview.getRange("G4").values = [["关联关系明细行数"]];
overview.getRange("A5:B6").merge();
overview.getRange("C5:D6").merge();
overview.getRange("E5:F6").merge();
overview.getRange("G5:H6").merge();
overview.getRange("A5").formulas = [["='质量核验'!B3"]];
overview.getRange("C5").formulas = [["='质量核验'!B8"]];
overview.getRange("E5").formulas = [["='质量核验'!B9"]];
overview.getRange("G5").formulas = [["='质量核验'!B7"]];
for (const address of ["A4:B4", "C4:D4", "E4:F4", "G4:H4"]) {
  overview.getRange(address).format = { fill: headerFill, font: { bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", verticalAlignment: "center" };
}
for (const address of ["A5:B6", "C5:D6", "E5:F6", "G5:H6"]) {
  overview.getRange(address).format = { fill: lightFill, font: { bold: true, color: titleFill, size: 18 }, horizontalAlignment: "center", verticalAlignment: "center", numberFormat: "#,##0", borders: { preset: "outside", style: "thin", color: "#B4C6D7" } };
}

overview.getRange("A8:D8").values = [["匹配状态", "园区数", "占源数据比例", "处理建议"]];
styleHeader(overview.getRange("A8:D8"));
const statusOrder = ["已匹配-节点明确", "已匹配-链明确节点待细分", "待复核-宽口径候选", "无明确关联"];
const statusAdvice = {
  "已匹配-节点明确": "可直接用于园区—节点关联；仍建议抽样核对。",
  "已匹配-链明确节点待细分": "产业链可用；节点需结合园区主导产业或入驻企业再细分。",
  "待复核-宽口径候选": "仅作候选池，优先人工复核名称与简介证据。",
  "无明确关联": "保留原记录；需要补充主导产业/企业名录后再匹配。",
};
overview.getRange("A9:D12").values = statusOrder.map((status) => [status, summary.status_counts[status] || 0, null, statusAdvice[status]]);
for (let row = 9; row <= 12; row += 1) {
  overview.getRange(`C${row}`).formulas = [[`=B${row}/$A$5`]];
}
overview.getRange("B9:B12").format.numberFormat = "#,##0";
overview.getRange("C9:C12").format.numberFormat = "0.0%";
overview.getRange("A9:D12").format.borders = { preset: "outside", style: "thin", color: "#C7D3DF" };
overview.getRange("D9:D12").format.wrapText = true;

overview.getRange("A14:C14").values = [["标准产业链", "关联园区数（去重）", "说明"]];
styleHeader(overview.getRange("A14:C14"));
const chainRows = Object.entries(summary.chain_unique_park_counts);
overview.getRangeByIndexes(14, 0, chainRows.length, 3).values = chainRows.map(([chain], index) => [chain, null, index === 0 ? "同一园区可关联多条产业链，产业链之间不互斥。" : ""]);
chainRows.forEach((_, index) => {
  overview.getCell(14 + index, 1).formulas = [[`='质量核验'!B${22 + index}`]];
});
overview.getRange(`B15:B${14 + chainRows.length}`).format.numberFormat = "#,##0";
overview.getRange(`A15:C${14 + chainRows.length}`).format.borders = { preset: "outside", style: "thin", color: "#C7D3DF" };
overview.getRange(`C15:C${14 + chainRows.length}`).format.wrapText = true;
overview.freezePanes.freezeRows(2);
setColumnWidths(overview, [34, 18, 30, 48, 14, 14, 14, 14]);

console.log("stage: import compact full coverage");
const coverage = await importCsvSheet("park_full_coverage_compact.csv", "园区全量覆盖");
coverage.freezePanes.freezeRows(1);
coverage.freezePanes.freezeColumns(6);
styleHeader(coverage.getRange("A1:Q1"));
coverage.tables.add(`A1:Q${summary.source_rows + 1}`, true, "ParkFullCoverageTable").style = "TableStyleMedium2";
setColumnWidths(coverage, [16, 10, 10, 12, 30, 10, 10, 10, 24, 10, 12, 12, 42, 50, 50, 60, 42]);
coverage.getRange(`B2:B${summary.source_rows + 1}`).format.numberFormat = "#,##0";
coverage.getRange(`K2:L${summary.source_rows + 1}`).format.numberFormat = "#,##0";
coverage.getRange(`I2:I${summary.source_rows + 1}`).conditionalFormats.add("containsText", { text: "已匹配", format: { fill: greenFill, font: { color: "#375623" } } });
coverage.getRange(`I2:I${summary.source_rows + 1}`).conditionalFormats.add("containsText", { text: "待复核", format: { fill: yellowFill, font: { color: "#7F6000" } } });
coverage.getRange(`I2:I${summary.source_rows + 1}`).conditionalFormats.add("containsText", { text: "无明确关联", format: { fill: grayFill, font: { color: "#595959" } } });

console.log("stage: import compact relations");
const relations = await importCsvSheet("park_chain_node_relations_compact.csv", "关联关系明细");
relations.freezePanes.freezeRows(1);
relations.freezePanes.freezeColumns(4);
styleHeader(relations.getRange("A1:Q1"));
relations.tables.add(`A1:Q${summary.relation_rows + 1}`, true, "ParkChainNodeRelationTable").style = "TableStyleMedium4";
setColumnWidths(relations, [16, 16, 10, 30, 12, 34, 10, 12, 36, 30, 10, 12, 12, 36, 36, 70, 70]);
relations.getRange(`C2:C${summary.relation_rows + 1}`).format.numberFormat = "#,##0";
relations.getRange(`L2:M${summary.relation_rows + 1}`).format.numberFormat = "0";
relations.getRange(`K2:K${summary.relation_rows + 1}`).conditionalFormats.add("containsText", { text: "高", format: { fill: greenFill, font: { color: "#375623", bold: true } } });
relations.getRange(`K2:K${summary.relation_rows + 1}`).conditionalFormats.add("containsText", { text: "中", format: { fill: accentFill, font: { color: titleFill } } });
relations.getRange(`K2:K${summary.relation_rows + 1}`).conditionalFormats.add("containsText", { text: "低", format: { fill: yellowFill, font: { color: "#7F6000" } } });

console.log("stage: import dictionaries and build summary sheets");
const dictionary = await importCsvSheet("industry_chain_node_dictionary.csv", "产业链节点字典");
dictionary.freezePanes.freezeRows(1);
styleHeader(dictionary.getRange("A1:K1"));
dictionary.tables.add("A1:K58", true, "IndustryChainNodeDictionaryTable").style = "TableStyleMedium2";
setColumnWidths(dictionary, [12, 34, 10, 36, 58, 34, 48, 18, 28, 42, 70]);
dictionary.getRange("D2:K58").format.wrapText = true;

const rules = await importCsvSheet("category_mapping_rules.csv", "标签映射规则");
rules.freezePanes.freezeRows(1);
styleHeader(rules.getRange("A1:E1"));
const ruleRows = Object.values(summary.status_counts).reduce((a, b) => a + b, 0); // only used to keep formulas numeric-safe
const ruleUsed = rules.getUsedRange(true);
ruleUsed.format.verticalAlignment = "top";
setColumnWidths(rules, [18, 34, 16, 12, 70]);
rules.getRange("E2:E80").format.wrapText = true;

quality.showGridLines = false;
quality.getRange("A1:F1").merge();
quality.getRange("A1").values = [["数据质量与覆盖核验"]];
styleTitle(quality, quality.getRange("A1:F1"));
quality.getRange("A2:C2").values = [["核验项", "结果", "判定"]];
styleHeader(quality.getRange("A2:C2"));
const qualityRows = [
  ["源数据行数", summary.source_rows, "基准"],
  ["全量覆盖表行数", summary.full_coverage_rows, summary.coverage_check ? "通过" : "失败"],
  ["覆盖表record_id唯一", summary.coverage_check ? 1 : 0, summary.coverage_check ? "通过" : "失败"],
  ["源数据完全重复行", summary.source_exact_duplicate_rows, summary.source_exact_duplicate_rows === 0 ? "通过" : "关注"],
  ["关联关系明细行数", summary.relation_rows, "信息"],
  ["有候选/明确关系园区", summary.parks_with_any_relation, "信息"],
  ["无明确关联园区", summary.parks_without_relation, "需补资料"],
  ["园区名称重复行", summary.duplicate_park_name_rows, "均保留，不按名称去重"],
  ["园区名称去重数", summary.unique_park_names, "信息"],
  ["规范化后产业标签数", summary.source_industry_categories, "信息"],
  ["标准产业链数", Object.keys(summary.chain_unique_park_counts).length, "应为19"],
  ["标准产业节点数", Object.keys(summary.node_unique_park_counts).length, "已被精确命中的节点数；完整字典仍为57"],
];
quality.getRange("A3:C14").values = qualityRows;
quality.getRange("B3:B14").format.numberFormat = "#,##0";
quality.getRange("A3:C14").format.borders = { preset: "outside", style: "thin", color: "#C7D3DF" };
quality.getRange("C3:C14").format.wrapText = true;
quality.getRange("A16:C16").values = [["匹配状态", "园区数", "占比"]];
styleHeader(quality.getRange("A16:C16"));
quality.getRange("A17:C20").values = statusOrder.map((s) => [s, summary.status_counts[s] || 0, null]);
for (let row = 17; row <= 20; row += 1) quality.getRange(`C${row}`).formulas = [[`=B${row}/$B$3`]];
quality.getRange("B17:B20").format.numberFormat = "#,##0";
quality.getRange("C17:C20").format.numberFormat = "0.0%";
quality.getRange("A17:C20").format.borders = { preset: "outside", style: "thin", color: "#C7D3DF" };
quality.getRange("A21:B21").values = [["标准产业链", "关联园区数（去重）"]];
styleHeader(quality.getRange("A21:B21"));
quality.getRangeByIndexes(21, 0, chainRows.length, 2).values = chainRows.map(([chain, count]) => [chain, count]);
quality.getRange(`B22:B${21 + chainRows.length}`).format.numberFormat = "#,##0";
quality.getRange(`A22:B${21 + chainRows.length}`).format.borders = { preset: "outside", style: "thin", color: "#C7D3DF" };
quality.getRange("D2:F2").values = [["源文件/字典", "绝对路径", "用途"]];
styleHeader(quality.getRange("D2:F2"));
quality.getRange("D3:F5").values = [
  ["产业园区源数据", "/Users/liuhongzhe/Desktop/产业园区网全部产业园数据/产业园区网_产业园数据.xlsx", "104,127条园区原始数据"],
  ["产业链节点字典", "/Users/liuhongzhe/Desktop/产业链整理结果/industry_chain_stage_nodes.csv", "19条标准产业链、57个上中下游节点"],
  ["原始方向节点映射", "/Users/liuhongzhe/Desktop/产业链整理结果/original_to_stage_node_mapping.csv", "节点命名与原始方向证据参考"],
];
quality.getRange("D3:F5").format.wrapText = true;
quality.getRange("D3:F5").format.borders = { preset: "outside", style: "thin", color: "#C7D3DF" };
quality.freezePanes.freezeRows(2);
setColumnWidths(quality, [34, 20, 32, 24, 78, 46]);

guide.showGridLines = false;
guide.getRange("A1:F1").merge();
guide.getRange("A1").values = [["结果使用说明与边界"]];
styleTitle(guide, guide.getRange("A1:F1"));
guide.getRange("A3:B3").values = [["主题", "说明"]];
styleHeader(guide.getRange("A3:B3"));
guide.getRange("A4:B13").values = [
  ["全量覆盖", "园区全量覆盖表严格保留104,127条源记录；record_id与source_row用于回查原Excel。"],
  ["一对多关系", "一个园区可能关联多条产业链或多个节点，详见关联关系明细；不要对关系行直接当园区数求和。"],
  ["已匹配-节点明确", "产业链与节点均有标签、名称或简介证据，可直接进入候选关系库，并建议抽样复核。"],
  ["已匹配-链明确节点待细分", "产业链较明确，但没有足够证据判定上中下游；candidate_nodes列列出该链的3个候选节点。"],
  ["待复核-宽口径候选", "仅依据电子信息、国防科技等宽口径标签或简介线索，不能视为确认关系。"],
  ["无明确关联", "不是漏数；表示现有19条标准链和园区公开字段不足以形成可靠映射。"],
  ["简介使用", "为减少生活配套、医院、学校等模板文字误判，仅使用相关模板段之前的产业语境，并把低强度文本匹配降为待复核。"],
  ["仓储物流/大消费等", "现有19条标准链没有独立仓储物流、大消费、金融保险链；没有具体产业对象时保留为无明确关联。"],
  ["重复园区名称", "发现451条重复名称记录，均按源行保留；不以名称去重，避免丢失不同位置或标签记录。"],
  ["推荐下一步", "优先为无明确关联园区补充主导产业、入驻企业名录或园区规划，再进行第二轮企业级匹配。"],
];
guide.getRange("A4:B13").format = { verticalAlignment: "top", wrapText: true, borders: { preset: "outside", style: "thin", color: "#C7D3DF" } };
guide.getRange("A4:A13").format = { fill: accentFill, font: { bold: true, color: titleFill }, verticalAlignment: "top", wrapText: true };
setColumnWidths(guide, [28, 100, 12, 12, 12, 12]);

// Compact verification before export.
const overviewInspect = await workbook.inspect({ kind: "table", range: "匹配摘要!A1:H33", include: "values,formulas", tableMaxRows: 35, tableMaxCols: 8, maxChars: 12000 });
await fs.writeFile(path.join(qaDir, "overview_inspect.ndjson"), overviewInspect.ndjson, "utf8");
const qualityInspect = await workbook.inspect({ kind: "table", range: "质量核验!A1:F40", include: "values,formulas", tableMaxRows: 45, tableMaxCols: 6, maxChars: 12000 });
await fs.writeFile(path.join(qaDir, "quality_inspect.ndjson"), qualityInspect.ndjson, "utf8");
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });
await fs.writeFile(path.join(qaDir, "formula_errors.ndjson"), errors.ndjson, "utf8");

const renderSpecs = [
  ["匹配摘要", "A1:H33", "01_overview.png"],
  ["园区全量覆盖", "A1:Q18", "02_coverage.png"],
  ["关联关系明细", "A1:Q18", "03_relations.png"],
  ["产业链节点字典", "A1:K22", "04_dictionary.png"],
  ["标签映射规则", "A1:E30", "05_rules.png"],
  ["质量核验", "A1:F40", "06_quality.png"],
  ["使用说明", "A1:B13", "07_guide.png"],
];
for (const [sheetName, range, fileName] of renderSpecs) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(qaDir, fileName), new Uint8Array(await preview.arrayBuffer()));
}

console.log("stage: export xlsx");
const outputPath = path.join(outputDir, "产业园区-产业链产业节点全量关联匹配.xlsx");
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, sheets: renderSpecs.map((x) => x[0]), sourceRows: summary.source_rows, relationRows: summary.relation_rows }, null, 2));
