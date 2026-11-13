import {safeReturnUrl} from '../data-access/navigation.mjs';
import {matchMajorJobs} from '../industry-core/course-job-matching.mjs';
import {findMajor} from '../industry-core/catalog.mjs';
import {chains, matchChains} from '../industry-core/catalog.mjs';
export const COURSE_ID='local-smart-manufacturing';
export const CONFIG_KEY='ai-course-cms-v1:'+COURSE_ID;
export {chains, matchChains};
export const COURSE_TIERS=['卓越课','精品课','精品培育课','培育课'];
export function normalizeConfig(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const tier=COURSE_TIERS.includes(raw.tier)?raw.tier:'精品课';
 const major=findMajor(raw.major?.code)||null;
 const chainIds=major&&Array.isArray(raw.chainIds)?[...new Set(raw.chainIds.filter(id=>chains.some(c=>c.id===id)))]:[];
 const matchingMode=major&&!chainIds.length&&!matchChains(major.code).length&&raw.matchingMode==='job-name'?'job-name':'chain';
 const matchedJobs=matchingMode==='job-name'?matchMajorJobs(major):[];
 const disabledJobIds=Array.isArray(raw.disabledJobIds)?[...new Set(raw.disabledJobIds.filter(id=>matchedJobs.some(job=>job.id===id)))]:[];
 return {version:1,courseId:COURSE_ID,tier,matchingMode,matchedJobs,disabledJobIds,major:major?{code:major.code,name:major.name}:null,chainIds,industryEnabled:tier!=='培育课'&&!!major&&(chainIds.length>0||matchedJobs.some(job=>!disabledJobIds.includes(job.id)))};
}
export function changeMajor(config,major){return normalizeConfig({...config,major,chainIds:[],matchingMode:'chain',disabledJobIds:[],industryEnabled:false});}
export const defaultConfig=normalizeConfig({});
export function readConfig(){try{const raw=localStorage.getItem(CONFIG_KEY);return raw?normalizeConfig(JSON.parse(raw)):defaultConfig;}catch{return defaultConfig;}}
export function saveConfig(value){const config=normalizeConfig(value);localStorage.setItem(CONFIG_KEY,JSON.stringify(config));window.dispatchEvent(new Event('course-config'));return config;}
export function configHash(value){return '#course-cms='+encodeURIComponent(JSON.stringify(normalizeConfig(value)));}
export function fromHash(hash){try{return hash.startsWith('#course-cms=')?normalizeConfig(JSON.parse(decodeURIComponent(hash.slice(12)))):null;}catch{return null;}}
export function initialConfig(){
 const url=new URL(location.href);
 let queryConfig=null;
 try {
  const raw=url.searchParams.get('courseConfig');
  if(raw && raw.length<100000){const parsed=JSON.parse(raw);if(parsed && typeof parsed==='object' && !Array.isArray(parsed))queryConfig=normalizeConfig(parsed);}
 } catch {}
 const incoming=queryConfig || fromHash(url.hash);
 if(incoming){
  try {
   saveConfig(incoming);
   if(queryConfig)url.searchParams.delete('courseConfig');
   else url.hash='';
   history.replaceState(null,'',url.pathname+url.search+url.hash);
  } catch { /* Keep the handoff URL available when browser storage is unavailable. */ }
  return incoming;
 }
 return readConfig();
}
export function cmsHref(config, endpoint = import.meta.env?.VITE_PLATFORM_CMS_URL) {
 const target = safeReturnUrl(endpoint, location.href) || new URL('cms/index.html', location.href).href;
 const url = new URL(target);
 url.searchParams.set('returnTo', location.href);
 url.hash = configHash(config);
 return url.href;
}
export function courseHref(config, endpoint = import.meta.env?.VITE_COURSE_URL) {
 const current = new URL(location.href);
 const incoming = safeReturnUrl(current.searchParams.get('returnTo'), current.href);
 const fallback = /\/offline\/course\.html$/.test(current.pathname) ? '../../ai-course/index.html' : /\/course\.html$/.test(current.pathname) ? '../ai-course/index.html' : '../index.html';
 const configured = safeReturnUrl(endpoint, current.href);
 const url = new URL(incoming || configured || fallback, current);
 // Hash routes identify course modules and teaching-class versions.
 if(url.hash && !url.hash.startsWith('#course-cms='))url.searchParams.set('courseConfig',JSON.stringify(normalizeConfig(config)));
 else url.hash = configHash(config);
 return url.href;
}
