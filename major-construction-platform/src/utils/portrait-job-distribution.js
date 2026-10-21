;(function registerPortraitJobDistribution(root) {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const rank = rows => [...rows].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
  const aggregateCities = rows => {
    const provinces = new Map()
    const cities = new Map()
    for (const { province, city, count } of rows) {
      if (!province || !city || !Number.isSafeInteger(count) || count < 0) throw new Error('地域及招聘数无效')
      provinces.set(province, (provinces.get(province) || 0) + count)
      const key = `${province}/${city}`
      cities.set(key, { name: city, count: (cities.get(key)?.count || 0) + count })
    }
    return { provinces: rank(provinces), cities: [...cities.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN')), total: [...provinces.values()].reduce((s, n) => s + n, 0) }
  }
  // Illustrative city counts only. These are not scraped JD records or official recruitment statistics.
  const cities = [
    ['广东', '深圳'], ['广东', '广州'], ['上海', '上海'], ['北京', '北京'],
    ['浙江', '杭州'], ['江苏', '南京'], ['江苏', '苏州'], ['四川', '成都'],
    ['湖北', '武汉'], ['山东', '济南'], ['陕西', '西安'], ['重庆', '重庆'],
    ['湖南', '长沙'], ['天津', '天津'], ['福建', '厦门'], ['安徽', '合肥'],
    ['河南', '郑州'], ['辽宁', '沈阳'], ['河北', '石家庄'], ['广西', '南宁'],
  ]
  const demoCounts = {
    construction: [186, 162, 174, 158, 126, 112, 98, 106, 92, 76, 68, 64, 58, 52, 48, 44, 42, 36, 32, 28],
    digital: [284, 148, 256, 278, 218, 116, 98, 142, 124, 52, 86, 58, 64, 42, 48, 74, 36, 28, 22, 18],
    industrial: [198, 106, 132, 94, 118, 154, 216, 98, 106, 88, 78, 66, 72, 64, 56, 96, 52, 48, 38, 24],
  }
  const getDemo = jobName => {
    const category = /工业|制造|机电|机器人|设备|PLC|产线|机械|视觉/.test(jobName) ? 'industrial' : /AI|人工智能|算法|模型|数据|软件|智能系统/.test(jobName) ? 'digital' : 'construction'
    return aggregateCities(cities.map(([province, city], i) => ({ province, city, count: demoCounts[category][i] })))
  }
  const colors = ['#e3edff', '#bbd1ff', '#87adfc', '#5589ed', '#3065d5']
  const colorFor = (count, max) => count ? colors[Math.min(4, Math.ceil(count / max * 5) - 1)] : '#e6ebf3'
  const renderTable = (title, rows, total) => `<div class="portrait-distribution-ranking"><h4>${title}</h4><div class="portrait-distribution-table-scroll"><table><thead><tr><th scope="col">区域名称</th><th scope="col">招聘占比</th></tr></thead><tbody>${rows.map((r, index) => `<tr class="portrait-distribution-rank-row"><td><span class="portrait-distribution-rank-number">${String(index + 1).padStart(2, '0')}</span><span class="portrait-distribution-place">${escape(r.name)}</span></td><td><span class="portrait-distribution-bar" aria-hidden="true"><i style="width:${total > 0 ? r.count / total * 100 : 0}%"></i></span><span>${(total > 0 ? r.count / total * 100 : 0).toFixed(1)}%</span></td></tr>`).join('')}</tbody></table></div></div>`
  const modes = [{ value: 'province', label: '按省份排行' }, { value: 'city', label: '按城市排行' }]
  const render = (jobName, mode = 'province') => {
    if (!modes.some(item => item.value === mode)) mode = 'province'
    const data = getDemo(jobName)
    const counts = new Map(data.provinces.map(r => [r.name, r.count]))
    const max = data.provinces[0]?.count || 1
    const map = root.PortraitDistributionMap || []
    return `<div class="portrait-distribution-heading"><h3>岗位分布情况</h3><div class="portrait-distribution-mode-tabs" role="group" aria-label="岗位分布排行维度">${modes.map(item => `<button type="button" data-portrait-distribution-mode="${item.value}" data-portrait-distribution-job="${escape(jobName)}" aria-pressed="${item.value === mode}">${item.label}</button>`).join('')}</div></div><div class="portrait-distribution-layout">
      <div class="portrait-distribution-map-wrap"><svg class="portrait-distribution-map" viewBox="0 0 820 590" role="img" aria-label="${escape(jobName)}招聘地域分布参考图（岗位画像测算）"><rect x="698" y="425" width="112" height="142" rx="3" fill="none" stroke="#d6e0f1"/><text x="754" y="582" text-anchor="middle" fill="#73839a" font-size="12">南海诸岛</text><g>${map.map(f => `<path d="${f.d}" fill="${f.name ? colorFor(counts.get(f.name) || 0, max) : '#9aaeca'}" stroke="${f.name ? '#fff' : 'none'}" stroke-width="0.7"/>`).join('')}</g><g class="portrait-distribution-labels">${map.filter(f => f.center && counts.has(f.name) && !['上海', '天津'].includes(f.name)).map(f => `<text x="${f.center[0]}" y="${f.center[1]}" text-anchor="middle">${escape(f.name)}</text>`).join('')}</g></svg><div class="portrait-distribution-legend"><span>低</span>${colors.map(c => `<i style="background:${c}"></i>`).join('')}<span>高</span><span class="portrait-distribution-legend-caption">颜色深浅表示招聘占比</span></div></div>
      ${renderTable(mode === 'city' ? '市级分布排名 TOP10' : '省级分布排名 TOP10', (mode === 'city' ? data.cities : data.provinces).slice(0, 10), data.total)}</div>`
  }
  const handleClick = event => {
    const button = event.target?.closest?.('[data-portrait-distribution-mode]')
    const section = button?.closest('[data-portrait-job-distribution]')
    if (!section) return false
    const mode = button.dataset.portraitDistributionMode
    section.innerHTML = render(button.dataset.portraitDistributionJob, mode)
    section.querySelector(`[data-portrait-distribution-mode="${mode}"]`)?.focus({ preventScroll: true })
    return true
  }
  root.PortraitJobDistribution = { aggregateCities, getDemo, render, handleClick }
})(typeof window === 'undefined' ? globalThis : window)
