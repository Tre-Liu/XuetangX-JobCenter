import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const inputPath = "/Users/liuhongzhe/Desktop/岗位产业环节匹配/产业环节.xlsx";
const outputDir = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/01a056a7-547c-7590-be55-84c913d7762c";
const outputPath = path.join(outputDir, "产业环节上下游及桑基图关系.xlsx");
const previewPath = "/private/tmp/sankey-simple-preview.png";
const stageCode = { 上游: "U", 中游: "M", 下游: "D" };
const relationOrder = { "上游→中游": 1, "中游→下游": 2 };
const text = (value) => String(value ?? "").trim();

const semanticGroups = [
  ["材料", "金属", "合金", "化工", "原料", "矿", "纤维", "面料", "晶圆", "硅"],
  ["芯片", "半导体", "元器件", "器件", "零部件", "组件", "模组", "模块", "主板", "传感器", "控制器", "电池"],
  ["设备", "装备", "机械", "机床", "仪器", "仪表", "机器人", "无人机", "终端", "家电"],
  ["制造", "生产", "加工", "封装", "测试", "组装", "集成", "施工", "建设", "开发"],
  ["软件", "系统", "平台", "算法", "模型", "数据库", "云", "数据", "算力", "网络", "通信"],
  ["运营", "运维", "服务", "租赁", "物流", "销售", "回收", "处理", "治理", "养护"],
  ["消费", "家庭", "个人", "教育", "娱乐", "游戏", "可穿戴", "手机", "平板", "电视"],
  ["建筑", "城市", "地产", "住宅", "公路", "轨道", "园林", "装饰", "物业"],
  ["能源", "电力", "发电", "光伏", "风电", "水电", "火电", "储能", "电网", "天然气"],
  ["医药", "药", "疫苗", "诊断", "医疗", "健康", "生物", "器械"],
  ["显示", "OLED", "LCD", "LED", "光学", "镜头", "VR", "AR", "投影", "面板"],
];

function normalize(value) {
  return text(value).toUpperCase().replace(/[（(].*?[）)]/g, "").replace(/[^0-9A-Z\u4E00-\u9FFF]+/g, "");
}

function nodeKey(row) {
  return `${row.chain_id}-${stageCode[row.chain_node_stage]}-${row.id}`;
}

function ngrams(value) {
  const s = normalize(value);
  const result = new Set();
  for (let i = 0; i < s.length - 1; i += 1) result.add(s.slice(i, i + 2));
  return result;
}

