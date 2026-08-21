(function registerIndustryRegionCityData(root) {
  const cityGroups = {
    广东: [
      { city: '深圳', count: 1280 },
      { city: '广州', count: 940 },
      { city: '佛山', count: 520 },
      { city: '东莞', count: 430 },
    ],
    江苏: [
      { city: '南京', count: 980 },
      { city: '苏州', count: 760 },
      { city: '无锡', count: 520 },
    ],
    浙江: [
      { city: '杭州', count: 1180 },
      { city: '宁波', count: 520 },
      { city: '绍兴', count: 360 },
    ],
    山东: [
      { city: '济南', count: 620 },
      { city: '青岛', count: 540 },
      { city: '烟台', count: 280 },
    ],
    四川: [
      { city: '成都', count: 960 },
      { city: '绵阳', count: 260 },
    ],
    湖北: [
      { city: '武汉', count: 980 },
      { city: '宜昌', count: 160 },
    ],
    辽宁: [
      { city: '沈阳', count: 420 },
      { city: '大连', count: 360 },
    ],
  }

  const normalizeCityName = (name) => String(name || '')
    .replace(/(?:市|地区|盟)$/, '')
    .trim()

  const allocateWeightedIntegers = (total, items, explicitWeights = null) => {
    if (!items.length) return []
    const safeTotal = Math.max(0, Math.round(Number(total) || 0))
    const baseline = safeTotal >= items.length ? 1 : 0
    const remaining = safeTotal - baseline * items.length
    const weights = items.map((_, index) => {
      const explicitWeight = Number(explicitWeights?.[index])
      return explicitWeight > 0 ? explicitWeight : Math.pow(items.length - index, 1.15)
    })
    const weightTotal = weights.reduce((sum, weight) => sum + weight, 0)
    const rawShares = weights.map((weight) => remaining * weight / weightTotal)
    const counts = rawShares.map((share) => baseline + Math.floor(share))
    let remainder = safeTotal - counts.reduce((sum, count) => sum + count, 0)
    rawShares
      .map((share, index) => ({ index, fraction: share - Math.floor(share) }))
      .sort((left, right) => right.fraction - left.fraction || left.index - right.index)
      .forEach(({ index }) => {
        if (remainder <= 0) return
        counts[index] += 1
        remainder -= 1
      })
    return counts
  }

  const buildCityMetrics = ({ provinceCount, features = [], overrides = [] }) => {
    const mappedCities = []
    const seen = new Set()
    features.forEach((feature) => {
      const name = normalizeCityName(feature?.name)
      if (!name || seen.has(name)) return
      seen.add(name)
      mappedCities.push({ name, adcode: feature?.adcode })
    })
    if (!mappedCities.length) return []

    const total = Math.max(0, Math.round(Number(provinceCount) || 0))
    const overrideLookup = new Map(
      overrides
        .map((item) => [normalizeCityName(item?.city ?? item?.name), Math.max(0, Math.round(Number(item?.count) || 0))])
        .filter(([name, count]) => name && count > 0),
    )
    const fixedCounts = mappedCities.map((item) => overrideLookup.get(item.name) ?? null)
    const fixedTotal = fixedCounts.reduce((sum, count) => sum + (count ?? 0), 0)

    if (fixedTotal > total) {
      const scaled = allocateWeightedIntegers(total, mappedCities, fixedCounts.map((count) => count ?? 1))
      return mappedCities.map((item, index) => ({ ...item, count: scaled[index] }))
    }

    const resultCounts = fixedCounts.map((count) => count ?? 0)
    const uncoveredIndexes = mappedCities
      .map((_, index) => index)
      .filter((index) => fixedCounts[index] === null)
    const allocationTargets = uncoveredIndexes.length
      ? uncoveredIndexes
      : mappedCities.map((_, index) => index)
    const remainderCounts = allocateWeightedIntegers(total - fixedTotal, allocationTargets)
    allocationTargets.forEach((cityIndex, allocationIndex) => {
      resultCounts[cityIndex] += remainderCounts[allocationIndex]
    })

    return mappedCities.map((item, index) => ({ ...item, count: resultCounts[index] }))
  }

  const rankMetrics = (metrics, limit = metrics.length) => [...metrics]
    .sort((left, right) => right.count - left.count || String(left.name).localeCompare(String(right.name), 'zh-CN'))
    .slice(0, Math.max(0, limit))

  root.industryRegionCityData = {
    cityGroups,
    normalizeCityName,
    buildCityMetrics,
    rankMetrics,
  }
})(window)
