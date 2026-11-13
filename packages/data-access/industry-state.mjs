import { industryDataset, industryMajorSelection } from '../industry-core/index.mjs';
import { safeReturnUrl } from './navigation.mjs';

export const INDUSTRY_STATE_KEY = 'major-construction-platform:industry-research';
const HASH_KEY = 'industryState';
const MAX_HASH_LENGTH = 1000000;

/** Only catalog-backed identities and associations cross the application boundary. */
export function normalizeIndustryState(value, data = industryDataset) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const majors = industryMajorSelection.restore(data.majors, value);
  const identities = majors.map(major => ({ level: major.uiLevel, sourceLevel: major.sourceLevel, code: major.code, name: major.name }));
  const majorKeys = new Set(majors.map(major => major.key));
  const currentChainIds = new Set(data.chains.map(chain => chain.id));
  const associatedIds = new Set(data.relations.filter(relation => majorKeys.has(relation.majorKey) && currentChainIds.has(relation.chainId)).map(relation => relation.chainId));
  const selectedChainIds = [...new Set((Array.isArray(value.selectedChainIds) ? value.selectedChainIds : []).filter(id => associatedIds.has(id)))];
  const matchingMode = value.matchingMode === 'job-name' && majors.length > 0 && associatedIds.size === 0 ? 'job-name' : 'chain';
  const matchedJobs = matchingMode === 'job-name' && value.initialized === true ? industryMajorSelection.matchJobs(majors) : [];
  const jobIds = new Set(matchedJobs.map(job => job.id));
  const disabledJobIds = [...new Set((Array.isArray(value.disabledJobIds) ? value.disabledJobIds : []).filter(id => jobIds.has(id)))];
  return {
    initialized: selectedChainIds.length > 0 || (matchingMode === 'job-name' && matchedJobs.length > 0),
    matchingMode, selectedChainIds, disabledJobIds, matchedJobs,
    officialMajors: identities, officialMajor: identities[0] || null,
    ...(typeof value.selectedAt === 'string' && Number.isFinite(Date.parse(value.selectedAt)) ? { selectedAt: value.selectedAt } : {}),
  };
}

export function readIndustryCmsState(hash, data = industryDataset) {
  if (typeof hash !== 'string' || hash.length > MAX_HASH_LENGTH) return null;
  try {
    const encoded = new URLSearchParams(hash.replace(/^#/, '')).get(HASH_KEY);
    if (!encoded) return null;
    const payload = JSON.parse(encoded);
    if (payload?.version !== 1) return null;
    return normalizeIndustryState(payload.industryResearch, data);
  } catch { return null; }
}

export function safeIndustryReturnUrl(value, baseUrl) {
  const safe = safeReturnUrl(value, baseUrl);
  if (!safe) return null;
  const target = new URL(safe);
  return target.protocol === 'file:' && target.host ? null : safe;
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

export function createIndustryCmsUrl(target, { state, returnTo, majorName, baseUrl, data = industryDataset } = {}) {
  const url = new URL(target, baseUrl);
  url.searchParams.set('entry', 'industry');
  if (majorName) url.searchParams.set('majorName', majorName);
  const safeReturn = safeIndustryReturnUrl(returnTo, baseUrl || url.href);
  if (safeReturn) url.searchParams.set('returnTo', safeReturn);
  else url.searchParams.delete('returnTo');
  return attachState(url, state, data);
}

export function createIndustryReturnUrl(returnTo, state, baseUrl, data = industryDataset) {
  const safeReturn = safeIndustryReturnUrl(returnTo, baseUrl);
  return safeReturn ? attachState(new URL(safeReturn), state, data) : null;
}