function charSet(value) {
  return new Set([...normalize(value)]);
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function tags(value) {
  const normalized = normalize(value);
  return semanticGroups.map((words, index) => words.some((word) => normalized.includes(normalize(word))) ? index : -1).filter((index) => index >= 0);
}

function pairScore(left, right) {
  const leftName = normalize(left.chain_node_name);
  const rightName = normalize(right.chain_node_name);
  if (!leftName || !rightName || leftName === rightName) return -1e9;
  const leftTags = tags(leftName);
  const rightTags = tags(rightName);
  const sharedTags = leftTags.filter((tag) => rightTags.includes(tag)).length;
  const substring = leftName.includes(rightName) || rightName.includes(leftName);
  return jaccard(ngrams(leftName), ngrams(rightName)) * 70
    + jaccard(charSet(leftName), charSet(rightName)) * 25
    + sharedTags * 14
    + (substring ? 15 : 0)
    + (!text(left.source_id) && !text(right.source_id) ? 8 : 0);
}

function scarcitySort(nodes, candidates, leftIsSmaller) {
  return [...nodes].sort((a, b) => {
    const scores = (node) => candidates.map((candidate) => leftIsSmaller ? pairScore(node, candidate) : pairScore(candidate, node)).filter((score) => score > -1e8).sort((x, y) => y - x);
    const aScores = scores(a);
    const bScores = scores(b);
    const aGap = (aScores[0] ?? -1e9) - (aScores[1] ?? -1e9);
    const bGap = (bScores[0] ?? -1e9) - (bScores[1] ?? -1e9);
    return bGap - aGap || Number(a.id) - Number(b.id);
  });
}

function minimalCover(leftNodes, rightNodes, relationType) {
  const leftIsSmaller = leftNodes.length <= rightNodes.length;
  const smaller = leftIsSmaller ? leftNodes : rightNodes;
  const larger = leftIsSmaller ? rightNodes : leftNodes;
  const matchedLargeToSmall = new Map();

  const orientedScore = (small, large) => leftIsSmaller ? pairScore(small, large) : pairScore(large, small);
  function tryMatch(small, visited) {
    const ranked = larger
      .map((large) => ({ large, score: orientedScore(small, large) }))
      .filter((item) => item.score > -1e8)
      .sort((a, b) => b.score - a.score || Number(a.large.id) - Number(b.large.id));
    for (const { large } of ranked) {
      const key = nodeKey(large);
      if (visited.has(key)) continue;
      visited.add(key);
      const previous = matchedLargeToSmall.get(key);
      if (!previous || tryMatch(previous, visited)) {
        matchedLargeToSmall.set(key, small);
        return true;
      }
    }
    return false;
  }

  for (const small of scarcitySort(smaller, larger, leftIsSmaller)) {
    if (!tryMatch(small, new Set())) throw new Error(`无法覆盖节点：${small.chain_name}/${small.chain_node_name}`);
  }

  const edges = [];
  const leftDegree = new Map(leftNodes.map((node) => [nodeKey(node), 0]));
  const rightDegree = new Map(rightNodes.map((node) => [nodeKey(node), 0]));
  for (const [largeKey, small] of matchedLargeToSmall.entries()) {
    const large = larger.find((node) => nodeKey(node) === largeKey);
    const left = leftIsSmaller ? small : large;
    const right = leftIsSmaller ? large : small;
    edges.push({ left, right, relationType });
    leftDegree.set(nodeKey(left), leftDegree.get(nodeKey(left)) + 1);
    rightDegree.set(nodeKey(right), rightDegree.get(nodeKey(right)) + 1);
  }

  const remainingLarge = larger.filter((node) => !matchedLargeToSmall.has(nodeKey(node))).sort((a, b) => Number(a.id) - Number(b.id));
  for (const large of remainingLarge) {
    const candidates = smaller
      .map((small) => {
        const left = leftIsSmaller ? small : large;
        const right = leftIsSmaller ? large : small;
        const degree = leftIsSmaller ? leftDegree.get(nodeKey(small)) : rightDegree.get(nodeKey(small));
        return { small, score: pairScore(left, right) - degree * 16 };
      })
      .filter((item) => item.score > -1e8)
      .sort((a, b) => b.score - a.score || Number(a.small.id) - Number(b.small.id));
    if (!candidates.length) throw new Error(`没有可用补位节点：${large.chain_name}/${large.chain_node_name}`);
    const small = candidates[0].small;
    const left = leftIsSmaller ? small : large;
    const right = leftIsSmaller ? large : small;
    edges.push({ left, right, relationType });
    leftDegree.set(nodeKey(left), leftDegree.get(nodeKey(left)) + 1);
    rightDegree.set(nodeKey(right), rightDegree.get(nodeKey(right)) + 1);
  }
  return edges;
}

const sourceWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const sourceSheet = sourceWorkbook.worksheets.getItemAt(0);
const values = sourceSheet.getRange("A1:AB1047").values;
const headers = values[0].map(text);
const rows = values.slice(1).map((rowValues) => {
  const row = Object.fromEntries(headers.map((header, index) => [header, rowValues[index] ?? null]));
  row.id = text(row.id);
  row.chain_id = text(row.chain_id);
  row.chain_name = text(row.chain_name);
  row.chain_node_name = text(row.chain_node_name);
  row.chain_node_stage = text(row.chain_node_stage);
  row.node_key = nodeKey(row);
  return row;
});

const byChain = Map.groupBy(rows, (row) => row.chain_id);
const edgeObjects = [];
for (const [, chainRows] of [...byChain.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
  const upstream = chainRows.filter((row) => row.chain_node_stage === "上游");
  const midstream = chainRows.filter((row) => row.chain_node_stage === "中游");
  const downstream = chainRows.filter((row) => row.chain_node_stage === "下游");
  edgeObjects.push(...minimalCover(upstream, midstream, "上游→中游"));
  edgeObjects.push(...minimalCover(midstream, downstream, "中游→下游"));
}
edgeObjects.sort((a, b) => Number(a.left.chain_id) - Number(b.left.chain_id) || relationOrder[a.relationType] - relationOrder[b.relationType] || Number(a.left.id) - Number(b.left.id) || Number(a.right.id) - Number(b.right.id));
const edges = edgeObjects.map(({ left, right, relationType }) => [
  left.chain_id, left.chain_name, left.node_key, left.chain_node_name, left.chain_node_stage,
  right.node_key, right.chain_node_name, right.chain_node_stage, relationType, 1,
]);

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("桑基图关系");
sheet.showGridLines = false;
sheet.getRange("A1:J1").values = [["chain_id", "产业链名称", "source_node_key", "source_name", "source_stage", "target_node_key", "target_name", "target_stage", "relation_type", "value"]];
sheet.getRange(`A2:J${edges.length + 1}`).values = edges;
sheet.getRange("A1:J1").format = { fill: "#2563EB", font: { bold: true, color: "#FFFFFF", fontSize: 10, typeface: "Microsoft YaHei" }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: "#1D4ED8" } };
sheet.getRange("A1:J1").format.rowHeight = 28;
sheet.getRange(`A2:J${edges.length + 1}`).format = { font: { color: "#1F2937", fontSize: 10, typeface: "Microsoft YaHei" }, verticalAlignment: "center" };
sheet.getRange(`E2:E${edges.length + 1}`).format.horizontalAlignment = "center";
sheet.getRange(`H2:J${edges.length + 1}`).format.horizontalAlignment = "center";
sheet.getRange(`J2:J${edges.length + 1}`).format.numberFormat = "0";
const widths = [10, 34, 20, 38, 12, 20, 38, 12, 16, 10];
widths.forEach((width, index) => sheet.getRange(`${String.fromCharCode(65 + index)}:${String.fromCharCode(65 + index)}`).format.columnWidth = width);
sheet.tables.add(`A1:J${edges.length + 1}`, true, "SankeyRelationTable").style = "TableStyleMedium2";
sheet.freezePanes.freezeRows(1);
sheet.freezePanes.freezeColumns(2);

const check = await workbook.inspect({ kind: "table", sheetId: "桑基图关系", range: "A1:J12", include: "values,formulas", tableMaxRows: 12, tableMaxCols: 10, maxChars: 8000 });
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, maxChars: 3000 });
console.log(`TABLE_CHECK\n${check.ndjson}`);
console.log(`FORMULA_ERRORS\n${errors.ndjson}`);
const preview = await workbook.render({ sheetName: "桑基图关系", range: "A1:J24", scale: 1, format: "png" });
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, sheets: 1, chains: byChain.size, sourceNodes: rows.length, relations: edges.length, previewPath }, null, 2));
