import {findMajor} from '../generation/major-context.mjs';
import catalog from './chain-catalog.json' with {type:'json'};
export const COURSE_ID='local-smart-manufacturing';
export const CONFIG_KEY='ai-course-cms-v1:'+COURSE_ID;
export const chains=catalog.chains;
export const COURSE_TIERS=['卓越课','精品课','精品培育课','培育课'];
export function matchChains(code){
 return chains.flatMap(chain=>{
  const evidence=catalog.relations.filter(r=>r.majorKey.split(':').at(-1)===code&&r.chainId===chain.id);
  return evidence.length?[{...chain,evidence}]:[];
 }).sort((a,b)=>Math.min(...a.evidence.map(e=>e.order))-Math.min(...b.evidence.map(e=>e.order)));
}
export function normalizeConfig(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const tier=COURSE_TIERS.includes(raw.tier)?raw.tier:'精品课';
 const major=findMajor(raw.major?.code)||null;
 const chainIds=major&&Array.isArray(raw.chainIds)?[...new Set(raw.chainIds.filter(id=>chains.some(c=>c.id===id)))]:[];
 return {version:1,courseId:COURSE_ID,tier,major:major?{code:major.code,name:major.name}:null,chainIds,industryEnabled:tier!=='培育课'&&!!major&&chainIds.length>0};
}
export function changeMajor(config,major){return normalizeConfig({...config,major,chainIds:[],industryEnabled:false});}
export const defaultConfig=normalizeConfig({});
export function readConfig(){try{const raw=localStorage.getItem(CONFIG_KEY);return raw?normalizeConfig(JSON.parse(raw)):defaultConfig;}catch{return defaultConfig;}}
export function saveConfig(value){const config=normalizeConfig(value);localStorage.setItem(CONFIG_KEY,JSON.stringify(config));window.dispatchEvent(new Event('course-config'));return config;}
export function configHash(value){return '#course-cms='+encodeURIComponent(JSON.stringify(normalizeConfig(value)));}
export function fromHash(hash){try{return hash.startsWith('#course-cms=')?normalizeConfig(JSON.parse(decodeURIComponent(hash.slice(12)))):null;}catch{return null;}}
export function initialConfig(){
 const incoming=fromHash(location.hash);
 if(incoming){try{saveConfig(incoming);history.replaceState(null,'',location.pathname+location.search);}catch{}return incoming;}
 return readConfig();
}
export function cmsHref(config){return new URL('cms/index.html',location.href).href.split('#')[0]+configHash(config);}
export function courseHref(config){return new URL('../index.html',location.href).href.split('#')[0]+configHash(config);}
