import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const sourceDir = "/Users/liuhongzhe/Desktop/岗位产业环节匹配";

const industryBlob = await FileBlob.load(`${sourceDir}/产业环节.xlsx`);
const industryBook = await SpreadsheetFile.importXlsx(industryBlob);
console.log("=== INDUSTRY WORKBOOK ===");
console.log((await industryBook.inspect({
  kind: "workbook,sheet,table,region",
  maxChars: 12000,
  tableMaxRows: 12,
  tableMaxCols: 16,
  tableMaxCellChars: 160,
})).ndjson);

const csvText = await fs.readFile(`${sourceDir}/岗位.csv`, "utf8");
const jobsBook = await Workbook.fromCSV(csvText, { sheetName: "岗位" });
console.log("=== JOB CSV ===");
console.log((await jobsBook.inspect({
  kind: "workbook,sheet,table,region",
  maxChars: 16000,
  tableMaxRows: 15,
  tableMaxCols: 24,
  tableMaxCellChars: 220,
})).ndjson);
