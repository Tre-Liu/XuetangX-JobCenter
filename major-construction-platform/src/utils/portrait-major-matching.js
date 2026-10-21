;(function registerPortraitMajorMatching(root) {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const tip = '综合比较岗位名称、典型任务、知识技能素养、招聘要求及已有专业关系，并按资料可靠性加权。缺失资料不按零分计入。分数越高，内容越相关；属于待复核评分，不代表录用概率。'
  const levels = [{ value: 'all', label: '全部' }, { value: 'undergraduate', label: '本科' }, { value: 'vocational', label: '职业教育' }]
  const render = (jobName, level = 'all') => {
    if (!levels.some(item => item.value === level)) level = 'all'
    const record = root.PortraitMajorMatchData?.records?.[jobName]
    const majors = (record?.majors ?? []).filter(major => level === 'all' || (level === 'undergraduate' ? major.level === '普通本科' : ['职业本科', '高职专科', '中职'].includes(major.level)))
    return `<div class="portrait-major-heading"><h3>匹配专业</h3><div class="portrait-major-controls"><details class="portrait-major-tip"><summary aria-label="匹配度说明">匹配度说明</summary><p>${tip}</p></details><div class="portrait-major-level-tabs" role="group" aria-label="专业层次">${levels.map(item => `<button type="button" data-portrait-major-level="${item.value}" data-portrait-major-job="${escape(jobName)}" aria-pressed="${item.value === level}">${item.label}</button>`).join('')}</div></div></div>
      ${majors.length ? `<div class="portrait-major-table-scroll"><table class="portrait-major-match-table"><thead><tr><th scope="col">序号</th><th scope="col">专业名称</th><th scope="col">专业代码</th><th scope="col">教育层次</th><th scope="col">匹配度</th></tr></thead><tbody>${majors.map((major, index) => {
        const hasScore = typeof major.score === 'number' && Number.isFinite(major.score)
        return `<tr class="portrait-major-match-row"><td>${index + 1}</td><td>${escape(major.name)}</td><td>${escape(major.code)}</td><td><span class="portrait-major-level-tag ${major.level === '普通本科' ? 'is-undergraduate' : 'is-vocational'}">${escape(major.level)}</span></td><td><div class="portrait-major-match-score"><span>${hasScore ? `${major.score.toFixed(1)}%` : '待测算'}</span>${hasScore ? `<i class="portrait-major-score-track" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, major.score))}%"></i></i>` : ''}</div></td></tr>`
      }).join('')}</tbody></table></div>` : '<p class="portrait-major-match-empty">暂无达到筛选条件的专业匹配结果，待补充岗位资料后更新。</p>'}`
  }
  const handleClick = event => {
    const button = event.target?.closest?.('[data-portrait-major-level]')
    const section = button?.closest('[data-portrait-major-matching]')
    if (!section) return false
    const level = button.dataset.portraitMajorLevel
    section.innerHTML = render(button.dataset.portraitMajorJob, level)
    section.querySelector(`[data-portrait-major-level="${level}"]`)?.focus({ preventScroll: true })
    return true
  }
  root.PortraitMajorMatching = { render, handleClick }
})(typeof window === 'undefined' ? globalThis : window)
