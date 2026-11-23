/* Shared by the standalone page and the Vue workspace. */
;(function (root) {
  if (!root.customElements || root.customElements.get('knowledge-domain-graph')) return

  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char])
  const paths = {
    spark: '<path d="m12 2 2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2Z" fill="currentColor" stroke="none"/><path d="m20 16 .9 2.1L23 19l-2.1.9L20 22l-.9-2.1L17 19l2.1-.9L20 16Z" fill="currentColor" stroke="none"/>',
    template: '<path d="M13 20H5V4h13v9m-4 4h7m-3-3 3 3-3 3"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    file: '<path d="M13 3H5v18h14V9l-6-6Z"/><path d="M13 3v6h6M8 14h8m-8 3h5"/>',
    upload: '<path d="M12 16V3m-4 4 4-4 4 4M4 15v5h16v-5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    fit: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>',
    domains: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    connections: '<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="m7.2 10.9 9.6-4.8m-9.6 7 9.6 4.8"/>',
    sharedDomains: '<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>',
    moon: '<path d="M20.9 13.3A9 9 0 0 1 10.7 3.1a9 9 0 1 0 10.2 10.2Z"/>',
    right: '<path d="m9 5 7 7-7 7"/>', left: '<path d="m15 5-7 7 7 7"/>',
    edit: '<path d="m4 20 1-5L16 4l4 4L9 19l-5 1Zm10-14 4 4"/>',
    trash: '<path d="M4 6h16m-10 0V3h4v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>'
  }
  const icon = key => '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' + paths[key] + '</svg>'
  const control = (action, label, glyph) => `<button type="button" class="kdg-icon-button" data-act="${action}" title="${label}" aria-label="${label}">${icon(glyph)}</button>`
  const viewSwitch = (action, label, glyph, checked, description = label) =>
    `<button type="button" role="switch" class="kdg-view-button" data-act="${action}" aria-checked="${checked}" title="${description}" aria-label="${description}">${icon(glyph)}<span>${label}</span></button>`
  const pointFilters = { 'cross-course': '跨课程知识点', 'cross-domain': '跨领域知识点' }
  function summarizePointPaths(paths) {
    const counts = new Map()
    let total = 0
    for (const path of paths) {
      total++
      const [course, unit, section] = path.split('/')
      const keys = [path, course + '///', [course, unit, '', ''].join('/')]
      if (section) keys.push([course, unit, section, ''].join('/'))
      for (const key of keys) counts.set(key, (counts.get(key) || 0) + 1)
    }
    return { counts, total }
  }
  const pageSize = 24
  const themeKey = 'knowledge-domain:theme'
  const initializedRecord = '{"initialized":true}'
  const initializeButton = '<button type="button" class="kdg-secondary kdg-initialize" data-act="initialize">初始化</button>'
  const pager = (count, page, target) => {
    if (count <= pageSize) return ''
    return `<div class="kdg-pager"><button type="button" data-act="${target}-prev" aria-label="上一页" ${page === 0 ? 'disabled' : ''}>${icon('left')}</button><span>${page + 1} / ${Math.ceil(count / pageSize)}</span><button type="button" data-act="${target}-next" aria-label="下一页" ${(page + 1) * pageSize >= count ? 'disabled' : ''}>${icon('right')}</button></div>`
  }
  const pagePart = (items, page) => items.slice(page * pageSize, (page + 1) * pageSize)
  const present = value => typeof value === 'string' && value.trim().length > 0
  const validPoints = points => Array.isArray(points) && points.every(present)
  const validGraph = graph => present(graph?.major) && Array.isArray(graph.courses) && graph.courses.length > 0 && graph.courses.every(
    course => present(course?.name) && Array.isArray(course.topics) && course.topics.every(
      unit => present(unit?.name) && (Array.isArray(unit.points) || Array.isArray(unit.sections)) &&
        (unit.points === undefined || validPoints(unit.points)) &&
        (unit.sections === undefined || (Array.isArray(unit.sections) && unit.sections.every(section => present(section?.name) && validPoints(section.points))))
    )
  )
  function nodeAt(graph, path) {
    if (!Array.isArray(path) || path.length !== 4 || path.some(i => i !== null && (!Number.isInteger(i) || i < 0))) return null
    const [ci, ui, si, pi] = path
    const course = graph?.courses[ci]
    if (!course) return null
    const unit = course.topics[ui]
    const section = unit?.sections?.[si]
    const point = (si === null ? unit : section)?.points?.[pi]
    if ((ui !== null && !unit) || (si !== null && !section) || (pi !== null && !point)) return null
    return { course, unit, section, point, name: point || section?.name || unit?.name || course.name }
  }
  const pathOf = ({ course, topic, section, point }) => [course, topic, section, point]
  const nodeKind = ({ point, section }) => point ? '知识点' : section ? '主题' : '知识单元'
  function reindexRelationPath(path, removed, depth) {
    if (removed.slice(0, depth).some((index, level) => path[level] !== index)) return path
    if (path[depth] === removed[depth]) return null
    if (path[depth] > removed[depth]) {
      const shifted = path.slice()
      shifted[depth]--
      return shifted
    }
    return path
  }
  function graphWithoutNode(graph, path, depth) {
    const updated = JSON.parse(JSON.stringify(graph))
    const { course, unit, section } = nodeAt(updated, path)
    const index = path[depth]
    if (depth === 1) course.topics.splice(index, 1)
    else if (depth === 2) unit.sections.splice(index, 1)
    else {
      const owner = section || unit
      owner.points.splice(index, 1)
      owner.pointSources?.splice(index, 1)
      const shift = position => position > index ? position - 1 : position
      if (owner.editedPoints) owner.editedPoints = owner.editedPoints.filter(position => position !== index).map(shift)
      for (const field of ['pointDomains', 'manualPointDomains', 'pointNotes']) {
        if (!owner[field]) continue
        owner[field] = Object.fromEntries(Object.entries(owner[field])
          .filter(([position]) => Number(position) !== index).map(([position, value]) => [shift(Number(position)), value]))
      }
    }
    if (Array.isArray(updated.relations)) {
      updated.relations = updated.relations.flatMap(edge => {
        if (!nodeAt(graph, edge?.from)?.point || !nodeAt(graph, edge.to)?.point) return []
        const from = reindexRelationPath(edge.from, path, depth)
        const to = reindexRelationPath(edge.to, path, depth)
        return from && to ? [{ ...edge, from, to }] : []
      })
    }
    return updated
  }
  const searchLabel = '搜索课程、知识点、知识领域、培养目标'
  const searchText = value => String(value ?? '').normalize('NFKC').trim().toLowerCase()
  function knowledgeCounts(units) {
    let sections = 0, points = 0
    for (const unit of units) {
      sections += unit.sections?.length || 0
      points += unit.points?.length || 0
      for (const section of unit.sections || []) points += section.points.length
    }
    return { sections, points }
  }
  function domainList(label, domains, indices) {
    const items = [...indices].map(index => {
      const domain = domains[index]
      if (!domain || domain.deleted) return ''
      const style = /^#[a-f\d]{6}$/i.test(domain.color) ? ` style="--land:${domain.color}"` : ''
      return `<li${style}><button type="button" class="kdg-domain-link" data-act="atlas-domain" data-index="${index}"><span>${escape(domain.name)}</span>${icon('right')}</button></li>`
    }).join('')
    return items ? `<dl class="kdg-detail-domain"><dt>${label}</dt><dd><ul>${items}</ul></dd></dl>` : ''
  }
  function atlasLinks(label, action, entries, empty) {
    const links = entries.map(({index, name, note}) =>
      `<button type="button" class="kdg-relation" data-act="${action}" data-index="${index}"><strong>${escape(name)} ${icon('right')}</strong>${note ? `<small>${escape(note)}</small>` : ''}</button>`
    ).join('')
    return `<div class="kdg-relations"><h5>${label}</h5>${links || `<p class="kdg-summary">${empty}</p>`}</div>`
  }
  const normalizeContext = value => ({
    major: String(value?.major ?? '').trim(),
    plan: present(value?.plan?.text) ? {name:String(value.plan.name || '专业培养方案'),text:value.plan.text} : null,
    scope: String(value?.scope ?? '').trim(),
    courses: (value?.courses || []).filter(item => present(item?.name)).map(course => ({ ...course, id: String(course.id ?? course.name), name: course.name.trim(), isCore: course.isCore === true })),
    materials: (value?.materials || []).filter(item => present(item?.name) && present(item?.text)).map(item => ({ ...item })),
    curriculumRevision: String(value?.curriculumRevision || ''),
    relationSeeds: Array.isArray(value?.relationSeeds) ? value.relationSeeds : [],
    suggestedGoals: Array.isArray(value?.suggestedGoals) ? value.suggestedGoals.filter(g=>present(g?.title) && present(g?.text)) : []
  })
  const sameEntries = (left, right, fields) => left.length === right.length && left.every((entry, index) => fields.every(field => entry[field] === right[index][field]))
  let sequence = 0

  class KnowledgeDomainGraph extends HTMLElement {
    constructor() {
      super()
      this.input = normalizeContext(null)
      this.graph = null
      this.fileNames = []
      this.domainsVisible = true
      this.pointFilter = ''
      this.darkMode = false
      this.preferredTheme = null
      this.applyTheme = this.applyTheme.bind(this)
      this.uid = 'kdg-' + ++sequence
      this.onClick = this.onClick.bind(this)
      this.onInput = this.onInput.bind(this)
      this.onChange = this.onChange.bind(this)
      this.onKeyDown = this.onKeyDown.bind(this)
    }

    set context(value) {
      const previous = this.input
      const next = normalizeContext(value)
      this.input = next
      if (!this.isConnected || !this.ready) return
      if (next.major !== previous.major || next.scope !== previous.scope || next.curriculumRevision !== previous.curriculumRevision) { this.loadContext(); return }
      const coursesChanged = !sameEntries(next.courses, previous.courses, ['id', 'name', 'isCore'])
      const sourceChanged = coursesChanged || next.courses.some((course, index) => course.topics !== previous.courses[index]?.topics)
      if (sourceChanged && (!this.graph || this.graph.mode === 'course-group')) {
        this.loadContext()
        return
      }
      if (this.graph && (next.plan?.text !== previous.plan?.text || next.plan?.name !== previous.plan?.name ||
          !sameEntries(next.suggestedGoals,previous.suggestedGoals,['title','text']))) {
        this.renderWorkspace()
        return
      }
      if (coursesChanged || !sameEntries(next.materials, previous.materials, ['name', 'text'])) {
        // A changed course archive invalidates an in-flight request for that archive.
        if (this.job) this.closeDialog()
        if (this.draft) this.updateDraft()
        if (this.graph && coursesChanged) void this.mountScene()
      }
    }
    get context() { return this.input }
    get readOnly() { return this.dataset.presentation === 'results' }
    get legacyKey() {
      return this.input.scope && this.input.major ? 'knowledge-domain:v1:' + JSON.stringify([this.input.scope, this.input.major]) : ''
    }
    revisionKey(revision) {
      if (!revision || !this.legacyKey) return this.legacyKey
      return 'knowledge-domain:v2:' + JSON.stringify([this.input.scope, this.input.major, revision])
    }
    get storageKey() { return this.revisionKey(this.input.curriculumRevision) }
    $(selector) { return this.querySelector(selector) }

    connectedCallback() {
      // Upgrade values that were assigned before the custom element was registered.
      if (Object.hasOwn(this, 'context')) {
        const pending = this.context
        delete this.context
        this.context = pending
      }
      this.addEventListener('click', this.onClick)
      this.addEventListener('input', this.onInput)
      this.addEventListener('change', this.onChange)
      root.addEventListener('keydown', this.onKeyDown)
      if (this.readOnly) {
        this.themeHost = this.closest('.results-portal-shell')
        if (this.themeHost) {
          this.themeObserver = new MutationObserver(this.applyTheme)
          this.themeObserver.observe(this.themeHost, { attributes: true, attributeFilter: ['data-theme'] })
        }
      } else {
        this.systemTheme = root.matchMedia?.('(prefers-color-scheme: dark)')
        try { this.preferredTheme = root.localStorage.getItem(themeKey) } catch {}
        this.systemTheme?.addEventListener?.('change', this.applyTheme)
      }
      this.ready = true
      this.loadContext()
    }
    disconnectedCallback() {
      this.ready = false
      this.closeDialog()
      this.stopScene()
      this.removeEventListener('click', this.onClick)
      this.removeEventListener('input', this.onInput)
      this.removeEventListener('change', this.onChange)
      root.removeEventListener('keydown', this.onKeyDown)
      this.systemTheme?.removeEventListener?.('change', this.applyTheme)
      this.themeObserver?.disconnect()
      this.themeObserver = null
      this.themeHost = null
    }
    applyTheme() {
      const explicit = this.preferredTheme === 'dark' || this.preferredTheme === 'light'
      this.darkMode = this.readOnly
        ? this.themeHost?.dataset.theme !== 'light'
        : Boolean(this.graph) && (explicit ? this.preferredTheme === 'dark' : Boolean(this.systemTheme?.matches))
      this.dataset.theme = this.darkMode ? 'dark' : 'light'
      this.$('[data-act="toggle-theme"]')?.setAttribute('aria-checked', String(this.darkMode))
      this.scene?.setDarkMode(this.darkMode)
    }
    loadContext() {
      this.resultsIntro = this.readOnly
      this.domainsVisible=true
      this.pointFilter=''
      try { if(!this.readOnly && this.legacyKey) this.domainsVisible=root.localStorage.getItem(this.legacyKey+':show-domains')!=='0' } catch {}
      this.closeDialog()
      this.stopScene()
      this.graph = null
      this.fileNames = []
      this.saveMessage = ''
      this.storedRecord = null
      this.historyShown = false
      this.previousRecord = null
      this.catalogueRecord = null
      this.currentRecord = null
      try {
        const read = (key, current = false) => {
          try {
            const value = key && root.localStorage.getItem(key)
            if (current) this.storedRecord = value
            if (current && value === initializedRecord) return { initialized: true }
            const saved = JSON.parse(value)
            if (!validGraph(saved?.graph) || saved.graph.major !== this.input.major) return null
            return { graph: saved.graph, fileNames: Array.isArray(saved.fileNames) ? saved.fileNames.filter(present) : [] }
          } catch { return null }
        }
        const saved = read(this.storageKey, true)
        // An explicit reset must take precedence over the legacy import paths.
        if (saved?.initialized) {
          this.loadCourseGroup()
          this.renderWorkspace()
          return
        }
        const legacy = this.legacyKey !== this.storageKey ? read(this.legacyKey) : null
        const model = root.KnowledgeDomainModel
        const priorRevision = model?.previousRevision?.(this.input.curriculumRevision)
        const prior = priorRevision ? read(this.revisionKey(priorRevision)) : null
        const catalogue = root.TalentPlanData?.courses || []
        const oldIds = new Set(legacy?.graph.courses.map(course => course.id))
        const isOldCatalogue = oldIds.size >= 74 && catalogue.length === 74 && catalogue.every(course => oldIds.has(course.id))
        if (saved) {
          this.applyRecord(saved)
          this.previousRecord = prior || (isOldCatalogue ? legacy : null)
          if (prior && isOldCatalogue) this.catalogueRecord = legacy
        } else if (prior) {
          this.applyRecord(prior)
          if (isOldCatalogue) this.previousRecord = legacy
          const graph = model.upgradeCurriculum(prior.graph,this.input)
          if (graph) {
            this.catalogueRecord = this.previousRecord
            this.previousRecord = prior
            this.applyRecord({graph,fileNames:[...prior.fileNames]})
            this.save()
          }
        } else if (legacy) {
          this.applyRecord(legacy)
          if (isOldCatalogue) {
            const graph = root.KnowledgeDomainModel.fromCurriculum(this.input)
            if (validGraph(graph) && graph.major === this.input.major) {
              this.previousRecord = legacy
              this.applyRecord({ graph, fileNames: [] })
              this.save()
            }
          }
        }
      } catch { /* Unavailable storage or an obsolete record leaves the course group available. */ }
      if (!this.graph) {
        this.loadCourseGroup()
        this.renderWorkspace()
        return
      }
      const supplemented = this.withPracticePoints(this.graph)
      if (supplemented !== this.graph) {
        this.graph = supplemented
        this.save()
      }
      this.renderWorkspace()
    }
    loadCourseGroup() {
      if (!this.input.courses.some(course => course.topics?.length)) return
      const group = root.KnowledgeDomainModel?.fromCurriculum?.(this.input)
      if (validGraph(group)) this.graph = { ...this.withPracticePoints(group), mode: 'course-group' }
    }
    withPracticePoints(graph) {
      const curriculum = root.KnowledgeDomainCurriculum
      if (!curriculum || this.input.curriculumRevision !== curriculum.revision) return graph
      return curriculum.withPracticePoints(graph)
    }
    applyRecord(record) {
      this.graph = record.graph
      this.fileNames = record.fileNames
    }
    toggleHistory(record) {
      if (!this.previousRecord) return
      const target = record || (this.historyShown ? this.currentRecord : this.previousRecord)
      if (!this.historyShown) this.currentRecord = { graph: this.graph, fileNames: this.fileNames }
      this.applyRecord(target)
      this.historyShown = target!==this.currentRecord
      this.renderWorkspace()
    }
    writeGraph(graph, fileNames = this.fileNames) {
      if (!this.storageKey) throw new Error()
      const record = JSON.stringify({ graph, fileNames })
      root.localStorage.setItem(this.storageKey, record)
      this.storedRecord = record
      this.saveMessage = ''
    }
    save() {
      if (this.readOnly) return
      try {
        this.writeGraph(this.graph)
      } catch {
        this.saveMessage = '浏览器暂时无法保存，本次结果可在当前页面查看。'
      }
    }
    stopScene() {
      this.resultsAnimations?.forEach(animation => animation.cancel())
      this.sceneToken = null
      this.scene?.destroy()
      this.scene = null
    }
    async mountScene() {
      const host = this.$('.kdg-scene')
      if (!host) return
      this.stopScene()
      const screenshot = this.$('[data-act="export-screenshot"]')
      if (screenshot) screenshot.disabled = true
      const token = this.sceneToken = {}
      const status = this.$('.kdg-scene-status')
      status.hidden = false
      status.textContent = '正在载入图谱…'
      try {
        if (!root.KnowledgeDomainScene) await root.loadKnowledgeDomainScene()
        if (this.sceneToken !== token || !this.isConnected) return
        const coreIds = new Set(this.input.courses.filter(course => course.isCore).map(course => course.id))
        this.scene = root.KnowledgeDomainScene.mount(host, {
          courses: this.graph.courses.map(course => ({ ...course, isCore: coreIds.has(course.id) })),
          relations: this.relations || [], atlas: this.atlas, domainsVisible:this.domainsVisible, darkMode:this.darkMode,
          pointFilter: this.pointFilter,
          onSelect: (...path) => this.selectNode(...path),
          onAtlasSelect: (kind, index) => this.showAtlasDetail({kind, index}),
          onBlankTap: this.readOnly ? () => this.setResultsIntro(true) : undefined,
          onReset: () => this.clearSelection()
        })
        if (this.selected) this.scene.focus(...pathOf(this.selected))
        if (this.atlasSelection) this.selectAtlasResult(this.atlasSelection)
        status.hidden = true
        const enter = this.$('[data-act="explore-graph"]')
        if (enter) enter.disabled = false
        if (screenshot) screenshot.disabled = false
      } catch {
        if (this.sceneToken !== token) return
        status.innerHTML = '图谱画布暂时无法载入 <button type="button" class="kdg-link" data-act="retry-scene">重新载入</button>'
      }
    }

    renderWorkspace() {
      if (this.deleteTarget || this.atlasTarget || this.nodeEditor) this.closeDialog()
      this.stopScene()
      this.applyTheme()
      this.selected = null
      this.atlasSelection = null
      this.detailPage = 0
      this.searchIndex = null
      this.searchResults = []
      if (!this.graph) {
        this.atlas = null
        this.relations = []
        this.nearby = []
        this.innerHTML = this.readOnly
          ? '<section class="kdg-empty kdg-results-empty" aria-label="知识领域图谱"><p>暂无知识领域图谱</p></section>'
          : `<section class="kdg-empty" aria-label="创建知识领域图谱"><div class="kdg-methods">
          <button type="button" class="kdg-method kdg-method-ai" data-act="create"><span class="kdg-method-icon">${icon('spark')}</span><span><strong>AI智能创建</strong><small>依据专业课程和教学资料，生成知识图谱</small></span></button>
          <button type="button" class="kdg-method kdg-method-import" data-act="import"><span class="kdg-method-icon">${icon('template')}</span><span><strong>模板导入</strong><small>从 Excel 导入课程、知识领域和培养目标</small></span></button>
        </div></section>`
        return
      }
      const { courses } = this.graph
      this.atlas = root.KnowledgeDomainAtlas?.build(this.graph.major,courses,this.graph.mode === 'course-group' ? null : this.graph.goalPlan || this.input.plan,
        this.historyShown || this.graph.mode === 'course-group' || this.graph.useCourseGroupGraph === false ? [] : this.input.suggestedGoals, this.graph.atlasChanges)
      const units = courses.flatMap(course => course.topics)
      const { points } = knowledgeCounts(units)
      this.relations = (Array.isArray(this.graph.relations) ? this.graph.relations : []).filter(edge => nodeAt(this.graph, edge?.from)?.point &&
        nodeAt(this.graph, edge.to)?.point && edge.from[0] !== edge.to[0] && present(edge.label) && present(edge.reason))
      const endpoints = new Set()
      for (const { from, to } of this.relations) {
        endpoints.add(from.join('/'))
        endpoints.add(to.join('/'))
      }
      this.pointSummaries = {
        'cross-course': summarizePointPaths(endpoints),
        'cross-domain': summarizePointPaths(this.atlas?.memberships?.keys() || [])
      }
      this.graphCounts = [
        ...(this.atlas ? [[this.atlas.domains.filter(domain => !domain.deleted).length, '个', '知识领域']] : []),
        [courses.length, '门', '课程'], [points, '个', '知识点']
      ]
      if (this.readOnly || this.relations.length) this.graphCounts.push([this.relations.length, '条', '跨课程关联'])
      const editorHeader = this.readOnly ? '' : `<header class="kdg-tools">
        <div class="kdg-graph-heading"><h2>${escape(this.graph.major)}${this.historyShown ? ' · 历史版本' : ''}</h2><p class="kdg-graph-counts" role="status">${this.viewCounts}</p></div>
        <div class="kdg-header-actions">${this.historyShown ? '' : `<div class="kdg-export">
          <button type="button" class="kdg-primary" data-act="toggle-export" aria-controls="${this.uid}-export" aria-expanded="false" aria-busy="false">${icon('download')}<span>导出</span>${icon('down')}</button>
          <div id="${this.uid}-export" class="kdg-export-options" role="group" aria-label="导出选项" hidden>
            <button type="button" data-act="export-screenshot" disabled>当前截图</button>
            <button type="button" disabled>模版导出</button>
          </div>
          <p class="kdg-export-status" role="status"></p>
        </div>
          <details class="kdg-create-menu"><summary class="kdg-secondary">${icon('spark')}${this.graph.mode === 'course-group' ? '创建知识领域图谱' : '重新生成'} ${icon('down')}</summary>
            <div class="kdg-method-options" role="group" aria-label="创建方式">
              <button type="button" data-act="create">${icon('spark')}AI智能创建</button>
              <button type="button" data-act="import">${icon('template')}模板导入</button>
            </div>
          </details>`}${initializeButton}</div>
      </header>`
      this.innerHTML = `<section class="kdg-workspace kdg-overview" aria-label="知识领域图谱">
        ${editorHeader}
        ${this.saveMessage ? `<div class="kdg-warning" role="status">${escape(this.saveMessage)}</div>` : ''}
        <div class="kdg-stage"${this.resultsIntro ? ' data-intro' : ''}>
          <div class="kdg-scene" aria-label="课程知识单元及知识点关系图"${this.resultsIntro ? ' inert' : ''}></div>
          ${this.readOnly ? `<button type="button" class="kdg-enter" data-act="explore-graph" disabled ${this.resultsIntro ? '' : 'hidden'}><span>探索图谱 ${icon('right')}</span></button>` : ''}
          <div class="kdg-scene-status" role="status"></div>
          <p class="kdg-scene-status kdg-cross-empty" role="status" ${this.pointFilterEmpty ? '' : 'hidden'}>${this.pointFilterEmpty}</p>
          <div class="kdg-graph-search">
            ${this.readOnly ? `<h2 class="kdg-major-title" ${this.resultsIntro ? '' : 'hidden'}>${escape(this.graph.major)}</h2>` : ''}
            <label class="kdg-search">${icon('search')}<input type="search" class="kdg-graph-search-input" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${this.uid}-search-options" aria-label="${searchLabel}" placeholder="${searchLabel}" autocomplete="off" /></label>
            <div class="kdg-search-popup" hidden>
              <div id="${this.uid}-search-options" class="kdg-search-options" role="listbox" aria-label="图谱搜索结果"></div>
              <p class="kdg-search-empty" role="status" hidden>未找到匹配结果</p>
            </div>
            ${this.readOnly ? `<dl class="kdg-graph-counts kdg-side-counts" aria-label="图谱统计" aria-live="polite">${this.viewCounts}</dl>` : ''}
          </div>
          <aside class="kdg-detail" aria-label="图谱详情" hidden></aside>
          <div class="kdg-viewport-controls" role="group" aria-label="图谱视图控制">
            ${viewSwitch('toggle-domains', '知识领域', 'domains', this.domainsVisible)}
            ${viewSwitch('toggle-cross-course', pointFilters['cross-course'], 'connections', this.pointFilter === 'cross-course', '仅显示跨课程知识点')}
            ${viewSwitch('toggle-cross-domain', pointFilters['cross-domain'], 'sharedDomains', this.pointFilter === 'cross-domain', '仅显示跨领域知识点')}
            ${this.readOnly ? '' : viewSwitch('toggle-theme', '深色模式', 'moon', this.darkMode)}
            <button type="button" class="kdg-view-button" data-act="reset" title="返回全图（Esc）" aria-label="返回全图">${icon('fit')}<span>返回全图</span></button>
          </div>
        </div>
      </section>`
      const search = this.$('.kdg-graph-search')
      const options = this.$('.kdg-search-options')
      const menu = this.$('.kdg-create-menu')
      menu?.addEventListener('focusout', event => {
        if (!menu.contains(event.relatedTarget)) menu.open = false
      })
      const exportControl = this.$('.kdg-export')
      exportControl?.addEventListener('focusout', event => {
        if (!exportControl.contains(event.relatedTarget)) this.setExportOpen(false)
      })
      search?.addEventListener('focusout', event => {
        if (!search.contains(event.relatedTarget)) this.closeSearch()
      })
      options?.addEventListener('mousedown', event => {
        if (event.target.closest('[role="option"]')) event.preventDefault()
      })
      options?.addEventListener('click', event => {
        const option = event.target.closest('[role="option"]')
        if (option) this.selectSearchResult(Number(option.dataset.index))
      })
      void this.mountScene()
    }
    setExportOpen(open, returnFocus = false) {
      const trigger = this.$('[data-act="toggle-export"]')
      const options = this.$('.kdg-export-options')
      if (!trigger || options.hidden === !open) return
      options.hidden = !open
      trigger.setAttribute('aria-expanded', String(open))
      if (open) this.$('.kdg-export-status').textContent = ''
      if (returnFocus) trigger.focus({ preventScroll: true })
    }
    async exportScreenshot() {
      const stage = this.$('.kdg-stage')
      const scene = this.scene
      const trigger = this.$('[data-act="toggle-export"]')
      if (!scene || trigger.getAttribute('aria-busy') === 'true') return

      this.setExportOpen(false, true)
      trigger.setAttribute('aria-busy', 'true')
      const label = trigger.querySelector('span')
      label.textContent = '导出中…'
      const status = this.$('.kdg-export-status')
      const filename = `${this.graph.major}-知识领域图谱`
      try {
        const capture = root.loadKnowledgeDomainScreenshot ? await root.loadKnowledgeDomainScreenshot() : root.html2canvas
        if (this.scene !== scene) return
        const frame = scene.captureFrame()
        const viewport = this.$('.kdg-scene')
        const { clientWidth: width, clientHeight: height } = viewport
        const canvas = await capture(stage, {
          logging: false,
          width,
          height,
          scale: Math.min(2, 16384 / width, 16384 / height, Math.sqrt(32000000 / (width * height))),
          ignoreElements: element => element.parentElement === stage && !element.classList.contains('kdg-scene'),
          onclone(_document, clonedStage) {
            const surface = clonedStage.querySelector('.knowledge-scene-points')
            const context = surface.getContext('2d')
            context.clearRect(0, 0, surface.width, surface.height)
            context.drawImage(frame, 0, 0)
          }
        })
        if (this.scene === scene) await root.PortraitCompetencyMapExport.downloadCanvasPng(canvas, filename)
      } catch {
        status.textContent = '图谱导出失败，请重试'
      } finally {
        label.textContent = '导出'
        trigger.setAttribute('aria-busy', 'false')
      }
    }
    setResultsIntro(showIntro) {
      if (this.resultsIntro === showIntro || !this.scene) return
      const stage = this.$('.kdg-stage')
      const sceneHost = this.$('.kdg-scene')
      const enter = this.$('.kdg-enter')
      const title = this.$('.kdg-major-title')
      const animate = !root.matchMedia?.('(prefers-reduced-motion: reduce)').matches && typeof title.animate === 'function'
      const metricSelector = '.kdg-side-counts dt, .kdg-side-counts dd'
      const positions = new Map()
      if (animate) {
        for (const metric of stage.querySelectorAll(metricSelector)) {
          const rect = metric.getBoundingClientRect()
          if (rect.height) {
            const scale = rect.height / metric.offsetHeight
            positions.set(metric, { rect, size: scale * parseFloat(root.getComputedStyle(metric).fontSize) })
          }
        }
      }
      const titleRect = animate && !showIntro ? title.getBoundingClientRect() : null
      this.resultsAnimations?.forEach(animation => animation.cancel())
      this.resultsIntro = showIntro
      if (showIntro) {
        this.closeSearch()
        this.$('.kdg-graph-search-input').value = ''
        this.setPointFilter('')
        this.setDomainsVisible(true)
        this.resetView()
      }
      stage.toggleAttribute('data-intro', showIntro)
      enter.hidden = title.hidden = !showIntro
      sceneHost.inert = showIntro
      const focus = showIntro ? enter : sceneHost.querySelector('.knowledge-scene-points')
      focus?.focus({ preventScroll: true })
      stage.classList.toggle('kdg-transitioning', animate)
      stage.classList.toggle('kdg-entering', animate && !showIntro)
      if (!animate) return

      const timing = { duration: 760, easing: 'cubic-bezier(.22,.75,.18,1)' }
      const metrics = [...stage.querySelectorAll(metricSelector)]
      const destinations = metrics.map(metric => metric.getBoundingClientRect())
      const animations = metrics.map((metric, index) => {
        const from = positions.get(metric)
        if (!from) return metric.animate([{ opacity: 0 }, { opacity: 1 }], timing)
        const to = destinations[index]
        const scale = from.size / parseFloat(root.getComputedStyle(metric).fontSize)
        return metric.animate([
          { transform: `translate(${from.rect.left - to.left}px, ${from.rect.top - to.top}px) scale(${scale})` },
          { transform: 'none' }
        ], timing)
      })
      if (showIntro) {
        animations.push(title.animate([{ opacity: 0, transform: 'translateY(-16px)' }, { opacity: 1 }], timing))
      } else {
        const leavingTitle = title.cloneNode(true)
        const stageRect = stage.getBoundingClientRect()
        leavingTitle.hidden = false
        leavingTitle.setAttribute('aria-hidden', 'true')
        Object.assign(leavingTitle.style, {
          position: 'absolute', left: (titleRect.left - stageRect.left) + 'px',
          top: (titleRect.top - stageRect.top) + 'px', width: titleRect.width + 'px', pointerEvents: 'none'
        })
        stage.appendChild(leavingTitle)
        const fade = leavingTitle.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-16px)' }], { duration: 260, fill: 'forwards' })
        fade.finished.then(() => leavingTitle.remove(), () => leavingTitle.remove())
        animations.push(fade)
      }
      this.resultsAnimations = animations
      Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
        if (this.resultsAnimations !== animations) return
        this.resultsAnimations = null
        stage.classList.remove('kdg-transitioning', 'kdg-entering')
      })
    }
    get viewCounts() {
      const counts = this.pointFilter ? [[this.pointSummaries[this.pointFilter].total, '个', pointFilters[this.pointFilter]]] : this.graphCounts
      if (this.pointFilter === 'cross-course') counts.push([this.relations.length, '条', '跨课程关联'])
      if (this.readOnly) return counts.map(([value, , label]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')
      return counts.map(([value, unit, label]) => `${value} ${unit}${label}`).join('<span>·</span>')
    }
    get pointFilterEmpty() {
      return this.pointFilter && this.pointSummaries[this.pointFilter].total === 0 ? '暂无' + pointFilters[this.pointFilter] : ''
    }
    matchesView(path) {
      return !this.pointFilter || this.pointSummaries[this.pointFilter].counts.has(path.join('/'))
    }
    buildSearchIndex() {
      const items = []
      for (const [ci, course] of this.graph.courses.entries()) {
        items.push({kind:'course', name:course.name, path:[ci, null, null, null]})
        for (const [ui, unit] of course.topics.entries()) {
          const trail = course.name + ' › ' + unit.name
          for (const [pi, name] of (unit.points || []).entries()) {
            items.push({kind:'point', name, trail, path:[ci, ui, null, pi]})
          }
          for (const [si, section] of (unit.sections || []).entries()) {
            for (const [pi, name] of section.points.entries()) {
              items.push({kind:'point', name, trail:trail + ' › ' + section.name, path:[ci, ui, si, pi]})
            }
          }
        }
      }
      this.atlas?.domains.forEach(({name, deleted}, index) => {
        if (!deleted) items.push({kind:'domain', name, index})
      })
      this.atlas?.goals.forEach((goal, index) => items.push({kind:'goal', name:goal.title, index, trail:goal.label, text:goal.text}))
      return items.map(item => ({...item, key:searchText(item.name), description:searchText([item.trail, item.text].join(' '))}))
    }
    renderSearch() {
      const input = this.$('.kdg-graph-search-input')
      const query = searchText(input.value)
      if (!query) { this.closeSearch(); return }
      this.searchIndex ||= this.buildSearchIndex()
      const ranked = [[], [], [], []]
      for (const item of this.searchIndex) {
        if (item.key === query) ranked[0].push(item)
        else if (item.key.startsWith(query)) ranked[1].push(item)
        else if (item.key.includes(query)) ranked[2].push(item)
        else if (item.kind === 'goal' && item.description.includes(query)) ranked[3].push(item)
      }
      this.searchResults = ranked.flat()
      const labels = {course:'课程', point:'知识点', domain:'知识领域', goal:'培养目标'}
      const list = this.$('.kdg-search-options')
      list.innerHTML = this.searchResults.map(({kind, name, trail}, index) =>
        `<div id="${this.uid}-search-${index}" role="option" aria-selected="false" class="kdg-search-option" data-index="${index}">
          <strong>${escape(name)}</strong><span>${labels[kind]}</span>${trail ? `<small>${escape(trail)}</small>` : ''}
        </div>`).join('')
      list.hidden = !this.searchResults.length
      this.$('.kdg-search-empty').hidden = !list.hidden
      this.$('.kdg-search-popup').hidden = false
      input.setAttribute('aria-expanded', 'true')
      input.removeAttribute('aria-activedescendant')
      this.activeSearchIndex = -1
      list.scrollTop = 0
    }
    closeSearch() {
      const popup = this.$('.kdg-search-popup')
      if (!popup || popup.hidden) return
      popup.hidden = true
      const input = this.$('.kdg-graph-search-input')
      input.setAttribute('aria-expanded', 'false')
      input.removeAttribute('aria-activedescendant')
      this.searchResults = []
    }
    selectSearchResult(index) {
      const item = this.searchResults[index]
      if (!item) return
      this.$('.kdg-graph-search-input').value = ''
      this.closeSearch()
      if (!item.path || !this.matchesView(item.path)) this.setPointFilter('')
      if (item.path) this.selectNode(...item.path)
      else this.selectAtlasResult(item)
    }
    selectAtlasResult({kind, index}) {
      const entry = (kind === 'goal' ? this.atlas?.goals : this.atlas?.domains)?.[index]
      if (!entry || entry.deleted) return
      this.setDomainsVisible(true)
      if (kind === 'goal') {
        this.setPointFilter('')
        if (entry.domains.length || entry.added) this.scene?.locateGoal(index)
        else this.scene?.reset()
      } else {
        this.scene?.locateDomain(index)
      }
      this.showAtlasDetail({kind, index})
    }
    showAtlasDetail(selection) {
      this.selected = null
      this.atlasSelection = selection
      this.detailPage = 0
      this.renderDetail()
    }
    selectNode(course, topic = null, section = null, point = null) {
      const path = [course, topic, section, point]
      if (!nodeAt(this.graph, path) || !this.matchesView(path)) return
      this.atlasSelection = null
      this.selected = { course, topic, section, point }
      this.scene?.focus(...path)
      this.detailPage = 0
      this.renderDetail()
    }
    clearSelection() {
      if (!this.selected && !this.atlasSelection) return
      this.selected = null
      this.atlasSelection = null
      this.detailPage = 0
      this.renderDetail()
    }
    resetView() {
      this.scene?.reset()
      this.clearSelection()
    }
    onKeyDown(event) {
      if (this.dialog || event.defaultPrevented || event.isComposing || event.keyCode === 229) return
      const input = this.$('.kdg-graph-search-input')
      if (input && event.target === input && this.onSearchKey(event, input)) return
      if (event.key !== 'Escape') return
      const menu = this.$('.kdg-create-menu')
      if (menu?.open) {
        event.preventDefault()
        menu.open = false
        menu.querySelector('summary').focus()
        return
      }
      const exportOptions = this.$('.kdg-export-options')
      if (exportOptions && !exportOptions.hidden) {
        event.preventDefault()
        this.setExportOpen(false, true)
        return
      }
      if (this.selected || this.atlasSelection) {
        event.preventDefault()
        this.resetView()
      }
    }
    onSearchKey(event, input) {
      const popup = this.$('.kdg-search-popup')
      if (event.key === 'Escape' && !popup.hidden) {
        this.closeSearch()
      } else if (event.key === 'Enter') {
        if (popup.hidden) this.renderSearch()
        this.selectSearchResult(Math.max(0, this.activeSearchIndex))
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (popup.hidden) this.renderSearch()
        const count = this.searchResults.length
        if (!count) return false
        const list = this.$('.kdg-search-options')
        const previous = this.activeSearchIndex
        const next = event.key === 'ArrowDown' ? (previous + 1) % count : (Math.max(0, previous) + count - 1) % count
        list.children[previous]?.setAttribute('aria-selected', 'false')
        const option = list.children[next]
        option.setAttribute('aria-selected', 'true')
        input.setAttribute('aria-activedescendant', option.id)
        this.activeSearchIndex = next
        if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop
        else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
          list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight
        }
      } else return false
      event.preventDefault()
      return true
    }
    relatedPoints(path) {
      const key = path.join('/')
      const nearby = []
      for (const edge of this.relations || []) {
        const outgoing = edge.from.join('/') === key
        if (!outgoing && edge.to.join('/') !== key) continue
        const target = outgoing ? edge.to : edge.from
        const node = nodeAt(this.graph, target)
        if (node?.point) nearby.push({ ...edge, target, node, outgoing })
      }
      return nearby
    }
    renderAtlasDetail(panel, {kind, index}) {
      let name, body
      if (kind === 'goal') {
        const goal = this.atlas.goals[index]
        name = goal.title
        const domains = goal.domains.map(({index}) => ({ index, name: this.atlas.domains[index].name }))
        body = `<p class="kdg-summary">培养目标</p>
          <p class="kdg-goal-text">${escape(goal.text)}</p>
          ${goal.edited ? '<p class="kdg-origin">已在图谱内修订</p>' : ''}
          ${goal.source ? `<p class="kdg-origin">目标来源 · ${escape(goal.source)}</p>` : ''}
          ${goal.suggested ? '<p class="kdg-origin">课程底稿建议，待教研确认</p>' : ''}
          ${atlasLinks('关联知识领域', 'atlas-domain', domains, '暂无关联知识领域')}`
      } else {
        const domain = this.atlas.domains[index]
        name = domain.name
        const courses = domain.courses.map(index => ({
          index, name: this.graph.courses[index].name, note: (domain.pointCounts.get(index) || 0) + ' 个领域内知识点',
        }))
        const goals = domain.goals.map(({index, manual}) => ({index, name: this.atlas.goals[index].title, note: manual ? '人工关联' : ''}))
        const pointCount = [...domain.pointCounts.values()].reduce((total, count) => total + count, 0)
        body = `<p class="kdg-summary">知识领域</p>
          ${domain.description ? `<p class="kdg-goal-text">${escape(domain.description)}</p>` : ''}
          ${domain.added ? `<p class="kdg-origin">${domain.imported ? '模板导入' : '人工添加'}</p>` : ''}
          <p class="kdg-node-total">${courses.length} 门课程 · ${pointCount} 个知识点</p>
          ${atlasLinks('关联培养目标', 'atlas-goal', goals, '暂无关联培养目标')}
          ${atlasLinks('关联课程', 'atlas-course', courses, '暂无关联课程')}`
      }
      const label = kind === 'goal' ? '培养目标' : '知识领域'
      panel.hidden = false
      panel.innerHTML = `<div class="kdg-panel-heading"><h3 tabindex="-1">${escape(name)}</h3><div class="kdg-detail-actions">
        ${this.readOnly || this.historyShown ? '' : control('edit-atlas', '编辑' + label, 'edit') + control('delete-atlas', '删除' + label, 'trash')}
        ${control('close-detail', '关闭详情', 'close')}</div></div>
        <div class="kdg-detail-body">${body}</div>`
    }
    renderDetail() {
      const panel = this.$('.kdg-detail')
      const selection = this.selected
      this.$('.kdg-stage').classList.toggle('kdg-has-detail', Boolean(selection || this.atlasSelection))
      if (this.atlasSelection) { this.renderAtlasDetail(panel, this.atlasSelection); return }
      if (!selection) { panel.hidden = true; return }
      const path = pathOf(selection)
      const { course, unit, section, point, name } = nodeAt(this.graph, path)
      const children = []
      const addChild = (action, index, name, childPath) => {
        if (this.matchesView(childPath)) children.push({ action, index, name })
      }
      let courseSummary = ''
      if (!unit) {
        courseSummary = this.pointFilter
          ? (this.pointSummaries[this.pointFilter].counts.get(path.join('/')) || 0) + ' 个' + pointFilters[this.pointFilter]
          : knowledgeCounts(course.topics).points + ' 个知识点'
      } else if (!point) {
        if (!section) (unit.sections || []).forEach((item, index) => addChild('section', index, item.name, [selection.course, selection.topic, index, null]))
        const names = (section || unit).points || []
        names.forEach((label, index) => addChild('point', index, label, [selection.course, selection.topic, selection.section, index]))
      }
      const owner = section || unit
      const origin = point ? owner.pointSources?.[selection.point] : null
      const note = point ? owner.pointNotes?.[selection.point] : owner || course
      const nameEdited = point ? owner.editedPoints?.includes(selection.point) : owner?.nameEdited
      this.nearby = point ? this.relatedPoints(path) : []
      const branches = pagePart(children, this.detailPage).map(child =>
        `<button type="button" data-act="${child.action}" data-index="${child.index}"><span>${escape(child.name)}</span>${icon('right')}</button>`).join('')
      const links = pagePart(this.nearby, this.detailPage).map((edge, offset) => {
        const peer = edge.node
        const place = [peer.course.name, peer.unit.name, peer.section?.name].filter(Boolean).join(' › ')
        return `<button type="button" class="kdg-relation" data-act="relation" data-index="${this.detailPage * pageSize + offset}"><span class="kdg-relation-type">${escape(edge.label)} · ${edge.outgoing ? '关联至' : '关联自'}${edge.manual ? ' · 人工关联' : ''}</span><strong>${escape(peer.point)} ${icon('right')}</strong><small>${escape(place)}</small><span>${escape(edge.reason)}</span></button>`
      }).join('')
      const pathKey = path.join('/')
      const domains = this.atlas?.domains || []
      const domainIndices = this.atlas ? root.KnowledgeDomainAtlas.relatedDomains(this.atlas, path) : []
      panel.hidden = false
      panel.innerHTML = `<div class="kdg-panel-heading"><h3>${escape(name)}</h3><div class="kdg-detail-actions">
        ${unit && !this.readOnly && !this.historyShown ? (point ? control('edit-node', '编辑知识点', 'edit') : control('edit', '修改名称', 'edit')) + control('delete-node', '删除节点', 'trash') : ''}
        ${control('close-detail', '关闭详情', 'close')}</div></div>
        <div class="kdg-detail-body">
        ${courseSummary ? `<p class="kdg-node-total">${courseSummary}</p>` : ''}
        ${domainList(unit ? '所属知识领域' : '所在知识领域', domains, domainIndices)}
        ${this.atlas?.unassigned?.has(pathKey) ? '<p class="kdg-summary">未归属知识领域</p>' : ''}
        ${note?.description ? `<p class="kdg-goal-text">${escape(note.description)}</p>` : ''}
        ${[['知识点标签', note?.tags], ['节点关系', note?.relations], ['思政元素', note?.civic], ['设计方式', note?.design]].filter(([,value]) => value).map(([label,value]) => `<p class="kdg-origin">${label} · ${escape(value)}</p>`).join('')}
        ${note?.added || (!unit && course.source === '人工添加') ? '<p class="kdg-origin">人工添加</p>' : ''}
        ${origin?.fileName ? `<p class="kdg-origin">资料 · ${escape(origin.fileName)}</p>` : ''}
        ${origin?.evidence ? `<blockquote class="kdg-evidence">${escape(origin.evidence)}</blockquote>` : ''}
        ${nameEdited ? '<p class="kdg-origin">名称已人工修订</p>' : ''}
        ${branches ? `<div class="kdg-children">${branches}</div>` : ''}
        ${links ? `<div class="kdg-relations"><h5>跨课程关联 · ${this.nearby.length}</h5>${links}</div>` : ''}
        </div>${pager(children.length + this.nearby.length, this.detailPage, 'detail-page')}`
    }

    addDialog(title, body, footer = '', description = '', { alert = false } = {}) {
      this.scene?.pauseRotation()
      this.closeDialog()
      const dialog = document.createElement('dialog')
      dialog.className = 'kdg-dialog'
      dialog.setAttribute('aria-labelledby', this.uid + '-title')
      if (alert) {
        dialog.setAttribute('role', 'alertdialog')
        dialog.setAttribute('aria-describedby', this.uid + '-dialog-body')
      }
      dialog.innerHTML = `<header class="kdg-dialog-head"><div><h2 id="${this.uid}-title">${escape(title)}</h2>${description ? `<p>${escape(description)}</p>` : ''}</div>${control('cancel', '关闭窗口', 'close')}</header>
        <div class="kdg-dialog-scroll" id="${this.uid}-dialog-body">${body}</div>${footer ? `<footer class="kdg-dialog-foot">${footer}</footer>` : ''}`
      this.append(dialog)
      dialog.addEventListener('cancel', event => { event.preventDefault(); this.closeDialog() })
      this.dialog = dialog
      dialog.showModal()
      return dialog
    }
    closeDialog() {
      this.job?.abort()
      this.job = null
      this.draft = null
      this.deleteTarget = null
      this.atlasTarget = null
      this.nodeEditor = null
      if (this.dialog) {
        this.dialog.close()
        this.dialog.remove()
        this.dialog = null
      }
    }
    initializeDialog() {
      this.addDialog('初始化知识领域图谱',
        '<p>初始化将清除本次图谱建设结果及手工修改。已有课程群图谱将作为起点重新显示。</p><p class="kdg-status kdg-error" role="status" hidden></p>',
        '<button type="button" class="kdg-secondary" data-act="cancel" autofocus>取消</button><button type="button" class="kdg-primary" data-act="confirm-initialize">确认初始化</button>')
    }
    initialize() {
      try {
        if (this.storageKey) root.localStorage.setItem(this.storageKey, initializedRecord)
      } catch {
        const status = this.$('.kdg-dialog .kdg-status')
        status.textContent = '浏览器暂时无法保存初始化状态，请重试。'
        status.hidden = false
        return
      }
      this.loadContext()
      this.$('.kdg-create-menu summary, .kdg-method-ai')?.focus({ preventScroll: true })
    }
    importDialog(selection = { mode: 'add', file: null }) {
      if (this.readOnly || this.historyShown) return
      const template = '知识领域图谱导入模板.xlsx'
      const dialog = this.addDialog('模板导入', `<label class="kdg-import-mode">导入模式
        <select class="kdg-name">
          <option value="add">新增数据</option>
          <option value="update">仅更新数据</option>
          ${this.graph && this.graph.mode !== 'course-group' ? '<option value="replace">覆盖数据</option>' : ''}
        </select></label>
        <p class="kdg-mode-help"></p>
        <section class="kdg-import-guide"><h3>导入说明</h3>
        <p><a href="./src/knowledge-domain/${template}" download="${template}">下载 Excel 模板</a>，填写课程群图谱、知识领域关系和培养目标。</p>
        <p>保留各表前两行的说明和字段名称，从第三行开始填写。每张表最多支持 10000 行数据、200 列。</p></section>
        <div class="kdg-upload-row"><button class="kdg-secondary" type="button" data-import-upload>${icon('upload')}上传文件</button><span class="kdg-import-file"></span></div>
        <input type="file" accept=".xlsx" aria-label="上传 Excel 工作簿" hidden>
        <p class="kdg-status kdg-error" role="alert" hidden></p>`,
        '<button type="button" class="kdg-secondary" data-act="cancel">取消</button><button type="button" class="kdg-primary" data-import-submit>确定</button>')
      const select = dialog.querySelector('select')
      const input = dialog.querySelector('input')
      const submit = dialog.querySelector('[data-import-submit]')
      const status = dialog.querySelector('[role="alert"]')
      const help = {
        add: '按课程和知识路径匹配，保留已有内容，补充新节点和关联。',
        update: this.graph ? '按课程和知识路径、领域名称及目标名称匹配，仅更新已有记录。' : '当前图谱暂无可更新的记录。首次导入请选择“新增数据”。',
        replace: '用工作簿中的数据整体替换当前图谱。'
      }
      function refresh() {
        dialog.querySelector('.kdg-mode-help').textContent = help[selection.mode]
        dialog.querySelector('.kdg-import-file').textContent = selection.file?.name || '支持 .xlsx'
        submit.disabled = !selection.file
        status.hidden = true
      }
      select.value = selection.mode
      select.onchange = () => { selection.mode = select.value; refresh() }
      dialog.querySelector('[data-import-upload]').onclick = () => input.click()
      input.onchange = () => { selection.file = input.files[0]; refresh() }
      refresh()
      submit.onclick = async () => {
        const { file, mode } = selection
        submit.disabled = select.disabled = input.disabled = true
        status.hidden = true
        try {
          if (!file || !/\.xlsx$/i.test(file.name)) throw new Error('请选择 .xlsx 工作簿。')
          const bytes = await file.arrayBuffer()
          if (this.dialog !== dialog) return
          const tables = root.KnowledgeDomainWorkbook.read(bytes)
          const original = this.graph
          const graph = root.KnowledgeDomainWorkbook.apply(tables, mode, original, this.atlas, this.input.major)
          if (!validGraph(graph)) throw new Error('工作簿缺少有效课程结构。')
          const commit = activeDialog => {
            const message = activeDialog.querySelector('[role="alert"]')
            try {
              if (this.dialog !== activeDialog || this.graph !== original) return
              if (root.localStorage.getItem(this.storageKey) !== this.storedRecord) throw new Error('图谱已在其他页面更新，请刷新后重新导入。')
              const names = [...new Set([...(mode === 'replace' ? [] : this.fileNames), file.name])]
              this.writeGraph(graph, names)
              this.applyRecord({graph, fileNames: names})
            } catch (error) {
              message.textContent = error.message.includes('其他页面') ? error.message : '浏览器暂时无法保存导入结果，请重试。'
              message.hidden = false
              return
            }
            this.closeDialog()
            this.renderWorkspace()
            this.$('.kdg-graph-search-input')?.focus({preventScroll: true})
          }
          if (mode === 'replace') {
            const warning = this.addDialog('确认覆盖当前图谱？', `<div class="kdg-delete-impact">
              <p>将用<strong>《${escape(file.name)}》</strong>替换「${escape(this.input.major)}」的全部图谱数据，包括课程知识点、知识领域、培养目标及其关联。</p>
              <p class="kdg-delete-warning"><strong>现有数据和手工修改将被覆盖，此操作不可撤销。</strong></p>
              <p class="kdg-status kdg-error" role="alert" hidden></p></div>`,
              '<button type="button" class="kdg-secondary" data-import-back autofocus>返回检查</button><button type="button" class="kdg-primary kdg-danger" data-import-confirm>确认覆盖</button>', '', {alert: true})
            warning.querySelector('[data-import-back]').onclick = () => this.importDialog(selection)
            warning.querySelector('[data-import-confirm]').onclick = () => commit(warning)
          } else commit(dialog)
        } catch (error) {
          if (this.dialog !== dialog) return
          status.textContent = error.message || '无法读取工作簿，请使用下载的模板。'
          status.hidden = false
        } finally {
          if (this.dialog === dialog) submit.disabled = select.disabled = input.disabled = false
        }
      }
    }
    createDialog() {
      const footer = `<div class="kdg-status" role="status" hidden></div>${this.graph ? '<span>新结果将替换当前图谱及手工修改。</span>' : ''}<button type="button" class="kdg-secondary" data-act="cancel">取消</button><button type="button" class="kdg-primary" data-act="generate">开始生成</button>`
      this.addDialog('AI智能创建', `<div class="kdg-field"><div class="kdg-field-head"><strong>附件</strong><small>（选填）</small></div>
          <div class="kdg-upload-row"><button type="button" data-act="upload" class="kdg-secondary">${icon('upload')}添加附件</button><small>支持 DOCX、PDF</small></div>
          <input type="file" class="kdg-file-input" multiple accept=".docx,.pdf" hidden><div class="kdg-files" aria-live="polite"></div></div>
        <label class="kdg-field"><span class="kdg-field-head"><strong>补充要求</strong><small>（选填）</small></span>
          <textarea class="kdg-requirements" rows="3" placeholder="可填写课程范围、知识重点或单元划分要求"></textarea></label>`, footer,
        '生成知识领域与培养目标的对应关系。可添加课程大纲或培养方案作为生成依据。')
      this.draft = { files: [], error: '', progress: '' }
      this.$('.kdg-requirements').value = this.graph?.requirements || ''
      this.updateDraft()
    }
    updateDraft() {
      if (!this.draft || !this.dialog) return
      const { files, error, progress } = this.draft
      this.$('.kdg-files').innerHTML = files.map((f, index) => `<div class="kdg-file" data-state="${f.state}">${icon('file')}<div><strong>${escape(f.name)}</strong><small>${escape(f.message)}</small></div>
        <button type="button" class="kdg-icon-button" data-act="remove-file" data-index="${index}" aria-label="移除${escape(f.name)}" ${this.job ? 'disabled' : ''}>${icon('close')}</button></div>`).join('')
      const status = this.$('.kdg-status')
      status.textContent = error || progress
      status.hidden = !status.textContent
      status.classList.toggle('kdg-error', Boolean(error))
      this.$('[data-act="upload"]').disabled = Boolean(this.job)
      this.$('.kdg-requirements').disabled = Boolean(this.job)
      const generate = this.$('[data-act="generate"]')
      generate.disabled = Boolean(this.job) || !this.input.major || files.some(f => f.state !== 'ready')
      generate.textContent = this.job ? '正在生成…' : '开始生成'
    }
    async readFiles(files) {
      const draft = this.draft
      if (!draft || this.job) return
      const additions = Array.from(files, file => ({ file, entry: { name: file.name, state: 'reading', message: '正在读取…', text: '' } }))
      draft.files.push(...additions.map(item => item.entry))
      draft.error = ''
      this.updateDraft()
      for (const { file, entry } of additions) {
        const active = () => this.draft === draft && draft.files.includes(entry)
        if (!active()) continue
        try {
          if (!/\.(docx|pdf)$/i.test(file.name)) throw new Error('仅支持 DOCX、PDF，请移除此附件。')
          if (!root.TalentPlanFiles?.read) throw new Error('附件读取组件未就绪，请重新打开页面。')
          const document = await root.TalentPlanFiles.read(file, message => {
            if (active()) { entry.message = message; this.updateDraft() }
          })
          if (!active()) continue
          if (!present(document?.text)) throw new Error('附件正文为空，请选择包含文字的文件。')
          Object.assign(entry, { text: document.text, state: 'ready', message: '已读取' })
        } catch (error) {
          if (active()) Object.assign(entry, { state: 'error', message: error.message || '读取失败，请移除后重新添加。' })
        }
        if (active()) this.updateDraft()
      }
    }
    async generate() {
      if (!this.draft || this.job || this.$('[data-act="generate"]').disabled) return
      const draft = this.draft
      const job = this.job = new AbortController()
      const requirements = this.$('.kdg-requirements').value.trim()
      const files = draft.files.map(({ name, text }) => ({ name, text }))
      const attachments = [...this.input.materials, ...files]
      draft.error = ''
      draft.progress = '正在整理生成依据…'
      this.updateDraft()
      try {
        const { major, courses, relationSeeds, curriculumRevision } = this.input
        const graph = await root.KnowledgeDomainModel.generate({
          major, courses, relationSeeds, curriculumRevision, attachments, requirements
        }, { signal: job.signal, onProgress: ({ message, completed, total }) => {
          if (this.job !== job) return
          draft.progress = message || (total > 0 ? `正在生成课程图谱 ${completed} / ${total}` : '正在生成课程图谱…')
          this.updateDraft()
        } })
        if (this.job !== job || !this.isConnected) return
        if (!validGraph(graph) || graph.major !== this.input.major) throw new Error('生成结果缺少有效课程结构，请补充资料后重试。')
        const goalFile = files.map(f => ({name:f.name,text:root.TalentPlanModel?.parseText(f.text)?.chapters?.goals})).find(f => present(f.text))
        this.graph = this.withPracticePoints({ ...graph, requirements, useCourseGroupGraph: courses.length > 0, ...(goalFile ? {goalPlan:goalFile} : {}) })
        this.fileNames = files.map(f => f.name)
        this.save()
        this.job = null
        this.closeDialog()
        this.renderWorkspace()
        this.$('.kdg-graph-search-input')?.focus({preventScroll: true})
      } catch (error) {
        if (this.job !== job || !this.isConnected) return
        this.job = null
        draft.error = error.message || '生成未完成，请重试。'
        draft.progress = ''
        this.updateDraft()
      }
    }
    showSources() {
      const graph = this.graph
      const unused = new Set((graph.unusedMaterials || []).map(file => file.name))
      const names = [...new Set([...(graph.sources || []).map(s => s?.name), ...this.fileNames].filter(name => present(name) && !unused.has(name)))]
      this.addDialog('生成依据', `<div class="kdg-provenance"><h3>${escape(graph.major)}</h3><p>${escape([graph.modeLabel, graph.notice].filter(Boolean).join(' · '))}</p>
        ${names.length ? `<h4>资料来源</h4><ul>${names.map(name => `<li>${escape(name)}</li>`).join('')}</ul>` : ''}
        ${graph.requirements ? `<h4>补充要求</h4><p>${escape(graph.requirements)}</p>` : ''}</div>`)
    }
    openNodeEditor(kind, target = null) {
      root.KnowledgeDomainEditor.edit(this, kind, target, { escape, nodeAt, searchText })
    }
    openAtlasDeleteDialog() {
      if (!this.atlasSelection || this.historyShown) return
      const {kind, index} = this.atlasSelection
      const isGoal = kind === 'goal'
      const entry = (isGoal ? this.atlas.goals : this.atlas.domains)[index]
      if (!entry || entry.deleted) return
      const label = isGoal ? '培养目标' : '知识领域'
      const name = isGoal ? entry.title : entry.name
      const status = '<p class="kdg-status kdg-error kdg-atlas-status" role="status" hidden></p>'
      const cancel = '<button type="button" class="kdg-secondary" data-act="cancel" autofocus>取消</button>'
      const impact = isGoal ? '当前图谱会移除该目标及其领域关联，培养方案原文保留。'
        : '当前图谱会移除该领域及其培养目标关联。领域内的课程、知识节点和跨课程关联保留。'
      this.addDialog('删除' + label, `<div class="kdg-delete-impact">
        <p>确定删除<strong>「${escape(name)}」</strong>？${impact}</p>
        <p class="kdg-delete-warning"><strong>删除后不可恢复。</strong></p>${status}</div>`,
        cancel + '<button type="button" class="kdg-primary kdg-danger" data-act="commit-atlas">确认删除</button>',
        '', {alert:true})
      this.atlasTarget = {graph:this.graph, kind, key:entry.key}
    }
    commitAtlasChange() {
      const target = this.atlasTarget
      if (!target || target.graph !== this.graph || this.historyShown) return
      const {kind, key} = target
      const collection = kind === 'goal' ? 'goals' : 'domains'
      const status = this.$('.kdg-atlas-status')
      const fail = message => { status.textContent = message; status.hidden = false }
      const changes = this.graph.atlasChanges
      const entries = changes?.[collection]
      const graph = {...this.graph, atlasChanges:{...changes, [collection]:{...entries, [key]:{...entries?.[key], deleted:true}}}}
      try {
        if (root.localStorage.getItem(this.storageKey) !== this.storedRecord) {
          fail('图谱已更新，请刷新页面后重试。')
          return
        }
        this.writeGraph(graph)
      } catch {
        fail('浏览器暂时无法保存，请重试。')
        return
      }
      this.graph = graph
      this.closeDialog()
      this.renderWorkspace()
      this.$('.kdg-graph-search-input')?.focus({preventScroll:true})
    }
    editName() {
      const node = nodeAt(this.graph, pathOf(this.selected))
      const dialog = this.addDialog('修改' + nodeKind(node) + '名称', '<label class="kdg-field"><strong>名称</strong><input class="kdg-name" required></label><p class="kdg-status kdg-error" role="status" hidden></p>',
        '<button type="button" class="kdg-secondary" data-act="cancel">取消</button><button type="button" class="kdg-primary" data-act="save-name">保存</button>')
      const input = dialog.querySelector('.kdg-name')
      input.value = node.name
      input.focus()
      input.select()
    }
    saveName() {
      const selection = this.selected
      const value = this.$('.kdg-name').value.trim()
      if (!value) {
        const error = this.$('.kdg-status')
        error.hidden = false
        error.textContent = '请填写名称。'
        this.$('.kdg-name').focus()
        return
      }
      const { section, unit } = nodeAt(this.graph, pathOf(selection))
      const owner = section || unit
      if (selection.point === null && owner.name !== value) {
        owner.name = value
        owner.nameEdited = true
      } else if (selection.point !== null && owner.points[selection.point] !== value) {
        owner.points[selection.point] = value
        owner.editedPoints = [...new Set([...(owner.editedPoints || []), selection.point])]
      }
      this.save()
      this.closeDialog()
      this.renderWorkspace()
      this.selectNode(...pathOf(selection))
    }
    deleteNodeDialog() {
      if (!this.selected || this.historyShown) return
      const path = pathOf(this.selected)
      const node = nodeAt(this.graph, path)
      if (!node?.unit) return
      const { unit, section, point, name } = node
      const depth = point ? 3 : section ? 2 : 1
      let descendants = ''
      if (!point) {
        const { sections, points } = section ? { sections: 0, points: section.points.length } : knowledgeCounts([unit])
        descendants = [sections && `${sections} 个主题`, points && `${points} 个知识点`].filter(Boolean).join('、')
      }
      this.addDialog('删除' + nodeKind(node), `<div class="kdg-delete-impact">
        <p>将从当前知识领域图谱中删除<strong>「${escape(name)}」</strong>${descendants ? `及其下的 ${descendants}` : ''}。相关跨课程关联也会一并删除。</p>
        <p class="kdg-delete-warning"><strong>删除后不可恢复。</strong></p>
        <p class="kdg-status kdg-error kdg-delete-status" role="status" hidden></p></div>`,
        '<button type="button" class="kdg-secondary" data-act="cancel" autofocus>取消</button><button type="button" class="kdg-primary kdg-danger" data-act="confirm-delete-node">确认删除</button>',
        '', { alert: true })
      this.deleteTarget = { graph: this.graph, path, depth }
    }
    confirmDeleteNode() {
      const target = this.deleteTarget
      if (!target || target.graph !== this.graph || this.historyShown) return
      const status = this.$('.kdg-delete-status')
      const { path, depth } = target
      try {
        if (root.localStorage.getItem(this.storageKey) !== this.storedRecord) {
          status.textContent = '图谱已更新。请刷新页面后重新确认删除。'
          status.hidden = false
          return
        }
        const graph = graphWithoutNode(this.graph, path, depth)
        this.writeGraph(graph)
        this.graph = graph
      } catch {
        status.textContent = '浏览器暂时无法保存，节点仍在图谱中。请重试。'
        status.hidden = false
        return
      }
      this.closeDialog()
      this.renderWorkspace()
      this.selectNode(...path.slice(0, depth))
      this.$('.kdg-graph-search-input')?.focus({ preventScroll: true })
    }
    onChange(event) {
      if (event.target.matches('.kdg-file-input')) {
        const files = [...event.target.files]
        event.target.value = ''
        void this.readFiles(files)
      }
    }
    onInput(event) {
      if (event.target.matches('.kdg-graph-search-input')) this.renderSearch()
    }
    setPointFilter(filter) {
      if (filter === this.pointFilter) return
      this.pointFilter = filter
      for (const name of Object.keys(pointFilters)) {
        this.$('[data-act="toggle-' + name + '"]').setAttribute('aria-checked', String(filter === name))
      }
      this.scene?.setPointFilter(filter)
      if (this.selected && !this.matchesView(pathOf(this.selected))) this.resetView()
      if (filter && this.atlasSelection?.kind === 'goal') this.clearSelection()
      this.detailPage = 0
      this.$('.kdg-graph-counts').innerHTML = this.viewCounts
      const empty = this.$('.kdg-cross-empty')
      empty.textContent = this.pointFilterEmpty
      empty.hidden = !empty.textContent
      this.renderDetail()
    }
    setDomainsVisible(value) {
      if (value === this.domainsVisible) return
      this.domainsVisible = value
      this.$('[data-act="toggle-domains"]')?.setAttribute('aria-checked', String(value))
      this.scene?.setDomainsVisible(value)
      if (!value && this.atlasSelection) this.clearSelection()
      try { if (!this.readOnly && this.legacyKey) root.localStorage.setItem(this.legacyKey + ':show-domains', value ? '1' : '0') } catch {}
    }
    onClick(event) {
      if (!event.target.closest('.kdg-export')) this.setExportOpen(false)
      const menu = this.$('.kdg-create-menu')
      if (menu?.open && !event.target.closest('summary')) menu.open = false
      const target = event.target.closest('button[data-act]')
      if (!target || target.disabled || !this.contains(target)) return
      const index = Number(target.dataset.index)
      const selection = this.selected
      switch (target.dataset.act) {
        case 'toggle-export':
          if (target.getAttribute('aria-busy') !== 'true') this.setExportOpen(this.$('.kdg-export-options').hidden)
          break
        case 'export-screenshot': void this.exportScreenshot(); break
        case 'initialize': this.initializeDialog(); break
        case 'confirm-initialize': this.initialize(); break
        case 'create': this.createDialog(); break
        case 'import': this.importDialog(); break
        case 'cancel': this.closeDialog(); break
        case 'upload': this.$('.kdg-file-input').click(); break
        case 'remove-file': this.draft.files.splice(index, 1); this.updateDraft(); break
        case 'generate': void this.generate(); break
        case 'sources': this.showSources(); break
        case 'history': this.toggleHistory(); break
        case 'retry-scene': void this.mountScene(); break
        case 'explore-graph': this.setResultsIntro(false); break
        case 'detail-page-prev': this.detailPage--; this.renderDetail(); break
        case 'detail-page-next': this.detailPage++; this.renderDetail(); break
        case 'section': this.selectNode(selection.course, selection.topic, index); break
        case 'point': this.selectNode(selection.course, selection.topic, selection.section, index); break
        case 'relation': {
          const edge = this.nearby[index]
          if (!edge) break
          if (!this.matchesView(edge.target)) this.setPointFilter('')
          this.selectNode(...edge.target)
          break
        }
        case 'atlas-domain':
          this.selectAtlasResult({kind:'domain', index})
          this.$('.kdg-detail h3')?.focus({preventScroll: true})
          break
        case 'atlas-goal': this.selectAtlasResult({kind:'goal', index}); break
        case 'atlas-course':
          if (!this.matchesView([index, null, null, null])) this.setPointFilter('')
          this.selectNode(index)
          break
        case 'close-detail':
          this.resetView()
          this.$('.kdg-graph-search-input').focus({preventScroll: true})
          break
        case 'toggle-theme':
          this.preferredTheme = this.darkMode ? 'light' : 'dark'
          this.applyTheme()
          try { root.localStorage.setItem(themeKey, this.preferredTheme) } catch {}
          break
        case 'toggle-cross-course':
        case 'toggle-cross-domain': {
          const filter = target.dataset.act.slice('toggle-'.length)
          this.setPointFilter(this.pointFilter === filter ? '' : filter)
          break
        }
        case 'toggle-domains': this.setDomainsVisible(!this.domainsVisible); break
        case 'reset': this.resetView(); break
        case 'edit': this.editName(); break
        case 'edit-node': if (selection) this.openNodeEditor('point', pathOf(selection)); break
        case 'edit-atlas': {
          const current = this.atlasSelection
          if (current) this.openNodeEditor(current.kind, this.atlas[current.kind === 'goal' ? 'goals' : 'domains'][current.index])
          break
        }
        case 'delete-atlas': this.openAtlasDeleteDialog(); break
        case 'commit-atlas': this.commitAtlasChange(); break
        case 'save-name': this.saveName(); break
        case 'delete-node': this.deleteNodeDialog(); break
        case 'confirm-delete-node': this.confirmDeleteNode(); break
      }
    }
  }
  root.customElements.define('knowledge-domain-graph', KnowledgeDomainGraph)
})(globalThis)
