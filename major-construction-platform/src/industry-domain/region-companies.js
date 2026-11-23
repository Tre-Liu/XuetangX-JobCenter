/* Shared by the Vue and file:// entries. */
;(function (root) {
  if (root.IndustryRegionCompanies) return

  const escape = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character])
  const provinceSuffix = /(?:壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市)$/
  const normalizeProvince = value => value.trim().replace(provinceSuffix, '')
  const profileFieldsByChain = {
    智能建造产业链: ['工程数字化服务', '智慧工地集成', '建筑机器人研发', '工程测绘服务', '智能施工装备'],
    人工智能产业链: ['机器视觉', '智能语音', '数据标注服务', '模型推理服务', '行业智能应用'],
    装配式建筑产业链: ['预制混凝土构件', '装配式钢结构', '模块化建筑', '构件智能生产', '装配施工服务'],
    建筑数字化服务链: ['BIM咨询', '工程造价软件', '项目协同平台', '建筑数据治理', '工程数字交付'],
    绿色低碳建造产业链: ['绿色建筑咨询', '园区能耗监测', '建筑节能改造', '低碳建材研发', '建筑运维服务']
  }

  function inProvince(companies, province) {
    const name = normalizeProvince(province)
    return companies.filter(company => company.province === undefined
      ? company.address?.trim().startsWith(name)
      : normalizeProvince(company.province) === name)
  }

  function companyRow(company) {
    const address = company.address || [company.province, company.city, company.district]
      .filter((part, index, parts) => part && parts.indexOf(part) === index).join(' · ')
    return `<tr>
      <th scope="row">${escape(company.name)}</th>
      <td class="region-company-credit-code">${escape(company.creditCode || '—')}</td>
      <td>${escape(address || '—')}</td>
    </tr>`
  }

  /** 画像依据为平台地图的行政区划及当前产业链业务方向。仅存于弹窗，信用代码留空。 */
  function buildCompanyProfiles(province, chain, count) {
    const regions = root.staticRegionCityGeoData?.[normalizeProvince(province)]?.features ?? []
    const fields = profileFieldsByChain[chain] ?? ['产业技术服务']
    return Array.from({ length: count }, (_, index) => {
      const region = regions.length ? regions[index % regions.length].name : province
      const field = fields[index % fields.length]
      const number = String(index + 1).padStart(2, '0')
      return {
        name: `${region}${field}企业画像 ${number}`,
        address: region === province ? province : `${province} · ${region}`
      }
    })
  }

  function pageButtons(page, pageCount) {
    const start = Math.max(1, Math.min(page - 1, pageCount - 2))
    const nearbyPages = [start, start + 1, start + 2].filter(number => number <= pageCount)
    const pages = [...new Set([1, ...nearbyPages, pageCount])]
    return pages.map((number, index) => `
      ${index > 0 && number - pages[index - 1] > 1 ? '<span class="region-company-page-gap" aria-hidden="true">…</span>' : ''}
      <button type="button" data-page="${number}" aria-label="第 ${number} 页"${number === page ? ' aria-current="page"' : ''}>${number}</button>`
    ).join('')
  }

  function open({ province, chain, companies }, opener = document.activeElement) {
    const pageSize = 10
    const pageCount = 10
    const maxRows = pageSize * pageCount
    const profiles = buildCompanyProfiles(province, chain, Math.max(0, maxRows - companies.length))
    const displayRows = [...companies.slice(0, maxRows), ...profiles]
    const dialog = document.createElement('dialog')
    dialog.className = 'industry-node-detail-dialog industry-region-companies-dialog'
    dialog.setAttribute('aria-labelledby', 'industry-region-companies-title')
    dialog.innerHTML = `
      <header class="ind-detail-header">
        <h2 id="industry-region-companies-title">${escape(province)}企业列表</h2>
        <button type="button" class="ind-detail-close" aria-label="关闭企业列表" autofocus>×</button>
      </header>
      <div class="ind-detail-body" tabindex="0" role="region" aria-label="企业明细">
        <table class="region-company-table" aria-label="企业明细">
          <thead>
            <tr><th scope="col">企业名称</th><th scope="col">统一社会信用代码</th><th scope="col">企业地址</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <footer class="ind-detail-footer">
        <span role="status"></span>
        <nav aria-label="企业列表分页">
          <button type="button" data-company-page="previous" aria-label="上一页">‹</button>
          <span class="region-company-page-numbers"></span>
          <button type="button" data-company-page="next" aria-label="下一页">›</button>
        </nav>
      </footer>`

    const body = dialog.querySelector('.ind-detail-body')
    const rows = body.querySelector('tbody')
    const status = dialog.querySelector('[role="status"]')
    const numbers = dialog.querySelector('.region-company-page-numbers')
    const previous = dialog.querySelector('[data-company-page="previous"]')
    const next = dialog.querySelector('[data-company-page="next"]')
    let page = 1
    const renderPage = (number) => {
      page = number
      const start = (page - 1) * pageSize
      const end = start + pageSize
      rows.innerHTML = displayRows.slice(start, end).map(companyRow).join('')
      numbers.innerHTML = pageButtons(page, pageCount)
      status.textContent = `第 ${start + 1}–${end} 条 · 共 ${pageCount} 页`
      previous.disabled = page === 1
      next.disabled = page === pageCount
      body.scrollTop = 0
    }
    const focusPage = () => numbers.querySelector('[aria-current="page"]').focus({ preventScroll: true })
    numbers.addEventListener('click', event => {
      const button = event.target.closest('[data-page]')
      if (!button) return
      renderPage(Number(button.dataset.page))
      focusPage()
    })
    previous.addEventListener('click', () => {
      renderPage(page - 1)
      if (previous.disabled) focusPage()
    })
    next.addEventListener('click', () => {
      renderPage(page + 1)
      if (next.disabled) focusPage()
    })
    renderPage(1)
    dialog.querySelector('.ind-detail-close').addEventListener('click', () => dialog.close())
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return
      const bounds = dialog.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close()
    })
    dialog.addEventListener('close', () => {
      dialog.remove()
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true })
    }, { once: true })
    document.body.appendChild(dialog)
    dialog.showModal()
  }

  root.IndustryRegionCompanies = { inProvince, open }
})(globalThis)
