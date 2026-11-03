/* Small inline sections embedded in existing business pages; no independent workspace. */
;(function (root) {
  if (customElements.get('industry-business')) return
  const M = root.IndustryDomain
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const option = (value, label, selected) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`
  class IndustryBusiness extends HTMLElement {
    set context(value) { this.data = value; if (this.isConnected) this.render() }
    connectedCallback() {
      if (!this.data) { try { this.data = JSON.parse(this.getAttribute('data-context') || '{}') } catch { this.data = {} } }
      this.state = M.load(localStorage)
      this.onclick = e => this.click(e)
      this.onchange = e => this.change(e)
      this.onkeydown = e => {
        if (e.key === 'Escape' && this.querySelector('.portrait-group-popover')?.matches(':popover-open')) {
          e.preventDefault(); e.stopPropagation(); this.closeGroupPicker(true)
        }
      }
      this.oninput = e => {
        if (e.target.matches('[data-group-search]')) {
          this.groupQuery = e.target.value
          this.updateGroupOptions()
        }
      }
      this.closeOnViewportChange = e => {
        if (!(e?.target instanceof Node) || !this.querySelector('.portrait-group-popover')?.contains(e.target)) this.closeGroupPicker()
      }
      window.addEventListener('resize', this.closeOnViewportChange)
      window.addEventListener('scroll', this.closeOnViewportChange, true)
      this.onsubmit = e => this.submit(e)
      this.refresh = () => { this.state = M.load(localStorage); this.render() }
      window.addEventListener('portrait-industry-change', this.refresh)
      this.render()
    }
    disconnectedCallback() {
      window.removeEventListener('portrait-industry-change', this.refresh)
      window.removeEventListener('resize', this.closeOnViewportChange)
      window.removeEventListener('scroll', this.closeOnViewportChange, true)
    }
    save() {
      try { localStorage.setItem(M.storageKey, JSON.stringify(this.state)) } catch { this.notice = '本地保存失败，请导出关系后保留。'; this.render(); return }
      window.dispatchEvent(new CustomEvent('portrait-industry-change'))
    }
    emit(action, detail) { this.dispatchEvent(new CustomEvent('industry-business-action', { bubbles: true, detail: { action, ...detail } })) }
    get jobGroupsEnabled() { return this.data?.jobGroupsEnabled !== false }
    get jobs() { return this.data?.jobs || [] }
    get currentGroupName() {
      const job = this.jobs.find(j => j.id === this.data?.jobId)
      return job ? M.groupName(job, this.state?.membership) : this.data?.group
    }
    get courses() { return this.data?.courses || [] }
    get groups() { return M.groups(this.jobs, this.state?.membership) }
    render() {
      if (!this.data || !this.state) return
      const opened = [...this.querySelectorAll('details[open]')].map(d => d.querySelector('summary span')?.textContent || d.querySelector('summary')?.textContent)
      const kind = this.data.kind
      if (!this.jobGroupsEnabled && kind !== 'courses') { this.innerHTML = ''; return }
      this.className = 'industry-business-inline'
      this.innerHTML = (kind === 'group-overview' ? this.groupOverview() : kind === 'groups' ? this.groupCards() : kind === 'courses' ? this.coursePanel() : kind === 'trends' ? this.trends() : kind === 'applications' ? this.applications() : kind === 'resource' ? this.resource() : kind === 'recruitment' ? this.recruitment() : '') + (this.notice ? `<p role="status" class="ib-notice">${esc(this.notice)}</p>` : '')
      this.querySelectorAll('details').forEach(d => { if (opened.includes(d.querySelector('summary span')?.textContent || d.querySelector('summary')?.textContent)) d.open = true })
    }
    groupExport() {
      return this.currentGroupName ? this.groups.find(g => g.name === this.currentGroupName) : this.groups
    }
    get groupScope() {
      return this.data.scope || { groups: this.groups, visibleGroups: this.groups.slice(0, 10), jobs: this.jobs, group: this.data.group || '' }
    }
    groupPill(group) {
      return `<button type="button" data-group-filter="${esc(group.name)}" aria-pressed="${group.name === this.groupScope.group}" title="${esc(group.name)}"><span class="portrait-group-name">${esc(group.name)}</span><span class="portrait-group-count">${group.members.length} 个岗位</span></button>`
    }
    groupOptions() {
      const query = (this.groupQuery || '').trim().toLocaleLowerCase(), scope = this.groupScope
      const groups = query ? scope.groups.filter(g => g.name.toLocaleLowerCase().includes(query))
        : this.groupShowAll ? scope.groups : scope.visibleGroups
      const unrestricted = query ? '' : `<button type="button" data-group-filter="" aria-pressed="${!scope.group}">不限<span class="portrait-group-count">${scope.jobs.length} 个岗位</span></button>`
      return unrestricted + (groups.map(g => this.groupPill(g)).join('') || '<p class="portrait-group-empty" role="status">未找到匹配岗位群</p>')
    }
    updateGroupOptions() {
      this.querySelector('[data-group-options]').innerHTML = this.groupOptions()
      const more = this.querySelector('[data-group-more]')
      if (more) more.hidden = Boolean(this.groupShowAll || this.groupQuery?.trim() || this.groupScope.groups.length <= 10)
      this.querySelector('[data-group-options]').scrollTop = 0
    }
    closeGroupPicker(restoreFocus = false) {
      const popover = this.querySelector?.('.portrait-group-popover')
      if (popover?.matches(':popover-open')) popover.hidePopover()
      this.querySelector?.('[data-group-all]')?.setAttribute('aria-expanded', 'false')
      if (restoreFocus) this.querySelector?.('[data-group-all]')?.focus()
    }
    openGroupPicker() {
      const popover = this.querySelector('.portrait-group-popover'), trigger = this.querySelector('[data-group-all]')
      if (!popover || !trigger) return
      if (popover.matches(':popover-open')) { this.closeGroupPicker(true); return }
      this.groupQuery = ''
      this.groupShowAll = false
      popover.querySelector('[data-group-search]').value = ''
      this.updateGroupOptions()
      const rect = trigger.getBoundingClientRect(), width = Math.min(Math.max(rect.width, 400), window.innerWidth - 32)
      const below = window.innerHeight - rect.bottom - 16, above = rect.top - 16
      const height = Math.min(360, Math.max(below, above))
      // Bounding rects use viewport pixels; top-layer elements still inherit ancestor CSS zoom.
      let zoom = 1
      for (let ancestor = popover; ancestor; ancestor = ancestor.parentElement) {
        const value = getComputedStyle(ancestor).zoom
        zoom *= value.endsWith('%') ? parseFloat(value) / 100 : parseFloat(value) || 1
      }
      popover.style.width = `${width / zoom}px`
      popover.style.maxHeight = `${height / zoom}px`
      popover.style.left = `${Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)) / zoom}px`
      popover.ontoggle = event => trigger.setAttribute('aria-expanded', String(event.newState === 'open'))
      popover.showPopover()
      const actualHeight = popover.getBoundingClientRect().height
      popover.style.top = `${(below >= Math.min(360, above) ? rect.bottom + 8 : Math.max(8, rect.top - actualHeight - 8)) / zoom}px`
      trigger.setAttribute('aria-expanded', 'true')
      popover.querySelector('[data-group-search]').focus()
    }
    groupOverview() {
      const scope = this.groupScope, groups = scope.groups
      return `<section class="portrait-group-overview" aria-label="岗位群筛选"><div class="portrait-group-filter-row"><h3>岗位群</h3>
      <button class="portrait-group-select" type="button" data-group-all aria-label="按岗位群筛选：${esc(scope.group || '不限')}" aria-haspopup="dialog" aria-expanded="false" ${!groups.length ? 'disabled' : ''} title="${esc(scope.group || '不限')}"><span>${esc(scope.group || '不限')}</span><span aria-hidden="true">⌄</span></button>
      <label class="portrait-major-only"><input type="checkbox" data-group-major-only ${this.data.majorOnly !== false ? 'checked' : ''}>与本专业相关</label><span class="portrait-group-total">共 ${groups.length} 个岗位群</span></div>
      ${groups.length ? `<div class="portrait-group-popover" popover="auto" role="dialog" aria-label="选择岗位群"><div class="portrait-group-picker-head"><span>按岗位数量从多到少</span><button type="button" data-group-close aria-label="关闭岗位群选择">×</button></div><input type="search" data-group-search placeholder="搜索全部 ${groups.length} 个岗位群" aria-label="搜索岗位群名称" autocomplete="off"><div class="portrait-group-options" data-group-options role="group" aria-label="岗位群选项">${this.groupOptions()}</div><button type="button" class="portrait-group-more" data-group-more ${groups.length <= 10 ? 'hidden' : ''}>查看全部 ${groups.length} 个岗位群</button></div>` : ''}</section>`
    }
    groupCards() {
      const groups = this.groups.filter(g => g.members.length).sort((a, b) => this.data.sort === 'demand' ? b.demand - a.demand : this.data.sort === 'salary' ? b.salary - a.salary : this.data.sort === 'match' ? this.groupMatch(b) - this.groupMatch(a) : 0)
      return `<div class="ib-group-grid">${groups.map(g => `<button type="button" class="ib-group-card" data-group="${esc(g.name)}"><small>${esc(g.field)} · ${esc(g.stages.join(' / '))}</small><strong>${esc(g.name)}</strong><p>${esc(g.nodes.join(' · '))}</p><footer><span>${g.members.length} 个岗位</span><span>需求 ${g.demand.toLocaleString()}</span><b>查看群内岗位 →</b></footer></button>`).join('')}</div>`
    }
    groupMatch(group) {
      const all = group.members.flatMap(M.abilities)
      return all.length ? all.filter(a => (this.state.relations[a.key] || []).length).length / all.length : 0
    }
    coursePanel() {
      const job = this.jobs.find(j => j.id === this.data.jobId)
      if (!job) return ''
      const all = M.abilities(job)
      const list = all.filter(a => (!this.dimension || a.dimension === this.dimension) && (!this.unmatched || !(this.state.relations[a.key] || []).length) && (!this.query || a.name.includes(this.query)))
      return `<section class="ib-course-section"><details><summary>查看与校准 ${list.length} 项能力的支撑课程</summary><div class="ib-ability-list">${list.map(a => {const ids=this.state.relations[a.key] || [];return `<details class="ib-ability-row"><summary><span><em>${esc(a.dimension)}</em>${esc(a.name)}</span><b>${ids.length ? `${ids.length} 门支撑课程` : '未匹配'}</b></summary><p class="ib-note">${ids.map(id => esc(this.courses.find(c => c.id === id)?.name || '')).join('、') || '勾选实际支撑该能力的课程。'}</p><div class="ib-course-checks">${this.courses.map(c => `<label><input type="checkbox" data-ability="${esc(a.key)}" value="${esc(c.id)}" ${ids.includes(c.id) ? 'checked' : ''}>${esc(c.name)}${c.jobIds?.includes(job.id) ? '<small>原岗位关联</small>' : ''}</label>`).join('')}</div></details>`}).join('') || '<p>没有符合条件的能力。</p>'}</div></details></section>`
    }
    trends() {
      const relevant = M.trends.filter(t => t.groupIndexes.some(i => M.definitions[i][4].some(index => M.chains[index] === this.data.chain)))
      return `<section class="research-card ib-native-card"><div class="research-card-head"><h3>行业趋势对产业链的影响</h3><span>行业趋势研判</span></div><div class="ib-trend-grid">${relevant.map(t => `<details><summary><small>${esc(t.industry)} · ${esc(t.stage)}</small><strong>${esc(t.title)}</strong></summary><p>${esc(t.summary)}</p><p>${esc(t.impact)}</p><div class="ib-links">${t.groupIndexes.filter(i => M.definitions[i][4].some(index => M.chains[index] === this.data.chain)).map(i => `<button type="button" data-group="${esc(M.definitions[i][0])}">${esc(M.definitions[i][0])} →</button>`).join('')}</div><small>${esc(t.evidence)}</small></details>`).join('')}</div></section>`
    }
    applications() {
      return `<section class="research-card ib-native-card"><div class="research-card-head"><h3>应用领域与人才需求</h3><span>产业环节的应用演进 · 趋势研判</span></div><div class="ib-application-grid">${M.applications.filter(a => M.definitions[a.groupIndex][4].some(i => M.chains[i] === this.data.chain)).map(a => `<details><summary>${esc(a.name)}<small>${esc(M.definitions[a.groupIndex][2].join(' / '))}</small></summary><dl><dt>过去</dt><dd>${esc(a.history)}</dd><dt>当前</dt><dd>${esc(a.current)}</dd><dt>未来</dt><dd>${esc(a.future)}</dd></dl><p>${esc(a.value)}</p><button type="button" data-group="${esc(M.definitions[a.groupIndex][0])}">查看关联岗位群 →</button></details>`).join('')}</div></section>`
    }
    resource() {
      const text = this.data.title || ''
      const index = /机器人/.test(text) ? 2 : /孪生|BIM/.test(text) ? 0 : /结构|质量/.test(text) ? 4 : /装配/.test(text) ? 1 : /低碳|能耗/.test(text) ? 6 : /扫描|无人机/.test(text) ? 5 : 3
      const d = M.definitions[index]
      return `<details class="ib-resource"><summary>知识、技能与教学应用</summary><p><b>知识：</b>${esc(d[6].join('、'))}</p><p><b>技能：</b>${esc(d[7].join('、'))}</p><p><b>训练任务：</b>结合${esc(text)}场景，提交方案、过程记录与验收结果。</p><button type="button" data-group="${esc(d[0])}">查看对应岗位画像 →</button><small>教学建议；课件、视频与习题资源待接入。</small></details>`
    }
    recruitment() {
      const groups = this.groups
      const rows = this.jobs.filter(j => !this.recruitGroup || M.groupName(j, this.state.membership) === this.recruitGroup)
      const added = this.state.recruitment.filter(r => rows.some(j => j.id === r.jobId))
      return `<section class="research-card ib-native-card"><div class="research-card-head"><h3>岗位群需求分布</h3><label>技术领域岗位群<select data-recruit-group aria-label="招聘岗位群">${option('', '全部', this.recruitGroup || '')}${groups.map(g => option(g.name, g.name, this.recruitGroup)).join('')}</select></label></div><div class="ib-demand-table"><table class="research-table"><thead><tr><th>岗位群</th><th>岗位数</th><th>汇总需求</th><th>薪资中点均值</th></tr></thead><tbody>${groups.filter(g => !this.recruitGroup || g.name === this.recruitGroup).map(g => `<tr><td><button type="button" data-group="${esc(g.name)}">${esc(g.name)} ↗</button></td><td>${g.members.length}</td><td>${g.demand.toLocaleString()}</td><td>${g.salary || '—'}K</td></tr>`).join('')}</tbody></table></div><details><summary>补充企业招聘记录（${added.length} 条）</summary><p class="ib-note">人工补充记录单列展示，不混入原招聘样本统计。</p><form class="ib-recruit-form" data-recruit-form><select name="jobId" aria-label="招聘岗位">${rows.map(j => option(j.id, j.name, '')).join('')}</select><input name="company" required placeholder="企业名称" aria-label="企业名称"><input name="region" required placeholder="招聘地区" aria-label="招聘地区"><input name="count" type="number" min="1" max="99999" required placeholder="人数" aria-label="招聘人数"><input name="salary" required placeholder="薪资范围" aria-label="招聘薪资"><button>保存招聘记录</button></form>${added.map(r => `<p>${esc(this.jobs.find(j => j.id === r.jobId)?.name)} · ${esc(r.company)} · ${esc(r.region)} · ${r.count} 人 · ${esc(r.salary)} <small>人工补充</small></p>`).join('')}</details></section>`
    }
    click(e) {
      const button = e.target.closest('button')
      if (!button) return
      if (this.jobGroupsEnabled && Object.hasOwn(button.dataset, 'groupAll')) { this.openGroupPicker(); return }
      if (Object.hasOwn(button.dataset, 'groupMore')) { this.groupShowAll = true; this.updateGroupOptions(); this.querySelector('[data-group-search]').focus(); return }
      if (Object.hasOwn(button.dataset, 'groupClose')) { this.closeGroupPicker(true); return }
      if (this.jobGroupsEnabled && Object.hasOwn(button.dataset, 'groupFilter')) {
        this.closeGroupPicker()
        this.emit('group-filter', { group: button.dataset.groupFilter })
        // The parent may recreate the static panel; keep the compact selector focused.
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => {
          document.querySelector('industry-business [data-group-all]')?.focus({ preventScroll: true })
        })
      }
      if (this.jobGroupsEnabled && button.dataset.group) this.emit('group', { group: button.dataset.group })
      if (button.dataset.job) this.emit('job', { jobId: button.dataset.job })
      if (button.dataset.export) {
        if (!this.jobGroupsEnabled && button.dataset.export === 'group') return
        const group = this.groupExport()
        const jobs = this.data.jobId ? this.jobs.filter(j => j.id === this.data.jobId) : this.jobs
        const value = button.dataset.export === 'group' ? group : jobs.flatMap(M.abilities).map(a => ({ key: a.key, name: a.name, dimension: a.dimension, courseIds: this.state.relations[a.key] || [] }))
        const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob)
        const link = document.createElement('a'); link.href = url; link.download = button.dataset.export === 'group' ? `${this.currentGroupName || '全部岗位群'}.json` : '能力课程关系.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    }
    async change(e) {
      const t = e.target
      if (this.jobGroupsEnabled && t.hasAttribute('data-group-major-only')) { this.emit('group-scope', { majorOnly: t.checked }); return }
      if (!this.jobGroupsEnabled && ['data-membership', 'data-add-member', 'data-target', 'data-recruit-group'].some(attr => t.hasAttribute(attr))) return
      if (t.hasAttribute('data-membership')) { this.state.membership[t.dataset.membership] = t.value; this.save() }
      if (t.hasAttribute('data-add-member') && t.value) { this.state.membership[t.value] = this.currentGroupName; this.save() }
      if (t.hasAttribute('data-target')) { this.state.targets[this.currentGroupName] = Math.min(100, Math.max(0, Number(t.value))); this.save() }
      if (t.hasAttribute('data-dimension')) { this.dimension = t.value; this.render() }
      if (t.hasAttribute('data-unmatched')) { this.unmatched = t.checked; this.render() }
      if (t.hasAttribute('data-recruit-group')) { this.recruitGroup = t.value; this.render() }
      if (t.hasAttribute('data-ability')) {
        const ids = new Set(this.state.relations[t.dataset.ability] || [])
        t.checked ? ids.add(t.value) : ids.delete(t.value)
        this.state.relations[t.dataset.ability] = [...ids]; this.save()
      }
      if (t.hasAttribute('data-import-relations') && t.files[0]) {
        try {
          if (t.files[0].size > 2000000) throw new Error('文件不能超过 2 MB。')
          const validated = M.validateRelations(JSON.parse(await t.files[0].text()), this.jobs, this.courses)
          Object.assign(this.state.relations, validated); this.notice = `已导入 ${Object.keys(validated).length} 项能力课程关系。`; this.save()
        } catch (error) { this.notice = error.message; this.render() }
      }
    }
    submit(e) {
      e.preventDefault()
      const form = e.target, data = new FormData(form)
      if (form.hasAttribute('data-ability-search')) { this.query = String(data.get('query') || '').trim(); this.render() }
      if (form.hasAttribute('data-recruit-form')) {
        this.state.recruitment.push({ jobId: String(data.get('jobId')), company: String(data.get('company')).trim(), region: String(data.get('region')).trim(), count: Number(data.get('count')), salary: String(data.get('salary')).trim() }); this.save()
      }
    }
  }
  customElements.define('industry-business', IndustryBusiness)
})(globalThis)
