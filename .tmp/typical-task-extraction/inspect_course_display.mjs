import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/01a056b0-f9d8-7391-9ead-f2406424a741/岗位典型工作任务与原子能力项.xlsx";
const previewPath = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/.tmp/typical-task-extraction/previews/course-display-before.png";
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));

const inspection = await workbook.inspect({
  kind: "table",
  range: "能力项明细!Q1:U14",
  include: "values,formulas",
  tableMaxRows: 14,
  tableMaxCols: 5,
  maxChars: 8000,
});
console.log(inspection.ndjson);

const preview = await workbook.render({
  sheetName: "能力项明细",
  range: "Q1:U14",
  scale: 1,
  format: "png",
});
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
console.log(previewPath);
