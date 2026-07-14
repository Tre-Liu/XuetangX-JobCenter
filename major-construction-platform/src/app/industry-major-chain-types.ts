export type IndustryMajorUiLevel = 'undergraduate' | 'vocational'
export type IndustryMajorMatchStatus = '已匹配' | '待人工研判' | '未匹配'

export type IndustryMajorRecord = {
  key: string
  uiLevel: IndustryMajorUiLevel
  sourceLevel: string
  code: string
  name: string
  category: string
  majorCategory: string
  matchStatus: IndustryMajorMatchStatus
  noMatchReason: string
}

export type IndustryChainStage = {
  stage: '上游' | '中游' | '下游'
  node: string
  sourceEvidence: string
  formationBasis: string
}

export type IndustryChainRecord = {
  id: string
  name: string
  stages: IndustryChainStage[]
}

export type IndustryMajorChainRelation = {
  majorKey: string
  order: number
  relationType: string
  chainId: string
  stage: '上游' | '中游' | '下游'
  node: string
  confidence: string
  score: number
  evidence: string
  description: string
}

export type IndustryMajorChainDataset = {
  stats: {
    majorCount: number
    undergraduateCount: number
    vocationalCount: number
    chainCount: number
    stageCount: number
    relationCount: number
  }
  majors: IndustryMajorRecord[]
  chains: IndustryChainRecord[]
  relations: IndustryMajorChainRelation[]
}
