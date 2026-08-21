import fs from "node:fs";

const path = "major-construction-platform/src/data/industry-major-chain-data.ts";
const source = fs.readFileSync(path, "utf8");
const match = source.match(/JSON\.parse\((.*)\) as IndustryMajorChainDataset\s*$/s);
if (!match) throw new Error("Embedded JSON not found");
const data = JSON.parse(JSON.parse(match[1]));
for (const key of ["普通本科:080601", "高等职业教育本科:260302"]) {
  const major = data.majors.find((item) => item.key === key);
  const relations = data.relations.filter((item) => item.majorKey === key).map((item) => ({
    ...item,
    chain: data.chains.find((chain) => chain.id === item.chainId)?.name,
  }));
  console.log(JSON.stringify({ major, relations }, null, 2));
}
