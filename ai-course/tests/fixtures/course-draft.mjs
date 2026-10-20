import {seedProject} from '../../src/project.mjs';
import {DEMO_REVISION,PROJECTS_KEY} from '../../src/manufacturing-projects.mjs';
// Existing interaction tests use their own small draft, after the one-time course migration.
export function seedInteractionDraft(window){
 try{window.localStorage.getItem(PROJECTS_KEY);}catch{
  const values=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))}});
 }
 window.localStorage.setItem(DEMO_REVISION,'done');
 window.localStorage.setItem(PROJECTS_KEY,JSON.stringify([seedProject()]));
}
