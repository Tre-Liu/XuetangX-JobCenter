import type {
  ReportForm,
  ReportIndustryChainOption,
} from '../mock/research-report'

export interface StandardIndustryOption {
  code: string
  name: string
  level: 'section' | 'division' | 'group' | 'class'
  parentCode: string | null
}

export interface ReportRegionOption {
  id: string
  name: string
  type: 'city' | 'economic-zone'
  province?: string
}

export const REPORT_ECONOMIC_ZONE_OPTIONS: readonly ReportRegionOption[]

export function searchStandardIndustries(
  options?: readonly StandardIndustryOption[],
  keyword?: string,
  limit?: number,
): StandardIndustryOption[]

export function buildReportRegionOptions(
  geoData?: Record<string, {
    features?: Array<{ name: string; adcode: number }>
  }>,
): ReportRegionOption[]

export function searchReportRegions(
  options?: readonly ReportRegionOption[],
  keyword?: string,
  selectedIds?: readonly string[],
  limit?: number,
): ReportRegionOption[]

export function formatReportRegionNames(names?: readonly string[]): string

export function normalizeReportRegionSelection(
  form?: {
    regionIds?: readonly string[]
    regionNames?: readonly string[]
    region?: string
  },
  options?: readonly ReportRegionOption[],
): {
  regionIds: string[]
  regionNames: string[]
  region: string
}

export interface ReportJobOption {
  id: string
  name: string
}

export interface ReportScopeMutation {
  form: ReportForm
  error: string
}

export function normalizeReportOptionName(value?: unknown): string

export function searchReportIndustryChains(
  options?: readonly ReportIndustryChainOption[],
  major?: string,
  keyword?: string,
): ReportIndustryChainOption[]

export function getReportJobsForChain<T extends ReportJobOption>(
  chainId?: string,
  chainOptions?: readonly ReportIndustryChainOption[],
  jobOptions?: readonly T[],
): T[]

export function resetReportIndustryScope(form: ReportForm): ReportForm

export function selectReportIndustryChain(
  form: ReportForm,
  option: ReportIndustryChainOption,
): ReportForm

export function createCustomReportIndustryChain(
  form: ReportForm,
  input?: string,
  libraryOptions?: readonly ReportIndustryChainOption[],
): ReportScopeMutation

export function addCustomReportJob(
  form: ReportForm,
  input?: string,
  visibleJobOptions?: readonly ReportJobOption[],
): ReportScopeMutation

export function removeCustomReportJob(
  form: ReportForm,
  name: string,
): ReportForm

export function resolveReportJobNames(
  jobIds?: readonly string[],
  customJobNames?: readonly string[],
  jobOptions?: readonly ReportJobOption[],
): string[]
