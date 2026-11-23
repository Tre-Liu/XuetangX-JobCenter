import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync(new URL('../src/knowledge-domain/scene.js', import.meta.url), 'utf8')
const atlasSource = fs.readFileSync(new URL('../src/knowledge-domain/atlas.js', import.meta.url), 'utf8')
const atlasPaintSource = fs.readFileSync(new URL('../src/knowledge-domain/atlas-paint.js', import.meta.url), 'utf8')
const courses = Array.from({ length: 65 }, (_, ci) => ({
  name: '课程' + ci, isCore: ci % 3 === 1,
  topics: Array.from({ length: 6 }, (_, ti) => ({
    name: '单元' + ti, points: Array.from({ length: 5 }, (_, pi) => '知识点' + pi),
  })),
}))

function harness(data = courses, relations = [], reducedMotion = true, options = {}) {
  const callbacks = new Map()
  const dots = [], markers = [], mapMarkers = []
  let frameId = 0, observer
  const context = new Proxy({
    measureText: s => ({ width: s.length * 12 }),
    createRadialGradient: (_x, _y, _r, x, y) => ({ x, y, addColorStop() {} }),
    clearRect() { dots.length = 0; markers.length = 0 },
    arc(x, y) { dots.push({ x, y, opacity: this.globalAlpha, color: this.fillStyle }) },
    fill(rule) {
      if (rule === 'evenodd') markers.push({ x: this.fillStyle.x, y: this.fillStyle.y, opacity: this.globalAlpha })
    },
  }, { get: (object, key) => key in object ? object[key] : () => {} })
  class Element extends EventTarget {
    constructor(type) {
      super()
      Object.assign(this, { type, style: { setProperty(name, value) { this[name] = value } }, dataset: {}, children: [], attributes: {}, hidden: false })
    }
    appendChild(child) { this.children.push(child); child.parent = this; return child }
    replaceWith(child) { this.parent.children[this.parent.children.indexOf(this)] = child; child.parent = this.parent }
    remove() { this.parent.children = this.parent.children.filter(c => c !== this) }
    setAttribute(k, v) { this.attributes[k] = v }
    getAttribute(k) { return this.attributes[k] }
    toggleAttribute(k, show) { if (show) this.attributes[k] = ''; else delete this.attributes[k] }
    closest() { return null }
    getContext(kind) {
      if (kind !== '2d') return null
      if (this.className === 'kdg-atlas-map') {
        return new Proxy({ arc(x, y) { mapMarkers.push({ x, y }) } }, {
          get: (object, key) => key in object ? object[key] : () => {},
        })
      }
      return context
    }
    getBoundingClientRect() { return { left: 0, top: 0, width: host.clientWidth, height: host.clientHeight } }
    focus() {}
  }
  const doc = { createElement: type => Object.assign(new Element(type), { ownerDocument: doc }) }
  const host = Object.assign(doc.createElement('div'), { clientWidth: 950, clientHeight: 515 })
  const win = Object.assign(new EventTarget(), {
    getComputedStyle: () => ({ position: 'static' }), devicePixelRatio: 2,
    requestAnimationFrame(fn) { callbacks.set(++frameId, fn); return frameId },
    cancelAnimationFrame(id) { callbacks.delete(id) },
    matchMedia: () => ({ matches: reducedMotion }), performance: { now: () => 0 },
    ResizeObserver: class {
      constructor(resize) { observer = this; this.resize = resize }
      observe() {}
      disconnect() { this.disconnected = true }
    },
  })
  vm.runInNewContext(source, { window: win })
  const selected = [], resets = []
  const terrainFrames = [], mapThemes = [], atlasSelections = []
  let terrainActions, atlasGraph
  if (options.atlas) {
    vm.runInNewContext(atlasSource, { globalThis: win })
    options = { ...options, atlas: win.KnowledgeDomainAtlas.build('专业', data, { text:'目标1：掌握课程0。' }) }
    win.KnowledgeDomainAtlasPaint = {
      miniature(canvas, regions, darkMode) { mapThemes.push(darkMode) },
      mount(_stage, graph, _atlas, _satellites, actions) {
        atlasGraph = graph
        terrainActions = actions
        return { layer: new Element('div'), resize() {}, boxes: () => [], regionAt: (x, y) => x === 300 && y === 240 ? 0 : -1,
        draw(...args) { terrainFrames.push(args) } } },
    }
    if (options.paintAtlas) {
      class Path2D { moveTo() {} lineTo() {} closePath() {} }
      vm.runInNewContext(atlasPaintSource, { globalThis: win, Path2D })
    }
  }
  const api = win.KnowledgeDomainScene.mount(host, { ...options, courses:data, relations, onSelect: (...v) => selected.push(v),
    onAtlasSelect: (...v) => atlasSelections.push(v), onReset: () => resets.push(true) })
  const stage = host.children[0], [canvas, overlay] = stage.children
  function flush(time = 1000) {
    for (const [id, fn] of [...callbacks]) { callbacks.delete(id); fn(time) }
  }
  function visible() { return overlay.children.filter(c => !c.hidden) }
  return { win, host, api, canvas, stage, selected, resets, callbacks, observer, visible, flush, dots, markers, mapMarkers, atlasGraph, terrainFrames, mapThemes, terrainActions, atlasSelections }
}
function pointer(kind, x, y, button = 0) {
  return Object.assign(new Event(kind, { cancelable: true }), { clientX: x, clientY: y, pointerId: 1,
    pointerType: 'mouse', button, buttons: kind === 'pointerup' ? 0 : 1 << button })
}
function clickLabel(h, label) {
  const [, x, y] = /translate\((-?\d+)px,(-?\d+)px\)/.exec(label.style.transform)
  const center = [+x + parseInt(label.style.width) / 2, +y + parseInt(label.style.height) / 2]
  h.canvas.dispatchEvent(pointer('pointerdown', ...center))
  h.canvas.dispatchEvent(pointer('pointerup', ...center))
}

