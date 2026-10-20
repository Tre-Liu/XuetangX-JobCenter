/** Shared, deterministic talent-plan state, matching and document generation. No remote AI requests. */
;(function (root) {
  const D = root.TalentPlanData
  const storageKey = 'major-construction.ai-talent-plan.v1'
  const copy = value => JSON.parse(JSON.stringify(value))
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`
  const undergraduate = draft => String(draft.level).includes('本科')
  const definitions = [
    ['name','专业名称'], ['code','专业代码'], ['admission','入学要求'], ['duration','修业年限'],
    ['occupation','职业面向'], ['goals','培养目标'], ['requirements','毕业要求'], ['courses','课程体系'],
    ['schedule','教学进程安排'], ['faculty','师资队伍'], ['conditions','教学条件'], ['quality','质量保障'], ['graduation','毕业与学位授予']
  ]
  const engineeringOutcomes = ['工程知识','问题分析','设计/开发解决方案','研究','使用现代工具','工程与可持续发展','工程伦理和职业规范','个人与团队','沟通','项目管理','终身学习']
  const engineeringUrl='https://www.ceeaa.org.cn/gcjyzyrzxh/xwdt/tzgg56/677023/2024120114575853318.pdf'
  const templates=[
    {id:'undergraduate-school',name:'本科培养方案校本框架',level:'本科',version:'校本结构',note:'按学校人才培养制度补充；不设职业面向。'},
    {id:'engineering-2024',name:'工程教育认证导向本科框架',level:'本科',version:'2024版',note:'以工程教育认证通用标准组织章节；适用专业范围与补充标准需确认。章节顺序为校本建议结构。'},
    ...[
      ['applied-undergraduate','应用型本科产教融合框架','本科',[['industry','产业需求与专业定位'],['practice','实践教学与协同育人']]],
      ['vocational-bachelor','职业本科技术技能培养框架','本科',[['position','专业定位与技术领域'],['practice','高层次技术技能实践'],['certificates','职业能力评价与证书衔接']]],
      ['digital-undergraduate','本科数字化与跨学科培养框架','本科',[['digital','数字素养与技术应用'],['interdisciplinary','跨学科课程与项目实践']]],
      ['innovation-undergraduate','本科创新创业培养框架','本科',[['innovation','创新创业教育'],['projects','科研训练与综合项目']]],
      ['industry-vocational','高职产教融合协同育人框架','高职专科',[['industry','产业需求与岗位分析'],['practice','校企协同与实践教学']]],
      ['apprenticeship-vocational','高职学徒制培养框架','高职专科',[['apprenticeship','校企双主体培养机制'],['rotation','岗位轮训与企业导师'],['assessment','学徒培养评价']]],
      ['modular-vocational','高职模块化项目课程框架','高职专科',[['modules','能力模块与课程组织'],['projects','典型工作任务与项目实施'],['certificates','课程评价与证书衔接']]]
    ].map(([id,name,level,extras])=>({id,name,level,extras,version:'校本结构',note:'校本编制建议：围绕'+extras.map(x=>x[1]).join('、')+'组织章节；具体要求按学校制度及适用专业标准核对。'})),
    {id:'vocational-2025',name:'高职专科专业教学标准框架',level:'高职专科',version:'2025版',note:'保留职业面向；具体要求按所选专业教学标准执行。'}
  ]
  const isEngineering=d=>undergraduate(d) && d.templateId==='engineering-2024'
  const chapterDefs = draft => {
    if(Array.isArray(draft.chapterOutline)&&draft.chapterOutline.length)return copy(draft.chapterOutline)
    let rows=definitions.filter(([id]) => id !== 'occupation' || !undergraduate(draft)).map(([id,title])=>({id,title: id === 'graduation' && !undergraduate(draft) ? '毕业条件' : title}))
    if(isEngineering(draft)) {
      rows.splice(rows.findIndex(c=>c.id==='goals'),0,{id:'students',title:'学生发展与学业支持'})
      rows.splice(rows.findIndex(c=>c.id==='schedule'),0,{id:'support',title:'毕业要求支撑矩阵'})
      rows=rows.map(c=>({...c,title:c.id==='quality'?'评价与持续改进':c.id==='conditions'?'支持条件':c.title}))
    }
    const extra=templates.find(t=>t.id===draft.templateId)?.extras||[]
    rows.splice(rows.findIndex(c=>c.id==='schedule'),0,...extra.map(([id,title])=>({id,title})))
    return rows
  }
  const editableOutline=d=>d.chapterOutline||(d.chapterOutline=chapterDefs(d))
  const addChapter=(d,title)=>{
    title=String(title||'').trim().slice(0,80);if(!title)return null
    const id=uid('chapter');editableOutline(d).push({id,title});d.chapters[id]='';return id
  }
  const renameChapter=(d,id,title)=>{const c=editableOutline(d).find(c=>c.id===id);title=String(title||'').trim().slice(0,80);if(c&&title)c.title=title}
  const moveChapter=(d,id,offset)=>{const rows=editableOutline(d),i=rows.findIndex(c=>c.id===id),j=i+offset;if(i>=0&&j>=0&&j<rows.length)[rows[i],rows[j]]=[rows[j],rows[i]]}
  const removeChapter=(d,id)=>{const rows=editableOutline(d);if(rows.length>1)d.chapterOutline=rows.filter(c=>c.id!==id)}

  const chapterRules=(d,id)=>{
    if(!isEngineering(d))return ['按学校培养方案编制制度明确本章要求。','对缺失的学校事实保留待补充状态。']
    const rules={
      students:['4.1 学生：说明学业支持、过程跟踪和学分认定机制。'],
      goals:['3.1、4.2：体现毕业后5年左右的预期职业胜任力。','记录学校定位、需求调研与行业专家参与情况。'],
      requirements:['4.3：覆盖2024版11项毕业要求，设置可衡量的校本指标点。','保留指标与培养目标、课程及评价证据之间的关系。'],
      courses:['4.4：课程支撑毕业要求，记录行业专家参与。','2024版：数学与自然科学至少15%；工程实践与毕业设计至少20%。','不得沿用旧版30%及15%两项比例门槛，专业补充标准另行核对。'],
      support:['4.3、4.4、4.7：形成目标、毕业要求、课程和评价证据之间的追溯关系。','岗位能力关系覆盖不能替代毕业要求达成评价。'],
      faculty:['4.5：填入实际师资数量、结构、工程背景及教学投入。'],
      conditions:['4.6：填入实际设施、资源、经费和服务保障。'],
      quality:['4.7：从课程目标评价连接毕业要求评价，记录改进责任、行动和验证结果。']
    }
    return rules[id] || ['章序为校本建议，认证标准并未规定培养方案统一目录。']
  }
  const standardUrl = 'https://www.moe.gov.cn/s78/A07/zcs_ztzl/2017_zt06/17zt06_bznr/bznr_zyjyzyjxbz/gdzyjy_zk/zk_tmjzdl/tmjzdl_tjsgl/202502/P020250207512764318855.pdf'
  const policyUrl = 'https://www.moe.gov.cn/srcsite/A07/zcs_zhgg/202101/t20210129_511682.html'
  const references = [
    {id:'eng-goals',title:'本科培养目标编写',section:'3.1 / 4.2',source:'工程教育认证标准（2024版）',code:'CEEAA 2024',level:'全日制工程类本科',year:'2024',kind:'认证标准',url:engineeringUrl,text:'培养目标应体现毕业后约5年的预期胜任力，结合校情与利益相关方需求定期修订。',note:'要点概述；认证适用性与专业补充标准需按专业确认。'},
    {id:'eng-outcomes',title:'11项毕业要求框架',section:'4.3.1—4.3.11',source:'工程教育认证标准（2024版）',code:'CEEAA 2024',level:'全日制工程类本科',year:'2024',kind:'认证标准',url:engineeringUrl,text:'毕业要求范围：'+engineeringOutcomes.join('、')+'。',note:'校本指标应可衡量；框架覆盖不等于认证通过。'},
    {id:'eng-courses',title:'课程结构与持续改进',section:'4.4 / 4.7',source:'工程教育认证标准（2024版）',code:'CEEAA 2024',level:'全日制工程类本科',year:'2024',kind:'认证标准',url:engineeringUrl,text:'数学与自然科学学分至少15%，工程实践与毕业设计至少20%；课程与评价结果应支撑持续改进。',note:'要点概述；计算须基于全量课程及准确类别。'},
    { id:'gb-goals', title:'培养目标与培养规格', section:'6 培养目标 / 7 培养规格', source:'智能建造技术专业教学标准', code:'440304', level:'高职专科', year:'2025', kind:'专业教学标准', url:standardUrl, text:'围绕智能建造技术领域，统筹文化基础、技术技能与职业素养培养，结合区域产业和学校定位形成人才培养目标。', note:'条目概述；关联专业参考，不能直接替代本科培养要求。' },
    { id:'gb-courses', title:'课程设置与教学内容', section:'8 课程设置及学时安排', source:'智能建造技术专业教学标准', code:'440304', level:'高职专科', year:'2025', kind:'专业教学标准', url:standardUrl, text:'以公共基础课程和专业课程构建课程体系，专业课程内容对接典型任务、技术应用和实践教学。', note:'条目概述；具体课程和数值要求以原文为准。' },
    { id:'gb-quality', title:'教学实施与质量保障', section:'11.1 质量保障', source:'智能建造技术专业教学标准', code:'440304', level:'高职专科', year:'2025', kind:'专业教学标准', url:standardUrl, text:'结合实际教学条件组织理实一体教学，建立教学质量评价与持续改进机制。', note:'条目概述；关联专业参考。' },
    { id:'policy-position', title:'本科层次人才培养定位', section:'第一章 第二、三条', source:'本科层次职业教育专业设置管理办法（试行）', code:'教职成厅〔2021〕1号', level:'职业本科', year:'2021', kind:'国家政策', url:policyUrl, text:'专业设置应面向产业发展需求，体现职业教育类型特点，系统设计高层次技术技能人才培养。', note:'政策要点概述，不作为专业教学标准。' }
  ]
  const majorOptions = d => (root.TalentPlanStandards?.majors||[]).filter(m=>m.level===d.level)
  const blank = () => ({version:1,draft:null,results:[]})
  const createDraft = (mode='upload') => ({
    id:uid('plan'), mode, templateId:'undergraduate-school', step:1, name:'智能建造工程2026级人才培养方案', major:'智能建造工程', code:'240302', year:'2026', level:'职业本科', years:4,
    region:'辽宁省', direction:'数字建造与智慧施工', source:null, standardId:'gb-goals', jobIds:[],courseIds:[],customCourses:[], relations:[], chapters:{},chapterHtml:{}, baseline:{},citations:[],history:[], generated:false, updatedAt:new Date().toISOString()
  })
  const validateFile = file => !/\.(pdf|docx|txt)$/i.test(file.name || '') ? '支持 PDF、DOCX、TXT 文件' : !file.size ? '文件为空，请重新选择' : file.size > 30*1024*1024 ? '文件不能超过 30 MB' : ''
  const parseText = input => {
    const text=String(input || '').replace(/\r\n?/g,'\n').replace(/\u0000/g,'').trim()
    const headings = { '专业名称':'name','专业代码':'code','入学要求':'admission','修业年限':'duration','学制':'duration','职业面向':'occupation','培养目标':'goals','培养目标及规格':'goals','培养目标与培养规格':'goals','培养规格':'requirements','毕业要求':'requirements','课程设置':'courses','课程体系':'courses','课程设置及学时安排':'courses','教学进程安排':'schedule','教学进度安排':'schedule','学生发展与学业支持':'students','毕业要求支撑矩阵':'support','支持条件':'conditions','评价与持续改进':'quality','师资队伍':'faculty','师资要求':'faculty','教学条件':'conditions','教学设施':'conditions','质量保障':'quality','毕业条件':'graduation','毕业与学位授予':'graduation' }
    const matches=[]; let offset=0
    for(const line of text.split('\n')) {
      const heading=line.trim().replace(/^(?:第[一二三四五六七八九十\d]+[章节]|[一二三四五六七八九十\d]+[、.．\s])\s*/,'').replace(/[：:]$/,'').trim()
      if(headings[heading]) matches.push({id:headings[heading], start:offset, end:offset+line.length+1})
      offset+=line.length+1
    }
    const chapters={}
    matches.forEach((m,i)=>{ const value=text.slice(m.end,matches[i+1]?.start ?? text.length).trim();chapters[m.id]=[chapters[m.id],value].filter(Boolean).join('\n\n') })
    return {text,chapters,recognized:Object.keys(chapters).length}
  }
  const selectedJobs = d => D.jobs.filter(j=>d.jobIds.includes(j.id))
  const courseCatalog = d => [...D.courses,...(d.customCourses||[])]
  const addCourse = (d,input) => {
    const fields={}
    for(const [key,label] of [['code','代码'],['name','名称'],['type','类型'],['semester','开课学期'],['college','开课单位']]){
      fields[key]=String(input[key]??'').trim()
      if(!fields[key])throw new Error('请填写课程'+label)
    }
    const credits=Number(input.credits)
    if(String(input.credits??'').trim()==='' || !Number.isFinite(credits) || credits<0)throw new Error('学分须为大于或等于0的数字')
    if(courseCatalog(d).some(c=>c.code.toLowerCase()===fields.code.toLowerCase()))throw new Error('课程代码已存在，请使用其他代码')
    const c={...fields,id:uid('course'),credits,hours:null,jobIds:[],source:'用户录入，待教务核对',createdAt:new Date().toISOString()}
    d.customCourses=[...(d.customCourses||[]),c];d.courseIds=[...new Set([...d.courseIds,c.id])]
    return c
  }
  const selectedCourses = d => courseCatalog(d).filter(c=>d.courseIds.includes(c.id))
  const validRelation = (d,r) => d.jobIds.includes(r.jobId) && d.courseIds.includes(r.courseId) && Array.isArray(r.abilityIds)
  const abilityTokens = ['BIM','模型','识图','制图','构造','测量','测绘','点云','监测','检测','机器人','装备','安全','质量','物联网','传感','平台','项目','管理','进度','装配','构件','绿色','运维','数据']
  const candidateAbilities = (job,course) => {
    const tokens=abilityTokens.filter(t=>course.name.toLowerCase().includes(t.toLowerCase()))
    return job.abilities.filter(a=>tokens.some(t=>a.name.toLowerCase().includes(t.toLowerCase()))).map(a=>a.id)
  }
  const match = draft => {
    const relations=(draft.relations || []).filter(r=>r.confirmed && validRelation(draft,r)).map(copy)
    for(const job of selectedJobs(draft)) for(const course of selectedCourses(draft)) {
      if(relations.some(r=>r.jobId===job.id && r.courseId===course.id)) continue
      if(!course.jobIds.includes(job.id)) continue
      const abilityIds=candidateAbilities(job,course)
      if(abilityIds.length)relations.push({jobId:job.id,courseId:course.id,abilityIds,confirmed:false,manual:false,reason:'岗位库已有课程关系；能力名称与课程主题关键词重合，需核对教学内容'})
    }
    return relations
  }
  const metrics = draft => {
    const all=selectedJobs(draft).flatMap(j=>j.abilities.map(a=>a.id))
    const allowed=new Set(all),covered=new Set()
    for(const r of draft.relations || [])if(r.confirmed && validRelation(draft,r)) {
      const job=D.jobs.find(j=>j.id===r.jobId)
      for(const id of r.abilityIds) if(allowed.has(id) && job?.abilities.some(a=>a.id===id)) covered.add(id)
    }
    return {total:all.length,covered:covered.size,gaps:all.length-covered.size,coverage:all.length?Math.round(covered.size/all.length*100):0,jobs:selectedJobs(draft).length,courses:selectedCourses(draft).length,credits:selectedCourses(draft).reduce((s,c)=>s+c.credits,0),confirmed:(draft.relations||[]).filter(r=>r.confirmed && validRelation(draft,r)).length}
  }
  const validateStep = (d,step) => {
    if(step===1) {
      if(!d.name?.trim() || !d.major?.trim() || !d.code?.trim())return '请填写方案名称、专业名称和专业代码'
      if(d.mode!=='standard' && !d.source?.text)return '请先上传方案，或载入现有培养方案'
      if(d.mode==='standard' && !references.some(r=>r.id===d.standardId))return '请选择起草参考依据'
    }
    if(step===2 && !selectedJobs(d).length)return '请至少关联一个岗位，作为培养要求与课程修订依据'
    if(step===3 && !selectedCourses(d).length)return '请至少引用一门教务课程'
    return ''
  }
  const courseHours=(d,c)=>{
    const name=c.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
    const match=(d.source?.text||'').match(new RegExp(name+'[^\\n。；;]{0,25}?([0-9]{1,4})\\s*学时'))
    return match?Number(match[1]):null
  }
  const generate = d => {
    const jobs=selectedJobs(d),courses=selectedCourses(d),m=metrics(d)
    const skills=jobs.flatMap(j=>{
      const confirmed=new Set((d.relations||[]).filter(r=>r.jobId===j.id&&r.confirmed).flatMap(r=>r.abilityIds))
      const tokens=['BIM','模型','工地','平台','施工','物联','检测','监测','机器人','测量','构件','装配','运维','数据'].filter(t=>j.name.includes(t))
      const ranked=j.abilities.filter(a=>a.category==='技能').sort((a,b)=>(Number(confirmed.has(b.id))*3+tokens.filter(t=>b.name.includes(t)).length)-(Number(confirmed.has(a.id))*3+tokens.filter(t=>a.name.includes(t)).length))
      return ranked.slice(0,2).map(a=>`${j.name}：${a.name}`)
    })
    const original=d.source?.chapters || {}
    const courseLines=courses.map(c=>`${c.code}　${c.name}　${c.credits}学分　${c.type}　${c.semester}`).join('\n')
    const content={
      name:d.major, code:d.code, admission: original.admission || '按本校招生章程及国家招生政策执行，具体入学要求由学校确认。', duration:original.duration || `基本学制${d.years}年，适用${d.year}级。弹性修业年限按学校学籍管理规定执行。`,
      occupation:[original.occupation, jobs.map(j=>`${j.name}（${j.occupation}）\n典型任务：${j.tasks.slice(0,2).map(t=>t.name).join('、')}`).join('\n\n')].filter(Boolean).join('\n\n'),
      goals:[original.goals || `本专业坚持立德树人，服务${d.region || '区域'}产业发展，围绕${d.direction || '专业发展方向'}，培养具有工程基础、技术实践、团队协作和持续学习能力的人才。`, `本次修订重点：结合${jobs.map(j=>j.name).join('、')}等岗位的任务和能力，完善专业实践、数字技术应用及综合问题解决能力培养。`].join('\n\n'),
      requirements:[original.requirements || '学生应达到学校规定的价值观、基础知识、专业能力、职业素养和终身学习要求；各项要求通过课程目标、实践任务及评价证据落实。', ...skills.map((s,i)=>`${i+1}. ${s}。通过相关课程和综合实践形成可评价的能力成果。`)].join('\n\n'),
      courses: [original.courses ? `原方案课程内容：\n${original.courses}` : '', `本次纳入修订的教务课程（${courses.length}门）：\n${courseLines}`, '课程的具体教学目标、内容与考核方式需由课程团队核对。'].filter(Boolean).join('\n\n'),
      schedule:[original.schedule ? '原方案教学进程（保留供修订）：\n'+original.schedule : '', `当前所选${courses.length}门课程，合计${m.credits}学分。此为本次修订课程小计，完整毕业总学分按全量课程和学校规定核定。`,courses.map(c=>`${c.semester}　${c.name}　${c.credits}学分　${courseHours(d,c)?courseHours(d,c)+'学时（原文识别，待核对）':'教务学时待补充'}`).join('\n'),`已确认${m.confirmed}条岗位课程支撑关系，覆盖${m.covered}/${m.total}项岗位能力。该数值是关系覆盖，不是学生学习达成度。`].join('\n\n'),
      faculty: original.faculty || '由学校补充专业负责人、专任教师、行业导师的实际配置，核对教学任务与教师专业背景，落实教师企业实践及教学能力提升安排。',
      conditions:original.conditions || '围绕所选岗位任务及课程，配置建模、智能施工、工程检测和数字管理等教学条件。具体场地、设备数量及校外实践基地由学校据实补充。',
      quality: original.quality || '建立培养目标—毕业要求—课程目标的支撑关系。依据课程考核、实践成果和岗位需求反馈开展评价，记录修订依据，形成持续改进机制。',
      graduation:original.graduation || `学生须完成学校规定的课程、实践教学和毕业环节，满足学分及综合素质要求。${undergraduate(d)?'学位授予条件依照学校学位授予规定执行。':''}本稿中的课程小计不直接作为毕业总学分要求。`
    }
    if(isEngineering(d)) {
      content.students=original.students || '说明学生学业指导、学习过程跟踪、转专业学分认定及支持措施，学校执行情况和责任人待补充。'
      content.goals+='\n\n预期发展：学生毕业后5年左右，能够综合工程知识与数字技术，在相关工程领域承担技术、协作和项目工作，持续提升专业胜任力。具体分目标由学校结合定位与行业调研确定。'
      content.requirements=(original.requirements ? '原方案要求（保留供修订）：\n'+original.requirements+'\n\n' : '')+'认证导向框架（2024版；校本指标待细化）：\n'+engineeringOutcomes.map((title,i)=>`GR${i+1} ${title}`).join('\n')+'\n\n岗位能力修订依据：\n'+skills.join('\n')
      content.courses+='\n\n课程结构核对（2024版）：数学与自然科学类至少占总学分15%；工程实践与毕业设计至少20%。本次仅选取修订课程，不能据此判定全量结构符合要求。'
      content.support='建立培养目标—毕业要求指标点—课程目标—考核证据的支撑表。当前已确认'+m.confirmed+'条岗位与课程能力关系，作为课程修订输入。毕业要求支撑关系和评价证据需另行维护，不能用岗位关系覆盖率推定达成度。'
      content.quality=(original.quality ? original.quality+'\n\n' : '')+'按课程目标、毕业要求和培养目标分别安排评价。记录评价周期、责任人、数据来源、评价结论、改进行动和再次验证结果。建立毕业生跟踪和校外评价反馈机制。实际评价结果待学校提供。'
    }
    if(undergraduate(d))delete content.occupation
    return Object.fromEntries(chapterDefs(d).map(c=>[c.id,content[c.id] || d.chapters?.[c.id] || original[c.id] || `请补充${c.title}的建设要求、实施安排与评价依据，具体学校事实由编制团队据实填写。`]))
  }
  const insertReference = (d,chapterId,referenceId) => {
    const ref=references.find(r=>r.id===referenceId)
    if(!ref || !chapterDefs(d).some(c=>c.id===chapterId))return
    if(d.citations.some(c=>c.chapterId===chapterId && c.referenceId===referenceId))return
    d.chapters[chapterId]=`${d.chapters[chapterId] || ''}\n\n【参考依据｜${ref.source}（${ref.code}），${ref.section}】\n${ref.text}\n适用范围：${ref.level}；${ref.note}`.trim()
    if(d.chapterHtml?.[chapterId] && root.TalentPlanRichText)d.chapterHtml[chapterId]+=root.TalentPlanRichText.paragraphs(`【参考依据｜${ref.source}（${ref.code}），${ref.section}】\n${ref.text}\n适用范围：${ref.level}；${ref.note}`)
    d.citations.push({chapterId,referenceId,source:ref.source,section:ref.section,url:ref.url,level:ref.level,insertedAt:new Date().toISOString()})
  }
  const snapshot = d => ({...copy(d),id:uid('result'),draftId:d.id,savedAt:new Date().toISOString(),status:'已归档'})
  const stringMap=value=>value && typeof value==='object' && !Array.isArray(value)?Object.fromEntries(Object.entries(value).filter(([,v])=>typeof v==='string')):{}
  const replaceSource=(d,source)=>{
    d.source=copy(source);d.chapters={};d.chapterHtml={};d.baseline={};d.citations=[];d.editedChapterIds=[];d.generated=false;d.step=1;d.maxStep=1;d.relations=[]
    return d
  }
  const regenerate=d=>{
    const old=d.chapters||{},citations=copy(d.citations||[]),generated=generate(d)
    for(const id of d.editedChapterIds||[])if(id in generated && old[id])generated[id]=old[id]
    d.chapterHtml=Object.fromEntries(Object.entries(d.chapterHtml||{}).filter(([id])=>(d.editedChapterIds||[]).includes(id)))
    d.chapters={...old,...generated};d.citations=[]
    for(const c of citations){
      if(!(c.chapterId in generated))continue
      const ref=references.find(r=>r.id===c.referenceId);if(!ref)continue
      if(d.chapters[c.chapterId].includes('【参考依据｜'+ref.source+'（'+ref.code+'）'))d.citations.push(c)
      else insertReference(d,c.chapterId,c.referenceId)
    }
    return d.chapters
  }
  const sanitizeDraft = value => {
    if(!value || typeof value!=='object' || Array.isArray(value))return null
    const defaults=createDraft(),d={...defaults,...value}
    for(const key of ['id','name','major','code','year','level','region','direction','updatedAt'])d[key]=typeof value[key]==='string'?value[key]:defaults[key]
    if(!['普通本科','职业本科','高职专科','中职'].includes(d.level))d.level='职业本科'
    d.years=Number.isFinite(Number(value.years))&&Number(value.years)>=1&&Number(value.years)<=8?Number(value.years):defaults.years
    d.mode=['upload','standard','existing'].includes(value.mode)?value.mode:'upload'
    if(!templates.some(t=>t.id===d.templateId))d.templateId=undergraduate(d)?'undergraduate-school':'vocational-2025'
    if(!references.some(r=>r.id===d.standardId))d.standardId=undergraduate(d)?'policy-position':'gb-goals'
    if(Array.isArray(value.chapterOutline)){
      const seen=new Set();d.chapterOutline=value.chapterOutline.filter(c=>c&&typeof c.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(c.id)&&typeof c.title==='string'&&c.title.trim()&&!seen.has(c.id)&&seen.add(c.id)).slice(0,100).map(c=>({id:c.id,title:c.title.trim().slice(0,80)}))
      if(!d.chapterOutline.length)delete d.chapterOutline
    }
    d.removedChapters=Array.isArray(value.removedChapters)?value.removedChapters.filter(c=>c&&typeof c.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(c.id)&&typeof c.title==='string'&&!chapterDefs(d).some(x=>x.id===c.id)).slice(0,100).map(c=>({id:c.id,title:c.title.slice(0,80)})):[]
    d.source=value.source && typeof value.source.text==='string'?{text:value.source.text,fileName:typeof value.source.fileName==='string'?value.source.fileName:'导入的培养方案',chapters:stringMap(value.source.chapters),recognized:Number.isFinite(value.source.recognized)?value.source.recognized:0,bytes:Number.isFinite(value.source.bytes)?value.source.bytes:0,parsedAt:typeof value.source.parsedAt==='string'?value.source.parsedAt:''}:null
    d.jobIds=Array.isArray(value.jobIds)?[...new Set(value.jobIds)].filter(id=>D.jobs.some(j=>j.id===id)):[]
    const seenIds=new Set(D.courses.map(c=>c.id)),seenCodes=new Set(D.courses.map(c=>c.code.toLowerCase()))
    d.customCourses=[]
    for(const c of Array.isArray(value.customCourses)?value.customCourses:[]){
      if(!c || typeof c.id!=='string' || seenIds.has(c.id) || !['code','name','type','semester','college'].every(k=>typeof c[k]==='string'&&c[k].trim()) || typeof c.credits!=='number' || !Number.isFinite(c.credits) || c.credits<0 || seenCodes.has(c.code.toLowerCase()))continue
      d.customCourses.push({id:c.id,code:c.code,name:c.name,type:c.type,semester:c.semester,college:c.college,credits:c.credits,hours:null,jobIds:[],source:'用户录入，待教务核对',createdAt:typeof c.createdAt==='string'?c.createdAt:''})
      seenIds.add(c.id);seenCodes.add(c.code.toLowerCase())
    }
    d.courseIds=Array.isArray(value.courseIds)?[...new Set(value.courseIds)].filter(id=>courseCatalog(d).some(c=>c.id===id)):[]
    d.relations=Array.isArray(value.relations)?value.relations.filter(r=>r && validRelation(d,r)).map(r=>({...r,confirmed:r.confirmed===true,abilityIds:r.abilityIds.filter(id=>D.jobs.find(j=>j.id===r.jobId)?.abilities.some(a=>a.id===id))})):[]
    d.chapters=stringMap(value.chapters);d.chapterHtml=stringMap(value.chapterHtml);d.baseline=stringMap(value.baseline)
    if(undergraduate(d))delete d.chapters.occupation
    d.editedChapterIds=Array.isArray(value.editedChapterIds)?value.editedChapterIds.filter(id=>chapterDefs(d).some(c=>c.id===id)):[]
    d.citations=Array.isArray(value.citations)?value.citations.filter(c=>c && references.some(r=>r.id===c.referenceId) && chapterDefs(d).some(x=>x.id===c.chapterId)).map(c=>{const r=references.find(r=>r.id===c.referenceId);return {...c,source:r.source,section:r.section,url:r.url,level:r.level}}):[]
    d.history=Array.isArray(value.history)?value.history.filter(h=>h && typeof h.title==='string' && typeof h.at==='string').slice(-80):[]
    d.generated=value.generated===true && Object.keys(d.chapters).length>0
    d.step=Math.max(1,Math.min(5,Number(value.step)||1));d.maxStep=Math.max(d.step,Math.min(5,Number(value.maxStep)||d.step))
    // Resume drafts saved at the retired relation stage at generation review.
    if(d.step===4)d.step=5
    if(d.maxStep===4)d.maxStep=5
    if(d.step>1 && validateStep(d,1))d.step=1
    if(d.step>2 && validateStep(d,2))d.step=2
    if(d.step>3 && validateStep(d,3))d.step=3
    return d
  }
  const sanitize = value => value?.version===1 ? {version:1,...(value.existingPlanHidden===true?{existingPlanHidden:true}:{}),...(Array.isArray(value.deletedPlanIds)?{deletedPlanIds:[...new Set(value.deletedPlanIds.filter(id=>typeof id==='string'))]}:{}),draft:sanitizeDraft(value.draft),...(Array.isArray(value.drafts)?{drafts:value.drafts.map(sanitizeDraft).filter(Boolean).slice(-10)}:{}),results:Array.isArray(value.results)?value.results.filter(r=>r && typeof r.id==='string' && r.chapters && typeof r.chapters==='object').map(sanitizeDraft).filter(Boolean).slice(-30):[]} : blank()
  const load = storage => {try{return sanitize(JSON.parse(storage.getItem(storageKey)))}catch{return blank()}}
  const mergeState=(current,remote,lastSavedStamp)=>{
    const next=copy(current),latest=sanitize(remote)
    const deleted=new Set([...(next.deletedPlanIds||[]),...(latest.deletedPlanIds||[])])
    if(deleted.size)next.deletedPlanIds=[...deleted]
    if(next.existingPlanHidden||latest.existingPlanHidden)next.existingPlanHidden=true
    for(const state of [next,latest]){
      if(deleted.has(state.draft?.id))state.draft=null
      state.drafts=(state.drafts||[]).filter(d=>!deleted.has(d.id))
      state.results=(state.results||[]).filter(r=>!deleted.has(r.id))
    }
    const results=new Map([...latest.results,...(next.results||[])].map(r=>[r.id,r]))
    const drafts=new Map([...(latest.drafts||[]),...(next.drafts||[])].map(d=>[d.id,d]))
    if(latest.draft && next.draft && latest.draft.id===next.draft.id && lastSavedStamp && latest.draft.updatedAt!==lastSavedStamp){
      drafts.set(latest.draft.id,latest.draft);next.draft.id=uid('plan');next.draft.history=[...(next.draft.history||[]),{title:'保留多窗口修订分支',detail:'另一窗口已更新同一草稿，当前修改作为独立草稿保存',at:new Date().toISOString()}]
    }else if(latest.draft && latest.draft.id!==next.draft?.id && (latest.draft.source||latest.draft.jobIds.length||latest.draft.generated))drafts.set(latest.draft.id,latest.draft)
    drafts.delete(next.draft?.id)
    next.results=[...results.values()].slice(-30);if(drafts.size||next.drafts)next.drafts=[...drafts.values()].slice(-10)
    return next
  }
  const exportHtml = d => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(d.name)}</title><style>body{font-family:Arial,'Microsoft YaHei',sans-serif;max-width:800px;margin:40px auto;color:#223;line-height:1.9}h1{text-align:center}h2{font-size:20px;border-bottom:1px solid #ddd;padding-top:20px}p{white-space:pre-wrap}small{color:#667}table{border-collapse:collapse;width:100%;margin:18px 0}td,th{border:1px solid #ccd4df;padding:7px;text-align:left}th{background:#f2f5fa}img{max-width:100%;height:auto}li{margin:4px 0}</style></head><body><h1>${esc(d.name)}</h1><p>${esc(d.major)} · ${esc(d.code)} · ${esc(d.level)} · ${esc(d.year)}级</p>${chapterDefs(d).map((c,i)=>`<section><h2>${i+1}. ${esc(c.title)}</h2>${root.TalentPlanRichText?root.TalentPlanRichText.chapter(d,c.id):`<p>${esc(d.chapters[c.id]||'待补充')}</p>`}</section>`).join('')}<h2>参考依据</h2>${(d.citations||[]).map(c=>`<p>${esc(c.source)} · ${esc(c.section)} · ${esc(c.level)}<br>${esc(c.url)}</p>`).join('') || '<p>暂无已引用资料</p>'}<small>本文件为培养方案建议稿，具体要求以学校审定版本为准。</small></body></html>`
  root.TalentPlanModel={majorOptions,addChapter,renameChapter,moveChapter,removeChapter,courseCatalog,addCourse,courseHours,mergeState,replaceSource,regenerate,templates,engineeringOutcomes,chapterRules,isEngineering,storageKey,copy,esc,uid,undergraduate,chapterDefs,references,createDraft,parseText,validateFile,selectedJobs,selectedCourses,match,metrics,validateStep,generate,insertReference,snapshot,sanitize,load,exportHtml,blank}
})(globalThis)
