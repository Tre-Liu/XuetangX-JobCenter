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

  const abilityTypes = { 知识: 'knowledge', 技能: 'skill', 素养: 'quality' }

  // Authored BIM competency expansion for product interaction coverage.
  // Generated relationships are explicit below, not audited recruitment evidence.
  const bimAbilityCatalog = [
    {
      taskNames: ['建筑模型创建与标准校核', '岗位任务策划与资料准备'],
      知识: [
        '建筑信息模型分类编码与构件属性组织的标准规范理解',
        '建筑结构机电多专业建模边界与协同接口规则理解',
        '项目设计阶段模型精细度要求与成果验收标准理解',
        '建筑工程设计图纸表达与空间构造关系的综合理解',
        '建筑模型坐标基准与项目公共参数设置规则理解',
        '建筑信息模型数据交换格式与跨平台传递机制理解'
      ],
      技能: [
        '依据建筑设计图纸创建多专业基础模型并完成属性校核',
        '建立项目共享坐标与统一标高并检查模型定位准确性',
        '配置建筑构件分类编码与项目公共参数并批量校验',
        '建立符合项目标准要求的参数化构件族与模板文件',
        '核查设计图纸与建筑模型一致性并整理差异处理清单',
        '编制项目建模实施计划并明确专业协同与质量检查节点'
      ],
      素养: [
        '遵守建筑模型数据真实完整要求并主动记录修改依据',
        '落实项目建模标准规范并对成果质量承担岗位责任',
        '尊重多专业设计边界并主动沟通模型信息交付要求',
        '保持复杂建筑构造核查过程中的细致严谨工作态度',
        '主动识别建模资料缺失与设计矛盾并及时反馈风险',
        '持续学习建筑信息模型标准更新并改进个人工作方法'
      ]
    },
    {
      taskNames: ['施工图深化与碰撞检查', '数字模型与现场数据处理'],
      知识: [
        '多专业建筑模型空间碰撞类型与冲突优先级判定规则',
        '建筑结构机电系统安装净距与施工检修空间要求理解',
        '装配式建筑构件拆分与连接节点深化设计规则理解',
        '复杂建筑节点施工工艺约束与模型表达要求理解',
        '施工图深化设计变更流程与问题闭环管理机制理解',
        '建筑模型碰撞检查规则配置与检查结果分类方法理解'
      ],
      技能: [
        '配置建筑结构机电模型碰撞检查规则并识别重大冲突',
        '汇总多专业模型冲突问题并形成可追踪的整改任务清单',
        '结合现场施工条件完成复杂节点深化建模与方案比选',
        '核查设备管线安装净距并优化综合排布与检修空间',
        '依据设计变更要求更新建筑模型并复核关联施工图纸',
        '组织多专业碰撞问题复核并验证修改后的模型一致性'
      ],
      素养: [
        '在多专业设计冲突协调中保持客观沟通与合作意识',
        '严格区分设计建议与审批结论并尊重项目决策权限',
        '对影响施工安全的重大模型冲突保持主动预警意识',
        '坚持问题整改结果复核并落实跨专业协同闭环责任',
        '在复杂深化设计任务中保持耐心细致与持续改进意识',
        '重视现场施工人员反馈并主动核实模型与实际条件差异'
      ]
    },
    {
      taskNames: ['工程量提取与变更协同', '智能建造现场协同实施'],
      知识: [
        '建筑工程计量规则与模型构件工程量提取口径理解',
        '建筑工程造价信息分类与模型清单映射关系理解',
        '工程设计变更对构件数量材料消耗与费用影响的理解',
        '施工进度计划与建筑模型构件关联的组织规则理解',
        '工程现场数据采集与模型状态更新的业务流程理解',
        '建筑项目工程量差异核查与多方协同确认机制理解'
      ],
      技能: [
        '依据项目计量规则提取建筑模型工程量并校核统计口径',
        '建立建筑构件与工程量清单映射并识别漏项重复项',
        '对比设计变更前后模型工程量并编制差异分析报告',
        '关联施工进度计划与模型构件并更新现场实施状态',
        '采集施工现场质量进度信息并核查模型数据一致性',
        '组织工程量核对与变更协同确认并保留完整追踪记录'
      ],
      素养: [
        '坚持工程量统计口径透明并如实说明数据缺失与偏差',
        '遵守工程造价资料保密要求并合理控制数据共享范围',
        '在工程量差异协调中坚持依据充分与客观审慎原则',
        '主动识别设计变更对现场实施的影响并及时协同沟通',
        '重视工程资源节约与绿色建造要求并提出改进建议',
        '对项目协同确认结果负责并保持完整准确的过程记录'
      ]
    },
    {
      taskNames: ['模型交付与过程复核', '质量安全检查与效果评价'],
      知识: [
        '建筑信息模型成果交付范围与验收检查程序理解',
        '建筑模型几何信息与非几何属性完整性评价方法理解',
        '建筑项目数字化成果版本管理与变更追踪规则理解',
        '工程质量安全检查记录与建筑模型关联方式理解',
        '建筑模型数据导出与跨平台交换质量检查要求理解',
        '建筑数字化成果数据安全分级与访问控制机制理解'
      ],
      技能: [
        '按项目成果验收清单检查模型几何信息与属性完整性',
        '执行建筑模型跨平台导出检查并修复数据丢失与错位',
        '编制模型成果交付目录并核对版本签审与附件完整性',
        '关联质量安全检查问题与建筑模型位置并追踪整改结果',
        '建立模型成果版本基线并核验变更内容与审批记录',
        '组织建筑模型交付复核并编制质量评价与风险说明'
      ],
      素养: [
        '坚持未经复核的模型成果不得替代正式验收结论',
        '认真履行建筑数字化成果交付前的质量检查责任',
        '对发现的数据安全风险保持警觉并及时采取保护措施',
        '如实记录模型质量缺陷并主动推动责任方完成整改',
        '遵守项目成果签审流程并保持版本记录清晰可追溯',
        '在紧迫交付任务中保持质量底线与审慎专业判断'
      ]
    },
    {
      taskNames: ['设计协同问题闭环', '交付文档编制与复盘优化'],
      知识: [
        '建筑项目多专业设计协同责任分工与审批流程理解',
        '建筑模型问题反馈分类与处理优先级判定方法理解',
        '工程项目数字化协同平台问题追踪与留痕机制理解',
        '建筑模型成果归档目录与项目知识沉淀要求理解',
        '建筑数字化项目协同绩效评价与持续改进方法理解',
        '面向建设施工运维不同角色的模型成果表达要求理解'
      ],
      技能: [
        '编制多专业设计协同问题台账并跟踪责任人与处理时限',
        '组织模型问题协调会议并记录方案决策与复核结论',
        '使用数字化协同平台追踪问题从提交到关闭的全过程',
        '汇总建筑模型变更记录与交付资料并完成规范归档',
        '面向建设施工运维人员编制模型成果说明与操作指引',
        '复盘多专业协同问题处理过程并形成可执行改进措施'
      ],
      素养: [
        '主动承担跨专业问题沟通责任并关注协同处理进展',
        '尊重不同项目参与方的专业意见并促进共同解决问题',
        '保持项目沟通记录客观准确并明确区分事实与建议',
        '重视建筑项目知识沉淀并主动分享可复用的工作经验',
        '以项目整体交付目标为导向协调个人任务与团队安排',
        '持续复盘协同沟通效率并改进问题反馈与成果表达方式'
      ]
    }
  ]

  const extendBimAbilities = input => {
    if (input.jobName !== 'BIM建模工程师') return input
    const sections = bimAbilityCatalog.filter(section => input.tasks.some(task => section.taskNames.includes(task.name)))
    const nodeLookup = new Map(input.nodes.map(node => [node.name, node]))
    const meta = { 知识: { tone: 'knowledge', marker: '知' }, 技能: { tone: 'skill', marker: '技' }, 素养: { tone: 'quality', marker: '素' } }
    sections.forEach(section => Object.keys(meta).forEach(category => section[category].forEach(name => {
      if (!nodeLookup.has(name)) nodeLookup.set(name, { name, category, ...meta[category], generated: true, basis: '岗位画像测算', sourceStatus: '待核验' })
    })))
    const tasks = input.tasks.map(task => ({ ...task, abilities: Array.from(new Set([
      ...task.abilities,
      ...sections.filter(section => section.taskNames.includes(task.name)).flatMap(section => Object.keys(meta).flatMap(category => section[category]))
    ])) }))
    return { ...input, tasks, nodes: Array.from(nodeLookup.values()) }
  }

  const abilityLayoutHash = name => Array.from(name).reduce((value, character) => Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261)

  // Relations come only from the stored task references. A shared ability is one
  // node with several incoming edges; choosing a task never changes its position.
  const buildGraph = ({ jobName, tasks = [], nodes = [], activeTaskIndex = -1, activeAbilityName = '', viewportHeight = 0, compactMode = false }) => {
    const nodeLookup = new Map(nodes.map(node => [node.name, node]))
    tasks.forEach(task => task.abilities.forEach(name => {
      if (!nodeLookup.has(name)) nodeLookup.set(name, { name, category: '待分类' })
    }))
    const selectedAbilityName = nodeLookup.has(activeAbilityName) ? activeAbilityName : ''
    const selectedIndex = !selectedAbilityName && tasks[activeTaskIndex] ? activeTaskIndex : -1
    const hasSelection = Boolean(selectedAbilityName) || selectedIndex >= 0
    const abilities = Array.from(nodeLookup.values()).map((node, index) => {
      const taskIndexes = tasks.flatMap((task, taskIndex) => task.abilities.includes(node.name) ? [taskIndex] : [])
      const selected = selectedAbilityName === node.name
      const active = selectedAbilityName ? selected : selectedIndex >= 0 && taskIndexes.includes(selectedIndex)
      return { ...node, abilityType: abilityTypes[node.category] || 'unclassified', index, taskIndexes, selected, active, dimmed: hasSelection && !active }
    })
    // Stable column-major grid: selection and task membership never move nodes.
    const gridHeight = Math.max(600, Number(viewportHeight) || 670, 120 + tasks.length * 112)
    const rowsPerColumn = viewportHeight > 0 ? Math.max(2, Math.floor((gridHeight - 136) / 38) + 1) : 14
    const rowGap = viewportHeight > 0 ? (gridHeight - 136) / (rowsPerColumn - 1) : 38
    const columnGap = compactMode ? 48 : 320
    const abilityStartX = 600
    const columnCount = Math.max(1, Math.ceil(abilities.length / rowsPerColumn))
    abilities.slice().sort((a, b) => abilityLayoutHash(a.name) - abilityLayoutHash(b.name) || a.name.localeCompare(b.name)).forEach((node, position) => {
      node.x = abilityStartX + Math.floor(position / rowsPerColumn) * columnGap
      node.y = Math.round(104 + (position % rowsPerColumn) * rowGap)
    })
    const expandedWidth = abilityStartX + (columnCount - 1) * 320 + 280
    const width = compactMode ? Math.max(720, abilityStartX + (columnCount - 1) * columnGap + 64) : expandedWidth
    const height = Math.max(gridHeight, 120 + tasks.length * 112)
    const taskNodes = tasks.map((task, index) => {
      const selected = selectedIndex === index
      const active = selectedAbilityName ? task.abilities.includes(selectedAbilityName) : selected
      return { ...task, index, x: 372, y: tasks.length <= 1 ? 150 : 132 + index * 104, selected, active, dimmed: hasSelection && !active }
    })
    const job = { name: jobName, x: 112, y: taskNodes[0]?.y ?? 150 }
    const curve = (fromX, fromY, toX, toY) => {
      const midX = fromX + (toX - fromX) * 0.45
      return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`
    }
    const links = taskNodes.map(task => ({ key: `job-${task.index}`, kind: 'job', taskIndex: task.index, d: curve(job.x + 80, job.y, task.x - 100, task.y), active: task.active, dimmed: task.dimmed }))
    taskNodes.forEach(task => {
      Array.from(new Set(task.abilities)).forEach(name => {
        const node = abilities.find(item => item.name === name)
        const active = selectedAbilityName ? selectedAbilityName === name : task.active
        links.push({ key: `task-${task.index}-ability-${node.index}`, kind: 'ability', abilityType: node.abilityType, taskIndex: task.index, abilityName: name, d: curve(task.x + 100, task.y, node.x, node.y), active, dimmed: hasSelection && !active })
      })
    })
    // Draw selected relations last so their strokes remain visible at crossings.
    links.sort((a, b) => Number(a.active) - Number(b.active))
    return { width, expandedWidth, height, compactMode, job, tasks: taskNodes, abilities, links, activeTaskIndex: selectedIndex, activeAbilityName: selectedAbilityName }
  }

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
  const nodeClass = node => `${node.active ? ' active' : ''}${node.dimmed ? ' dimmed' : ''}`
  const formatAbilityTooltip = node => `${node.name}\n能力类型：${node.category}\n关联任务：${node.taskIndexes.length} 项`
  const renderGraphLinks = graph => graph.links.map(link => `<path class="competency-layer-link kind-${link.kind}${nodeClass(link)}${link.abilityType ? ` ability-type-${link.abilityType}` : ''}" data-competency-link-key="${link.key}" data-competency-link-task="${link.taskIndex}" d="${link.d}" style="d:path('${link.d}')"/>`).join('')
  const updateGraphLinks = (svg, graph) => {
    const paths = new Map(Array.from(svg.querySelectorAll('[data-competency-link-key]')).map(element => [element.dataset.competencyLinkKey, element]))
    if (paths.size !== graph.links.length || graph.links.some(link => !paths.has(link.key))) {
      svg.innerHTML = renderGraphLinks(graph)
      return
    }
    graph.links.forEach(link => {
      const element = paths.get(link.key)
      element.classList.toggle('active', link.active)
      element.classList.toggle('dimmed', link.dimmed)
      element.style.d = `path('${link.d}')`
      element.setAttribute('d', link.d)
      if (link.active) svg.appendChild(element)
    })
  }
  // Keep the same DOM nodes so CSS can interpolate both endpoints and curves.
  const applyGraphLayout = (container, graph) => {
    const board = container.querySelector('.competency-layer-graph')
    if (!board) return
    board.style.width = `${graph.width}px`
    const nodes = new Map(graph.abilities.map(node => [node.name, node]))
    container.querySelectorAll('[data-competency-ability]').forEach(element => {
      const node = nodes.get(element.dataset.competencyAbility)
      if (!node) return
      element.style.left = `${node.x}px`
      element.classList.toggle('tooltip-align-end', node.x > graph.width - 480)
    })
    const svg = container.querySelector('.competency-layer-lines')
    if (svg) updateGraphLinks(svg, graph)
  }
  const renderGraph = graph => `<div class="competency-layer-graph" style="width:${graph.width}px;height:${graph.height}px" aria-label="岗位、典型工作任务与能力项关系图">
    <div class="competency-layer-head layer-job"><span>岗位</span></div><div class="competency-layer-head layer-task"><span>典型工作任务</span></div><div class="competency-layer-head layer-ability"><span>岗位能力项</span></div>
    <svg class="competency-layer-lines" viewBox="0 0 ${graph.expandedWidth} ${graph.height}" style="width:${graph.expandedWidth}px" aria-hidden="true">${renderGraphLinks(graph)}</svg>
    <div class="competency-job-node" style="left:${graph.job.x}px;top:${graph.job.y}px"><strong>${escapeHtml(graph.job.name)}</strong></div>
    ${graph.tasks.map(task => `<button type="button" class="competency-task-node${nodeClass(task)}" style="left:${task.x}px;top:${task.y}px" data-competency-task-index="${task.index}" aria-pressed="${task.selected}"><strong>${escapeHtml(task.name)}</strong><em>${new Set(task.abilities).size} 项关联能力</em></button>`).join('')}
    ${graph.abilities.map(node => `<button type="button" class="competency-ability-point${nodeClass(node)} ability-type-${node.abilityType}${node.x > graph.width - 480 ? ' tooltip-align-end' : ''}${node.y > graph.height / 2 ? ' tooltip-above' : ''}" style="left:${node.x}px;top:${node.y}px" data-competency-ability="${escapeHtml(node.name)}" aria-pressed="${node.selected}" data-tooltip="${escapeHtml(formatAbilityTooltip(node))}" aria-label="高亮能力项关联关系：${escapeHtml(node.name)}，${escapeHtml(node.category)}，关联 ${node.taskIndexes.length} 项任务"><i></i><span>${escapeHtml(node.name)}</span></button>`).join('')}
    ${graph.abilities.length ? '' : '<p class="competency-layer-empty">暂无能力项</p>'}
  </div>`

  const buildAbilityDetail = ({ abilityName, jobName, nodes, tasks }) => {
    const node = nodes.find((item) => item.name === abilityName) || {
      name: abilityName,
      category: '待分类',
      tone: 'knowledge',
      marker: '?'
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

  const normalizeSearchName = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
  const searchAbilities = (abilities, query) => {
    const normalized = normalizeSearchName(query)
    if (!normalized) return []
    const tokens = normalized.split(' ')
    const rank = node => {
      const name = normalizeSearchName(node.name)
      return name === normalized ? 0 : name.startsWith(normalized) ? 1 : 2
    }
    return abilities.filter(node => tokens.every(token => normalizeSearchName(node.name).includes(token))).sort((a, b) => rank(a) - rank(b))
  }
  const renderSearch = () => `<form class="competency-search-form" role="search" aria-label="能力项搜索" data-competency-search-form>
    <label class="competency-search-label"><input type="search" role="combobox" aria-label="搜索能力项名称" placeholder="搜索能力项" autocomplete="off" aria-autocomplete="list" aria-expanded="false" aria-controls="competency-search-results" data-competency-search-input></label>
    <span class="competency-search-status" role="status" aria-live="polite" data-competency-search-status></span>
    <div id="competency-search-results" class="competency-search-results" role="listbox" aria-label="能力项搜索结果" data-competency-search-results hidden></div>
  </form>`
  const scrollToAbility = (container, name) => {
    const node = Array.from(container.querySelectorAll('[data-competency-ability]')).find(element => element.dataset.competencyAbility === name)
    if (!node) return false
    node.scrollIntoView({ behavior: root.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest', inline: 'center' })
    return true
  }
  const bindSearch = (container, { getAbilities, onSelect, onClear }) => {
    const form = container.querySelector('[data-competency-search-form]')
    const input = container.querySelector('[data-competency-search-input]')
    const popup = container.querySelector('[data-competency-search-results]')
    const status = container.querySelector('[data-competency-search-status]')
    if (!form || !input || !popup || !status) return () => {}
    let matches = [], selectedName = ''
    const close = () => { popup.hidden = true; input.setAttribute('aria-expanded', 'false') }
    const update = () => {
      matches = searchAbilities(getAbilities(), input.value)
      popup.innerHTML = matches.map((node, index) => `<button type="button" role="option" aria-selected="${node.name === selectedName}" tabindex="-1" class="competency-search-option ability-type-${escapeHtml(node.abilityType || 'unclassified')}" data-competency-search-result="${index}"><i></i><span>${escapeHtml(node.name)}</span><em>${escapeHtml(node.category)}</em></button>`).join('')
      popup.hidden = matches.length === 0
      input.setAttribute('aria-expanded', String(!popup.hidden))
      status.textContent = normalizeSearchName(input.value) ? (matches.length ? `找到 ${matches.length} 项能力` : '未找到匹配的能力项') : ''
    }
    const choose = index => {
      const node = matches[index]
      if (!node) return
      selectedName = node.name
      input.value = node.name
      onSelect(node.name)
      close()
      status.textContent = '已定位所选能力项'
      input.focus({ preventScroll: true })
    }
    const onInput = () => {
      selectedName = ''
      update()
      if (!normalizeSearchName(input.value)) onClear()
    }
    const onFocus = () => { if (!selectedName) update() }
    const onSubmit = event => { event.preventDefault(); update(); choose(0) }
    const onClick = event => {
      const option = event.target.closest('[data-competency-search-result]')
      if (option && container.contains(option)) choose(Number(option.dataset.competencySearchResult))
    }
    const onKeyDown = event => {
      if (event.key === 'Escape') { input.focus({ preventScroll: true }); close(); event.preventDefault(); return }
      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return
      const current = event.target.closest('[data-competency-search-result]')
      if (event.key === 'Enter') {
        event.preventDefault()
        if (current) choose(Number(current.dataset.competencySearchResult))
        else { update(); choose(0) }
        return
      }
      event.preventDefault()
      if (popup.hidden) update()
      const buttons = Array.from(popup.querySelectorAll('[data-competency-search-result]'))
      if (!buttons.length) return
      const index = buttons.indexOf(current)
      const next = index < 0 ? (event.key === 'ArrowDown' ? 0 : buttons.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
      buttons[next].focus({ preventScroll: true })
      buttons[next].scrollIntoView({ block: 'nearest' })
    }
    const onOutside = event => { if (!container.contains(event.target)) close() }
    input.addEventListener('input', onInput)
    input.addEventListener('focus', onFocus)
    form.addEventListener('submit', onSubmit)
    form.addEventListener('click', onClick)
    form.addEventListener('keydown', onKeyDown)
    container.ownerDocument.addEventListener('click', onOutside)
    return () => {
      input.removeEventListener('input', onInput)
      input.removeEventListener('focus', onFocus)
      form.removeEventListener('submit', onSubmit)
      form.removeEventListener('click', onClick)
      form.removeEventListener('keydown', onKeyDown)
      container.ownerDocument.removeEventListener('click', onOutside)
    }
  }

  root.PortraitCompetencyMapState = {
    searchAbilities,
    renderSearch,
    bindSearch,
    scrollToAbility,
    extendBimAbilities,
    changeZoom,
    nextTheme,
    buildTaskAbilityLanes,
    getTaskSlideDirection,
    buildGraph,
    renderGraph,
    renderGraphLinks,
    applyGraphLayout,
    formatAbilityTooltip,
    updateGraphLinks,
    buildAbilityDetail
  }
})(typeof window === 'undefined' ? globalThis : window)
