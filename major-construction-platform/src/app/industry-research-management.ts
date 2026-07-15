import type {
  IndustryChainRecord,
  IndustryMajorChainRelation,
} from './industry-major-chain-types'

export type IndustryResearchChainRecommendation = {
  id: string
  name: string
  stage: string
  node: string
  jobCount: number
  enterpriseCount: number
  confidence: string
  score: number
  evidence: string
  description: string
}

type IndustryResearchDemoKpis = {
  jobCount: number
  enterpriseCount: number
}

const industryResearchDemoKpisByChainId: Record<string, IndustryResearchDemoKpis> = {
  'chain-75155ff272': { jobCount: 128, enterpriseCount: 37626 },
}

const stableIndustryResearchSeed = (value: string) =>
  Array.from(value).reduce(
    (seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0,
    0,
  )

export const getIndustryResearchDemoKpis = (chainId: string): IndustryResearchDemoKpis => {
  const configured = industryResearchDemoKpisByChainId[chainId]
  if (configured) return configured

  const seed = stableIndustryResearchSeed(chainId)
  return {
    jobCount: 48 + (seed % 121),
    enterpriseCount: 1200 + (seed % 48000),
  }
}

export const buildIndustryResearchRecommendations = (
  relations: IndustryMajorChainRelation[],
  chains: IndustryChainRecord[],
): IndustryResearchChainRecommendation[] => relations.map((relation) => ({
  id: relation.chainId,
  name: chains.find((chain) => chain.id === relation.chainId)?.name ?? relation.chainId,
  stage: relation.stage,
  node: relation.node,
  ...getIndustryResearchDemoKpis(relation.chainId),
  confidence: relation.confidence,
  score: relation.score,
  evidence: relation.evidence,
  description: relation.description,
}))
