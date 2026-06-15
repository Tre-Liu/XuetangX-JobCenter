import fs from "node:fs/promises";

const rowsPath = "/Users/liuhongzhe/Documents/专业建设/outputs/a_share_credit_code_enrichment/rows.json";
const outputPath = "/Users/liuhongzhe/Documents/专业建设/outputs/a_share_credit_code_enrichment/credit_codes.json";

const rows = JSON.parse(await fs.readFile(rowsPath, "utf8"));

function marketPrefix(code) {
  if (code.startsWith("6")) return "SH";
  return "SZ";
}

const chars = "0123456789ABCDEFGHJKLMNPQRTUWXY";
const weights = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];
function isValidCreditCode(value) {
  if (typeof value !== "string") return false;
  const code = value.trim().toUpperCase();
  if (!/^[0-9A-HJ-NP-RTUWXY]{18}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    const index = chars.indexOf(code[i]);
    if (index < 0) return false;
    sum += index * weights[i];
  }
  const checkIndex = (31 - (sum % 31)) % 31;
  return chars[checkIndex] === code[17];
}

async function loadExisting() {
  try {
    const existing = JSON.parse(await fs.readFile(outputPath, "utf8"));
    return new Map(existing.map((item) => [item.code, item]));
  } catch {
    return new Map();
  }
}

async function save(map) {
  const data = [...map.values()].sort((a, b) => a.rowNumber - b.rowNumber);
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), "utf8");
}

async function fetchOne(row) {
  const secCode = `${marketPrefix(row.code)}${row.code}`;
  const url = `https://emweb.securities.eastmoney.com/PC_HSF10/CompanySurvey/PageAjax?code=${secCode}`;
  const response = await fetch(url, {
    headers: {
      "accept": "application/json,text/plain,*/*",
      "user-agent": "Mozilla/5.0 Codex data enrichment",
      "referer": `https://emweb.securities.eastmoney.com/PC_HSF10/CompanySurvey/Index?type=web&code=${secCode}`,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  const profile = data?.jbzl?.[0] ?? {};
  const rawRegNum = profile.REG_NUM == null ? "" : String(profile.REG_NUM).trim().toUpperCase();
  const creditCode = isValidCreditCode(rawRegNum) ? rawRegNum : "";
  const nameMatches = !row.fullName || !profile.ORG_NAME || String(profile.ORG_NAME).trim() === String(row.fullName).trim();
  return {
    rowNumber: row.rowNumber,
    code: row.code,
    sourceSecCode: secCode,
    shortName: row.shortName ?? "",
    sheetFullName: row.fullName ?? "",
    sourceFullName: profile.ORG_NAME ?? "",
    rawRegNum,
    creditCode,
    validCreditCode: Boolean(creditCode),
    nameMatches,
    source: "东方财富-公司资料 PageAjax",
    fetchedAt: new Date().toISOString(),
  };
}

const results = await loadExisting();
const pending = rows.filter((row) => !results.has(row.code));
let completed = results.size;
let failures = 0;
let processedSinceSave = 0;

console.log(`Starting fetch: existing=${results.size}, pending=${pending.length}`);

let cursor = 0;
const concurrency = 12;
async function worker() {
  while (cursor < pending.length) {
    const row = pending[cursor];
    cursor += 1;
  try {
    const result = await fetchOne(row);
    results.set(row.code, result);
  } catch (error) {
    failures += 1;
    results.set(row.code, {
      rowNumber: row.rowNumber,
      code: row.code,
      shortName: row.shortName ?? "",
      sheetFullName: row.fullName ?? "",
      sourceFullName: "",
      rawRegNum: "",
      creditCode: "",
      validCreditCode: false,
      nameMatches: false,
      source: "东方财富-公司资料 PageAjax",
      error: error.message,
      fetchedAt: new Date().toISOString(),
    });
  }
  completed += 1;
    processedSinceSave += 1;
    if (processedSinceSave >= 100 || completed === rows.length) {
      processedSinceSave = 0;
    await save(results);
    const valid = [...results.values()].filter((item) => item.validCreditCode).length;
    console.log(`progress completed=${completed}/${rows.length} valid=${valid} failures=${failures}`);
  }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

await save(results);
const final = [...results.values()];
console.log(JSON.stringify({
  total: final.length,
  valid: final.filter((item) => item.validCreditCode).length,
  blank: final.filter((item) => !item.creditCode).length,
  nameMismatch: final.filter((item) => item.sheetFullName && item.sourceFullName && !item.nameMatches).length,
  failures,
  outputPath,
}, null, 2));
