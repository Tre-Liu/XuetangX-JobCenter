import type {
  ReportCreationMode,
  ReportForm,
  ReportTemplate,
  ReportTocItem,
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

export function validateReportForm(form: ReportForm): ReportValidationError | null

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
