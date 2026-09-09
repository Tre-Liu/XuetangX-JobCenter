import {Fragment, useEffect, useState} from 'react';
import {Icon} from '../components/Icon';
export function ConversationHistory({prompts,answers,step,onEdit,disabled=false}){
 return <div className="conversation-history" aria-label="生成对话记录">{answers.slice(0,step).map((answer,index)=><Fragment key={index}><div className="conversation-message assistant"><span className="conversation-avatar"><Icon name="sparkle" size={18}/></span><div><small>课程设计助手</small><p>{prompts[index]}</p></div></div><div className="conversation-message user"><div><small>我的选择</small><p>{answer}</p><button disabled={disabled} onClick={()=>onEdit(index)}>修改这一步</button></div><span className="conversation-avatar">我</span></div></Fragment>)}</div>;
}
// This prompt uses a deliberately small Markdown subset: paragraphs, ordered lists and bold.
function inline(text){return text.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('**')&&part.endsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part);}
function Markdown({text}){return text.split('\n\n').map((block,i)=>/^\d+\. /.test(block)?<ol key={i}>{block.split('\n').filter(Boolean).map((line,j)=><li key={j}>{inline(line.replace(/^\d+\. /,''))}</li>)}</ol>:<p key={i}>{inline(block)}</p>);}
export function ConversationPrompt({children,onComplete}){
 const [length,setLength]=useState(0);
 useEffect(()=>{
  let count=0;setLength(0);
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const timer=setInterval(()=>{count=Math.min(children.length,count+(reduced?children.length:2));setLength(count);if(count===children.length){clearInterval(timer);onComplete?.();}},40);
  return ()=>clearInterval(timer);
 },[children,onComplete]);
 return <div className="conversation-message assistant current-prompt"><span className="conversation-avatar"><Icon name="sparkle" size={18}/></span><div><small>课程设计助手</small><div className="conversation-markdown" aria-busy={length<children.length}><Markdown text={children.slice(0,length)}/></div></div></div>;
}
