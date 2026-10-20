import {readFile,writeFile} from 'node:fs/promises'
import '../industry-major-chain-data.js'
const levels={'普通本科':'普通本科','高等职业教育本科':'职业本科','高等职业教育专科':'高职专科','中等职业教育':'中职'}
const majors=globalThis.INDUSTRY_MAJOR_CHAIN_DATA.majors.map(m=>({level:levels[m.sourceLevel],code:m.code,name:m.name,category:m.majorCategory}))
const geo=JSON.parse(await readFile(new URL('../src/china-geo.json',import.meta.url),'utf8'))
const regions=geo.features.map(x=>x.properties.name).filter(Boolean)
const data={provenance:{majors:'industry-major-chain-data.js：平台现有专业目录快照，沿用原目录层次、名称与代码',regions:'src/china-geo.json：省级行政区划名称',scope:'专业建设方向由学校填写，不纳入标准字典'},majors,regions}
await writeFile(new URL('../src/talent-plan/standards.js',import.meta.url),'/** Shared standard-field snapshot. Regenerate with scripts/build-talent-plan-standards.mjs. */\n;(function(root){root.TalentPlanStandards='+JSON.stringify(data)+'})(globalThis)\n')
