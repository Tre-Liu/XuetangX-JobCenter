/* Course views use the curriculum archive and keep teaching additions local to this view. */
;(function (root) {
  const bim = {
    id: 'B261306', units: [0, 3, 11],
    anchor: { name: '典型断面截取', sectionIndex: 1, pointIndex: 1 },
    extension: [
      '净高核验断面', '机电管线控制断面', '风管下缘控制断面', '计入保温层的风管下缘',
      '矩形风管下缘边界', '跨走道风管的下缘投影', '投影区间内的最小净空读取'
    ]
  }
  const survey = {
    id: 'B261307', units: [0, 2, 3],
    anchor: { name: '点云切片', sectionIndex: 1, pointIndex: 4 },
    extension: [
      '断面点云成果', '建筑横断面点云', '通行空间断面点云', '走道净高复核断面',
      '地坪与顶板下缘分层', '通行宽度范围内的上下点匹配', '最小净高取值与异常点复核'
    ]
  }
  const keyOf = path => path.join('-')
  const node = (path, name, children = []) => ({ id: keyOf(path), name, children })

  function archiveCourse(graph, profile, unitIndices) {
    const ci = graph.courses.findIndex(course => course.id === profile.id)
    const course = graph.courses[ci]
    const template = root.KnowledgeDomainCurriculum.courses.find(course => course.id === profile.id)
    if (!course || !template) return null

    const units = unitIndices.map(index => {
      const expected = template.topics[index]
      const ui = course.topics.findIndex((unit, position) => unit.curriculumUnitIndex === index ||
        (unit.curriculumUnitIndex == null && (unit.name === expected.name || (position === index && unit.nameEdited))))
      const unit = course.topics[ui]
      if (!unit?.sections?.length) return null

      const themes = unit.sections.slice(0, expected.sections.length).map((section, si) => {
        const points = section.points.slice(0, expected.sections[si].points.length).map((name, pi) =>
          node([ci, ui, si, pi], name))
        return node([ci, ui, si, null], section.name, points)
      })
      return node([ci, ui, null, null], unit.name, themes)
    })
    return units.every(Boolean) ? node([ci, null, null, null], course.name, units) : null
  }

  function deepen(course, { anchor, extension }, graph) {
    const unit = course.children.at(-1)
    const { sectionIndex, pointIndex } = anchor
    const section = unit.children[sectionIndex]
    const [ci, ui] = unit.id.split('-').map(Number)
    const archivedSection = graph.courses[ci].topics[ui].sections[sectionIndex]
    const renamed = archivedSection?.editedPoints?.includes(pointIndex)
    const parent = unit.children.flatMap(theme => theme.children).find(point => point.name === anchor.name) ||
      (renamed ? section?.children[pointIndex] : null)
    if (!parent) return
    let branch = parent
    for (const [index, name] of extension.entries()) {
      const child = node([parent.id, 'detail', index + 1], name)
      branch.children.push(child)
      branch = child
    }
  }

  function summarize(roots, edges) {
    const records = new Map()
    let maxDepth = 0
    function visit(item, level) {
      records.set(item.id, item)
      maxDepth = Math.max(level, maxDepth)
      item.children.forEach(child => visit(child, level + 1))
    }
    roots.forEach(course => visit(course, 0))
    const relations = (Array.isArray(edges) ? edges : []).flatMap(edge => {
      if (!Array.isArray(edge?.from) || edge.from.length !== 4 || edge.from[3] == null ||
          !Array.isArray(edge.to) || edge.to.length !== 4 || edge.to[3] == null || edge.from[0] === edge.to[0] ||
          typeof edge.label !== 'string' || typeof edge.reason !== 'string') return []
      const from = records.get(keyOf(edge.from)), to = records.get(keyOf(edge.to))
      return from && to ? [{ ...edge, from, to }] : []
    })
    return { roots, maxDepth, nodeCount: records.size, relations }
  }

  function build(graph) {
    if (!graph?.curriculumRevision || graph.curriculumRevision !== root.KnowledgeDomainCurriculum?.revision) return {}
    const singleRoot = archiveCourse(graph, bim, bim.units.slice(0, 2))
    for (const [index, unit] of (singleRoot?.children || []).entries()) {
      unit.children = unit.children.flatMap(theme => theme.children).slice(0, index === 0 ? 15 : 12)
    }
    const single = singleRoot && summarize([singleRoot])
    const dualRoots = [bim, survey].map(profile => {
      const course = archiveCourse(graph, profile, profile.units)
      if (course) deepen(course, profile, graph)
      return course
    })
    const dual = dualRoots.every(Boolean) && summarize(dualRoots, graph.relations)
    return { single, dual: dual?.maxDepth === 10 ? dual : null }
  }

  root.CourseKnowledgeHierarchy = { build }
})(globalThis)
