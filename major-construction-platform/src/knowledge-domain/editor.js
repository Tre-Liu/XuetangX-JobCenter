/* The standalone and Vue pages edit the same graph record. */
;(function (root) {
  const labels = { point: '知识点', course: '课程', domain: '知识领域', goal: '培养目标' }
  const descriptionLabels = { point: '知识点说明（选填）', domain: '领域说明（选填）', goal: '培养目标内容' }
  const pathKey = path => Array.isArray(path) ? path.join('/') : ''
  const setEqual = (a, b) => a.length === b.length && a.every(item => b.includes(item))

  function pointDomains(atlas, path) {
    const key = pathKey(path)
    if (atlas.unassigned?.has(key)) return []
    return (atlas.memberships.get(key) || [atlas.paths.get(key)])
      .map(index => atlas.domains[index]).filter(domain => domain && !domain.deleted).map(domain => domain.key)
  }

  function edit(panel, initialKind, target, { escape, nodeAt, searchText }) {
    const graph = panel.graph
    if (!graph || panel.historyShown) return
    const atlas = panel.atlas
    const courses = graph.courses.map(course => ({ key: String(course.id ?? course.name), name: course.name }))
    const domains = atlas.domains.filter(domain => !domain.deleted).map(domain => ({ key: domain.key, name: domain.name }))
    const goals = atlas.goals.map(goal => ({ key: goal.key, name: goal.title }))
    const points = panel.buildSearchIndex().filter(item => item.kind === 'point').map(item => ({ ...item, key: pathKey(item.path) }))
    const field = (label, html) => `<label class="kdg-field"><strong>${label}</strong>${html}</label>`
    const option = (value, name) => `<option value="${escape(value)}">${escape(name)}</option>`
    const select = (name, options) => `<select class="kdg-name" name="${name}">${options}</select>`
    const input = (name, value, max) => `<input class="kdg-name" name="${name}" value="${escape(value)}" maxlength="${max}">`
    const openLabel = target ? '编辑' + labels[initialKind] : '添加节点'
    const dialog = panel.addDialog(openLabel,
      `${target ? '' : field('节点类型', select('kind', Object.entries(labels).map(([kind, label]) => option(kind, label)).join('')))}<div class="kdg-editor-fields"></div>`,
      '<p class="kdg-status kdg-error kdg-editor-status" role="alert" hidden></p><button type="button" class="kdg-secondary" data-act="cancel">取消</button><button type="button" class="kdg-primary" data-editor="save">保存</button>')
    panel.nodeEditor = dialog
    dialog.classList.add('kdg-editor')
    const fields = dialog.querySelector('.kdg-editor-fields')
    const status = dialog.querySelector('.kdg-editor-status')
    const control = name => fields.querySelector(`[name="${name}"]`)
    const value = name => control(name).value.trim()
    const fail = message => {
      status.hidden = false
      status.textContent = message
    }

    const parents = graph.courses.map((course, ci) => {
      const branches = []
      for (const [ui, unit] of course.topics.entries()) {
        if (unit.points || !unit.sections?.length) branches.push({ path: [ci, ui, null], name: unit.name })
        for (const [si, section] of (unit.sections || []).entries()) {
          branches.push({ path: [ci, ui, si], name: unit.name + ' › ' + section.name })
        }
      }
      return branches
    })

    function checks(host, title, choices, selected, filterable = false) {
      host.innerHTML = `<fieldset class="kdg-editor-group"><legend>${title}</legend>
        ${filterable ? field('筛选课程', '<input class="kdg-name" type="search" placeholder="输入课程名称">') : ''}
        <div class="kdg-editor-options"></div><p class="kdg-editor-hint" role="status"></p></fieldset>`
      const search = host.querySelector('input[type="search"]')
      const list = host.querySelector('.kdg-editor-options')
      const hint = host.querySelector('.kdg-editor-hint')
      const render = () => {
        const query = searchText(search?.value)
        const matches = choices.filter(item => !query || searchText(item.name).includes(query))
        list.innerHTML = matches.map(({key, name, trail, inherited}) =>
          `<label class="kdg-editor-choice"><input type="checkbox" value="${escape(key)}" ${inherited || selected.has(key) ? 'checked' : ''} ${inherited ? 'disabled' : ''}><span>${escape(name)}${trail ? `<small>${escape(trail)}</small>` : ''}</span></label>`
        ).join('')
        list.scrollTop = 0
        updateHint(matches.length)
      }
      let count = 0
      function updateHint(total = count) {
        count = total
        hint.textContent = !count ? (queryActive() ? '未找到匹配项' : '暂无可选项') :
          '已关联 ' + choices.filter(item => item.inherited || selected.has(item.key)).length + ' 项'
      }
      const queryActive = () => Boolean(search?.value.trim())
      search?.addEventListener('input', render)
      list.addEventListener('change', event => {
        const { value, checked } = event.target
        if (checked) selected.add(value)
        else selected.delete(value)
        updateHint()
      })
      render()
    }

    let kind, selectedDomains, selectedCourses, selectedGoals
    const initialPath = target && initialKind === 'point' ? target : null
    const node = initialPath ? nodeAt(graph, initialPath) : null
    const owner = node?.section || node?.unit
    const initialNote = owner?.pointNotes?.[initialPath[3]]
    const initialDomain = target && initialKind === 'domain' ? target : null
    const initialGoal = target && initialKind === 'goal' ? target : null
    const currentOwner = panel.selected && [panel.selected.course, panel.selected.topic, panel.selected.section]
    const inheritedCourses = new Set(initialDomain?.members.map(member => member.path[0]))

    function updateParents() {
      const branches = parents[value('course')]
      const parent = control('parent')
      const needsUnit = branches?.length === 0
      parent.closest('label').hidden = needsUnit
      parent.disabled = !branches || needsUnit
      const newUnit = control('new-unit')
      newUnit.closest('label').hidden = !needsUnit
      newUnit.disabled = !needsUnit
      newUnit.value = ''
      const prompt = branches ? '请选择知识单元或主题' : '请先选择所属课程'
      parent.innerHTML = option('', prompt) + (branches || []).map(({name}, index) => option(index, name)).join('')
    }

    function crossRelations() {
      const list = fields.querySelector('.kdg-editor-edges')
      const search = control('peer')
      const results = fields.querySelector('.kdg-editor-peers')
      const hint = fields.querySelector('.kdg-editor-peer-hint')
      const selectedCourse = () => initialPath?.[0] ?? (value('course') === '' ? null : Number(value('course')))
      const renderResults = () => {
        const course = selectedCourse()
        search.disabled = course === null
        search.placeholder = search.disabled ? '请先选择所属课程' : '输入其他课程的知识点或课程名称'
        const query = searchText(search.value)
        const used = new Set([...list.children].map(row => row.dataset.peer))
        const matches = query && !search.disabled ? points.filter(item => item.path[0] !== course && !used.has(item.key) &&
          searchText([item.name, item.trail].join(' ')).includes(query)) : []
        results.innerHTML = matches.slice(0, 30).map(item =>
          `<button type="button" data-peer="${item.key}"><span>${escape(item.name)}<small>${escape(item.trail)}</small></span></button>`
        ).join('')
        results.hidden = !matches.length
        hint.textContent = query && !search.disabled && !matches.length ? '未找到可关联的跨课程知识点' : matches.length > 30 ? '可继续筛选其余结果' : ''
      }
      const append = (item, edge) => {
        const row = document.createElement('div')
        row.className = 'kdg-editor-edge'
        row.dataset.peer = item.key
        row.innerHTML = `<div class="kdg-editor-edge-head"><strong>${escape(item.name)}<small>${escape(item.trail)}</small></strong>
          <button type="button" class="kdg-link" data-remove-edge aria-label="${escape('移除关联，' + item.name)}">移除</button></div>
          <div class="kdg-editor-edge-fields">${field('关联方向', '<select class="kdg-name" name="direction">' + option('out', '当前知识点 → 关联知识点') + option('in', '关联知识点 → 当前知识点') + '</select>')}
          ${field('关联类型', input('relation-type', edge?.label || '知识关联', 80))}</div>
          ${field('关联说明', input('relation-reason', edge?.reason || '', 300))}`
        row.querySelector('[name="direction"]').value = edge?.outgoing === false ? 'in' : 'out'
        row.querySelector('[data-remove-edge]').addEventListener('click', () => {
          row.remove()
          renderResults()
          search.focus({ preventScroll: true })
        })
        list.append(row)
        return row
      }
      if (initialPath) {
        for (const edge of panel.relatedPoints(initialPath)) {
          const item = points.find(item => item.key === pathKey(edge.target))
          if (item) append(item, edge)
        }
      }
      control('course')?.addEventListener('change', renderResults)
      search.addEventListener('input', renderResults)
      results.addEventListener('click', event => {
        const choice = event.target.closest('[data-peer]')
        if (!choice) return
        const row = append(points.find(point => point.key === choice.dataset.peer))
        search.value = ''
        renderResults()
        row.querySelector('[name="relation-reason"]').focus()
      })
      renderResults()
    }

    function render(nextKind) {
      kind = nextKind
      status.hidden = true
      if (kind === 'course') {
        fields.innerHTML = field('课程名称', input('name', '', 120)) +
          field('所属知识领域（选填）', select('domain', option('', '专业综合知识（默认）') +
            domains.map(({key, name}) => option(key, name)).join('')))
        return
      }
      const isPoint = kind === 'point'
      const title = node?.name || initialDomain?.name || initialGoal?.title || ''
      const description = initialNote?.description || initialDomain?.description || initialGoal?.text || ''
      selectedDomains = new Set(initialPath ? pointDomains(atlas, initialPath)
        : initialGoal?.domains.map(({index}) => atlas.domains[index].key))
      selectedCourses = new Set(initialDomain?.linkedCourses.map(index => courses[index].key))
      selectedGoals = new Set(initialDomain?.goals.map(({index}) => atlas.goals[index].key))
      fields.innerHTML = `${field(labels[kind] + '名称', input('name', title, 120))}
        ${isPoint && !initialPath ? field('所属课程', select('course', option('', '请选择所属课程') +
          courses.map(({name}, index) => option(index, name)).join(''))) +
          field('所属知识单元 / 主题', select('parent', '')) +
          field('知识单元名称', input('new-unit', '', 120)) : ''}
        ${field(descriptionLabels[kind], `<textarea class="kdg-name" name="description" rows="3" maxlength="2000">${escape(description)}</textarea>`)}
        <div data-choices></div>
        ${kind === 'domain' ? '<div data-goals></div>' : ''}
        ${isPoint ? `<fieldset class="kdg-editor-group"><legend>跨课程关联</legend>
          <div class="kdg-editor-edges"></div>${field('查找关联知识点', '<input class="kdg-name" name="peer" type="search" placeholder="输入其他课程的知识点或课程名称">')}
          <div class="kdg-editor-options kdg-editor-peers" hidden></div><p class="kdg-editor-hint kdg-editor-peer-hint" role="status"></p></fieldset>` : ''}`
      if (isPoint && !initialPath) {
        const course = control('course')
        if (currentOwner) course.value = String(currentOwner[0])
        updateParents()
        course.addEventListener('change', updateParents)
        const suggestedParent = parents[course.value]?.findIndex(({path}) => pathKey(path) === pathKey(currentOwner))
        if (suggestedParent >= 0) control('parent').value = String(suggestedParent)
      }
      if (kind === 'domain') {
        const courseChoices = courses.map((course, index) => inheritedCourses.has(index)
          ? { ...course, inherited: true, trail: '按知识结构关联' } : course)
        checks(fields.querySelector('[data-choices]'), '关联课程', courseChoices, selectedCourses, courses.length > 8)
        checks(fields.querySelector('[data-goals]'), '关联培养目标', goals, selectedGoals)
      } else {
        checks(fields.querySelector('[data-choices]'), isPoint ? '所属知识领域' : '关联知识领域', domains, selectedDomains)
      }
      if (isPoint) crossRelations()
    }

    function savePoint(updated, name, description) {
      if (!initialPath && !value('course')) throw new Error('请选择所属课程。')
      let parent = initialPath?.slice(0, 3)
      if (!initialPath) {
        const courseIndex = Number(value('course'))
        const branches = parents[courseIndex]
        parent = branches?.[value('parent')]?.path
        if (branches?.length === 0) {
          const unitName = value('new-unit')
          if (!unitName || unitName.length > 120) throw new Error('请填写 120 字以内的知识单元名称。')
          const topics = updated.courses[courseIndex].topics
          parent = [courseIndex, topics.length, null]
          topics.push({ name: unitName, points: [], source: '人工添加' })
        }
      }
      if (!parent) throw new Error('请选择所属知识单元或主题。')
      const branch = nodeAt(updated, [...parent, null])
      const targetOwner = branch.section || branch.unit
      const index = initialPath?.[3] ?? targetOwner.points?.length ?? 0
      const path = [...parent, index]
      if (name !== node?.name && targetOwner.points?.some((point, i) => i !== index && searchText(point) === searchText(name))) {
        throw new Error('该知识单元或主题下已有同名知识点。')
      }
      const key = pathKey(path)
      const oldEdges = panel.relatedPoints(path)
      const edges = [...fields.querySelector('.kdg-editor-edges').children].map(row => {
        const peer = points.find(point => point.key === row.dataset.peer).path
        const label = row.querySelector('[name="relation-type"]').value.trim()
        const reason = row.querySelector('[name="relation-reason"]').value.trim()
        if (peer[0] === path[0]) throw new Error('跨课程关联需选择其他课程的知识点。')
        if (!label || !reason) throw new Error('请填写每条关联的类型和说明。')
        const outgoing = row.querySelector('[name="direction"]').value === 'out'
        const unchanged = oldEdges.find(edge => pathKey(edge.target) === row.dataset.peer &&
          edge.label === label && edge.reason === reason && edge.outgoing === outgoing)
        const manual = unchanged ? unchanged.manual : true
        return { from: outgoing ? path : peer, to: outgoing ? peer : path, label, reason, ...(manual ? { manual } : {}) }
      })
      ;(targetOwner.points ||= [])[index] = name
      if (initialPath && name !== node.name) {
        targetOwner.editedPoints = [...new Set([...(targetOwner.editedPoints || []), index])]
      }
      if (description !== (initialNote?.description || '') || !initialPath) {
        ;(targetOwner.pointNotes ||= {})[index] = { ...initialNote, description, added: initialNote?.added || !initialPath }
      }
      const before = initialPath ? pointDomains(atlas, path) : []
      if (!initialPath || !setEqual([...selectedDomains], before)) {
        ;(targetOwner.manualPointDomains ||= {})[index] = [...selectedDomains]
      }
      const relations = Array.isArray(updated.relations) ? updated.relations : []
      updated.relations = [...relations.filter(edge => pathKey(edge?.from) !== key && pathKey(edge?.to) !== key), ...edges]
      return { path }
    }

    function saveCourse(updated, name) {
      if (courses.some(course => searchText(course.name) === searchText(name))) throw new Error('已有同名课程。')
      const courseIndex = updated.courses.length
      const ids = new Set(courses.map(course => course.key))
      let sequence = courseIndex + 1
      while (ids.has('manual-course:' + sequence)) sequence++
      const domain = value('domain')
      updated.courses.push({ id: 'manual-course:' + sequence, name, source: '人工添加', topics: [], ...(domain ? { domain } : {}) })
      return { path: [courseIndex, null, null, null] }
    }

    function saveAtlas(updated, name, description) {
      const entries = kind === 'goal' ? goals : domains
      const original = initialGoal || initialDomain
      if (name !== (original?.name || original?.title) &&
          entries.some(item => item.key !== original?.key && searchText(item.name) === searchText(name))) {
        throw new Error('已有同名' + labels[kind] + '。')
      }
      const changes = updated.atlasChanges ||= {}
      const edits = changes[kind === 'goal' ? 'goals' : 'domains'] ||= {}
      const key = original?.key || 'manual-' + kind + ':' + Object.keys(edits).length
      if (kind === 'goal') {
        const before = initialGoal?.domains.map(({index}) => atlas.domains[index].key) || []
        const chosen = [...selectedDomains]
        edits[key] = { ...edits[key], name, text: description, ...(!original ? { added: true } : {}) }
        if (!original || !setEqual(chosen, before)) edits[key].domains = chosen
      } else {
        edits[key] = { ...edits[key], name, description, courseIds: [...selectedCourses], ...(!original ? { added: true } : {}) }
        const previousGoals = new Set(initialDomain?.goals.map(({index}) => atlas.goals[index].key))
        for (const goal of atlas.goals) {
          if (previousGoals.has(goal.key) === selectedGoals.has(goal.key)) continue
          const goalEdits = changes.goals ||= {}
          const keys = goal.domains.map(({index}) => atlas.domains[index].key).filter(value => value !== key)
          if (selectedGoals.has(goal.key)) keys.push(key)
          goalEdits[goal.key] = { ...goalEdits[goal.key], domains: keys }
        }
      }
      return { kind, key }
    }

    function save() {
      const name = value('name'), description = kind === 'course' ? '' : value('description')
      if (!name || name.length > 120) { fail('请填写 120 字以内的' + labels[kind] + '名称。'); control('name').focus(); return }
      if (kind === 'goal' && !description) { fail('请填写培养目标内容。'); control('description').focus(); return }
      if (graph !== panel.graph || panel.historyShown) { fail('图谱已更新，请关闭窗口后重新编辑。'); return }
      const updated = JSON.parse(JSON.stringify(graph))
      let selection
      const saveNode = { point: savePoint, course: saveCourse }[kind] || saveAtlas
      try { selection = saveNode(updated, name, description) }
      catch (error) { fail(error.message); return }
      try {
        if (root.localStorage.getItem(panel.storageKey) !== panel.storedRecord) {
          fail('图谱已在另一个页面更新，请刷新后重新编辑。')
          return
        }
        panel.writeGraph(updated)
      } catch {
        fail('浏览器暂时无法保存，请重试。')
        return
      }
      panel.graph = updated
      panel.closeDialog()
      panel.renderWorkspace()
      panel.setPointFilter('')
      if (selection.path) panel.selectNode(...selection.path)
      else {
        const entries = selection.kind === 'domain' ? panel.atlas.domains : panel.atlas.goals
        const index = entries.findIndex(item => item.key === selection.key)
        if (index >= 0) panel.selectAtlasResult({ kind: selection.kind, index })
      }
      const focusTarget = panel.$('.kdg-detail [data-act="edit-node"], .kdg-detail [data-act="edit-atlas"]') ||
        panel.$('.kdg-detail [data-act="close-detail"]')
      focusTarget?.focus({ preventScroll: true })
    }

    dialog.querySelector('[name="kind"]')?.addEventListener('change', event => render(event.target.value))
    dialog.querySelector('[data-editor="save"]').addEventListener('click', save)
    render(initialKind)
    if (target) control('name').focus({ preventScroll: true })
  }

  root.KnowledgeDomainEditor = { edit }
})(globalThis)
