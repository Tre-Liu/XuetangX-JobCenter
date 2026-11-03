/* Local display edits, shared by static and Vue results entries. */
;(function(root){
  const KEY='major-results-industry-settings-v1:'
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const scope=model=>KEY+JSON.stringify([model.chains.map(c=>c.id).sort(),model.jobs.map(j=>j.id).sort()])
  function read(model){
    try{
      const raw=JSON.parse(root.localStorage.getItem(scope(model))||'{}')
      if(!raw||typeof raw!=='object'||Array.isArray(raw))return {}
      const state={overviews:{}}
      if(Array.isArray(raw.jobIds))state.jobIds=raw.jobIds.filter(id=>typeof id==='string')
      if(Array.isArray(raw.terms))state.terms=[...new Set(raw.terms.filter(t=>typeof t==='string').map(t=>t.trim()).filter(Boolean))].slice(0,24)
      for(const chain of model.chains){
        const value=raw.overviews?.[chain.id];if(!value||typeof value!=='object')continue
        const item={}
        for(const key of ['title','description'])if(typeof value[key]==='string')item[key]=value[key]
        if(Array.isArray(value.metrics)&&value.metrics.length===4&&value.metrics.every(m=>m&&typeof m.label==='string'&&typeof m.unit==='string'&&Number.isSafeInteger(m.value)&&m.value>=0))item.metrics=value.metrics
        state.overviews[chain.id]=item
      }
      return state
    }catch{return {}}
  }
  function open(panel,kind,trigger){
    if(!panel.editing||document.querySelector('.im-editor-overlay'))return
    const draft=JSON.parse(JSON.stringify(panel.settings)),chainId=panel.selectedChain
    draft.overviews ||= {}
    const saved=draft.overviews[chainId]||{},overlay=document.createElement('div')
    overlay.className='results-settings-overlay im-editor-overlay'
    const titles={description:'编辑产业链描述',data:'编辑数据',jobs:'岗位编辑',words:'编辑词条'}
    overlay.innerHTML=`<section class="results-settings-dialog im-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="im-editor-title"><header><h2 id="im-editor-title">${titles[kind]}</h2><button type="button" data-close aria-label="关闭设置">×</button></header><form><div class="results-settings-body"></div><p class="results-settings-error" role="alert"></p><footer><button type="button" data-close>取消</button><button type="submit">确定</button></footer></form></section>`
    const body=overlay.querySelector('.results-settings-body'),error=overlay.querySelector('[role=alert]')
    const field=(name,label,value,multiline=false)=>`<label class="results-settings-field"><span>${label}</span>${multiline?`<textarea name="${name}" maxlength="2000">${esc(value)}</textarea>`:`<input name="${name}" value="${esc(value)}" maxlength="100">`}</label>`
    let selected=new Set(panel.visibleJobs.map(j=>j.id))
    if(kind==='description')body.innerHTML=field('title','产业链标题',saved.title??panel.chain.chain?.name??'')+field('description','产业链介绍',saved.description??panel.querySelector('.im-overview-lead').textContent,true)
    if(kind==='data'){
      body.innerHTML='<p class="im-editor-note">修改当前产业链的展示字段，展示值需结合资料核验。</p><div class="im-metric-edit-list"></div>'
      const rows=[...panel.querySelectorAll('.im-overview-metrics > div')]
      body.querySelector('.im-metric-edit-list').innerHTML=rows.map((row,i)=>`<fieldset><legend>统计项 ${i+1}</legend><label>名称<input name="label${i}" value="${esc(row.querySelector('span').textContent)}" required maxlength="30"></label><label>数值<input type="number" min="0" max="9007199254740991" step="1" name="value${i}" value="${esc(saved.metrics?.[i]?.value??row.querySelector('strong').firstChild.textContent)}" required></label><label>单位<input name="unit${i}" value="${esc(row.querySelector('small').textContent)}" maxlength="10"></label></fieldset>`).join('')
    }
    if(kind==='jobs'){
      const candidates=root.ResultsIndustryModel.displayJobs(panel.model,null)
      body.innerHTML=`<p class="im-editor-note">选择产教模型已匹配的岗位，可全部取消。</p><label class="im-editor-search">搜索岗位<input type="search" aria-label="搜索可选岗位" placeholder="输入岗位名称"></label><div class="im-editor-actions"><button type="button" data-all>全选</button><button type="button" data-none>全部取消</button><span data-count></span></div><div class="im-job-options"></div>`
      const list=body.querySelector('.im-job-options'),search=body.querySelector('[type=search]')
      const render=()=>{
        const jobs=candidates.filter(j=>j.name.toLowerCase().includes(search.value.trim().toLowerCase()))
        list.innerHTML=jobs.map(j=>`<label><input type="checkbox" value="${esc(j.id)}" ${selected.has(j.id)?'checked':''}><span>${esc(j.name)}</span></label>`).join('')||'<p>暂无匹配岗位</p>'
        body.querySelector('[data-count]').textContent=`已选 ${selected.size} / ${candidates.length} 个`
      }
      search.oninput=render
      list.onchange=e=>{e.target.checked?selected.add(e.target.value):selected.delete(e.target.value);body.querySelector('[data-count]').textContent=`已选 ${selected.size} / ${candidates.length} 个`}
      body.querySelector('[data-all]').onclick=()=>{selected=new Set(candidates.map(j=>j.id));render()}
      body.querySelector('[data-none]').onclick=()=>{selected.clear();render()}
      render()
    }
    if(kind==='words'){
      body.innerHTML=`<p class="im-editor-note">每行一个词条，最多 24 个。词频按岗位描述统计；未出现的词条显示为 0 次。</p>${field('terms','词条', (draft.terms??panel.model.words.map(w=>w.name)).join('\n'),true)}`
      body.querySelector('textarea').maxLength=1500;body.querySelector('textarea').classList.add('im-terms-input')
    }
    const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';document.body.append(overlay)
    const close=()=>{overlay.remove();document.body.style.overflow=previousOverflow;if(trigger?.isConnected)trigger.focus();else panel.querySelector(`[data-im-edit="${kind}"]`)?.focus()}
    overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=close)
    overlay.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();close()}
      if(e.key==='Tab'){
        const nodes=[...overlay.querySelectorAll('button,input,textarea')].filter(n=>!n.disabled&&n.offsetParent),first=nodes[0],last=nodes.at(-1)
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    })
    overlay.querySelector('form').onsubmit=e=>{
      e.preventDefault();const data=new FormData(e.target)
      if(kind==='description')draft.overviews[chainId]={...saved,title:String(data.get('title')).trim(),description:String(data.get('description')).trim()}
      if(kind==='data'){
        const metrics=Array.from({length:4},(_,i)=>({label:String(data.get(`label${i}`)).trim(),value:Number(data.get(`value${i}`)),unit:String(data.get(`unit${i}`)).trim()}))
        if(metrics.some(m=>!m.label||!Number.isSafeInteger(m.value)||m.value<0)){error.textContent='请填写统计名称和有效的非负整数';return}
        draft.overviews[chainId]={...saved,metrics}
      }
      if(kind==='jobs')draft.jobIds=[...selected]
      if(kind==='words'){
        const terms=[...new Set(String(data.get('terms')).split(/\r?\n/).map(s=>s.trim()).filter(Boolean))]
        if(terms.length>24||terms.some(t=>t.length>30)){error.textContent='最多填写 24 个词条，每个词条不超过 30 个字符';return}
        draft.terms=terms
      }
      try{root.localStorage.setItem(scope(panel.model),JSON.stringify(draft))}catch{error.textContent='保存失败，请检查浏览器存储空间后重试';return}
      panel.settings=draft;panel.word='';panel.activeTask=-1;panel.activeAbility='';panel.refreshEdits();close()
    }
    overlay.querySelector('input,textarea,[data-close]').focus()
  }
  root.ResultsIndustryEditor={read,open}
})(globalThis)
