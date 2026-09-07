import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/01a056b0-f9d8-7391-9ead-f2406424a741/岗位典型工作任务与原子能力项.xlsx";
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const sheets = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 4000,
});
console.log("SHEETS");
console.log(sheets.ndjson);

const sample = await workbook.inspect({
  kind: "table",
  sheetId: "岗位覆盖",
  range: "A1:K15",
  include: "values,formulas",
  tableMaxRows: 15,
  tableMaxCols: 11,
  maxChars: 12000,
});
console.log("SAMPLE");
console.log(sample.ndjson);

const coverageSheet = workbook.worksheets.getItem("岗位覆盖");
const statusValues = coverageSheet.getRange("C2:C57553").values.flat();
const counts = new Map();
for (const value of statusValues) counts.set(value, (counts.get(value) ?? 0) + 1);
console.log("COUNTS");
console.log(JSON.stringify(Object.fromEntries(counts), null, 2));

const total = statusValues.length;
for (const status of ["已匹配", "需复核", "未匹配"]) {
  const count = counts.get(status) ?? 0;
  console.log(`${status}\t${count}\t${(count / total * 100).toFixed(4)}%`);
}
const candidate = (counts.get("已匹配") ?? 0) + (counts.get("需复核") ?? 0);
console.log(`已匹配+需复核\t${candidate}\t${(candidate / total * 100).toFixed(4)}%`);
