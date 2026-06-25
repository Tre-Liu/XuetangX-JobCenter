import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "/Users/liuhongzhe/Documents/专业建设/V1.0需求（2026.6.11）/官方数据/中国A股上市公司清单.xlsx";
const outputPath = "/Users/liuhongzhe/Documents/专业建设/outputs/a_share_credit_code_enrichment/rows.json";

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("A股上市公司清单");
const values = sheet.getRange("A1:J5191").values;
const rows = values.slice(1).map((row, index) => ({
  rowNumber: index + 2,
  serial: row[0],
  code: String(row[1] ?? "").padStart(6, "0"),
  shortName: row[2],
  fullName: row[3],
  province: row[4],
  listDate: row[8],
}));

const prefixCounts = {};
let blankFullName = 0;
for (const row of rows) {
  const prefix = row.code.slice(0, 1);
  prefixCounts[prefix] = (prefixCounts[prefix] ?? 0) + 1;
  if (!row.fullName) blankFullName += 1;
}

await fs.writeFile(outputPath, JSON.stringify(rows, null, 2), "utf8");
console.log(JSON.stringify({ rows: rows.length, blankFullName, prefixCounts, outputPath }, null, 2));
