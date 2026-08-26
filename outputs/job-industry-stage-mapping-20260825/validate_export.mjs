import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const path = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/job-industry-stage-mapping-20260825/岗位产业环节匹配结果.xlsx";
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(path));
const sheetNames = [];
for (let i = 0; i < 6; i++) sheetNames.push(wb.worksheets.getItemAt(i).name);
const expectedSheets = ["说明与统计", "岗位匹配状态", "关系明细", "未匹配岗位", "产业环节字典", "规则说明"];
if (JSON.stringify(sheetNames) !== JSON.stringify(expectedSheets)) {
  throw new Error(`sheet mismatch: ${JSON.stringify(sheetNames)}`);
}
const summary = wb.worksheets.getItem("说明与统计").getRange("A5:H6").values;
const expectedMetrics = [57552, 9642, 47910, 15128, 2695, 526, 216, 14912];
if (JSON.stringify(summary[1]) !== JSON.stringify(expectedMetrics)) {
  throw new Error(`metric mismatch: ${JSON.stringify(summary[1])}`);
}
const sheetRanges = (await wb.inspect({ kind: "sheet", include: "name,range", maxChars: 5000 })).ndjson;
const formulaErrors = (await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "exported workbook formula error scan",
  maxChars: 5000,
})).ndjson;
if (!formulaErrors.includes("matched 0 entries")) throw new Error(formulaErrors);
console.log(JSON.stringify({ sheetNames, summaryHeaders: summary[0], summaryMetrics: summary[1], sheetRanges, formulaErrors }, null, 2));
