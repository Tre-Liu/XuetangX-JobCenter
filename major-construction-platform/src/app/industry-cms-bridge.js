// Generated from packages/data-access; run node scripts/build-industry-cms-bridge.mjs.
"use strict";
(() => {
  // industry-globals:industry-globals
  var industryDataset = globalThis.INDUSTRY_MAJOR_CHAIN_DATA;
  var industryMajorSelection = globalThis.IndustryMajorSelection;

  // ../packages/data-access/navigation.mjs
  function safeReturnUrl(raw, base) {
    if (typeof raw !== "string" || !raw.trim()) return null;
    try {
      const from = new URL(base), to = new URL(raw, from);
      if (to.username || to.password) return null;
      if (from.protocol === "file:") {
        return to.protocol === "file:" && /\.html$/i.test(to.pathname) ? to.href : null;
      }
      if (!["http:", "https:"].includes(to.protocol) || to.hostname !== from.hostname) return null;
      if (from.protocol === "https:" && to.protocol !== "https:") return null;
      return to.href;
    } catch {
      return null;
    }
  }

  // ../packages/data-access/industry-state.mjs
  var INDUSTRY_STATE_KEY = "major-construction-platform:industry-research";
  var HASH_KEY = "industryState";
  var MAX_HASH_LENGTH = 1e6;
  function normalizeIndustryState(value, data = industryDataset) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const majors = industryMajorSelection.restore(data.majors, value);
    const identities = majors.map((major) => ({ level: major.uiLevel, sourceLevel: major.sourceLevel, code: major.code, name: major.name }));
    const majorKeys = new Set(majors.map((major) => major.key));
    const currentChainIds = new Set(data.chains.map((chain) => chain.id));
    const associatedIds = new Set(data.relations.filter((relation) => majorKeys.has(relation.majorKey) && currentChainIds.has(relation.chainId)).map((relation) => relation.chainId));
    const selectedChainIds = [...new Set((Array.isArray(value.selectedChainIds) ? value.selectedChainIds : []).filter((id) => associatedIds.has(id)))];
    const matchingMode = value.matchingMode === "job-name" && majors.length > 0 && associatedIds.size === 0 ? "job-name" : "chain";
    const matchedJobs = matchingMode === "job-name" && value.initialized === true ? industryMajorSelection.matchJobs(majors) : [];
    const jobIds = new Set(matchedJobs.map((job) => job.id));
    const disabledJobIds = [...new Set((Array.isArray(value.disabledJobIds) ? value.disabledJobIds : []).filter((id) => jobIds.has(id)))];
    return {
      initialized: selectedChainIds.length > 0 || matchingMode === "job-name" && matchedJobs.length > 0,
      matchingMode,
      selectedChainIds,
      disabledJobIds,
      matchedJobs,
      officialMajors: identities,
      officialMajor: identities[0] || null,
      ...typeof value.selectedAt === "string" && Number.isFinite(Date.parse(value.selectedAt)) ? { selectedAt: value.selectedAt } : {}
    };
  }
  function readIndustryCmsState(hash, data = industryDataset) {
    if (typeof hash !== "string" || hash.length > MAX_HASH_LENGTH) return null;
    try {
      const encoded = new URLSearchParams(hash.replace(/^#/, "")).get(HASH_KEY);
      if (!encoded) return null;
      const payload = JSON.parse(encoded);
      if (payload?.version !== 1) return null;
      return normalizeIndustryState(payload.industryResearch, data);
    } catch {
      return null;
    }
  }
  function safeIndustryReturnUrl(value, baseUrl) {
    const safe = safeReturnUrl(value, baseUrl);
    if (!safe) return null;
    const target = new URL(safe);
    return target.protocol === "file:" && target.host ? null : safe;
  }
  function attachState(url, state, data) {
    const normalized = normalizeIndustryState(state, data);
    if (normalized) {
      const hash = new URLSearchParams(url.hash.slice(1));
      hash.set(HASH_KEY, JSON.stringify({ version: 1, industryResearch: normalized }));
      url.hash = hash.toString();
    }
    return url.href;
  }
  function createIndustryCmsUrl(target, { state, returnTo, majorName, baseUrl, data = industryDataset } = {}) {
    const url = new URL(target, baseUrl);
    url.searchParams.set("entry", "industry");
    if (majorName) url.searchParams.set("majorName", majorName);
    const safeReturn = safeIndustryReturnUrl(returnTo, baseUrl || url.href);
    if (safeReturn) url.searchParams.set("returnTo", safeReturn);
    else url.searchParams.delete("returnTo");
    return attachState(url, state, data);
  }
  function createIndustryReturnUrl(returnTo, state, baseUrl, data = industryDataset) {
    const safeReturn = safeIndustryReturnUrl(returnTo, baseUrl);
    return safeReturn ? attachState(new URL(safeReturn), state, data) : null;
  }

  // ../packages/data-access/industry-browser.mjs
  function createIndustryBrowserBridge(host) {
    let memoryState = null;
    let consumed = false;
    let memoryOnly = false;
    const replaceHash = (url) => {
      try {
        if (!host.history?.replaceState) throw new Error("History API unavailable");
        host.history.replaceState(null, "", url);
      } catch {
        host.location.hash = new URL(url).hash;
      }
    };
    const clearReturnHash = () => {
      const url = new URL(host.location.href);
      const hash = new URLSearchParams(url.hash.slice(1));
      hash.delete("industryState");
      url.hash = hash.toString();
      replaceHash(url.href);
    };
    const read = () => {
      if (memoryOnly) return memoryState;
      try {
        const saved = host.localStorage.getItem(INDUSTRY_STATE_KEY);
        memoryState = saved ? normalizeIndustryState(JSON.parse(saved)) : null;
      } catch {
        memoryOnly = true;
      }
      return memoryState;
    };
    const write = (value) => {
      const state = normalizeIndustryState(value);
      if (!state) return read();
      memoryState = state;
      try {
        host.localStorage.setItem(INDUSTRY_STATE_KEY, JSON.stringify(state));
      } catch {
        memoryOnly = true;
      }
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
      try {
        host.localStorage.removeItem(INDUSTRY_STATE_KEY);
      } catch {
      }
    };
    const cmsUrl = (majorName = "\u667A\u80FD\u5EFA\u9020\u5DE5\u7A0B\u4E13\u4E1A") => {
      const returnTo = new URL(host.location.href);
      if (returnTo.searchParams.get("view") === "industry-research-admin") {
        for (const key of ["view", "entry", "majorName"]) returnTo.searchParams.delete(key);
      }
      const hash = new URLSearchParams(returnTo.hash.slice(1));
      hash.delete("industryState");
      returnTo.hash = hash.toString();
      return createIndustryCmsUrl("./industry-research-admin.html", {
        state: read(),
        majorName,
        returnTo: returnTo.href,
        baseUrl: host.location.href
      });
    };
    const legacyRedirectUrl = () => {
      const url = new URL(host.location.href);
      return url.searchParams.get("view") === "industry-research-admin" ? cmsUrl(url.searchParams.get("majorName") || "\u667A\u80FD\u5EFA\u9020\u5DE5\u7A0B\u4E13\u4E1A") : null;
    };
    return { read, write, consume, reset, cmsUrl, legacyRedirectUrl };
  }

  // src/app/industry-cms-bridge-entry.mjs
  globalThis.IndustryCmsBridge = createIndustryBrowserBridge(globalThis);
})();
