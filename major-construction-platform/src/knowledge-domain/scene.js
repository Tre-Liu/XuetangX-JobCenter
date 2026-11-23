// Classic script shared by the offline page and the Vue entry.
;(function (global) {
  'use strict'

  const PALETTE = ['#386fe3', '#179c96', '#9564d5', '#de8650', '#d95d87', '#5b9c53',
    '#498bb1', '#b577c2', '#bd9938', '#6082d1', '#41a98a', '#cf7061']
  const GOLDEN = Math.PI * (3 - Math.sqrt(5))
  const FOV = 38
  const TAN = Math.tan(FOV * Math.PI / 360)
  const HOME_YAW = 0.12
  const HOME_PITCH = 0.18
  const FULL_TURN = 2 * Math.PI
  const OVERVIEW_REVOLUTION_MS = 180_000
  const FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif'
  const FADED_COURSE_OPACITY = 0.20
  const FADED_BRANCH_OPACITY = 0.12
  const FADED_UNASSIGNED_OPACITY = 0.45
  const FADED_RELATION_OPACITY = 0.25
  const DARK_COURSE_LIFT = 0.35
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
  const isFaded = (node, selected) => Boolean(node.domainMuted || (selected && !node.accent && (selected.kind > 0 || node.ci !== selected.ci)))
  const isMutedRelation = edge => Boolean(edge.from.domainMuted || edge.to.domainMuted)

  function color(index) {
    if (!Number.isInteger(index) || index < 0) return PALETTE[0]
    if (index < PALETTE.length) return PALETTE[index]
    const hue = (index * 137.507764) % 360
    const light = [0.47, 0.54, 0.43][index % 3]
    const component = offset => {
      const k = (offset + hue / 30) % 12
      const value = light - 0.52 * Math.min(light, 1 - light) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
      return Math.round(value * 255).toString(16).padStart(2, '0')
    }
    return '#' + component(0) + component(8) + component(4)
  }

  function darkCourseColor(base) {
    return base.replace(/[0-9a-f]{2}/g, pair => {
      const original = parseInt(pair, 16)
      return Math.round(original + (255 - original) * DARK_COURSE_LIFT).toString(16).padStart(2, '0')
    })
  }

  function bounds(nodes) {
    if (!nodes.length) return { x: 0, y: 0, z: 0 }
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]
    for (const node of nodes) {
      const xyz = [node.x, node.y, node.z]
      for (let i = 0; i < 3; i++) {
        lo[i] = Math.min(lo[i], xyz[i])
        hi[i] = Math.max(hi[i], xyz[i])
      }
    }
    return { x: (lo[0] + hi[0]) / 2, y: (lo[1] + hi[1]) / 2, z: (lo[2] + hi[2]) / 2 }
  }

  const LAYOUTS = [
    ['环形', '圆形'], ['双翼形', '菱形'], ['扇形', '三角形'], ['网格形', '方形'],
    ['放射形', '五角星'], ['螺旋形', '六边形'], ['波浪形', '花瓣形'], ['双环形', '圆环'],
    ['树冠形', '十字形'], ['纵向链形', '椭圆形'],
  ]
  function appearance(index) {
    const style = Number.isInteger(index) && index >= 0 ? index % 10 : 0
    return { color: color(index), layout: LAYOUTS[style][0], marker: LAYOUTS[style][1] }
  }
  function unitOffset(style, i, count) {
    const t = (i + 0.5) / count, angle = t * 2 * Math.PI, v = 2 * t - 1
    const c = Math.cos(angle), s = Math.sin(angle)
    switch (style) {
      case 0: return [20 * c, 20 * s, 3 * Math.sin(2 * angle)]
      case 1: return [(i % 2 ? 1 : -1) * (14 + 11 * t), 14 * v, 9 * s]
      case 2: return [24 * Math.sin(v * 1.3), 23 * Math.cos(v * 1.3), v * 8]
      case 3: { const cols = Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / cols)
        return [31 * ((i % cols + 0.5) / cols - 0.5), 35 * ((Math.floor(i / cols) + 0.5) / rows - 0.5) + 10, 9 * (i % 2 ? 1 : -1)] }
      case 4: return [(i % 2 ? 14 : 26) * c, (i % 2 ? 14 : 26) * s, 12 * Math.cos(3 * angle)]
      case 5: return [(9 + 18 * t) * Math.cos(i * GOLDEN), (9 + 18 * t) * Math.sin(i * GOLDEN), 24 * v]
      case 6: return [30 * v, 13 * Math.sin(3 * Math.PI * t), 10 * Math.cos(angle)]
      case 7: return [18 * c, 14 * s + (i % 2 ? 9 : -9), i % 2 ? 9 : -9]
      case 8: return [26 * v, 21 - 16 * Math.abs(v), 11 * Math.sin(i * GOLDEN)]
      default: return [6 * Math.sin(angle), v * 31, 11 * Math.cos(angle)]
    }
  }

  function makeGraph(courses, relations, atlas) {
    const nodes = [], groups = [], lookup = new Map(), cross = [], sharedNodes = []
    const sphereRadius = atlas ? Math.max(65,26*Math.sqrt(courses.length)) : courses.length > 1 ? 20*Math.sqrt(courses.length) : 0
    const regions = atlas ? global.KnowledgeDomainAtlas.geometry(atlas,sphereRadius) : []
    const unassigned = atlas && global.KnowledgeDomainAtlas.unassignedPositions(atlas.unassigned,regions,sphereRadius)
    let outerRadius = sphereRadius
    for (const [ci, course] of courses.entries()) {
      const units = Array.isArray(course?.topics) ? course.topics : []
      const style = ci % LAYOUTS.length
      const group = { nodes: [], color: color(ci), index: ci, style, isCore: course?.isCore === true ||
        /专业核心/.test(String(course?.category || course?.type || '')) }
      group.darkColor = darkCourseColor(group.color)
      groups.push(group)
      function add(name, x, y, z, unit, section, point, parent) {
        const path = [ci, unit, section, point]
        const node = { name: String(name || ''), x, y, z, ci, unit, section, point, parent, path, style, accent: 0,
          kind: point !== null ? 3 : section !== null ? 2 : unit !== null ? 1 : 0, index: nodes.length,
          sx: 0, sy: 0, depth: 0, visible: false, diameter: 0, children: [], relations: [] }
        nodes.push(node); group.nodes.push(node)
        parent?.children.push(node)
        lookup.set(JSON.stringify(path), node)
        return node
      }
      const root = add(course?.name, 0, 0, 0, null, null, null, null)
      function branch(parent, i, total, length, seed) {
        const heading = Math.atan2(parent.y, parent.x)
        const angle = heading + (total > 1 ? ((i + 0.5) / total - 0.5) * (total < 5 ? 2.6 : 4.8) : 0.38) + 0.16 * Math.sin(seed)
        const distance = length * (0.87 + 0.30 * ((i * 7 + seed) % 11) / 10)
        return [parent.x + Math.cos(angle) * distance, parent.y + Math.sin(angle) * distance,
          parent.z + Math.sin(i * 2.0 + seed) * distance * 0.58]
      }
      function leaves(parent, points, ui, si, seed) {
        if (!Array.isArray(points)) return
        for (const [pi, name] of points.entries())
          add(name, ...branch(parent, pi, points.length, 8 + Math.min(5, points.length / 3), seed), ui, si, pi, parent)
      }
      for (const [ui, unit] of units.entries()) {
        const [lx, ly, lz] = unitOffset(style, ui, units.length)
        const turn = ci * 0.81 + 0.26
        const un = add(unit?.name, lx * Math.cos(turn) - ly * Math.sin(turn),
          lx * Math.sin(turn) + ly * Math.cos(turn), lz, ui, null, null, root)
        const sections = Array.isArray(unit?.sections) ? unit.sections : []
        for (const [si, section] of sections.entries()) {
          const sn = add(section?.name, ...branch(un, si, sections.length, 13, ci + ui + 1), ui, si, null, un)
          leaves(sn, section?.points, ui, si, ci + ui + si + 3)
        }
        leaves(un, unit?.points, ui, null, ci + ui + 2)
      }
      if (atlas) {
        for (const node of group.nodes) {
          const key=node.path.join('/')
          node.domain=atlas.paths.get(key)
          node.domains=atlas.memberships?.get(key)
          if(node.domains) sharedNodes.push(node)
          const detached = unassigned.get(key)
          node.unassigned = Boolean(detached)
          Object.assign(node,detached ?? regions[node.domain].world.get(key))
          outerRadius=Math.max(outerRadius,Math.hypot(node.x,node.y,node.z))
        }
      } else if (sphereRadius) {
        // Fibonacci anchors give every course a comparable area on the globe. Bend its
        // original branching pattern along the surface using the local east/north basis.
        const longitude = ci * GOLDEN + 0.42
        const sinLat = 1 - 2 * (ci + 0.5) / courses.length
        const cosLat = Math.sqrt(1 - sinLat * sinLat)
        const sinLon = Math.sin(longitude), cosLon = Math.cos(longitude)
        for (const node of group.nodes) {
          const length = Math.hypot(node.x, node.y), angle = length / sphereRadius
          const radius = sphereRadius + node.z * 0.30
          const lateral = length ? radius * Math.sin(angle) / length : 0
          const east = lateral * node.x, north = lateral * node.y
          const normal = radius * Math.cos(angle)
          const horizontal = normal * cosLat - north * sinLat
          node.x = horizontal * sinLon + east * cosLon
          node.y = normal * sinLat + north * cosLat
          node.z = horizontal * cosLon - east * sinLon
          outerRadius = Math.max(outerRadius, radius)
        }
      }
    }
    const seen = new Set()
    for (const relation of Array.isArray(relations) ? relations : []) {
      const from = lookup.get(JSON.stringify(relation?.from)), to = lookup.get(JSON.stringify(relation?.to))
      if (from?.kind !== 3 || to?.kind !== 3 || from.ci === to.ci) continue
      const pair = [Math.min(from.index, to.index), Math.max(from.index, to.index)].join('/')
      if (seen.has(pair)) continue
      seen.add(pair)
      const edge = { from, to, accent: 0 }
      cross.push(edge); from.relations.push(edge); to.relations.push(edge)
    }
    const crossNodes = nodes.filter(node => node.relations.length)
    return { nodes, groups, lookup, cross, crossNodes, sharedNodes, sphereRadius, outerRadius, regions,
      center: sphereRadius ? {x:0,y:0,z:0} : bounds(nodes) }
  }

  function makeGPU(canvas, graph, nucleus) {
    const T = global.KnowledgeThree
    if (!T) return null
    const params = { alpha: true, antialias: true, premultipliedAlpha: true }
    const context = canvas.getContext('webgl2', params)
    if (!context) return null
    const renderer = new T.WebGLRenderer({ canvas, context, ...params })
    renderer.setClearColor(0x000000, 0)
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(FOV, 1, 0.05, 100000)
    const uniforms = { detail: { value: 0 }, selected: { value: -1 }, focal: { value: 1 }, pixelRatio: { value: 1 }, viewport: { value: [1, 1] },
      orbitDistance: { value: 1 }, sphereRadius: { value: graph.sphereRadius }, darkMode: { value: 0 } }
    const resources = [], accents = [], domainMasks = []
    if (nucleus) {
      const texture=new T.CanvasTexture(nucleus)
      uniforms.nucleusMap={value:texture}
      uniforms.nucleusRect={value:[0,0,1,0]}
      resources.push(texture)
    }
    // Only fragments farther away than the world origin pass through the nucleus.
    // Screen coordinates use the drawing buffer, including its device pixel ratio.
    const coreMask=nucleus ? `
      uniform sampler2D nucleusMap;
      uniform vec4 nucleusRect;
      float coreTransmission() {
        if(nucleusRect.w<=0.0 || 1.0/gl_FragCoord.w<=nucleusRect.w) return 1.0;
        vec2 uv=(gl_FragCoord.xy-nucleusRect.xy)/nucleusRect.z;
        if(any(lessThan(uv,vec2(0.0))) || any(greaterThan(uv,vec2(1.0)))) return 1.0;
        return 1.0-texture2D(nucleusMap,uv).a;
      }` : 'float coreTransmission() { return 1.0; }'
    function batch(mode, items) {
      const lines = mode !== 'nodes', cross = mode === 'relations'
      const positions = [], kinds = [], courseIds = [], styles = [], tints = [], others = [], sides = [], alongs = [], bridges = [], indices = [], refs = []
      if (!items.length) return
      for (const item of items) {
        const node = cross ? item.to : item, from = cross ? item.from : node.parent
        if (lines && !from) continue
        const hex = parseInt(graph.groups[node.ci].color.slice(1), 16)
        const tint = [(hex >> 16) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]
        if (lines) {
          const first = positions.length / 3
          indices.push(first, first + 1, first + 2, first + 2, first + 1, first + 3)
          for (const other of [node, node, from, from]) others.push(other.x, other.y, other.z)
          sides.push(-1, 1, 1, -1); alongs.push(0, 0, 1, 1)
        }
        for (const vertex of lines ? [from, from, node, node] : [node]) {
          positions.push(vertex.x, vertex.y, vertex.z)
          if (lines) bridges.push(!cross && from.domain!==node.domain ? 1 : 0)
          kinds.push(node.kind); courseIds.push(node.ci); styles.push(node.style); tints.push(...tint); refs.push(item)
        }
      }
      const geometry = new T.BufferGeometry()
      function attr(name, values, stride) {
        const attribute = new T.Float32BufferAttribute(values, stride)
        geometry.setAttribute(name, attribute)
        return attribute
      }
      attr('position', positions, 3); attr('aKind', kinds, 1); attr('aCourse', courseIds, 1)
      attr('aTint', tints, 3); attr('aStyle', styles, 1)
      accents.push({ refs, attribute: attr('aAccent', new Float32Array(refs.length), 1) })
      domainMasks.push({ refs, cross, lines, attribute: attr('aDomainOpacity', new Float32Array(refs.length).fill(1), 1) })
      if (lines) {
        attr('aBridge', bridges, 1); attr('aOther', others, 3); attr('aSide', sides, 1); attr('aAlong', alongs, 1); geometry.setIndex(indices)
      }
      const varying = 'varying vec3 tint; varying float level, opacity, coreFraction, shape, emphasis, travel;'
      const material = new T.ShaderMaterial({
        uniforms, transparent: true, depthWrite: false, depthTest: false,
        ...(lines ? { side: T.DoubleSide, forceSinglePass: true } : {}),
        vertexShader: `
          ${lines ? 'attribute vec3 aOther; attribute float aSide,aAlong,aBridge; uniform vec2 viewport;' : ''}
          attribute float aKind, aCourse, aStyle, aAccent, aDomainOpacity;
          attribute vec3 aTint;
          uniform float selected, focal, pixelRatio, detail, orbitDistance, sphereRadius, darkMode;
          ${varying}
          void main() {
            vec4 eye = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * eye;
            opacity = aDomainOpacity;
            ${cross ? '' : `
              bool faded = selected>=0.0 && aAccent<0.1 && (detail>0.5 || abs(aCourse-selected)>0.5);
              if(faded) opacity=min(opacity,aKind<0.5 ? ${FADED_COURSE_OPACITY} : ${FADED_BRANCH_OPACITY});
              if(selected<0.0 && sphereRadius>0.0) {
                float rear=clamp((-eye.z-orbitDistance)/sphereRadius,-1.0,1.0);
                opacity*=0.65-0.35*rear;
              }
            `}
            tint = mix(aTint,vec3(1.0),darkMode*${DARK_COURSE_LIFT}); level=aKind; shape=aStyle; emphasis=aAccent; travel=0.0;
            float scale=focal/max(0.05,-eye.z);
            float size=aKind<0.5 ? clamp(23.0+scale,23.0,43.0) : aKind<1.5 ? clamp(10.0+scale*0.82,10.0,25.0) :
              aKind<2.5 ? clamp(7.2+scale*0.60,7.2,20.0) : clamp(4.2+scale*0.51,4.2,17.0);
            size *= 1.0 + aAccent * 0.42;
            if(aAccent > 0.99) size=max(size,aKind<0.5 ? 40.0 : 28.0);
            float sprite=aKind<0.5 ? max(size,clamp(scale*38.0,32.0,90.0)) : size;
            coreFraction=size/sprite; gl_PointSize=sprite*pixelRatio;
            ${lines ? `
              if(aBridge>0.5 && aAccent<0.1) opacity*=0.13;
              vec4 other=projectionMatrix*modelViewMatrix*vec4(aOther,1.0);
              vec2 delta=(other.xy/max(other.w,0.01)-gl_Position.xy/max(gl_Position.w,0.01))*viewport;
              vec2 normal=vec2(-delta.y,delta.x)/max(length(delta),0.001);
              float thickness=${cross ? '0.95 + aAccent * 1.30' : '(aKind < 1.5 ? 1.45 : aKind < 2.5 ? 1.2 : 0.95) + aAccent * 0.60'};
              gl_Position.xy+=normal*thickness*aSide*gl_Position.w/viewport;
              travel=aAlong*length(delta)*0.5;
              if(other.w<0.05 || gl_Position.w<0.05) opacity=0.0;
            ` : ''}
          }`,
        fragmentShader: lines ? `
          ${varying}
          ${coreMask}
          uniform float selected, darkMode;
          void main() {
            if(opacity<0.01) discard;
            ${cross ? `
              if(mod(travel,8.0)>5.0) discard;
              vec3 neutral=mix(vec3(0.39,0.52,0.68),vec3(0.48,0.65,0.80),darkMode);
              vec3 highlight=mix(vec3(0.22,0.43,0.69),vec3(0.68,0.85,1.0),darkMode);
              gl_FragColor=vec4(mix(neutral,highlight,emphasis),
                mix(${crossOpacity(graph.cross.length).toFixed(3)}*(selected>=0.0 ? ${FADED_RELATION_OPACITY}:1.0),0.96,emphasis)*opacity);
            ` : 'gl_FragColor=vec4(tint*mix(0.89,1.0,darkMode),(level<1.5 ? 0.77 : level<2.5 ? 0.63 : 0.53)*mix(1.0,0.68,darkMode)*opacity);'}
            gl_FragColor.a*=coreTransmission();
          }` : `
          ${varying}
          ${coreMask}
          uniform float darkMode;
          float polygon(float n,float angle,float r) {
            float arc=6.2831853/n;
            return r*cos(mod(angle+arc*0.5,arc)-arc*0.5)/cos(arc*0.5);
          }
          float silhouette(vec2 p) {
            float r=length(p), a=atan(p.y,p.x);
            if(shape<0.5) return r;
            if(shape<1.5) return abs(p.x)+abs(p.y);
            if(shape<2.5) return polygon(3.0,a-1.5708,r);
            if(shape<3.5) return max(abs(p.x),abs(p.y))/0.84;
            if(shape<4.5) return r/(0.71+0.23*cos(5.0*(a+1.5708)));
            if(shape<5.5) return polygon(6.0,a,r);
            if(shape<6.5) return r/(0.78+0.19*cos(4.0*a));
            if(shape<7.5) return r;
            if(shape<8.5) return min(max(abs(p.x)/0.37,abs(p.y)),max(abs(p.x),abs(p.y)/0.37));
            return length(vec2(p.x,p.y/0.57));
          }
          void main() {
            vec2 p=(gl_PointCoord-vec2(0.5))*2.0;
            float outer=length(p);
            if(outer>=1.0 || opacity<0.01) discard;
            float aura=level<0.5 ? 0.10*(1.0-smoothstep(0.0,1.0,outer)):0.0;
            p/=coreFraction;
            float r=level<0.5 ? silhouette(p):length(p);
            float core=1.0-smoothstep(0.63,0.74,r);
            if(level<0.5 && shape>6.5 && shape<7.5) core*=smoothstep(0.25,0.34,r);
            float halo=(1.0-smoothstep(0.50,1.0,r))*(level<0.5 ? 0.24:0.14);
            float light=exp(-9.0*dot(p+vec2(0.20,0.24),p+vec2(0.20,0.24)));
            float shade=clamp(0.95-0.30*dot(p,vec2(0.52,0.85)),0.62,1.05);
            float ring=emphasis>=0.8 ? smoothstep(0.74,0.8,r)*(1.0-smoothstep(0.87,0.96,r)):0.0;
            vec3 fill=mix(tint*shade,vec3(1.0),light*(level<1.5?0.60:0.34));
            gl_FragColor=vec4(mix(fill,vec3(0.78,0.91,1.0),ring*darkMode),opacity*max(aura,max(core,max(halo,ring))));
            gl_FragColor.a*=coreTransmission();
          }`,
      })
      resources.push(geometry, material)
      const object = lines ? new T.Mesh(geometry, material) : new T.Points(geometry, material)
      object.frustumCulled = false; object.renderOrder = cross ? 0 : lines ? 1 : 2
      scene.add(object)
      return object
    }
    const relations = batch('relations', graph.cross)
    const branches = batch('branches', graph.nodes)
    const points = batch('nodes', graph.nodes)
    const endpoints = batch('nodes', graph.crossNodes)
    const shared = batch('nodes', graph.sharedNodes)
    if (endpoints) endpoints.visible = false
    if (shared) shared.visible = false
    return {
      setPointFilter(filter) {
        if (branches) branches.visible = !filter
        if (points) points.visible = !filter
        if (endpoints) endpoints.visible = filter === 'cross-course'
        if (shared) shared.visible = filter === 'cross-domain'
        if (relations) relations.visible = filter !== 'cross-domain'
      },
      setDomainFocus() {
        for (const { refs, cross, lines, attribute } of domainMasks) {
          for (let i = 0; i < refs.length; i++) {
            const item = refs[i]
            let opacity = 1
            if (cross && isMutedRelation(item)) opacity = FADED_RELATION_OPACITY
            if (!cross && item.domainMuted) {
              opacity = item.kind === 0 ? FADED_COURSE_OPACITY
                : !lines && item.unassigned ? FADED_UNASSIGNED_OPACITY : FADED_BRANCH_OPACITY
            }
            attribute.array[i] = opacity
          }
          attribute.needsUpdate = true
        }
      },
      selection(node) {
        uniforms.selected.value = node?.ci ?? -1
        uniforms.detail.value = node?.kind || 0
        for (const { refs, attribute } of accents) {
          for (let i = 0; i < refs.length; i++) attribute.array[i] = refs[i].accent
          attribute.needsUpdate = true
        }
      },
      resize(w, h, dpr) {
        renderer.setPixelRatio(dpr); renderer.setSize(w, h, false)
        camera.aspect=w/h; camera.updateProjectionMatrix()
        uniforms.viewport.value=[w,h]; uniforms.pixelRatio.value=dpr; uniforms.focal.value=h/(2*TAN)
      },
      draw(view, a, selected, core, darkMode) {
        uniforms.darkMode.value = darkMode ? 1 : 0
        if (nucleus) {
          const ratio=uniforms.pixelRatio.value
          uniforms.nucleusRect.value=core
            ? [core.x*ratio,canvas.height-(core.y+core.size)*ratio,core.size*ratio,core.depth]
            : [0,0,1,0]
        }
        uniforms.orbitDistance.value=view.dist
        camera.position.set(view.x+a.sx*a.cp*view.dist,view.y+a.sp*view.dist,view.z+a.cx*a.cp*view.dist)
        camera.lookAt(view.x,view.y,view.z); renderer.render(scene,camera)
      },
      destroy() {
        for (const resource of resources) resource.dispose()
        renderer.dispose(); renderer.forceContextLoss()
      },
    }
  }

  const crossOpacity = count => clamp(2.5 / Math.sqrt(Math.max(1, count)), 0.15, 0.40)
  const globeOpacity = (depth, distance, radius) => radius ? 0.65 - 0.35 * clamp((depth-distance)/radius,-1,1) : 1

  function outline(style) {
    return Array.from({ length: 64 }, (_, i) => {
      const a = i / 64 * Math.PI * 2, x = Math.cos(a), y = Math.sin(a)
      const polygon = (n, angle) => { const arc = 2 * Math.PI / n
        return Math.cos(arc / 2) / Math.cos(((angle + arc / 2 + 8 * Math.PI) % arc) - arc / 2) }
      const max = Math.max, abs = Math.abs
      const radii = [1, 1 / (abs(x) + abs(y)), polygon(3, a - Math.PI / 2),
        0.84 / max(abs(x), abs(y)), 0.71 + 0.23 * Math.cos(5 * (a + Math.PI / 2)), polygon(6, a),
        0.78 + 0.19 * Math.cos(4 * a), 1, 1 / Math.min(max(abs(x) / 0.37, abs(y)), max(abs(x), abs(y) / 0.37)),
        1 / Math.hypot(x, y / 0.57)]
      return [x * radii[style], y * radii[style]]
    })
  }
  const MARKERS = LAYOUTS.map((_, style) => outline(style))
  function makeCanvas(canvas, graph, nucleus) {
    const ctx = canvas.getContext('2d')
    let w = 0, h = 0, groups = [...graph.groups]
    let pointFilter = '', domainFocused = false
    function drawSlice(view,selected,splitDepth,rear,darkMode) {
      // Split crossing edges at the projected core plane, using perspective depth.
      function line(from,to) {
        const fromInSlice=(from.depth>splitDepth)===rear
        const toInSlice=(to.depth>splitDepth)===rear
        if(fromInSlice && toInSlice) {
          ctx.moveTo(from.sx,from.sy);ctx.lineTo(to.sx,to.sy)
        } else if(fromInSlice || toInSlice) {
          const t=(1/splitDepth-1/from.depth)/(1/to.depth-1/from.depth)
          const x=from.sx+(to.sx-from.sx)*t,y=from.sy+(to.sy-from.sy)*t
          ctx.moveTo(fromInSlice?from.sx:x,fromInSlice?from.sy:y)
          ctx.lineTo(toInSlice?to.sx:x,toInSlice?to.sy:y)
        }
      }
      ctx.setLineDash([5,3])
      if (pointFilter !== 'cross-domain') for (const strong of [false,true]) for (const muted of domainFocused && !strong ? [true,false] : [false]) {
        ctx.beginPath()
        ctx.strokeStyle=darkMode ? (strong?'#add9ff':'#7aa6cc') : (strong?'#386eb0':'#6385ad')
        ctx.globalAlpha=strong?0.96:crossOpacity(graph.cross.length)*(selected || muted ? FADED_RELATION_OPACITY : 1); ctx.lineWidth=strong?2.25:0.95
        for (const e of graph.cross) {
          if ((e.accent > 0) !== strong || isMutedRelation(e) !== muted || e.from.depth <= 0.05 || e.to.depth <= 0.05) continue
          line(e.from,e.to)
        }
        ctx.stroke()
      }
      ctx.setLineDash([])
      for (const group of groups) {
        const c = group.nodes[0]
        const depthOpacity = selected ? 1 : globeOpacity(c.depth, view.dist, graph.sphereRadius)
        const tint = darkMode ? group.darkColor : group.color
        ctx.strokeStyle=ctx.fillStyle=tint
        for (const faded of selected || domainFocused ? [true, false] : [false]) {
          const opacity = (faded ? FADED_BRANCH_OPACITY : 1) * depthOpacity
          if (!pointFilter) for (const kind of [3,2,1]) for (const bridge of graph.regions.length ? [false,true] : [false]) {
            ctx.globalAlpha=(kind===1?0.77:kind===2?0.63:0.53)*opacity*(bridge ? 0.13 : 1)*(darkMode ? 0.68 : 1)
            ctx.lineWidth=kind===1?1.45:kind===2?1.2:0.95; ctx.beginPath()
            for (const n of group.nodes) {
              if(n.kind!==kind || n.depth<=0.05 || n.parent.depth<=0.05 || !(n.visible || n.parent.visible) || isFaded(n, selected)!==faded) continue
              if ((n.domain!==n.parent.domain && n.accent<0.1)!==bridge) continue
              line(n.parent,n)
            }
            ctx.stroke()
          }
          // Lift the detached dots' opacity during domain focus, leaving their edges muted.
          const emphasizeUnassigned = faded && domainFocused
          for (const detached of emphasizeUnassigned ? [false, true] : [false]) {
            ctx.globalAlpha=detached ? FADED_UNASSIGNED_OPACITY*depthOpacity : opacity
            ctx.beginPath()
            for (const n of group.nodes) {
              if(!n.kind || !n.visible || (n.depth>splitDepth)!==rear || isFaded(n, selected)!==faded) continue
              if (Boolean(emphasizeUnassigned && n.unassigned) !== detached) continue
              const r=n.diameter*0.34
              ctx.moveTo(n.sx+r,n.sy); ctx.arc(n.sx,n.sy,r,0,2*Math.PI)
            }
            ctx.fill()
          }
        }
        if(c.visible && (c.depth>splitDepth)===rear) {
          const r=c.diameter*0.35
          ctx.globalAlpha=(isFaded(c, selected)?FADED_COURSE_OPACITY:1)*depthOpacity
          const gradient=ctx.createRadialGradient(c.sx-r*0.3,c.sy-r*0.35,0,c.sx,c.sy,r)
          gradient.addColorStop(0,'#eef6ff'); gradient.addColorStop(0.5,tint); gradient.addColorStop(1,tint)
          ctx.fillStyle=gradient; ctx.beginPath()
          for(const [i, xy] of MARKERS[group.style].entries()) {
            const x=c.sx+xy[0]*r,y=c.sy+xy[1]*r
            if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y)
          }
          ctx.closePath()
          if(group.style===7) { ctx.moveTo(c.sx+r*0.42,c.sy); ctx.arc(c.sx,c.sy,r*0.42,0,2*Math.PI) }
          ctx.fill('evenodd')
        }
      }
    }
    return {
      setPointFilter(filter) { pointFilter = filter },
      setDomainFocus(index) { domainFocused = index !== null },
      selection(node) {
        groups = node ? [...graph.groups.filter(g => g.index !== node.ci), graph.groups[node.ci]] : [...graph.groups]
      },
      resize(width, height, dpr) {
        w=width; h=height; canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr)
        ctx?.setTransform(dpr,0,0,dpr,0,0)
      },
      draw(view, axes, selected, core, darkMode) {
        if (!ctx) return
        ctx.clearRect(0,0,w,h)
        if (!selected) groups.sort((a,b) => b.nodes[0].depth - a.nodes[0].depth)
        if (core) {
          drawSlice(view, selected, core.depth, true, darkMode)
          ctx.globalAlpha=1
          ctx.globalCompositeOperation='destination-out'
          ctx.drawImage(nucleus,core.x,core.y,core.size,core.size)
          ctx.globalCompositeOperation='source-over'
        }
        drawSlice(view, selected, core?.depth ?? Infinity, false, darkMode)
        if (selected) {
          ctx.globalAlpha=1; ctx.lineWidth=1.4
          for(const n of graph.nodes) if(n.visible && n.accent>=0.8) {
            ctx.strokeStyle=darkMode?'#c7e8ff':graph.groups[n.ci].color; ctx.beginPath()
            ctx.arc(n.sx,n.sy,n.diameter*0.45+1,0,Math.PI*2); ctx.stroke()
          }
        }
        ctx.globalAlpha=1
      },
      destroy() {},
    }
  }

  function basis(view) {
    return { sx: Math.sin(view.yaw), cx: Math.cos(view.yaw), sp: Math.sin(view.pitch), cp: Math.cos(view.pitch) }
  }

  // CPU projection is shared by label placement, picking and the 2D backend.
  function project(node, view, a, w, h, focal) {
    const x = node.x - view.x, y = node.y - view.y, z = node.z - view.z
    const along = x * a.sx + z * a.cx
    const depth = view.dist - (along * a.cp + y * a.sp)
    node.depth = depth
    if (depth <= 0.05) { node.visible = false; return }
    const scale = focal / depth
    node.sx = w / 2 + (x * a.cx - z * a.sx) * scale
    node.sy = h / 2 - (y * a.cp - along * a.sp) * scale
    node.visible = node.sx >= -18 && node.sx <= w + 18 && node.sy >= -18 && node.sy <= h + 18
    node.diameter = (node.kind === 0 ? clamp(23 + scale, 23, 43) : node.kind === 1 ? clamp(10 + scale * 0.82, 10, 25)
      : node.kind === 2 ? clamp(7.2 + scale * 0.60, 7.2, 20) : clamp(4.2 + scale * 0.51, 4.2, 17)) * (1 + node.accent * 0.42)
    if (node.accent === 1) node.diameter = Math.max(node.diameter, node.kind === 0 ? 40 : 28)
  }

  function mount(host, options = {}) {
    const doc = host.ownerDocument
    const courses = Array.isArray(options.courses) ? options.courses : []
    let domainsVisible = options.domainsVisible !== false
    let darkMode = options.darkMode === true
    const atlas = options.atlas
    const graph = makeGraph(courses, options.relations, atlas)
    const filteredCourses = {
      'cross-course': new Set(graph.crossNodes.map(node => node.ci)),
      'cross-domain': new Set(graph.sharedNodes.map(node => node.ci))
    }
    let pointFilter = ''
    const matchesPointFilter = node => !pointFilter || (pointFilter === 'cross-course' ? node.relations.length > 0 : Boolean(node.domains))
    const homeYaw=atlas ? 1.50 : HOME_YAW, homePitch=atlas ? .54 : HOME_PITCH
    const satellites=atlas ? global.KnowledgeDomainAtlas.satellites(atlas,graph.sphereRadius,homeYaw,homePitch) : []
    const outerSatellite=satellites[0]?.position
    const satelliteRadius=outerSatellite ? Math.hypot(outerSatellite.x,outerSatellite.y,outerSatellite.z) : 0
    const previousPosition = host.style.position
    if (global.getComputedStyle(host).position === 'static') host.style.position = 'relative'
    const stage = doc.createElement('div')
    stage.className = 'knowledge-scene'
    stage.dataset.nodes = String(graph.nodes.length)
    stage.dataset.relations = String(graph.cross.length)
    stage.dataset.layouts = String(Math.min(LAYOUTS.length, graph.groups.length))
    stage.style.cssText = 'position:absolute;inset:0;overflow:hidden;overscroll-behavior:contain;touch-action:none;isolation:isolate;user-select:none'
    function makeSurface() {
      const surface = doc.createElement('canvas')
      surface.className = 'knowledge-scene-points'
      surface.tabIndex = 0
      surface.setAttribute('aria-label', '三维课程知识图谱。方向键旋转，加减键缩放，Home 键恢复当前视图。')
      surface.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none;cursor:grab;outline-offset:-3px'
      return surface
    }
    let canvas = makeSurface()
    stage.appendChild(canvas)
    const labels = doc.createElement('div')
    labels.className = 'knowledge-scene-labels'
    labels.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden'
    stage.appendChild(labels)
    const hoverRing = doc.createElement('span')
    hoverRing.className = 'knowledge-scene-hover'
    hoverRing.setAttribute('aria-hidden', 'true')
    hoverRing.style.cssText = 'position:absolute;left:0;top:0;box-sizing:border-box;border:1.5px solid;border-radius:50%;pointer-events:none'
    hoverRing.hidden = true
    stage.appendChild(hoverRing)
    host.appendChild(stage)
    const terrain = atlas ? global.KnowledgeDomainAtlasPaint.mount(stage,graph,atlas,satellites,{
      onGoal:index=>{
        if (locateGoal(index, false)) options.onAtlasSelect?.('goal', index)
      },
      onDomain:selectDomain,
    }) : null
    let backend
    try { backend = makeGPU(canvas, graph, terrain?.nucleus) } catch { /* Start a fresh canvas before switching context types. */ }
    if (!backend) {
      const fallback = makeSurface()
      canvas.replaceWith(fallback)
      canvas = fallback
      backend = makeCanvas(canvas, graph, terrain?.nucleus)
      stage.dataset.renderer = 'canvas'
    } else stage.dataset.renderer = 'webgl'
    const measure = doc.createElement('canvas').getContext('2d')
    let w = 0, h = 0, dpr = 1, focal = 1, overviewDist = 200, minDist = 3, maxDist = 100000
    let selected = null, activeGoal = null, activeDomain = null, hover = null, motion = null, frame = 0, destroyed = false
    let view = { x: 0, y: 0, z: 0, yaw: homeYaw, pitch: homePitch, dist: 200 }
    const reducedMotion = global.matchMedia?.('(prefers-reduced-motion: reduce)')
    let orbiting = graph.nodes.length > 0, lastOrbitTime = null
    let cameraWasMoved = false, focusedDistance = 200, leafDistanceRatio = 1, notifyingReset = false
    const labelPool = [], textWidths = new Map(), hitLabels = [], listeners = [], pointers = new Map()
    let gesture = null
    // Prefer label positions whose centre remains available as a separate click target.
    const cellSize = 8
    let dotColumns = 0, dotCells = new Uint8Array(0)
    const dotCell = (x, y) => Math.floor(y / cellSize) * dotColumns + Math.floor(x / cellSize)

    function listen(element, type, callback, opts) {
      element.addEventListener(type, callback, opts)
      listeners.push(() => element.removeEventListener(type, callback, opts))
    }
    function request() {
      if (!destroyed && !frame) frame = global.requestAnimationFrame(draw)
    }
    function pauseRotation() {
      orbiting = false
      lastOrbitTime = null
    }
    function setGoal(index) {
      if(destroyed || index===activeGoal || (pointFilter && index!==null)) return false
      activeGoal=index
      if(index===null) delete stage.dataset.goalFocused
      else {
        stage.dataset.goalFocused='true'
        pauseRotation()
      }
      options.onGoalChange?.(index)
      request()
      return true
    }
    function clearGoal() { return setGoal(null) }
    function setDomain(index) {
      if (activeDomain === index) return false
      activeDomain = index
      const domain = graph.regions[index]?.domain
      const members = new Set(domain?.members.map(member => member.key))
      for (const node of graph.nodes) {
        node.domainMuted = Boolean(domain && !members.has(node.path.join('/')))
      }
      if (index === null) delete stage.dataset.domainFocused
      else stage.dataset.domainFocused = String(index)
      hover = null
      backend.setDomainFocus(index)
      request()
      return true
    }
    function clearDomain() { return setDomain(null) }
    function locateDomain(index) {
      const region = graph.regions[index]
      if (destroyed || !domainsVisible || !region || region.domain.deleted) return false
      if (selected || activeGoal !== null) mark(null)
      pauseRotation()
      cameraWasMoved = false
      leafDistanceRatio = 1
      setDomain(index)
      const { x, y, z } = region.center
      const heading = Math.atan2(x,z) - view.yaw
      const yaw = view.yaw + Math.atan2(Math.sin(heading), Math.cos(heading))
      const pitch = Math.atan2(y, Math.hypot(x,z))
      go(fit(null, yaw, pitch))
      return true
    }
    function selectDomain(index) {
      if (locateDomain(index)) options.onAtlasSelect?.('domain', index)
    }
    function locateGoal(index, recenter = true) {
      const satellite=satellites.find(s=>s.index===index)
      if (destroyed || pointFilter || !domainsVisible || !satellite) return false
      recenter ||= Boolean(selected)
      if (selected) mark(null)
      else clearDomain()
      pauseRotation()
      setGoal(index)
      if (recenter) {
        cameraWasMoved = false
        leafDistanceRatio = 1
        // Keep the selected satellite on the near side, clear of the core label.
        const {x,y,z}=satellite.position, delta=Math.atan2(x,z)-view.yaw
        const latitude=Math.atan2(y,Math.hypot(x,z))
        go(fit(null,view.yaw+Math.atan2(Math.sin(delta),Math.cos(delta)),latitude+(latitude>0 ? -.70 : .70)))
      }
      return true
    }
    const locator=doc.createElement('div'), map=doc.createElement('div'), cursor=doc.createElement('i')
    locator.className='knowledge-scene-locator'
    if (atlas) locator.dataset.atlas='true'
    locator.setAttribute('role','group')
    locator.setAttribute('aria-label','全图定位')
    locator.style.cssText='position:absolute;z-index:2;right:10px;top:10px;box-sizing:border-box;padding:6px 8px;border:1px solid;border-radius:8px'
    const caption=doc.createElement(atlas?'button':'span')
    caption.textContent=atlas?'球面展开图':'全图定位'
    caption.style.cssText='display:block;font:600 10px/12px '+FONT
    let mapExpanded=false
    if(atlas) {
      caption.type='button';caption.className='kdg-map-toggle'
      caption.setAttribute('aria-expanded','false')
      caption.setAttribute('aria-label','放大球面展开图')
      listen(caption,'click',()=>{
        mapExpanded=!mapExpanded
        locator.dataset.expanded=String(mapExpanded)
        caption.setAttribute('aria-expanded',String(mapExpanded))
        caption.setAttribute('aria-label',mapExpanded?'收起球面展开图':'放大球面展开图')
        sizeLocator();request()
      })
    }
    map.style.cssText='position:relative;margin-top:3px;height:calc(100% - 15px)'
    cursor.style.cssText='position:absolute;pointer-events:none;box-sizing:border-box;width:15px;height:15px;transform:translate(-50%,-50%);border:1px dashed;border-radius:50%'
    locator.appendChild(caption); locator.appendChild(map); map.appendChild(cursor); stage.appendChild(locator)
    locator.hidden=true; locator.style.display='none'
    let mapCanvas=null
    function paintMap() {
      locator.dataset.domains=String(domainsVisible)
      global.KnowledgeDomainAtlasPaint.miniature(mapCanvas, domainsVisible ? graph.regions : [], darkMode)
    }
    if(atlas) {
      mapCanvas=doc.createElement('canvas')
      mapCanvas.className='kdg-atlas-map'
      mapCanvas.setAttribute('aria-hidden','true')
      map.appendChild(mapCanvas)
      listen(mapCanvas,'click',event=>{
        if (!domainsVisible) return
        const rect=mapCanvas.getBoundingClientRect(),u=(event.clientX-rect.left)/rect.width,v=(event.clientY-rect.top)/rect.height
        const lon=(u-.5)*2*Math.PI,lat=(.5-v)*Math.PI
        const x=Math.sin(lon)*Math.cos(lat),y=Math.sin(lat),z=Math.cos(lon)*Math.cos(lat)
        const region = graph.regions.findIndex(r => !r.domain.deleted && global.KnowledgeDomainAtlas.inside(r,{x,y,z},false))
        if (region !== -1) selectDomain(region)
      })
    }
    // Unwrap the sphere so front and back courses have distinct targets on the locator.
    const mapX=({x,z})=>50 + (atlas?50:44) * Math.atan2(x,z) / Math.PI
    const mapY=({x,y,z})=>50 - (atlas?100:88) * Math.atan2(y,Math.hypot(x,z)) / Math.PI
    const dots=graph.groups.map(group=>{
      const root=group.nodes[0], dot=doc.createElement('button'), signal=doc.createElement('i')
      dot.type='button'; dot.setAttribute('aria-label','定位课程，'+root.name)
      if (!atlas) dot.title=root.name
      dot.setAttribute('aria-pressed','false'); dot.dataset.course=String(root.ci)
      const size=graph.groups.length<=16?15:8
      dot.style.cssText='position:absolute;display:grid;place-items:center;transform:translate(-50%,-50%);padding:0;border:0;border-radius:50%;background:transparent;cursor:pointer;width:'+size+'px;height:'+size+'px;left:'+mapX(root)+'%;top:'+mapY(root)+'%'
      signal.style.cssText='display:block;pointer-events:none;width:'+(size===15?7:4)+'px;height:'+(size===15?7:4)+'px;border-radius:50%'
      dot.appendChild(signal); map.appendChild(dot)
      listen(dot,'click',()=>{focus(root.ci);select(root)})
      return dot
    })
    let mapBox=null, mapVisible=false, activeDot=null
    function courseTint(ci) {
      const group = graph.groups[ci]
      return darkMode ? group.darkColor : group.color
    }
    function paintSceneTheme() {
      stage.dataset.theme = darkMode ? 'dark' : 'light'
      locator.style.background = darkMode ? 'rgba(17,34,52,.96)' : 'rgba(255,255,255,.94)'
      locator.style.borderColor = darkMode ? '#39516a' : '#d9e2f0'
      locator.style.boxShadow = darkMode ? '0 2px 8px #02091366' : '0 2px 8px #3044640b'
      caption.style.color = darkMode ? '#b4c8da' : '#62748b'
      cursor.style.borderColor = darkMode ? '#c5e2ff' : '#677c9e'
      hoverRing.style.boxShadow = darkMode ? '0 0 0 1px #091522' : '0 0 0 1px white'
      for (const [ci, dot] of dots.entries()) dot.children[0].style.background = courseTint(ci)
      if (activeDot !== null) dots[activeDot].style.boxShadow = '0 0 0 1.5px ' + courseTint(activeDot)
      if (mapCanvas) paintMap()
    }
    function setDarkMode(value) {
      const next = value === true
      if (destroyed || next === darkMode) return
      darkMode = next
      paintSceneTheme()
      request()
    }
    function sizeLocator() {
      const compact=w<=680 || h<320
      const mapW=atlas ? (mapExpanded ? Math.min(328,w-20) : compact?100:178) : compact?84:116
      const mapH=atlas ? (mapExpanded ? Math.min(188,h-28) : compact?71:109) : compact?65:86
      mapBox={x:w-mapW-10,y:compact?h-mapH-9:10,w:mapW,h:mapH}
      locator.style.width=mapW+'px'; locator.style.height=mapH+'px'
      locator.style.top=compact?'auto':'10px'; locator.style.bottom=compact?'9px':'auto'
    }
    function updateLocator() {
      const visible=Boolean(atlas) || (graph.groups.length>1 && (Boolean(selected) || overviewDist/view.dist>1.15))
      if(visible!==mapVisible) { locator.hidden=!visible; locator.style.display=visible?'block':'none'; mapVisible=visible }
      const idx=selected?.ci ?? null
      if(idx!==activeDot) {
        if(activeDot!==null) { dots[activeDot].setAttribute('aria-pressed','false'); dots[activeDot].style.boxShadow='none' }
        if(idx!==null) { dots[idx].setAttribute('aria-pressed','true'); dots[idx].style.boxShadow='0 0 0 1.5px '+courseTint(idx) }
        activeDot=idx
      }
      if(visible) {
        cursor.hidden=Boolean(selected && (!atlas || selected.domains)); cursor.style.display=cursor.hidden?'none':'block'
        if(atlas && selected) {cursor.style.left=mapX(selected)+'%';cursor.style.top=mapY(selected)+'%'}
        if(!selected) {
          const axes=basis(view)
          const centre = {x:view.x+axes.sx*axes.cp*graph.sphereRadius,y:view.y+axes.sp*graph.sphereRadius,z:view.z+axes.cx*axes.cp*graph.sphereRadius}
          cursor.style.left=mapX(centre)+'%'; cursor.style.top=mapY(centre)+'%'
        }
      }
    }
    function fit(node, yaw, pitch) {
      const centre = node || graph.center
      const target = { x:centre.x, y:centre.y, z:centre.z, yaw, pitch, dist:16 }
      const axes = basis(target)
      const distance = (n, fraction) => {
        const x=n.x-target.x,y=n.y-target.y,z=n.z-target.z, along=x*axes.sx+z*axes.cx
        const front=along*axes.cp+y*axes.sp
        return Math.max(front+Math.abs(x*axes.cx-z*axes.sx)*focal/Math.max(15,w*fraction-12),
          front+Math.abs(y*axes.cp-along*axes.sp)*focal/Math.max(15,h*fraction-12),front+12)
      }
      if (!node) {
        if (graph.sphereRadius) {
          const screenRadius = Math.max(15, satelliteRadius ? Math.min(w/2-42,h/2-54) : Math.min(w,h)*.46-12)
          const radius = Math.max(graph.outerRadius*(atlas?1.09:1),satelliteRadius)
          target.dist = radius * Math.hypot(1, focal / screenRadius)
        } else {
          for (const n of graph.nodes) target.dist=Math.max(target.dist,distance(n,0.42))
        }
        return target
      }
      // Frame only the local branch. Distant relations remain navigable without
      // pulling the camera away from the node the user actually selected.
      const halfSpan = [36, 21, 12, 7][node.kind]
      target.dist = Math.max(target.dist, focal * halfSpan / Math.max(15, Math.min(w,h) * 0.40))
      const local = node.parent ? [node.parent, ...node.children] : graph.groups[node.ci].nodes
      for (const n of local) if (n.domain===node.domain) target.dist=Math.max(target.dist,distance(n,0.40))
      return target
    }
    function go(target) {
      if (reducedMotion?.matches) { view = target; motion = null }
      else motion = { from: { ...view }, target, start: global.performance.now() }
      request()
    }
    function mark(node) {
      clearGoal()
      clearDomain()
      for (const n of graph.nodes) n.accent=0
      for (const edge of graph.cross) edge.accent=0
      if (node) {
        if (node.kind) {
          const descendants=[...node.children]
          for (let i=0;i<descendants.length;i++) { descendants[i].accent=0.18; descendants.push(...descendants[i].children) }
        }
        for (let ancestor=node.parent; ancestor; ancestor=ancestor.parent) ancestor.accent=0.42
        if (node.kind === 3) {
          for (const sibling of node.parent.children) if (sibling.kind === 3) sibling.accent = 0.18
        }
        for (const edge of node.relations) {
          edge.accent=1
          const peer=edge.from===node?edge.to:edge.from
          peer.accent=0.82
        }
        node.accent=1
      }
      selected=node; hover=null
      stage.dataset.selection=node ? JSON.stringify(node.path) : ''
      stage.dataset.activeRelations=String(node?.relations.length || 0)
      backend.selection(node)
      updateLocator()
    }
    function focus(ci, ui=null, si=null, pi=null) {
      if (destroyed) return
      if (ci===null) { reset(); return }
      const node=graph.lookup.get(JSON.stringify([ci,ui,si,pi]))
      if (!node || (pi!==null && !matchesPointFilter(node)) || (!cameraWasMoved && node===selected)) return
      pauseRotation()
      let yaw = view.yaw, pitch = view.pitch
      if (graph.sphereRadius) {
        const heading = Math.atan2(node.x, node.z) - yaw
        yaw += Math.atan2(Math.sin(heading), Math.cos(heading))
        pitch = Math.atan2(node.y, Math.hypot(node.x, node.z))
      }
      const target=fit(node,yaw,pitch)
      focusedDistance=target.dist
      // Keep a closer manual inspection distance when recentering on a visible leaf.
      leafDistanceRatio = node.kind === 3 && cameraWasMoved && node.visible
        ? Math.min(1, Math.max(minDist, node.depth) / focusedDistance) : 1
      target.dist *= leafDistanceRatio
      mark(node); cameraWasMoved=false
      go(target)
    }
    function reset() {
      if (destroyed) return
      if(notifyingReset) return
      mark(null); cameraWasMoved=false; leafDistanceRatio=1
      orbiting = graph.nodes.length > 0
      lastOrbitTime = null
      const nearestHomeYaw = homeYaw + Math.round((view.yaw - homeYaw) / FULL_TURN) * FULL_TURN
      go(fit(null,nearestHomeYaw,homePitch))
      notifyingReset=true
      try { options.onReset?.() } finally { notifyingReset=false }
    }
    function resize() {
      if (destroyed) return
      const nw = host.clientWidth, nh = host.clientHeight
      if (nw <= 0 || nh <= 0) return
      const ratio = clamp(global.devicePixelRatio || 1, 1, 2)
      if (w === nw && h === nh && dpr === ratio) return
      const oldFit = w && h ? fit(selected, view.yaw, view.pitch).dist : 0
      w = nw; h = nh; dpr = ratio; focal = h / (2 * TAN)
      dotColumns = Math.ceil(w / cellSize)
      dotCells = new Uint8Array(dotColumns * Math.ceil(h / cellSize))
      const home = fit(null, homeYaw, homePitch)
      overviewDist = home.dist
      maxDist = Math.max(home.dist * 4.5, 200)
      minDist = Math.min(4, home.dist * 0.025)
      const heading = motion?.target || view
      const wasTravelling = Boolean(motion)
      motion = null
      sizeLocator()
      const resized = fit(selected, heading.yaw, heading.pitch)
      if(selected) focusedDistance=resized.dist
      if (cameraWasMoved && oldFit > 0) view.dist = clamp(view.dist * resized.dist / oldFit, minDist, maxDist)
      else {
        resized.dist = Math.max(minDist, resized.dist * leafDistanceRatio)
        if (wasTravelling) go(resized)
        else view = resized
      }
      backend.resize(w, h, dpr)
      terrain?.resize(w,h,dpr)
      request()
    }

    function labelWidth(n) {
      const size = n.kind === 0 ? 12 : 11
      const key = n.kind + '/' + n.name
      if (!textWidths.has(key)) {
        if (measure) measure.font = (n.kind === 0 ? '600 ' : '500 ') + size + 'px ' + FONT
        const measured = measure ? measure.measureText(n.name).width : n.name.length * size
        textWidths.set(key, Math.ceil(Math.min(measured, 174)) + (n.kind === 0 ? 16 : 12))
      }
      return Math.min(textWidths.get(key), Math.max(48, w * 0.52))
    }
    function takeLabel(i) {
      if (labelPool[i]) return labelPool[i]
      const el = doc.createElement('button')
      el.type = 'button'
      el.style.cssText = 'position:absolute;left:0;top:0;box-sizing:border-box;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;padding:0 5px;border:0;background:transparent;pointer-events:none;line-height:1;font-family:' + FONT
      labels.appendChild(el)
      labelPool.push(el)
      return el
    }
    function placeLabels() {
      hitLabels.length = 0
      const candidates = [], localZoom=focusedDistance/view.dist
      const domainFocused = activeDomain !== null
      for (const group of graph.groups) {
        for (const n of group.nodes) {
          if (!n.visible || !n.name) continue
          if (atlas && n !== selected && !(domainFocused && n.kind === 0 && !n.domainMuted)) continue
          const scale=focal/n.depth, ratio=overviewDist/view.dist
          if (selected) {
            if(n.ci!==selected.ci && n.kind>0 && n.accent<0.8 && n!==hover) continue
            if(selected.kind && n.ci===selected.ci && n.kind>0 && n.accent===0 && n!==hover) continue
            if(n.kind===3 && n!==hover && n!==selected && n.accent<0.8 && n.parent!==selected &&
              !(selected.kind===3 && n.parent===selected.parent) && localZoom<1.52) continue
          } else if(!pointFilter && n!==hover && ((n.kind===1 && (ratio<1.35 || scale<2.3)) ||
            (n.kind===2 && (ratio<1.65 || scale<3.3)) || (n.kind===3 && (ratio<1.9 || scale<4.5)))) continue
          candidates.push(n)
        }
      }
      const distance = n => Math.hypot((n.sx - w / 2) / w, (n.sy - h / 2) / h)
      function rank(n) {
        if(n===hover) return -10
        if(n===selected) return -9
        if(n.accent>=0.8) return -8
        if(n.parent===selected && selected) return -7
        if(n.accent>=0.4) return -6
        if(selected && n.ci!==selected.ci) return n.kind===0 ? 1.6 : 4
        return n.kind
      }
      candidates.sort((a,b)=>rank(a)-rank(b) || distance(a)-distance(b) || a.index-b.index)
      const overview = selected === null && overviewDist / view.dist < 1.35
      if (overview) {
        const distinctCells = new Set()
        const featured = []
        const others = []
        candidates.sort((a, b) => Number(b === hover) - Number(a === hover) ||
          Number(graph.groups[b.ci].isCore) - Number(graph.groups[a.ci].isCore) ||
          graph.groups[b.ci].nodes.length - graph.groups[a.ci].nodes.length || distance(a) - distance(b))
        for (const n of candidates) {
          const cell = Math.floor(n.sx * 4 / w) + '/' + Math.floor(n.sy * 3 / h)
          if (!distinctCells.has(cell)) { featured.push(n); distinctCells.add(cell) }
          else others.push(n)
        }
        candidates.splice(0, candidates.length, ...featured, ...others)
      }
      const maxLabels = overview ? (graph.groups.length <= 10 && w >= 700 && h >= 360 ? 10 : clamp(Math.floor(w * h / 49000), 5, 12))
        : clamp(Math.floor(w * h / (selected?.kind===0 ? 19000 : 13800)), 5, 41)
      let contextLabels=0, courseThemes=0, courseLeaves=0
      for (const n of candidates) {
        const distant=Boolean(selected && n.ci!==selected.ci && n.accent<0.8 && n!==hover)
        if(distant && contextLabels>=(selected?.kind===3 ? 2 : 4)) continue
        if(selected?.kind===0 && n.ci===selected.ci && n!==hover) {
          if(n.kind===2 && courseThemes>=(localZoom<1.35 ? 5 : 12)) continue
          if(n.kind===3 && courseLeaves>=9) continue
        }
        if (hitLabels.length >= maxLabels) break
        const lw = labelWidth(n), lh = n.kind === 0 ? 23 : 19, gap = n.diameter * 0.40 + 3
        const positions = [[n.sx + gap, n.sy - lh / 2], [n.sx - gap - lw, n.sy - lh / 2],
          [n.sx - lw / 2, n.sy + gap], [n.sx - lw / 2, n.sy - gap - lh]]
        let box
        for (const [x, y] of positions) {
          if (x < 5 || y < 5 || x + lw > w - 5 || y + lh > h - 5) continue
          if(mapVisible && mapBox && x<mapBox.x+mapBox.w+3 && x+lw+3>mapBox.x && y<mapBox.y+mapBox.h+3 && y+lh+3>mapBox.y) continue
          if (terrain?.boxes().some(r => x < r.x+r.w+2 && x+lw+2>r.x && y<r.y+r.h+2 && y+lh+2>r.y)) continue
          if (hitLabels.some(r => x < r.x + r.w + 4 && x + lw + 4 > r.x && y < r.y + r.h + 3 && y + lh + 3 > r.y)) continue
          const candidate = { x, y, w: lw, h: lh, node: n }
          if (!dotCells[dotCell(x + lw / 2, y + lh / 2)]) { box = candidate; break }
          box ??= candidate
        }
        if (!box) continue
        const el = takeLabel(hitLabels.length)
        if (el._knowledgeNode !== n || el._darkMode !== darkMode) {
          el._knowledgeNode = n
          el._darkMode = darkMode
          el.dataset.level = ['course','unit','section','point'][n.kind]
          el.dataset.path=JSON.stringify(n.path)
          el.dataset.layout=LAYOUTS[n.style][0]
          el.textContent = n.name
          el.title = n.name
          el.setAttribute('aria-label', ['课程','知识单元','主题','知识点'][n.kind] + '，' + n.name)
          el.style.fontSize = n.kind === 0 ? '12px' : '11px'
          el.style.color = darkMode ? (n.kind === 0 ? '#eff6ff' : n.kind === 1 ? '#d8e8f8' : '#c4d8e9')
            : (n.kind === 0 ? '#273956' : n.kind === 1 ? '#314661' : '#576981')
          el.style.border = 'none'
          const outline = darkMode ? '#081320' : '#fff'
          el.style.textShadow = `0 1px 2px ${outline},1px 0 2px ${outline},0 -1px 2px ${outline},-1px 0 2px ${outline}`
          el.style.borderRadius = n.kind === 0 ? '7px' : '4px'
        }
        if(distant) contextLabels++
        if(n.kind===2 && n.ci===selected?.ci) courseThemes++
        if(n.kind===3 && n.ci===selected?.ci) courseLeaves++
        const prominent=domainFocused || n===hover || (selected?.kind>0 && (n===selected || n.accent>=0.8))
        el.style.background=prominent ? (darkMode?'#142a41':'rgba(255,255,255,.98)')
          : n.kind===1 ? (darkMode?'rgba(13,29,46,.82)':'rgba(255,255,255,.76)') : 'transparent'
        el.style.boxShadow=prominent?'0 0 0 1px '+courseTint(n.ci)+'88,0 1px 3px #25355116':'none'
        el.style.fontWeight=prominent?'700':n.kind<2?'600':'500'
        const labelOpacity = distant ? clamp(0.32*view.dist/n.depth,0.20,0.38) : clamp(1.38*view.dist/n.depth,0.65,1)
        el.style.opacity=String(!selected && n!==hover ? labelOpacity*(0.60+0.40*globeOpacity(n.depth,view.dist,graph.sphereRadius)) : labelOpacity)
        el.hidden = false
        el.style.display = 'block'
        el.style.width = lw + 'px'; el.style.height = lh + 'px'
        el.style.transform = 'translate(' + Math.round(box.x) + 'px,' + Math.round(box.y) + 'px)'
        hitLabels.push(box)
      }
      for (let i = hitLabels.length; i < labelPool.length; i++) {
        labelPool[i].hidden = true
        labelPool[i].style.display = 'none'
      }
    }

    function draw(time) {
      frame = 0
      if (destroyed || !w || !h) return
      const animateOrbit = orbiting && !reducedMotion?.matches
      if (motion) {
        const t = clamp((time - motion.start) / 380, 0, 1)
        const ease = t * t * (3 - 2 * t)
        for (const key of ['x', 'y', 'z', 'yaw', 'pitch']) view[key] = motion.from[key] + (motion.target[key] - motion.from[key]) * ease
        view.dist = Math.exp(Math.log(motion.from.dist) * (1 - ease) + Math.log(motion.target.dist) * ease)
        if (t >= 1) motion = null
      }
      if (animateOrbit && !motion) {
        const elapsed = time - (lastOrbitTime ?? time)
        // Decreasing camera yaw turns the globe counterclockwise around its vertical axis.
        view.yaw = (view.yaw - elapsed * FULL_TURN / OVERVIEW_REVOLUTION_MS) % FULL_TURN
        lastOrbitTime = time
      }
      const a = basis(view)
      dotCells.fill(0)
      for (const group of graph.groups) {
        for (const n of group.nodes) {
          project(n, view, a, w, h, focal)
          if (!matchesPointFilter(n)) n.visible = false
          if (n.visible && n.sx >= 0 && n.sy >= 0 && n.sx < w && n.sy < h) dotCells[dotCell(n.sx, n.sy)] = 1
        }
      }
      updateLocator()
      const core=terrain?.draw(view,a,focal,selected,overviewDist,mapVisible?mapBox:null,domainsVisible,activeDomain,activeGoal,darkMode,Boolean(pointFilter))
      backend.draw(view, a, selected, core, darkMode)
      hoverRing.hidden = !hover?.visible
      if (hover?.visible) {
        const size = Math.max(13, hover.diameter + 4)
        hoverRing.style.width = hoverRing.style.height = size + 'px'
        hoverRing.style.borderColor = courseTint(hover.ci)
        hoverRing.style.transform = 'translate(' + (hover.sx - size / 2) + 'px,' + (hover.sy - size / 2) + 'px)'
      }
      placeLabels()
      if (motion || animateOrbit) request()
    }

    function captureFrame() {
      if (destroyed || !w || !h) throw new Error('图谱画布暂不可用')
      const snapshot = doc.createElement('canvas')
      snapshot.width = canvas.width
      snapshot.height = canvas.height
      const context = snapshot.getContext('2d')
      if (!context) throw new Error('无法生成图谱图片')
      // Copy the WebGL surface in the same frame, before the browser clears its buffer.
      if (frame) global.cancelAnimationFrame(frame)
      draw(global.performance.now())
      context.drawImage(canvas, 0, 0)
      return snapshot
    }

    function translate(dx, dy, scale) {
      const a = basis(view)
      view.x += (dx * a.cx - dy * a.sx * a.sp) * scale
      view.y += dy * a.cp * scale
      view.z += (-dx * a.sx - dy * a.cx * a.sp) * scale
    }
    function zoom(factor, x = w / 2, y = h / 2) {
      if (destroyed || !(factor > 0) || !Number.isFinite(factor)) return
      pauseRotation()
      motion = null; cameraWasMoved = true
      const next = clamp(view.dist / factor, minDist, maxDist)
      if(selected && factor<1 && next>=overviewDist*0.86) { reset(); return }
      translate(x - w / 2, h / 2 - y, (view.dist - next) / focal)
      view.dist = next
      hover = null
      request()
    }
    function rotate(dx, dy) {
      pauseRotation()
      motion = null; cameraWasMoved = true
      view.yaw -= dx * 0.006
      view.pitch = clamp(view.pitch + dy * 0.006, -1.45, 1.45)
      request()
    }
    function at(e) {
      const rect = canvas.getBoundingClientRect()
      // Pointer events use viewport CSS pixels; the workspace can scale the entire canvas.
      const scaleX = w / rect.width, scaleY = h / rect.height
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY,
        hitRadius: (e.pointerType === 'touch' ? 16 : 9) * Math.min(scaleX, scaleY) }
    }
    function pick({x, y, hitRadius}) {
      const label=terrain?.boxes().find(b=>b.act && x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h)
      if(label) return label
      let direct = null, nearby = null, directGap = Infinity, nearbyGap = Infinity
      for (const n of graph.nodes) {
        if (!n.visible) continue
        const gap = (x - n.sx) ** 2 + (y - n.sy) ** 2
        const core = Math.max(2, n.diameter * 0.37)
        if (gap <= core * core && (gap < directGap || (gap === directGap && n.depth < direct.depth))) {
          direct = n; directGap = gap
        }
        if (gap <= Math.max(hitRadius, core + 3) ** 2 && gap < nearbyGap) {
          nearby = n; nearbyGap = gap
        }
      }
      // A painted dot can sit inside another node's mostly transparent label box.
      if (direct) return direct
      for (const r of hitLabels) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.node
      if (nearby) return nearby
      const region = domainsVisible ? terrain?.regionAt(x, y) ?? -1 : -1
      return region === -1 ? null : {act: () => selectDomain(region)}
    }
    function select(n) {
      if (n) options.onSelect?.(...n.path)
    }
    function pair() {
      const [a, b] = pointers.values()
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) }
    }
    function startPointer(e) {
      if (e.button !== 0 && e.button !== 1 && e.button !== 2) return
      pauseRotation()
      const p = at(e)
      pointers.set(e.pointerId, p)
      canvas.setPointerCapture?.(e.pointerId)
      if (pointers.size === 1) gesture = { start: p, target: pick(p), moved: false }
      else if (gesture) { gesture.moved = true; gesture.pair = pair() }
      canvas.style.cursor = 'grabbing'
      canvas.style.outline = 'none'
      e.preventDefault()
      canvas.focus({ preventScroll: true })
    }
    listen(canvas,'pointerdown',startPointer)
    if(terrain) listen(terrain.layer,'pointerdown',startPointer)
    listen(canvas, 'pointermove', e => {
      const p = at(e), prev = pointers.get(e.pointerId)
      if (!prev) {
        if (pointers.size || e.pointerType === 'touch') return
        const n = pick(p)
        const node=n?.act ? null : n
        if (node !== hover) { hover = node; request() }
        canvas.style.cursor = n ? 'pointer' : 'grab'
        return
      }
      if (!gesture) return
      pointers.set(e.pointerId, p)
      if (pointers.size >= 2) {
        const current = pair(), old = gesture.pair || current
        if (current.distance > 0 && old.distance > 0) zoom(current.distance / old.distance, old.x, old.y)
        translate(old.x - current.x, current.y - old.y, view.dist / focal)
        gesture.pair = current
        request()
      } else {
        if (!gesture.moved && Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) <= 4) return
        if (!gesture.moved) { prev.x = gesture.start.x; prev.y = gesture.start.y }
        gesture.moved = true
        hover = null
        if (e.shiftKey || (e.buttons & 6)) {
          cameraWasMoved = true; motion = null
          translate(prev.x - p.x, p.y - prev.y, view.dist / focal); request()
        } else rotate(p.x - prev.x, p.y - prev.y)
      }
      e.preventDefault()
    })
    function finish(e, clicked) {
      if (!pointers.has(e.pointerId)) return
      const target = gesture?.target
      const p = at(e), tap = clicked && pointers.size === 1 && gesture && !gesture.moved &&
        Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) <= 4 && e.button === 0
      pointers.delete(e.pointerId)
      if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
      if (pointers.size) gesture = { start: pointers.values().next().value, moved: true, pair: pointers.size >= 2 ? pair() : null }
      else { gesture = null; canvas.style.cursor = 'grab' }
      if (tap) {
        if(target?.act) target.act()
        else if(target) select(target)
        else if (options.onBlankTap && !terrain?.containsGlobe?.(p.x, p.y)) options.onBlankTap()
        else reset()
      }
    }
    listen(canvas, 'pointerup', e => finish(e, true))
    listen(canvas, 'pointercancel', e => finish(e, false))
    listen(canvas, 'lostpointercapture', e => finish(e, false))
    listen(canvas, 'pointerleave', () => { if (!pointers.size && hover) { hover = null; request() } })
    listen(canvas, 'contextmenu', e => e.preventDefault())
    function wheelZoom(e) {
      e.preventDefault()
      const p = at(e), multiplier = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? h : 1
      zoom(Math.exp(-clamp(e.deltaY * multiplier, -400, 400) * 0.0025), p.x, p.y)
    }
    listen(canvas,'wheel',wheelZoom,{passive:false})
    if(terrain) listen(terrain.layer,'wheel',wheelZoom,{passive:false})
    listen(canvas, 'blur', () => { canvas.style.outline = '' })
    listen(canvas, 'keydown', e => {
      canvas.style.outline = ''
      switch (e.key) {
        case 'ArrowLeft': rotate(-16, 0); break
        case 'ArrowRight': rotate(16, 0); break
        case 'ArrowUp': rotate(0, -16); break
        case 'ArrowDown': rotate(0, 16); break
        case '+': case '=': zoom(1.25); break
        case '-': case '_': zoom(0.8); break
        case 'Home': reset(); break
        default: return
      }
      e.preventDefault()
    })
    listen(labels, 'click', e => select(e.target._knowledgeNode))
    const observer = global.ResizeObserver ? new global.ResizeObserver(resize) : null
    observer?.observe(host)
    listen(canvas, 'webglcontextrestored', () => { if (w && h) { backend.resize(w, h, dpr); request() } })
    listen(global, 'resize', resize)
    if (reducedMotion?.addEventListener) listen(reducedMotion, 'change', () => {
      lastOrbitTime = null
      request()
    })
    function setPointFilter(filter) {
      if (destroyed || pointFilter===filter) return
      pointFilter = filter
      backend.setPointFilter(filter)
      hover = null
      if (filter) clearGoal()
      for (const [ci, dot] of dots.entries()) {
        dot.hidden = Boolean(filter && !filteredCourses[filter].has(ci))
        dot.style.display = dot.hidden ? 'none' : 'grid'
      }
      request()
    }
    function setCrossCourseOnly(value) { setPointFilter(value ? 'cross-course' : '') }
    setPointFilter(options.pointFilter || (options.crossCourseOnly === true ? 'cross-course' : ''))
    paintSceneTheme()
    resize()
    return { focus, zoom, reset, pauseRotation, clearGoal, locateGoal, clearDomain, locateDomain, setDarkMode, setCrossCourseOnly, setPointFilter, captureFrame, setDomainsVisible(show) {
      if(destroyed || !atlas || domainsVisible===show) return
      domainsVisible=show
      if(!show) { clearGoal(); clearDomain() }
      paintMap();request()
    }, destroy() {
      if (destroyed) return
      destroyed = true
      if (frame) global.cancelAnimationFrame(frame)
      observer?.disconnect()
      for (const unlisten of listeners) unlisten()
      pointers.clear()
      backend.destroy()
      stage.remove()
      if (previousPosition !== host.style.position && host.style.position === 'relative') host.style.position = previousPosition
    } }
  }

  global.KnowledgeDomainScene = { mount, color, appearance }
})(window)
