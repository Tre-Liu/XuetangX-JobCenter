import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "/Users/liuhongzhe/Documents/专业建设/V1.0需求（2026.6.11）/官方数据/中国A股上市公司清单.xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table,region",
  maxChars: 12000,
  tableMaxRows: 12,
  tableMaxCols: 12,
  tableMaxCellChars: 80,
});

console.log(summary.ndjson);
