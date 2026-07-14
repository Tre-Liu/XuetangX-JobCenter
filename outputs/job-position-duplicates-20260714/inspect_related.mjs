import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const base = "/Users/liuhongzhe/Desktop/学堂/专业建设/需求/V1.0/数据搬移";
const files = [
  "industry_catalogs.xlsx",
];

for (const file of files) {
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(`${base}/${file}`));
  const sheet = workbook.worksheets.getItemAt(0);
  const used = sheet.getUsedRange(true);
  const sample = used.getRangeByIndexes(0, 0, Math.min(12, used.rowCount), Math.min(20, used.columnCount)).values;
  console.log(JSON.stringify({ file, sheet: sheet.name, rows: used.rowCount, cols: used.columnCount, sample }));
  const values = used.values;
  const headers = values[0].map(String);
  const idIndex = headers.indexOf("id");
  const targets = new Set([183, 226, 766, 806, 1350, 306, 1192, 1204, 1215, 605, 829, 1338, 1356]);
  const rows = values.slice(1).filter((row) => targets.has(Number(row[idIndex])));
  console.log(JSON.stringify({ targets: rows }));
}
