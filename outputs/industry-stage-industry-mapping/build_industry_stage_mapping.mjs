import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "outputs/industry-stage-industry-mapping";
const stageSourcePath = "output/industry-chain-stage-nodes/industry_chain_stage_nodes.csv";
const catalogPath = "V1.0需求（2026.6.11）/官方数据/国民经济行业分类_GBT4754-2017.xlsx";
const outputPath = `${outputDir}/19个产业链产业环节与国民经济行业小类匹配表.xlsx`;

const sourceCsv = await fs.readFile(stageSourcePath, "utf8");
const sourceWorkbook = await Workbook.fromCSV(sourceCsv, { sheetName: "产业环节源数据" });
const sourceSheet = sourceWorkbook.worksheets.getItem("产业环节源数据");
const sourceValues = sourceSheet.getUsedRange(true).values;
const sourceHeaders = sourceValues[0].map((value) => String(value ?? "").trim());
const sourceIndex = Object.fromEntries(sourceHeaders.map((header, index) => [header, index]));
const nodes = sourceValues.slice(1)
  .filter((row) => row[sourceIndex.node_id])
  .map((row) => ({
    nodeId: String(row[sourceIndex.node_id]).trim(),
    chain: String(row[sourceIndex.standard_chain]).trim(),
    stage: String(row[sourceIndex.stage]).trim(),
    nodeName: String(row[sourceIndex.node_name]).trim(),
  }));

if (nodes.length !== 57) throw new Error(`产业环节源数据应为57条，实际为${nodes.length}条`);
if (new Set(nodes.map((node) => node.chain)).size !== 19) throw new Error("标准产业链数量不是19条");

const catalogWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(catalogPath));
const catalogSheet = catalogWorkbook.worksheets.getItem("国民经济行业分类");
const catalogValues = catalogSheet.getUsedRange(true).values;
const catalogRows = catalogValues.slice(1)
  .filter((row) => String(row[3] ?? "").trim() === "小类")
  .map((row) => ({ code: String(row[0] ?? "").trim(), name: String(row[1] ?? "").trim() }));

const industryByCode = new Map();
for (const row of catalogRows) {
  if (!industryByCode.has(row.code)) industryByCode.set(row.code, row.name);
}

// 项目内行业分类工作簿存在1处重复代码及少量漏行；以下按国家统计局修订版标准原文校正。
const officialCorrections = {
  "0711": "陆地石油开采",
  "0712": "海洋石油开采",
  "3611": "汽柴油车整车制造",
  "3670": "汽车零部件及配件制造",
};
for (const [code, name] of Object.entries(officialCorrections)) industryByCode.set(code, name);

