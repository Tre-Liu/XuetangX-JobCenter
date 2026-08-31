import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const outputPath = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/01a056a7-547c-7590-be55-84c913d7762c/产业环节上下游及桑基图关系.xlsx";
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
const sheetNames = workbook.worksheets.items.map((sheet) => sheet.name);
if (sheetNames.length !== 1 || sheetNames[0] !== "桑基图关系") throw new Error(`工作表不符合单表要求：${sheetNames.join(",")}`);
const values = workbook.worksheets.getItem("桑基图关系").getRange("A1:J792").values;
const headers = values[0].map(String);
const rows = values.slice(1).filter((row) => row.some((value) => value !== null && String(value).trim() !== "")).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])));
const chains = Map.groupBy(rows, (row) => String(row.chain_id));
const edgeKeys = new Set();
const nodeKeys = new Set();
let duplicateEdges = 0;
let invalidStages = 0;
let crossChain = 0;
let sameName = 0;
const normalize = (value) => String(value ?? "").toUpperCase().replace(/[（(].*?[）)]/g, "").replace(/[^0-9A-Z\u4E00-\u9FFF]+/g, "");
for (const row of rows) {
  const edgeKey = `${row.source_node_key}>${row.target_node_key}`;
  if (edgeKeys.has(edgeKey)) duplicateEdges += 1;
  edgeKeys.add(edgeKey);
  nodeKeys.add(String(row.source_node_key));
  nodeKeys.add(String(row.target_node_key));
  if (!["上游>中游", "中游>下游"].includes(`${row.source_stage}>${row.target_stage}`)) invalidStages += 1;
  if (String(row.chain_id) !== String(row.source_node_key).split("-")[0] || String(row.chain_id) !== String(row.target_node_key).split("-")[0]) crossChain += 1;
  if (normalize(row.source_name) === normalize(row.target_name)) sameName += 1;
}
const formulaErrors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, maxChars: 3000 });
const result = { sheets: sheetNames.length, sheetName: sheetNames[0], chains: chains.size, relations: rows.length, coveredNodes: nodeKeys.size, duplicateEdges, invalidStages, crossChain, sameNameDirectEdges: sameName, formulaErrors: formulaErrors.ndjson.includes("matched 0 entries") ? 0 : formulaErrors.ndjson };
if (chains.size !== 19 || rows.length !== 791 || nodeKeys.size !== 1046 || duplicateEdges || invalidStages || crossChain || sameName || result.formulaErrors !== 0) throw new Error(JSON.stringify(result));
console.log(JSON.stringify(result, null, 2));
