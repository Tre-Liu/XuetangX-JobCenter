import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const source = "/Users/liuhongzhe/Desktop/学堂/专业建设/需求/V1.0/数据搬移/job_position.xlsx";
const outDir = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/job-position-duplicates-20260714";

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 10000,
  tableMaxRows: 15,
  tableMaxCols: 20,
  tableMaxCellChars: 120,
});
console.log(summary.ndjson);

const sheetInfo = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 4000 });
console.log(sheetInfo.ndjson);

const firstSheet = workbook.worksheets.getItemAt(0);
const used = firstSheet.getUsedRange(true);
console.log(JSON.stringify({ sheet: firstSheet.name, rowCount: used.rowCount, columnCount: used.columnCount }));
console.log(JSON.stringify(used.getRangeByIndexes(0, 0, Math.min(20, used.rowCount), Math.min(20, used.columnCount)).values));

const preview = await workbook.render({ sheetName: firstSheet.name, range: `A1:${used.getCell(Math.min(25, used.rowCount) - 1, Math.min(12, used.columnCount) - 1).address.split("!").pop()}`, scale: 1.5, format: "png" });
await fs.writeFile(`${outDir}/source_preview.png`, new Uint8Array(await preview.arrayBuffer()));
