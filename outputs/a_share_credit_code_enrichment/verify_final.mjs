import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const outputDir = "/Users/liuhongzhe/Documents/专业建设/outputs/a_share_credit_code_enrichment";
const workbookPath = `${outputDir}/中国A股上市公司清单_补充统一社会信用代码.xlsx`;
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const sample = await workbook.inspect({
  kind: "table",
  range: "A股上市公司清单!A1:K12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 11,
  maxChars: 6000,
});
console.log(sample.ndjson);

const source = await workbook.inspect({
  kind: "table",
  range: "统一社会信用代码来源!A1:F14",
  include: "values",
  tableMaxRows: 14,
  tableMaxCols: 6,
  maxChars: 5000,
});
console.log(source.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "A股上市公司清单",
  range: "A1:K20",
  autoCrop: "all",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/preview_final.png`, new Uint8Array(await preview.arrayBuffer()));