test('cross-course mode draws and exposes only the endpoints of valid cross-course links', () => {
  const data = [
    { name: '课程甲', topics: [{ name: '单元', points: ['单课知识点甲', '关联知识点甲'] }] },
    { name: '课程乙', topics: [{ name: '单元', sections: [{ name: '主题', points: ['关联知识点乙', '单课知识点乙'] }] }] },
    { name: '课程丙', topics: [{ name: '单元', points: ['单课知识点丙'] }] },
  ]
  const h = harness(data, [
    { from: [0, 0, null, 1], to: [1, 0, 0, 0] },
    { from: [0, 0, null, 0], to: [0, 0, null, 1] },
    { from: [2, 0, null, 0], to: [0, 9, null, 0] },
  ])
  h.flush()
  assert.ok(h.dots.length > 2)
  h.api.setCrossCourseOnly(true)
  h.flush()
  assert.equal(h.dots.length, 2)
  const labels = h.visible()
  assert.deepEqual(labels.map(label => label.textContent).sort(), ['关联知识点乙', '关联知识点甲'])
  clickLabel(h, labels.find(label => label.textContent === '关联知识点乙'))
  assert.deepEqual(h.selected.at(-1), [1, 0, 0, 0])
  h.api.setCrossCourseOnly(false)
  h.api.reset()
  h.flush()
  assert.ok(h.dots.length > 2)
  assert.ok(h.visible().some(label => label.dataset.level === 'course'))
  h.api.destroy()
})

test('跨领域筛选只显示有多个有效领域归属的知识点', () => {
  const data = [
    { name: '课程甲', domain: '领域甲', topics: [{ name: '单元', points: ['共享知识点', '单领域点'],
      pointDomains: [['领域甲', '领域乙']] }] },
    { name: '课程乙', domain: '领域乙', topics: [{ name: '单元', points: ['跨课程知识点'] }] },
  ]
  const h = harness(data, [{ from: [0, 0, null, 1], to: [1, 0, null, 0] }], true, { atlas: true })
  const visibleNames = () => Array.from(h.atlasGraph.nodes).filter(n => n.visible).map(n => n.name)
  h.api.setPointFilter('cross-domain')
  h.flush()
  assert.deepEqual(visibleNames(), ['共享知识点'])
  h.api.focus(0, 0, null, 1)
  assert.equal(h.stage.dataset.selection, undefined)
  h.api.focus(0, 0, null, 0)
  h.flush()
  const [label] = h.visible()
  assert.equal(label.textContent, '共享知识点')
  clickLabel(h, label)
  assert.deepEqual(h.selected.at(-1), [0, 0, null, 0])

  h.api.setCrossCourseOnly(true)
  h.api.reset()
  h.flush()
  assert.deepEqual(visibleNames(), ['单领域点', '跨课程知识点'])
  h.api.destroy()
})

test('球面展开图省略跨领域圆环和知识点点击目标', () => {
  const data = [
    { name: '课程甲', domain: '领域甲', topics: [{ name: '单元', points: ['共享知识点'],
      pointDomains: [['领域甲', '领域乙']] }] },
    { name: '课程乙', domain: '领域乙', topics: [] },
  ]
  const h = harness(data, [], true, { atlas: true, paintAtlas: true })
  h.flush()
  const locator = h.stage.children.find(el => el.className === 'knowledge-scene-locator')
  const map = locator.children[1].children.find(el => el.className === 'kdg-atlas-map')
  assert.equal(h.mapMarkers.length, 0)
  const atlas = h.win.KnowledgeDomainAtlas
  const region = atlas.geometry(atlas.build('专业', data, null), 65)[0]
  const { u, v } = atlas.mapPoint(region.world.get('0/0//0'))
  map.dispatchEvent(pointer('click', u * h.host.clientWidth, v * h.host.clientHeight))
  assert.deepEqual(h.selected, [])
  h.api.focus(0, 0, null, 0)
  h.flush()
  assert.equal(locator.children[1].children[0].hidden, true)
  h.api.destroy()
})

