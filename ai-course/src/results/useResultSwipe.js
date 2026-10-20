import {useEffect,useRef,useState} from 'react';

// Only consume a vertical gesture at the page boundary. Charts and nested
// scroll regions retain their own controls; wheel momentum cannot bounce back.
export function useResultSwipe({page,onNavigate,blocked}){
 const ref=useRef(null),lastDetail=useRef('overview'),lockUntil=useRef(0);
 const [motion,setMotion]=useState('');
 useEffect(()=>{
  if(page!=='home')lastDetail.current=page;
  if(ref.current)ref.current.scrollTop=0;
 },[page]);
 useEffect(()=>{
  const root=ref.current;if(!root)return;
  let accumulated=0,lastWheel=0,start=null;
  const ignored=target=>blocked||target.closest?.('.modal-backdrop,.result-chart,input,textarea,select,[contenteditable="true"]');
  const nestedCanScroll=(target,delta)=>{
   for(let el=target;el&&el!==root;el=el.parentElement){
    const style=getComputedStyle(el);
    if(/auto|scroll/.test(style.overflowY)&&el.scrollHeight>el.clientHeight+2&&
     (delta>0?el.scrollTop+el.clientHeight<el.scrollHeight-2:el.scrollTop>2))return true;
   }
   return false;
  };
  const boundary=delta=>page==='home'?delta>0&&root.scrollTop+root.clientHeight>=root.scrollHeight-3:delta<0&&root.scrollTop<=2;
  const change=delta=>{
   lockUntil.current=Date.now()+700;accumulated=0;
   setMotion(delta>0?'result-slide-up':'result-slide-down');
   onNavigate(page==='home'?lastDetail.current:'home');
  };
  const wheel=e=>{
   if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||ignored(e.target)||nestedCanScroll(e.target,e.deltaY))return;
   if(Date.now()<lockUntil.current){e.preventDefault();return;}
   if(!boundary(e.deltaY)){accumulated=0;return;}
   const now=Date.now();if(now-lastWheel>180||Math.sign(accumulated)!==Math.sign(e.deltaY))accumulated=0;lastWheel=now;
   accumulated+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?root.clientHeight:1);
   e.preventDefault();if(Math.abs(accumulated)>=65)change(e.deltaY);
  };
  const touchstart=e=>{
   if(e.touches.length!==1||ignored(e.target)){start=null;return;}
   const t=e.touches[0];start={x:t.clientX,y:t.clientY,top:root.scrollTop,target:e.target};
  };
  const touchend=e=>{
   if(!start||!e.changedTouches.length)return;
   const t=e.changedTouches[0],delta=start.y-t.clientY;
   const atStart=page==='home'?start.top+root.clientHeight>=root.scrollHeight-3:start.top<=2;
   if(Date.now()>=lockUntil.current&&atStart&&boundary(delta)&&Math.abs(delta)>=70&&Math.abs(delta)>Math.abs(start.x-t.clientX)*1.3&&!nestedCanScroll(start.target,delta)){
    e.preventDefault();change(delta);
   }
   start=null;
  };
  root.addEventListener('wheel',wheel,{passive:false});
  root.addEventListener('touchstart',touchstart,{passive:true});
  root.addEventListener('touchend',touchend,{passive:false});
  return()=>{root.removeEventListener('wheel',wheel);root.removeEventListener('touchstart',touchstart);root.removeEventListener('touchend',touchend);};
 },[page,onNavigate,blocked]);
 return {ref,motion};
}
