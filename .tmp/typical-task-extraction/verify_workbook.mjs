import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/01a056b0-f9d8-7391-9ead-f2406424a741/岗位典型工作任务与原子能力项.xlsx";
const expectedSheets = [
  "说明与规范",
  "能力项明细",
  "岗位覆盖",
  "能力类别缺口",
  "人培来源审计",
];

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

for (const sheetName of expectedSheets) {
  if (!workbook.worksheets.getItem(sheetName)) {
    throw new Error(`缺少工作表: ${sheetName}`);
  }
}

const courseDisplay = workbook.worksheets
  .getItem("能力项明细")
  .getRange("U1:U14")
  .values;
if (courseDisplay[0][0] !== "支撑课程（原表逐行）") {
  throw new Error(`课程列标题不正确: ${courseDisplay[0][0]}`);
}
if (!courseDisplay.slice(1).some((row) => String(row[0] ?? "").includes("\n"))) {
  throw new Error("课程列没有保留人培原表的多行边界");
}
const multilineCourseRows = workbook.worksheets
  .getItem("能力项明细")
  .getRange("U2:U2480")
  .values
  .filter((row) => String(row[0] ?? "").includes("\n"))
  .length;

const checks = [
  ["说明与规范", "A4:C29"],
  ["能力项明细", "A1:U12"],
  ["岗位覆盖", "A1:K12"],
  ["能力类别缺口", "A1:F12"],
  ["人培来源审计", "A1:G12"],
];

for (const [sheetName, range] of checks) {
  const inspection = await workbook.inspect({
    kind: "table",
    range: `${sheetName}!${range}`,
    include: "values,formulas",
    tableMaxRows: 12,
    tableMaxCols: 21,
    maxChars: 5000,
  });
  if (!inspection.ndjson || inspection.ndjson.trim().length === 0) {
    throw new Error(`工作表内容为空: ${sheetName}`);
  }
}

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 200 },
  summary: "reloaded workbook formula error scan",
  maxChars: 5000,
});

const errorLines = formulaErrors.ndjson
  .split("\n")
  .filter((line) => line.trim())
  .filter((line) => !line.includes('"matchCount":0'))
  .filter((line) => !line.includes("Cell search matched 0 entries."));

if (errorLines.length > 0) {
  throw new Error(`发现公式错误: ${errorLines.join("\n")}`);
}

console.log(JSON.stringify({
  workbookPath,
  sheets: expectedSheets,
  multilineCourseRows,
  formulaErrors: 0,
  status: "ok",
}, null, 2));
