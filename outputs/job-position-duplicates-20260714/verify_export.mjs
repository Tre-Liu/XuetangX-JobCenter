import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const path = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/job-position-duplicates-20260714/job_position_重复岗位分析.xlsx";
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(path));

const summary = workbook.worksheets.getItem("分析摘要");
const exact = workbook.worksheets.getItem("同名重复组");
const details = workbook.worksheets.getItem("同名重复明细");
const near = workbook.worksheets.getItem("相似名称复核");

const summaryValues = summary.getRange("A4:F12").values;
const checks = {
  sheets: workbook.worksheets.items.map((sheet) => sheet.name),
  summary: {
    sourceRows: summaryValues[1][1],
    uniqueNames: summaryValues[2][1],
    duplicateGroups: summaryValues[3][1],
    duplicateRows: summaryValues[4][1],
    theoreticalReduction: summaryValues[5][1],
    conservativeReduction: summaryValues[6][1],
    conservativeRemaining: summaryValues[7][1],
    duplicateShare: summaryValues[8][1],
  },
  exactUsedRows: exact.getUsedRange(true).rowCount,
  detailUsedRows: details.getUsedRange(true).rowCount,
  nearUsedRows: near.getUsedRange(true).rowCount,
  exactLastRow: exact.getRange("A296:O296").values[0],
  detailLastRow: details.getRange("A660:L660").values[0],
  nearLastRow: near.getRange("A51:L51").values[0],
};

const expected = {
  sourceRows: 1356,
  uniqueNames: 992,
  duplicateGroups: 295,
  duplicateRows: 659,
  theoreticalReduction: 364,
  conservativeReduction: 339,
  conservativeRemaining: 1017,
};
for (const [key, value] of Object.entries(expected)) {
  if (checks.summary[key] !== value) throw new Error(`summary mismatch ${key}: ${checks.summary[key]} !== ${value}`);
}
if (checks.exactUsedRows !== 296) throw new Error(`exact rows mismatch: ${checks.exactUsedRows}`);
if (checks.detailUsedRows !== 660) throw new Error(`detail rows mismatch: ${checks.detailUsedRows}`);
if (checks.nearUsedRows !== 51) throw new Error(`near rows mismatch: ${checks.nearUsedRows}`);
if (!checks.exactLastRow[1] || !checks.detailLastRow[1] || !checks.nearLastRow[1]) throw new Error("last row is incomplete");

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "post-export formula error scan",
});
if (!String(errors.ndjson).includes("matched 0")) throw new Error(`formula error scan did not pass: ${errors.ndjson}`);

const preview = await workbook.render({ sheetName: "分析摘要", range: "A1:F20", scale: 1.2, format: "png" });
await fs.writeFile("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/job-position-duplicates-20260714/preview_exported_summary.png", new Uint8Array(await preview.arrayBuffer()));

console.log(JSON.stringify(checks, null, 2));
console.log(errors.ndjson);