test('dense course catalogue shows a restrained set of course labels and stays idle with reduced motion', () => {
  const h = harness()
  h.flush()
  assert.equal(h.stage.dataset.renderer, 'canvas')
  assert.equal(h.canvas.width, h.host.clientWidth * 2)
  const labels = h.visible()
  assert.ok(labels.length >= 8 && labels.length <= 12)
  assert.ok(labels.every(l => l.dataset.level === 'course'))
  assert.ok(labels.some(l => courses[Number(l.textContent.slice(2))].isCore))
  assert.equal(h.callbacks.size, 0)
  clickLabel(h, labels[0])
  assert.deepEqual(h.selected[0], [Number(labels[0].textContent.slice(2)), null, null, null])
  h.api.destroy()
})

test('overview orbits counterclockwise every three minutes, pauses on pointerdown and resumes after a blank click', () => {
  const h = harness(courses.slice(0, 10), [], false)
  h.flush()
  const node = h.visible()
    .map(label => label._knowledgeNode)
    .find(node => node.y <= 0 && node.sx > h.host.clientWidth / 2)
  assert.ok(node)
  const start = [node.sx, node.sy]
  h.flush(1500)
  assert.ok(node.sy < start[1], 'the right side rises as the globe turns')
  h.flush(91000)
  assert.notDeepEqual([node.sx, node.sy], start)
  h.flush(181000)
  assert.ok(Math.hypot(node.sx - start[0], node.sy - start[1]) < 1e-8)

  h.canvas.dispatchEvent(pointer('pointerdown', 1, 1))
  h.flush(182000)
  assert.equal(h.callbacks.size, 0)
  assert.ok(Math.hypot(node.sx - start[0], node.sy - start[1]) < 1e-8)
  h.canvas.dispatchEvent(pointer('pointerup', 1, 1))
  h.flush(183000)
  assert.equal(h.resets.length, 1)
  assert.ok(Math.hypot(node.sx - start[0], node.sy - start[1]) < 1e-8)
  assert.equal(h.selected.length, 0)

  h.flush(184000)
  assert.ok(node.sy < start[1])
  h.api.focus(node.ci)
  h.flush(186000)
  assert.equal(h.callbacks.size, 0)
  h.api.reset()
  h.flush(187000)
  assert.equal(h.callbacks.size, 1)
  h.api.destroy()
  assert.equal(h.callbacks.size, 0)
})

test('clicking blank canvas restores the default framing from node, atlas and manual camera views', () => {
  const h = harness(courses.slice(0, 10), [], true, { atlas: true })
  h.flush()
  const positions = () => h.dots.map(({ x, y }) => [x, y])
  const overview = positions()
  const views = [
    () => h.api.focus(2),
    () => h.api.focus(2, 1, null, 3),
    () => h.api.locateDomain(0),
    () => h.api.locateGoal(0),
    () => h.api.zoom(1.4),
  ]
  for (const [index, openView] of views.entries()) {
    openView()
    h.flush()
    assert.notDeepEqual(positions(), overview)
    h.canvas.dispatchEvent(pointer('pointerdown', 1, 1))
    h.canvas.dispatchEvent(pointer('pointerup', 1, 1))
    h.flush()
    assert.deepEqual(positions(), overview)
    assert.equal(h.stage.dataset.selection, '')
    assert.equal(h.stage.dataset.goalFocused, undefined)
    assert.equal(h.stage.dataset.domainFocused, undefined)
    assert.equal(h.resets.length, index + 1)
  }
  h.api.destroy()
})

test('the results canvas delegates an empty tap without intercepting drags, node picks or Home', () => {
  let blankTaps = 0
  const h = harness(courses.slice(0, 10), [], true, { onBlankTap: () => blankTaps++ })
  h.flush()
  const tap = (x, y) => {
    h.canvas.dispatchEvent(pointer('pointerdown', x, y))
    h.canvas.dispatchEvent(pointer('pointerup', x, y))
  }
  tap(1, 1)
  tap(949, 490)
  assert.equal(blankTaps, 2)
  assert.equal(h.resets.length, 0)
  h.canvas.dispatchEvent(pointer('pointerdown', 1, 1))
  h.canvas.dispatchEvent(pointer('pointermove', 31, 25))
  h.canvas.dispatchEvent(pointer('pointerup', 31, 25))
  h.flush()
  clickLabel(h, h.visible().find(label => label.dataset.level === 'course'))
  assert.equal(h.selected.length, 1)
  h.canvas.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key: 'Home' }))
  assert.equal(h.resets.length, 1)
  assert.equal(blankTaps, 2)
  h.api.destroy()
})

