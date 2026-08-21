import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "outputs/01a018f8-24d8-7651-b292-e4dc705bf026/19条产业链岗位与职业匹配表.xlsx";
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const requiredSheets = [
  "说明与统计",
  "岗位-职业匹配表",
  "匹配明细（不合并）",
  "职业字典（本表使用）",
];
const sheetNames = workbook.worksheets.items.map((sheet) => sheet.name);

const mappingSheet = workbook.worksheets.getItem("岗位-职业匹配表");
const detailSheet = workbook.worksheets.getItem("匹配明细（不合并）");
const dictionarySheet = workbook.worksheets.getItem("职业字典（本表使用）");
const summarySheet = workbook.worksheets.getItem("说明与统计");
const mappingValues = mappingSheet.getUsedRange(true).values;
const detailValues = detailSheet.getUsedRange(true).values;
const dictionaryValues = dictionarySheet.getUsedRange(true).values;
const summaryValues = summarySheet.getUsedRange(true).values;

const mappingRows = mappingValues.slice(3).filter((row) => row[3]);
const mappingGroupRows = mappingValues.slice(3).filter((row) => row[1]);
const detailRows = detailValues.slice(3).filter((row) => row[6]);
const dictionaryRows = dictionaryValues.slice(3).filter((row) => row[0]);
const dictionaryPairs = new Set(dictionaryRows.map((row) => `${row[0]}||${row[1]}`));
const chains = new Set(detailRows.map((row) => String(row[5]).split("｜")[0]));
const displayGroupIds = new Set(detailRows.map((row) => row[0]));
const relationGroupIds = new Set(detailRows.map((row) => row[1]));
const jobRecordIds = new Set(detailRows.map((row) => row[2]));
const positionIds = new Set(detailRows.map((row) => row[3]));
const uniqueJobTitles = new Set(detailRows.map((row) => String(row[4]).toLowerCase().replace(/[\s·•（）()]/gu, "").replace(/／/gu, "/")));
const mainPositionIds = new Set(mappingGroupRows.flatMap((row) => String(row[1]).split("；").filter(Boolean)));

const reconstructedMainGroups = [];
let currentMainGroup = null;
for (const row of mappingValues.slice(3)) {
  if (row[0]) {
    if (currentMainGroup) reconstructedMainGroups.push(currentMainGroup);
    currentMainGroup = { title: row[0], chain: row[2], occupations: [] };
  }
  if (currentMainGroup && row[3]) currentMainGroup.occupations.push(`${row[3]}||${row[4]}`);
}
if (currentMainGroup) reconstructedMainGroups.push(currentMainGroup);
const mainSignatures = reconstructedMainGroups.map((group) => [
  group.title,
  group.chain,
  [...group.occupations].sort().join(";"),
].join("||"));

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "exported workbook formula error scan",
  maxChars: 4000,
});
const reviewWording = await workbook.inspect({
  kind: "match",
  searchTerm: "待复核|复核|低置信|建议审核",
  options: { useRegex: true, maxResults: 300 },
  summary: "review wording scan",
  maxChars: 4000,
});

const checks = {
  hasAllRequiredSheets: requiredSheets.every((name) => sheetNames.includes(name)),
  hasNoReviewSheet: !sheetNames.includes("待复核清单"),
  mappingRowCount: mappingRows.length,
  detailRowCount: detailRows.length,
  mainTableIsMerged: mappingRows.length < detailRows.length,
  mappingRelationGroupCount: mappingGroupRows.length,
  detailDisplayGroupCount: displayGroupIds.size,
  mainAndDetailDisplayGroupsAgree: mappingGroupRows.length === displayGroupIds.size && displayGroupIds.size === 553,
  noDuplicateMainGroups: new Set(mainSignatures).size === mainSignatures.length,
  allSourcePositionIdsRepresentedInMain: mainPositionIds.size === 645 && [...positionIds].every((id) => mainPositionIds.has(String(id))),
  hasAll645JobRecords: jobRecordIds.size === 645,
  hasAll645PositionIds: positionIds.size === 645,
  hasAll706JobIndustryRelations: relationGroupIds.size === 706,
  uniqueJobTitleCount: uniqueJobTitles.size,
  uniqueJobTitleCountIs471: uniqueJobTitles.size === 471,
  chainCount: chains.size,
  allChainsCovered: chains.size === 19,
  allDetailRowsHaveJobAndChain: detailRows.every((row) => row[0] && row[1] && row[2] && row[3] && row[4] && row[5]),
  allCodesHaveNationalFormat: detailRows.every((row) => /^\d-\d{2}-\d{2}-\d{2}$/u.test(String(row[7]))),
  allPairsExistInUsedDictionary: detailRows.every((row) => dictionaryPairs.has(`${row[6]}||${row[7]}`)),
  allMainCodesHaveNationalFormat: mappingRows.every((row) => /^\d-\d{2}-\d{2}-\d{2}$/u.test(String(row[4]))),
  allMainPairsExistInUsedDictionary: mappingRows.every((row) => dictionaryPairs.has(`${row[3]}||${row[4]}`)),
  hasNoReviewWording: reviewWording.ndjson.includes("matched 0"),
  summaryMatchedJobRecordsIs645: Number(summaryValues[4][2]) === 645,
  summaryJobIndustryRelationsIs706: Number(summaryValues[4][4]) === 706,
  summaryUniqueJobTitlesIs471: Number(summaryValues[7][0]) === 471,
  summaryCanonicalDisplayGroupsIs553: Number(summaryValues[7][2]) === 553,
  summaryMainMappingRowsIs715: Number(summaryValues[4][6]) === 715,
  jobRetentionIsComplete: Number(summaryValues[7][6]) === 1,
  formulaErrorCount: formulaErrors.ndjson.includes("matched 0") ? 0 : -1,
};
checks.allPassed = checks.hasAllRequiredSheets
  && checks.hasNoReviewSheet
  && checks.mainTableIsMerged
  && checks.noDuplicateMainGroups
  && checks.allSourcePositionIdsRepresentedInMain
  && checks.mainAndDetailDisplayGroupsAgree
  && checks.hasAll645JobRecords
  && checks.hasAll645PositionIds
  && checks.hasAll706JobIndustryRelations
  && checks.detailDisplayGroupCount === 553
  && checks.uniqueJobTitleCountIs471
  && checks.allChainsCovered
  && checks.allDetailRowsHaveJobAndChain
  && checks.allCodesHaveNationalFormat
  && checks.allPairsExistInUsedDictionary
  && checks.allMainCodesHaveNationalFormat
  && checks.allMainPairsExistInUsedDictionary
  && checks.hasNoReviewWording
  && checks.summaryMatchedJobRecordsIs645
  && checks.summaryJobIndustryRelationsIs706
  && checks.summaryUniqueJobTitlesIs471
  && checks.summaryCanonicalDisplayGroupsIs553
  && checks.summaryMainMappingRowsIs715
  && checks.jobRetentionIsComplete
  && checks.formulaErrorCount === 0;

console.log(JSON.stringify({ workbookPath, sheetNames, checks }, null, 2));
console.log(formulaErrors.ndjson);
console.log(reviewWording.ndjson);
if (!checks.allPassed) process.exitCode = 1;
