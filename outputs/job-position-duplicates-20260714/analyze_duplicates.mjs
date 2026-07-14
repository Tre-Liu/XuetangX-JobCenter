import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const source = "/Users/liuhongzhe/Desktop/学堂/专业建设/需求/V1.0/数据搬移/job_position.xlsx";
const outDir = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/job-position-duplicates-20260714";

function cleanText(value) {
  return String(value ?? "").normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

function normalizedName(value) {
  return cleanText(value)
    .replace(/[‐‑‒–—―-]/g, "-")
    .replace(/[·•・]/g, "")
    .replace(/[（）()【】\[\]{}，,。；;：:、_]/g, "")
    .replace(/\/+/g, "/");
}

function baseName(value) {
  let s = normalizedName(value);
  s = s.replace(/(高级|中级|初级|资深|助理)$/g, "");
  s = s.replace(/(高级|中级|初级|资深|助理)/g, "");
  const suffixes = [
    "工程技术人员", "工程师", "开发人员", "技术人员", "工作人员", "从业人员", "操作人员",
    "开发者", "设计师", "分析师", "咨询师", "顾问", "专员", "管理员", "技术员", "操作员",
    "技师", "师", "员"
  ];
  for (const suffix of suffixes) {
    if (s.length > suffix.length + 1 && s.endsWith(suffix)) {
      s = s.slice(0, -suffix.length);
      break;
    }
  }
  return s;
}

const splitBeforeMergeNames = new Set([
  "系统工程师",
  "技术总监",
  "技术经理",
  "项目经理",
  "项目主管",
  "项目助理",
  "项目总监",
  "测试工程师",
  "风险控制",
  "医学顾问",
]);

function grams(value, n = 2) {
  const s = cleanText(value).replace(/[^\p{L}\p{N}]+/gu, "");
  const out = new Set();
  if (s.length < n) return new Set(s ? [s] : []);
  for (let i = 0; i <= s.length - n; i += 1) out.add(s.slice(i, i + n));
  return out;
}

function jaccard(a, b) {
  const ga = grams(a);
  const gb = grams(b);
  if (!ga.size && !gb.size) return 1;
  let inter = 0;
  for (const g of ga) if (gb.has(g)) inter += 1;
  return inter / (ga.size + gb.size - inter || 1);
}

function pairwiseAverage(rows, field) {
  if (rows.length < 2) return 1;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      sum += jaccard(rows[i][field], rows[j][field]);
      count += 1;
    }
  }
  return count ? sum / count : 0;
}

function uniq(rows, field) {
  return [...new Set(rows.map((row) => row[field]).filter((v) => v !== null && v !== undefined && v !== ""))];
}

function exactDecision(rows) {
  const codes = uniq(rows, "primary_occupation_code");
  const occupations = uniq(rows, "primary_occupation_name");
  const levels = uniq(rows, "job_level");
  const avgSummarySimilarity = pairwiseAverage(rows, "work_summary");
  const avgRequirementSimilarity = pairwiseAverage(rows, "requirements_text");
  if (splitBeforeMergeNames.has(rows[0].position_name)) {
    return {
      decision: "需拆分后合并",
      reason: "名称过于宽泛，当前记录已跨越不同专业对象或岗位层级；应先补充行业/职能限定词，再分别归并。",
      avgSummarySimilarity,
      avgRequirementSimilarity,
    };
  }
  if (codes.length === 1 && levels.length <= 1) {
    return {
      decision: "可直接合并",
      reason: "岗位名称完全一致且职业分类一致；建议保留一个标准岗位，原记录转为来源/产业关联。",
      avgSummarySimilarity,
      avgRequirementSimilarity,
    };
  }
  if (codes.length === 0 && occupations.length <= 1) {
    return {
      decision: "条件合并（先修分类）",
      reason: "名称完全一致，但缺少职业分类依据；需先核对职责文本，确认同一职业后再合并。",
      avgSummarySimilarity,
      avgRequirementSimilarity,
    };
  }
  return {
    decision: "条件合并（先修分类）",
    reason: "岗位名称完全一致，但职业分类存在冲突；优先核对并修正分类，再合并标准岗位，来源产业关系必须保留。",
    avgSummarySimilarity,
    avgRequirementSimilarity,
  };
}

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const sheet = workbook.worksheets.getItemAt(0);
const values = sheet.getUsedRange(true).values;
const headers = values[0].map(String);
const rows = values.slice(1).map((valuesRow, index) => {
  const row = Object.fromEntries(headers.map((h, i) => [h, valuesRow[i]]));
  row.source_row = index + 2;
  return row;
});

const catalogWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load("/Users/liuhongzhe/Desktop/学堂/专业建设/需求/V1.0/数据搬移/industry_catalogs.xlsx"));
const catalogValues = catalogWorkbook.worksheets.getItemAt(0).getUsedRange(true).values;
const catalogHeaders = catalogValues[0].map(String);
const catalogRows = catalogValues.slice(1).map((valuesRow) => Object.fromEntries(catalogHeaders.map((h, i) => [h, valuesRow[i]])));
const catalogMap = new Map(catalogRows.map((row) => [Number(row.id), row]));

function firstParentId(value) {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function catalogPath(id) {
  const nodes = [];
  const seen = new Set();
  let current = catalogMap.get(Number(id));
  while (current && !seen.has(Number(current.id))) {
    seen.add(Number(current.id));
    nodes.unshift(String(current.name ?? ""));
    current = catalogMap.get(firstParentId(current.parent_ids));
  }
  return nodes.filter(Boolean).join(" > ");
}

for (const row of rows) row.industry_path = catalogPath(row.source_industry_catalog_id);

const exactMap = new Map();
for (const row of rows) {
  const name = String(row.position_name ?? "").trim();
  if (!name) continue;
  if (!exactMap.has(name)) exactMap.set(name, []);
  exactMap.get(name).push(row);
}

const exactGroups = [...exactMap.entries()]
  .filter(([, groupRows]) => groupRows.length > 1)
  .map(([name, groupRows]) => {
    const decision = exactDecision(groupRows);
    return {
      name,
      count: groupRows.length,
      decision: decision.decision,
      suggested_name: name,
      reason: decision.reason,
      source_rows: groupRows.map((r) => r.source_row),
      position_ids: groupRows.map((r) => r.position_id),
      catalog_ids: uniq(groupRows, "source_industry_catalog_id"),
      industry_paths: uniq(groupRows, "industry_path"),
      occupation_codes: uniq(groupRows, "primary_occupation_code"),
      occupation_names: uniq(groupRows, "primary_occupation_name"),
      job_levels: uniq(groupRows, "job_level"),
      summary_similarity: Number(decision.avgSummarySimilarity.toFixed(3)),
      requirements_similarity: Number(decision.avgRequirementSimilarity.toFixed(3)),
    };
  })
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));

