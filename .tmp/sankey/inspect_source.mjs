import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "/Users/liuhongzhe/Desktop/岗位产业环节匹配/产业环节.xlsx";
const outDir = "/private/tmp/sankey-source-preview";
await fs.mkdir(outDir, { recursive: true });

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 10000,
  tableMaxRows: 12,
  tableMaxCols: 12,
  tableMaxCellChars: 120,
});
console.log("SUMMARY\n" + summary.ndjson);

const sheets = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 4000 });
console.log("SHEETS\n" + sheets.ndjson);

for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange(true);
  const address = used?.address ?? "A1";
  console.log(`USED ${sheet.name} ${address}`);
  const region = await workbook.inspect({
    kind: "region",
    sheetId: sheet.name,
    range: address,
    maxChars: 14000,
    tableMaxRows: 30,
    tableMaxCols: 12,
    tableMaxCellChars: 160,
  });
  console.log(`REGION ${sheet.name}\n${region.ndjson}`);
  const preview = await workbook.render({
    sheetName: sheet.name,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  await fs.writeFile(`${outDir}/${sheet.name}.png`, new Uint8Array(await preview.arrayBuffer()));
}
