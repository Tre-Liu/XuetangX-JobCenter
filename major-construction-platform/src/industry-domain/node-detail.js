/* Shared by the Vue and file:// entries. Counts retain the graph's demo scope. */
;(function (root) {
  if (root.IndustryNodeDetail) return
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const businessKeywords = {
    design: ['设计软件', '协同设计', 'BIM审图'],
    regulation: ['安全管理平台', '检测认证', '结构健康监测']
  }
  function buildData({ node, chain, jobs = [], membership = {}, companies = [] }) {
    const seen = new Set()
    const matched = companies.flatMap(company => {
      const direct = company.industry === node.name
      const related = (businessKeywords[node.id] || []).some(word => (company.products || '').includes(word))
      const key = company.creditCode || company.name
      if ((!direct && !related) || seen.has(key)) return []
      seen.add(key)
      return [{ ...company, matchLabel: direct ? '环节关联' : '业务相关' }]
    })
    return { ...node, chain, techFields: node.techFields || [],
      stageLabel: { upstream: '上游', midstream: '中游', downstream: '下游' }[node.stage] || '未分类',
      groups: root.IndustryDomain.groups(jobs, membership).filter(group => group.nodes.includes(node.name) && group.chains.includes(chain)),
      companies: matched }
  }
  function open(input, onViewGroups) {
    const data = buildData(input)
    const opener = document.activeElement
    const dialog = document.createElement('dialog')
    dialog.className = 'industry-node-detail-dialog'
    dialog.setAttribute('aria-labelledby', 'industry-node-detail-title')
    dialog.setAttribute('aria-modal', 'true')
    dialog.innerHTML = `
      <header class="ind-detail-header"><div><span class="ind-detail-eyebrow">产业环节详情</span><h2 id="industry-node-detail-title">${esc(data.name)}</h2><p>${esc(data.chain)}<span> / </span>${esc(data.stageLabel)}</p></div><button type="button" class="ind-detail-close" aria-label="关闭产业环节详情" autofocus>×</button></header>
      <div class="ind-detail-body">
        <section class="ind-detail-metrics" aria-label="环节概况"><div><span>企业数</span><strong>${esc(data.enterpriseCount ?? 0)}<small>家</small></strong></div><div><span>关联岗位群</span><strong>${data.groups.length}<small>个</small></strong></div><div><span>代表企业</span><strong>${data.companies.length}<small>家已展示</small></strong></div></section>
        <section class="ind-detail-section"><h3>关键技术与业务方向</h3><div class="ind-detail-tags">${data.techFields.map(field => `<span>${esc(field)}</span>`).join('') || '<p class="ind-detail-empty">暂无技术方向信息</p>'}</div></section>
        <section class="ind-detail-section"><div class="ind-detail-section-head"><h3>关联岗位群 <small>${data.groups.length}</small></h3>${data.groups.length && onViewGroups ? '<button type="button" class="ind-detail-view-groups">查看岗位群 →</button>' : ''}</div><div class="ind-detail-groups">${data.groups.map(group => `<article><div><h4>${esc(group.name)}</h4><span>${group.members.length} 个岗位</span></div><p>${esc(group.field)}</p><div class="ind-detail-job-tags">${group.members.map(job => `<span>${esc(job.name)}</span>`).join('') || '<span>暂无岗位成员</span>'}</div></article>`).join('') || '<p class="ind-detail-empty">当前产业链下暂无关联岗位群</p>'}</div></section>
        <section class="ind-detail-section"><div class="ind-detail-section-head"><h3>代表企业 <small>${data.companies.length}</small></h3><span>当前企业库收录</span></div><div class="ind-detail-companies">${data.companies.map(company => `<article><span class="ind-detail-company-icon" aria-hidden="true">${esc(company.name.slice(0, 1))}</span><div><h4>${esc(company.name)}<em>${esc(company.matchLabel)}</em></h4><p>${esc(company.products || '暂无主营业务信息')}</p><div class="ind-detail-company-meta"><span>${esc(company.scale || '规模待补充')}</span><span>${esc(company.address || '地址待补充')}</span></div></div></article>`).join('') || '<p class="ind-detail-empty">当前企业库暂无该环节的代表企业名单</p>'}</div></section>
        <p class="ind-detail-note">企业数沿用当前图谱统计口径，代表企业为当前企业库的部分名单；“业务相关”按主营业务匹配。</p>
      </div><footer class="ind-detail-footer"><button type="button" class="ind-detail-done">关闭</button></footer>`
    const previousOverflow = document.body.style.overflow
    const close = () => dialog.close()
    dialog.querySelector('.ind-detail-close').onclick = close
    dialog.querySelector('.ind-detail-done').onclick = close
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return
      const bounds = dialog.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
    })
    dialog.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow
      dialog.remove()
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }, { once: true })
    const groupButton = dialog.querySelector('.ind-detail-view-groups')
    if (groupButton) groupButton.onclick = () => { dialog.addEventListener('close', () => onViewGroups(data.name), { once: true }); close() }
    document.body.appendChild(dialog)
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return dialog
  }
  root.IndustryNodeDetail = { buildData, open }
})(globalThis)
