// Import the three graph worksheets into a detached copy. A failed row never edits the live graph.
;(function (root) {
  const sheets = {
    课程群图谱: ['根节点', '二级知识点', '三级知识点', '四级知识点', '五级知识点', '六级知识点', '七级知识点', '八级知识点', '九级知识点', '十级知识点', '知识说明', '知识点标签', '节点关系', '思政元素', '设计方式'],
    知识领域关系: ['知识领域', '领域说明', '课程名称', '知识点'],
    培养目标: ['培养目标', '目标内容', '关联知识领域', '目标来源'],
  }
  function read(bytes) {
    const x = root.XLSX
    if (!x) throw new Error('Excel 读取组件未加载，请刷新页面后重试。')
    const book = x.read(bytes, { type: 'array', sheetRows: 10003 })
    const result = {}
    for (const [name, fields] of Object.entries(sheets)) {
      const sheet = book.Sheets[name]
      if (!sheet?.['!ref']) throw new Error('工作簿缺少“' + name + '”工作表。')
      const { e } = x.utils.decode_range(sheet['!fullref'] || sheet['!ref'])
      if (e.r > 10001 || e.c >= 200) throw new Error('每张表最多支持 10000 行数据、200 列。')
      const rows = x.utils.sheet_to_json(sheet, { header: 1, range: 0, raw: false, blankrows: true })
      const header = rows[1] || []
      const columns = fields.map(field => header.findIndex(value => String(value).replace(/[*＊]/g, '').trim() === field))
      if (columns.includes(-1)) throw new Error('“' + name + '”第 2 行缺少字段“' + fields[columns.indexOf(-1)] + '”。')
      result[name] = rows.slice(2).flatMap((row, index) => {
        const cells = columns.map(column => String(row[column] ?? '').trim())
        return cells.some(Boolean) ? [{ cells, at: name + '第 ' + (index + 3) + ' 行' }] : []
      })
    }
    return result
  }
  const trailKey = trail => JSON.stringify(trail)
  function apply(tables, mode, original, atlas, major) {
    const update = mode === 'update'
    if (!original && mode !== 'add') throw new Error('当前图谱为空，请选择新增数据。')
    const fresh = !original || mode === 'replace'
    const graph = fresh ? { major, courses: [], relations: [], mode: 'import', modeLabel: '模板导入',
      goalPlan: { name: '模板导入', text: '' }, useCourseGroupGraph: false } : JSON.parse(JSON.stringify(original))
    if (graph.mode === 'course-group') {
      graph.mode = 'import'
      graph.modeLabel = '模板导入'
      graph.goalPlan = { name: '模板导入', text: '' }
      graph.useCourseGroupGraph = false
    }
    if (fresh) atlas = null
    const changes = graph.atlasChanges ||= {}
    // Domain names are user input, including names that can also be object properties.
    changes.domains = Object.assign(Object.create(null), changes.domains)
    changes.goals = Object.assign(Object.create(null), changes.goals)
    const domainKeys = new Map(atlas?.domains.filter(d => !d.deleted).map(d => [d.name, d.key]))
    const goalKeys = new Map(atlas?.goals.map(g => [g.title, g.key]))
    const nodes = new Map(), pointsByName = new Map(), pendingRelations = []
    const branches = new Set()
    const rows = tables.课程群图谱.map(({ cells, at }) => {
      const names = cells.slice(0, 10)
      while (names.length && !names.at(-1)) names.pop()
      if (!names.length || names.includes('')) throw new Error(at + '须逐级填写完整的知识路径。')
      if (names.length >= 3) branches.add(trailKey(names.slice(0, 2)))
      if (names.length >= 4) branches.add(trailKey(names.slice(0, 3)))
      return { names, at, fields: cells.slice(10) }
    })
    function register(names, indices, item, parent, added = false) {
      const ref = { names, indices, item, parent, added }
      nodes.set(trailKey(names), ref)
      if (indices[3] !== null) {
        const name = names.at(-1)
        if (!pointsByName.has(name)) pointsByName.set(name, [])
        pointsByName.get(name).push(ref)
      }
      return ref
    }
    function indexPoints(owner, names, ci, ui, si) {
      owner.points?.forEach((name, pi) => register([...names, ...name.split(' › ')], [ci, ui, si, pi], null, owner))
    }
    graph.courses.forEach((course, ci) => {
      register([course.name], [ci, null, null, null], course)
      course.topics.forEach((unit, ui) => {
        const names = [course.name, unit.name]
        if (!unit.importDirectPoints) register(names, [ci, ui, null, null], unit)
        indexPoints(unit, unit.importDirectPoints ? [course.name] : names, ci, ui, null)
        unit.sections?.forEach((section, si) => {
          const trail = [...names, section.name]
          register(trail, [ci, ui, si, null], section)
          indexPoints(section, trail, ci, ui, si)
        })
      })
    })
    function ensure(names) {
      const key = trailKey(names)
      if (nodes.has(key)) return nodes.get(key)
      if (update) return null
      const name = names.at(-1)
      if (names.length === 1) {
        const item = { id: 'import:' + name, name, source: '模板导入', topics: [] }
        return register(names, [graph.courses.push(item) - 1, null, null, null], item, null, true)
      }
      const upper = ensure(names.slice(0, -1))
      const [ci, ui, si] = upper.indices
      if (names.length === 2 && !branches.has(key)) {
        let index = upper.item.topics.findIndex(unit => unit.importDirectPoints)
        if (index === -1) index = upper.item.topics.push({ name: '课程知识点', importDirectPoints: true, points: [] }) - 1
        const owner = upper.item.topics[index]
        return register(names, [ci, index, null, owner.points.push(name) - 1], null, owner, true)
      }
      if (names.length === 2) {
        const item = { name, points: [], sections: [] }
        return register(names, [ci, upper.item.topics.push(item) - 1, null, null], item, null, true)
      }
      if (names.length === 3 && !upper.item) {
        const owner = upper.parent
        return register(names, [ci, ui, si, owner.points.push(names.slice(1).join(' › ')) - 1], null, owner, true)
      }
      if (names.length === 3 && branches.has(key)) {
        const item = { name, points: [] }
        return register(names, [ci, ui, (upper.item.sections ||= []).push(item) - 1, null], item, null, true)
      }
      // The globe has four display levels. Preserve deeper branches as qualified point names.
      const owner = upper.item || upper.parent
      const start = owner.importDirectPoints ? 1 : si === null ? 2 : 3
      const label = names.slice(start).join(' › ')
      const pi = (owner.points ||= []).push(label) - 1
      return register(names, [ci, ui, si, pi], null, owner, true)
    }
    let matched = 0
    for (const { names, fields, at } of rows) {
      const ref = ensure(names)
      if (!ref) continue
      matched++
      const [description, tags, relations, civic, design] = fields
      if ((ref.added || update) && fields.some(Boolean)) {
        const target = ref.item || ((ref.parent.pointNotes ||= {})[ref.indices[3]] ||= {})
        for (const [key, value] of Object.entries({ description, tags, relations, civic, design })) {
          if (value) target[key] = value
        }
      }
      if (relations && ref.indices[3] !== null) pendingRelations.push({ ref, relations, description, at })
    }
    const pointLinks = new Map(), domainCourses = new Map()
    function invalid(at, message) { throw new Error(at + '：' + message) }
    function findPoint(course, name, at) {
      const parts = name.split(/\s*›\s*/)
      const matches = (pointsByName.get(parts.at(-1)) || []).filter(ref =>
        ref.names[0] === course && parts.every((part, i) => part === ref.names.at(i - parts.length)))
      if (matches.length === 1) return matches[0]
      if (matches.length > 1) invalid(at, '同名知识点须填写上级路径。')
      if (!update) invalid(at, '找不到“' + course + '”中的知识点“' + name + '”。')
    }
    for (const { cells: [name, description, course, point], at } of tables.知识领域关系) {
      if (!name && !(course && point)) invalid(at, '请填写知识领域或未归属知识点。')
      if (point && !course) invalid(at, '关联知识点时须填写所属课程。')
      let key = domainKeys.get(name)
      if (name) {
        if (!key && update) continue
        if (!key) {
          key = name
          if (Object.hasOwn(changes.domains, key)) key = 'import:' + crypto.randomUUID()
          domainKeys.set(name, key)
          changes.domains[key] = { added: true, name, imported: true }
        }
        const entry = changes.domains[key] ||= {}
        if (description && (update || !atlas?.domains.some(d => d.key === key && !d.deleted))) entry.description = description
        matched++
      }
      if (!course) continue
      const c = nodes.get(trailKey([course]))
      if (!c) { if (update) continue; invalid(at, '找不到课程“' + course + '”。') }
      if (point) {
        const ref = findPoint(course, point, at)
        if (!ref) continue
        if (!pointLinks.has(ref)) pointLinks.set(ref, new Set())
        if (key) pointLinks.get(ref).add(key)
      } else if (key) {
        const entry = changes.domains[key]
        const ids = entry.courseIds ||= []
        if (!ids.includes(c.item.id ?? course)) ids.push(c.item.id ?? course)
      }
      if (key && c.added && !domainCourses.has(c)) domainCourses.set(c, key)
    }
    for (const [c, key] of domainCourses) c.item.domain = key
    for (const [ref, keys] of pointLinks) {
      const pi = ref.indices[3]
      if (!update && !ref.added && atlas) {
        for (const di of root.KnowledgeDomainAtlas.relatedDomains(atlas, ref.indices)) keys.add(atlas.domains[di].key)
      }
      ;(ref.parent.manualPointDomains ||= {})[pi] = [...keys]
    }
    for (const { cells: [name, text, linked, source], at } of tables.培养目标) {
      if (!name || !text) invalid(at, '请填写培养目标及目标内容。')
      const existing = goalKeys.get(name)
      if (update && !existing) continue
      const domains = linked.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(label => {
        if (!domainKeys.has(label)) invalid(at, '找不到知识领域“' + label + '”。')
        return domainKeys.get(label)
      })
      matched++
      if (existing && !update) continue
      const key = existing || 'import-goal:' + name
      changes.goals[key] = { ...changes.goals[key], name, text, domains, source,
        ...(!existing ? { added: true, imported: true, deleted: false } : {}) }
      goalKeys.set(name, key)
    }
    const edges = graph.relations ||= []
    const edgeKey = (from, to, label) => JSON.stringify([from, to, label])
    const edgeMap = new Map(edges.map(edge => [edgeKey(edge.from, edge.to, edge.label), edge]))
    for (const { ref, relations, description, at } of pendingRelations) {
      for (const part of relations.split(/[,，\n]/).map(s => s.trim()).filter(Boolean)) {
        const match = /^([^:：]+)[:：](.+)$/.exec(part)
        if (!match) invalid(at, '节点关系应填写为“关系名称:关联知识点名称”。')
        const label = match[1].trim(), name = match[2].trim()
        let peers = pointsByName.get(name) || []
        if (peers.length > 1) peers = peers.filter(p => description.includes(p.names[0] + ' › ' + name))
        if (peers.length !== 1) {
          if (!peers.length && update) continue
          invalid(at, '请核对关联知识点“' + name + '”及其所属课程。')
        }
        const to = peers[0].indices, from = ref.indices
        const id = edgeKey(from, to, label), existing = edgeMap.get(id)
        if (existing && update && description) existing.reason = description
        if (!existing && !update) {
          const edge = { from, to, label, reason: description || '课程群图谱中登记的节点关系' }
          edgeMap.set(id, edge)
          edges.push(edge)
        }
      }
    }
    if (!graph.courses.length) throw new Error('请在课程群图谱工作表中填写至少一门课程。')
    if (!matched) throw new Error(update ? '没有匹配到可更新的数据。' : '工作簿没有可导入的数据。')
    return graph
  }
  root.KnowledgeDomainWorkbook = { read, apply }
})(globalThis)
