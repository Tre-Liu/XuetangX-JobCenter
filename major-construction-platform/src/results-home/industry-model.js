/* Shared offline model. Source: existing construction archives, not live vacancies. */
;(function (root) {
  const unique = (rows, key) => [...new Map(rows.map(row => [key(row), row])).values()]
  const terms = ['BIM', '数字建模', '工程识图', '装配式', '智慧工地', '物联网', '机器人', '无人机', '数据治理', '数据采集', '质量检测', '质量安全', '结构监测', '绿色建造', '碳排放', '工程测量', '三维扫描', '施工组织', '项目管理', '协同沟通', '模型交付', '数字化', '平台实施', '智能装备', '数据分析', '标准规范', '问题分析', '持续改进', '成本控制', '运维', '传感', '建模', '安全', '质量', '协同', '交付']
  function normalizeTerms(terms) {
    const seen=new Set()
    return terms.flatMap(term=>{
      const name=(typeof term==='string'?term:typeof term?.name==='string'?term.name:'').trim()
      if(!name||seen.has(name))return []
      seen.add(name)
      return [typeof term==='string'?name:{name,type:['large','medium','small'].includes(term.type)?term.type:'medium'}]
    })
  }
  function countWords(jobs, names) {
    const entries=normalizeTerms(names),list=entries.map(t=>typeof t==='string'?t:t.name)
    return list.map(name=>{
      const literal=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
      const pattern=new RegExp(/^[a-z]+$/i.test(name)?`(?<![a-z0-9_])${literal}(?![a-z0-9_])`:literal,'gi')
      const mentions=jobs.map(j=>({id:j.id,count:typeof j.jdText==='string'?[...j.jdText.matchAll(pattern)].length:0})).filter(j=>j.count)
      const entry=entries[list.indexOf(name)]
      return {name,value:mentions.reduce((sum,j)=>sum+j.count,0),jobIds:mentions.map(j=>j.id),...(typeof entry==='object'?{type:entry.type}:{})}
    }).sort((a,b)=>b.value-a.value||list.indexOf(a.name)-list.indexOf(b.name))
  }
  function displayJobs(model, ids) {
    return model.jobs.filter(j=>model.relations.some(r=>r.jobId===j.id) && (!Array.isArray(ids)||ids.includes(j.id)))
  }
  function build(config = {}) {
    const chains = unique(config.chains || [], x => x.id)
    const industries = unique(config.industries || [], x => x.id)
    const jobs = unique(config.jobs || [], x => x.id).map(job => ({ ...job, abilities: unique(job.abilities || (job.abilityIndexes || []).map(i=>config.abilityCatalog?.[i]).filter(Boolean), a => a.category + ':' + a.name), tasks: job.tasks || [], courses: job.courses || [] }))
    const relations = unique([...(config.jobRelations || []), ...jobs.map(j => ({ jobId: j.id, industryNodeId: j.industryNodeId }))].filter(r => jobs.some(j => j.id === r.jobId) && industries.some(i => i.id === r.industryNodeId)), r => r.jobId + ':' + r.industryNodeId)
    const chainRelations = unique([...(config.chainRelations || []), ...industries.map(i => ({ chainId: i.chainId, industryNodeId: i.id }))].filter(r => chains.some(c => c.id === r.chainId) && industries.some(i => i.id === r.industryNodeId)), r => r.chainId + ':' + r.industryNodeId)
    // Count mentions in the archived JD text; ability coverage is a different metric.
    const words = countWords(jobs, terms).filter(w=>w.value).slice(0,24)
    const raw = config.industryOverview || {}
    const companies = unique(raw.companies || [], c=>c.name)
    const overview = { stages:raw.stages || [], links:raw.links || [], companies, jobNodeMap:raw.jobNodeMap || {}, basis:config.basis,
      nodes:(raw.nodes || []).map(n=>({...n,
        companies:unique((raw.companies || []).filter(c=>c.industry===n.name), c=>c.name),
        jobs:jobs.filter(j=>relations.some(r=>r.jobId===j.id && (raw.jobNodeMap?.[r.industryNodeId] || []).includes(n.id)))
      })) }
    return { chains, industries, jobs, relations, chainRelations, words, overview }
  }
  function chainView(m, chainId) {
    const chain = m.chains.find(c=>c.id===chainId)
    const industryIds = new Set(chain ? m.chainRelations.filter(r=>r.chainId===chain.id).map(r=>r.industryNodeId) : [])
    const relations = m.relations.filter(r=>industryIds.has(r.industryNodeId))
    const nodeIds = new Set([...industryIds].flatMap(id=>m.overview.jobNodeMap[id] || []))
    const nodes = m.overview.nodes.filter(n=>nodeIds.has(n.id)).map(n=>({...n,
      jobs:m.jobs.filter(j=>relations.some(r=>r.jobId===j.id && (m.overview.jobNodeMap[r.industryNodeId] || []).includes(n.id)))
    }))
    const relatedIndustries = [...new Set(nodes.flatMap(n=>n.nationalIndustries || []))]
    return { chain, nodes, relatedIndustries, stages:m.overview.stages, basis:m.overview.basis,
      links:m.overview.links.filter(l=>nodeIds.has(l.source) && nodeIds.has(l.target)),
      companies:unique(nodes.flatMap(n=>n.companies), c=>c.name),
      jobs:m.jobs.filter(j=>relations.some(r=>r.jobId===j.id)) }
  }
  function defaultMetrics(chain) {
    return [{value:chain.nodes.length,label:'产业节点',unit:'个'},{value:chain.companies.length,label:'已收录企业',unit:'家'},{value:chain.jobs.length,label:'关联岗位',unit:'个'},{value:chain.relatedIndustries.length,label:'相关行业',unit:'个'}]
  }
  function wordWeight(word,words) {
    if(['large','medium','small'].includes(word.type))return {large:1,medium:.4,small:0}[word.type]
    const max=Math.max(...words.map(w=>w.value)),min=Math.min(...words.map(w=>w.value))
    return max===min?.5:(word.value-min)/(max-min)
  }
  function wordType(word,words) {
    if(['large','medium','small'].includes(word.type))return word.type
    const weight=wordWeight(word,words)
    return weight>=.6?'large':weight>=.2?'medium':'small'
  }
  function layoutWords(words, width, height, measure) {
    if (!words.length || width <= 0 || height <= 0) return []
    const ordered = [...words].sort((a,b)=>wordWeight(b,words)-wordWeight(a,words)||b.value-a.value)
    for (let scale=1; scale>.25; scale*=.94) {
      const placed=[]
      for (const [i,word] of ordered.entries()) {
        const weight=wordWeight(word,words)
        const fontSize=(13+Math.sqrt(weight)*Math.min(35,width/5))*scale
        const rotate=i>3 && i%5===0 && word.name.length<=4
        const textWidth=measure(word.name,fontSize), textHeight=fontSize*1.35
        const w=(rotate?textHeight:textWidth)+10, h=(rotate?textWidth:textHeight)+8
        let slot
        for(let step=0;step<3600;step++) {
          const angle=step*.38+i*1.7, radius=2.6*Math.sqrt(step)
          const x=width/2+Math.cos(angle)*radius-w/2
          const y=height/2+Math.sin(angle)*radius*(height/width)-h/2
          if(x<0||y<0||x+w>width||y+h>height) continue
          if(placed.some(p=>x<p.x+p.width&&x+w>p.x&&y<p.y+p.height&&y+h>p.y)) continue
          slot={...word,x,y,width:w,height:h,fontSize,rotate};break
        }
        if(!slot) break
        placed.push(slot)
      }
      if(placed.length===ordered.length) return placed
    }
    return []
  }
  function sankey(m) {
    const nodes = [], links = []
    for (const chain of m.chains) nodes.push({ name: 'chain:' + chain.id, label: { formatter: chain.name.replace('智能建造', '') }, businessId: chain.id, kind: 'chain' })
    for (const industry of m.industries) {
      const jobs = m.relations.filter(r => r.industryNodeId === industry.id)
      if (!jobs.length) continue
      nodes.push({ name: 'industry:' + industry.id, label: { formatter: industry.name }, businessId: industry.id, kind: 'industry' })
      const parents = m.chainRelations.filter(r => r.industryNodeId === industry.id)
      for (const r of parents) links.push({ source: 'chain:' + r.chainId, target: 'industry:' + industry.id, value: jobs.length / parents.length })
      for (const r of jobs) links.push({ source: 'industry:' + industry.id, target: 'job:' + r.jobId, value: 1 })
    }
    for (const job of m.jobs.filter(j => m.relations.some(r => r.jobId === j.id))) nodes.push({ name: 'job:' + job.id, label: { formatter: job.name }, businessId: job.id, kind: 'job' })
    return { nodes: nodes.filter(n => links.some(l => l.source === n.name || l.target === n.name)), links }
  }
  root.ResultsIndustryModel = { build, sankey, chainView, defaultMetrics, layoutWords, countWords, displayJobs, normalizeTerms, wordType }
  if (!root.customElements || root.customElements.get('results-industry-model')) return
  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
  const colors = ['#9b87f5', '#629df0', '#51bfbe']
  class ResultsIndustryModel extends HTMLElement {
    connectedCallback() {
      if(this.ready) return
      this.ready=true
      let config=root.ResultsIndustryData || {}
      try { if(this.hasAttribute('config')) config=JSON.parse(this.getAttribute('config')) } catch {}
      this.model=build(config);this.editing=new URL(root.location.href).searchParams.get('edit')==='1';this.settings=root.ResultsIndustryEditor?.read(this.model)||{};this.selectedChain=this.model.chains[0]?.id||'';this.chain=chainView(this.model,this.selectedChain);this.mode='treemap';this.selectedNode='';this.selectedJob=this.model.jobs[0]?.id||'';this.word='';this.search='';this.compact=true;this.activeTask=-1;this.activeAbility=''
      this.innerHTML=`<div class="im-atmosphere" aria-hidden="true"><canvas class="im-motion-ray" data-motion="ray"></canvas><canvas class="im-motion-star" data-motion="star"></canvas><div class="im-atmosphere-globe"></div><div class="im-atmosphere-orbit"></div></div><header class="im-heading"><div><h1>产教模型<span>产业有脉络，培养有方向</span></h1></div>${this.model.chains.length>1?`<label class="im-chain-picker"><span>当前产业链</span><select data-im-chain aria-label="当前产业链">${this.model.chains.map(c=>`<option value="${esc(c.id)}" ${c.id===this.selectedChain?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>`:''}</header>
      <div class="im-scroll" tabindex="0" aria-label="产教模型内容">
        <section class="im-section" aria-label="产业链全景">
          <div class="im-first-grid"><aside class="im-overview" aria-label="产业链数据与介绍" aria-live="polite"></aside>
          <section class="im-card im-chain"><header class="im-card-head"><div><h2>产业链图谱</h2></div><div class="im-segment" aria-label="产业链图谱类型"><button type="button" data-im-mode="treemap" aria-pressed="true">树状矩形图</button><button type="button" data-im-mode="sankey" aria-pressed="false">桑基图</button></div></header><p class="im-caption im-chain-caption"></p><div class="im-chain-canvas" tabindex="0" aria-label="产业链图谱画布"></div></section></div>
        </section>
        <section class="im-section im-talent-section" aria-label="岗位能力图谱与招聘词云">
          <header class="im-section-heading"><div><h2>岗位能力图谱</h2><p>以典型工作任务为纽带，连接岗位与知识、技能、素养</p></div></header>
          <div class="im-second-grid"><section class="im-card im-job-canvas" aria-label="岗位能力图谱画布">
            <aside class="im-job-sidebar"><header><h3>岗位清单</h3>${this.editControl('jobs','岗位编辑')}<span data-im-job-count></span></header><label class="im-job-search"><span aria-hidden="true">⌕</span><input type="search" data-im-search aria-label="搜索岗位" placeholder="搜索岗位名称"></label><div class="im-job-list" aria-label="选择岗位"></div></aside>
            <div class="im-competency competency-map-explorer theme-dark is-compact"><header class="im-competency-header"><div><h3 class="im-selected-job"></h3><p class="im-job-meta"></p></div><button type="button" class="im-text-button" data-im-compact aria-pressed="true">展开能力名称</button></header><div class="competency-map-scroll" tabindex="0" role="region" aria-label="岗位、任务与能力关系画布"><section class="competency-map-board"></section></div><footer class="im-competency-footer"><div class="competency-node-legend"><span class="ability-type-knowledge"><i></i>知识</span><span class="ability-type-skill"><i></i>技能</span><span class="ability-type-quality"><i></i>素养</span></div></footer></div>
          </section><aside class="im-talent-aside"><section class="im-card im-keywords"><header class="im-card-head"><div><h2>岗位招聘热点词云</h2></div>${this.editControl('words','编辑词条')}</header><div class="im-cloud" role="group" aria-label="岗位描述关键词词云"></div></section></aside></div>
        </section>
      </div>`
      this.onClick=e=>this.click(e);this.addEventListener('click',this.onClick)
      this.onInput=e=>{if(e.target.matches('[data-im-search]')){this.search=e.target.value;this.updateJobs()}};this.addEventListener('input',this.onInput)
      this.onChange=e=>{if(e.target.matches('[data-im-chain]')){this.selectedChain=e.target.value;this.chain=chainView(this.model,this.selectedChain);this.selectedNode='';this.drawIndustry();this.drawOverview();this.querySelector('.im-chain-canvas').scrollTo(0,0)}};this.addEventListener('change',this.onChange)
      this.applyEdits();this.drawIndustry();this.drawOverview();this.updateJobs();this.updateTheme()
      this.stopMotion=root.ResultsHomeMotion?.mount(this.querySelector('.im-atmosphere'),this.getAttribute('asset-base')||'./results-assets/',0)
      this.resize=new ResizeObserver(()=>{cancelAnimationFrame(this.resizeFrame);this.resizeFrame=requestAnimationFrame(()=>{this.drawAbilities();this.drawWords()})});this.resize.observe(this.querySelector('.competency-map-scroll'));this.resize.observe(this.querySelector('.im-cloud'))
      this.themeObserver=new MutationObserver(()=>this.updateTheme());this.themeObserver.observe(this.closest('.results-portal-shell'),{attributes:true,attributeFilter:['data-theme']})
    }
    disconnectedCallback(){this.stopMotion?.();this.stopMotion=null;this.resize?.disconnect();this.themeObserver?.disconnect();cancelAnimationFrame(this.resizeFrame);this.removeEventListener('click',this.onClick);this.removeEventListener('input',this.onInput);this.removeEventListener('change',this.onChange);this.ready=false}
    get light(){return this.closest('.results-portal-shell')?.dataset.theme==='light'}
    get currentJob(){return this.visibleJobs.find(j=>j.id===this.selectedJob)}
    editControl(kind,label){return this.editing?`<button type="button" class="results-edit-control im-edit-control" data-im-edit="${kind}">${label}</button>`:''}
    applyEdits(){this.visibleJobs=displayJobs(this.model,this.settings.jobIds);this.words=Array.isArray(this.settings.terms)?countWords(this.model.jobs,this.settings.terms):this.model.words}
    refreshEdits(){this.applyEdits();this.drawOverview();this.updateJobs();this.drawWords()}
    updateTheme(){const c=this.querySelector('.im-competency');c.classList.toggle('theme-light',this.light);c.classList.toggle('theme-dark',!this.light)}
    click(e){
      const edit=e.target.closest('[data-im-edit]');if(edit&&this.editing){root.ResultsIndustryEditor?.open(this,edit.dataset.imEdit,edit);return}
      const mode=e.target.closest('[data-im-mode]'),node=e.target.closest('[data-im-node]'),job=e.target.closest('[data-im-job]'),word=e.target.closest('[data-im-word]'),task=e.target.closest('[data-competency-task-index]'),ability=e.target.closest('[data-competency-ability]')
      if(mode){this.mode=mode.dataset.imMode;this.querySelectorAll('[data-im-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===mode)));this.drawIndustry()}
      if(node){this.selectedNode=this.selectedNode===node.dataset.imNode?'':node.dataset.imNode;this.drawIndustry()}
      if(job){this.selectedJob=job.dataset.imJob;this.activeTask=-1;this.activeAbility='';this.updateJobs()}
      if(word){this.word=this.word===word.dataset.imWord?'':word.dataset.imWord;this.updateJobs()}
      if(task){const i=Number(task.dataset.competencyTaskIndex);this.activeTask=this.activeTask===i?-1:i;this.activeAbility='';this.drawAbilities()}
      if(ability){this.activeAbility=this.activeAbility===ability.dataset.competencyAbility?'':ability.dataset.competencyAbility;this.activeTask=-1;this.drawAbilities()}
      if(e.target.closest('[data-im-compact]')){this.compact=!this.compact;this.drawAbilities()}
    }
    drawIndustry(){
      const m=this.chain,box=this.querySelector('.im-chain-canvas')
      this.querySelector('.im-chain-caption').textContent=m.chain?`${m.chain.name} · 上中下游产业分布与关联`:''
      if(!m.nodes.length){box.innerHTML='<p class="im-empty">暂无产业链资料</p>';return}
      if(this.mode==='treemap'){
        box.innerHTML=`<div class="industry-treemap-board im-stage-board">${m.stages.map((s,i)=>{const nodes=m.nodes.filter(n=>n.stage===s.key);return `<section class="industry-treemap-stage stage-${s.key}" style="--stage-color:${colors[i]}"><header><div class="industry-treemap-stage-copy"><h4>${esc(s.label)}</h4><span>${esc(s.summary)}</span></div><strong>${nodes.length}<small> 个节点</small></strong></header><div class="industry-treemap-grid">${nodes.map(n=>`<button type="button" class="industry-treemap-node ${n.id===this.selectedNode?'is-selected':''}" data-im-node="${esc(n.id)}" aria-pressed="${n.id===this.selectedNode}"><strong>${esc(n.name)}</strong><span>${n.jobs.length} 个关联岗位 · ${n.companies.length} 家档案企业</span><div>${(n.techFields||[]).map(t=>`<em>${esc(t)}</em>`).join('')}</div></button>`).join('')}</div></section>`}).join('')}</div>`
      }else{
        const graphHeight=Math.max(710,Math.max(...m.stages.map(s=>m.nodes.filter(n=>n.stage===s.key).length))*100+100)
        const positions=new Map();m.stages.forEach((s,i)=>m.nodes.filter(n=>n.stage===s.key).forEach((n,j)=>positions.set(n.id,{x:32+i*350,y:90+j*100})))
        const paths=m.links.map((l,i)=>{const a=positions.get(l.source),b=positions.get(l.target);if(!a||!b)return '';const selected=!this.selectedNode||l.source===this.selectedNode||l.target===this.selectedNode;return `<path d="M ${a.x+245} ${a.y+33} C ${a.x+295} ${a.y+33},${b.x-50} ${b.y+33},${b.x} ${b.y+33}" fill="none" stroke="url(#im-flow-${i})" stroke-width="${Math.max(3,l.value/3)}" opacity="${selected?.48:.06}"/><linearGradient id="im-flow-${i}"><stop stop-color="#9b87f5"/><stop offset="1" stop-color="#51bfbe"/></linearGradient>`}).join('')
        box.innerHTML=`<svg class="im-industry-sankey" viewBox="0 0 1020 ${graphHeight}" role="img" aria-label="上游、中游、下游产业链关系">${m.stages.map((s,i)=>`<text class="im-flow-heading" x="${155+i*350}" y="32" text-anchor="middle">${esc(s.label)}</text><text class="im-flow-subtitle" x="${155+i*350}" y="53" text-anchor="middle">${esc(s.summary)}</text>`).join('')}${paths}${m.nodes.map(n=>{const p=positions.get(n.id),i=m.stages.findIndex(s=>s.key===n.stage);return `<foreignObject x="${p.x}" y="${p.y}" width="245" height="72"><button xmlns="http://www.w3.org/1999/xhtml" type="button" class="im-flow-node ${this.selectedNode===n.id?'is-selected':''}" style="--stage-color:${colors[i]}" data-im-node="${esc(n.id)}" aria-pressed="${this.selectedNode===n.id}"><strong>${esc(n.name)}</strong><span>${n.jobs.length} 个关联岗位 · ${n.companies.length} 家档案企业</span></button></foreignObject>`}).join('')}</svg><p class="im-basis">连线表示配置的产业关联强度，关系与权重待核验。</p>`
      }
    }
    drawOverview(){
      const m=this.chain
      const description=m.chain?.description||m.chain?.summary||(m.nodes.length?`覆盖${m.nodes.map(n=>n.name).join('、')}，展示产业分布、企业档案与关联岗位。`:'暂无产业链描述资料。')
      const saved=this.settings.overviews?.[this.selectedChain]||{}
      const metrics=saved.metrics??defaultMetrics(m)
      const overview=this.querySelector('.im-overview')
      overview.classList.toggle('is-without-metrics',!metrics.length)
      overview.innerHTML=`<div class="im-overview-scroll"><div class="im-kicker"><span class="im-spark">✧</span><span>产业链概览</span></div><div class="im-overview-title"><h2>${esc(saved.title??m.chain?.name??'产业链概览')}</h2><div class="im-overview-actions">${this.editControl('description','编辑描述')}${!metrics.length?this.editControl('data','编辑数据'):''}</div></div><p class="im-overview-lead">${esc(saved.description??description)}</p>${metrics.length?`<div class="im-metrics-heading">${this.editControl('data','编辑数据')}</div><div class="im-overview-metrics">${metrics.map(metric=>`<div><span>${esc(metric.label)}</span><strong>${esc(metric.value)}<small>${esc(metric.unit)}</small></strong></div>`).join('')}</div>`:''}</div>`
    }
    updateJobs(){
      const term=this.words.find(w=>w.name===this.word),jobs=this.visibleJobs.filter(j=>(!term||term.jobIds.includes(j.id))&&j.name.toLowerCase().includes(this.search.toLowerCase()))
      if(!jobs.some(j=>j.id===this.selectedJob)){this.selectedJob=jobs[0]?.id||'';this.activeTask=-1;this.activeAbility=''}
      this.querySelector('[data-im-job-count]').textContent=`${this.visibleJobs.length} 个`
      this.querySelector('.im-job-list').innerHTML=jobs.map(j=>`<button type="button" data-im-job="${esc(j.id)}" class="${j.id===this.selectedJob?'active':''}" aria-pressed="${j.id===this.selectedJob}"><strong>${esc(j.name)}</strong><i>›</i></button>`).join('')||'<p class="im-empty">暂无匹配岗位</p>'
      this.querySelectorAll('[data-im-word]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.imWord===this.word)))
      this.drawAbilities()
    }
    drawWords(){
      const cloud=this.querySelector('.im-cloud')
      if(!this.words.length){cloud.innerHTML='<p class="im-empty">暂无词条</p>';return}
      const ctx=document.createElement('canvas').getContext('2d'),family=getComputedStyle(cloud).fontFamily
      const words=layoutWords(this.words,cloud.clientWidth,cloud.clientHeight,(name,size)=>{ctx.font=`500 ${size}px ${family}`;return ctx.measureText(name).width})
      cloud.innerHTML=words.map((w,i)=>`<button type="button" data-im-word="${esc(w.name)}" style="left:${w.x}px;top:${w.y}px;width:${w.width}px;height:${w.height}px;--word-size:${w.fontSize}px;--word-color:${colors[i%3]}" aria-pressed="${w.name===this.word}" aria-label="${esc(w.name)}，岗位描述中出现 ${w.value} 次" title="岗位描述中出现 ${w.value} 次"><span style="${w.rotate?'transform:rotate(-90deg)':''}">${esc(w.name)}</span></button>`).join('')
    }
    drawAbilities(){
      const job=this.currentJob,container=this.querySelector('.im-competency'),scroll=this.querySelector('.competency-map-scroll'),board=this.querySelector('.competency-map-board'),state=root.PortraitCompetencyMapState
      container.classList.toggle('is-compact',this.compact);this.querySelector('[data-im-compact]').textContent=this.compact?'展开能力名称':'收起能力名称';this.querySelector('[data-im-compact]').setAttribute('aria-pressed',String(this.compact))
      this.querySelector('.im-selected-job').textContent=job?.name||'暂无匹配岗位';this.querySelector('.im-job-meta').textContent=job?`${job.tasks.length} 项典型工作任务 · ${job.abilities.length} 项岗位能力`:''
      if(!job||!state){board.innerHTML='<p class="im-empty">暂无可展示的岗位能力关系</p>';return}
      const graph=state.buildGraph({jobName:job.name,tasks:job.tasks.map(t=>({...t,abilities:t.abilities||[]})),nodes:job.abilities,activeTaskIndex:this.activeTask,activeAbilityName:this.activeAbility,viewportHeight:scroll.clientHeight,viewportWidth:scroll.clientWidth,compactMode:this.compact})
      board.innerHTML=state.renderGraph(graph)
    }

  }
  root.customElements.define('results-industry-model',ResultsIndustryModel)
})(globalThis)
