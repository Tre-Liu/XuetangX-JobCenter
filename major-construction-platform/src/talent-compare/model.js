/** Local structural comparison. School catalog profiles are generated, NOT verified school facts. */
;(function(root){
  const copy = value => JSON.parse(JSON.stringify(value))
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const categories = ['专业拓展课程','专业基础课程','专业核心课程','公共基础课程','实践专项']
  const keywords = ['职业素养','专业知识','BIM应用','质量管理','数字素养','创新意识','智能建造','检测监测']
  const goalSeeds = ['践行社会主义核心价值观，具有良好的职业素养、工匠精神和工程伦理意识。','掌握专业知识与技术技能，形成工程实践和持续学习能力。','运用BIM应用、智能建造与数字素养，解决工程现场技术问题。','具备质量管理、检测监测与安全生产能力，参与项目协同管理。','具有创新意识、跨专业协作能力与可持续发展能力。']
  const specSeeds = ['理想信念与家国情怀','职业道德与社会责任','文化基础与科学素养','沟通合作与外语应用','建筑力学与结构基础','电工电子与自动控制','BIM应用与专业知识','智能装备操作','质量管理与安全生产','智慧工地应用','数字素养与智能建造','终身学习与问题解决','创新意识与国际视野','身心健康与运动技能','美育素养','劳动素养与工匠精神']
  const numeric = value => typeof value === 'number' && Number.isFinite(value) && value >= 0
  const formatValue = value => numeric(value) ? String(Number(value.toFixed(1))) : '未提取'
  const filterPlans=(plans,query='',level='') => {
    const words=String(query).toLowerCase().trim().split(/\s+/).filter(Boolean)
    return plans.filter(p=>(!level||p.type===level) && words.every(w=>[p.name,p.school,p.major,p.year,...p.keywords||[]].join(' ').toLowerCase().includes(w)))
  }
  const toggleSelection=(ids,id)=>ids.includes(id)?ids.filter(x=>x!==id):ids.length<2?[...ids,id]:[...ids]
  const standardUrl='https://www.moe.gov.cn/s78/A07/zcs_ztzl/2017_zt06/17zt06_bznr/bznr_zyjyzyjxbz/gdzyjy_zk/zk_tmjzdl/tmjzdl_tjsgl/202502/P020250207512764318855.pdf'
  const standards=[{
    id:'national-440304-2025',name:'智能建造技术专业教学标准',school:'教育部',major:'智能建造技术',code:'440304',type:'高职专科',year:'2025',kind:'standard',url:standardUrl,
    summary:'培养目标、培养规格与课程设置要求。适用于高等职业教育专科智能建造技术专业。',basis:'教育部专业教学标准原文摘录',
    profile:{goals:['培养具备职业综合素质和行动能力，掌握专业知识和技术技能，能够从事建筑智能化施工技术与管理等工作的高技能人才。'],requirements:specSeeds,indicators:null,
      courses:['建筑信息模型应用','智能测量技术','智能机械与机器人','智能建造施工技术','建筑工程施工组织','建筑工程质量与安全管理','智能检测与监测技术'].map(name=>({name,credits:null,semester:null,category:'专业核心课程'})),
      rules:['总学时一般为2700学时，每16～18学时折算1学分。','公共基础课总学时一般不少于总学时的25%。','实践性教学学时原则上不少于总学时的50%。','各类选修课程的学时累计不少于总学时的10%。'],requirementLabel:'培养规格',coreLabel:'核心课程领域'}
  }]
  const catalogProfile=record=>{
    const index=Math.max(0,root.TalentPlanResearchData.plans.findIndex(p=>p.id===record.id))
    const count=[74,68,57,60,53,49][index]
    const courses=(root.TalentPlanData?.courses||[]).filter((c,i)=>i<count).map((c,i)=>({
      name:c.name,credits:c.credits,semester:Number(String(c.semester).match(/第(\d+)学期/)?.[1])||null,
      category:/核心/.test(c.type)?'专业核心课程':/公共|通识/.test(c.type)?'公共基础课程':/实践|实习|第二课堂/.test(c.type)?'实践专项':/选修|拓展/.test(c.type)?'专业拓展课程':'专业基础课程'
    }))
    return {goals:[...goalSeeds.slice(0,[5,4,4,5,3,4][index]),record.summary],requirements:specSeeds.slice(0,[13,11,16,14,12,10][index]),indicators:[32,28,30,28,24,22][index],courses}
  }
  const profile=record=>copy(record.profile||catalogProfile(record))
  const validate=(source,target)=>!source||!target?'请选择比对方案和被比对方案':source.id===target.id?'同一方案不能重复比对':''
  const sumCredits=p=>p.courses.length && p.courses.every(c=>numeric(c.credits))?Number(p.courses.reduce((n,c)=>n+c.credits,0).toFixed(1)):null
  const pair=(source,target)=>({source,target,delta:numeric(source)&&numeric(target)?Number((target-source).toFixed(1)):null})
  const keywordScore=(p,k)=>Math.min(10,(p.goals.join(' ')+p.requirements.join(' ')+p.courses.map(c=>c.name).join(' ')).split(k).length*1.5-1.5)
  const buildReport=(source,target)=>{
    const error=validate(source,target);if(error)throw new Error(error)
    const a=profile(source),b=profile(target),standard=target.kind==='standard'
    const credits=pair(sumCredits(a),standard?null:sumCredits(b))
    const metrics={versions:2,goals:pair(a.goals.length||null,b.goals.length||null),requirements:pair(a.requirements.length||null,b.requirements.length||null),indicators:pair(a.indicators,b.indicators),credits,core:pair(a.courses.length?a.courses.filter(c=>c.category==='专业核心课程').length:null,b.courses.length?b.courses.filter(c=>c.category==='专业核心课程').length:null)}
    const radar=keywords.map(name=>({name,source:keywordScore(a,name),target:keywordScore(b,name)}))
    const common=radar.filter(k=>k.source>0&&k.target>0).map(k=>k.name)
    const sourceFocus=radar.filter(k=>k.source>k.target).map(k=>k.name)
    const targetFocus=radar.filter(k=>k.target>k.source).map(k=>k.name)
    const applicability=standard&&source.type!==target.type?`本方方案为${source.type||'未明确层次'}，所选标准适用于${target.type}（${target.code}）。本次作为关联专业参考，不据此作达标结论。`:standard?'所选标准适用于高职专科智能建造技术专业（440304）；同层次的其他专业仍需核对适用专业。':''
    const estimated=!source.profile||!target.profile
    const basis=estimated?'方案结构测算：课程清单引用平台教务课程，目标与要求按目录摘要组织，尚未与学校原文核验。':standard?'依据上传正文与教育部专业教学标准摘录进行条目对照；课程领域不等同于学校必开课程。':'依据上传方案正文进行结构对照；未提取字段保留缺失状态。'
    const changes=a.courses.length&&b.courses.length?{added:b.courses.filter(c=>!a.courses.some(x=>x.name===c.name)),removed:a.courses.filter(c=>!b.courses.some(x=>x.name===c.name))}:{added:[],removed:[]}
    const directional=sourceFocus.length&&targetFocus.length?`本方资料在${sourceFocus.join('、')}的文字覆盖更多；对照资料在${targetFocus.join('、')}的文字覆盖更多。`:sourceFocus.length?`本方资料在${sourceFocus.join('、')}的文字覆盖更多，其余维度未识别到明确差异。`:targetFocus.length?`对照资料在${targetFocus.join('、')}的文字覆盖更多，其余维度未识别到明确差异。`:'两份资料在当前关键词维度的文字覆盖一致，未识别到明确方向差异。'
    const goals={common:[common.length?`两份资料均覆盖${common.join('、')}，重视技术技能与职业能力的协同培养。`:'当前资料未识别到共同关键词，可通过方案原文进一步核对。'],differences:[directional+'文字覆盖度反映表述差异，不代表培养质量评分。']}
    return {schemaVersion:1,id:`compare-${Date.now()}`,createdAt:new Date().toISOString(),source:copy(source),target:copy(target),a,b,metrics,radar,standard,estimated,basis,applicability,changes,
      sections:{goals,requirements:[`本方要求条目${formatValue(metrics.requirements.source)}，对照资料条目${formatValue(metrics.requirements.target)}，对照口径为${b.requirementLabel||'要求'}。条目颗粒度不同，数量变化应结合具体内容研判。`,`本方指标点${formatValue(a.indicators)}，对照资料指标点${formatValue(b.indicators)}；条目覆盖不能替代毕业要求达成评价。`],credits:[credits.source===null||credits.target===null?'部分学分未提取或标准未规定统一总学分，保留缺失状态，不按零值计算差异。':`按当前课程清单汇总，本方${formatValue(credits.source)}学分，对照${formatValue(credits.target)}学分，变化${formatValue(Math.abs(credits.delta))}学分。建议结合课程类别与实践环节审查结构。`],core:[!a.courses.length||!b.courses.length?'部分方案的核心课程清单尚未提取，暂不能判断课程增删与学期迁移。':standard?'标准列出7个专业核心课程领域，学校可结合实际自主设置具体课程；未规定统一开课学期。':`按同名课程对齐，本次新增${changes.added.filter(c=>c.category==='专业核心课程').length}门核心课程、减少${changes.removed.filter(c=>c.category==='专业核心课程').length}门核心课程。课程异名尚需人工核对。`],overall:[goals.common[0]+goals.differences[0],`本方要求条目${formatValue(metrics.requirements.source)}，对照资料条目${formatValue(metrics.requirements.target)}。应核对各条要求的内涵与指标点支撑，不能仅按条目数量判断培养质量。`,`优先核对${changes.added.length?changes.added.slice(0,3).map(c=>c.name).join('、'):'毕业要求与核心课程'}等内容的支撑关系，明确评价证据与修订责任。`,estimated?'完成学校原文核验后，再形成正式修订结论。':'结合指标点、课程目标与评价证据，形成可追溯的修订记录。']}}
  }
  const fromParsed=(parsed,suffix=Date.now())=>{
    const source=root.TalentPlanModel.parseText(parsed.text||'')
    const chapter=id=>source.chapters?.[id]||''
    const items=text=>text.split(/\n+/).map(s=>s.trim()).filter(Boolean)
    const goals=items(chapter('goals')),requirements=items(chapter('requirements'))
    return {id:`upload-${suffix}`,name:String(parsed.fileName||'本地培养方案').replace(/\.[^.]+$/,''),school:'本地上传',major:'待补充',year:'未标注',type:'未明确',kind:'upload',summary:'按上传文件正文提取章节；未识别的课程与数值字段保留缺失。',basis:'本地文件正文提取',profile:{goals,requirements,indicators:null,courses:[]},text:source.text}
  }
  const exportHtml=r=>{
    const list=items=>'<ul>'+items.map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>'
    const rows=[['培养目标',r.metrics.goals],['毕业要求',r.metrics.requirements],['课程总学分',r.metrics.credits],['核心课程',r.metrics.core]]
    return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>培养方案对比分析报告</title><style>body{font:15px/1.9 system-ui;color:#263758;max-width:1000px;margin:50px auto;padding:0 30px}h1{font-size:28px}h2{margin-top:36px;color:#4165bd}table{border-collapse:collapse;width:100%}td,th{border:1px solid #dce3ef;padding:10px;text-align:left}.basis{background:#eff4ff;padding:18px}li{margin:8px 0}@media print{body{margin:0}}</style><h1>培养方案对比分析报告</h1><p>比对方案：${esc(r.source.name)}<br>被比对方案：${esc(r.target.name)}</p><p>${esc(new Date(r.createdAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}))}</p><p class="basis">${esc(r.basis)} ${esc(r.applicability)}</p><h2>总览数据</h2><table><tr><th>分析维度</th><th>本方</th><th>对照</th></tr>${rows.map(([label,m])=>`<tr><td>${label}</td><td>${formatValue(m.source)}</td><td>${formatValue(m.target)}</td></tr>`).join('')}</table><h2>培养目标分析</h2>${list([...r.sections.goals.common,...r.sections.goals.differences])}<h2>毕业要求分析</h2>${list(r.sections.requirements)}<h2>课程学分变化趋势</h2>${list(r.sections.credits)}<h2>核心课程分析</h2>${list(r.sections.core)}<table><tr><th>课程 / 领域</th><th>本方学期</th><th>对照学期</th></tr>${[...new Set([...r.a.courses,...r.b.courses].filter(c=>c.category==='专业核心课程').map(c=>c.name))].map(name=>`<tr><td>${esc(name)}</td><td>${formatValue(r.a.courses.find(c=>c.name===name)?.semester)}</td><td>${formatValue(r.b.courses.find(c=>c.name===name)?.semester)}</td></tr>`).join('')}</table><h2>整体分析</h2>${list(r.sections.overall)}${r.standard?`<p>标准来源：<a href="${esc(r.target.url)}">教育部专业教学标准原文</a>，第6、7、8节。</p>`:''}</html>`
  }
  const readHistory=raw=>{
    try{
      const rows=JSON.parse(raw),texts=v=>Array.isArray(v)&&v.length<=400&&v.every(t=>typeof t==='string'&&t.length<100000)
      const validProfile=p=>p&&texts(p.goals)&&texts(p.requirements)&&Array.isArray(p.courses)&&p.courses.length<=500&&p.courses.every(c=>c&&typeof c.name==='string'&&typeof c.category==='string'&&(c.credits===null||numeric(c.credits))&&(c.semester===null||numeric(c.semester)))
      const validRecord=p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.school==='string'
      const validMetric=p=>p&&[p.source,p.target,p.delta].every(v=>v===null||typeof v==='number'&&Number.isFinite(v))
      return Array.isArray(rows)?rows.filter(r=>r&&r.schemaVersion===1&&typeof r.id==='string'&&typeof r.basis==='string'&&!Number.isNaN(Date.parse(r.createdAt))&&validRecord(r.source)&&validRecord(r.target)&&validProfile(r.a)&&validProfile(r.b)&&['goals','requirements','indicators','credits','core'].every(k=>validMetric(r.metrics?.[k]))&&Array.isArray(r.radar)&&r.radar.every(k=>k&&typeof k.name==='string'&&numeric(k.source)&&numeric(k.target))&&texts(r.sections?.goals?.common)&&texts(r.sections?.goals?.differences)&&['requirements','credits','core','overall'].every(k=>texts(r.sections?.[k]))&&Array.isArray(r.changes?.added)&&Array.isArray(r.changes?.removed)).slice(0,10).map(r=>{if(r.standard)r.target.url=standardUrl;else{delete r.target.url;delete r.source.url}return r}):[]
    }catch{return []}
  }
  root.TalentComparisonModel={copy,esc,categories,keywords,standards,formatValue,filterPlans,toggleSelection,validate,profile,buildReport,fromParsed,exportHtml,readHistory}
})(globalThis)
