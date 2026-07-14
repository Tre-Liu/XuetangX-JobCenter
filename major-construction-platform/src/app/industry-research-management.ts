import type {
  IndustryChainRecord,
  IndustryMajorChainRelation,
} from './industry-major-chain-types'

export type IndustryResearchChainRecommendation = {
  id: string
  name: string
  stage: string
  node: string
  confidence: string
  score: number
  evidence: string
  description: string
}

export const buildIndustryResearchRecommendations = (
  relations: IndustryMajorChainRelation[],
  chains: IndustryChainRecord[],
): IndustryResearchChainRecommendation[] => relations.map((relation) => ({
  id: relation.chainId,
  name: chains.find((chain) => chain.id === relation.chainId)?.name ?? relation.chainId,
  stage: relation.stage,
  node: relation.node,
  confidence: relation.confidence,
  score: relation.score,
  evidence: relation.evidence,
  description: relation.description,
}))