const codesByNode = {
  "node-001": ["3913", "3921", "3983", "6450", "6532"],
  "node-002": ["6512", "6531", "6550", "6560", "6599"],
  "node-003": ["6513", "6431", "6432", "6572", "6579", "7492"],
  "node-004": ["3421", "3422", "3425", "3484", "4011"],
  "node-005": ["3424", "3491", "3493", "3499", "3599", "4011"],
  "node-006": ["4320", "4330", "4360", "6531", "6540", "7452"],
  "node-007": ["7483", "7484", "7481", "3011", "3021", "3033", "3041"],
  "node-008": ["4710", "4811", "4812", "4813", "4814", "4819", "4852", "7010"],
  "node-009": ["4420", "4511", "4610", "4620", "7020", "7810", "7820"],
  "node-010": ["7340", "2710", "2761", "2762", "2770", "3583"],
  "node-011": ["2720", "2740", "2761", "3581", "3584", "3585", "6513", "6550"],
  "node-012": ["8411", "8421", "8491", "8492", "7244", "8512", "8514"],
  "node-013": ["3985", "3841", "3825", "3415", "3811"],
  "node-014": ["4415", "4416", "3849", "3821", "3823", "3824", "3829"],
  "node-015": ["4420", "4861", "7514", "7515"],
  "node-016": ["3973", "3976", "3982", "3983", "3989", "3922"],
  "node-017": ["3922", "3911", "3951", "3851", "3852", "3969", "6532"],
  "node-018": ["6432", "6532", "5272", "5274", "5279", "8131"],
  "node-019": ["0711", "0712", "0721", "0722", "1120", "2611", "2612", "2613", "2614"],
  "node-020": ["2511", "2519", "2651", "2652", "2653", "2659"],
  "node-021": ["2641", "2662", "2669", "2681", "2912", "2919", "2921", "2922", "2928"],
  "node-022": ["3670", "3620", "3660", "3453", "3962", "2928", "3982"],
  "node-023": ["3611", "3612", "3630", "3962", "6531"],
  "node-024": ["7111", "5413", "6432", "8111", "5261", "5263"],
  "node-025": ["0113", "0121", "0122", "0133", "0141", "0159", "0164", "0514"],
  "node-026": ["1311", "1331", "1353", "1371", "1392", "1411", "1441", "1462", "1512", "1523", "1530"],
  "node-027": ["5129", "5212", "5229", "5294", "6210", "6241", "6242"],
  "node-028": ["3911", "3912", "3921", "3832", "3833", "3976"],
  "node-029": ["6311", "6312", "6410", "6450", "6531", "6550"],
  "node-030": ["6450", "6512", "6531", "6540", "6560", "6490"],
  "node-031": ["3591", "4021", "7461", "4210", "4220", "5191"],
  "node-032": ["7721", "7722", "7723", "7724", "7726", "7727", "7514", "7516"],
  "node-033": ["7221", "7810", "7820", "4620", "7729", "7830"],
  "node-034": ["0913", "0932", "1092", "2614", "2811"],
  "node-035": ["2659", "2829", "3042", "3061", "3062", "3073", "3091", "3130", "3254", "3985"],
  "node-036": ["2928", "3393", "3484", "3670", "3985", "7513"],
  "node-037": ["3484", "3743", "3744", "3940", "3983", "4023"],
  "node-038": ["3741", "3742", "3749", "3963"],
  "node-039": ["4343", "5621", "5629", "5631", "5632", "5639", "7441"],
  "node-040": ["3453", "3444", "4011", "3982", "3983"],
  "node-041": ["3491", "3492", "3964", "6531"],
  "node-042": ["3491", "3492", "3964", "6531", "6540"],
  "node-043": ["3911", "3912", "6450", "6511", "6512", "6550"],
  "node-044": ["6513", "6519", "6531", "6560", "6599"],
  "node-045": ["6513", "6431", "6434", "6540", "6599", "7499"],
  "node-046": ["3985", "3562", "3563", "3569", "4028"],
  "node-047": ["6520", "3973", "3982", "3972", "3976"],
  "node-048": ["3911", "3922", "3962", "4011", "3975"],
  "node-049": ["0131", "2811", "2812", "2822", "2826", "2829"],
  "node-050": ["1711", "1712", "1713", "1722", "1742", "1751", "1752", "1761", "1762", "1781"],
  "node-051": ["1819", "1829", "1830", "1771", "1773", "5132", "5231", "5232"],
  "node-052": ["3985", "3052", "3976", "3982", "4040"],
  "node-053": ["3974", "3951", "3961", "3969", "3472"],
  "node-054": ["6572", "6579", "6422", "8730", "7492"],
  "node-055": ["6511", "6512", "3915", "6440", "7320"],
  "node-056": ["6513", "6519", "6531", "3915", "6440", "6439"],
  "node-057": ["6531", "6540", "6440", "7272", "6560", "6599"],
};

const sourceNodeIds = new Set(nodes.map((node) => node.nodeId));
const mappingNodeIds = Object.keys(codesByNode);
const missingNodeIds = nodes.filter((node) => !codesByNode[node.nodeId]).map((node) => node.nodeId);
const extraNodeIds = mappingNodeIds.filter((nodeId) => !sourceNodeIds.has(nodeId));
if (missingNodeIds.length || extraNodeIds.length) {
  throw new Error(`环节映射不完整：missing=${missingNodeIds.join(",")}; extra=${extraNodeIds.join(",")}`);
}

const mappingRows = [];
for (const node of nodes) {
  const codes = codesByNode[node.nodeId];
  if (!codes?.length) throw new Error(`${node.nodeId} 未匹配任何行业`);
  if (new Set(codes).size !== codes.length) throw new Error(`${node.nodeId} 存在重复行业代码`);
  for (const code of codes) {
    if (!/^\d{4}$/.test(code)) throw new Error(`${node.nodeId} 行业代码不是4位：${code}`);
    const industryName = industryByCode.get(code);
    if (!industryName) throw new Error(`${node.nodeId} 行业代码未在标准中找到：${code}`);
    mappingRows.push([node.chain, node.nodeName, industryName, code]);
  }
}