test('focused detail preserves legacy direct leaves and keeps neighbouring courses pickable', () => {
  const h = harness()
  h.flush()
  h.api.focus(17); h.flush()
  const labels = h.visible()
  const courseLabels = labels.filter(l => l.dataset.level === 'course')
  assert.ok(courseLabels.some(l=>l.textContent==='课程17'))
  const foreign=courseLabels.find(l=>l.textContent!=='课程17')
  assert.ok(foreign)
  clickLabel(h,foreign)
  assert.notEqual(h.selected.at(-1)[0],17)
  assert.ok(labels.some(l => l.dataset.level === 'unit'))
  assert.ok(!labels.some(l=>l.dataset.level==='point'))
  h.api.focus(17,0); h.flush()
  const leaf = h.visible().find(l => l.dataset.level === 'point')
  assert.ok(leaf)
  clickLabel(h, leaf)
  const [ci, ti, si, pi] = h.selected.at(-1)
  assert.equal(si,null)
  assert.equal(ci, 17)
  assert.equal(courses[ci].topics[ti].points[pi], leaf.textContent)
  h.api.focus(null); h.flush()
  assert.ok(h.visible().every(l => l.dataset.level === 'course'))
  h.api.destroy()
})

test('selection fades unrelated nodes within and outside its course', () => {
  const h = harness(courses.slice(0, 10))
  h.api.focus(2, 1); h.flush()
  const labels = h.visible()
  const selected = labels.find(l => l.dataset.path === '[2,1,null,null]')._knowledgeNode
  const related = selected.children.find(n => n.visible)
  const unrelated = selected.parent.children.find(n => n !== selected && n.visible)
  const opacity = n => h.dots.find(dot => dot.x === n.sx && dot.y === n.sy).opacity
  assert.equal(opacity(related), 1)
  assert.ok(opacity(unrelated) <= 0.15)
  const otherCourse = labels.find(l => l.dataset.level === 'course' && l._knowledgeNode !== selected.parent)
  assert.ok(otherCourse)
  assert.ok(Number(otherCourse.style.opacity) <= 0.38)
  h.api.focus(2); h.flush()
  assert.equal(opacity(unrelated), 1)
  h.api.destroy()
})

test('switching the scene theme repaints the current labels and canvas while preserving camera and selection', () => {
  const h = harness(courses.slice(0, 3))
  const path = [1, 0, null, 2]
  h.api.focus(...path); h.flush()
  h.api.zoom(1.25); h.flush()
  const selectedLabel = () => h.visible().find(el => el.dataset.path === JSON.stringify(path))
  const label = selectedLabel(), node = label._knowledgeNode
  const dotColor = () => h.dots.find(dot => dot.x === node.sx && dot.y === node.sy).color
  const light = [label.style.color, dotColor()]
  const projection = [node.sx, node.sy, node.depth]
  h.api.setDarkMode(true); h.flush()
  assert.equal(h.stage.dataset.theme, 'dark')
  assert.equal(selectedLabel(), label)
  assert.deepEqual([node.sx, node.sy, node.depth], projection)
  const dark = [label.style.color, dotColor()]
  assert.ok(dark.every((value, index) => value !== light[index]))
  h.api.setDarkMode(false); h.flush()
  assert.equal(h.stage.dataset.theme, 'light')
  assert.deepEqual([label.style.color, dotColor()], light)
  assert.equal(h.stage.dataset.selection, JSON.stringify(path))
  assert.equal(h.resets.length, 0)
  h.api.destroy()
})

test('atlas and unfolded map receive the initial theme and repaint in place with the active goal', () => {
  const h = harness(courses.slice(0, 2), [], true, { atlas:true, darkMode:true })
  h.flush()
  assert.equal(h.stage.dataset.theme, 'dark')
  assert.equal(h.mapThemes.at(-1), true)
  const locator = h.stage.children.find(el => el.className === 'knowledge-scene-locator')
  const caption = locator.children[0]
  caption.dispatchEvent(new Event('click'))
  h.api.locateGoal(0); h.flush()
  assert.deepEqual(h.terrainFrames.at(-1).slice(-3, -1), [0, true])
  h.api.setDarkMode(false); h.flush()
  assert.deepEqual(h.terrainFrames.at(-1).slice(-3, -1), [0, false])
  assert.equal(h.mapThemes.at(-1), false)
  assert.equal(caption.attributes['aria-expanded'], 'true')
  h.api.destroy()
})

