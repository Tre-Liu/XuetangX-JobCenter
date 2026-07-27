export const REPORT_ECONOMIC_ZONE_OPTIONS = [
  {
    id: 'economic-zone:jing-jin-ji',
    name: '京津冀',
    type: 'economic-zone',
  },
  {
    id: 'economic-zone:yangtze-river-delta',
    name: '长三角',
    type: 'economic-zone',
  },
  {
    id: 'economic-zone:greater-bay-area',
    name: '粤港澳大湾区',
    type: 'economic-zone',
  },
  {
    id: 'economic-zone:chengdu-chongqing',
    name: '成渝地区双城经济圈',
    type: 'economic-zone',
  },
  {
    id: 'economic-zone:middle-yangtze',
    name: '长江中游城市群',
    type: 'economic-zone',
  },
  {
    id: 'economic-zone:guanzhong-plain',
    name: '关中平原城市群',
    type: 'economic-zone',
  },
  {
    id: 'economic-zone:beibu-gulf',
    name: '北部湾经济区',
    type: 'economic-zone',
  },
  {
    id: 'economic-zone:west-strait',
    name: '海峡西岸经济区',
    type: 'economic-zone',
  },
]

const REPORT_DIRECT_MUNICIPALITIES = [
  { id: 'city:110100', name: '北京市', type: 'city', province: '北京' },
  { id: 'city:120100', name: '天津市', type: 'city', province: '天津' },
  { id: 'city:310100', name: '上海市', type: 'city', province: '上海' },
  { id: 'city:500100', name: '重庆市', type: 'city', province: '重庆' },
]

export const searchStandardIndustries = (
  options = [],
  keyword = '',
  limit = 80,
) => {
  const normalized = String(keyword).trim().toLowerCase()
  const matches = normalized
    ? options.filter((item) =>
        `${item.code} ${item.name}`.toLowerCase().includes(normalized),
      )
    : options
  return matches.slice(0, limit)
}

export const buildReportRegionOptions = (geoData = {}) => {
  const cities = Object.entries(geoData).flatMap(([province, value]) =>
    (value?.features ?? [])
      .filter((feature) => /市$|地区$|自治州$|盟$/.test(feature.name))
      .map((feature) => ({
        id: `city:${feature.adcode}`,
        name: feature.name,
        type: 'city',
        province,
      })),
  )
  const uniqueCities = [...REPORT_DIRECT_MUNICIPALITIES, ...cities]
    .filter(
      (item, index, all) =>
        all.findIndex((candidate) => candidate.id === item.id) === index,
    )
  return [...uniqueCities, ...REPORT_ECONOMIC_ZONE_OPTIONS]
}

export const searchReportRegions = (
  options = [],
  keyword = '',
  selectedIds = [],
  limit = 80,
) => {
  const selected = new Set(selectedIds)
  const normalized = String(keyword).trim().toLowerCase()
  return options
    .filter((item) => !selected.has(item.id))
    .filter(
      (item) =>
        !normalized
        || `${item.name} ${item.province ?? ''} ${item.type}`
          .toLowerCase()
          .includes(normalized),
    )
    .slice(0, limit)
}

export const formatReportRegionNames = (names = []) =>
  [...new Set(names.filter(Boolean))].join('、')

export const normalizeReportRegionSelection = (form = {}, options = []) => {
  const byId = new Map(options.map((item) => [item.id, item]))
  const ids = [
    ...new Set(Array.isArray(form.regionIds) ? form.regionIds : []),
  ].filter((id) => byId.has(id))
  const legacyNames = Array.isArray(form.regionNames)
    ? form.regionNames
    : String(form.region || '')
      .split(/[、/]/)
      .map((name) => name.trim())
      .filter(Boolean)
  const names = ids.length
    ? ids.map((id) => byId.get(id).name)
    : [...new Set(legacyNames)]
  return {
    regionIds: ids,
    regionNames: names,
    region: formatReportRegionNames(names),
  }
}
