import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const loadIndustryRegionCityData = async () => {
  const context = vm.createContext({ window: {} })
  const geoSource = await readFile(new URL('../src/data/static-region-city-geo.js', import.meta.url), 'utf8')
  vm.runInContext(geoSource, context)

  const distributionSource = await readFile(
    new URL('../src/data/industry-region-city-data.js', import.meta.url),
    'utf8',
  ).catch(() => '')
  if (distributionSource) vm.runInContext(distributionSource, context)

  return {
    api: context.window.industryRegionCityData,
    geo: context.window.staticRegionCityGeoData,
  }
}

test('every province map produces a complete city distribution without a focus-city placeholder', async () => {
  const { api, geo } = await loadIndustryRegionCityData()
  assert.ok(api, 'industry-region city distribution script must be loadable')

  const expectedProvinces = [
    '上海', '云南', '内蒙古', '北京', '台湾', '吉林', '四川', '天津', '宁夏',
    '安徽', '山东', '山西', '广东', '广西', '新疆', '江苏', '江西', '河北',
    '河南', '浙江', '海南', '湖北', '湖南', '澳门', '甘肃', '福建', '西藏',
    '贵州', '辽宁', '重庆', '陕西', '青海', '香港', '黑龙江',
  ]
  assert.deepEqual(Object.keys(geo).sort(), expectedProvinces.sort())

  for (const province of expectedProvinces) {
    const features = geo[province].features
    const metrics = api.buildCityMetrics({ province, provinceCount: 1000, features })

    assert.equal(metrics.length, features.length, `${province} must include every mapped city`)
    assert.equal(metrics.reduce((sum, item) => sum + item.count, 0), 1000, `${province} counts must reconcile`)
    assert.ok(metrics.every((item) => item.count > 0), `${province} must color every city`)
    assert.ok(metrics.every((item) => !item.name.includes('重点城市')), `${province} must not use a focus-city placeholder`)
  }
})

test('Jilin drilldown returns all nine cities and reconciles to the 610-company province total', async () => {
  const { api, geo } = await loadIndustryRegionCityData()
  assert.ok(api, 'industry-region city distribution script must be loadable')

  const metrics = api.buildCityMetrics({
    province: '吉林',
    provinceCount: 610,
    features: geo['吉林'].features,
  })

  assert.deepEqual(
    Array.from(metrics, (item) => item.name).sort(),
    ['吉林', '四平', '延边朝鲜族自治州', '松原', '白城', '白山', '辽源', '通化', '长春'].sort(),
  )
  assert.equal(metrics.reduce((sum, item) => sum + item.count, 0), 610)
})

test('curated city samples remain fixed while uncovered cities receive the province remainder', async () => {
  const { api, geo } = await loadIndustryRegionCityData()
  assert.ok(api, 'industry-region city distribution script must be loadable')

  const metrics = api.buildCityMetrics({
    province: '广东',
    provinceCount: 3860,
    features: geo['广东'].features,
    overrides: api.cityGroups['广东'],
  })
  const lookup = new Map(metrics.map((item) => [item.name, item.count]))

  assert.equal(lookup.get('深圳'), 1280)
  assert.equal(lookup.get('广州'), 940)
  assert.ok(lookup.get('珠海') > 0)
  assert.equal(metrics.reduce((sum, item) => sum + item.count, 0), 3860)
})

test('regional TOP15 is sorted by enterprise count before it is truncated', async () => {
  const { api } = await loadIndustryRegionCityData()
  assert.ok(api, 'industry-region city distribution script must be loadable')

  const source = [
    { name: '广东', count: 3860 }, { name: '江苏', count: 3520 },
    { name: '浙江', count: 2860 }, { name: '北京', count: 2680 },
    { name: '上海', count: 2450 }, { name: '山东', count: 1980 },
    { name: '四川', count: 1620 }, { name: '福建', count: 1480 },
    { name: '湖北', count: 1320 }, { name: '安徽', count: 1180 },
    { name: '河南', count: 1050 }, { name: '湖南', count: 960 },
    { name: '江西', count: 920 }, { name: '天津', count: 850 },
    { name: '广西', count: 820 }, { name: '辽宁', count: 980 },
    { name: '陕西', count: 780 },
  ]
  const top15 = api.rankMetrics(source, 15)

  assert.equal(top15.length, 15)
  assert.equal(top15[0].name, '广东')
  assert.ok(top15.some((item) => item.name === '辽宁'))
  assert.ok(top15.every((item) => item.name !== '陕西'))
  assert.ok(top15.every((item, index) => index === 0 || top15[index - 1].count >= item.count))
})

test('oversubscribed curated counts are scaled proportionally to the province total', async () => {
  const { api } = await loadIndustryRegionCityData()
  assert.ok(api, 'industry-region city distribution script must be loadable')

  const metrics = api.buildCityMetrics({
    province: '测试省',
    provinceCount: 60,
    features: [
      { name: '甲市', adcode: 1 },
      { name: '乙市', adcode: 2 },
    ],
    overrides: [
      { city: '甲', count: 90 },
      { city: '乙', count: 30 },
    ],
  })

  assert.deepEqual(Array.from(metrics, (item) => item.count), [45, 15])
})
