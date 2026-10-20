/** Shared stateful workflow custom element. */
;(function(root){
 if(typeof customElements==='undefined'||customElements.get('talent-plan-workbench'))return
 const M=root.TalentPlanModel,R=root.TalentPlanRichText,D=root.TalentPlanData,V=root.TalentPlanViews,F=root.TalentPlanFiles
 class TalentPlanWorkbench extends HTMLElement {
  static get observedAttributes(){return ['mode']}
  connectedCallback(){
   if(this.started)return;this.started=true
   try{this.storage=localStorage;this.state=M.load(this.storage)}catch{this.storage=null;this.state=M.blank()}
   this.lastSavedStamp=this.state.draft?.updatedAt
   this.screen=this.getAttribute('mode')==='results'?'results':'home';this.queries={};this.panel='refs';this.chapter='goals';this.suggestion=null;this.notice='';this.error=''
   this.addEventListener('click',event=>this.click(event))
   this.addEventListener('change',event=>this.change(event))
   this.addEventListener('input',event=>this.input(event))
   for(const name of ['mouseup','keyup','focusout'])this.addEventListener(name,()=>this.rememberSelection())
   this.addEventListener('mousedown',event=>{if(event.target.closest('.tp-rich-toolbar')){this.rememberSelection();if(event.target.closest('button'))event.preventDefault()}})
   this.addEventListener('paste',event=>this.pasteRich(event))
   this.addEventListener('dragover',event=>{if(event.target.closest('[data-dropzone]')){event.preventDefault();event.dataTransfer.dropEffect='copy'}})
   this.addEventListener('drop',event=>{if(event.target.closest('[data-dropzone]')){event.preventDefault();const file=event.dataTransfer.files[0];if(file)this.upload(file)}})
   this.addEventListener('keydown',event=>this.keydown(event))
   this.storageListener=event=>{if(event.key===M.storageKey && !this.busy){this.notice='另一窗口更新了方案，返回工作台后可读取最新内容。';this.renderNotice()}}
   root.addEventListener('storage',this.storageListener)
   this.render()
  }
  disconnectedCallback(){clearTimeout(this.saveTimer);clearTimeout(this.searchTimer);clearTimeout(this.generationTimer);if(this.started&&this.pendingTextSave)this.save();root.removeEventListener('storage',this.storageListener)}
  attributeChangedCallback(name,old,value){if(this.started&&old!==value){this.screen=value==='results'?'results':'home';this.viewResult=null;this.render()}}
  get draft(){return this.state.draft}
  log(title,detail=''){if(this.draft)this.draft.history=[...(this.draft.history||[]),{title,detail,at:new Date().toISOString()}].slice(-80)}
  save(){
   if(!this.storage)return false
   try{
    this.state=M.mergeState(this.state,M.load(this.storage),this.lastSavedStamp)
    if(this.draft)this.draft.updatedAt=new Date().toISOString()
    this.storage.setItem(M.storageKey,JSON.stringify(this.state));this.lastSavedStamp=this.draft?.updatedAt;this.pendingTextSave=false;return true
   }
   catch{this.error='本机存储空间不足，当前内容仍在页面中。请导出数据档案后保留。';this.renderNotice();return false}
  }
  renderNotice(){const status=this.querySelector('[data-tp-status]');if(status){status.innerHTML=M.esc(this.error||this.notice);status.className='tp-notice '+(this.error?'error':'');status.hidden=!(this.error||this.notice)}}
  render(){
   this.className='tpw'
   let body=''
   if(this.screen==='home')body=V.home(this)
   else if(this.screen==='results')body=V.results(this)
   else if(this.screen==='result')body=V.editor(this)
   else if(this.draft){
    const d=this.draft
    body=`<div class="tp-flow"><div class="tp-flow-heading"><div>${V.button('home','← 修制定工作台','link')}<h1>${M.esc(d.name)}</h1><span>${M.esc(d.level)} · ${M.esc(d.year)}级 · ${d.years}年制</span></div><div class="tp-flow-save">${V.icon('check',15)}草稿保存在本机</div></div>${V.stepper(d)}<div class="tp-flow-content" data-flow-scroll>${d.step===1?V.setup(this):d.step===2?V.jobs(this):d.step===3?V.courses(this):d.generated?V.editor(this):V.review(this)}</div>${!d.generated||d.step!==5?`<footer class="tp-flow-footer"><span>${this.busy?'<i class="tp-spinner"></i> '+M.esc(this.progress||'正在处理…'):'随时返回上一步补充，已选岗位与课程会保留'}</span><div>${d.step>1?V.button('prev','上一步'):V.button('home','保存并返回')}${d.step<5?V.button('next',(d.step===1?'确认解析，关联岗位':d.step===2?'进入课程设置':'确认依据，生成方案')+' →','primary',this.busy?'disabled':''):''}</div></footer>`:''}</div>`
   }else{this.screen='home';body=V.home(this)}
   this.innerHTML=`<div class="tp-notice" data-tp-status role="status" aria-live="polite" hidden></div>${body}${V.drawer(this)}${V.relationDialog(this)}${V.courseDialog(this)}${V.chapterDialog(this)}${this.busy&&this.draft?.step===5?`<div class="tp-generation-overlay" role="status"><div><i class="tp-spinner"></i><h3>正在组织方案章节</h3><p>${M.esc(this.progress||'根据所选岗位、课程与规范起草')}</p><div class="tp-card-progress"><span style="width:${this.generationProgress||12}%"></span></div></div></div>`:''}`
   this.renderNotice()
   if(this.drawer||this.relation||this.newCourse||this.managingChapters){this.querySelector('[role="dialog"]')?.focus()}
  }
  show(text,error=false){this.error=error?text:'';this.notice=error?'':text;this.renderNotice()}
  rememberCurrent(){
   if(this.draft&&(this.draft.source||this.draft.jobIds.length||this.draft.generated)){
    this.state.drafts=[...(this.state.drafts||[]).filter(d=>d.id!==this.draft.id),M.copy(this.draft)].slice(-10)
   }
  }
  start(mode){
   this.rememberCurrent();this.state.draft=M.createDraft(mode);this.screen='flow';this.viewResult=null;this.editing=false;this.compare=false;this.error='';this.notice='';this.queries={};this.save();this.render()
  }
  loadExisting(){
   if(this.screen!=='flow'||!this.draft)this.start('existing')
   const x=D.existing
   if(Object.keys(this.draft.chapters||{}).length){this.rememberCurrent();this.draft.id=M.uid('plan')}
   const d=this.draft
   d.mode='existing';Object.assign(d,{name:x.name,major:x.major,code:x.code,year:x.year,level:x.level,years:x.years})
   const text=`一、专业名称\n${x.major}\n二、专业代码\n${x.code}\n三、培养目标\n${x.goals}\n四、毕业要求\n${x.requirements}\n五、课程体系\n${D.courses.map(c=>`${c.code} ${c.name} ${c.credits}学分 ${c.semester}`).join('\n')}`
   M.replaceSource(d,{...M.parseText(text),fileName:x.name+'（现有内容）',bytes:0,parsedAt:new Date().toISOString()})
   d.courseIds=[...x.courseIds];d.step=1;d.maxStep=1;d.generated=false;this.log('载入现有培养方案','复用已有目标、毕业要求和课程内容');this.save();this.render()
  }
  invalidate(){if(!this.draft)return;this.draft.generated=false;this.draft.relations=(this.draft.relations||[]).filter(r=>this.draft.jobIds.includes(r.jobId)&&this.draft.courseIds.includes(r.courseId));this.suggestion=null}
  navigate(view,extra={}){this.dispatchEvent(new CustomEvent('talent-plan-navigate',{bubbles:true,detail:{view,...extra}}))}
  async click(event){
   const b=event.target.closest('button,[data-overlay]');if(!b||!this.contains(b))return
   if(b.matches('[data-overlay]')&&event.target===b){this.drawer=null;this.render();return}
   const action=b.dataset.tp
   if(!action&&!b.dataset.tpStep&&!b.dataset.chapter&&!b.dataset.panel)return
   event.stopPropagation();if(b.disabled)return
   if(this.busy)return
   this.error='';this.notice=''
   const d=this.draft
   if(b.dataset.tpStep){const step=Number(b.dataset.tpStep);if(![1,2,3,5].includes(step))return;if(step<=d.step||!M.validateStep(d,d.step)){d.step=step;this.save();this.render()}return}
   if(b.dataset.chapter){this.chapter=b.dataset.chapter;this.editing=false;this.suggestion=null;this.render();return}
   if(b.dataset.panel){this.panel=b.dataset.panel;this.render();return}
   switch(action){
    case 'manage-chapters':if(this.viewResult)return;this.managingChapters=true;this.render();return
    case 'close-chapters':this.managingChapters=false;this.render();this.querySelector('[data-tp="manage-chapters"]')?.focus();return
    case 'add-chapter':{
     const input=this.querySelector('[data-new-chapter]'),title=input.value.trim();if(!title){input.focus();return}
     const id=M.addChapter(d,title);if(!id)return;this.chapter=id;this.log('新增章节',title);this.save();this.render();return
    }
    case 'move-chapter':M.moveChapter(d,b.dataset.id,Number(b.dataset.offset));this.log('调整章节顺序');this.save();this.render();return
    case 'remove-chapter':{
     const rows=M.chapterDefs(d),c=rows.find(c=>c.id===b.dataset.id);if(!c||rows.length<=1)return
     d.removedChapters=[...(d.removedChapters||[]).filter(x=>x.id!==c.id),c];M.removeChapter(d,c.id)
     if(this.chapter===c.id)this.chapter=M.chapterDefs(d)[0].id
     this.log('移除章节',c.title+'；原文保留，可在章节管理中恢复');this.save();this.render();return
    }
    case 'restore-chapter':{
     const c=(d.removedChapters||[]).find(c=>c.id===b.dataset.id);if(!c)return
     d.chapterOutline=M.chapterDefs(d);d.chapterOutline.push(c);d.removedChapters=d.removedChapters.filter(x=>x.id!==c.id);this.log('恢复章节',c.title);this.save();this.render();return
    }

    case 'rich-format':this.formatRich(b.dataset.command);return
    case 'rich-table':this.insertAdjacentHTML('beforeend',R.tableDialog());this.querySelector('[data-rich-table-overlay] [role="dialog"]')?.focus();return
    case 'close-rich-table':this.querySelector('[data-rich-table-overlay]')?.remove();this.restoreSelection();return
    case 'insert-rich-table':{
     const rows=Number(this.querySelector('[data-table-rows]').value),cols=Number(this.querySelector('[data-table-cols]').value)
     if(!Number.isInteger(rows)||rows<1||rows>30||!Number.isInteger(cols)||cols<1||cols>12){this.querySelector('[data-table-error]').textContent='请输入1至30行、1至12列的整数';return}
     this.querySelector('[data-rich-table-overlay]').remove();this.formatRich('insertHTML',R.blankTable(rows,cols));return
    }
    case 'rich-image':this.querySelector('[data-rich-image]')?.click();return
    case 'new-upload':this.start('upload');return
    case 'new-standard':this.start('standard');this.draft.standardId='policy-position';this.save();this.render();return
    case 'home':this.screen='home';this.viewResult=null;this.drawer=null;this.relation=null;this.save();this.render();this.navigate('workbench');return
    case 'results':this.screen='results';this.viewResult=null;this.save();this.render();this.navigate('results');return
    case 'resume':{
     if(b.dataset.id && this.state.drafts?.some(x=>x.id===b.dataset.id)){const target=this.state.drafts.find(x=>x.id===b.dataset.id);this.rememberCurrent();this.state.draft=M.copy(target);this.state.drafts=this.state.drafts.filter(x=>x.id!==target.id)}
     this.screen='flow';this.viewResult=null;this.save();this.render();return
    }
    case 'delete-plan':{
     const id=b.dataset.id,isExisting=id==='existing'
     const target=isExisting?D.existing:[this.draft,...(this.state.drafts||[]),...this.state.results].find(x=>x?.id===id)
     if(!target)return
     const message=isExisting?`确认从继续建设中移除“${target.name}”？已有培养目标、毕业要求和课程内容仍保留。`:`确认删除“${target.name}”？删除后无法恢复，其他草稿与归档版本不受影响。`
     if(!root.confirm(message))return
     const before=M.copy(this.state),stamp=this.lastSavedStamp
     if(isExisting)this.state.existingPlanHidden=true
     else{
      this.state.deletedPlanIds=[...new Set([...(this.state.deletedPlanIds||[]),id])]
      if(this.draft?.id===id)this.state.draft=null
      this.state.drafts=(this.state.drafts||[]).filter(x=>x.id!==id)
      this.state.results=this.state.results.filter(x=>x.id!==id)
     }
     if(!this.save()){
      this.state=before;this.lastSavedStamp=stamp;this.show('删除未保存，方案仍保留。请检查本机存储后重试。',true);return
     }
     this.viewResult=null;this.screen='home';this.notice=isExisting?'已从继续建设中移除现有方案':'方案已删除';this.render();return
    }
    case 'load-existing':this.loadExisting();return
    case 'existing-section':this.navigate('existing',{section:'培养目标'});return
    case 'prev':d.step=d.step>=4?3:Math.max(1,d.step-1);this.save();this.render();return
    case 'next':{
     const err=M.validateStep(d,d.step);if(err){this.show(err,true);return}
     d.step=d.step===3?5:Math.min(5,d.step+1);d.maxStep=Math.max(d.maxStep||1,d.step);this.save();this.render();return
    }
    case 'recommend-jobs':d.jobIds=[...new Set([...d.jobIds,'job-bim-deepening','job-smart-site-manager','job-structure-monitoring'])].filter(id=>D.jobs.some(j=>j.id===id));this.invalidate();this.log('关联重点岗位','按现有专业岗位方向选择，具体岗位可继续调整');break
    case 'remove-job':d.jobIds=d.jobIds.filter(id=>id!==b.dataset.id);this.invalidate();break
    case 'job-detail':this.drawer={jobId:b.dataset.id};this.render();return
    case 'course-detail':this.drawer={courseId:b.dataset.id};this.render();return
    case 'close-overlay':this.drawer=null;this.relation=null;this.newCourse=null;this.render();this.returnFocus?.focus();return
    case 'new-course':this.returnFocus=b;this.newCourse={code:'',name:'',type:D.courses[0].type,credits:'',semester:'',college:''};this.render();return
    case 'save-course':{
     if(!this.newCourse)return
     try{const course=M.addCourse(d,this.newCourse);this.invalidate();this.log('新建课程',course.code+' '+course.name);this.newCourse=null;this.queries.courses='';this.courseType='';this.notice='课程已创建并引用到当前方案'}
     catch(err){const tip=this.querySelector('[data-course-error]');if(tip)tip.textContent=err.message;return}
     break
    }
    case 'rematch':d.relations=M.match(d);this.invalidateGeneratedOnly();this.log('重新匹配岗课关系','保留仍有效的人工确认关系');this.notice='已刷新匹配建议，人工确认关系已保留';break
    case 'confirm-all':{
     this.invalidateGeneratedOnly();let count=0;d.relations.forEach(r=>{if(!r.confirmed){r.confirmed=true;r.confirmedAt=new Date().toISOString();count++}})
     this.log('批量确认课程能力关系',`${count}条建议关系由用户确认`);this.notice=count?`已确认 ${count} 条匹配建议`:'当前没有待确认的匹配建议';break
    }
    case 'relation':{
     const r=d.relations.find(r=>r.jobId===b.dataset.job&&r.courseId===b.dataset.course)
     this.returnFocus=b;this.relation={jobId:b.dataset.job,courseId:b.dataset.course,abilityIds:[...(r?.abilityIds||[])]};this.render();return
    }
    case 'save-relation':{
     const x=this.relation;if(!x.abilityIds.length){this.show('请勾选课程实际支撑的能力，或取消本条关系',true);return}
     d.relations=d.relations.filter(r=>r.jobId!==x.jobId||r.courseId!==x.courseId)
     d.relations.push({...M.copy(x),confirmed:true,manual:true,reason:'用户核对课程内容后确认',confirmedAt:new Date().toISOString()});this.relation=null;this.invalidateGeneratedOnly();this.log('确认岗课能力关系',`${x.abilityIds.length}项能力`);break
    }
    case 'remove-relation':{const x=this.relation;d.relations=d.relations.filter(r=>r.jobId!==x.jobId||r.courseId!==x.courseId);this.relation=null;this.invalidateGeneratedOnly();this.log('取消岗课支撑关系');break}
    case 'generate':await this.generate();return
    case 'toggle-edit':this.saveRich();this.editing=!this.editing;if(!this.editing)this.log('保存章节编辑',M.chapterDefs(d).find(c=>c.id===this.chapter)?.title);break
    case 'toggle-compare':this.compare=!this.compare;this.editing=false;this.render();return
    case 'insert-reference':M.insertReference(d,this.chapter,b.dataset.id);this.markEdited();this.log('引用规范依据',M.references.find(r=>r.id===b.dataset.id)?.title);break
    case 'suggest':this.suggest();return
    case 'diagnose':this.diagnose();return
    case 'regenerate-chapter':this.suggestion={title:'重新起草预览',text:M.generate(d)[this.chapter]||'',apply:true,replace:true};this.render();return
    case 'apply-suggestion':{
     if(this.suggestion.replace && d.chapterHtml)delete d.chapterHtml[this.chapter]
     else if(d.chapterHtml?.[this.chapter])d.chapterHtml[this.chapter]+=R.paragraphs(this.suggestion.text)
     d.chapters[this.chapter]=this.suggestion.replace?this.suggestion.text:`${d.chapters[this.chapter]||''}\n\n${this.suggestion.text}`
     this.markEdited();this.log('应用章节修订建议',this.suggestion.title);this.suggestion=null;break
    }
    case 'publish':{
     if(!d.generated){this.show('请先生成方案正文',true);return}
     if(!M.chapterDefs(d).every(c=>(d.chapters[c.id]||'').trim())){this.show('部分章节正文为空，请补充后再保存至建设成果',true);return}
     const result=M.snapshot(d);this.state.results.push(result);this.log('保存至建设成果',result.id)
     if(!this.save()){this.state.results.pop();return}
     this.screen='results';this.viewResult=null;this.render();this.show('已保存独立版本，后续修订不会修改本次归档内容');this.navigate('results');return
    }
    case 'view-result':this.viewResult=this.state.results.find(r=>r.id===b.dataset.id);this.screen='result';this.editing=false;this.compare=false;this.chapter='goals';this.render();return
    case 'revise-result':{const source=this.viewResult;this.rememberCurrent();this.state.draft={...M.copy(source),id:M.uid('plan'),mode:'existing',step:5,generated:true,baseline:M.copy(source.chapters),history:[]};this.viewResult=null;this.screen='flow';this.log('基于归档版本继续修订',source.id);this.save();this.render();return}
    case 'export-docx':try{const item=this.viewResult||d;F.download(await F.exportDocx(item),item.name+'.docx');this.show('Word 文档已导出')}catch(err){this.show(err.message,true)}return
    case 'export-html':{const item=this.viewResult||d;F.download(new Blob([M.exportHtml(item)],{type:'text/html;charset=utf-8'}),item.name+'.html');this.show('可打印文档已导出');return}
    case 'export-archive':{const item=this.viewResult||d;F.download(new Blob([JSON.stringify({plan:item,provenance:D.provenance,references:M.references,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),item.name+'-数据档案.json');this.show('数据档案已导出');return}
   }
   this.save();this.render()
  }
  invalidateGeneratedOnly(){if(this.draft?.generated)this.draft.generated=false}
  markEdited(){const d=this.draft;d.editedChapterIds=[...new Set([...(d.editedChapterIds||[]),this.chapter])]}
  change(event){
   const el=event.target,d=this.draft;if(!d||this.busy)return
   if(el.matches('[data-rich-size]')){this.formatRich('fontSize',el.value);return}
   if(el.matches('[data-rich-image]')){const file=el.files[0];if(file)this.insertRichImage(file);el.value='';return}
   if(el.dataset.newCourse && this.newCourse){this.newCourse[el.dataset.newCourse]=el.value;return}
   if(el.matches('[data-upload]')){const file=el.files[0];if(file)this.upload(file);return}
   if(el.dataset.chapterTitle){M.renameChapter(d,el.dataset.chapterTitle,el.value);this.log('修改章节名称',el.value);this.save();return}
   if(el.dataset.field){
    const key=el.dataset.field
    if(key==='code')return
    if(key==='major'){
     const major=M.majorOptions(d).find(m=>m.code===el.value);if(!major)return
     d.major=major.name;d.code=major.code
    }else if(key==='region'){
     if(!root.TalentPlanStandards?.regions.includes(el.value))return
     d.region=el.value
    }else if(['name','year','level','years','direction','templateId'].includes(key))d[key]=key==='years'?Number(el.value):el.value
    if(key==='level'){
     if(!M.majorOptions(d).some(m=>m.code===d.code&&m.name===d.major)){d.major='';d.code=''}
     d.templateId=M.undergraduate(d)?'undergraduate-school':'vocational-2025';d.standardId=M.undergraduate(d)?'policy-position':'gb-goals'
     if(M.undergraduate(d))delete d.chapters.occupation
    }
    if(key==='level'||key==='templateId'){delete d.chapterOutline;d.removedChapters=[]}
    if(key==='templateId')d.standardId=M.isEngineering(d)?'eng-goals':M.undergraduate(d)?'policy-position':'gb-goals'
    this.invalidate();this.save();this.render();return
   }
   if(el.dataset.standard){d.standardId=el.dataset.standard;this.invalidate();this.save();return}
   if(el.dataset.job && el.type==='checkbox'){d.jobIds=el.checked?[...new Set([...d.jobIds,el.dataset.job])]:d.jobIds.filter(id=>id!==el.dataset.job);this.invalidate()}
   else if(el.dataset.course && el.type==='checkbox'){d.courseIds=el.checked?[...new Set([...d.courseIds,el.dataset.course])]:d.courseIds.filter(id=>id!==el.dataset.course);this.invalidate()}
   else if(el.dataset.filter){this[el.dataset.filter]=el.type==='checkbox'?el.checked:el.value}
   else if(el.dataset.relationAbility){const x=this.relation;x.abilityIds=el.checked?[...new Set([...x.abilityIds,el.dataset.relationAbility])]:x.abilityIds.filter(id=>id!==el.dataset.relationAbility);const count=this.querySelector('[data-relation-count]');if(count)count.textContent=x.abilityIds.length;return}
   else return
   this.save();const scroll=this.querySelector('[data-flow-scroll]')?.scrollTop;this.render();const area=this.querySelector('[data-flow-scroll]');if(area)area.scrollTop=scroll||0
  }
  input(event){
   const el=event.target
   if(el.dataset.newCourse && this.newCourse){this.newCourse[el.dataset.newCourse]=el.value;return}
   if(el.dataset.search){this.queries[el.dataset.search]=el.value;const key=el.dataset.search,pos=el.selectionStart;clearTimeout(this.searchTimer);this.searchTimer=setTimeout(()=>{this.render();const input=this.querySelector(`[data-search="${key}"]`);input?.focus();input?.setSelectionRange(pos,pos)},180);return}
   if(el.matches('[data-editor]')){
    if(el.isContentEditable)R.setChapter(this.draft,this.chapter,el.innerHTML);else this.draft.chapters[this.chapter]=el.value;this.pendingTextSave=true;this.markEdited();clearTimeout(this.saveTimer)
    this.saveTimer=setTimeout(()=>{const ok=this.save();const status=this.querySelector('[data-save-status]');if(status)status.textContent=ok?'已保存至本机 · '+V.stamp(new Date().toISOString()):this.error},350);return
   }
   if(el.matches('[data-prompt]'))this.prompt=el.value
  }
  rememberSelection(){
   const editor=this.querySelector('[data-editor]'),selection=root.getSelection?.()
   if(editor && selection?.rangeCount && editor.contains(selection.anchorNode) && editor.contains(selection.focusNode))this.richRange=selection.getRangeAt(0).cloneRange()
  }
  restoreSelection(){
   const editor=this.querySelector('[data-editor]');if(!editor)return
   editor.focus();const selection=root.getSelection();selection.removeAllRanges()
   if(this.richRange && editor.contains(this.richRange.startContainer))selection.addRange(this.richRange)
   else {const range=document.createRange();range.selectNodeContents(editor);range.collapse(false);selection.addRange(range)}
  }
  saveRich(){
   const editor=this.querySelector('[data-editor][contenteditable]');if(!editor||!this.draft)return
   R.setChapter(this.draft,this.chapter,editor.innerHTML);this.markEdited();this.pendingTextSave=true
  }
  formatRich(command,value=null){
   if(!this.editing)return
   this.restoreSelection()
   if(command==='fontSize'){
    document.execCommand('fontSize',false,'7')
    this.querySelector('[data-editor]').querySelectorAll('font[size="7"]').forEach(el=>{el.removeAttribute('size');el.style.fontSize=Number(value)+'px'})
   }else document.execCommand(command,false,value)
   this.rememberSelection();this.saveRich();this.save()
  }
  pasteRich(event){
   if(!event.target.closest('[data-editor][contenteditable]'))return
   const html=event.clipboardData?.getData('text/html'),text=event.clipboardData?.getData('text/plain')
   if(html||text){event.preventDefault();this.rememberSelection();this.formatRich('insertHTML',html?R.sanitize(html):R.paragraphs(text));return}
   const file=[...(event.clipboardData?.files||[])].find(f=>/^image\//.test(f.type))
   if(file){event.preventDefault();this.rememberSelection();this.insertRichImage(file)}
  }
  async insertRichImage(file){
   if(!['image/png','image/jpeg','image/gif','image/webp'].includes(file.type)){this.show('请选择 PNG、JPEG、GIF 或 WebP 图片',true);return}
   if(file.size>2*1024*1024){this.show('图片不能超过2 MB，请压缩后插入',true);return}
   const chapter=this.chapter,draftId=this.draft.id
   try{
    const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('图片读取失败'));reader.readAsDataURL(file)})
    const size=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>reject(new Error('图片内容无法识别'));img.src=src})
    if(!this.isConnected||!this.editing||this.chapter!==chapter||this.draft.id!==draftId)return
    const width=Math.min(560,size.width),height=Math.round(width*size.height/size.width)
    this.formatRich('insertHTML',`<p><img src="${src}" alt="${M.esc(file.name)}" width="${width}" height="${height}"></p><p><br></p>`)
   }catch(err){this.show(err.message,true)}
  }
  async upload(file){
   if(this.busy)return
   this.busy=true;this.progress='正在读取文件正文';this.error='';this.render()
   try{
    const source=await F.read(file,message=>{this.progress=message;const label=this.querySelector('.tp-dropzone strong');if(label)label.textContent=message})
    if(!this.isConnected)return
    if(Object.keys(this.draft.chapters||{}).length){this.rememberCurrent();this.draft.id=M.uid('plan')}
    M.replaceSource(this.draft,source);this.draft.courseIds=D.courses.filter(c=>source.text.includes(c.name)).map(c=>c.id);this.draft.mode='upload';this.invalidate();this.log('解析本地人才培养方案',`${source.fileName}，识别${source.recognized}个章节`);this.save();this.notice='正文已读取，请核对基础信息和解析内容'
   }catch(err){this.error=err.message||'文件读取失败，请重试'}
   finally{this.busy=false;if(this.isConnected)this.render()}
  }
  async generate(){
   const d=this.draft
   for(let step=1;step<=3;step++){const err=M.validateStep(d,step);if(err){d.step=step;this.render();this.show(err,true);return}}
   this.busy=true;this.generationProgress=5;this.progress='核对章节结构与输入依据';this.render()
   const defs=M.chapterDefs(d)
   for(let i=0;i<defs.length;i++){
    await new Promise(resolve=>{this.generationTimer=setTimeout(resolve,65)})
    if(!this.isConnected)return
    this.progress=`正在组织：${defs[i].title}（${i+1}/${defs.length}）`;this.generationProgress=Math.round((i+1)/defs.length*100)
    const text=this.querySelector('.tp-generation-overlay p'),bar=this.querySelector('.tp-generation-overlay .tp-card-progress span');if(text)text.textContent=this.progress;if(bar)bar.style.width=this.generationProgress+'%'
   }
   d.baseline=M.copy(d.source?.chapters||{});M.regenerate(d)
   d.generated=true
   if(d.mode==='standard' && !d.citations.length){M.insertReference(d,d.standardId==='eng-outcomes'?'requirements':'goals',d.standardId)}
   this.log('生成方案建议稿',`按结构化规则组织${defs.length}个章节；保留已编辑章节`);this.busy=false;this.chapter='goals';this.editing=false;this.panel='refs';this.save();this.render()
  }
  suggest(){
   const d=this.draft,js=M.selectedJobs(d),cs=M.selectedCourses(d)
   const skills=js.slice(0,3).flatMap(j=>j.abilities.filter(a=>a.category==='技能').slice(0,1).map(a=>`${j.name}：围绕“${a.name}”设置可观察的学习成果，明确实践任务与评价依据。`))
   this.suggestion={title:'当前章节修订建议',text:[this.prompt?.trim()?`修订重点：${this.prompt.trim()}`:'修订重点：强化专业实践与数字技术应用。',...skills,`课程落实：结合${cs.slice(0,4).map(c=>c.name).join('、')}，补充课程目标、实践成果和考核标准。`].join('\n\n'),apply:true};this.panel='assistant';this.render()
  }
  diagnose(){
   const d=this.draft,text=d.chapters[this.chapter]||'',items=[]
   if(!text.trim())items.push('本章正文为空，请补充。')
   if(/待补充|由学校|需.*核对/.test(text))items.push('本章仍有学校事实或待补充内容，请逐项落实。')
   if(M.isEngineering(d)&&this.chapter==='goals'&&!/5年|五年/.test(text))items.push('培养目标尚未体现毕业后5年左右的预期胜任力。')
   if(M.isEngineering(d)&&this.chapter==='requirements'){const missing=M.engineeringOutcomes.filter(t=>!text.includes(t));if(missing.length)items.push('2024版要求名称未覆盖：'+missing.join('、'))}
   if(this.chapter==='courses'||this.chapter==='schedule')items.push('当前仅选择部分课程且缺少学时，不能据此判定完整学分结构符合要求。')
   this.suggestion={title:'本章规范检查',text:[...M.chapterRules(d,this.chapter),...items,items.length?'以上为规则检查结果，请结合原文与学校制度核对。':'未发现上述规则项缺漏，仍需核对内容质量与适用依据。'].join('\n\n'),apply:false};this.panel='assistant';this.render()
  }
  keydown(event){
   if(event.key==='Escape'&&this.managingChapters){event.preventDefault();this.managingChapters=false;this.render();this.querySelector('[data-tp="manage-chapters"]')?.focus();return}
   if(event.key==='Escape'&&this.querySelector('[data-rich-table-overlay]')){event.preventDefault();this.querySelector('[data-rich-table-overlay]').remove();this.restoreSelection();return}
   if(event.key==='Escape'&&(this.drawer||this.relation||this.newCourse)){this.drawer=null;this.relation=null;this.newCourse=null;this.render();this.returnFocus?.focus();return}
   const dialog=this.querySelector('[role="dialog"]');if(event.key!=='Tab'||!dialog)return
   const controls=[...dialog.querySelectorAll('button:not([disabled]),input,select,textarea,a[href]')];const first=controls[0],last=controls.at(-1)
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){event.preventDefault();last?.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  }
 }
 customElements.define('talent-plan-workbench',TalentPlanWorkbench)
})(globalThis)
