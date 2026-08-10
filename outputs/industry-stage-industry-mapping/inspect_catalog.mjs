import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const catalogPath = "V1.0需求（2026.6.11）/官方数据/国民经济行业分类_GBT4754-2017.xlsx";
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(catalogPath));
const sheet = workbook.worksheets.getItem("国民经济行业分类");
const used = sheet.getUsedRange(true);

const terms = process.argv.slice(2);
if (terms.length === 0) {
  console.log(JSON.stringify({ address: used.address, rows: used.rowCount, columns: used.columnCount }));
  console.log((await workbook.inspect({
    kind: "table",
    range: "国民经济行业分类!A1:F18",
    include: "values,formulas",
    tableMaxRows: 18,
    tableMaxCols: 6,
    maxChars: 8000,
  })).ndjson);
} else {
  const rows = used.values.slice(1)
    .filter((row) => row[3] === "小类")
    .map((row) => ({ code: String(row[0]), name: String(row[1]).trim(), note: row[4] ?? "" }));
  for (const term of terms) {
    const hits = rows.filter((row) => row.code === term || row.name.includes(term) || String(row.note).includes(term));
    console.log(`## ${term}`);
    for (const hit of hits) console.log(`${hit.code}\t${hit.name}`);
  }
}