test('球面总览在悬停和放大后仍隐藏实体名称，只标注选中的节点', () => {
  const h = harness(courses.slice(0, 10), [{ from: [0, 0, null, 0], to: [1, 0, null, 0] }], true, { atlas: true })
  h.flush()
  assert.equal(h.visible().length, 0)
  const locator = h.stage.children.find(el => el.className === 'knowledge-scene-locator')
  const buttons = locator.children[1].children.filter(el => el.type === 'button')
  locator.children[0].dispatchEvent(new Event('click'))
  assert.ok(locator.children[1].children.every(el => el.className !== 'kdg-map-domain'))
  assert.ok(buttons.every(el => !el.title))

  h.api.zoom(1.7); h.flush()
  const dot = h.dots.find(({ x, y }) => x > 100 && y > 100 && x < 850 && y < 415)
  assert.ok(dot)
  h.canvas.dispatchEvent(pointer('pointermove', dot.x, dot.y))
  h.flush()
  assert.equal(h.visible().length, 0)
  h.api.setCrossCourseOnly(true); h.flush()
  assert.equal(h.visible().length, 0)
  assert.equal(h.dots.length, 2)
  h.api.setCrossCourseOnly(false)

  buttons[3].dispatchEvent(new Event('click')); h.flush()
  assert.deepEqual(h.selected.at(-1), [3, null, null, null])
  assert.deepEqual(h.visible().map(el => el.textContent), ['课程3'])
  h.api.reset(); h.flush()
  assert.equal(h.visible().length, 0)
  h.api.destroy()
})

test('定位知识领域后绘制高亮，并在返回全图时清除', () => {
  const h = harness(courses.slice(0, 2), [], true, { atlas:true })
  h.api.locateDomain(0)
  h.flush()
  assert.equal(h.stage.dataset.domainFocused, '0')
  assert.deepEqual(h.terrainFrames.at(-1).slice(-4, -2), [0, null])
  h.api.reset()
  h.flush()
  assert.equal(h.stage.dataset.domainFocused, undefined)
  assert.deepEqual(h.terrainFrames.at(-1).slice(-4, -2), [null, null])
  h.api.destroy()
})

test('课程和跨领域知识点选中时在球面标注各自关联的知识领域', () => {
  const h = harness([
    { name: '课程甲', domain: '领域甲', topics: [{ name: '单元', points: ['共享知识点', '独立知识点'],
      pointDomains: [['领域乙', '领域丙'], []] }] },
    { name: '课程乙', domain: '无关领域', topics: [] },
  ], [], true, { atlas: true, paintAtlas: true })
  const layer = h.stage.children.find(el => el.className === 'kdg-globe-annotations')
  const visibleLabels = () => layer.children
    .filter(el => el.className === 'kdg-globe-region' && !el.hidden)
    .map(el => el.textContent).sort()

  h.api.focus(0); h.flush()
  assert.deepEqual(visibleLabels(), ['领域丙', '领域乙', '领域甲'])
  h.api.focus(0, 0, null, 0); h.flush()
  assert.deepEqual(visibleLabels(), ['领域丙', '领域乙'])
  h.api.setDomainsVisible(false); h.flush()
  assert.deepEqual(visibleLabels(), [])
  h.api.setDomainsVisible(true); h.flush()
  assert.deepEqual(visibleLabels(), ['领域丙', '领域乙'])
  h.api.focus(0, 0, null, 1); h.flush()
  assert.deepEqual(visibleLabels(), [])
  h.api.reset(); h.flush()
  assert.deepEqual(visibleLabels(), [])
  h.api.destroy()
})

test('领域聚焦保留共享知识点的亮度，并让未归属知识点比其他领域的点更易辨认', () => {
  const data = [
    { name: '课程甲', domain: '领域甲', topics: [{ name: '单元',
      points: ['领域内知识点', '未归属知识点'], manualPointDomains: [null, []] }] },
    { name: '课程乙', domain: '领域乙', topics: [{ name: '单元',
      points: ['共享知识点', '领域外知识点'], pointDomains: [['领域乙', '领域甲']] }] },
    { name: '课程丙', domain: '领域乙', topics: [] },
  ]
  const h = harness(data, [], true, { atlas: true })
  const opacity = name => {
    const node = h.atlasGraph.nodes.find(n => n.name === name)
    return (node.kind ? h.dots : h.markers).find(dot => dot.x === node.sx && dot.y === node.sy).opacity
  }
  const retained = ['课程甲', '领域内知识点', '共享知识点']
  const muted = ['课程乙', '课程丙', '领域外知识点']

  h.terrainActions.onDomain(0)
  h.flush()
  assert.deepEqual(h.visible().map(label => label.textContent), ['课程甲'])
  clickLabel(h, h.visible()[0])
  assert.deepEqual(h.selected.at(-1), [0, null, null, null])
  const focusedOpacity = [...retained, ...muted].map(opacity)
  const unassignedOpacity = opacity('未归属知识点')
  h.api.clearDomain()
  h.flush()
  assert.equal(h.visible().length, 0)
  retained.forEach((name, i) => assert.equal(focusedOpacity[i], opacity(name), name))
  muted.forEach((name, i) => assert.ok(focusedOpacity[retained.length + i] < opacity(name) / 3, name))
  assert.ok(unassignedOpacity > opacity('未归属知识点') / 3)
  assert.ok(unassignedOpacity < opacity('未归属知识点'))
  h.api.destroy()
})

