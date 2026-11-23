/* Shared by the classic HTML entry, the Vue host and the Worker input validator. */
;(function (root) {
  const batchSize = 6
  const maxMaterialChars = 160000
  const title = value => typeof value === 'string' ? value.trim() : ''
  const unique = values => [...new Set(values)]
  const textKey = value => value.normalize('NFKC').replace(/\s/g, '').toLowerCase()

  // These suggested subjects are only used for matching names, never as an approved curriculum.
  const referenceSubjects = [
    ['计算机技术', [
      ['计算机组成原理', [
        ['指令与处理器','指令周期','寻址方式','流水线冒险'],
        ['存储层次','缓存映射','主存编址','局部性原理'],
      ]],
      ['操作系统', [
        ['进程与线程','进程状态转换','调度算法','互斥与同步'],
        ['虚拟内存','页表映射','页面置换','缺页中断'],
      ]],
      ['计算机网络', [
        ['网络层与寻址','子网划分','路由表','分组转发'],
        ['端到端传输','TCP 连接管理','滑动窗口','拥塞控制'],
      ]],
      ['数据结构与算法', [
        ['线性结构与树','链表插入与删除','栈与队列','二叉树遍历'],
        ['算法设计与分析','递归终止条件','排序稳定性','渐近时间复杂度'],
      ]],
      ['面向对象程序设计', [
        ['对象建模','类与实例','封装','接口与实现'],
        ['程序组织','继承与组合','动态绑定','异常处理'],
      ]],
      ['数据库原理与应用', [
        ['关系建模','实体关系图','函数依赖','范式分解'],
        ['数据访问与一致性','连接查询','索引选择','事务隔离级别'],
      ]],
    ]],
    ['软件技术', [
      ['程序设计基础', [['程序控制结构','条件分支','循环边界','函数参数'], ['程序调试','断点观察','调用栈','边界输入']]],
      ['数据库应用技术', [['关系数据库设计','实体与联系','主键与外键','第三范式'], ['事务与并发','事务隔离级别','锁与死锁','事务回滚']]],
      ['软件测试技术', [['测试用例设计','等价类划分','边界值分析','状态迁移'], ['缺陷分析','缺陷复现记录','回归范围','测试覆盖率']]],
    ]],
    ['大数据技术', [
      ['数据采集与处理', [['数据采集','增量同步','采集频率','结构化字段'], ['数据清洗','缺失值处理','记录去重','类型转换']]],
      ['数据仓库技术', [['维度建模','事实表粒度','维度表','星型模型'], ['数据装载','全量与增量','分区策略','质量校验']]],
      ['数据可视化', [['图形编码','位置映射','色彩刻度','尺度选择'], ['交互分析','条件筛选','聚合与下钻','时间序列']]],
    ]],
    ['智慧健康养老服务与管理', [
      ['老年人能力评估', [['评估维度','日常生活活动','精神状态','感知觉与沟通'], ['评估记录','访谈提纲','观察记录','复核与归档']]],
      ['智慧养老服务技术', [['设备与应用','居家监测设备','告警分级','信息授权'], ['服务流程','需求登记','服务派单','异常转介']]],
      ['养老机构运营管理', [['服务组织','岗位职责','交接班记录','资源调配'], ['服务质量','满意度调查','投诉跟踪','持续改进']]],
    ]],
    ['智能建造工程', [
      ['建筑信息模型基础', [['模型定位','项目基点','标高与轴网','坐标系'], ['模型构建','参数化构件','族类型','构件属性']]],
      ['建筑施工组织', [['进度计划','工作分解','逻辑关系','关键线路'], ['资源配置','机械台班','劳动力需求','场地布置']]],
      ['建筑结构', [['结构体系','框架结构','剪力墙结构','荷载传递'], ['构件受力','轴心受压','受弯构件','内力组合']]],
    ]],
  ]
  const curriculumSource = '专业课程知识底稿（待审核）'
  function addPointDomains(owner,index,names) {
    if (!Array.isArray(names)) return
    const domains=names.map(title).filter(Boolean)
    if (names.length && !domains.length) return
    if (!owner.pointDomains || typeof owner.pointDomains!=='object' || Array.isArray(owner.pointDomains)) owner.pointDomains={}
    const previous=owner.pointDomains[index]
    owner.pointDomains[index]=unique([...(Array.isArray(previous) ? previous : []),...domains])
  }
  function copyPointDomains(original,copy) {
    if (!original.pointDomains || typeof original.pointDomains!=='object' || Array.isArray(original.pointDomains)) return
    for (const [key,names] of Object.entries(original.pointDomains)) {
      if (/^(0|[1-9]\d*)$/.test(key) && Number(key)<copy.points.length) addPointDomains(copy,Number(key),names)
    }
  }
  function unitCopy(unit, source) {
    if (!title(unit?.name)) throw new Error('课程知识单元缺少名称。')
    const origin = title(unit.source) || source
    const field = {name:unit.name.trim(),source:origin}
    const copyPoints = points => {
      if (!Array.isArray(points) || points.some(p=>!title(p))) throw new Error('课程底稿的知识点格式有误。')
      return points.map(p=>p.trim())
    }
    if (Array.isArray(unit.sections)) {
      field.sections = unit.sections.map(section=>{
        if (!title(section?.name)) throw new Error('课程底稿的知识主题缺少名称。')
        const points=copyPoints(section.points)
        const item={name:section.name.trim(),points,source:title(section.source) || origin,
          ...(title(section.evidence) ? {evidence:section.evidence} : {})}
        copyPointDomains(section,item)
        if (Array.isArray(section.pointSources) && section.pointSources.length===points.length) {
          item.pointSources = section.pointSources.map(p=>({
            source:title(p?.source) || item.source,...(title(p?.evidence)?{evidence:p.evidence}:{}),
            ...(title(p?.fileName)?{fileName:p.fileName}:{}),
          }))
        }
        return item
      })
    } else {
      field.points = copyPoints(unit.points)
      copyPointDomains(unit,field)
    }
    return field
  }
  function validateInput(raw) {
    if (!raw || !title(raw.major) || raw.major.length > 150) throw new Error('请填写 150 字以内的专业名称。')
    const courses = raw.courses === undefined ? [] : raw.courses
    const attachments = raw.attachments === undefined ? [] : raw.attachments
    if (!Array.isArray(courses) || !Array.isArray(attachments)) throw new Error('课程和材料须采用列表格式。')
    const ids = new Set()
    const cleanCourses = courses.map(c => {
      if (!title(c?.id) || !title(c?.name) || c.id.length > 180 || c.name.length > 240) throw new Error('课程名称或课程标识缺失、过长。')
      const id = c.id.trim()
      if (ids.has(id)) throw new Error('课程标识重复，请检查课程清单。')
      ids.add(id)
      const course = { id, name: c.name.trim() }
      if (typeof c.isCore==='boolean') course.isCore=c.isCore
      if (title(c.source)) course.source=c.source.trim()
      if (Array.isArray(c.topics)) course.topics=c.topics.map(t=>unitCopy(t,course.source || curriculumSource))
      return course
    })
    const filenames = new Set()
    const cleanFiles = attachments.map(a => {
      if (!title(a?.name) || !title(a?.text) || a.name.length > 250) throw new Error('材料须包含文件名称和可读取的正文。')
      const name = a.name.trim()
      if (filenames.has(name)) throw new Error('材料名称重复，请重命名后重新添加。')
      filenames.add(name)
      return { name, text: a.text.trim() }
    })
    if (raw.requirements !== undefined && typeof raw.requirements !== 'string') throw new Error('补充要求须为文字。')
    if (title(raw.requirements).length > 16000) throw new Error('补充要求超过 1.6 万字，请精简后重试。')
    const data = { major: raw.major.trim(), courses: cleanCourses, attachments: cleanFiles, requirements: title(raw.requirements) }
    if (title(raw.curriculumRevision)) data.curriculumRevision = raw.curriculumRevision.trim()
    if (Array.isArray(raw.relationSeeds)) data.relationSeeds = raw.relationSeeds.filter(seed=>
      [seed?.from,seed?.to].every(end=>Array.isArray(end) && end.length===2 && end.every(s=>title(s))) && title(seed.label) && title(seed.reason)
    ).map(seed=>({from:[...seed.from],to:[...seed.to],label:seed.label,reason:seed.reason}))
    return data
  }
  function visitLeaves(courses,visit) {
    courses.forEach((course,ci)=>(course.topics || []).forEach((unit,ui)=>{
      if (Array.isArray(unit.sections)) {
        unit.sections.forEach((section,si)=>section.points.forEach((point,pi)=>visit(course,point,[ci,ui,si,pi],section)))
      } else {
        const points = unit.points || []
        points.forEach((point,pi)=>visit(course,point,[ci,ui,null,pi],unit))
      }
    }))
  }
  // A shared phrase is a co-occurrence, not a prerequisite. Exclude short labels,
  // placeholders, sentences and phrases composed entirely of generic teaching or management terms.
  const genericConcept = /^(?:专业|基础|基本|常用|关键|重点|相关|主要|综合|一般|通用|学科|工作|学习|课程|知识|单元|主题|内容|要点|理论|概念|概述|原理|实践|实训|练习|案例|分析|应用|操作|方法|实验|过程|流程|程序|资料|文档|文件|材料|数据|信息|技术|业务|项目|工程|现场|系统|实施|执行|设计|开发|管理|组织|团队|沟通|协作|协同|责任|质量|安全|风险|控制|规范|标准|要求|检查|监测|记录|结果|处理|评估|评价|能力|素养|职业|技能|报告|编写|编制|指导|方案|知识点|训练|服务|总结|优化|意识|协调|防护|保护|基础性|案例分析|问题|解决|计划|制订|清单|和|与|及|的|在|中)+$/u
  function distinctiveConcept(value) {
    if (value.length < 4 || value.length > 44 || !/[㐀-鿿A-Za-z]/u.test(value)) return false
    if (/[，,。；;、！？!?：:\n]/u.test(value) || /^(?:知识点|示例|举例|练习题|第[一二三四五六七八九十\d]+章)/u.test(value)) return false
    if (/^(?:introduction|overview|basic concepts?|case stud(?:y|ies)|data analysis|quality control|project management)$/iu.test(value)) return false
    return !genericConcept.test(value)
  }
  const coursePair = (left,right) => left<right ? left+'|'+right : right+'|'+left
  function curatedRelations(seeds, pointByCourse) {
    const relations = [], seen = new Set()
    for (const seed of seeds || []) {
      const from=pointByCourse.get(JSON.stringify(seed.from)), to=pointByCourse.get(JSON.stringify(seed.to))
      if (!from || !to || from[0]===to[0]) continue
      const key = JSON.stringify([from,to,seed.label])
      if (seen.has(key)) continue
      seen.add(key)
      relations.push({from,to,label:seed.label,reason:seed.reason})
    }
    return relations
  }
  function resolveRelations(courses,data) {
    const pointByCourse = new Map()
    const shared = new Map()
    visitLeaves(courses,(course,point,path)=>{
      const endpoint = JSON.stringify([course.id,point])
      pointByCourse.set(endpoint,pointByCourse.has(endpoint) ? null : path)
      const name = point.normalize('NFKC').trim()
      if (!distinctiveConcept(name)) return
      if (!shared.has(name)) shared.set(name,new Map())
      const matches = shared.get(name)
      matches.set(path[0],matches.has(path[0]) ? null : {path,endpoint})
    })
    const relations = curatedRelations(data.relationSeeds,pointByCourse)
    const occupiedPairs = new Set(relations.map(edge=>coursePair(edge.from[0],edge.to[0])))
    // Curated course sets have deliberate, authored relations. Extend these only
    // when an exact occurrence was added beyond that course's original curriculum.
    const baseline = new Set()
    if (data.curriculumRevision && data.relationSeeds?.length) {
      visitLeaves(data.courses,(course,point)=>baseline.add(JSON.stringify([course.id,point])))
    }
    const candidates = [...shared.entries()].map(([name,matches])=>({
      name,occurrences:[...matches.values()].filter(Boolean),
    })).filter(item=>item.occurrences.length>1)
    candidates.sort((a,b)=>a.occurrences.length-b.occurrences.length || b.name.length-a.name.length)
    const degree = new Map()
    let total = 0
    for (const {name,occurrences} of candidates) {
      if (total>=24) break
      if (baseline.size && occurrences.every(item=>baseline.has(item.endpoint))) continue
      // Try only a few placements per term. New occurrences take priority within curated data.
      const sample = baseline.size ? [...occurrences.filter(o=>!baseline.has(o.endpoint)),...occurrences.filter(o=>baseline.has(o.endpoint))] : occurrences
      const representative = sample.slice(0,6)
      let connected = 0
      for (let i=0; i<representative.length && connected<2 && total<24; i++) {
        const left = representative[i]
        for (const right of representative.slice(i+1)) {
          if (baseline.has(left.endpoint) && baseline.has(right.endpoint)) continue
          const a = left.path[0], b = right.path[0], pair = coursePair(a,b)
          if (occupiedPairs.has(pair) || (degree.get(a) || 0)>=3 || (degree.get(b) || 0)>=3) continue
          const [from,to] = a<b ? [left.path,right.path] : [right.path,left.path]
          relations.push({from,to,label:'共同知识点',reason:'《'+courses[from[0]].name+'》和《'+courses[to[0]].name+'》均列有末级知识点“'+name+'”。'})
          occupiedPairs.add(pair)
          degree.set(a,(degree.get(a) || 0)+1)
          degree.set(b,(degree.get(b) || 0)+1)
          connected++
          total++
          break
        }
      }
    }
    return relations
  }
  const leafCount = course => course.topics.reduce((total,u)=>total+(u.sections || []).reduce((n,s)=>n+s.points.length,0),0)
  function mergeCurriculumCourse(seed, additions) {
    const source=seed.source || curriculumSource
    const units=seed.topics.map(t=>unitCopy(t,source))
    // Record selections by course ID and exact leaf name; keep the original path
    // when a model restates a baseline leaf under a different heading.
    const locations = new Map()
    for (const unit of units) for (const section of unit.sections || []) {
      section.points.forEach((point,index)=>locations.set(point,locations.has(point) ? null : {section,index}))
    }
    function addSection(unitName,section) {
      let target
      for (const [index,point] of section.points.entries()) {
        if (locations.has(point)) {
          const existing=locations.get(point)
          if (existing) addPointDomains(existing.section,existing.index,section.pointDomains?.[index])
          continue
        }
        if (!target) {
          let unit=units.find(u=>u.name===unitName)
          if (!unit) {
            unit={name:unitName,source:section.source,sections:[]}
            units.push(unit)
          }
          target=unit.sections.find(s=>s.name===section.name)
          if (!target) {
            target={name:section.name,source:section.source,points:[],...(section.evidence ? {evidence:section.evidence} : {})}
            unit.sections.push(target)
          }
          if (!target.pointSources) target.pointSources=target.points.map(()=>({source:target.source}))
        }
        const position=target.points.length
        const origin = section.pointSources?.[index] || {source:section.source,
          ...(section.evidence?{evidence:section.evidence}:{}),...(section.fileName?{fileName:section.fileName}:{})}
        target.pointSources.push({...origin})
        addPointDomains(target,position,section.pointDomains?.[index])
        target.points.push(point)
        locations.set(point,{section:target,index:position})
      }
      if (target) target.source = unique(target.pointSources.map(origin=>origin.source)).join(' · ')
    }
    for (const addition of additions || []) {
      if (Array.isArray(addition.sections)) {
        for (const section of addition.sections) addSection(addition.name,{...section,source:section.source || addition.source || source})
      } else {
        const owner = units.find(u=>u.sections?.some(s=>s.name===addition.name))
        const unit = units.find(u=>u.name===addition.name)
        addSection(owner?.name || unit?.name || '补充教学内容',{
          ...addition,name:owner || !unit ? addition.name : '补充知识主题',
        })
      }
    }
    return {...seed,source,topics:units}
  }
  function mergeArchivedCourse(seed,additions) {
    const source=seed.source || '已有课程图谱'
    if (seed.topics.some(unit=>Array.isArray(unit.sections))) {
      const topics=seed.topics.map(unit=>Array.isArray(unit.sections) ? unit : {
        name:unit.name,source:unit.source || source,sections:[{...unit,name:'原有知识点',source:unit.source || source}],
      })
      return mergeCurriculumCourse({...seed,source,topics},additions)
    }
    const topics=seed.topics.map(unit=>unitCopy(unit,source))
    for (const addition of additions) {
      const original=topics.find(unit=>unit.name===addition.name)
      if (original && Array.isArray(original.points) && Array.isArray(addition.points)) {
        const previousLength=original.points.length
        addition.points.forEach((point,index)=>{
          const existing=original.points.indexOf(point)
          const position=existing===-1 ? original.points.push(point)-1 : existing
          addPointDomains(original,position,addition.pointDomains?.[index])
        })
        if (original.points.length>previousLength) original.source=unique([original.source,addition.source || source]).join(' · ')
      } else if (!original) {
        topics.push(unitCopy(addition,source))
      }
    }
    return {...seed,source,topics}
  }
  function curriculumGraph(data,courses) {
    return {major:data.major,curriculumRevision:data.curriculumRevision,mode:'local',modeLabel:'课程知识底稿',
      requirements:data.requirements || '',notice:'已载入专业课程知识底稿，内容待审核。',
      sources:unique(courses.map(c=>c.source || curriculumSource)).map(name=>({kind:'curriculum',name})),
      relations:resolveRelations(courses,data),courses}
  }
  const hasCurriculum = data => Boolean(data.curriculumRevision && data.courses.length &&
    data.courses.every(c=>c.topics?.length && c.topics.every(u=>Array.isArray(u.sections))))
  function fromCurriculum(context) {
    if (!context?.courses?.some(course => course.topics?.length)) return null
    const data=validateInput({...context,attachments:[]})
    const courses = data.courses.filter(course => course.topics?.length)
    return curriculumGraph(data,courses.map(c=>({...c,source:c.source || curriculumSource})))
  }
  function previousRevision(revision) {
    return revision==='construction-ten-v3' ? 'construction-ten-v2' : ''
  }
  function indexArchivedUnit(archived, ci, ui, unit, displayedNames, originals) {
    const savedUnit=archived.topics[ui]
    for (const [si,section] of unit.sections.entries()) {
      const saved=savedUnit?.sections?.[si]
      if (!saved) continue
      const sameBranch=(savedUnit.name===unit.name && saved.name===section.name) ||
        section.points.some((point,pi)=>saved.points[pi]===point)
      for (const [pi,point] of section.points.entries()) {
        if (!saved.points[pi]) continue
        const key=JSON.stringify([archived.id,point])
        const unmarkedRename=sameBranch && saved.points.length>=section.points.length && !displayedNames.has(key)
        if (saved.points[pi]===point || saved.editedPoints?.includes(pi) || unmarkedRename) {
          originals.set(key,[ci,ui,si,pi])
        }
      }
    }
  }
  function appendCurriculumUnit(archived, ci, unit, curriculumUnitIndex, endpoints) {
    // Extra units from files keep their indexes. A concept already recorded
    // by the teacher keeps its existing source and remains a link target.
    const sections=[]
    for (const original of unit.sections) {
      const points=[], origins=[]
      for (const [pi,point] of original.points.entries()) {
        const key=JSON.stringify([archived.id,point])
        if (endpoints.get(key)) continue
        endpoints.set(key,[ci,archived.topics.length,sections.length,points.length])
        points.push(point)
        if (original.pointSources) origins.push(original.pointSources[pi])
      }
      if (points.length) {
        // Curated domains follow their final leaf paths after deduplication.
        const {pointDomains,...fields}=original
        sections.push({...fields,points,...(original.pointSources?{pointSources:origins}:{})})
      }
    }
    if (sections.length) archived.topics.push({...unit,sections,curriculumUnitIndex})
  }
  function upgradeCurriculum(previous, context) {
    const older = previousRevision(context?.curriculumRevision)
    if (!older || previous?.curriculumRevision!==older || previous.major!==context.major) return null
    const data = validateInput({...context,attachments:[]})
    const indexes = new Map(previous.courses.map((course,i)=>[course.id,i]))
    if (!hasCurriculum(data) || indexes.size!==previous.courses.length || data.courses.some(c=>!indexes.has(c.id))) return null

    // The history view keeps its own copy. Edits and relations address nodes by position.
    const graph = JSON.parse(JSON.stringify(previous))
    const displayedNames = new Set()
    visitLeaves(graph.courses,(course,point)=>displayedNames.add(JSON.stringify([course.id,point])))
    const originals=new Map(), additions=[]
    // V2 retained the authored prefix in place, even when a teacher renamed its
    // leaves or appended material. Only BIM acquired new units in this revision.
    for (const course of data.courses) {
      const ci=indexes.get(course.id), archived=graph.courses[ci]
      const oldCount=course.id==='B261306' ? 4 : course.topics.length
      for (const [ui,unit] of course.topics.entries()) {
        if (ui<oldCount) indexArchivedUnit(archived,ci,ui,unit,displayedNames,originals)
        else additions.push({archived,ci,unit,ui})
      }
    }
    // Renaming an older concept to a new concept's name does not merge their identities.
    // A matching attachment can still supply the new concept at its saved position.
    const originalPaths=new Set([...originals.values()].map(path=>path.join('/')))
    const endpoints=new Map(originals)
    visitLeaves(graph.courses,(course,point,path)=>{
      const key=JSON.stringify([course.id,point])
      if (originalPaths.has(path.join('/')) || originals.has(key)) return
      endpoints.set(key,endpoints.has(key) ? null : path)
    })
    for (const {archived,ci,unit,ui} of additions) appendCurriculumUnit(archived,ci,unit,ui,endpoints)
    visitLeaves(data.courses,(course,point,path,owner)=>{
      const domains=owner.pointDomains?.[path[3]]
      if (!domains) return
      const actual=endpoints.get(JSON.stringify([course.id,point]))
      if (!actual) return
      const [ci,ui,si,pi]=actual
      const unit=graph.courses[ci].topics[ui]
      addPointDomains(si===null ? unit : unit.sections[si],pi,domains)
    })
    const relations=Array.isArray(graph.relations) ? graph.relations : []
    const key=edge=>JSON.stringify([edge?.from,edge?.to,edge?.label])
    const existing=new Set(relations.map(key))
    graph.relations=[...relations,...curatedRelations(data.relationSeeds,endpoints).filter(edge=>!existing.has(key(edge)))]
    graph.curriculumRevision=data.curriculumRevision
    return graph
  }
  const cleanHeading = line => line.replace(/^\s*(?:#{1,6}\s*|[-*•]\s+|(?:第[\d一二三四五六七八九十]+[章节单元]+|\d+(?:\.\d+)*[.、)）])\s*)/, '').replace(/\*\*/g,'').trim()
  function courseHeading(line, names) {
    const heading = cleanHeading(line)
    const explicit = heading.match(/^(?:课程名称|课程名|课程)\s*[:：]\s*(.+?)\s*$/)
    const quoted = heading.match(/^《([^》]+)》(?:\s*(?:课程标准|教学大纲|课程大纲|课程知识图谱))?$/)
    if (explicit || quoted) return (explicit?.[1] || quoted[1]).replace(/^《|》$/g,'').trim()
    return names.get(textKey(heading))
  }
  function indexFiles(attachments, courses) {
    const names = new Map(courses.map(c => [textKey(c.name), c.name]))
    return attachments.map(file => {
      const sections = new Map()
      let active = ''
      for (const line of file.text.split(/\r\n?|\n/)) {
        const value = line.trim()
        if (!value) continue
        const heading = courseHeading(value, names)
        if (heading) active = heading
        else {
          if (!sections.has(active)) sections.set(active, [])
          sections.get(active).push(value)
        }
        if (heading && !sections.has(active)) sections.set(active, [])
      }
      // Standalone course standards frequently put the subject in the filename only.
      if (![...sections.keys()].some(Boolean)) {
        const stem = file.name.replace(/\.[^.]+$/, '')
        const named = stem.match(/^(?:《([^》]+)》|(.+?))(?:课程标准|教学大纲|课程大纲|课程知识图谱)$/)
        const name = (named?.[1] || named?.[2] || '').trim()
        if (name && !name.endsWith('专业') && sections.has('')) {
          sections.set(name,sections.get(''))
          sections.delete('')
        }
      }
      return { ...file, sections }
    })
  }
  function sectionFor(file, course) {
    const key = textKey(course.name)
    const matched = [...file.sections].find(([name]) => name && textKey(name) === key)
    if (matched) return matched[1]
    if ([...file.sections.keys()].some(Boolean)) return null
    const standalone = file.sections.get('') || []
    if (textKey(file.name).includes(key)) return standalone
    const matchingLines = standalone.filter(line => textKey(line).includes(key))
    return matchingLines.length ? matchingLines : null
  }
  function coursesFromFiles(files) {
    const names = unique(files.flatMap(file => [...file.sections.keys()].filter(Boolean)))
    return names.map((name,index) => ({id:'material-'+(index+1),name}))
  }
  // The supplied registry identifies authored outlines by name and exact contents.
  // User files may contain cross-course instructions or shared context, so retain them whole.
  function builtInSections(data) {
    const registered = Array.isArray(root.KnowledgeDomainOutlines) ? root.KnowledgeDomainOutlines : []
    const selected = data.attachments.filter(file => registered.some(item => item.name === file.name && title(item.text) === file.text))
    return new Map(indexFiles(selected,data.courses).map(file => [file.name,file.sections]))
  }
  function batchMaterials(attachments,index,courses) {
    if (!index.size || !courses.length) return attachments
    const names = new Set(courses.map(course => textKey(course.name)))
    return attachments.flatMap(file => {
      const sections = index.get(file.name)
      if (!sections || ![...sections.keys()].some(Boolean)) return [file]
      const lines = []
      for (const [name,content] of sections) {
        if (name && names.has(textKey(name))) lines.push('课程：'+name,...content)
      }
      if (!lines.length) return []
      return [{name:file.name,text:[...(sections.get('') || []),...lines].join('\n')}]
    })
  }
  function extractTopics(lines, filename) {
    const topics = new Map()
    let active = ''
    function add(name, points) {
      if (!topics.has(name)) topics.set(name, { name, points:[], source: filename })
      const topic = topics.get(name)
      topic.points = unique([...topic.points, ...points])
    }
    for (const raw of lines) {
      const line = cleanHeading(raw)
      if (!line || /^[\s:|\-]+$/.test(line)) continue
      if (/^(?:总?学时|学分|开课学期|课程代码|专业代码|任课教师|适用专业|课程性质|开课院系)\s*[：:]/.test(line)) continue
      const colon = line.search(/[：:]/)
      const cells = line.replace(/^\||\|$/g,'').split(/[\t|]+/).map(s=>s.trim()).filter(Boolean)
      const isTable = cells.length > 1
      if (isTable && /^(主题|知识领域|知识单元|章节)$/.test(cells[0]) && /知识点/.test(cells[1])) continue
      if (colon < 0 && !isTable && (/^\s*#/.test(raw) || /^\s*第[\d一二三四五六七八九十]+[章节单元]/.test(raw))) {
        active = line
        add(active,[])
        continue
      }
      let name = active || '材料所列知识内容'
      let body = line
      if (isTable) {
        name = cells[0]
        body = cells.slice(1).join('、')
      } else if (colon > 0 && colon <= 80) {
        name = line.slice(0,colon).trim()
        body = line.slice(colon+1).trim()
        if (!body || /^(章节|主题|单元|知识领域)$/.test(name)) {
          active = body || name
          add(active,[])
          continue
        }
        if (active && /^(知识点|主要内容|学习内容)$/.test(name)) name = active
      }
      const points = body.split(/[、；;。\n]+/).map(s=>s.trim()).filter(Boolean)
      if (name && points.length) add(name, points)
    }
    return [...topics.values()]
  }
  function collectTopics(files,course,usage) {
    const collected = new Map()
    for (const file of files) {
      const lines = sectionFor(file,course)
      if (lines === null) continue
      if (!usage.has(file.name)) usage.set(file.name,'matched')
      const topics = extractTopics(lines,file.name)
      if (topics.length) usage.set(file.name,'used')
      for (const topic of topics) {
        const key = textKey(topic.name)
        let existing = collected.get(key)
        if (!existing) {
          existing = {name:topic.name, points:new Set(), sources:new Set()}
          collected.set(key,existing)
        }
        existing.sources.add(file.name)
        for (const point of topic.points) existing.points.add(point)
      }
    }
    return Array.from(collected.values(),entry => ({
      name:entry.name, points:[...entry.points], source:[...entry.sources].join(' · '),
    }))
  }
  function focusScore(topic, requirements) {
    if (!requirements) return 0
    const content = textKey([topic.name,...topic.points].join(' '))
    const pairs = textKey(requirements).match(/[\p{L}\p{N}]+/gu) || []
    let score = requirements.includes(topic.name) ? topic.name.length * 2 : 0
    for (const token of pairs) {
      for (let i=0; i+1<token.length; i++) if (content.includes(token.slice(i,i+2))) score++
    }
    return score
  }
  const sourcesOf = data => [
    ...(data.courses.length ? [{kind:'catalog',name:'本次课程清单'}] : []),
    ...data.attachments.map(file=>({kind:'material',name:file.name})),
    ...(data.requirements ? [{kind:'requirements',name:'补充要求'}] : []),
  ]
  function checkAbort(signal) {
    if (signal?.aborted) throw new DOMException('已取消生成。', 'AbortError')
  }
  function suggestionsFor(major) {
    return referenceSubjects.find(([name])=>name===major.replace(/专业$/,''))?.[1] || []
  }
  const unusedNotices = files => files.map(f=>'《'+f.name+'》未用于知识整理，'+f.reason+'。')
  async function localGraph(data, reason, signal, onProgress) {
    const files = indexFiles(data.attachments,data.courses)
    const structured = hasCurriculum(data)
    const references = suggestionsFor(data.major)
    const referenceSource = '专业课程建议（待审核）'
    let courseSource = '本次课程清单'
    let courses = data.courses
    if (!courses.length) {
      const fromFiles = coursesFromFiles(files)
      if (fromFiles.length) {
        courses = fromFiles
        courseSource = '课程材料'
      } else if (references.length) {
        courses = references.map(([name],i)=>({id:'suggested-'+(i+1),name}))
        courseSource = referenceSource
      } else {
        const unread = files.length ? ' 未能从'+files.map(f=>'《'+f.name+'》').join('、')+'中识别课程名称。' : ''
        throw new Error(reason+unread+' 请添加注明课程名称的课程大纲、知识图谱等材料，或连接模型服务后按专业名称生成。')
      }
    }
    const result = []
    const usage = new Map()
    for (const [i,course] of courses.entries()) {
      // Allow the browser to paint progress and dispatch dialog cancellation.
      if (i && i % batchSize === 0) await new Promise(resolve=>setTimeout(resolve,0))
      checkAbort(signal)
      const matched = collectTopics(files,course,usage)
      if (structured || course.topics?.length) {
        const ordered = matched.sort((a,b)=>focusScore(b,data.requirements)-focusScore(a,data.requirements))
        result.push(mergeArchivedCourse(course,ordered))
        onProgress?.({completed:i+1,total:courses.length,message:'正在整理课程底稿和补充材料'})
        continue
      }
      const reference = references.find(([name])=>textKey(name)===textKey(course.name))
      const topics = matched.length ? matched : (reference?.[1] || []).map(([name,...points])=>({name,points,source:referenceSource}))
      const ranked = topics.map(topic=>({topic,score:focusScore(topic,data.requirements)})).sort((a,b)=>b.score-a.score).map(x=>x.topic)
      const source = unique([courseSource,...ranked.map(topic=>topic.source)]).join(' · ')
      result.push({ ...course, source:topics.length?source:source+' · 待补充课程大纲', topics:ranked })
      onProgress?.({completed:i+1,total:courses.length,message:'正在按课程整理知识内容'})
    }
    checkAbort(signal)
    const pending = result.filter(c=>!c.topics.length).length
    const notices = [reason]
    if (data.requirements) notices.push(structured?'本地整理保留底稿顺序，补充材料按要求中的关键词排序，其他要求待复核。':'本地整理按补充要求中的关键词调整主题顺序，其他编排要求待复核。')
    if (pending) notices.push(pending+' 门课程尚待补充知识内容。')
    const sources = sourcesOf({...data,attachments:data.attachments.filter(file=>usage.get(file.name)==='used')})
    const unusedMaterials = data.attachments.filter(file=>usage.get(file.name)!=='used').map(file=>({
      name:file.name,
      reason:usage.has(file.name) ? '已匹配课程，但未提取到知识主题' : '未匹配本次课程',
    }))
    notices.push(...unusedNotices(unusedMaterials))
    if (result.some(c=>c.topics.some(t=>t.source===referenceSource))) sources.push({kind:'suggestion',name:referenceSource})
    if (structured) {
      const graph = curriculumGraph(data,result)
      return {...graph,modeLabel:'课程底稿与资料整理',notice:[graph.notice,...notices].join(' '),sources:[...graph.sources,...sources],unusedMaterials}
    }
    return {major:data.major,mode:'local',modeLabel:'本地资料整理',notice:notices.join(' '),requirements:data.requirements,sources,unusedMaterials,courses:result,relations:resolveRelations(result,data)}
  }
  function checkedBatch(graph, batch) {
    if (graph?.major !== batch.major || graph?.mode !== 'ai' || !Array.isArray(graph.courses) || !graph.courses.length) throw new Error('模型结果缺少有效的课程图谱。')
    const byId = new Map()
    for (const c of graph.courses) {
      if (!title(c?.id) || !title(c?.name) || !title(c?.source) || byId.has(c.id) || !Array.isArray(c.topics) || !c.topics.length ||
          !c.topics.every(t=>title(t?.name) && title(t?.source) && (Array.isArray(t.sections) ?
            t.sections.every(s=>title(s?.name) && Array.isArray(s.points) && s.points.every(p=>title(p))) :
            Array.isArray(t.points) && t.points.length && t.points.every(p=>title(p))))) {
        throw new Error('模型返回的课程知识结构不完整。')
      }
      byId.set(c.id,c)
    }
    if (!batch.courses.length) return graph.courses
    if (byId.size!==batch.courses.length || batch.courses.some(c=>byId.get(c.id)?.name!==c.name)) throw new Error('模型返回的课程与本次课程清单不一致。')
    return batch.courses.map(c=>byId.get(c.id))
  }
  async function generate(raw, {signal,onProgress} = {}) {
    checkAbort(signal)
    const data = validateInput(raw)
    let reason = '当前使用本地资料整理。'
    if (!/^https?:$/.test(root.location?.protocol) || typeof root.fetch !== 'function') {
      reason = '当前离线运行，已使用本地资料整理。'
    } else {
      const listed = data.courses.length ? [] : coursesFromFiles(indexFiles(data.attachments,[]))
      const catalog = data.courses.length ? data.courses : listed
      const courses = []
      const models = new Set()
      const outlineIndex = builtInSections(data)
      try {
        for (let i=0; i<Math.max(1,catalog.length); i+=batchSize) {
          checkAbort(signal)
          const batch = {...data,courses:catalog.slice(i,i+batchSize)}
          // Cross-course edges are resolved only after every course has its final index.
          delete batch.relationSeeds
          batch.attachments = batchMaterials(data.attachments,outlineIndex,batch.courses)
          if (batch.attachments.reduce((sum,file)=>sum+file.text.length,0)>maxMaterialChars) {
            throw new Error('课程材料正文超过模型单次可处理的 16 万字。')
          }
          onProgress?.({completed:i,total:catalog.length,message:catalog.length?'正在生成第 '+(i+1)+' 至 '+(i+batch.courses.length)+' 门课程':'正在按专业名称生成课程建议'})
          const response = await root.fetch('/api/knowledge-domain',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(batch),signal})
          if (!response.ok) {
            const labels = {404:'当前服务未提供知识图谱接口。',413:'材料超出模型请求容量。',503:'模型服务尚未配置或暂不可用。',504:'模型服务响应超时。'}
            throw new Error(labels[response.status] || '模型服务未能完成生成。')
          }
          if (!response.headers?.get('content-type')?.includes('application/json')) throw new Error('当前服务未提供知识图谱接口。')
          const graph = await response.json()
          const validated = checkedBatch(graph,batch)
          if (listed.length) {
            for (const course of validated) course.source = course.source.replace(/^本次课程清单/,'材料所列课程')
          }
          courses.push(...validated)
          if (title(graph.model)) models.add(graph.model)
          checkAbort(signal)
        }
        onProgress?.({completed:courses.length,total:courses.length,message:'已生成 '+courses.length+' 门课程知识图谱'})
        const sources = [...sourcesOf(data),...Array.from(models,name=>({kind:'model',name:'生成模型 · '+name}))]
        if (hasCurriculum(data)) {
          const foundation = await localGraph(data,'',signal)
          const merged = foundation.courses.map((course,i)=>mergeCurriculumCourse(course,courses[i].topics))
          const added = merged.reduce((count,course,i)=>count+leafCount(course)-leafCount(foundation.courses[i]),0)
          const notice = added ? '已保留课程知识底稿及材料内容，模型补充 '+added+' 个知识点，待审核。' :
            '模型未提供底稿和材料以外的有效知识点，已保留课程知识底稿。'
          const cited = new Set(merged.flatMap(c=>c.topics.flatMap(u=>u.sections.flatMap(s=>
            (s.pointSources || []).map(origin=>origin.fileName).filter(Boolean)))))
          const unusedMaterials = foundation.unusedMaterials.filter(file=>!cited.has(file.name))
          const newlyUsed = foundation.unusedMaterials.filter(file=>cited.has(file.name)).map(file=>({kind:'material',name:file.name}))
          return {...foundation,mode:added?'ai':'local',modeLabel:added?'课程底稿与 AI 补充':'课程底稿与资料整理',
            notice:[notice,...unusedNotices(unusedMaterials)].join(' '),sources:[...foundation.sources,...newlyUsed,...sources.filter(s=>s.kind==='model')],
            unusedMaterials,courses:merged,relations:resolveRelations(merged,data)}
        }
        return {major:data.major,mode:'ai',modeLabel:'AI 辅助生成',notice:catalog.length?'课程知识内容待审核。':'课程设置与知识内容为专业建设建议，待审核。',requirements:data.requirements,sources,courses,relations:resolveRelations(courses,data)}
      } catch (error) {
        checkAbort(signal)
        if (error?.name==='AbortError') throw error
        reason = (error instanceof TypeError ? '模型服务连接失败。' : title(error?.message) || '模型服务暂不可用。')+' 已转为本地资料整理。'
      }
    }
    checkAbort(signal)
    return localGraph(data,reason,signal,onProgress)
  }
  root.KnowledgeDomainModel = {generate,fromCurriculum,previousRevision,upgradeCurriculum,validateInput,indexFiles,sectionFor,hasCurriculum,mergeArchivedCourse,batchSize,maxMaterialChars}
})(globalThis)
