// Shared browser component for the static file and the Vue application.
;(function (root) {
  if (!root.customElements || customElements.get('ability-dimension-graph')) return
  const model = root.AbilityDimensionModel
  const {levels} = model
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])
  const glyphs = {
    tree: '<rect x="2" y="9" width="6" height="6" rx="1.5"/><rect x="16" y="2" width="6" height="6" rx="1.5"/><rect x="16" y="16" width="6" height="6" rx="1.5"/><path d="M8 12h3a2 2 0 0 0 2-2V7a2 2 0 0 1 2-2h1m-5 7a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h1"/>',
    spark: '<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Zm7-2 .9 2.1L22 4l-2.1.9L19 7l-.9-2.1L16 4l2.1-.9L19 1Z"/>',
    sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 14h16M11 9v12"/>',
    arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>',
    edit:'<path d="m4 20 1-5L16 4l4 4L9 19l-5 1Zm10-14 4 4"/>',
    download:'<path d="M12 3v11m-4-4 4 4 4-4M4 16v4h16v-4"/>',
    upload:'<path d="M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4"/>',
    minus:'<path d="M5 12h14"/>', plus:'<path d="M5 12h14m-7-7v14"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
  }
  const icon = name => '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+glyphs[name]+'</svg>'
  const button = (act, label, cls = '', glyph = '') => '<button type="button" class="ad-btn '+cls+'" data-ad="'+act+'">'+(glyph ? icon(glyph) : '')+label+'</button>'
  const iconButton = (act, label, glyph) => '<button type="button" class="ad-icon" data-ad="'+act+'" title="'+safe(label)+'" aria-label="'+safe(label)+'">'+icon(glyph)+'</button>'
  const nodeAt = (tree, path) => path.reduce((branch, n) => branch.children[n], {children:tree})
  const id = path => path.join('.')
  function previewDiagram(ctx) {
    const item = model.localTree(ctx)[0]
    const trunk = item?.name || levels[0]
    const arms = item?.children.slice(0, 2) || []
    const row = (n, fallback) => safe(n?.name || fallback)
    return '<div class="ad-preview" aria-label="能力树结构预览"><span class="ad-preview-tag">结构预览</span><div class="ad-mini-tree"><div class="ad-mini-root">'+safe(trunk)+'</div><div class="ad-mini-arms">'+
      [0,1].map((n) => '<div class="ad-mini-arm"><span>'+row(arms[n], '支撑能力')+'</span><div class="ad-mini-leaves">'+
        [0,1].map(j => '<i>'+row(arms[n]?.children[j], '专项技能')+'</i>').join('')+'</div></div>').join('')+'</div></div></div>'
  }

  class AbilityDimensionGraph extends HTMLElement {
    constructor() {
      super()
      this.input = {major:'',scope:'',skills:[],courses:[]}
      this.collapsed = new Set()
      this.onClick = this.onClick.bind(this)
      this.onChange = this.onChange.bind(this)
    }
    get context() { return this.input }
    set context(value) {
      if (!value) return
      const changed = this.input.scope !== value.scope || this.input.major !== value.major
      this.input = value
      if (changed && this.isConnected) this.load()
    }
    get storageKey() { return 'ability-dimension:v1:'+this.input.scope }
    get readOnly() { return this.dataset.presentation === 'results' }
    connectedCallback() {
      if (Object.hasOwn(this,'context')) {
        const context = this.context
        delete this.context
        this.context = context
      }
      this.addEventListener('click',this.onClick)
      this.addEventListener('change',this.onChange)
      this.load()
    }
    disconnectedCallback() {
      this.close()
      this.removeEventListener('click',this.onClick)
      this.removeEventListener('change',this.onChange)
    }
    load() {
      this.close()
      this.graph = []
      this.source = ''
      this.basis = {}
      this.edited = false
      this.edit = false
      this.zoom = 1
      this.level = 2
      this.notice = ''
      this.stored = null
      try {
        this.stored = this.input.scope ? localStorage.getItem(this.storageKey) : null
        const data = this.stored && JSON.parse(this.stored)
        if (data && data.major === this.input.major) {
          this.graph = model.fromSheet([levels,...data.paths])
          this.source = data.source
          this.basis = data.basis || {}
          this.edited = Boolean(data.edited)
        }
      } catch { this.notice = '未能读取已保存的图谱。' }
      this.resetBranches()
      this.render()
    }
    resetBranches() {
      this.collapsed.clear()
      const visit = (branch, parent) => branch.forEach((item, i) => {
        const path = [...parent,i]
        if (path.length >= this.level) this.collapsed.add(id(path))
        visit(item.children,path)
      })
      visit(this.graph,[])
    }
    persist(tree, source, edited, basis = this.basis) {
      if (!this.input.scope) throw new Error('专业信息尚未加载。')
      if (model.stats(tree).nodes > model.limit) throw new Error('每张图谱最多可容纳 '+model.limit+' 个节点。')
      const previous = localStorage.getItem(this.storageKey)
      if (previous !== this.stored) throw new Error('其他页面已更新本图谱，请刷新后再保存。')
      const next = tree.length ? JSON.stringify({major:this.input.major,paths:model.paths(tree),source,edited,basis}) : null
      try {
        if (next) localStorage.setItem(this.storageKey,next)
        else localStorage.removeItem(this.storageKey)
      } catch { throw new Error('浏览器未能保存图谱，请检查可用存储空间后重试。') }
      this.stored = next
      this.graph = tree
      this.source = source
      this.basis = basis
      this.edited = edited
    }
    render() {
      const old = this.querySelector('.ad-scroll')
      const position = old ? [old.scrollLeft,old.scrollTop] : [0,0]
      const has = this.graph.length > 0
      const info = model.stats(this.graph)
      const source = this.readOnly && this.source ? '<p class="ad-source">'+safe(this.source)+'</p>' : ''
      const head = '<header class="ad-head"><div class="ad-title"><span class="ad-title-icon">'+icon('tree')+'</span><div><h2>能力维度图谱</h2><p>'+safe(this.input.major)+'</p></div></div>'+
        (has && !this.readOnly ? '<div class="ad-head-actions">'+button('ai','AI 创建','','spark')+button('import','模板导入','','sheet')+button('edit',this.edit?'完成编辑':'编辑图谱','ad-primary',this.edit?'check':'edit')+'</div>' : source)+'</header>'
      if (!has) {
        if (this.readOnly) {
          this.innerHTML = head+'<div class="ad-results-empty"><p>'+safe(this.notice || '暂无能力维度图谱')+'</p></div>'
          return
        }
        this.innerHTML = head+'<div class="ad-landing"><div class="ad-intro"><div class="ad-hero"><div class="ad-hero-copy"><h3>创建专业能力树</h3><p>从专业核心能力出发，梳理每项能力所需的技能、操作和评价标准。</p></div>'+previewDiagram(this.input)+'</div>'+
          '<div class="ad-methods">'+this.method('ai','spark','AI 创建','结合专业资料起草能力层级')+this.method('import','sheet','模板导入','从 Excel 导入已梳理的能力路径')+'</div>'+
          (this.notice ? '<p role="status">'+safe(this.notice)+'</p>':'')+'</div></div>'
        return
      }
      this.innerHTML = head+'<div class="ad-tools"><div class="ad-summary"><b>'+this.graph.length+'</b> 项核心能力<span>·</span><b>'+info.nodes+'</b> 个节点<span>·</span>共 '+info.depth+' 层</div>'+
        '<div class="ad-tool-actions">'+(this.edit?button('root','添加核心能力','','plus'):'')+
        '<label class="ad-depth">'+icon('layers')+'<select aria-label="图谱展开层级"><option value="0" hidden>自定义展开</option>'+levels.map((_,i)=>'<option value="'+(i+1)+'" '+(this.level===i+1?'selected':'')+'>展开至第 '+(i+1)+' 层</option>').join('')+'</select></label></div></div>'+
        '<div class="ad-stage"><div tabindex="0" class="ad-scroll" aria-label="能力树画布"><div class="ad-forest" style="zoom:'+this.zoom+'">'+this.branches(this.graph,[])+'</div></div>'+
        '<div class="ad-scale">'+iconButton('minus','缩小图谱','minus')+'<button type="button" data-ad="scale" title="还原缩放">'+Math.round(this.zoom*100)+'%</button>'+iconButton('plus','放大图谱','plus')+'</div></div>'
      const scroll = this.querySelector('.ad-scroll')
      scroll.scrollTo(...position)
      let drag
      scroll.onpointerdown = event => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button')) return
        drag = {x:event.clientX,y:event.clientY,left:scroll.scrollLeft,top:scroll.scrollTop}
        scroll.setPointerCapture(event.pointerId)
        scroll.classList.add('ad-dragging')
        event.preventDefault()
      }
      scroll.onpointermove = event => {
        if (drag) scroll.scrollTo(drag.left + drag.x - event.clientX, drag.top + drag.y - event.clientY)
      }
      scroll.onlostpointercapture = () => { drag = null; scroll.classList.remove('ad-dragging') }

      this.querySelector('.ad-depth select').value = String(this.level)
      this.querySelector('[data-ad="minus"]').disabled = this.zoom <= .6
      this.querySelector('[data-ad="plus"]').disabled = this.zoom >= 1.6
    }
    method(act, glyph, title, text) {
      return '<button type="button" data-ad="'+act+'" class="ad-method ad-method-'+act+'"><span class="ad-method-icon">'+icon(glyph)+'</span><span><strong>'+title+'</strong><small>'+text+'</small></span><span class="ad-go">'+icon('arrow')+'</span></button>'
    }
    branches(items,parent) {
      return '<ul>'+items.map((item,i)=>{
        const path = [...parent,i], key = id(path), depth = path.length
        const has = item.children.length > 0, open = !this.collapsed.has(key)
        return '<li data-tone="'+(path[0]%4)+'"><div class="ad-joint"><button type="button" class="ad-node ad-l'+depth+'" data-ad="node" data-path="'+key+'"><small>'+levels[depth-1]+'</small><strong>'+safe(item.name)+'</strong></button>'+
          (has ? '<button type="button" class="ad-toggle" data-ad="toggle" data-path="'+key+'" aria-label="'+(open?'收起':'展开')+safe(item.name)+'" aria-expanded="'+open+'">'+icon(open?'minus':'plus')+'</button>':'')+'</div>'+
          (has && open ? this.branches(item.children,path) : '')+'</li>'
      }).join('')+'</ul>'
    }
    close() {
      this.job?.abort()
      this.job = null
      this.draft = null
      const dialog = this.querySelector('dialog')
      dialog?.close()
      dialog?.remove()
    }
    dialog(title, body, footer) {
      this.close()
      const dialog = document.createElement('dialog')
      dialog.className = 'ad-dialog'
      dialog.setAttribute('aria-label',title)
      dialog.innerHTML = '<header><h3>'+safe(title)+'</h3>'+iconButton('cancel','关闭弹窗','close')+'</header><div class="ad-body">'+body+'</div><footer><p class="ad-error" role="alert"></p><div class="ad-buttons">'+footer+'</div></footer>'
      this.append(dialog)
      dialog.addEventListener('cancel', event => {event.preventDefault();this.close()})
      dialog.showModal()
      return dialog
    }
    message(text) {
      const p = this.querySelector('.ad-error')
      if (p) p.textContent = text
    }
    create(mode) {
      const file = location.protocol === 'file:'
      const local = model.localTree(this.input)
      const choice = mode === 'ai'
      const inputs = '<label class="ad-field">编制重点 <small>选填</small><textarea name="focus" maxlength="3000" placeholder="例如，重点展开岗位实操和成果评价"></textarea></label>'
      let body
      if (choice) {
        body = '<div class="ad-context"><strong>'+safe(this.input.major)+'</strong><span>'+this.input.skills.length+' 项岗位技能 · '+this.input.courses.length+' 门核心课程</span></div>'+
          (file ? '<p class="ad-help">当前为本地文件，可依据本专业岗位画像整理草稿。联网 AI 创建可在平台服务页面使用。</p>' : inputs)+
          (file && !local.length ? '<p class="ad-help">当前专业尚无可整理的岗位资料，可使用模板导入能力路径。</p>' : '')
      } else {
        body = '<p class="ad-help">每行填写一条能力路径，从核心能力开始，最多五层。同一上级下的同名节点会自动合并。</p>'+
          '<div class="ad-columns">'+levels.map((label,i)=>'<span><small>'+String(i+1).padStart(2,'0')+'</small>'+label+'</span>').join('')+'</div>'+
          button('template','下载 Excel 模板','','download')+
          '<label class="ad-file">'+icon('upload')+'<strong>选择能力图谱文件</strong><small>支持 .xlsx，最大 4 MB</small><input type="file" accept=".xlsx" aria-label="选择能力图谱文件"></label>'
      }
      let controls = button('cancel','取消')
      if (choice && !file) controls += button('generate','生成草稿','ad-primary','spark')
      if (choice && file) controls += local.length ? button('local','整理本地草稿','ad-primary','tree') : button('import','模板导入','ad-primary','sheet')
      this.dialog(choice?'AI 创建能力树':'模板导入能力树',body+'<div class="ad-result"></div>',controls)
      this.draft = {mode,local}
      if (choice && file) {
        const draft = this.draft
        void model.browserAvailable(root.LanguageModel).then(available => {
          if (!available || this.draft !== draft || draft.tree) return
          this.querySelectorAll('.ad-body .ad-help').forEach(note => note.remove())
          this.querySelector('.ad-result').insertAdjacentHTML('beforebegin',inputs)
          this.querySelector('.ad-buttons').insertAdjacentHTML('beforeend',button('browser','本机 AI 生成','ad-primary','spark'))
        })
      }
    }
    preview(tree,source,basis) {
      if (!this.draft) return
      Object.assign(this.draft,{tree,source,basis:{...basis,createdAt:new Date().toISOString()}})
      const stats = model.stats(tree)
      const result = this.querySelector('.ad-result')
      result.innerHTML = '<div class="ad-preview-summary"><strong>图谱预览</strong><span>'+tree.length+' 项核心能力 · '+stats.nodes+' 个节点 · '+stats.depth+' 层</span></div>'+
        tree.map(item=>'<details><summary><b>'+safe(item.name)+'</b><span>'+item.children.length+' 项支撑能力</span></summary><ul>'+
          model.paths([item]).map(path=>'<li>'+path.map(safe).join(' › ')+'</li>').join('')+'</ul></details>').join('')
      this.querySelector('.ad-buttons').innerHTML = button('cancel','取消')+button('apply',this.graph.length?'替换当前图谱':'创建图谱','ad-primary','check')
      this.message(this.graph.length?'确认后将替换当前专业已保存的图谱。':'')
    }
    async generate(useBrowser = false) {
      if (!this.draft || this.job) return
      const controller = new AbortController()
      this.job = controller
      const btn = this.querySelector(useBrowser?'[data-ad="browser"]':'[data-ad="generate"]')
      const local = this.querySelector('[data-ad="local"]')
      if (local) local.disabled = true
      btn.disabled = true
      btn.textContent = '正在生成…'
      this.message('')
      try {
        const {major,skills,courses} = this.input
        const dataInput = {major,skills,courses,focus:this.querySelector('[name="focus"]').value.trim()}
        if (useBrowser) {
          const tree = await model.browserTree(root.LanguageModel,dataInput,controller.signal)
          if (!controller.signal.aborted) {
            this.querySelector('[name="focus"]').readOnly = true
            this.preview(tree,'本机 AI 生成建议 · 待审核',{model:'浏览器本机模型',...dataInput})
          }
          return
        }
        const response = await fetch('/api/ability-dimension',{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
          body:JSON.stringify(dataInput)})
        if (!response.ok) throw new Error(response.status === 503 ? '当前服务未配置生成模型。' : 'AI 服务暂未能生成草稿，请重试。')
        const data = await response.json()
        if (controller.signal.aborted) return
        if (data.major !== major) throw new Error('返回的专业与当前专业不一致，请重试。')
        const tree = model.fromSheet([levels,...data.paths])
        this.querySelector('[name="focus"]').readOnly = true
        this.preview(tree,'AI 生成建议 · 待审核',{model:data.model,...dataInput})
      } catch (e) {
        if (controller.signal.aborted) return
        this.message(useBrowser ? '本机模型未能生成有效的能力路径，请调整编制重点后重试。' : e.message || '生成失败，请重试。')
        if (local) local.disabled = false
        btn.disabled = false
        btn.textContent = '重新生成'
        if (this.draft.local.length && !this.querySelector('[data-ad="local"]')) btn.insertAdjacentHTML('beforebegin',button('local','按本地资料整理'))
      } finally {if (this.job === controller) this.job = null}
    }
    template() {
      if (!root.XLSX) throw new Error('Excel 组件未加载，请刷新后重试。')
      const x = root.XLSX
      const sheet = x.utils.aoa_to_sheet([levels])
      sheet['!cols'] = levels.map((_,i)=>({wch:i===4?54:32}))
      const book = x.utils.book_new()
      x.utils.book_append_sheet(book,sheet,'能力路径')
      const guide = x.utils.aoa_to_sheet([['填写说明'],['在“能力路径”工作表逐行填写，每行一条从核心能力开始的完整路径。'],['最多五层，可以提前结束；中间层级不可留空。'],['多条路径共用上级时，重复填写相同上级名称。']])
      guide['!cols'] = [{wch:82}]
      x.utils.book_append_sheet(book,guide,'填写说明')
      x.writeFile(book,'能力维度图谱导入模板.xlsx')
    }
    async readFile(file) {
      if (!file || !this.draft) return
      const draft = this.draft, token = Symbol()
      draft.read = token
      draft.tree = null
      this.querySelector('.ad-result').replaceChildren()
      this.querySelector('.ad-buttons').innerHTML = button('cancel','取消')
      this.querySelector('.ad-file strong').textContent = file.name
      try {
        if (!/\.xlsx$/i.test(file.name) || file.size > 4*1024*1024) throw new Error('请选择 4 MB 以内的 .xlsx 工作簿。')
        if (!root.XLSX) throw new Error('Excel 组件未加载，请刷新后重试。')
        const bytes = await file.arrayBuffer()
        if (this.draft !== draft || draft.read !== token) return
        const book = root.XLSX.read(bytes,{type:'array'})
        const sheet = book.Sheets[book.SheetNames.includes('能力路径')?'能力路径':book.SheetNames[0]]
        if (!sheet?.['!ref']) throw new Error('工作表为空，请先填写能力路径。')
        const range = root.XLSX.utils.decode_range(sheet['!ref'])
        if (range.e.r > 5000 || range.e.c > 50) throw new Error('工作表范围过大，请仅保留能力路径数据。')
        const rows = root.XLSX.utils.sheet_to_json(sheet,{header:1,range:0,raw:false,blankrows:true})
        this.preview(model.fromSheet(rows),'模板导入 · '+file.name,{fileName:file.name})
      } catch (e) {
        if (this.draft === draft && draft.read === token) this.message(e.message || '工作簿读取失败。')
      }
    }
    inspect(path, add = false) {
      const item = nodeAt(this.graph,path)
      const depth = path.length + Number(add)
      const trail = path.map((_,i)=>nodeAt(this.graph,path.slice(0,i+1)).name)
      const label = levels[depth-1]
      const editing = this.edit || add
      const body = (trail.length ? '<div class="ad-trail">'+trail.map(name=>'<span>'+safe(name)+'</span>').join('<i>›</i>')+'</div>' : '')+
        (editing ? '<label class="ad-field">'+label+'名称<input name="label" maxlength="'+model.maxName+'" value="'+safe(add?'':item.name)+'" placeholder="请输入节点名称" required></label>' :
          '<div class="ad-context"><small>第 '+depth+' 层 · '+label+'</small><strong>'+safe(item.name)+'</strong><span>'+item.children.length+' 个直接下级</span></div>')
      const actions = editing ? (add ? '' : button('remove','删除分支','ad-danger')+(depth<5 ? button('child','添加下级','','plus'):''))+button('save','保存','ad-primary') : button('cancel','关闭','ad-primary')
      this.dialog(add?'添加'+label:editing?'编辑'+label:'能力节点详情',body,actions)
      this.draft = {path,add}
      if (editing) this.querySelector('[name="label"]').focus()
    }
    saveNode(deleting = false) {
      const {path,add} = this.draft
      const graph = structuredClone(this.graph)
      const siblings = nodeAt(graph,add ? path : path.slice(0,-1)).children
      if (deleting) siblings.splice(path.at(-1),1)
      else {
        const name = this.querySelector('[name="label"]').value.trim()
        if (!name) throw new Error('请填写节点名称。')
        if (siblings.some((n,i)=>n.name===name && (add || i!==path.at(-1)))) throw new Error('同一上级下已有这个名称。')
        if (add) siblings.push({name,children:[]})
        else siblings[path.at(-1)].name = name
      }
      this.persist(graph,this.source,true)
      if (deleting) {
        if (!this.level) this.level = 2
        this.resetBranches()
      }
      if (add) for (let n=1;n<=path.length;n++) this.collapsed.delete(id(path.slice(0,n)))
      this.close()
      this.render()
      if (!deleting) {
        const key = id(add ? [...path,siblings.length-1] : path)
        this.querySelector('[data-ad="node"][data-path="'+key+'"]')?.focus()
      }
    }
    onClick(event) {
      const target = event.target.closest('[data-ad]')
      if (!target || !this.contains(target)) return
      const key = target.dataset.path
      const path = key ? key.split('.').map(Number) : []
      try {
        switch (target.dataset.ad) {
          case 'ai': case 'import': return this.create(target.dataset.ad)
          case 'generate': return void this.generate()
          case 'browser': return void this.generate(true)
          case 'local': {
            const focus = this.querySelector('[name="focus"]')?.closest('.ad-field')
            focus?.remove()
            const tree = this.draft.local
            return this.preview(tree,'本地岗位画像整理 · 待审核',{
              source:'专业岗位库 · 岗位画像测算',
              skills:[...new Set(model.paths(tree).map(path => path[2]))],
              method:'按现有岗位技能归并核心能力与支撑能力，操作要点和评价标准为编制建议。'
            })
          }
          case 'template': return this.template()
          case 'apply':
            this.persist(this.draft.tree,this.draft.source,false,this.draft.basis)
            this.close(); this.edit = false; this.level = 2; this.zoom = 1; this.resetBranches(); this.render()
            this.querySelector('.ad-scroll')?.scrollTo(0,0)
            return
          case 'cancel': return this.close()
          case 'edit': this.edit = !this.edit; this.render(); this.querySelector('[data-ad="edit"]').focus(); return
          case 'toggle':
            if (this.collapsed.has(key)) this.collapsed.delete(key)
            else this.collapsed.add(key)
            this.level = 0
            this.render()
            this.querySelector('[data-ad="toggle"][data-path="'+key+'"]').focus({preventScroll:true})
            return
          case 'node': return this.inspect(path)
          case 'root': return this.inspect([],true)
          case 'child': return this.inspect(this.draft.path,true)
          case 'save': return this.saveNode()
          case 'remove': {
            const {path} = this.draft
            this.dialog('删除能力分支','<p>确认删除「'+safe(nodeAt(this.graph,path).name)+'」及其所有下级节点？</p>',button('cancel','取消')+button('confirm-remove','删除分支','ad-danger'))
            this.draft = {path}
            return
          }
          case 'confirm-remove': return this.saveNode(true)
          case 'minus': case 'plus': case 'scale':
            this.zoom = target.dataset.ad==='scale'?1:Math.max(.6,Math.min(1.6,Math.round((this.zoom+(target.dataset.ad==='plus'?.2:-.2))*10)/10))
            this.render()
        }
      } catch (e) {this.message(e.message)}
    }
    onChange(event) {
      if (event.target.matches('.ad-depth select')) {
        this.level = Number(event.target.value)
        this.resetBranches(); this.render()
        this.querySelector('.ad-depth select').focus()
      } else if (event.target.type === 'file') {
        const file = event.target.files[0]
        event.target.value = ''
        void this.readFile(file)
      }
    }
  }
  customElements.define('ability-dimension-graph', AbilityDimensionGraph)
})(globalThis)
