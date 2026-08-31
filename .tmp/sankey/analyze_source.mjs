import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "/Users/liuhongzhe/Desktop/岗位产业环节匹配/产业环节.xlsx";
const outDir = "/private/tmp/sankey-source-preview";
await fs.mkdir(outDir, { recursive: true });
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const sheet = workbook.worksheets.getItemAt(0);
const values = sheet.getRange("A1:AB1047").values;
const headers = values[0].map((v) => String(v ?? ""));
const rows = values.slice(1).map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? null])));

const byChain = new Map();
const nodeNameKeys = new Map();
const nodeStageKeys = new Map();
const nodeStages = new Map();
for (const row of rows) {
  const chain = String(row.chain_name ?? "").trim();
  const stage = String(row.chain_node_stage ?? "").trim();
  const node = String(row.chain_node_name ?? "").trim();
  if (!byChain.has(chain)) byChain.set(chain, { chain_id: row.chain_id, 上游: 0, 中游: 0, 下游: 0, 其他: 0, total: 0 });
  const rec = byChain.get(chain);
  rec.total += 1;
  if (stage in rec) rec[stage] += 1; else rec.其他 += 1;
  const key = `${chain}\u0000${node}`;
  nodeNameKeys.set(key, (nodeNameKeys.get(key) ?? 0) + 1);
  const stageKey = `${key}\u0000${stage}`;
  nodeStageKeys.set(stageKey, (nodeStageKeys.get(stageKey) ?? 0) + 1);
  if (!nodeStages.has(key)) nodeStages.set(key, new Set());
  nodeStages.get(key).add(stage);
}

console.log(JSON.stringify({
  headers,
  rowCount: rows.length,
  chains: [...byChain.entries()].map(([chain_name, stats]) => ({ chain_name, ...stats })).sort((a, b) => Number(a.chain_id) - Number(b.chain_id)),
  duplicateNodeKeys: [...nodeNameKeys.entries()].filter(([, n]) => n > 1).slice(0, 50),
  exactDuplicateNodeStageCount: [...nodeStageKeys.values()].filter((n) => n > 1).length,
  namesInMultipleStagesCount: [...nodeStages.values()].filter((stages) => stages.size > 1).length,
  namesInMultipleStagesExamples: [...nodeStages.entries()].filter(([, stages]) => stages.size > 1).slice(0, 30).map(([key, stages]) => [key, [...stages]]),
  nonEmptyByField: Object.fromEntries(headers.map((h) => [h, rows.filter((r) => r[h] !== null && String(r[h]).trim() !== "").length])),
  missing: {
    chain_name: rows.filter((r) => !String(r.chain_name ?? "").trim()).length,
    chain_node_name: rows.filter((r) => !String(r.chain_node_name ?? "").trim()).length,
    chain_node_stage: rows.filter((r) => !String(r.chain_node_stage ?? "").trim()).length,
  },
}, null, 2));

const styles = await workbook.inspect({ kind: "computedStyle", sheetId: sheet.name, range: "A1:L8", maxChars: 6000 });
console.log("STYLES\n" + styles.ndjson);

try {
  const preview = await workbook.render({ sheetName: sheet.name, range: "A1:L30", scale: 1, format: "png" });
  await fs.writeFile(`${outDir}/source-top.png`, new Uint8Array(await preview.arrayBuffer()));
  console.log(`PREVIEW ${outDir}/source-top.png`);
} catch (error) {
  console.log(`PREVIEW_ERROR ${error?.message ?? String(error)}`);
}
