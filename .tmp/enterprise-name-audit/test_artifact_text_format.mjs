import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("测试");
sheet.getRange("A1:C1").format.numberFormat = "@";
sheet.getRange("A1").values = [["'911101085603509301"]];
sheet.getRange("B1").formulas = [['="911101"&"085603509301"']];
sheet.getRange("C1").values = [["\u200B911101085603509301"]];
sheet.getRange("A1:C1").format.columnWidth = 24;
await workbook.inspect({ kind: "table", range: "测试!A1:C1", include: "values,formulas" });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save("/tmp/artifact-text-format.xlsx");
await workbook.render({ sheetName: "测试", range: "A1:C1", scale: 2 }).then(async (image) => {
  await fs.writeFile("/tmp/artifact-text-format.png", Buffer.from(await image.arrayBuffer()));
});
