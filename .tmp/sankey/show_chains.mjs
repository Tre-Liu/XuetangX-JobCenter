import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load("/Users/liuhongzhe/Desktop/岗位产业环节匹配/产业环节.xlsx"));
const sheet = workbook.worksheets.getItemAt(0);
const values = sheet.getRange("A1:AB1047").values;
const headers = values[0].map(String);
const rows = values.slice(1).map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? null])));
for (const chainId of [19, 13, 15, 9]) {
  const chainRows = rows.filter((r) => Number(r.chain_id) === chainId);
  console.log(`\nCHAIN ${chainId} ${chainRows[0]?.chain_name}`);
  for (const stage of ["上游", "中游", "下游"]) {
    console.log(`${stage} (${chainRows.filter((r) => r.chain_node_stage === stage).length})`);
    console.log(chainRows.filter((r) => r.chain_node_stage === stage).map((r) => `${r.id}:${r.chain_node_name}`).join(" | "));
  }
}
