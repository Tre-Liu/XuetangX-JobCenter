import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const sourceDir = "/Users/liuhongzhe/Desktop/岗位产业环节匹配";
const outDir = new URL(".", import.meta.url);

const industryBook = await SpreadsheetFile.importXlsx(await FileBlob.load(`${sourceDir}/产业环节.xlsx`));
const industrySheet = industryBook.worksheets.getItemAt(0);
const industryValues = industrySheet.getRange("A1:AB1047").values;
const industryHeaders = industryValues[0];
const industries = industryValues.slice(1).map(row => Object.fromEntries(industryHeaders.map((h, i) => [h, row[i]])));
await fs.writeFile(new URL("industry_nodes.json", outDir), JSON.stringify(industries, null, 2));

const csvText = await fs.readFile(`${sourceDir}/岗位.csv`, "utf8");
const jobsBook = await Workbook.fromCSV(csvText, { sheetName: "岗位" });
const jobSheet = jobsBook.worksheets.getItemAt(0);
const jobValues = jobSheet.getRange("A1:F57553").values;
const jobHeaders = jobValues[0];
const jobs = jobValues.slice(1).map(row => Object.fromEntries(jobHeaders.map((h, i) => [h, row[i]])));
await fs.writeFile(new URL("jobs.json", outDir), JSON.stringify(jobs));

const counts = new Map();
for (const job of jobs) counts.set(job.cleaned_position, (counts.get(job.cleaned_position) ?? 0) + 1);
const profile = {
  jobRows: jobs.length,
  uniqueJobNames: counts.size,
  duplicateRows: jobs.length - counts.size,
  emptyNames: jobs.filter(j => !j.cleaned_position).length,
  topDuplicates: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30),
  chainCounts: Object.entries(industries.reduce((acc, n) => {
    acc[n.chain_name] = (acc[n.chain_name] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => a[0].localeCompare(b[0], "zh-CN")),
};
console.log(JSON.stringify(profile, null, 2));
