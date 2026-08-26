import fs from "node:fs/promises";

const dir = new URL(".", import.meta.url);
const relations = JSON.parse(await fs.readFile(new URL("relations.json", dir), "utf8"));
const statuses = JSON.parse(await fs.readFile(new URL("job_status.json", dir), "utf8"));

const takeSpread = (rows, count) => {
  if (rows.length <= count) return rows;
  const out = [];
  for (let i = 0; i < count; i++) out.push(rows[Math.floor(i * (rows.length - 1) / (count - 1))]);
  return out;
};

const lines = [];
for (const type of ["产业环节名称/简称命中", "领域词+岗位功能"]) {
  lines.push(`\n=== ${type} ===`);
  for (const r of takeSpread(relations.filter(x => x.match_type === type), 50)) {
    lines.push([r.job_id, r.cleaned_position, r.chain_name, r.chain_node_name, r.chain_node_stage, r.matched_keyword, r.review_status].join("\t"));
  }
}

lines.push("\n=== 各产业链抽样 ===");
for (const chain of [...new Set(relations.map(r => r.chain_name))].sort((a, b) => a.localeCompare(b, "zh-CN"))) {
  lines.push(`\n## ${chain}`);
  for (const r of takeSpread(relations.filter(x => x.chain_name === chain), 12)) {
    lines.push([r.job_id, r.cleaned_position, r.chain_node_name, r.chain_node_stage, r.matched_keyword, r.match_type].join("\t"));
  }
}

lines.push("\n=== 多产业链抽样 ===");
for (const s of takeSpread(statuses.filter(x => x.matched_chain_count > 1), 80)) {
  lines.push([s.job_id, s.cleaned_position, s.matched_chain_count, s.matched_chains].join("\t"));
}

await fs.writeFile(new URL("qa_samples.txt", dir), lines.join("\n"));
console.log(lines.join("\n"));
