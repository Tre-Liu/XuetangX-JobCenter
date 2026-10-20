;(function registerPortraitCompetencyMapExport(root) {
  const escapeXml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character])
  // Full text is wrapped into the column instead of exporting the UI ellipsis.
  const wrapText = (value, width, fontSize) => {
    const lines = []
    let line = '', used = 0
    for (const character of String(value ?? '')) {
      const advance = fontSize * (character.codePointAt(0) > 255 ? 1 : 0.6)
      if (line && used + advance > width) { lines.push(line); line = ''; used = 0 }
      line += character
      used += advance
    }
    lines.push(line)
    return lines
  }
  const text = (lines, x, y, size, color, weight = 400, lineHeight = size * 1.4) => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${lines.map((line, index) => `<tspan x="${x}" dy="${index ? lineHeight : 0}">${escapeXml(line)}</tspan>`).join('')}</text>`

  const buildSvg = ({ graph, theme = 'light' }) => {
    const colors = theme === 'dark'
      ? { surface: '#181d29', text: '#f1f4fb', muted: '#9aa8bf', border: '#343d52', knowledge: '#8ba7ff', skill: '#54d2c8', quality: '#bf9aef' }
      : { surface: '#ffffff', text: '#1e2d48', muted: '#71809a', border: '#dbe3f1', knowledge: '#5277ed', skill: '#149a98', quality: '#9064d9' }
    const abilityLines = graph.abilities.map(node => wrapText(node.name, 250, 11))
    const taskLines = graph.tasks.map(task => wrapText(task.name, 168, 13))
    const jobLines = wrapText(graph.job.name, 124, 17)
    // Increase vertical spacing only when full labels would overlap their neighbours.
    const rowPositions = [...new Set(graph.abilities.map(node => node.y))].sort((a, b) => a - b)
    const rowGap = rowPositions.length > 1 ? Math.min(...rowPositions.slice(1).map((y, index) => y - rowPositions[index])) : 38
    const taskGap = graph.tasks.length > 1 ? Math.min(...graph.tasks.slice(1).map((task, index) => task.y - graph.tasks[index].y)) : 112
    const stretchY = Math.max(1, (Math.max(1, ...abilityLines.map(lines => lines.length)) * 15 + 10) / rowGap, (Math.max(1, ...taskLines.map(lines => lines.length)) * 18 + 40) / taskGap)
    const titleLines = wrapText(`${graph.job.name}-岗位能力图谱`, graph.width - 64, 18)
    const headerHeight = 76 + titleLines.length * 26
    const jobHeight = Math.max(98, jobLines.length * 24 + 36)
    const jobY = graph.job.y * stretchY
    const topInset = Math.max(0, 64 - (jobY - jobHeight / 2))
    const graphHeight = Math.ceil(Math.max(graph.height * stretchY, jobY + jobHeight / 2 + 24) + topInset)
    const width = Math.ceil(graph.width + 32)
    const height = headerHeight + graphHeight + 16
    const colorFor = type => colors[type] || colors.muted
    const links = graph.links.map((link, index) => `<path data-export-link="${index}" d="${escapeXml(link.d)}" fill="none" stroke="${link.kind === 'job' ? colors.skill : colorFor(link.abilityType)}" stroke-width="${link.active ? 1.6 : 1}" opacity="${link.dimmed ? 0.018 : link.active ? 0.58 : link.kind === 'job' ? 0.12 : 0.07}"/>`).join('')
    const job = `<rect x="${graph.job.x - 80}" y="${jobY - jobHeight / 2}" width="160" height="${jobHeight}" rx="16" fill="${colors.surface}" stroke="${colors.knowledge}"/>${text(jobLines, graph.job.x - 62, jobY - (jobLines.length - 1) * 12 + 6, 17, colors.knowledge, 700, 24)}`
    const tasks = graph.tasks.map((task, index) => {
      const y = task.y * stretchY, cardHeight = Math.max(90, taskLines[index].length * 18 + 40), top = y - cardHeight / 2
      return `<g data-export-task="${task.index}" opacity="${task.dimmed ? 0.5 : 1}"><title>${escapeXml(task.name)}</title><rect x="${task.x - 100}" y="${top}" width="200" height="${cardHeight}" rx="12" fill="${colors.surface}" stroke="${colors.skill}" stroke-opacity="${task.active ? 1 : 0.35}"/><rect x="${task.x - 100}" y="${top}" width="200" height="${cardHeight}" rx="12" fill="${colors.skill}" fill-opacity="${task.active ? 0.14 : 0.06}"/>${text(taskLines[index], task.x - 84, top + (cardHeight - taskLines[index].length * 18 - 20) / 2 + 13, 13, colors.skill, 700, 18)}${text([`${new Set(task.abilities).size} 项关联能力`], task.x - 84, top + (cardHeight + taskLines[index].length * 18 + 20) / 2 - 5, 10, colors.skill)}</g>`
    }).join('')
    const abilities = graph.abilities.map((node, index) => {
      const y = node.y * stretchY, color = colorFor(node.abilityType), lines = abilityLines[index]
      if (graph.compactMode) return `<g data-export-ability="${node.index}" opacity="${node.dimmed ? 0.25 : 1}"><title>${escapeXml(node.name)}</title>${node.active ? `<circle cx="${node.x}" cy="${y}" r="9" fill="${color}" fill-opacity="0.18"/>` : ''}<circle cx="${node.x}" cy="${y}" r="5" fill="${color}"/></g>`
      return `<g data-export-ability="${node.index}" opacity="${node.dimmed ? 0.25 : 1}"><title>${escapeXml(node.name)}</title>${node.active ? `<rect x="${node.x - 8}" y="${y - lines.length * 15 / 2 - 4}" width="274" height="${lines.length * 15 + 8}" rx="4" fill="${color}" fill-opacity="0.1"/>` : ''}<circle cx="${node.x}" cy="${y}" r="5" fill="${color}"/>${text(lines, node.x + 12, y - (lines.length - 1) * 7.5 + 4, 11, color, node.active ? 700 : 400, 15)}</g>`
    }).join('')
    const legend = ['知识', '技能', '素养'].map((label, index) => `<circle cx="${32 + index * 90}" cy="${headerHeight - 24}" r="5" fill="${[colors.knowledge, colors.skill, colors.quality][index]}"/>${text([label], 46 + index * 90, headerHeight - 20, 12, colors.text)}`).join('')
    const heads = [[32, '岗位', colors.knowledge], [272, '典型工作任务', colors.skill], [594, '岗位能力项', colors.quality]].map(([x, label, color]) => text([label], x, 36, 14, color, 700)).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(graph.job.name)}岗位能力图谱"><rect width="100%" height="100%" fill="${colors.surface}"/><g font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif">${text(titleLines, 28, 36, 18, colors.text, 700, 26)}${legend}<path d="M 0 ${headerHeight} H ${width}" stroke="${colors.border}"/><g transform="translate(16 ${headerHeight})">${heads}<g data-export-content="true" transform="translate(0 ${topInset})"><g transform="scale(1 ${stretchY})">${links}</g>${job}${tasks}${abilities}${graph.abilities.length ? '' : text(['暂无能力项'], 594, 110, 13, colors.muted)}</g></g></g></svg>`
    return { svg, width, height }
  }

  const exportPng = async options => {
    await root.document.fonts?.ready
    const { svg, width, height } = buildSvg(options)
    const image = new root.Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('图谱图片生成失败'))
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    })
    // Keep every node when adapting very large maps to browser canvas limits.
    const scale = Math.min(2, 16384 / width, 16384 / height, Math.sqrt(32000000 / (width * height)))
    const canvas = root.document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(width * scale))
    canvas.height = Math.max(1, Math.floor(height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('无法生成图谱图片')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('图谱图片生成失败')
    const url = root.URL.createObjectURL(blob)
    const link = root.document.createElement('a')
    const filename = `${options.graph.job.name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')}-岗位能力图谱.png`
    link.href = url
    link.download = filename
    root.document.body.appendChild(link)
    try { link.click() } finally {
      link.remove()
      root.setTimeout(() => root.URL.revokeObjectURL(url), 60000)
    }
    return { filename, width: canvas.width, height: canvas.height }
  }

  root.PortraitCompetencyMapExport = { buildSvg, exportPng }
})(typeof window === 'undefined' ? globalThis : window)
