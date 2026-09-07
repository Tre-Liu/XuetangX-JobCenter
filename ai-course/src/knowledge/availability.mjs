import { useSyncExternalStore } from 'react';
const STORAGE = 'ai-course-knowledge-enabled-v1';
const EVENT = 'ai-course-knowledge-availability';
let sessionValue;
export function readKnowledgeEnabled() {
 if (sessionValue !== undefined) return sessionValue;
 try { return localStorage.getItem(STORAGE) !== 'false'; } catch { return true; }
}
export function setKnowledgeEnabled(enabled) {
 sessionValue = Boolean(enabled);
 let persisted = true;
 try { localStorage.setItem(STORAGE, String(sessionValue)); } catch { persisted = false; }
 window.dispatchEvent(new Event(EVENT));
 return persisted;
}
function subscribe(listener) {
 const storageChanged = e => { if (e.key === STORAGE || e.key === null) {sessionValue = undefined; listener();} };
 window.addEventListener(EVENT, listener);
 window.addEventListener('storage', storageChanged);
 return () => {window.removeEventListener(EVENT, listener); window.removeEventListener('storage', storageChanged);};
}
export function useKnowledgeEnabled() {
 return useSyncExternalStore(subscribe, readKnowledgeEnabled, () => true);
}