test('未归属知识点分散在领域边界外的近处，并能通过原路径定位', () => {
  const data = [
    { name: '课程甲', domain: '领域甲', topics: [{
      name: '单元', points: ['领域内知识点', '清空归属的知识点'],
      pointDomains: { 0: ['领域甲', '领域乙'], 1: ['领域甲'] },
      manualPointDomains: { 1: [] },
    }] },
    { name: '课程乙', domain: '领域乙', topics: [{
      name: '单元', sections: [{ name: '主题', points: ['无领域的知识点'], pointDomains: { 0: [] } }],
    }] },
  ]
  const h = harness(data, [], true, { atlas: true })
  const { nodes, sphereRadius, regions } = h.atlasGraph
  const free = nodes.filter(node => /清空归属|无领域/.test(node.name))
  assert.equal(free.length, 2)
  for (const node of free) {
    assert.equal(node.domain, undefined)
    const distance = Math.hypot(node.x, node.y, node.z)
    assert.ok(distance >= sphereRadius && distance <= sphereRadius * 1.03)
    const normal = { x: node.x / distance, y: node.y / distance, z: node.z / distance }
    assert.ok(regions.every(region => !h.win.KnowledgeDomainAtlas.inside(region, normal)), node.name)
    const nearestCoast = Math.max(...regions.flatMap(region => region.rim.map(p =>
      (p.x * normal.x + p.y * normal.y + p.z * normal.z) / sphereRadius,
    )))
    assert.ok(nearestCoast >= Math.cos(.12) && nearestCoast <= Math.cos(.026), node.name)
    h.api.focus(...node.path)
    h.flush()
    assert.equal(h.stage.dataset.selection, JSON.stringify(node.path))
  }
  assert.notDeepEqual([free[0].x, free[0].y, free[0].z], [free[1].x, free[1].y, free[1].z])
  h.api.destroy()
})

test('点击球面领域与卫星时向详情栏发送选中项，并更新高亮', () => {
  const h = harness(courses.slice(0, 2), [], true, { atlas:true })
  h.flush()
  h.canvas.dispatchEvent(pointer('pointerdown', 300, 240))
  h.canvas.dispatchEvent(pointer('pointerup', 300, 240))
  assert.deepEqual(h.atlasSelections.at(-1), ['domain', 0])
  assert.equal(h.stage.dataset.domainFocused, '0')

  h.terrainActions.onGoal(0)
  assert.deepEqual(h.atlasSelections.at(-1), ['goal', 0])
  assert.equal(h.stage.dataset.goalFocused, 'true')
  assert.equal(h.stage.dataset.domainFocused, undefined)
  h.api.destroy()
})

test('drag, wheel, resize and cleanup coalesce drawing without page scroll', () => {
  const h = harness()
  h.flush()
  const before = h.visible().map(l => l.style.transform)
  h.canvas.dispatchEvent(pointer('pointerdown', 140, 110))
  h.canvas.dispatchEvent(pointer('pointermove', 200, 130))
  h.canvas.dispatchEvent(pointer('pointermove', 230, 140))
  h.canvas.dispatchEvent(pointer('pointerup', 230, 140))
  assert.equal(h.callbacks.size, 1)
  assert.equal(h.selected.length, 0)
  assert.equal(h.resets.length, 0)
  h.flush()
  assert.notDeepEqual(h.visible().map(l => l.style.transform), before)
  const wheel = Object.assign(new Event('wheel', { cancelable: true }), { deltaY: -220, deltaMode: 0, clientX: 400, clientY: 220 })
  h.canvas.dispatchEvent(wheel)
  assert.equal(wheel.defaultPrevented, true)
  h.host.clientWidth = 420; h.host.clientHeight = 260; h.observer.resize(); h.flush()
  assert.equal(h.canvas.height, 520)
  h.api.zoom(1.2)
  h.api.destroy(); h.api.destroy()
  assert.equal(h.host.children.length, 0)
  assert.equal(h.callbacks.size, 0)
  assert.equal(h.observer.disconnected, true)
  h.canvas.dispatchEvent(wheel)
  assert.equal(h.callbacks.size, 0)
  assert.equal(new Set(courses.map((_, i) => h.win.KnowledgeDomainScene.color(i))).size, 65)
})

