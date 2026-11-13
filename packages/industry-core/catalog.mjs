import industryDataset from './data/industry-catalog.json' with {type:'json'};
import directory from './data/official-majors.json' with {type:'json'};
export {industryDataset, directory};
export const officialMajors = directory.majors;
const byCode = new Map(officialMajors.map(major => [major.code, major]));
const byIdentity = new Map(officialMajors.map(major => [`${major.level}:${major.code}`, major]));
export const findMajor = (code, sourceLevel) => sourceLevel ? byIdentity.get(`${sourceLevel}:${code}`) : byCode.get(code);
export const chains = industryDataset.chains;
export function matchChains(code, sourceLevel) {
  return chains.flatMap(chain => {
    const evidence = industryDataset.relations.filter(relation =>
      relation.majorKey.split(':').at(-1) === code && relation.chainId === chain.id
      && (!sourceLevel || relation.majorKey === `${sourceLevel}:${code}`));
    return evidence.length ? [{...chain, evidence}] : [];
  }).sort((a,b) => Math.min(...a.evidence.map(e=>e.order)) - Math.min(...b.evidence.map(e=>e.order)));
}
export const catalogProvenance = {
  version: 1,
  industry: {
    workbook: 'V1.0需求（2026.6.11）/官方数据/专业与产业链产业环节匹配结果.xlsx',
    importedFrom: 'major-construction-platform/src/data/industry-major-chain-data.ts',
    snapshot: '2026-09-08',
    status: '保留既有专业、产业链与规则匹配依据，不表示实时招聘或人工核验结果',
  },
  officialMajors: {snapshot: directory.snapshot, workbook: directory.workbook, sheet: directory.sheet, sources: directory.sources},
  jobMatching: {basis: '专业名称规则与岗位任务库测算', status: '生成岗位画像，非已核验招聘记录'},
};