const coveredNodeKeys = new Set(mappingRows.map((row) => `${row[0]}|${row[1]}`));
if (coveredNodeKeys.size !== 57) throw new Error(`覆盖产业环节数应为57，实际为${coveredNodeKeys.size}`);

const workbook = Workbook.create();
const mappingSheet = workbook.worksheets.add("匹配表");
const coverageSheet = workbook.worksheets.add("完整性校验");
const notesSheet = workbook.worksheets.add("口径说明");

const colors = {
  navy: "#1F4E78",
  blue: "#2F75B5",
  paleBlue: "#DDEBF7",
  paleGreen: "#E2F0D9",
  paleRed: "#FCE4D6",
  paleGray: "#F2F2F2",
  lightGray: "#D9E2F3",
  white: "#FFFFFF",
  dark: "#203040",
  green: "#548235",
  red: "#C00000",
};

mappingSheet.showGridLines = false;
mappingSheet.getRange("A1:D1").values = [["产业链", "产业环节", "匹配行业", "行业代码"]];
mappingSheet.getRange(`A2:D${mappingRows.length + 1}`).values = mappingRows;
mappingSheet.tables.add(`A1:D${mappingRows.length + 1}`, true, "IndustryStageMapping").style = "TableStyleMedium2";
mappingSheet.freezePanes.freezeRows(1);
mappingSheet.freezePanes.freezeColumns(2);
mappingSheet.getRange("A1:D1").format = {
  fill: colors.navy,
  font: { bold: true, color: colors.white, size: 11 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
mappingSheet.getRange(`A2:D${mappingRows.length + 1}`).format = {
  font: { size: 10, color: colors.dark },
  verticalAlignment: "center",
  wrapText: true,
};
mappingSheet.getRange(`D2:D${mappingRows.length + 1}`).format = {
  numberFormat: "@",
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
mappingSheet.getRange("1:1").format.rowHeight = 30;
mappingSheet.getRange(`2:${mappingRows.length + 1}`).format.rowHeight = 28;
const mappingWidths = [220, 240, 230, 90];
mappingWidths.forEach((width, col) => mappingSheet.getRangeByIndexes(0, col, mappingRows.length + 1, 1).format.columnWidthPx = width);

let previousChain = null;
mappingRows.forEach((row, index) => {
  if (previousChain !== null && row[0] !== previousChain) {
    mappingSheet.getRange(`A${index + 2}:D${index + 2}`).format.borders = {
      top: { style: "medium", color: colors.blue },
    };
  }
  previousChain = row[0];
});

coverageSheet.showGridLines = false;
coverageSheet.getRange("A1:F1").merge();
coverageSheet.getRange("A1:F1").values = [["19个产业链 / 57个产业环节完整性校验"]];
coverageSheet.getRange("A1:F1").format = {
  fill: colors.navy,
  font: { bold: true, color: colors.white, size: 14 },
  horizontalAlignment: "left",
  verticalAlignment: "center",
};
coverageSheet.getRange("A2:F2").values = [["环节总数", null, "已覆盖", null, "缺失", null]];
coverageSheet.getRange("B2").formulas = [["=COUNTA(D5:D61)"]];
coverageSheet.getRange("D2").formulas = [["=COUNTIF(F5:F61,\"已覆盖\")"]];
coverageSheet.getRange("F2").formulas = [["=COUNTIF(F5:F61,\"缺失\")"]];
for (const label of ["A2", "C2", "E2"]) {
  coverageSheet.getRange(label).format = {
    fill: colors.paleBlue,
    font: { bold: true, color: colors.navy },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
}
for (const value of ["B2", "D2", "F2"]) {
  coverageSheet.getRange(value).format = {
    fill: colors.white,
    font: { bold: true, color: colors.green, size: 14 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.lightGray },
  };
}
coverageSheet.getRange("A4:F4").values = [["序号", "产业链", "阶段", "产业环节", "匹配行业行数", "覆盖状态"]];
coverageSheet.getRange("A5:D61").values = nodes.map((node, index) => [index + 1, node.chain, node.stage, node.nodeName]);
const mappingLastRow = mappingRows.length + 1;
coverageSheet.getRange("E5:E61").formulas = nodes.map((_, index) => [
  `=COUNTIFS('匹配表'!$A$2:$A$${mappingLastRow},B${index + 5},'匹配表'!$B$2:$B$${mappingLastRow},D${index + 5})`,
]);
coverageSheet.getRange("F5:F61").formulas = nodes.map((_, index) => [`=IF(E${index + 5}>=1,"已覆盖","缺失")`]);
coverageSheet.tables.add("A4:F61", true, "CoverageCheck").style = "TableStyleMedium4";
coverageSheet.freezePanes.freezeRows(4);
coverageSheet.freezePanes.freezeColumns(2);
coverageSheet.getRange("A4:F4").format = {
  fill: colors.blue,
  font: { bold: true, color: colors.white, size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
coverageSheet.getRange("A5:F61").format = { font: { size: 9 }, verticalAlignment: "center", wrapText: true };
coverageSheet.getRange("A5:A61").format.horizontalAlignment = "center";
coverageSheet.getRange("C5:C61").format.horizontalAlignment = "center";
coverageSheet.getRange("E5:F61").format.horizontalAlignment = "center";
coverageSheet.getRange("F5:F61").conditionalFormats.add("containsText", {
  text: "已覆盖",
  format: { fill: colors.paleGreen, font: { color: colors.green, bold: true } },
});
coverageSheet.getRange("F5:F61").conditionalFormats.add("containsText", {
  text: "缺失",
  format: { fill: colors.paleRed, font: { color: colors.red, bold: true } },
});
coverageSheet.getRange("A63:F63").merge();
coverageSheet.getRange("A63:F63").values = [["校验规则：每个源产业环节在“匹配表”中至少出现1行；同一产业环节匹配多个行业时按行拆分。"]];
coverageSheet.getRange("A63:F63").format = { fill: colors.paleGray, font: { italic: true, color: colors.dark, size: 9 }, wrapText: true };
coverageSheet.getRange("1:1").format.rowHeight = 34;
coverageSheet.getRange("2:2").format.rowHeight = 34;
coverageSheet.getRange("4:4").format.rowHeight = 30;
coverageSheet.getRange("5:61").format.rowHeight = 30;
coverageSheet.getRange("63:63").format.rowHeight = 32;
const coverageWidths = [60, 220, 60, 240, 90, 90];
coverageWidths.forEach((width, col) => coverageSheet.getRangeByIndexes(0, col, 63, 1).format.columnWidthPx = width);

notesSheet.showGridLines = false;
notesSheet.getRange("A1:C1").merge();
notesSheet.getRange("A1:C1").values = [["匹配口径与数据来源"]];
notesSheet.getRange("A1:C1").format = {
  fill: colors.navy,
  font: { bold: true, color: colors.white, size: 14 },
  horizontalAlignment: "left",
  verticalAlignment: "center",
};
notesSheet.getRange("A3:C3").values = [["项目", "说明", "来源/链接"]];
const noteRows = [
  ["使用标准", "GB/T 4754—2017《国民经济行业分类》（按第1号修改单修订）", "https://www.stats.gov.cn/sj/tjbz/gmjjhyfl/202302/P020230213400314380798.pdf"],
  ["标准状态", "截至2026-08-06仍为现行标准；小类采用4位阿拉伯数字代码", "https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=A703F0E23DD165A5A1318679F312D158"],
  ["产业环节来源", "项目已标准化的19条产业链、57个产业环节", stageSourcePath],
  ["代码字典底稿", "项目内国民经济行业分类工作簿，并按国家统计局修订版标准原文校正", catalogPath],
  ["匹配原则", "按产业环节覆盖的核心对外经济活动建立多对多关系；宽口径环节匹配多个小类", "国家统计局：按单位主要活动确定行业归属"],
  ["拆行规则", "同一产业环节匹配多个行业时，每个“产业环节—行业小类”关系单独占一行", ""],
  ["使用边界", "本表是产业环节与行业小类的关联字典，不代表某家企业的唯一行业归属；企业归类仍需按增加值、营业收入或从业人员等判断主要活动", "https://www.stats.gov.cn/hd/cjwtjd/202302/t20230207_1902279.html"],
  ["完整性结果", `19条产业链、57个产业环节，全部至少匹配1个行业；共形成${mappingRows.length}条关联记录`, "见“完整性校验”工作表"],
  ["生成日期", "2026-08-06", "Asia/Shanghai"],
];
notesSheet.getRange(`A4:C${noteRows.length + 3}`).values = noteRows;
notesSheet.tables.add(`A3:C${noteRows.length + 3}`, true, "MethodNotes").style = "TableStyleMedium9";
notesSheet.freezePanes.freezeRows(3);
notesSheet.getRange("A3:C3").format = {
  fill: colors.blue,
  font: { bold: true, color: colors.white, size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
notesSheet.getRange(`A4:C${noteRows.length + 3}`).format = { font: { size: 10 }, verticalAlignment: "top", wrapText: true };
notesSheet.getRange(`A4:A${noteRows.length + 3}`).format = { fill: colors.paleBlue, font: { bold: true, color: colors.navy }, verticalAlignment: "top" };
notesSheet.getRange("1:1").format.rowHeight = 34;
notesSheet.getRange("3:3").format.rowHeight = 30;
notesSheet.getRange(`4:${noteRows.length + 3}`).format.rowHeight = 54;
[130, 430, 500].forEach((width, col) => notesSheet.getRangeByIndexes(0, col, noteRows.length + 3, 1).format.columnWidthPx = width);

const mappingCheck = await workbook.inspect({
  kind: "table",
  range: "匹配表!A1:D16",
  include: "values,formulas",
  tableMaxRows: 16,
  tableMaxCols: 4,
  maxChars: 9000,
});
console.log(mappingCheck.ndjson);
const coverageCheck = await workbook.inspect({
  kind: "table",
  range: "完整性校验!A1:F12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 6,
  maxChars: 9000,
});
console.log(coverageCheck.ndjson);
const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
  maxChars: 5000,
});
console.log(formulaErrors.ndjson);

const previewSpecs = [
  ["匹配表", "A1:D55", "preview_mapping_top.png", 1.0],
  ["匹配表", `A${Math.max(2, mappingLastRow - 54)}:D${mappingLastRow}`, "preview_mapping_bottom.png", 1.0],
  ["完整性校验", "A1:F63", "preview_coverage.png", 1.0],
  ["口径说明", `A1:C${noteRows.length + 3}`, "preview_notes.png", 1.0],
];
for (const [sheetName, range, filename, scale] of previewSpecs) {
  const rendered = await workbook.render({ sheetName, range, scale, format: "png" });
  await fs.writeFile(`${outputDir}/${filename}`, new Uint8Array(await rendered.arrayBuffer()));
}

await fs.mkdir(outputDir, { recursive: true });
const outputFile = await SpreadsheetFile.exportXlsx(workbook);
await outputFile.save(outputPath);

const savedWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
const savedMappingSheet = savedWorkbook.worksheets.getItem("匹配表");
const savedMappingValues = savedMappingSheet.getUsedRange(true).values;
const savedRows = savedMappingValues.slice(1).filter((row) => row[0]);
const invalidSavedCodes = savedRows.filter((row) => !/^\d{4}$/.test(String(row[3] ?? "")));
const savedNodeCount = new Set(savedRows.map((row) => `${row[0]}|${row[1]}`)).size;
const leadingZeroCodes = savedRows.filter((row) => String(row[3]).startsWith("0")).map((row) => String(row[3]));
if (savedRows.length !== mappingRows.length) throw new Error("导出后关联记录行数发生变化");
if (savedNodeCount !== 57) throw new Error(`导出后仅覆盖${savedNodeCount}个产业环节`);
if (invalidSavedCodes.length) throw new Error(`导出后存在非4位行业代码：${JSON.stringify(invalidSavedCodes.slice(0, 5))}`);
if (!leadingZeroCodes.includes("0711") || !leadingZeroCodes.includes("0712") || !leadingZeroCodes.includes("0113")) {
  throw new Error(`前导0代码未正确保留：${leadingZeroCodes.join(",")}`);
}

const savedCoverage = savedWorkbook.worksheets.getItem("完整性校验").getRange("A1:F12").values;
if (savedCoverage[1][1] !== 57 || savedCoverage[1][3] !== 57 || savedCoverage[1][5] !== 0) {
  throw new Error(`导出后完整性公式结果异常：${JSON.stringify(savedCoverage[1])}`);
}

console.log(JSON.stringify({
  outputPath,
  chainCount: new Set(nodes.map((node) => node.chain)).size,
  nodeCount: nodes.length,
  relationCount: mappingRows.length,
  minMatchesPerNode: Math.min(...nodes.map((node) => codesByNode[node.nodeId].length)),
  maxMatchesPerNode: Math.max(...nodes.map((node) => codesByNode[node.nodeId].length)),
  leadingZeroCodesPreserved: [...new Set(leadingZeroCodes)].sort(),
}));