test('pinch and keyboard navigation change the view without activating a node', () => {
  const h = harness()
  h.flush()
  const before = h.visible().map(l => l.style.transform)
  const touch = (kind, id, x, y) => Object.assign(pointer(kind, x, y), { pointerId: id, pointerType: 'touch' })
  h.canvas.dispatchEvent(touch('pointerdown', 1, 400, 205))
  h.canvas.dispatchEvent(touch('pointerdown', 2, 490, 230))
  h.canvas.dispatchEvent(touch('pointermove', 1, 360, 200))
  h.canvas.dispatchEvent(touch('pointermove', 2, 550, 240))
  h.canvas.dispatchEvent(touch('pointerup', 1, 360, 200))
  h.canvas.dispatchEvent(touch('pointerup', 2, 550, 240))
  h.flush()
  assert.notDeepEqual(h.visible().map(l => l.style.transform), before)
  assert.equal(h.selected.length, 0)
  const key = name => Object.assign(new Event('keydown', { cancelable: true }), { key: name })
  const home = key('Home')
  h.canvas.dispatchEvent(home); h.flush()
  assert.equal(home.defaultPrevented, true)
  assert.deepEqual(h.visible().map(l => l.style.transform), before)
  h.canvas.dispatchEvent(key('ArrowRight')); h.flush()
  assert.notDeepEqual(h.visible().map(l => l.style.transform), before)
  h.api.destroy()
})

test('four-level nodes, direct leaves and cross-course relations preserve stable paths', () => {
  const data=Array.from({length:10},(_,ci)=>({name:'课程'+ci,topics:[{name:'单元'+ci,points:['直属点'],
    sections:[{name:'主题'+ci,points:['定义','操作方法']}]}]}))
  const from=[1,0,0,1], to=[3,0,0,0], legacy=[1,0,null,0]
  const h=harness(data,[{from,to},{from:to,to:from},{from,to:[1,0,0,0]},{from,to:[20,0,0,0]}])
  h.flush()
  assert.equal(h.stage.dataset.nodes,'60')
  assert.equal(h.stage.dataset.relations,'1')
  assert.equal(new Set(data.map((_,i)=>h.win.KnowledgeDomainScene.appearance(i).layout)).size,10)
  assert.equal(new Set(data.map((_,i)=>h.win.KnowledgeDomainScene.appearance(i).marker)).size,10)
  h.api.focus(...from); h.flush()
  assert.equal(h.stage.dataset.selection,JSON.stringify(from))
  assert.equal(h.stage.dataset.activeRelations,'1')
  for(const path of [from,to]) {
    const label=h.visible().find(l=>l.dataset.path===JSON.stringify(path))
    assert.ok(label); clickLabel(h,label); assert.deepEqual(h.selected.at(-1),path)
  }
  h.api.focus(...legacy); h.flush()
  assert.equal(h.stage.dataset.activeRelations,'0')
  assert.ok(h.visible().some(l=>l.dataset.path===JSON.stringify(legacy)))
  h.api.zoom(0.02); h.flush()
  assert.equal(h.stage.dataset.selection,'')
  assert.equal(h.resets.length,1)
  h.api.focus(0,0,0); h.flush(); h.api.reset(); h.flush()
  assert.equal(h.resets.length,2)
  h.api.destroy()
})

test('an unlabelled leaf can be picked directly in the overview and the locator works at extreme zoom', () => {
  const h=harness()
  h.flush()
  const locator=h.stage.children.find(c=>c.className==='knowledge-scene-locator')
  assert.equal(locator.hidden,true)
  const node=h.visible()[0]._knowledgeNode.children[0].children[0]
  h.canvas.dispatchEvent(pointer('pointerdown',node.sx,node.sy))
  h.canvas.dispatchEvent(pointer('pointerup',node.sx,node.sy))
  assert.deepEqual(h.selected.at(-1), Array.from(node.path))
  h.api.zoom(15); h.flush()
  assert.equal(locator.hidden,false)
  const buttons=locator.children[1].children.filter(c=>c.type==='button')
  assert.equal(buttons.length,courses.length)
  buttons[43].dispatchEvent(new Event('click')); h.flush()
  assert.deepEqual(h.selected.at(-1),[43,null,null,null])
  assert.equal(buttons[43].attributes['aria-pressed'],'true')
  h.api.reset(); h.flush()
  assert.equal(locator.hidden,true)
  h.api.destroy()
})

