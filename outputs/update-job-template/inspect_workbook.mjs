import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "/Users/liuhongzhe/Documents/专业建设/岗位详情字段爬取模板.xlsx";
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

for (const range of [
  "基本信息!A1:G30",
  "典型工作任务!A1:G18",
  "岗位能力项!A1:G18",
  "岗位画像详情!A1:G36",
  "证书详情!A1:G24",
  "企业详情!A1:G32",
]) {
  const inspected = await workbook.inspect({
    kind: "table",
    range,
    include: "values,formulas,styles",
    tableMaxRows: 40,
    tableMaxCols: 10,
  });
  console.log(`RANGE ${range}`);
  console.log(inspected.ndjson);
}
