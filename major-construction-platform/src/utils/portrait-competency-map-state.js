;(function registerPortraitCompetencyMapState(root) {
  const MIN_ZOOM = 0.6
  const MAX_ZOOM = 1.4

  const changeZoom = (currentZoom, delta) => {
    const nextZoom = Math.round((Number(currentZoom) + Number(delta)) * 10) / 10
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
  }

  const nextTheme = (theme) => theme === 'dark' ? 'light' : 'dark'

  const buildTaskAbilityLanes = (items, activeNames, categories) => categories.map((category) => ({
    category,
    items: items.filter((item) => item.category === category && activeNames.has(item.name))
  }))

  const getTaskSlideDirection = (currentIndex, nextIndex) => nextIndex >= currentIndex ? 'forward' : 'backward'

  const buildAbilityDetail = ({ abilityName, jobName, nodes, tasks }) => {
    const node = nodes.find((item) => item.name === abilityName) || {
      name: abilityName,
      category: '知识',
      tone: 'knowledge',
      marker: '知'
    }

    return {
      name: node.name,
      category: node.category,
      tone: node.tone,
      marker: node.marker,
      jobName,
      relatedTasks: tasks
        .filter((task) => task.abilities.includes(abilityName))
        .map((task) => task.name)
    }
  }

  root.PortraitCompetencyMapState = {
    changeZoom,
    nextTheme,
    buildTaskAbilityLanes,
    getTaskSlideDirection,
    buildAbilityDetail
  }
})(typeof window === 'undefined' ? globalThis : window)