test('CSS-scaled canvas maps hover and tap on a small leaf to the displayed point, including where a label crosses it', () => {
  const h = harness()
  h.api.focus(17)
  h.flush()
  const root = h.visible().find(el => el.textContent === '课程17')._knowledgeNode
  const leaves = root.children.flatMap(unit => unit.children).filter(n => n.visible)
  const labels = h.visible().map(el => {
    const [, left, top] = /translate\((-?\d+)px,(-?\d+)px\)/.exec(el.style.transform)
    return { left: +left, top: +top, width: parseInt(el.style.width), height: parseInt(el.style.height) }
  })
  const overlapsLabel = n => labels.some(b => n.sx >= b.left && n.sx <= b.left + b.width && n.sy >= b.top && n.sy <= b.top + b.height)
  const examples = [leaves.find(n => !overlapsLabel(n)), leaves.find(overlapsLabel)]
  assert.ok(examples.every(Boolean))
  const rect = { left: 214, top: 108, width: 0.92 * h.host.clientWidth, height: 0.92 * h.host.clientHeight }
  h.canvas.getBoundingClientRect = () => rect
  for (const node of examples) {
    const x = rect.left + node.sx * rect.width / h.host.clientWidth
    const y = rect.top + node.sy * rect.height / h.host.clientHeight
    h.canvas.dispatchEvent(pointer('pointermove', x, y))
    h.flush()
    assert.ok(h.visible().some(el => el._knowledgeNode === node), 'show the leaf name under the cursor')
    h.canvas.dispatchEvent(pointer('pointerdown', x, y))
    h.canvas.dispatchEvent(pointer('pointerup', x, y))
    assert.deepEqual(h.selected.at(-1), Array.from(node.path))
  }
  h.api.destroy()
})

test('course centres surround a sphere and their knowledge points follow its surface', () => {
  const data = courses.slice(0, 10)
  const h = harness(data)
  h.flush()
  const roots = data.map((_, ci) => {
    h.api.focus(ci); h.flush()
    return h.visible().find(el => el.dataset.path === JSON.stringify([ci,null,null,null]))._knowledgeNode
  })
  const radius = n => Math.hypot(n.x, n.y, n.z)
  const radii = roots.map(radius)
  assert.ok(Math.min(...radii) > 0 && Math.max(...radii) / Math.min(...radii) < 1.01)
  for (const axis of ['x','y','z']) {
    const values = roots.map(n => n[axis])
    assert.ok(Math.max(...values) - Math.min(...values) > 1.6 * radii[0], axis)
  }
  const leaves = roots.flatMap(n => n.children.flatMap(unit => unit.children))
  assert.ok(leaves.every(n => Math.abs(radius(n) - radii[0]) < 0.24 * radii[0]))
  h.api.destroy()
})

test('each focused level keeps the selected node centred and magnifies its own neighbourhood even with a distant relation', () => {
  const data = courses.slice(0, 10).map(course => ({...course, topics:course.topics.map(unit => ({
    name:unit.name, sections:[{name:'主题甲',points:unit.points},{name:'主题乙',points:['叶乙']}],
  }))}))
  const leafPath = [2,1,0,3], peerPath = [8,0,1,0]
  const h = harness(data,[{from:leafPath,to:peerPath}])
  h.flush()
  let lastDepth = Infinity
  for (const path of [[2,null,null,null],[2,1,null,null],[2,1,0,null],leafPath,peerPath]) {
    h.api.focus(...path); h.flush()
    const node = h.visible().find(el => el.dataset.path === JSON.stringify(path))._knowledgeNode
    assert.ok(Math.abs(node.sx - h.host.clientWidth / 2) < 0.01 && Math.abs(node.sy - h.host.clientHeight / 2) < 0.01, 'centre '+node.name)
    if (path !== peerPath) assert.ok(node.depth < lastDepth * 0.9, 'dolly to '+node.name)
    lastDepth = node.depth
    if (path === leafPath) assert.ok(node.diameter >= 18 && h.stage.dataset.activeRelations === '1')
  }
  h.api.destroy()
})

test('refocusing a leaf after manual zoom keeps the close view when the details panel resizes', () => {
  const h = harness(courses.slice(0, 10))
  const path = [2, 1, null, 3]
  h.api.focus(...path); h.flush()
  const node = h.visible().find(el => el.dataset.path === JSON.stringify(path))._knowledgeNode
  h.api.zoom(2); h.flush()
  const closeDistance = node.depth
  h.api.focus(...path); h.flush()
  assert.ok(node.depth <= closeDistance + 0.01)
  h.host.clientWidth += 20; h.observer.resize(); h.flush()
  assert.ok(node.depth <= closeDistance + 0.01)
  assert.ok(Math.abs(node.sx - h.host.clientWidth / 2) < 0.01)
  h.api.destroy()
})