const uniqueNameRows = [...exactMap.entries()].map(([name, groupRows]) => ({ name, rows: groupRows }));
const nearPairs = [];
for (let i = 0; i < uniqueNameRows.length; i += 1) {
  for (let j = i + 1; j < uniqueNameRows.length; j += 1) {
    const a = uniqueNameRows[i];
    const b = uniqueNameRows[j];
    const na = normalizedName(a.name);
    const nb = normalizedName(b.name);
    const ba = baseName(a.name);
    const bb = baseName(b.name);
    const sameNormalized = na === nb;
    const sameBase = ba.length >= 2 && ba === bb;
    const contain = Math.min(na.length, nb.length) >= 4 && (na.includes(nb) || nb.includes(na));
    const titleSimilarity = jaccard(na, nb);
    if (!sameNormalized && !sameBase && !(contain && titleSimilarity >= 0.55) && titleSimilarity < 0.72) continue;

    const codesA = new Set(uniq(a.rows, "primary_occupation_code"));
    const codesB = new Set(uniq(b.rows, "primary_occupation_code"));
    const sharedCodes = [...codesA].filter((code) => codesB.has(code));
    const occupationsA = new Set(uniq(a.rows, "primary_occupation_name"));
    const occupationsB = new Set(uniq(b.rows, "primary_occupation_name"));
    const sharedOccupations = [...occupationsA].filter((occupation) => occupationsB.has(occupation));
    const textSimilarity = Math.max(
      ...a.rows.flatMap((ra) => b.rows.map((rb) => (jaccard(ra.work_summary, rb.work_summary) + jaccard(ra.requirements_text, rb.requirements_text)) / 2)),
    );

    let decision = "不建议直接合并（仅名称相近）";
    let reason = "名称相近不等于岗位重复；技术方向、工作对象或层级不同，应分别保留。";
    if (sameNormalized) {
      decision = "可直接合并";
      reason = "仅大小写、空格或标点格式不同，属于格式重复。";
    } else if (/(高级|中级|初级|资深|助理|经理|主管|总监)/.test(`${a.name}|${b.name}`)) {
      decision = "不建议直接合并（层级不同）";
      reason = "名称包含明确的职级或辅助岗位差异；可归入同一岗位族，但不能合并为同一个标准岗位。";
    } else if ((sameBase || contain) && (sharedCodes.length || sharedOccupations.length)) {
      decision = "不建议直接合并（方向不同）";
      reason = "属于同一岗位族，但限定词代表不同技术方向、业务范围或工作对象，应保留为专业方向岗位。";
    }

    nearPairs.push({
      name_a: a.name,
      name_b: b.name,
      total_rows: a.rows.length + b.rows.length,
      decision,
      suggested_name: a.name.length >= b.name.length ? a.name : b.name,
      reason,
      title_similarity: Number(titleSimilarity.toFixed(3)),
      text_similarity: Number(textSimilarity.toFixed(3)),
      shared_occupation_codes: sharedCodes,
      shared_occupation_names: sharedOccupations,
      source_rows_a: a.rows.map((r) => r.source_row),
      source_rows_b: b.rows.map((r) => r.source_row),
    });
  }
}

nearPairs.sort((a, b) => {
  const rank = { "可直接合并": 0, "条件合并": 1, "不建议直接合并": 2 };
  return rank[a.decision] - rank[b.decision] || b.title_similarity - a.title_similarity || b.text_similarity - a.text_similarity;
});

const exactDuplicateRows = exactGroups.reduce((sum, group) => sum + group.count, 0);
const removableExactRows = exactGroups.reduce((sum, group) => sum + group.count - 1, 0);
const conservativeRemovableRows = exactGroups
  .filter((group) => group.decision !== "需拆分后合并")
  .reduce((sum, group) => sum + group.count - 1, 0);
const stats = {
  total_rows: rows.length,
  nonempty_name_rows: rows.filter((r) => String(r.position_name ?? "").trim()).length,
  unique_exact_names: exactMap.size,
  exact_duplicate_groups: exactGroups.length,
  exact_duplicate_rows: exactDuplicateRows,
  removable_exact_rows_if_one_standard_per_name: removableExactRows,
  conservative_removable_rows: conservativeRemovableRows,
  exact_decisions: Object.fromEntries(["可直接合并", "条件合并（先修分类）", "需拆分后合并"].map((d) => [d, exactGroups.filter((g) => g.decision === d).length])),
  near_duplicate_pairs: nearPairs.length,
  near_decisions: Object.fromEntries([...new Set(nearPairs.map((g) => g.decision))].map((d) => [d, nearPairs.filter((g) => g.decision === d).length])),
};

const exactDetails = exactGroups.flatMap((group, groupIndex) => {
  const sourceRowSet = new Set(group.source_rows);
  return rows
    .filter((row) => sourceRowSet.has(row.source_row))
    .map((row) => ({
      group_no: groupIndex + 1,
      duplicate_name: group.name,
      group_decision: group.decision,
      suggested_name: group.suggested_name,
      source_row: row.source_row,
      position_id: row.position_id,
      catalog_id: row.source_industry_catalog_id,
      industry_path: row.industry_path,
      occupation_code: row.primary_occupation_code,
      occupation_name: row.primary_occupation_name,
      work_summary: row.work_summary,
      requirements_text: row.requirements_text,
    }));
});

await fs.writeFile(`${outDir}/analysis.json`, JSON.stringify({ stats, exactGroups, exactDetails, nearPairs }, null, 2));
console.log(JSON.stringify(stats, null, 2));
console.log("EXACT GROUPS");
for (const g of exactGroups) console.log(JSON.stringify(g));
console.log("TOP NEAR PAIRS");
for (const g of nearPairs.slice(0, 100)) console.log(JSON.stringify(g));
