// Shared semantic layer and spherical coordinates for the globe and its unfolded map.
;(function (root) {
  const sectors = [
    ['数字建模与深化设计', ['B261306','B261320'], ['BIM','深化设计','建筑信息模型','多专业协同'],
      '围绕建筑信息模型的建立、协同与交付，涵盖构件参数设置、多专业模型整合、碰撞检查和装配式构件深化设计，用于校核设计接口、编制深化图纸并交付模型成果。'],
    ['工程测量与监测', ['B261307','B261313'], ['智能测量','智能检测','监测','无人机'],
      '围绕施工定位和结构状态观测，涵盖控制网布设、坐标转换、施工放样、变形观测与无损检测，用于复核构件位置、判读监测异常并记录检测结果。'],
    ['建筑结构与施工', ['B261305','B261311'], ['建筑结构','施工技术','施工工艺','装配式建筑','专项方案'],
      '从结构图纸和构件受力出发，涵盖荷载传递、钢筋构造、预制构件吊装与连接、施工工序和隐蔽工程验收，用于编制施工方案并核查现场施工质量。'],
    ['智能装备与物联', ['B261322','B261324'], ['机器人','智能装备','智慧工地','装备应用','自动控制'],
      '围绕施工机器人与工地感知设备的协同运行，涵盖机器人坐标标定、作业轨迹设置、传感器接入、无线通信及故障诊断，用于现场设备联调和运行状态监控。'],
    ['工程经济与项目管理', ['B261310','B261317'], ['项目管理','工程管理','管理优化','工地管理','工程计价'],
      '围绕工程造价与项目履约，涵盖工程量计算、清单计价、合同变更、进度计划和成本控制，用于核对工程价款、分析进度与成本偏差并组织项目交付。'],
  ]
  // Specific concepts can belong to a different field from their teaching course.
  // Within a field these families also place related branches from different courses together.
  const families = [
    [/BIM|建模|模型链接|基线模型|模型轻量化/i, /深化设计|模型拆件|族库|参数化|生产图/, /属性集|共享参数|构件唯一标识|模型映射|IFC/i, /视图|碰撞协调|模型交付|图模/],
    [/共享坐标|坐标转换|坐标发布|坐标基准|控制网|水准|高程|放样|测量/, /应变计|沉降观测|监测|测点|采样|时间同步/, /探伤|测厚|无损检测|回弹检测/, /激光扫描|点云|摄影测量/],
    [/灌浆连接|套筒灌浆|灌浆套筒|预制安装|吊点|吊装工况/, /钢筋锚固|梁板配筋|受弯|荷载|结构体系|传力路径/, /钢构安装|钢筋工程|地基土方|模板工程/],
    [/机器人|机械臂|末端执行|关节坐标/, /无线覆盖|丢包|通信超时|链路质量|5G/i, /传感反馈|传感链路|设备接入|物联网|消息传输|边缘计算|平台接入/],
    [/成本|计价|清单项目|结算|综合单价|工程量/, /进度款|合同|挣值|进度基线/, /工单管理|资源配置|资源统筹|物资计划|交付复盘/],
  ]
  const constructionGoalTitles = [
    '理想信念与全面发展','人文科学素养与数字思维','职业道德与工匠精神','国际视野与持续学习',
    '智能建造基础知识与技能','技术研发改造与应用','智能建造技术服务','复杂工程问题解决与装备操作',
    '复合岗位胜任与协同','技术创新与就业创业','智能建造高端技能人才',
  ]
  const colors = ['#559dba','#b98858','#839b71','#9b82b4','#579b91','#8c91bc','#ad877f']
  const tau = Math.PI * 2, golden = Math.PI * (3 - Math.sqrt(5))
  function readGoals(plan) {
    if (!plan?.text?.trim()) return []
    const text = plan.text.split('【参考依据')[0].trim()
    const matches = [...text.matchAll(/(?:^|\n)\s*(?:培养)?目标\s*(\d+)\s*[：:、.．]\s*/g)]
    if (matches.length) return matches.map((m,i) => ({
      label:'目标' + m[1], text:text.slice(m.index+m[0].length,matches[i+1]?.index ?? text.length).trim(),
    })).filter(g=>g.text)
    return text.split(/\n\s*\n/).map((p,i)=>({label:'目标条目'+(i+1), text:p.trim()})).filter(g=>g.text)
  }
  function build(major, courses, plan, suggestedGoals=[], changes) {
    const goals = readGoals(plan), domains = [], byName = new Map()
    const construction = String(major).replace(/专业$/,'') === '智能建造工程'
    const reference = construction ? readGoals({text:root.TalentPlanData?.existing?.goals}) : []
    const referenceTitles = new Map(reference.map((goal,i) => [goal.text,constructionGoalTitles[i]]))
    for (const goal of goals) {
      const phrase = goal.text.split(/[，。；、\n]/,1)[0].trim() || goal.text
      const excerpt = phrase.slice(0,18)
      goal.title = referenceTitles.get(goal.text) || excerpt + (excerpt.length < goal.text.length ? '…' : '')
      goal.domains = []
    }
    const knownTexts=new Set(goals.map(g=>g.text))
    let number=goals.reduce((last,g)=>Math.max(last,Number(g.label.match(/\d+$/)?.[0]) || 0),0)
    for(const {title,text} of suggestedGoals) {
      if(knownTexts.has(text)) continue
      knownTexts.add(text)
      goals.push({label:'建议目标'+(++number),title,text,suggested:true,domains:[]})
    }
    const goalOccurrences=new Map()
    const visibleGoals=goals.flatMap(goal=>{
      // Use the original source item so edits do not follow a reordered satellite index.
      const identity=[goal.suggested ? '建议目标' : plan?.name || '', goal.suggested ? goal.title : goal.label, goal.text]
      const base=JSON.stringify(identity)
      const occurrence=goalOccurrences.get(base) || 0
      goalOccurrences.set(base,occurrence+1)
      const key=JSON.stringify([...identity,occurrence])
      const change=changes?.goals?.[key]
      if(change?.deleted===true) return []
      const title=change?.name || goal.title
      const text=change?.text || goal.text
      return [{...goal,key,title,text,source:change?.source,edited:title!==goal.title || text!==goal.text}]
    })
    for (const [key, change] of Object.entries(changes?.goals || {})) {
      if (change.added && !change.deleted) {
        visibleGoals.push({key,label:change.imported ? '模板导入' : '人工添加',title:change.name,text:change.text,source:change.source,added:true,domains:[]})
      }
    }
    const paths=new Map(), memberships=new Map(), unassigned=new Set()
    function domainIndex(name) {
      if (!byName.has(name)) {
        const index=domains.length
        byName.set(name,index)
        const change=changes?.domains && Object.hasOwn(changes.domains,name) ? changes.domains[name] : null
        const description = change?.description ?? (construction ? sectors.find(([key]) => key === name)?.[3] : undefined)
        domains.push({key:name,name:change?.name || name,description,added:change?.added===true,imported:change?.imported===true,
          deleted:change?.deleted===true,color:colors[index%colors.length],
          courses:[],goals:[],terms:new Set(),members:[],pointCounts:new Map()})
      }
      return byName.get(name)
    }
    const courseDomain=courses.map(c=>{
      const sector=construction && sectors.find(s=>s[1].includes(c.id))
      const di=domainIndex(String(c.domain || sector?.[0] || c.category || c.type || '专业综合知识'))
      for(const term of [...(sector?.[2] || []),c.name,...(c.topics || []).map(t=>t.name)]) {
        if(typeof term==='string' && term.trim().length>=2)domains[di].terms.add(term.trim())
      }
      return di
    })
    courses.forEach((course,ci)=>{
      function record(item, path, parent, pointDomains, manualDomains) {
        const name=typeof item==='string'?item:item?.name || ''
        const assigned=manualDomains ?? pointDomains
        const explicit=Array.isArray(assigned)
          ? [...new Set(assigned.filter(n=>typeof n==='string' && n.trim()).map(n=>domainIndex(n.trim())))] : []
        let di=parent
        const active=explicit.filter(index=>!domains[index].deleted)
        if(active.length) di=active[0]
        else if(item?.domain) di=domainIndex(item.domain)
        else if(construction && course.source !== '模板导入' && path[1]!==null) {
          const sector=families.findIndex(patterns=>patterns.some(pattern=>pattern.test(name)))
          if(sector>=0)di=domainIndex(sectors[sector][0])
        }
        const key=path.join('/')
        const isPoint=path[3]!==null
        if(isPoint && (Array.isArray(assigned) ? !active.length : domains[di].deleted)) {
          unassigned.add(key)
          return
        }
        const member={path,key,name}
        paths.set(key,di)
        if(active.length>1) memberships.set(key,active)
        for(const index of active.length ? active : [di]) {
          const domain=domains[index]
          domain.members.push(member)
          if(isPoint)domain.pointCounts.set(ci,(domain.pointCounts.get(ci)||0)+1)
        }
        return di
      }
      const primary=record(course,[ci,null,null,null],courseDomain[ci])
      for(const [ui,unit] of (course.topics || []).entries()) {
        const di=record(unit,[ci,ui,null,null],primary)
        for(const [si,section] of (unit.sections || []).entries()) {
          const sub=record(section,[ci,ui,si,null],di)
          for(const [pi,point] of (section.points || []).entries()) {
            record(point,[ci,ui,si,pi],sub,section.pointDomains?.[pi],section.manualPointDomains?.[pi])
          }
        }
        for(const [pi,point] of (unit.points || []).entries()) {
          record(point,[ci,ui,null,pi],di,unit.pointDomains?.[pi],unit.manualPointDomains?.[pi])
        }
      }
    })
    for (const [key, change] of Object.entries(changes?.domains || {})) {
      if (change.added && !change.deleted) domainIndex(key)
    }
    const courseKeys = courses.map(course => String(course.id ?? course.name))
    for (const [di,d] of domains.entries()) {
      const courseIds = changes?.domains?.[d.key]?.courseIds
      const linked = new Set(Array.isArray(courseIds) && !d.deleted ? courseIds : [])
      d.linkedCourses = courseKeys.flatMap((key, index) => linked.has(key) ? [index] : [])
      d.courses=[...new Set([...d.members.map(m=>m.path[0]), ...d.linkedCourses])]
      d.goals=d.deleted ? [] : visibleGoals.flatMap((goal,index)=> {
        const chosen=changes?.goals?.[goal.key]?.domains
        const manual=Array.isArray(chosen)
        const evidence=manual ? [] : [...d.terms].filter(t=>goal.text.toLowerCase().includes(t.toLowerCase()))
        if (manual ? !chosen.includes(d.key) : !evidence.length) return []
        goal.domains.push({index:di,evidence,...(manual ? {manual} : {})})
        return [{index,evidence,...(manual ? {manual} : {})}]
      })
      delete d.terms
    }
    return {major,domains,courseDomain,paths,memberships,unassigned,goals:visibleGoals,source:plan?.name || ''}
  }
  function frame(longitude,latitude) {
    const s=Math.sin(longitude),c=Math.cos(longitude),v=Math.sin(latitude),u=Math.cos(latitude)
    return {normal:{x:u*s,y:v,z:u*c}, east:{x:c,y:0,z:-s}, north:{x:-v*s,y:u,z:-v*c}}
  }
  function satellites(atlas,radius,yaw,pitch) {
    const goals=atlas.goals.flatMap((goal,index)=>goal.domains.length || goal.added ? [index] : [])
    // Fixed, slightly inclined plane in the globe's coordinates.
    const {east,north}=frame(yaw+.18,pitch-.12), orbitRadius=radius*1.26
    return goals.map((index,i)=>{
      const phase=tau*(i+.35)/goals.length
      const a=Math.cos(phase)*orbitRadius, b=Math.sin(phase)*orbitRadius
      return {index,position:{x:east.x*a+north.x*b,y:east.y*a+north.y*b,z:east.z*a+north.z*b}}
    })
  }
  function surface(f, east, north, radius=1) {
    const angle=Math.hypot(east,north), lateral=angle ? radius*Math.sin(angle)/angle : 0
    const forward=radius*Math.cos(angle), a=east*lateral,b=north*lateral
    return {x:forward*f.normal.x+a*f.east.x+b*f.north.x,
      y:forward*f.normal.y+a*f.east.y+b*f.north.y,z:forward*f.normal.z+a*f.east.z+b*f.north.z}
  }
  function mapPoint(n) {
    const longitude=Math.atan2(n.x,n.z), latitude=Math.atan2(n.y,Math.hypot(n.x,n.z))
    return {u:longitude/tau+.5,v:.5-latitude/Math.PI}
  }
  const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z
  const angleOf=p=>(Math.atan2(p.y,p.x)+tau)%tau
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)

  // Start with the outermost real point in each occupied angular sector. Insert every
  // point outside a chord until the outline encloses all leaves, retaining inward bays.
  function footprint(leaves, margin) {
    const center={x:0,y:0}
    for(const p of leaves){center.x+=p.x/leaves.length;center.y+=p.y/leaves.length}
    const sites=[]
    for(const p of leaves) for(let k=0;k<8;k++) {
      const x=p.x-center.x+margin*Math.cos(k*tau/8),y=p.y-center.y+margin*Math.sin(k*tau/8)
      sites.push({x,y,angle:angleOf({x,y}),distance:x*x+y*y})
    }
    sites.sort((a,b)=>a.angle-b.angle || b.distance-a.distance)
    const distinct=sites.filter((s,i)=>i===0 || s.angle-sites[i-1].angle>1e-9)
    const bins=new Map(), count=Math.max(12,Math.min(32,Math.round(Math.sqrt(leaves.length)*1.6)))
    for(const [i,s] of distinct.entries()){
      const bin=Math.floor(s.angle/tau*count), previous=bins.get(bin)
      if(previous===undefined || s.distance>distinct[previous].distance)bins.set(bin,i)
    }
    const outer=[...bins.values()].sort((a,b)=>a-b)
    const outline=[]
    function span(start,end) {
      const a=distinct[start%distinct.length],b=distinct[end%distinct.length]
      let split=-1, outside=-1e-10
      for(let j=start+1;j<end;j++){
        const turn=cross(a,b,distinct[j%distinct.length])
        if(turn<outside){outside=turn;split=j}
      }
      if(split!==-1){span(start,split);span(split,end)}
      else outline.push({x:a.x+center.x,y:a.y+center.y})
    }
    outer.forEach((start,i)=>span(start,outer[i+1]??outer[0]+distinct.length))
    return {center,outline}
  }
  function inside(region,normal,includeSharedSites=true) {
    if(includeSharedSites && region.sharedSites.some(site=>dot(normal,site.normal)>=Math.cos(site.angularRadius))) return true
    const f=region.frame, z=dot(normal,f.normal)
    if(z<Math.cos(region.maxAngle+.001))return false
    const angle=Math.acos(Math.max(-1,Math.min(1,z))),scale=angle>1e-8?angle/Math.sin(angle):1
    const x=dot(normal,f.east)*scale,y=dot(normal,f.north)*scale,ring=region.outline
    let hit=false
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const a=ring[i],b=ring[j]
      if((a.y>y)!==(b.y>y) && x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit
    }
    return hit
  }

  function geometry(atlas,radius) {
    const count=atlas.domains.length
    const frames=atlas.domains.map((_,i)=>frame(i*golden+.25,Math.asin(1-2*(i+.5)/count)))
    const regions=atlas.domains.map((domain,di)=>{
      const f=frames[di], positions=new Map(), groups=new Map()
      const bounds=t=>{
        const dir={x:f.east.x*Math.cos(t)+f.north.x*Math.sin(t),y:f.east.y*Math.cos(t)+f.north.y*Math.sin(t),z:f.east.z*Math.cos(t)+f.north.z*Math.sin(t)}
        let limit=1.34
        for(const other of frames) if(other!==f) limit=Math.min(limit,Math.atan2(1-dot(f.normal,other.normal),dot(dir,other.normal)))
        return limit
      }
      for(const member of domain.members) {
        const [ci,ui,si,pi]=member.path
        if(pi===null || atlas.paths.get(member.key)!==di)continue
        const key=[ci,ui,si].join('/')
        if(!groups.has(key))groups.set(key,{ci,ui,si,leaves:[]})
        groups.get(key).leaves.push(member)
      }
      const patterns=families[sectors.findIndex(s=>s[0]===domain.key)] || []
      const parcels=[...groups.values()]
      for(const parcel of parcels) {
        const text=parcel.leaves.map(p=>p.name).join(' ')
        const family=patterns.findIndex(pattern=>pattern.test(text))
        parcel.family=family<0?patterns.length:family
      }
      parcels.sort((a,b)=>a.family-b.family || a.ci-b.ci || a.ui-b.ui || a.si-b.si)
      const sites=parcels.map((_,j)=>{
        const a=j*golden+di*.77
        const r=Math.sqrt((j+.5)/parcels.length)
        return {x:r*Math.cos(a),y:r*Math.sin(a)}
      })
      // Nearby sites follow the semantic families, across course boundaries.
      const rows=Math.max(1,Math.round(Math.sqrt(parcels.length)/1.5))
      const row=p=>Math.floor((p.y+1)*rows/2)
      sites.sort((a,b)=>row(a)-row(b)||(row(a)%2?b.x-a.x:a.x-b.x))
      function put(member,x,y,z=0) {
        const t=Math.atan2(y,x),stretch=bounds(t)
        positions.set(member.key,{x:x*stretch,y:y*stretch,z})
      }
      const leaves=[]
      parcels.forEach((parcel,j)=>{
        const site=sites[j], n=parcel.leaves.length, half=Math.min(.28,.89/Math.sqrt(parcels.length))
        const east=site.x*(.96-half),north=site.y*(.96-half)
        const turn=j*golden+parcel.ci*.69
        parcel.leaves.forEach((leaf,k)=>{
          const a=turn+k*golden, spread=n===1?.30:Math.sqrt((k+.65)/n)
          put(leaf,east+half*spread*Math.cos(a),north+half*spread*Math.sin(a),Math.sin(a)*.018)
          leaves.push(positions.get(leaf.key))
        })
      })
      // Place each theme, unit and course among its own descendants in this domain.
      const sums=new Map()
      for(const parcel of parcels) {
        for(const leaf of parcel.leaves) {
          const p=positions.get(leaf.key),[ci,ui,si]=leaf.path
          const parents=[[ci,null,null,null],[ci,ui,null,null]]
          if(si!==null)parents.push([ci,ui,si,null])
          for(const path of parents) {
            const key=path.join('/')
            if(!sums.has(key))sums.set(key,{x:0,y:0,n:0})
            const sum=sums.get(key);sum.x+=p.x;sum.y+=p.y;sum.n++
          }
        }
      }
      const branches=domain.members.filter(m=>m.path[3]===null)
      for(const [j,m] of branches.entries()) {
        const sum=sums.get(m.key)
        if(sum) {
          const shift=m.path[1]===null?.042:m.path[2]===null?.027:.012
          positions.set(m.key,{x:sum.x/sum.n+shift*Math.cos(j),y:sum.y/sum.n+shift*Math.sin(j),z:.012})
        } else {
          const a=j*golden, r=.45*Math.sqrt((j+.5)/Math.max(1,branches.length))
          put(m,r*Math.cos(a),r*Math.sin(a))
        }
      }
      const members=leaves.length?leaves:[...positions.values()]
      if (!members.length && domain.added) members.push({x:0,y:0})
      const margin=Math.min(.048,Math.max(.018,.39/Math.sqrt(members.length)))
      const {center:mid,outline}=footprint(members,margin)
      // Subdivide long chords for accurate curvature on the globe and in its flat map.
      const ring=[]
      outline.forEach((p,i)=>{
        const q=outline[(i+1)%outline.length], steps=Math.max(1,Math.ceil(Math.hypot(q.x-p.x,q.y-p.y)/.065))
        for(let k=0;k<steps;k++)ring.push({x:p.x+(q.x-p.x)*k/steps,y:p.y+(q.y-p.y)*k/steps})
      })
      const rings=[.34,.68,1].map(k=>ring.map(p=>surface(f,mid.x+(p.x-mid.x)*k,mid.y+(p.y-mid.y)*k,radius)))
      const world=new Map()
      for(const [key,p] of positions)world.set(key,surface(f,p.x,p.y,radius*(1+p.z)))
      const center=surface(f,mid.x,mid.y,radius)
      const maxAngle=ring.reduce((max,p)=>Math.max(max,Math.hypot(p.x,p.y)),0)
      return {domain,frame:f,world,outline,maxAngle,center,rim:rings[2],rings,sharedSites:[],
        caption:surface(f,mid.x,mid.y-.15*maxAngle,radius*1.012)}
    })
    // A shared concept has one location. Other fields include a small footprint at
    // that location instead of stretching their mainland across unrelated branches.
    for(const [key,domains] of atlas.memberships) {
      const world=regions[domains[0]].world.get(key)
      const length=Math.hypot(world.x,world.y,world.z)
      const normal={x:world.x/length,y:world.y/length,z:world.z/length}
      const site={key,world,normal,angularRadius:.023,domains}
      for(const di of domains) {
        const region=regions[di]
        if(!region.rim.length && !region.sharedSites.length) region.center=region.caption=world
        region.world.set(key,world)
        region.sharedSites.push(site)
      }
    }
    return regions
  }
  function unassignedPositions(keys,regions,radius) {
    const positions=new Map()
    if (!keys.size) return positions

    const active=regions.filter(region=>!region.domain.deleted)
    const coast=active.flatMap(region=>region.rim.map(({x,y,z})=>({x:x/radius,y:y/radius,z:z/radius})))
    const minClearance=Math.cos(.03), maxClearance=Math.cos(.105)
    let candidates
    // Sample both hemispheres and reserve the free space just off the domain outlines.
    for(let samples=Math.max(3072,keys.size*32);;samples*=2) {
      candidates=[]
      for(let i=0;i<samples;i++) {
        const {normal}=frame(i*golden+.25,Math.asin(1-2*(i+.5)/samples))
        if(!active.some(region=>inside(region,normal))) candidates.push(normal)
      }
      if(candidates.length>=keys.size) break
    }
    const nearCoast=[], otherGaps=[]
    for(const normal of candidates) {
      let closest=-1
      for(const p of coast) closest=Math.max(closest,dot(normal,p))
      if(closest>=maxClearance && closest<=minClearance) nearCoast.push(normal)
      else otherGaps.push(normal)
    }
    const spread=(pool,count)=>Array.from({length:count},(_,i)=>pool[Math.floor((i+.5)*pool.length/count)])
    const nearCount=Math.min(keys.size,nearCoast.length)
    const points=[...spread(nearCoast,nearCount),...spread(otherGaps,keys.size-nearCount)]
    const liftedRadius=radius*1.02
    let i=0
    for(const key of keys) {
      const {x,y,z}=points[i++]
      positions.set(key,{x:x*liftedRadius,y:y*liftedRadius,z:z*liftedRadius})
    }
    return positions
  }
  function relatedDomains(atlas, path) {
    const key = path.join('/')
    if (atlas.unassigned?.has(key)) return []
    const indices = new Set(atlas.memberships?.get(key) ?? [atlas.paths.get(key)])
    const [course, unit] = path
    if (unit === null) atlas.domains.forEach((domain, index) => {
      if (domain.pointCounts.has(course) || domain.linkedCourses?.includes(course)) indices.add(index)
    })
    return [...indices].filter(index => atlas.domains[index] && !atlas.domains[index].deleted)
  }

  root.KnowledgeDomainAtlas={build,readGoals,geometry,surface,mapPoint,inside,satellites,unassignedPositions,relatedDomains}
})(globalThis)
