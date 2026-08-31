import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const wb = await SpreadsheetFile.importXlsx(await FileBlob.load("/Users/liuhongzhe/Desktop/岗位产业环节匹配/产业环节.xlsx"));
const sheet = wb.worksheets.getItemAt(0);
const values = sheet.getRange("A1:AB1047").values;
const headers = values[0].map(String);
const rows = values.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])));
for (const [chainId, chainRows] of [...Map.groupBy(rows.filter((row) => !String(row.source_id ?? "").trim()), (row) => row.chain_id).entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
  console.log(`${chainId} ${chainRows[0].chain_name}`);
  for (const row of chainRows.sort((a, b) => ({ 上游: 1, 中游: 2, 下游: 3 }[a.chain_node_stage] - { 上游: 1, 中游: 2, 下游: 3 }[b.chain_node_stage]))) {
    console.log(`  ${row.chain_node_stage} ${row.id} ${row.chain_node_name}`);
  }
}
