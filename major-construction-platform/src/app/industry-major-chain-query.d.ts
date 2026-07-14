import type {
  IndustryChainRecord,
  IndustryMajorChainDataset,
  IndustryMajorChainRelation,
  IndustryMajorRecord,
  IndustryMajorUiLevel,
} from './industry-major-chain-types'

export type IndustryMajorProfile = {
  major: IndustryMajorRecord
  relations: IndustryMajorChainRelation[]
  chains: IndustryChainRecord[]
}

export function buildIndustryMajorKey(sourceLevel: string, code: string): string
export function filterIndustryMajors(
  data: IndustryMajorChainDataset,
  uiLevel: IndustryMajorUiLevel,
  keyword?: string,
): IndustryMajorRecord[]
export function getIndustryMajorProfile(
  data: IndustryMajorChainDataset,
  sourceLevel: string,
  code: string,
): IndustryMajorProfile | null
