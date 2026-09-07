import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程";
const previewRoot = path.join(root, ".tmp/filename-repair/previews");
await fs.mkdir(previewRoot, { recursive: true });

const specs = [
  {
    file: path.join(root, "outputs/01a056b0-f9d8-7391-9ead-f2406424a741/岗位典型工作任务与原子能力项.xlsx"),
    sheets: [
      ["说明与规范", "A1:C29"],
      ["能力项明细", "A1:U12"],
      ["岗位覆盖", "A1:K12"],
      ["能力类别缺口", "A1:F12"],
      ["人培来源审计", "A1:I12"],
    ],
  },
  {
    file: path.join(root, "outputs/typical-task-full-20260902/岗位典型工作任务与原子能力项_参考文件与总览.xlsx"),
    sheets: [
      ["说明与统计", "A1:C29"],
      ["参考文件-任务", "A1:R12"],
      ["参考文件-能力项", "A1:Y12"],
      ["岗位总览", "A1:L12"],
      ["参考数据缺口", "A1:G12"],
      ["人培来源审计", "A1:H12"],
    ],
  },
];

const reports = [];
for (const [workbookIndex, spec] of specs.entries()) {
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(spec.file));
  const sheetInfo = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 12000 });
  const sheetNames = String(sheetInfo.ndjson)
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line).name)
    .filter(Boolean);
  const expected = spec.sheets.map(([name]) => name);
  if (JSON.stringify(sheetNames) !== JSON.stringify(expected)) {
    throw new Error(`工作表不一致: ${path.basename(spec.file)} ${JSON.stringify(sheetNames)}`);
  }

  const machineNames = await workbook.inspect({
    kind: "match",
    searchTerm: "(?:^|/)(?:[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}|[0-9A-F]{20,}_[0-9A-F]{6,}_[0-9A-F]{4,}|virtual_attach_file)\\.pdf$",
    options: { useRegex: true, maxResults: 200 },
    summary: "machine filename scan",
    maxChars: 6000,
  });
  const machineText = String(machineNames.ndjson);
  if (!machineText.includes("Cell search matched 0 entries.") && !machineText.includes('"matchCount":0')) {
    throw new Error(`仍含机器文件名: ${path.basename(spec.file)} ${machineText.slice(0, 1000)}`);
  }

  const formulaErrors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 200 },
    summary: "formula error scan",
    maxChars: 6000,
  });
  const formulaText = String(formulaErrors.ndjson);
  if (!formulaText.includes("Cell search matched 0 entries.") && !formulaText.includes('"matchCount":0')) {
    throw new Error(`发现公式错误: ${path.basename(spec.file)} ${formulaText.slice(0, 1000)}`);
  }

  for (const [sheetIndex, [sheetName, range]] of spec.sheets.entries()) {
    const inspection = await workbook.inspect({
      kind: "table",
      sheetId: sheetName,
      range,
      include: "values,formulas",
      tableMaxRows: 12,
      tableMaxCols: 25,
      maxChars: 16000,
    });
    if (!String(inspection.ndjson).trim()) throw new Error(`空工作表: ${sheetName}`);
    const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
    const previewName = `${workbookIndex + 1}-${String(sheetIndex + 1).padStart(2, "0")}-${sheetName}.png`;
    await fs.writeFile(
      path.join(previewRoot, previewName),
      new Uint8Array(await preview.arrayBuffer()),
    );
  }
  reports.push({
    file: spec.file,
    sheets: expected,
    machineFilenameMatches: 0,
    formulaErrors: 0,
  });
  if (global.gc) global.gc();
}

console.log(JSON.stringify({ status: "ok", reports, previewRoot }, null, 2));
