import { INDUSTRY_STATE_KEY, normalizeIndustryState, readIndustryCmsState, createIndustryCmsUrl, createIndustryReturnUrl } from './industry-state.mjs';

/** Browser storage is optional: a file return can always render its validated state. */
export function createIndustryBrowserBridge(host) {
  let memoryState = null;
  let consumed = false;
  let memoryOnly = false;
  const replaceHash = url => {
    try {
      if (!host.history?.replaceState) throw new Error('History API unavailable');
      host.history.replaceState(null, '', url);
    } catch {
      // File origins can reject History API writes but still permit fragment navigation.
      host.location.hash = new URL(url).hash;
    }
  };
  const clearReturnHash = () => {
    const url = new URL(host.location.href);
    const hash = new URLSearchParams(url.hash.slice(1));
    hash.delete('industryState');
    url.hash = hash.toString();
    replaceHash(url.href);
  };
  const read = () => {
    if (memoryOnly) return memoryState;
    try {
      const saved = host.localStorage.getItem(INDUSTRY_STATE_KEY);
      memoryState = saved ? normalizeIndustryState(JSON.parse(saved)) : null;
    } catch { memoryOnly = true; /* Retain the last valid in-memory configuration. */ }
    return memoryState;
  };
  const write = value => {
    const state = normalizeIndustryState(value);
    if (!state) return read();
    memoryState = state;
    try { host.localStorage.setItem(INDUSTRY_STATE_KEY, JSON.stringify(state)); } catch { memoryOnly = true; /* Optional storage. */ }
    if (memoryOnly) {
      const url = createIndustryReturnUrl(host.location.href, state, host.location.href);
      if (url) replaceHash(url);
    }
    return state;
  };
  const consume = () => {
    if (consumed) return read();
    consumed = true;
    const incoming = readIndustryCmsState(host.location.hash);
    if (!incoming) return read();
    const state = write(incoming);
    if (!memoryOnly) clearReturnHash();
    return state;
  };
  const reset = () => {
    memoryState = null;
    clearReturnHash();
    try { host.localStorage.removeItem(INDUSTRY_STATE_KEY); } catch { /* Optional storage. */ }
  };
  const cmsUrl = (majorName = '智能建造工程专业') => {
    const returnTo = new URL(host.location.href);
    if (returnTo.searchParams.get('view') === 'industry-research-admin') {
      for (const key of ['view', 'entry', 'majorName']) returnTo.searchParams.delete(key);
    }
    const hash = new URLSearchParams(returnTo.hash.slice(1));
    hash.delete('industryState');
    returnTo.hash = hash.toString();
    return createIndustryCmsUrl('./industry-research-admin.html', {
      state: read(), majorName, returnTo: returnTo.href, baseUrl: host.location.href,
    });
  };
  const legacyRedirectUrl = () => {
    const url = new URL(host.location.href);
    return url.searchParams.get('view') === 'industry-research-admin'
      ? cmsUrl(url.searchParams.get('majorName') || '智能建造工程专业') : null;
  };
  return { read, write, consume, reset, cmsUrl, legacyRedirectUrl };
}
