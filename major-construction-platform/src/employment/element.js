/** Shared browser controller for Vue and file:// entries. */
;(function(root){
 if(typeof customElements==='undefined'||customElements.get('employment-analysis'))return
 const D=root.EmploymentData,M=root.EmploymentModel,V=root.EmploymentViews
 class EmploymentAnalysis extends HTMLElement{
  static get observedAttributes(){return ['employment-page']}
  connectedCallback(){
   if(this.started)return;this.started=true
   const q=new URLSearchParams(location.search)
   this.state=M.filters({page:this.getAttribute('employment-page')||q.get('employmentPage'),year:q.get('employmentYear'),city:q.get('employmentCity')});this.drawer=false;this.notice=''
   this.clickListener=e=>this.click(e);this.changeListener=e=>this.change(e);this.keyListener=e=>this.key(e)
   this.addEventListener('click',this.clickListener);this.addEventListener('change',this.changeListener);this.addEventListener('keydown',this.keyListener)
   this.popListener=()=>{const p=new URLSearchParams(location.search);if(p.get('view')!=='employment-analysis')return;this.state=M.filters({page:p.get('employmentPage'),year:p.get('employmentYear'),city:p.get('employmentCity')});this.render();this.syncUrl();this.notify()}
   root.addEventListener('popstate',this.popListener)
   this.render();this.syncUrl();this.notify()
  }
  disconnectedCallback(){clearTimeout(this.toastTimer);this.removeEventListener('click',this.clickListener);this.removeEventListener('change',this.changeListener);this.removeEventListener('keydown',this.keyListener);root.removeEventListener('popstate',this.popListener);this.started=false}
  attributeChangedCallback(name,old,value){if(this.started&&old!==value)this.navigate(value)}
  notify(){this.dispatchEvent(new CustomEvent('employment-page-change',{bubbles:true,detail:{page:this.state.page}}))}
  syncUrl(){try{const url=new URL(location.href);url.searchParams.set('view','employment-analysis');url.searchParams.delete('employmentRegion');for(const [k,v]of Object.entries({employmentPage:this.state.page,employmentYear:this.state.year,employmentCity:this.state.city})){if(v)url.searchParams.set(k,v);else url.searchParams.delete(k)}history.replaceState(null,'',url);document.title='就业分析 · '+D.profile.major}catch{}}
  navigate(page){this.state=M.filters({...this.state,page});this.drawer=false;this.notice='';this.render();this.syncUrl();this.notify()}
  update(patch){this.state=M.filters({...this.state,...patch,region:'all'});this.notice='';this.render();this.syncUrl()}
  render(){this.innerHTML=V.render(this)}
  change(e){const key=e.target.dataset.eaFilter;if(!key)return;const next=e.target.value;this.update({[key]:next,city:''});this.querySelector(`[data-ea-filter="${key}"]`)?.focus({preventScroll:true})}
  showMethod(){this.returnFocus=this.querySelector('[data-ea="method"]');this.drawer=true;this.render();this.querySelector('[role="dialog"]')?.focus()}
  closeMethod(){this.drawer=false;this.render();this.querySelector('[data-ea="method"]')?.focus({preventScroll:true})}
  showNotice(message){this.notice=message;const el=this.querySelector('.ea-toast');if(el){el.textContent=message;el.hidden=false}clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>{this.notice='';if(el)el.hidden=true},4500)}
  download(text,type,ext){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`就业分析-${this.state.year==='all'?'全部届别':this.state.year+'届'}-${D.pages.find(p=>p[0]===this.state.page)[1]}-${{all:'全部地域',inner:'内蒙古',outside:'区外'}[this.state.region]}.${ext}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
  click(e){
   if(e.target.matches('[data-ea-overlay]')){this.closeMethod();return}
   const b=e.target.closest('[data-ea]');if(!b||!this.contains(b))return
   const action=b.dataset.ea
   if(action==='method')this.showMethod()
   else if(action==='close')this.closeMethod()
   else if(action==='navigate')this.navigate(b.dataset.page)
   else if(action==='city'){this.update({city:b.dataset.city===this.state.city?'':b.dataset.city});this.querySelector(`[data-city="${CSS.escape(b.dataset.city)}"]`)?.focus({preventScroll:true})}
   else if(action==='clear-city')this.update({city:''})
   else if(action==='export'){this.download(M.csv(this.state),'text/csv;charset=utf-8','csv');this.showNotice('当前分析数据已导出，已包含筛选范围、样本量和待核验状态。')}
   else if(action==='archive'){this.download(JSON.stringify(M.archive(this.state),null,2),'application/json;charset=utf-8','json');this.showNotice('数据档案已导出，包含匿名记录、指标定义与来源边界。')}
  }
  key(e){
   if(this.drawer){
    if(e.key==='Escape'){e.preventDefault();this.closeMethod();return}
    if(e.key==='Tab'){const items=[...this.querySelectorAll('[role="dialog"] button,[role="dialog"] a[href]')],first=items[0],last=items.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement?.getAttribute('role')==='dialog')){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}
   }
   const g=e.target.closest('g[data-ea="city"]');if(g&&['Enter',' '].includes(e.key)){e.preventDefault();this.update({city:g.dataset.city===this.state.city?'':g.dataset.city});this.querySelector(`g[data-city="${CSS.escape(g.dataset.city)}"]`)?.focus()}
  }
 }
 customElements.define('employment-analysis',EmploymentAnalysis)
})(globalThis)
