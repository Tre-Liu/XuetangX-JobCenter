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
      if(Array.isArray(raw.terms))state.terms=root.ResultsIndustryModel.normalizeTerms(raw.terms).slice(0,24)
      for(const chain of model.chains){
        const value=raw.overviews?.[chain.id];if(!value||typeof value!=='object')continue
        const item={}
        for(const key of ['title','description'])if(typeof value[key]==='string')item[key]=value[key]
        if(Array.isArray(value.metrics)&&value.metrics.length<=4&&value.metrics.every(m=>m&&typeof m.label==='string'&&typeof m.unit==='string'&&Number.isSafeInteger(m.value)&&m.value>=0))item.metrics=value.metrics
        if(item.metrics?.[3]?.label==='产业阶段')item.metrics[3]={label:'相关行业',value:root.ResultsIndustryModel.chainView(model,chain.id).relatedIndustries.length,unit:'个'}
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
      body.innerHTML='<p class="im-editor-note">修改当前产业链的展示字段，展示值需结合资料核验。初始化将恢复当前产业链的默认统计项。</p><div class="im-editor-actions im-metric-actions"><button type="button" data-initialize-metrics>初始化</button><button type="button" data-add-metric>添加</button><span data-metric-count role="status"></span></div><p class="im-editor-note" data-metric-empty>暂无统计项，可初始化或添加。</p><div class="im-metric-edit-list"></div>'
      const list=body.querySelector('.im-metric-edit-list'),add=body.querySelector('[data-add-metric]')
      const rowHtml=(metric,i)=>`<fieldset><legend>统计项 ${i+1}</legend><button type="button" class="im-metric-delete" data-delete-metric>删除</button><label>名称<input name="label${i}" value="${esc(metric.label)}" required maxlength="30"></label><label>数值<input type="number" min="0" max="9007199254740991" step="1" name="value${i}" value="${esc(metric.value)}" required></label><label>单位<input name="unit${i}" value="${esc(metric.unit)}" maxlength="10"></label></fieldset>`
      const updateRows=()=>{
        ;[...list.children].forEach((row,i)=>{
          row.querySelector('legend').textContent=`统计项 ${i+1}`
          row.querySelectorAll('input').forEach(input=>input.name=input.name.replace(/\d+$/,i))
          const button=row.querySelector('[data-delete-metric]')
          button.setAttribute('aria-label',`删除统计项 ${i+1}`)
          button.title=`删除统计项 ${i+1}`
        })
        add.disabled=list.children.length>=4
        body.querySelector('[data-metric-count]').textContent=`已添加 ${list.children.length} / 4 项`
        body.querySelector('[data-metric-empty]').hidden=!!list.children.length
      }
      const defaults=()=>root.ResultsIndustryModel.defaultMetrics(panel.chain)
      list.innerHTML=(saved.metrics??defaults()).map(rowHtml).join('')
      add.onclick=()=>{
        if(list.children.length>=4)return
        list.insertAdjacentHTML('beforeend',rowHtml({label:'',value:'',unit:''},list.children.length))
        updateRows();error.textContent='';list.lastElementChild.querySelector('input').focus()
      }
      body.querySelector('[data-initialize-metrics]').onclick=()=>{
        list.innerHTML=defaults().map(rowHtml).join('');updateRows();error.textContent=''
      }
      list.onclick=e=>{
        const button=e.target.closest('[data-delete-metric]')
        if(!button)return
        const row=button.closest('fieldset'),next=row.nextElementSibling||row.previousElementSibling
        row.remove();updateRows();error.textContent=''
        ;(next?.querySelector('[data-delete-metric]')||add).focus()
      }
      updateRows()
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
      body.innerHTML='<div class="im-editor-actions im-metric-actions im-term-actions"><button type="button" data-initialize-terms title="恢复默认词条及类型">初始化</button><button type="button" data-add-term>新增词条</button><span data-term-count role="status"></span></div><div class="im-term-columns" aria-hidden="true"><span>序号</span><span>名称</span><span>类型</span><span></span></div><ol class="im-term-list" aria-label="词条配置"></ol><p class="im-editor-note" data-term-empty>暂无词条</p>'
      const list=body.querySelector('.im-term-list'),add=body.querySelector('[data-add-term]')
      const defaults=()=>panel.model.words.map(w=>({name:w.name,type:root.ResultsIndustryModel.wordType(w,panel.model.words)}))
      const rowHtml=(term,i)=>{
        const name=typeof term==='string'?term:term.name
        const word=panel.words.find(w=>w.name===name)||{value:0}
        const type=typeof term==='object'?term.type:root.ResultsIndustryModel.wordType(word,panel.words)
        return `<li class="im-term-row"><span data-term-index>${i+1}</span><input name="termName${i}" aria-label="词条 ${i+1} 名称" value="${esc(name)}" placeholder="请输入名称" maxlength="30" required><select name="termType${i}" aria-label="词条 ${i+1} 类型">${[['large','大'],['medium','中'],['small','小']].map(([value,label])=>`<option value="${value}" ${value===type?'selected':''}>${label}</option>`).join('')}</select><button type="button" class="im-term-delete" data-delete-term aria-label="删除词条 ${i+1}">删除</button></li>`
      }
      const updateRows=()=>{
        ;[...list.children].forEach((row,i)=>{
          row.querySelector('[data-term-index]').textContent=i+1
          row.querySelector('input').name=`termName${i}`;row.querySelector('input').setAttribute('aria-label',`词条 ${i+1} 名称`)
          row.querySelector('select').name=`termType${i}`;row.querySelector('select').setAttribute('aria-label',`词条 ${i+1} 类型`)
          row.querySelector('[data-delete-term]').setAttribute('aria-label',`删除词条 ${i+1}`)
        })
        add.disabled=list.children.length>=24
        body.querySelector('[data-term-count]').textContent=`已添加 ${list.children.length} / 24 条`
        body.querySelector('[data-term-empty]').hidden=!!list.children.length
      }
      list.innerHTML=(draft.terms??defaults()).map(rowHtml).join('');updateRows()
      add.onclick=()=>{
        if(list.children.length>=24)return
        list.insertAdjacentHTML('beforeend',rowHtml({name:'',type:'medium'},list.children.length));updateRows();error.textContent='';list.lastElementChild.querySelector('input').focus()
      }
      list.onclick=e=>{
        const button=e.target.closest('[data-delete-term]');if(!button)return
        const row=button.closest('li'),next=row.nextElementSibling||row.previousElementSibling
        row.remove();updateRows();error.textContent='';(next?.querySelector('input')||add).focus()
      }
      const initialize=body.querySelector('[data-initialize-terms]')
      initialize.onclick=()=>{list.innerHTML=defaults().map(rowHtml).join('');updateRows();error.textContent='';body.scrollTop=0}
    }
    const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';document.body.append(overlay)
    const close=()=>{overlay.remove();document.body.style.overflow=previousOverflow;if(trigger?.isConnected)trigger.focus();else panel.querySelector(`[data-im-edit="${kind}"]`)?.focus()}
    overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=close)
    overlay.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();close()}
      if(e.key==='Tab'){
        const nodes=[...overlay.querySelectorAll('button,input,textarea,select')].filter(n=>!n.disabled&&n.offsetParent),first=nodes[0],last=nodes.at(-1)
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    })
    overlay.querySelector('form').onsubmit=e=>{
      e.preventDefault();const data=new FormData(e.target)
      if(kind==='description')draft.overviews[chainId]={...saved,title:String(data.get('title')).trim(),description:String(data.get('description')).trim()}
      if(kind==='data'){
        const metrics=Array.from(body.querySelectorAll('.im-metric-edit-list fieldset'),(_,i)=>({label:String(data.get(`label${i}`)).trim(),value:Number(data.get(`value${i}`)),unit:String(data.get(`unit${i}`)).trim()}))
        if(metrics.length>4){error.textContent='最多添加 4 个统计项';return}
        if(metrics.some(m=>!m.label||!Number.isSafeInteger(m.value)||m.value<0)){error.textContent='请填写统计名称和有效的非负整数';return}
        draft.overviews[chainId]={...saved,metrics}
      }
      if(kind==='jobs')draft.jobIds=[...selected]
      if(kind==='words'){
        const terms=Array.from(body.querySelectorAll('.im-term-row'),(_,i)=>({name:String(data.get(`termName${i}`)).trim(),type:String(data.get(`termType${i}`))}))
        if(terms.length>24||terms.some(t=>!t.name||t.name.length>30||!['large','medium','small'].includes(t.type))){error.textContent='最多填写 24 个词条，请填写 1 至 30 个字符的名称并选择类型';return}
        if(new Set(terms.map(t=>t.name)).size!==terms.length){error.textContent='词条名称不能重复';return}
        draft.terms=terms
      }
      try{root.localStorage.setItem(scope(panel.model),JSON.stringify(draft))}catch{error.textContent='保存失败，请检查浏览器存储空间后重试';return}
      panel.settings=draft;panel.word='';panel.activeTask=-1;panel.activeAbility='';panel.refreshEdits();close()
    }
    ;(body.querySelector('input,textarea,select')||overlay.querySelector('[data-close]')).focus()
  }
  root.ResultsIndustryEditor={read,open}
})(globalThis)
