(() => {
  if (customElements.get('graduate-analysis')) return

  const { cohorts, mentors, mentorField } = globalThis.GraduateAnalysisData
  const years = Object.keys(cohorts)
  const tabs = [
    ['units', '毕业生单位排名'],
    ['destinations', '升学去向'],
  ]
  const icons = {
    school: 'm3 9 9-5 9 5-9 5-9-5Zm4 3v5c3 3 7 3 10 0v-5m4-3v7',
    destination: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  }
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name]}"/></svg>`
  const escape = value => String(value).replace(/[&<>]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
  })[char])
  const cohortCounts = Object.entries(cohorts).map(([year, { destinations }]) => [
    year, destinations.reduce((total, [, count]) => total + count, 0),
  ])
  const axisStep = Math.max(10, Math.ceil(Math.max(...cohortCounts.map(([, count]) => count)) / 40) * 10)

  function renderMetric(label, value, unit, basis, iconName, tone = '') {
    return `<div class="ea-kpi">
      <dt class="ea-kpi-top">${label}<span class="ea-kpi-icon ${tone}">${icon(iconName)}</span></dt>
      <dd class="ea-kpi-value">${value}<small>${unit}</small></dd>
      <dd class="graduate-summary-basis">${basis}</dd>
    </div>`
  }

  function renderTrend(activeYear) {
    return `<div class="graduate-trend-axis" aria-hidden="true">
      ${[4, 3, 2, 1, 0].map(tick => `<span>${tick * axisStep}</span>`).join('')}
    </div>
    <ul class="graduate-trend-bars">
      ${cohortCounts.map(([year, count]) => `<li class="${year === activeYear ? 'is-selected' : ''}" style="--bar-height: ${count / (axisStep * 4) * 100}%">
        <span class="graduate-trend-year">${year}届</span>
        <div class="graduate-trend-column">
          <strong>${count}<small> 人</small></strong><span aria-hidden="true"></span>
        </div>
      </li>`).join('')}
    </ul>`
  }

  function renderTable(key, columns, rows) {
    return `<table class="graduate-table" aria-labelledby="graduate-${key}-title">
      <thead><tr>${columns.map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(row => `<tr>
        <th scope="row">${key === 'units' ? `<span class="graduate-rank">${row[0]}</span>` : escape(row[0])}</th>
        ${row.slice(1).map(value => `<td>${escape(value)}</td>`).join('')}
      </tr>`).join('')}</tbody>
    </table>`
  }

  function renderDirectory(key, title, { detail = '', count = '', table = '' } = {}) {
    return `<section class="graduate-results ea-card">
      <header class="graduate-section">
        <div class="graduate-section-copy"><h2 id="graduate-${key}-title">${title}</h2><p>${escape(detail)}</p></div>
        <span class="graduate-count">${count}</span>
      </header>
      <div class="graduate-scroll" role="region" aria-labelledby="graduate-${key}-title" data-graduate-table="${key}" tabindex="0">${table}</div>
    </section>`
  }

  class GraduateAnalysis extends HTMLElement {
    connectedCallback() {
      this.year = years[years.length - 1]
      this.tab = 'units'
      this.setAttribute('role', 'region')
      this.setAttribute('aria-label', '毕业分析')
      this.innerHTML = `
        <div class="graduate-toolbar ea-filterbar">
          <label class="graduate-year">毕业届别
            <select>${[...years].reverse().map(year => `<option value="${year}">${year}届</option>`).join('')}</select>
          </label>
          <nav class="graduate-tabs" aria-label="毕业分析内容">
            ${tabs.map(([key, label]) => `<button type="button" data-graduate-tab="${key}">${label}</button>`).join('')}
          </nav>
        </div>
        <dl class="graduate-summary ea-kpis" aria-label="升学概况"></dl>
        <div class="graduate-content" data-graduate-view="units">
          <div class="graduate-results ea-card">
            <header class="graduate-section">
              <div class="graduate-section-copy">
                <h2 id="graduate-units-title">毕业生单位排名</h2>
                <p>按《就业岗位（24-26届）》原表顺序列示，保留重复单位及其他去向。</p>
              </div>
              <div class="graduate-section-actions">
                <div class="graduate-ranking-years" role="group" aria-label="排名届别">
                  ${years.map(year => `<button type="button" data-graduate-year="${year}">${year}届</button>`).join('')}
                </div>
                <span class="graduate-count"></span>
              </div>
            </header>
            <div class="graduate-scroll" role="region" aria-labelledby="graduate-units-title" data-graduate-table="units" tabindex="0"></div>
          </div>
        </div>
        <div class="graduate-content graduate-destinations" data-graduate-view="destinations" hidden>
          <div class="graduate-destination-tables">
            ${renderDirectory('destinations', '升学去向')}
            ${renderDirectory('mentors', '研究方向与导师', {
              detail: `${mentorField} · 来源为《重点研究方向及导师》。`,
              count: `${mentors.length} 位导师`,
              table: renderTable('mentors', ['导师', '职称', '研究方向'], mentors),
            })}
          </div>
          <section class="graduate-trend ea-card" aria-labelledby="graduate-trend-title">
            <header class="graduate-trend-header"><h2 id="graduate-trend-title">近三届升研人数</h2><p>按各届升研明细统计</p></header>
            <div class="graduate-trend-chart"></div>
          </section>
        </div>`
      this.querySelector('select').addEventListener('change', event => this.selectYear(event.target.value))
      this.querySelectorAll('[data-graduate-year]').forEach(button => {
        button.addEventListener('click', () => this.selectYear(button.dataset.graduateYear))
      })
      this.querySelectorAll('[data-graduate-tab]').forEach(button => {
        button.addEventListener('click', () => {
          this.tab = button.dataset.graduateTab
          this.render()
        })
      })
      this.render()
      requestAnimationFrame(() => {
        this.closest('.job-content-area')?.querySelector('.job-graduate-overview')
          ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      })
    }

    selectYear(year) {
      if (year === this.year) return
      this.year = year
      this.render()
    }

    showOverview() {
      this.tab = 'units'
      this.render()
    }

    render() {
      const { destinations, units } = cohorts[this.year]
      const admitted = cohortCounts.find(([year]) => year === this.year)[1]
      this.querySelector('.graduate-summary').innerHTML = `
        ${renderMetric('升研人数', admitted, '人', '按升研明细统计', 'school')}
        ${renderMetric('升学去向数', destinations.length, '个', '按录取单位名称统计', 'destination', 'cyan')}`
      this.querySelector('select').value = this.year
      this.querySelectorAll('[data-graduate-view]').forEach(view => {
        view.hidden = view.dataset.graduateView !== this.tab
      })
      this.querySelectorAll('[data-graduate-year]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.graduateYear === this.year))
      })
      this.querySelectorAll('[data-graduate-tab]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.graduateTab === this.tab))
      })
      const scroll = this.querySelector(`[data-graduate-table="${this.tab}"]`)
      const section = scroll.previousElementSibling
      if (this.tab === 'units') {
        section.querySelector('.graduate-count').textContent = `${units.length} 条`
        const rankedUnits = units.map((unit, index) => [index + 1, unit])
        scroll.innerHTML = renderTable('units', ['排名', '单位／去向'], rankedUnits)
      } else {
        section.querySelector('p').textContent = `按${this.year}届升研一览表中的录取单位汇总。`
        section.querySelector('.graduate-count').textContent = `${destinations.length} 个去向`
        scroll.innerHTML = renderTable('destinations', ['录取单位', '升研人数（人）'], destinations)
        this.querySelector('.graduate-trend-chart').innerHTML = renderTrend(this.year)
      }
      scroll.scrollTop = 0
    }
  }

  customElements.define('graduate-analysis', GraduateAnalysis)
})()
