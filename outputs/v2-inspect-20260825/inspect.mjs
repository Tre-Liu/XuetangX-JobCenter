import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/v2-learning-path-20260825/【V2】新增需求功能清单_补充学习路径.xlsx";
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const overview = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 8000,
  tableMaxRows: 8,
  tableMaxCols: 12,
  tableMaxCellChars: 160,
});
console.log(overview.ndjson);

for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange();
  if (!used) continue;
  const details = await workbook.inspect({
    kind: "table",
    sheetId: sheet.name,
    range: used.address,
    maxChars: 40000,
    tableMaxRows: 80,
    tableMaxCols: 16,
    tableMaxCellChars: 300,
  });
  console.log(details.ndjson);
}
