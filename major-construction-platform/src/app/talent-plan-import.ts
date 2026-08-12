export const TALENT_IMPORT_MODULE_KEYS = [
  'goals',
  'requirements',
  'courses',
  'goalRequirementMatrix',
  'courseRequirementMatrix'
] as const

export type TalentImportModuleKey = (typeof TALENT_IMPORT_MODULE_KEYS)[number]
export type TalentImportStage = 'upload' | 'review'
export type TalentPlanModuleAvailability = Record<TalentImportModuleKey, boolean>

export const TALENT_IMPORT_MODULES: ReadonlyArray<{
  key: TalentImportModuleKey
  label: string
  countLabel: string
}> = [
  { key: 'goals', label: '培养目标', countLabel: '11' },
  { key: 'requirements', label: '毕业要求', countLabel: '8组 / 30项' },
  { key: 'courses', label: '课程管理', countLabel: '74' },
  { key: 'goalRequirementMatrix', label: '培养目标与毕业要求支撑矩阵', countLabel: '11 × 8' },
  { key: 'courseRequirementMatrix', label: '课程与毕业要求支撑矩阵', countLabel: '暂无数据' }
]

export interface TalentImportDialogState {
  stage: TalentImportStage
  fileName: string
  fileError: string
  activeModule: TalentImportModuleKey
  selectedModules: TalentImportModuleKey[]
}

const SUPPORTED_FILE_SUFFIXES = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])
const UNSUPPORTED_FILE_MESSAGE = '仅支持 pdf、doc、docx、jpg、jpeg、png 格式'

export const createEmptyTalentPlanModules = (): TalentPlanModuleAvailability => ({
  goals: false,
  requirements: false,
  courses: false,
  goalRequirementMatrix: false,
  courseRequirementMatrix: false
})

export const createFilledTalentPlanModules = (): TalentPlanModuleAvailability => ({
  goals: true,
  requirements: true,
  courses: true,
  goalRequirementMatrix: true,
  courseRequirementMatrix: false
})

export const createTalentImportDialogState = (): TalentImportDialogState => ({
  stage: 'upload',
  fileName: '',
  fileError: '',
  activeModule: 'goals',
  selectedModules: [...TALENT_IMPORT_MODULE_KEYS]
})

export const validateTalentImportFileName = (fileName: string): string => {
  const suffix = fileName.split('.').pop()?.toLowerCase()
  return suffix && SUPPORTED_FILE_SUFFIXES.has(suffix) ? '' : UNSUPPORTED_FILE_MESSAGE
}

export const selectTalentImportFile = (
  state: TalentImportDialogState,
  fileName: string
): TalentImportDialogState => {
  const fileError = validateTalentImportFileName(fileName)
  return { ...state, fileName: fileError ? '' : fileName, fileError }
}

export const beginTalentImportReview = (
  state: TalentImportDialogState
): TalentImportDialogState =>
  state.fileName && !state.fileError ? { ...state, stage: 'review' } : state

export const selectTalentImportPreview = (
  state: TalentImportDialogState,
  activeModule: TalentImportModuleKey
): TalentImportDialogState => ({ ...state, activeModule })

export const toggleTalentImportModule = (
  state: TalentImportDialogState,
  key: TalentImportModuleKey
): TalentImportDialogState => ({
  ...state,
  selectedModules: state.selectedModules.includes(key)
    ? state.selectedModules.filter((item) => item !== key)
    : TALENT_IMPORT_MODULE_KEYS.filter((item) => item === key || state.selectedModules.includes(item))
})

export const resetTalentImportDialog = (
  _state?: TalentImportDialogState
): TalentImportDialogState => createTalentImportDialogState()

export const applyTalentImportSelection = (
  selectedModules: readonly TalentImportModuleKey[]
): TalentPlanModuleAvailability =>
  Object.fromEntries(
    TALENT_IMPORT_MODULE_KEYS.map((key) => [key, selectedModules.includes(key)])
  ) as TalentPlanModuleAvailability

export const hasTalentPlanModule = (
  talentPlanCreated: boolean,
  modules: TalentPlanModuleAvailability,
  key: TalentImportModuleKey
): boolean => talentPlanCreated && modules[key]
