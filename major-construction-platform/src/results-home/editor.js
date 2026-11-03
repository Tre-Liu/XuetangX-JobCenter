/* Shared settings for the Vue and file-based results entries. No remote writes. */
;(function (root) {
  if (root.ResultsPageEditor) return
  const KEY = 'major-results-page-settings-v1'
  let homeDefaults = {}
  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const copy = v => JSON.parse(JSON.stringify(v))
  const load = () => { try { return JSON.parse(root.localStorage.getItem(KEY) || '{}') } catch { return {} } }
  const defaults = { theme:'dark', layout:'launch', title:'', titleEn:'', description:'', descriptionEn:'', logo:'', crest:'', nav:[], modules:[{id:'overview',label:'专业全局概览',visible:true},{id:'teachers',label:'专业教师团队',visible:false}], dataSource:'construction', guideName:'智慧专业领航员', welcome:'你好！我是智慧专业领航员。我可以为你解答本专业的相关问题，欢迎随时向我提问～', questions:['本专业的人才培养目标是什么？','本专业核心课程有哪些？','本专业面向的就业方向与发展赛道有哪些？'] }
  function normalize(value) {
    const raw=value && typeof value==='object' && !Array.isArray(value) ? value : {}
    const s=copy(defaults)
    for(const key of ['title','titleEn','description','descriptionEn','logo','crest','guideName','welcome']) if(typeof raw[key]==='string') s[key]=raw[key]
    s.theme=raw.theme==='light'?'light':'dark';s.layout=raw.layout==='explore'?'explore':'launch';s.dataSource=raw.dataSource==='training'?'training':'construction'
    if(Array.isArray(raw.nav)) s.nav=raw.nav.filter(n=>n && typeof n.id==='string' && typeof n.label==='string' && n.label.trim()).map(n=>({id:n.id,label:n.label,visible:n.visible!==false}))
    if(Array.isArray(raw.modules)) { s.modules=raw.modules.filter(n=>n && defaults.modules.some(m=>m.id===n.id)).map(n=>({...defaults.modules.find(m=>m.id===n.id),visible:n.visible!==false})); for(const m of defaults.modules) if(!s.modules.some(n=>n.id===m.id))s.modules.push({...m}) }
    if(Array.isArray(raw.questions)) s.questions=defaults.questions.map((q,i)=>typeof raw.questions[i]==='string' && raw.questions[i].trim()?raw.questions[i]:q)
    return s
  }
  function read() { return normalize(load()) }
  const icon = (code) => `<span class="results-source-icon" aria-hidden="true">&#x${code};</span>`
  const control = (action,label,code='e888') => `<button type="button" class="results-edit-control" data-results-edit="${action}">${icon(code)}${label}</button>`
  function mount(shell) {
    if (shell.resultsEditor) return shell.resultsEditor
    const edit = new URL(root.location.href).searchParams.get('edit') === '1'
    const controller = {shell,edit,state:read(),apply,open}
    shell.resultsEditor = controller
    const nav = shell.querySelector('.results-portal-nav')
    const originals = [...nav.querySelectorAll('button')].map(b => { const id=b.textContent.trim(); b.dataset.navId=id; return {id,label:id,visible:true} })
    if (!controller.state.nav.length) controller.state.nav = originals
    // Retain newly introduced business destinations when upgrading a saved configuration.
    for (const [index,item] of originals.entries()) if (!controller.state.nav.some(n=>n.id===item.id)) {
      const next=originals.slice(index+1).find(n=>controller.state.nav.some(saved=>saved.id===n.id))
      const position=next?controller.state.nav.findIndex(n=>n.id===next.id):controller.state.nav.length
      controller.state.nav.splice(position,0,item)
    }
    shell.classList.toggle('results-editing',edit)
    if (edit) {
      const bar=document.createElement('div'); bar.className='results-editor-bar'
      const exit=new URL(root.location.href); exit.searchParams.delete('edit')
      bar.innerHTML=`<span class="results-editor-avatar"></span><span>Tre_Liu正在编辑</span><a href="${esc(exit.href)}">${icon('e796')}退出编辑</a>`
      shell.prepend(bar)
      const toolbar=document.createElement('div'); toolbar.className='results-editor-toolbar'; toolbar.innerHTML=control('navigation','导航设置')+control('style','风格与布局','e879')+control('modules','页面模块')
      shell.querySelector('.results-portal-topbar').append(toolbar)
    }
    shell.addEventListener('click',e=>{ const b=e.target.closest('[data-results-edit]'); if(b) open(b.dataset.resultsEdit,b) })
    apply()
    return controller
    function save(next) {
      try { root.localStorage.setItem(KEY,JSON.stringify(next)); controller.state=copy(next); apply(); root.dispatchEvent(new CustomEvent('results-settings-change')); return true }
      catch { return false }
    }
    function apply() {
      const s=controller.state, home=shell.querySelector('results-home')
      shell.dataset.theme=s.theme; shell.dataset.layout=s.layout
      const base=home?.getAttribute('asset-base') || (root.location.protocol==='file:'?'./public/results-assets/':'./results-assets/')
      const logo=shell.querySelector('.results-logo-card img'); if(logo) { logo.src=s.logo || `${base}school-logo.png`; logo.alt='学校标识'; logo.parentElement.classList.add('results-school-logo'); let crest=logo.parentElement.querySelector('.results-school-crest'); if(!crest){crest=document.createElement('img');crest.className='results-school-crest';crest.alt='学校校徽';logo.after(crest)} crest.src=s.crest||`${base}school-crest.jpg` }
      s.nav.forEach((item,i)=>{ let b=[...nav.children].find(x=>x.dataset.navId===item.id); if(!b){ b=document.createElement('button'); b.type='button'; b.className='results-nav-item'; b.dataset.navId=item.id; b.addEventListener('click',()=>{
          shell.querySelector('.results-custom-page')?.remove()
          shell.querySelectorAll(':scope > section,:scope > .results-home-host,:scope > results-home,:scope > .results-industry-host,:scope > results-industry-model').forEach(el=>{el.hidden=true;el.dataset.customHidden='true'})
          const section=document.createElement('section');section.className='results-empty-panel results-custom-page'
          section.innerHTML=`<h2>${esc(controller.state.nav.find(n=>n.id===item.id)?.label||item.label)}</h2><p>暂无已发布内容</p>`;shell.append(section)
          nav.querySelectorAll('button').forEach(n=>n.classList.toggle('active',n===b))
        }); nav.append(b) }
        b.textContent=item.label; b.hidden=item.visible===false; b.style.order=String(i); nav.append(b)
      })
      nav.onclick=event=>{ if(event.target.closest('[data-nav-id]') && originals.some(n=>n.id===event.target.closest('[data-nav-id]').dataset.navId)){ shell.querySelector('.results-custom-page')?.remove(); nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===event.target.closest('[data-nav-id]'))); shell.querySelectorAll('[data-custom-hidden]').forEach(el=>{el.hidden=false;delete el.dataset.customHidden}) } }
      if (!home?.config) return
      if (!home.originalConfig) home.originalConfig=copy(home.config)
      const original=home.originalConfig
      homeDefaults=original
      home.config={...original,name:s.title||original.name,summary:s.description||original.summary,questions:s.questions}
      home.querySelector('h1').textContent=home.config.name
      let en=home.querySelector('.results-title-en'); if(!en) { en=document.createElement('div'); en.className='results-title-en'; home.querySelector('h1').after(en) }; en.textContent=s.titleEn
      home.querySelector('.results-home-description p').textContent=home.config.summary
      home.querySelector('.results-guide-header h2').textContent=s.guideName
      home.querySelector('.results-guide-welcome > p').textContent=s.welcome
      home.querySelectorAll('[data-question]').forEach((b,i)=>b.textContent=['🎓 ','📚 ','💼 '][i]+(s.questions[i]||defaults.questions[i]))
      let extras=home.querySelector('.results-extra-sections')
      if(!extras){ extras=document.createElement('div');extras.className='results-extra-sections';extras.innerHTML=`<section data-module-id="overview"><h2>专业全局概览</h2><div class="results-overview-columns"><div><h3>关联课程</h3><p>${esc((original.courses||[]).join('、')||'暂无关联课程')}</p></div><div><h3>关联岗位</h3><p>${esc((original.jobs||[]).join('、')||'暂无关联岗位')}</p></div></div></section><section data-module-id="teachers"><h2>专业教师团队</h2><p>暂无已发布的教师信息</p></section>`;home.querySelector('.results-home-layout').append(extras) }
      extras.hidden=s.layout!=='explore'
      for(const [i,m] of s.modules.entries()){ const section=extras.querySelector(`[data-module-id="${m.id}"]`);if(section){section.hidden=!m.visible;section.style.order=i;extras.append(section)} }
      home.querySelector('.results-home-layout').classList.toggle('has-extra-sections',!extras.hidden)
      const metrics=s.dataSource==='training' ? [{label:'培养目标',value:'—'},{label:'毕业要求',value:'—'},{...original.metrics[0],label:'专业课程',value:original.metrics[0]?.value??'—'},{label:'课程目标',value:'—'},{label:'案例',value:'—'},{...original.metrics[1],label:'知识点',value:original.metrics[1]?.value??'—'}] : original.metrics
      const metricBox=home.querySelector('.results-home-metrics'); metricBox.style.setProperty('--metric-count',metrics.length)
      metricBox.querySelectorAll('article').forEach(a=>a.remove()); metrics.forEach((m,i)=>{ const a=document.createElement('article'); a.tabIndex=0;a.title=m.basis||'按当前资料统计，缺失项待补充核验';a.innerHTML=`${icon(['e8b7','e845','e95f','e9c3','e873','e845'][i])}<strong>${esc(m.value)}</strong><span>${esc(m.label)}</span>`; metricBox.append(a) })
      if(edit && !home.querySelector('[data-results-edit]')) {
        const desc=home.querySelector('.results-home-description'); desc.insertAdjacentHTML('afterbegin',control('description','编辑描述'))
        metricBox.insertAdjacentHTML('beforeend',control('data','切换数据源','e684'))
        home.querySelector('.results-guide').insertAdjacentHTML('afterbegin',control('guide','设置','e879'))
      }
    }
    function open(kind,trigger) {
      if(kind==='data'){ save({...controller.state,dataSource:controller.state.dataSource==='construction'?'training':'construction'}); return }
      const draft=copy(controller.state), home=shell.querySelector('results-home')
      if(!draft.title) draft.title=home?.config?.name||homeDefaults.name||'专业建设成果'
      if(!draft.description) draft.description=home?.config?.summary||homeDefaults.summary||''
      const titles={navigation:'导航设置',style:'风格与布局设置',modules:'页面模块设置',description:'编辑描述',guide:'智慧专业领航员设置'}
      const overlay=document.createElement('div');overlay.className='results-settings-overlay'
      overlay.innerHTML=`<section class="results-settings-dialog ${kind==='style'?'is-style':''}" role="dialog" aria-modal="true" aria-labelledby="results-dialog-title"><header><h2 id="results-dialog-title">${titles[kind]}</h2><button type="button" data-close aria-label="关闭设置">×</button></header><form><div class="results-settings-body"></div><p class="results-settings-error" role="alert"></p><footer><button type="button" data-close>取消</button><button type="submit">确定</button></footer></form></section>`
      const body=overlay.querySelector('.results-settings-body')
      const field=(name,label,multiline=false,required=false)=>`<label class="results-settings-field"><span>${required?'<em>*</em> ':''}${label}</span>${multiline?`<textarea name="${name}" ${required?'required':''}>${esc(draft[name])}</textarea>`:`<input name="${name}" value="${esc(draft[name])}" ${required?'required':''} maxlength="100">`}</label>`
      if(kind==='style') {
        body.innerHTML=`<div class="results-layout-options">${[['launch','启航版','展示专业基本信息、智能助手、核心数据，可轻松、快速上手'],['explore','探索版','展示专业基本信息、专业特色结构等自定义内容，全面体现专业特色']].map(([v,t,d])=>`<label><input type="radio" name="layout" value="${v}" ${draft.layout===v?'checked':''}><strong>${t}</strong><p>${d}</p></label>`).join('')}</div><label class="results-settings-field"><span>主题</span><select name="theme"><option value="dark" ${draft.theme==='dark'?'selected':''}>深色</option><option value="light" ${draft.theme==='light'?'selected':''}>浅色</option></select></label>${['logo','crest'].map((key,i)=>`<label class="results-settings-field"><span>${i?'学校logo（校徽）':'<em>*</em> 学校logo'}</span><span class="results-image-upload"><img alt="${i?'校徽':'学校标识'}预览" src="${esc(draft[key]||((home?.getAttribute('asset-base')||'./results-assets/')+(i?'school-crest.jpg':'school-logo.png')))}"><span>⟳ 上传图片</span><input type="file" accept="image/png,image/jpeg,image/webp" data-image="${key}" aria-label="上传${i?'校徽':'学校logo'}"></span></label>`).join('')}${field('title','页面标题',false,true)}${field('titleEn','页面标题（英文）')}${field('description','页面描述',true,true)}${field('descriptionEn','页面描述（英文）',true)}`
      } else if(kind==='description') body.innerHTML=field('description','页面描述',true,true)+field('descriptionEn','页面描述（英文）',true)
      else if(kind==='guide') body.innerHTML=field('guideName','智能体名称',false,true)+field('welcome','开场白',true,true)+draft.questions.map((q,i)=>`<label class="results-settings-field"><span>推荐问题 ${i+1}</span><input name="question${i}" value="${esc(q)}" required maxlength="100"></label>`).join('')
      else renderList()
      function renderList(){
        const items=kind==='navigation'?draft.nav:draft.modules
        body.innerHTML=`<div class="results-settings-list">${items.map((item,i)=>`<div class="results-settings-row" draggable="true" data-index="${i}"><button type="button" class="results-drag-handle" aria-label="拖拽排序${esc(item.label)}" title="拖拽排序，或按上下方向键调整">${icon('e8cf')}</button><strong>${esc(item.label)}</strong><button type="button" data-visibility="${i}" aria-label="${item.visible===false?'显示':'隐藏'}${esc(item.label)}" aria-pressed="${item.visible!==false}">${icon(item.visible===false?'e808':'e807')}</button>${kind==='navigation'?`<button type="button" data-rename="${i}" aria-label="编辑${esc(item.label)}">${icon('e7ff')}</button>`:''}</div>`).join('')}${kind==='navigation'?'<button type="button" class="results-add-navigation">＋ 新增导航模块</button>':''}</div>`
      }
      let dragIndex=-1
      body.addEventListener('dragstart',e=>{dragIndex=Number(e.target.closest('[data-index]')?.dataset.index);e.dataTransfer?.setData('text/plain',String(dragIndex))})
      body.addEventListener('dragover',e=>{if(e.target.closest('[data-index]'))e.preventDefault()})
      body.addEventListener('drop',e=>{e.preventDefault();const row=e.target.closest('[data-index]'); if(row)move(dragIndex,Number(row.dataset.index))})
      function move(from,to){const list=kind==='navigation'?draft.nav:draft.modules;if(from<0||to<0||to>=list.length||from===to)return;list.splice(to,0,list.splice(from,1)[0]);renderList();body.querySelector(`[data-index="${to}"] .results-drag-handle`)?.focus()}
      body.addEventListener('keydown',e=>{if(e.target.matches('.results-drag-handle')&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const i=Number(e.target.closest('[data-index]').dataset.index);move(i,i+(e.key==='ArrowUp'?-1:1))}})
      body.addEventListener('click',e=>{
        const visible=e.target.closest('[data-visibility]'), rename=e.target.closest('[data-rename]')
        if(visible){ const list=kind==='navigation'?draft.nav:draft.modules; const item=list[Number(visible.dataset.visibility)]; item.visible=item.visible===false;renderList() }
        if(rename){const i=Number(rename.dataset.rename),row=rename.closest('.results-settings-row'),strong=row.querySelector('strong');const input=document.createElement('input');input.value=draft.nav[i].label;input.maxLength=20;input.setAttribute('aria-label','导航名称');strong.replaceWith(input);input.focus();input.select();input.oninput=()=>{draft.nav[i].label=input.value.trim()};input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();renderList()}}}
        if(e.target.closest('.results-add-navigation')){draft.nav.push({id:`custom-${Date.now()}`,label:'新导航模块',visible:true});renderList();body.querySelector('[data-rename]:last-child')?.focus()}
      })
      body.addEventListener('change',async e=>{
        if(!e.target.matches('[data-image]'))return
        const file=e.target.files?.[0]; if(!file)return
        const error=overlay.querySelector('[role=alert]')
        if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){error.textContent='请上传不超过2MB的 PNG、JPG 或 WebP 图片';return}
        const reader=new FileReader();reader.onload=()=>{draft[e.target.dataset.image]=reader.result;e.target.parentElement.querySelector('img').src=reader.result;error.textContent=''};reader.readAsDataURL(file)
      })
      const previousOverflow=document.body.style.overflow; document.body.style.overflow='hidden'; document.body.append(overlay)
      const close=()=>{overlay.remove();document.body.style.overflow=previousOverflow;trigger?.focus()}
      overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=close)
      overlay.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const nodes=[...overlay.querySelectorAll('button,input,textarea,select')].filter(n=>!n.disabled&&n.offsetParent);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}})
      overlay.querySelector('form').onsubmit=e=>{
        e.preventDefault();new FormData(e.target).forEach((value,key)=>{if(key.startsWith('question'))draft.questions[Number(key.slice(8))]=String(value).trim();else draft[key]=String(value).trim()})
        if(kind==='navigation' && (draft.nav.some(n=>!n.label)||!draft.nav.some(n=>n.visible!==false))){overlay.querySelector('[role=alert]').textContent='请填写导航名称，并至少保留一个可见导航';return}
        if(save(draft))close();else overlay.querySelector('[role=alert]').textContent='保存失败，请检查浏览器存储空间或缩小上传图片后重试'
      }
      overlay.querySelector('[data-close]').focus()
    }
  }
  root.ResultsPageEditor={mount,read,normalize,defaults,KEY}
  if(!root.document)return
  const scan=()=>document.querySelectorAll('.results-portal-shell').forEach(shell=>{const c=mount(shell); const home=shell.querySelector('results-home');if(home?.config && !home.dataset.settingsApplied){home.dataset.settingsApplied='true';c.apply()}})
  new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.results-portal-shell,results-home,.results-home-layout')||n.querySelector?.('.results-portal-shell,results-home')))))scan()}).observe(document.documentElement,{childList:true,subtree:true})
  root.addEventListener('storage',e=>{if(e.key===KEY)document.querySelectorAll('.results-portal-shell').forEach(s=>{s.resultsEditor.state=read();s.resultsEditor.apply()})})
  root.addEventListener('DOMContentLoaded',scan);scan()
})(globalThis)
