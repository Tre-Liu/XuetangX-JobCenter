import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");
const inputPath = path.join(root, "V1.0需求（2026.6.11）/官方数据/【ADS】产业布局-产业链图谱数据源梳理.xlsx");
const outputPath = path.join(root, "V1.0需求（2026.6.11）/官方数据/【ADS】产业布局-产业链图谱数据源梳理_字段拆分版.xlsx");

function cleanFieldItem(value) {
  return String(value ?? "")
    .replace(/^字段(?:包括|按)?/, "")
    .replace(/^弹窗字段包括/, "")
    .replace(/^交互包括/, "")
    .replace(/^当前展示/, "")
    .replace(/^当前包含/, "")
    .replace(/^当前包括/, "")
    .replace(/^展示/, "")
    .replace(/^和/, "")
    .replace(/^及/, "")
    .replace(/^以及/, "")
    .replace(/[。；;，,、\s]+$/g, "")
    .trim();
}

function splitListText(text) {
  return text
    .split(/[、,，]/)
    .map(cleanFieldItem)
    .filter(Boolean)
    .filter((item) => !["等"].includes(item));
}

function firstSentenceAfter(text, marker) {
  const idx = text.indexOf(marker);
  if (idx < 0) return "";
  const after = text.slice(idx + marker.length);
  return after.split("。")[0] ?? "";
}

function trimTrailingExplanation(text) {
  return text
    .split("，并")[0]
    .split("，用于")[0]
    .split("，当前")[0]
    .split("，如")[0]
    .split("，例如")[0]
    .split("，点击")[0]
    .trim();
}

function extractFields(description) {
  const text = String(description ?? "").replace(/\s+/g, " ").trim();
  if (!text) return [""];

  const markers = ["弹窗字段包括", "字段包括", "交互包括", "字段为"];
  for (const marker of markers) {
    const sentence = trimTrailingExplanation(firstSentenceAfter(text, marker));
    const fields = splitListText(sentence);
    if (fields.length > 1) return fields;
  }

  const groupedMatch = text.match(/字段按(.+?)分组[，,](?:展示)?(.+?)(?:。|，如|，例如|$)/);
  if (groupedMatch) {
    const groupFields = splitListText(groupedMatch[1]);
    const displayedFields = splitListText(groupedMatch[2]);
    const fields = [...groupFields, ...displayedFields];
    if (fields.length > 1) return fields;
  }

  const containsMatch = text.match(/(?:包含|可展示)(.+?)(?:。|，|$)/);
  if (containsMatch) {
    const fields = splitListText(containsMatch[1]);
    if (fields.length > 1 && fields.length <= 12) return fields;
  }

  return [text];
}

function fieldLabel(field, index, total) {
  if (total === 1) return field;
  return `${index + 1}. ${field}`;
}

function applyMainSheetStyle(sheet, rowCount) {
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  const range = sheet.getRangeByIndexes(0, 0, rowCount, 7);
  range.format.font.name = "Arial";
  range.format.font.size = 10;
  range.format.wrapText = true;
  range.format.verticalAlignment = "Top";
  range.format.borders = { preset: "all", style: "thin", color: "#D7DEE8" };

  const header = sheet.getRange("A1:G1");
  header.format.fill.color = "#115F7A";
  header.format.font.color = "#FFFFFF";
  header.format.font.bold = true;
  header.format.horizontalAlignment = "Center";
  header.format.verticalAlignment = "Center";
  header.format.rowHeightPx = 28;

  const body = sheet.getRangeByIndexes(1, 0, Math.max(rowCount - 1, 1), 7);
  body.format.fill.color = "#FFFFFF";
  body.format.rowHeightPx = 34;
  body.format.verticalAlignment = "Top";

  const widths = [100, 112, 190, 300, 70, 86, 430];
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, rowCount, 1).format.columnWidthPx = width;
  });

  sheet.getRangeByIndexes(1, 4, Math.max(rowCount - 1, 1), 2).format.horizontalAlignment = "Center";
}

function applySourceSheetStyle(sheet, rowCount) {
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  const range = sheet.getRangeByIndexes(0, 0, rowCount, 5);
  range.format.font.name = "Arial";
  range.format.font.size = 10;
  range.format.wrapText = true;
  range.format.verticalAlignment = "Top";
  range.format.borders = { preset: "all", style: "thin", color: "#D7DEE8" };

  const header = sheet.getRange("A1:E1");
  header.format.fill.color = "#115F7A";
  header.format.font.color = "#FFFFFF";
  header.format.font.bold = true;
  header.format.horizontalAlignment = "Center";
  header.format.rowHeightPx = 28;

  [140, 250, 360, 360, 320].forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, rowCount, 1).format.columnWidthPx = width;
  });
  range.format.autofitRows();
}

const input = await FileBlob.load(inputPath);
const sourceWorkbook = await SpreadsheetFile.importXlsx(input);
const adsValues = sourceWorkbook.worksheets.getItem("ADS表").getUsedRange().values;
const sourceValues = sourceWorkbook.worksheets.getItem("来源索引").getUsedRange().values;

const headers = adsValues[0];
const rows = [];
const mergeGroups = [];
let outputRow = 2;

for (const sourceRow of adsValues.slice(1)) {
  const fields = extractFields(sourceRow[3]);
  const startRow = outputRow;
  fields.forEach((field, index) => {
    rows.push([
      sourceRow[0],
      sourceRow[1],
      sourceRow[2],
      fieldLabel(field, index, fields.length),
      sourceRow[4],
      sourceRow[5],
      sourceRow[6],
    ]);
    outputRow += 1;
  });
  if (fields.length > 1) {
    mergeGroups.push({ startRow, endRow: outputRow - 1, source: sourceRow });
  }
}

const workbook = Workbook.create();
const adsSheet = workbook.worksheets.add("ADS表");
adsSheet.getRangeByIndexes(0, 0, rows.length + 1, headers.length).values = [headers, ...rows];
applyMainSheetStyle(adsSheet, rows.length + 1);

for (const group of mergeGroups) {
  for (const column of ["A", "B", "C", "E", "F", "G"]) {
    adsSheet.getRange(`${column}${group.startRow}:${column}${group.endRow}`).merge();
  }
}
adsSheet.getRangeByIndexes(0, 0, rows.length + 1, headers.length).format.autofitRows();

const sourceSheet = workbook.worksheets.add("来源索引");
sourceSheet.getRangeByIndexes(0, 0, sourceValues.length, sourceValues[0].length).values = sourceValues;
applySourceSheetStyle(sourceSheet, sourceValues.length);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 12000,
  tableMaxRows: 10,
  tableMaxCols: 7,
  tableMaxCellChars: 120,
});
await fs.writeFile(path.join(__dirname, "split-summary.ndjson"), summary.ndjson, "utf8");
console.log(summary.ndjson);

for (const sheetName of ["ADS表", "来源索引"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  const bytes = new Uint8Array(await preview.arrayBuffer());
  await fs.writeFile(path.join(__dirname, `${sheetName}-split-preview.png`), bytes);
  console.log(`rendered ${sheetName}: ${bytes.length}`);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`source rows: ${adsValues.length - 1}`);
console.log(`expanded rows: ${rows.length}`);
console.log(outputPath);
