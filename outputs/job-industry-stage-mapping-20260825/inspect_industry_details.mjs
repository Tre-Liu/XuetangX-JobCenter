import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const blob = await FileBlob.load("/Users/liuhongzhe/Desktop/岗位产业环节匹配/产业环节.xlsx");
const wb = await SpreadsheetFile.importXlsx(blob);
const ws = wb.worksheets.getItemAt(0);
const values = ws.getRange("A1:AB1047").values;
console.log("HEADERS", JSON.stringify(values[0]));
const counts = values[0].map((header, col) => ({
  header,
  nonEmpty: values.slice(1).filter(row => row[col] !== null && row[col] !== "").length,
}));
console.log("NON_EMPTY", JSON.stringify(counts));
for (const rowIndex of [1, 2, 50, 100, 200, 400, 600, 800, 1000, 1046]) {
  console.log(`ROW_${rowIndex + 1}`, JSON.stringify(values[rowIndex]));
}
