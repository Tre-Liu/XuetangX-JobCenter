import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "/Users/liuhongzhe/Documents/专业建设/V1.0需求（2026.6.11）/官方数据/中国A股上市公司清单.xlsx";
const dataPath = "/Users/liuhongzhe/Documents/专业建设/outputs/a_share_credit_code_enrichment/credit_codes.json";
const outputDir = "/Users/liuhongzhe/Documents/专业建设/outputs/a_share_credit_code_enrichment";
const outputPath = `${outputDir}/中国A股上市公司清单_补充统一社会信用代码.xlsx`;

const creditRows = JSON.parse(await fs.readFile(dataPath, "utf8"));
const byRow = new Map(creditRows.map((row) => [row.rowNumber, row.creditCode || ""]));

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("A股上市公司清单");

sheet.getRange("K1").values = [["统一社会信用代码"]];
const formulas = [];
for (let row = 2; row <= 5191; row += 1) {
  const creditCode = byRow.get(row) ?? "";
  formulas.push([creditCode ? `=LEFT("${creditCode}",18)` : ""]);
}

const targetRange = sheet.getRange("K1:K5191");
sheet.getRange("K2:K5191").formulas = formulas;
targetRange.format.numberFormat = Array.from({ length: 5191 }, () => ["@"]);
targetRange.format.columnWidthPx = 172;
sheet.getRange("K1").format.fill = { color: "#D9EAF7" };
sheet.getRange("K1").format.font = { bold: true, color: "#000000" };
sheet.getRange("K1:K5191").format.borders = { preset: "all", style: "thin", color: "#D9D9D9" };

const sourceSheet = workbook.worksheets.getOrAdd("统一社会信用代码来源");
sourceSheet.getRange("A1:E1").values = [["说明", "来源", "校验", "已补充", "未补充"]];
sourceSheet.getRange("A2:E2").values = [[
  "主表 K 列为按股票代码查询并写入的统一社会信用代码；未能确认 18 位大陆统一社会信用代码的主体留空。",
  "东方财富公开公司资料接口 REG_NUM 字段",
  "18 位统一社会信用代码格式及校验位",
  creditRows.filter((row) => row.creditCode).length,
  creditRows.filter((row) => !row.creditCode).length,
]];
sourceSheet.getRange("A4:F4").values = [["行号", "股票代码", "股票简称", "表内公司全称", "来源公司全称", "原因"]];
const blankRows = creditRows
  .filter((row) => !row.creditCode)
  .map((row) => [
    row.rowNumber,
    row.code,
    row.shortName,
    row.sheetFullName,
    row.sourceFullName,
    row.rawRegNum ? "登记号未通过统一社会信用代码校验" : "来源未返回大陆统一社会信用代码",
  ]);
if (blankRows.length) {
  sourceSheet.getRangeByIndexes(4, 0, blankRows.length, 6).values = blankRows;
}
sourceSheet.getRange("A1:F20").format.columnWidthPx = 160;
sourceSheet.getRange("A1:F1").format.fill = { color: "#D9EAF7" };
sourceSheet.getRange("A1:F1").format.font = { bold: true, color: "#000000" };
sourceSheet.getRange("A4:F4").format.fill = { color: "#E2F0D9" };
sourceSheet.getRange("A4:F4").format.font = { bold: true, color: "#000000" };
sourceSheet.getRange(`A1:F${Math.max(5, blankRows.length + 4)}`).format.borders = {
  preset: "all",
  style: "thin",
  color: "#D9D9D9",
};

await fs.mkdir(outputDir, { recursive: true });

const sample = await workbook.inspect({
  kind: "table",
  range: "A股上市公司清单!A1:K12",
  include: "values",
  tableMaxRows: 12,
  tableMaxCols: 11,
  maxChars: 6000,
});
console.log(sample.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "A股上市公司清单",
  range: "A1:K20",
  autoCrop: "all",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

console.log(JSON.stringify({ outputPath }, null, 2));
