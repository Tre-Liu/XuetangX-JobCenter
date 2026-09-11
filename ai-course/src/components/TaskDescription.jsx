import { useId, useLayoutEffect, useRef, useState } from 'react';
import { taskDescription } from '../task-description.mjs';
import './TaskDescription.css';

export function TaskDescription({task, design, stage, onChange}) {
 return <TextDescription text={taskDescription(task, design, stage)} onChange={onChange} collapsible/>;
}

export function TextDescription({text, onChange, label='任务说明', collapsible=false, placeholder='点击填写任务说明：说明任务情境、学习目标、实施步骤、成果与评价，以及所需的学习支持。'}) {
 const [expanded,setExpanded]=useState(!collapsible);
 const editor = useRef(null);
 const labelId = useId();
 useLayoutEffect(() => {
  const element = editor.current;
  if (!element) return;
  const resize = () => {
   element.style.height = 'auto';
   element.style.height = `${element.scrollHeight + 2}px`;
  };
  resize();
  if (typeof ResizeObserver === 'undefined') return;
  let width = element.getBoundingClientRect().width;
  const observer = new ResizeObserver(() => {
   const next = element.getBoundingClientRect().width;
   if (next !== width) { width = next; resize(); }
  });
  observer.observe(element);
  return () => observer.disconnect();
 }, [text,expanded]);
 if (!onChange && !text) return null;
 return <section className={`task-description${onChange ? ' is-editable' : ''}`} aria-labelledby={labelId}>
  <div className="task-description-heading"><label id={labelId} htmlFor={onChange ? `${labelId}-editor` : undefined}>{label}</label>{onChange && expanded && <span>点击文字即可编辑 · 自动保存</span>}{collapsible&&<button type="button" className="task-description-toggle" aria-expanded={expanded} aria-controls={`${labelId}-body`} onClick={()=>setExpanded(value=>!value)}>{expanded?'收起':'展开'}</button>}</div>
  <div id={`${labelId}-body`}>{!expanded?<div className="task-description-text task-description-summary">{text?.replace(/\s*\n\s*/g,' ')||placeholder}</div>:onChange ? <textarea id={`${labelId}-editor`} ref={editor} aria-label={label} className="task-description-editor" rows={3} placeholder={placeholder} value={text} onChange={event=>onChange(event.target.value)}/> : <div className="task-description-text">{text}</div>}</div>
 </section>;
}
