export type AiIndustryStageKey = 'upstream' | 'midstream' | 'downstream'

export interface AiIndustryChainMeta {
  chainName: '人工智能产业链'
  stageCount: number
  nodeCount: number
  sourceCount: number
  sourceReportedCount: number
  sourceMembershipCount: number
  companyCount: number
}

export interface AiIndustryChainStage {
  id: string
  key: AiIndustryStageKey
  label: string
  name: string
  description: string
  companyCount: number
  nodeCount: number
}

export interface AiIndustryChainNode {
  id: string
  name: string
  source: string
  stage: AiIndustryStageKey
  standardNodeId: string
  companyCount: number
}

export interface AiIndustryChainCompany {
  id: string
  name: string
  creditCode: string
  province: string
  city: string
  district: string
  address: string
  scale: string
  status: string
  finance: string
  sources: string[]
  stages: AiIndustryStageKey[]
  nodeIds: string[]
  nodeNames: string[]
  classificationPaths: string[]
  mappingStatus: 'mapped' | 'pending'
}

export interface AiIndustryProvince {
  name: string
  count: number
}

export interface AiIndustrySankeyNode {
  id: string
  name: string
  stage: AiIndustryStageKey
  value: number
}

export interface AiIndustrySankeyLink {
  source: string
  target: string
  value: number
}

export interface AiIndustryChainData {
  version: 1
  meta: AiIndustryChainMeta
  stages: AiIndustryChainStage[]
  nodes: AiIndustryChainNode[]
  sankey: {
    nodes: AiIndustrySankeyNode[]
    links: AiIndustrySankeyLink[]
  }
  companies: AiIndustryChainCompany[]
  provinces: AiIndustryProvince[]
  quality: {
    pendingCompanyCount: number
    missingProvinceCount: number
    hierarchyOnlyCount: number
    informationOnlyCount: number
  }
}

declare global {
  interface Window {
    __AI_INDUSTRY_CHAIN_DATA__?: AiIndustryChainData
  }
}

let loadingPromise: Promise<AiIndustryChainData> | null = null

const candidateUrls = () => window.location.protocol === 'file:'
  ? ['./public/data/ai-industry-chain-data.js', './data/ai-industry-chain-data.js']
  : ['/data/ai-industry-chain-data.js']

const removeLoaderScripts = () => {
  document.querySelectorAll<HTMLScriptElement>('script[data-ai-industry-chain-source]')
    .forEach((script) => script.remove())
}

const loadScript = (url: string) => new Promise<void>((resolve, reject) => {
  const script = document.createElement('script')
  script.src = url
  script.async = true
  script.dataset.aiIndustryChainSource = url
  script.addEventListener('load', () => resolve(), { once: true })
  script.addEventListener('error', () => {
    script.remove()
    reject(new Error(`无法加载 ${url}`))
  }, { once: true })
  document.head.appendChild(script)
})

const loadFirstAvailableScript = async (urls: string[]) => {
  let lastError: unknown = null
  for (const url of urls) {
    try {
      await loadScript(url)
      return
    } catch (error) {
      lastError = error
    }
  }
  const message = lastError instanceof Error
    ? `人工智能产业链数据加载失败：${lastError.message}`
    : '人工智能产业链数据加载失败'
  throw new Error(message)
}

export const loadAiIndustryChainData = (force = false): Promise<AiIndustryChainData> => {
  if (!force && window.__AI_INDUSTRY_CHAIN_DATA__) {
    return Promise.resolve(window.__AI_INDUSTRY_CHAIN_DATA__)
  }
  if (!force && loadingPromise) return loadingPromise

  if (force) {
    removeLoaderScripts()
    delete window.__AI_INDUSTRY_CHAIN_DATA__
  }

  loadingPromise = loadFirstAvailableScript(candidateUrls())
    .then(() => {
      const data = window.__AI_INDUSTRY_CHAIN_DATA__
      if (!data || data.version !== 1) {
        throw new Error('人工智能产业链数据版本不匹配')
      }
      return data
    })
    .finally(() => {
      loadingPromise = null
    })

  return loadingPromise
}
