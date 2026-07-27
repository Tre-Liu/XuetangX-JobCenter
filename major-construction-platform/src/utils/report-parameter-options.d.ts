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
