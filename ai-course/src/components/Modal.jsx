import { useEffect, useRef } from 'react';
import { Icon } from './Icon';
export function Modal({title,onClose,children,footer,wide=false}){
 const ref=useRef(null);
 useEffect(()=>{const old=document.activeElement;const el=ref.current;const focusables=()=>[...el.querySelectorAll('button,input,textarea,select,[tabindex="0"]')];focusables()[0]?.focus();
 const key=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const f=focusables();if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0]?.focus();}}};el.addEventListener('keydown',key);return()=>{el.removeEventListener('keydown',key);old?.focus();};},[]);
 return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className={`modal ${wide?'wide':''}`} ref={ref} role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="icon-button" aria-label="关闭弹窗" onClick={onClose}><Icon name="close"/></button></header><div className="modal-body">{children}</div>{footer&&<footer>{footer}</footer>}</section></div>;
}
