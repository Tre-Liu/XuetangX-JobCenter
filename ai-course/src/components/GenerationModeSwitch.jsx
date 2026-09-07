export function GenerationModeSwitch({enabled,onChange}){
 return <div className="generation-mode-switch"><span>岗位任务模式</span><button type="button" className={`switch ${enabled?'on':''}`} role="switch" aria-label="岗位任务模式" aria-checked={enabled} onClick={()=>onChange(!enabled)}><span/></button></div>;
}
