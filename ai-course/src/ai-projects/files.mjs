const DB='ai-course-project-attachments-v1';
function open(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore('files');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function commitFiles(resources){
 const pending=resources.filter(r=>r.pendingFile);if(!pending.length)return resources.map(r=>({...r}));
 const db=await open();try{await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');for(const r of pending)tx.objectStore('files').put(r.pendingFile,r.id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('附件保存中断'));});return resources.map(({pendingFile,...r})=>pendingFile?{...r,storageKey:r.id}:r);}finally{db.close();}
}
export async function readAttachment(key){const db=await open();try{return await new Promise((resolve,reject)=>{const req=db.transaction('files').objectStore('files').get(key);req.onsuccess=()=>req.result?resolve(req.result):reject(Error('附件不存在，请重新上传'));req.onerror=()=>reject(req.error);});}finally{db.close();}}
export function attachmentKeysToRemove(before,after){
 const keys=projects=>projects.flatMap(p=>(p.info?.resources||[]).map(r=>r.storageKey).filter(Boolean));
 const retained=new Set(keys(after));return [...new Set(keys(before))].filter(key=>!retained.has(key));
}
export async function deleteAttachmentFiles(keys){
 if(!keys.length)return;const db=await open();try{await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');for(const key of keys)tx.objectStore('files').delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('附件清理中断'));});}finally{db.close();}
}
