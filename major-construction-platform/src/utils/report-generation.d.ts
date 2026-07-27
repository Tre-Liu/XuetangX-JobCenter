import type {
  ReportCreationMode,
  ReportForm,
  ReportKind,
  ReportTemplate,
  ReportTocItem,
  ResearchReportItem,
} from '../mock/research-report'

export interface ReportValidationError {
  field: keyof ReportForm
  message: string
}

export interface ReportTocEditorNode {
  id: string
  title: string
  children: ReportTocEditorNode[]
}

export interface ReportTocSource {
  reportKind: ReportKind
  creationMode: ReportCreationMode
  templateId: string
}

export interface ReportJobOption {
  id: string
  name: string
}

export interface ReportIndustryOption {
  code: string
  name: string
}

export interface ReportRegionValidationOption {
  id: string
  name: string
}

export interface ReportConfigurationState {
  form: ReportForm
  tocSource: ReportTocSource
  referenceFiles: File[]
  referenceFileCount: number
}

export interface ReportGenerationSnapshot {
  isNew: boolean
  previousReport: ResearchReportItem | null
  report: ResearchReportItem
  jobNames: string[]
}

export interface ReportGenerationController {
  invalidate(): number
  schedule(callback: (token: number) => void, delay: number): number
  isCurrent(token: number): boolean
}

export function normalizeReportForm(form: ReportForm): ReportForm

export function createReportTocSource(form: ReportForm): ReportTocSource

export function restoreReportTocSelection(
  form: ReportForm,
  source: ReportTocSource,
): ReportForm

export function isReportTemplateSelectionValid(
  form: ReportForm,
  templates: ReadonlyArray<Pick<ReportTemplate, 'id' | 'reportKind'>>,
): boolean

export function validateReportForm(
  form: ReportForm,
  options?: {
    industryOptions?: readonly ReportIndustryOption[]
    regionOptions?: readonly ReportRegionValidationOption[]
  },
): ReportValidationError | null

export function createReportConfigurationState(
  report: ResearchReportItem,
): ReportConfigurationState

export function resolveReportJobNames(
  jobIds: readonly string[],
  jobOptions: readonly ReportJobOption[],
): string[]

export function createReportAdsMetadata(
  report: ResearchReportItem,
  jobOptions: readonly ReportJobOption[],
): {
  reportTitle: string
  reportType: string
  industry: string
  region: string
  majorGroup: string
  reportKind: ReportKind
  major: string
  relatedIndustryCode: string
  relatedIndustry: string
  regionIds: string[]
  regionNames: string[]
  jobIds: string[]
  jobNames: string[]
  creationMode: ReportCreationMode
  templateId: string
  referenceFileCount: number
  date: string
}

export function createReportGenerationController(options?: {
  setTimer?: (callback: () => void, delay: number) => unknown
  clearTimer?: (timerId: unknown) => void
}): ReportGenerationController

export function createReportGenerationSnapshot(options: {
  rows: readonly ResearchReportItem[]
  activeReportId: number
  form: ReportForm
  toc: readonly ReportTocItem[]
  referenceFileCount: number
  generatedDate: string
  jobOptions?: readonly ReportJobOption[]
}): ReportGenerationSnapshot

export function applyReportGeneration(
  rows: readonly ResearchReportItem[],
  snapshot: ReportGenerationSnapshot,
): ResearchReportItem[]

export function rollbackReportGeneration(
  rows: readonly ResearchReportItem[],
  snapshot: ReportGenerationSnapshot,
): ResearchReportItem[]

export function removeReportTocNodeById<T extends ReportTocEditorNode>(
  rows: T[],
  targetId: string,
): T[]

export function createReportTocForMode(options: {
  creationMode: ReportCreationMode
  templateId: string
  templates: ReportTemplate[]
  createId: () => string
}): ReportTocEditorNode[]

export function findEmptyReportTocTitle(rows: ReportTocEditorNode[]): string | null

export function buildDynamicReportContent(options: {
  baseHtml: string
  form: ReportForm
  jobNames: string[]
  referenceFileCount: number
  generatedDate: string
}): string

export type { ReportTocItem }
