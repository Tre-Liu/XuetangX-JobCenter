import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");
const inputPath = path.join(root, "V1.0需求（2026.6.11）/官方数据/【ADS】产业布局-产业链图谱数据源梳理.xlsx");
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 12000,
  tableMaxRows: 8,
  tableMaxCols: 12,
  tableMaxCellChars: 120,
});
await fs.writeFile(path.join(__dirname, "inspect-summary.ndjson"), summary.ndjson, "utf8");
console.log(summary.ndjson);

const sheets = await workbook.inspect({ kind: "sheet", include: "id,name" });
const firstSheetName = sheets.ndjson
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .find((item) => item.kind === "sheet")?.name;

if (firstSheetName) {
  const firstRange = await workbook.inspect({
    kind: "region",
    sheetId: firstSheetName,
    range: "A1:Z20",
    maxChars: 16000,
    tableMaxRows: 20,
    tableMaxCols: 26,
    tableMaxCellChars: 160,
  });
  await fs.writeFile(path.join(__dirname, "first-sheet-a1-z20.ndjson"), firstRange.ndjson, "utf8");
  console.log(firstRange.ndjson);

  const preview = await workbook.render({ sheetName: firstSheetName, range: "A1:Z20", scale: 1, format: "png" });
  const bytes = new Uint8Array(await preview.arrayBuffer());
  await fs.writeFile(path.join(__dirname, "first-sheet-a1-z20.png"), bytes);
  console.log(`rendered ${firstSheetName}: ${bytes.length}`);
}
