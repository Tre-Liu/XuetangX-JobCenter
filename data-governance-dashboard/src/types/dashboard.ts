export interface DashboardSnapshot {
  schemaVersion: 1
  generatedAt: string
  workspaceRootLabel: string
  overallStatus: 'healthy' | 'partial' | 'stale' | 'error'
  assets: AssetMetric[]
  recruitmentPipeline: RecruitmentPipeline
  sources: SourceStatus[]
  warnings: string[]
}

export interface AssetMetric {
  id: 'chains' | 'stages' | 'majors' | 'industries' | 'positions' | 'recruitment'
  label: string
  primaryValue: number
  totalValue?: number
  coverageRate?: number
  status: 'validated' | 'partial' | 'review' | 'in_progress'
  definition: string
  grain: string
  sourceIds: string[]
  supportingMetrics: Array<{
    label: string
    value: number | string
  }>
}

export interface RecruitmentPipeline {
  inputRows: number
  validUniqueRows: number
  duplicateRows: number
  invalidRows: number
  formallyMatchedJobs: number
  mediumReviewJobs: number
  unmatchedRows: number
  formalRelationCount: number
  completedYears: number[]
}

export interface SourceStatus {
  id: string
  assetId: AssetMetric['id']
  relativePath: string
  selectedCandidate: boolean
  modifiedAt: string
  grain: string
  status: 'validated' | 'partial' | 'review' | 'in_progress' | 'missing'
  notes: string[]
}
