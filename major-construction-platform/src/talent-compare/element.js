/** The Vue and standalone entries share this controller, markup and report model. */
;(function(root){
 if(typeof customElements==='undefined'||customElements.get('talent-comparison'))return
 const M=root.TalentComparisonModel,V=root.TalentComparisonViews,historyKey='major-construction.talent-comparison.v1'
 class TalentComparison extends HTMLElement {
   constructor(){super();this.state={selected:[],standardId:'',mode:'plan',query:'',level:'',uploads:[],report:null,message:'',busy:false};this.charts=[];this.history=[];this.onClick=this.onClick.bind(this);this.onInput=this.onInput.bind(this);this.onChange=this.onChange.bind(this);this.onKey=this.onKey.bind(this)}
   connectedCallback(){
     this.addEventListener('click',this.onClick);this.addEventListener('input',this.onInput);this.addEventListener('compositionend',this.onInput);this.addEventListener('change',this.onChange);this.addEventListener('keydown',this.onKey)
     try{this.history=M.readHistory(localStorage.getItem(historyKey)||'[]')}catch{this.history=[]}
     this.render()
   }
   disconnectedCallback(){this.dispose();clearTimeout(this.timer);clearTimeout(this.toastTimer);this.removeEventListener('click',this.onClick);this.removeEventListener('input',this.onInput);this.removeEventListener('compositionend',this.onInput);this.removeEventListener('change',this.onChange);this.removeEventListener('keydown',this.onKey)}
   dispose(){this.charts.forEach(c=>c.dispose());this.charts=[];this.resize?.disconnect();this.observer?.disconnect()}
   records(){return [...root.TalentPlanResearchData.plans,...this.state.uploads]}
   selected(){return [this.records().find(p=>p.id===this.state.selected[0]),this.state.mode==='standard'?M.standards.find(p=>p.id===this.state.standardId):this.records().find(p=>p.id===this.state.selected[1])]}
   render(){
     this.dispose();this.innerHTML=this.state.loading?V.loading():this.state.report?V.report(this.state):V.selection(this.state)
     if(this.state.report&&!this.state.loading)this.mountCharts()
   }
   mountCharts(){
     if(!root.echarts){this.notify('图表组件未加载，请刷新页面重试');return}
     this.querySelectorAll('[data-chart]').forEach(node=>{const chart=root.echarts.init(node,null,{renderer:'canvas'});chart.setOption(root.TalentComparisonCharts.build(node.dataset.chart,this.state.report));this.charts.push(chart)})
     this.resize=new ResizeObserver(()=>this.charts.forEach(c=>c.resize()));this.resize.observe(this)
     this.observer=new IntersectionObserver(entries=>{const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(visible)this.markAnchor(visible.target.dataset.reportSection)},{root:this,rootMargin:'-10% 0px -65% 0px',threshold:0})
     this.querySelectorAll('[data-report-section]').forEach(section=>this.observer.observe(section))
   }
   markAnchor(id){this.querySelectorAll('[data-section]').forEach(b=>{b.classList.toggle('active',b.dataset.section===id);b.setAttribute('aria-current',b.dataset.section===id?'location':'false')})}
   notify(message){this.state.message=message;this.querySelector('.tc-toast')?.remove();const node=document.createElement('div');node.className='tc-toast';node.role='status';node.textContent=message;this.querySelector('.tc')?.append(node);clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>{this.state.message='';node.remove()},4200)}
   onInput(event){if(event.isComposing)return;if(!event.target.matches('[data-tc-search]'))return;const input=event.target,pos=input.selectionStart;this.state.query=input.value;this.render();const next=this.querySelector('[data-tc-search]');next?.focus();next?.setSelectionRange(pos,pos)}
   async onChange(event){
     if(event.target.matches('[data-tc-level]')){this.state.level=event.target.value;this.render()}
     if(!event.target.matches('.tc-file-input'))return
     const file=event.target.files?.[0];if(!file)return
     this.state.busy=true;this.render();this.notify('正在读取 '+file.name)
     try{const parsed=await root.TalentPlanFiles.read(file,message=>{if(this.isConnected)this.notify(message)});if(!this.isConnected)return;const record=M.fromParsed(parsed);if(!record.profile.goals.length&&!record.profile.requirements.length)throw new Error('未识别到培养目标或毕业要求章节，请补充章节标题后重新上传');this.state.uploads.push(record);this.state.query='';this.state.level='';this.state.selected=this.state.mode==='standard'?[record.id]:M.toggleSelection(this.state.selected,record.id);this.state.busy=false;this.render();this.notify('已读取方案正文，可选择后进行比对')}catch(error){if(!this.isConnected)return;this.state.busy=false;this.render();this.notify(error.message||'读取失败，请检查文件内容')}
   }
   onKey(event){
     const dialog=this.querySelector('[role="dialog"]');if(!dialog)return
     if(event.key==='Escape'){event.preventDefault();this.closeDialog()}
     if(event.key==='Tab'){const controls=[...dialog.querySelectorAll('button,a[href],input,select')].filter(e=>!e.disabled),first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
   }
   openDialog(html){this.dialogTrigger=document.activeElement;this.querySelector('.tc')?.insertAdjacentHTML('beforeend',html);this.querySelector('[role="dialog"] button')?.focus()}
   closeDialog(){this.querySelector('.tc-dialog-backdrop')?.remove();this.dialogTrigger?.focus()}
   async onClick(event){
     if(event.target.classList?.contains('tc-dialog-backdrop')){this.closeDialog();return}
     const button=event.target.closest('[data-tc]');if(!button||button.disabled)return
     const action=button.dataset.tc,s=this.state
     if(action==='select'){s.selected=s.mode==='standard'?(s.selected[0]===button.dataset.id?[]:[button.dataset.id]):M.toggleSelection(s.selected,button.dataset.id);this.render();this.querySelector(`[data-id="${CSS.escape(button.dataset.id)}"]`)?.focus()}
     if(action==='standard'){s.standardId=s.standardId===button.dataset.id?'':button.dataset.id;this.render();this.querySelector(`[data-id="${CSS.escape(button.dataset.id)}"]`)?.focus()}
     if(action==='mode-plan'||action==='mode-standard'){s.mode=action==='mode-plan'?'plan':'standard';if(s.mode==='standard')s.selected=s.selected.slice(0,1);this.render()}
     if(action==='clear'){s.selected=[];s.standardId='';this.render()}
     if(action==='clear-filters'){s.query='';s.level='';this.render()}
     if(action==='upload')this.querySelector('.tc-file-input')?.click()
     if(action==='start'){
       const [source,target]=this.selected(),error=M.validate(source,target);if(error){this.notify(error);return}
       s.loading=true;this.render();this.scrollTopView()
       this.timer=setTimeout(()=>{if(!this.isConnected)return;s.loading=false;s.report=M.buildReport(source,target);this.history=[s.report,...this.history].slice(0,10);this.saveHistory();this.render();this.scrollTopView()},650)
     }
     if(action==='reselect'){s.report=null;s.message='';this.render();this.scrollTopView()}
     if(action==='anchor'){this.markAnchor(button.dataset.section);const section=this.querySelector('#tc-'+button.dataset.section);section?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}
     if(action==='history')this.openDialog(V.history(this.history))
     if(action==='close-dialog')this.closeDialog()
     if(action==='details')this.openDialog(V.details(s.report,button.dataset.role))
     if(action==='restore'){
       const record=this.history.find(r=>r.id===button.dataset.id);if(!record)return
       for(const p of [record.source,record.target])if(p.kind==='upload'&&!this.records().some(x=>x.id===p.id))s.uploads.push(M.copy(p))
       s.mode=record.standard?'standard':'plan';s.selected=record.standard?[record.source.id]:[record.source.id,record.target.id];s.standardId=record.standard?record.target.id:'';s.query='';s.level=''
       s.report=M.copy(record);s.message='';this.render();this.scrollTopView()
     }
     if(action==='export'){
       const blob=new Blob([M.exportHtml(s.report)],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`培养方案对比分析报告_${s.report.source.year}_${s.report.target.year}.html`;this.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);this.notify('分析报告已导出，可用浏览器打开并打印为PDF')
     }
   }
   saveHistory(){try{localStorage.setItem(historyKey,JSON.stringify(this.history))}catch{this.notify('本机存储空间不足，本次报告仍可查看与导出')}}
   scrollTopView(){this.scrollTo({top:0})}
 }
 customElements.define('talent-comparison',TalentComparison)
})(globalThis)
