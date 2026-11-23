// Build the graph from the active workspace. The bundled catalogue belongs to the
// default construction programme. An unrelated workspace supplies its own materials.
;(function (root) {
  function build(url, {catalogAvailable = true, selection = 'all'} = {}) {
    const params = url.searchParams
    const data = root.TalentPlanData
    const canonical = name => String(name || '').trim().replace(/专业$/, '')
    const major = params.get('majorName')?.trim() || '智能建造工程专业'
    const school = params.get('schoolId') || params.get('schoolName') || ''
    const workspace = params.get('workspaceId') || params.get('projectId') || ''
    const id = params.get('majorId') || params.get('majorCode') || ''
    const scope = JSON.stringify([url.pathname.replace(/(?:\/index\.html|\/)$/, ''), school, workspace, id, canonical(major)])
    const ownCatalogue = !school && !workspace && (!id || id === data?.existing?.code) && canonical(major) === canonical(data?.existing?.major)
    const courses = []
    const materials = []
    const curriculum = ownCatalogue && catalogAvailable && selection === 'knowledge-domain'
      ? root.KnowledgeDomainCurriculum : undefined
    let plan = ownCatalogue && data.existing.goals ? {name:data.existing.name, text:data.existing.goals} : null
    let revision
    let relationSeeds = []
    if (curriculum) {
      const catalogue = new Map(data.courses.map(course => [course.id, course]))
      for (const outline of curriculum.courses) {
        const record = catalogue.get(outline.id)
        if (record) courses.push({...outline, name: record.name, isCore: record.type?.includes('专业核心') === true})
      }
      if (courses.length) {
        revision = curriculum.revision
        relationSeeds = curriculum.relationSeeds
      }
    } else if (ownCatalogue && catalogAvailable) {
      courses.push(...data.courses.map(({id, name, type}) => ({id, name, isCore: type?.includes('专业核心') === true})))
      materials.push(...(root.KnowledgeDomainOutlines || []))
    }
    // The talent-plan workbench currently stores drafts locally for the default
    // workspace. Only adopt a current draft whose own programme matches.
    if (!school && !workspace && (!id || ownCatalogue)) {
      try {
        const draft = root.TalentPlanModel?.load(root.localStorage)?.draft
        if (draft && canonical(draft.major) === canonical(major)) {
          const goals = draft.chapters?.goals || draft.source?.chapters?.goals
          if (goals) plan = {name:draft.chapters?.goals ? (draft.name || major) + '（修订草稿）' : draft.source.fileName, text:goals}
          if (!revision) {
            const ids = new Set(courses.map(c => c.id))
            for (const course of draft.customCourses || []) {
              if (!ids.has(course.id)) {
                courses.push({id:course.id,name:course.name,isCore:course.type?.includes('专业核心') === true})
                ids.add(course.id)
              }
            }
          }
          if (draft.source?.text) materials.push({name:draft.source.fileName || '培养方案原文',text:draft.source.text})
        }
      } catch { /* Storage can be unavailable in a restricted browser. */ }
    }
    return {major, scope, courses, materials, plan, curriculumRevision: revision, relationSeeds,
      suggestedGoals:revision ? curriculum.suggestedGoals : undefined}
  }
  root.KnowledgeDomainContext = {build}
})(globalThis)
